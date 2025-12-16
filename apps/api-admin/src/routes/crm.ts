/**
 * CRM Routes - Lead Generation & Management
 */
import { Router, Request, Response, NextFunction } from 'express';
import LeadSalon from '../models/LeadSalon';
import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import LeadEmail from '../models/LeadEmail';
import LeadEmailTemplate from '../models/LeadEmailTemplate';
import LeadInteraction from '../models/LeadInteraction';
import LemlistService from '../services/lemlist-service';
import CrmEmailService from '../services/email-service';
import ScrapingServiceInstance, { ScrapingService } from '../services/scraping-service';
import SalonDiscoveryService from '../services/salon-discovery-service';
import LeadEnrichmentService from '../services/lead-enrichment-service';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes except webhook
router.use((req: Request, res: Response, next: NextFunction) => {
  // Allow webhook without auth
  if (req.path === '/emails/webhook' || req.path === '/migrate-to-pool' || req.path === '/enrich-existing-leads' || req.path === '/leads/sial' || req.path === '/enrich-pool') {
    return next();
  }
  return authenticateAdmin(req as AuthRequest, res, next);
});

// ==================== DASHBOARD ====================

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCompanies,
      totalContacts,
      companiesThisWeek,
      contactsThisWeek,
      emailsSent,
      emailsOpened,
      companiesByStatus,
      companiesByCountry,
      recentInteractions
    ] = await Promise.all([
      LeadCompany.countDocuments(),
      LeadContact.countDocuments(),
      LeadCompany.countDocuments({ createdAt: { $gte: weekAgo } }),
      LeadContact.countDocuments({ createdAt: { $gte: weekAgo } }),
      LeadEmail.countDocuments({ dateEnvoi: { $gte: monthAgo } }),
      LeadEmail.countDocuments({ dateEnvoi: { $gte: monthAgo }, statutEnvoi: 'OPENED' }),
      LeadCompany.aggregate([
        { $group: { _id: '$statutProspection', count: { $sum: 1 } } }
      ]),
      LeadCompany.aggregate([
        { $group: { _id: '$adresse.pays', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      LeadInteraction.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('entrepriseId', 'raisonSociale')
        .populate('contactId', 'prenom nom')
    ]);

    const openRate = emailsSent > 0 ? ((emailsOpened / emailsSent) * 100).toFixed(1) : 0;

    res.json({
      stats: {
        totalCompanies,
        totalContacts,
        companiesThisWeek,
        contactsThisWeek,
        emailsSent,
        emailsOpened,
        openRate: `${openRate}%`
      },
      companiesByStatus,
      companiesByCountry,
      recentInteractions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MIGRATION - Temporaire pour ajouter tous les leads au pool ====================
router.post('/migrate-to-pool', async (_req: Request, res: Response) => {
  try {
    // Mettre tous les leads qui ne sont pas dans le pool
    const result = await LeadCompany.updateMany(
      { inPool: { $ne: true }, commercialAssigneId: { $exists: false } },
      { $set: { inPool: true, dateAddedToPool: new Date(), prioritePool: 3 } }
    );
    res.json({ success: true, modified: result.modifiedCount, matched: result.matchedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Route pour enrichir les leads existants avec adresses, tel, email depuis leurs pages exposant
router.post('/enrich-existing-leads', async (_req: Request, res: Response) => {
  try {
    const leadsToEnrich = await LeadCompany.find({
      urlPageExposant: { $exists: true, $ne: null },
      $or: [
        { 'adresse.ligne1': { $exists: false } },
        { 'adresse.ligne1': null },
        { telephone: { $exists: false } },
        { emailGenerique: { $exists: false } }
      ]
    }).limit(50);

    if (leadsToEnrich.length === 0) {
      return res.json({ success: true, message: 'Aucun lead a enrichir', enriched: 0 });
    }

    console.log('[CRM] Enriching ' + leadsToEnrich.length + ' existing leads...');

    const browser = await ScrapingServiceInstance.initBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    let enrichedCount = 0;

    for (const lead of leadsToEnrich) {
      try {
        await page.goto(lead.urlPageExposant!, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 2000));

        const details = await page.evaluate(() => {
          const result: any = {};
          // Adresse
          const addrEl = document.querySelector('[class*="address"], [class*="adresse"], .contact-info');
          if (addrEl?.textContent) {
            const lines = addrEl.textContent.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l);
            for (const line of lines) {
              const cpMatch = line.match(/(\d{5})\s+(.+)/);
              if (cpMatch) { result.codePostal = cpMatch[1]; result.ville = cpMatch[2]; }
              else if (!result.rue && line.length > 5 && line.length < 100) result.rue = line;
            }
          }
          // Tel
          const telEl = document.querySelector('a[href^="tel:"]');
          if (telEl) result.telephone = telEl.getAttribute('href')?.replace('tel:', '');
          // Email
          const emailEl = document.querySelector('a[href^="mailto:"]');
          if (emailEl) result.email = emailEl.getAttribute('href')?.replace('mailto:', '');
          // Produits
          const produits: string[] = [];
          document.querySelectorAll('[class*="product"], [class*="category"]').forEach((el: Element) => {
            const t = el.textContent?.trim();
            if (t && t.length > 2 && t.length < 100) produits.push(t);
          });
          if (produits.length > 0) result.produits = produits.slice(0, 10);
          return result;
        });

        const updateData: any = {};
        if (details.rue) updateData['adresse.ligne1'] = details.rue;
        if (details.codePostal) updateData['adresse.codePostal'] = details.codePostal;
        if (details.ville) updateData['adresse.ville'] = details.ville;
        if (details.telephone) updateData.telephone = details.telephone;
        if (details.email) updateData.emailGenerique = details.email;
        if (details.produits) updateData.produits = details.produits;

        if (Object.keys(updateData).length > 0) {
          await LeadCompany.findByIdAndUpdate(lead._id, { $set: updateData });
          enrichedCount++;
        }
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        console.error('[CRM] Error enriching:', e.message);
      }
    }

    await page.close();
    res.json({ success: true, total: leadsToEnrich.length, enriched: enrichedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Route pour supprimer tous les leads d'un salon (pour re-scraper)
router.delete('/leads/by-salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const result = await LeadCompany.deleteMany({ salonSourceId: salonId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer tous les leads SIAL
router.delete('/leads/sial', async (req: Request, res: Response) => {
  try {
    // Trouver les salons SIAL
    const sialSalons = await LeadSalon.find({ nom: /SIAL/i });
    const salonIds = sialSalons.map(s => s._id);
    const result = await LeadCompany.deleteMany({ salonSourceId: { $in: salonIds } });
    res.json({ success: true, deleted: result.deletedCount, salons: sialSalons.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger SIAL scraping (public route for testing)
router.post('/leads/sial', async (req: Request, res: Response) => {
  try {
    // Find SIAL salon
    const salon = await LeadSalon.findOne({ nom: /SIAL/i, urlListeExposants: { $exists: true, $ne: '' } });
    if (!salon) return res.status(404).json({ error: 'No SIAL salon found with exhibitor URL' });

    // Update status
    salon.statutScraping = 'EN_COURS';
    salon.derniereExecution = new Date();
    await salon.save();

    // Start scraping with SIAL adapter
    const result = await ScrapingServiceInstance.scrapeUrl(salon.urlListeExposants!, 'SIAL', {
      maxPages: 50,
      delay: 2000
    });

    if (result.success && result.companies.length > 0) {
      let created = 0;
      let duplicates = 0;

      for (const company of result.companies) {
        try {
          const escapedName = company.raisonSociale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const existingCompany = await LeadCompany.findOne({
            $or: [
              { raisonSociale: { $regex: `^${escapedName}$`, $options: 'i' } },
              ...(company.siteWeb ? [{ siteWeb: { $regex: company.siteWeb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] : [])
            ]
          });

          if (existingCompany) {
            duplicates++;
            continue;
          }

          const paysValue = company.pays || ScrapingService.guessCountry(company.raisonSociale + ' ' + (company.ville || '')) || 'France';
          await LeadCompany.create({
            raisonSociale: company.raisonSociale,
            siteWeb: company.siteWeb,
            adresse: {
              ligne1: company.rue,
              ville: company.ville,
              codePostal: company.codePostal,
              pays: paysValue
            },
            produits: company.produits,
            telephone: company.telephone,
            emailGenerique: company.email,
            secteurActivite: company.secteurActivite || 'Agroalimentaire',
            descriptionActivite: company.descriptionActivite,
            salonSourceId: salon._id,
            urlPageExposant: company.urlPageExposant,
            numeroStand: company.numeroStand,
            statutProspection: 'NEW',
            inPool: true,
            dateAddedToPool: new Date(),
            prioritePool: 3
          });
          created++;
        } catch (companyError: any) {
          console.error(`[SIAL] Error creating company ${company.raisonSociale}:`, companyError.message);
        }
      }

      salon.statutScraping = 'TERMINE';
      salon.nbExposantsCollectes = (salon.nbExposantsCollectes || 0) + created;
      await salon.save();

      res.json({
        success: true,
        salon: salon.nom,
        created,
        duplicates,
        scraped: result.totalScraped,
        duration: result.duration
      });
    } else {
      salon.statutScraping = 'ERREUR';
      await salon.save();
      res.json({
        success: false,
        error: result.errors.join(', '),
        scraped: result.totalScraped
      });
    }
  } catch (error: any) {
    console.error('[SIAL Scrape Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// Enrichissement par vagues de 50 entreprises
// Appeler plusieurs fois jusqu'a completion
router.post('/enrich-pool', async (req: Request, res: Response) => {
  const BATCH_SIZE = 50;

  try {
    // Trouver les entreprises qui ont une URL mais pas d'adresse enrichie
    const companiesNeedingEnrichment = await LeadCompany.find({
      inPool: true,
      urlPageExposant: { $exists: true, $ne: '' },
      $or: [
        { 'adresse.ville': { $exists: false } },
        { 'adresse.ville': '' },
        { 'adresse.ville': null }
      ]
    }).limit(BATCH_SIZE);

    if (companiesNeedingEnrichment.length === 0) {
      // Compter le total pour le rapport
      const totalInPool = await LeadCompany.countDocuments({ inPool: true });
      const totalWithAddress = await LeadCompany.countDocuments({
        inPool: true,
        'adresse.ville': { $exists: true, $ne: '' }
      });
      return res.json({
        success: true,
        message: 'Toutes les entreprises sont enrichies!',
        enriched: 0,
        totalInPool,
        totalWithAddress,
        remaining: 0,
        progress: '100%'
      });
    }

    // Lancer Puppeteer pour l'enrichissement (utiliser Chrome systeme sur EB)
    const puppeteer = await import('puppeteer');
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    };
    // Use system Chrome on Linux (Elastic Beanstalk)
    if (process.platform === 'linux') {
      launchOptions.executablePath = '/usr/bin/google-chrome-stable';
    }
    const browser = await puppeteer.default.launch(launchOptions);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    let enrichedCount = 0;
    const errors: string[] = [];

    for (const company of companiesNeedingEnrichment) {
      try {
        console.log(`[Enrich Pool] ${enrichedCount + 1}/${companiesNeedingEnrichment.length}: ${company.raisonSociale}`);
        await page.goto(company.urlPageExposant!, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const details = await page.evaluate(() => {
          const result: any = {};
          const contentText = document.body.innerText;

          // Methode 1: Code postal francais (5 chiffres) + Ville
          const cpVilleMatch = contentText.match(/(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+?)(?:\s*[,\n]|$)/);
          if (cpVilleMatch) {
            result.codePostal = cpVilleMatch[1];
            result.ville = cpVilleMatch[2].trim();
          }

          // Methode 2: Chercher "City:" ou "Ville:" explicite
          if (!result.ville) {
            const cityMatch = contentText.match(/(?:City|Ville|Ciudad|Stadt)[:\s]+([A-Za-zÀ-ÿ\s-]+?)(?:[,\n]|$)/i);
            if (cityMatch) result.ville = cityMatch[1].trim();
          }

          // Methode 3: Chercher ville apres pays (format: Pays - Ville)
          if (!result.ville) {
            const paysVilleMatch = contentText.match(/(?:France|Germany|Turkey|Vietnam|China|USA|UAE|Lithuania|Belgium|Italy|Spain|UK|Netherlands)\s*[-,]\s*([A-Za-zÀ-ÿ\s-]+?)(?:[,\n]|$)/i);
            if (paysVilleMatch) result.ville = paysVilleMatch[1].trim();
          }

          // Methode 4: Chercher n'importe quel format "Localisation: ..."
          if (!result.ville) {
            const locMatch = contentText.match(/(?:Location|Localisation|Address|Adresse)[:\s]+([^\n]{5,50})/i);
            if (locMatch) {
              result.ville = locMatch[1].trim().split(',')[0].trim();
            }
          }

          // Pays - liste etendue incluant pays internationaux
          const paysPatterns = [
            'France', 'Germany', 'Allemagne', 'Italy', 'Italie', 'Spain', 'Espagne',
            'Belgium', 'Belgique', 'Vietnam', 'China', 'Chine', 'USA', 'United States',
            'Turkey', 'Turquie', 'Lithuania', 'Lituanie', 'United Arab Emirates', 'UAE',
            'Abu Dhabi', 'Netherlands', 'Pays-Bas', 'United Kingdom', 'UK', 'Royaume-Uni',
            'Poland', 'Pologne', 'Portugal', 'Greece', 'Grèce', 'Japan', 'Japon',
            'South Korea', 'Corée', 'Thailand', 'Thaïlande', 'Indonesia', 'Indonésie',
            'Brazil', 'Brésil', 'Argentina', 'Argentine', 'Mexico', 'Mexique'
          ];
          for (const pays of paysPatterns) {
            if (contentText.includes(pays)) {
              result.pays = pays;
              break;
            }
          }

          // Telephone
          const telLink = document.querySelector('a[href^="tel:"]');
          if (telLink) {
            result.telephone = telLink.getAttribute('href')?.replace('tel:', '').replace(/[\s.-]/g, '');
          }

          // Email
          const emailLink = document.querySelector('a[href^="mailto:"]');
          if (emailLink) {
            result.email = emailLink.getAttribute('href')?.replace('mailto:', '').split('?')[0];
          }

          // Site web
          const webLinks = Array.from(document.querySelectorAll('a[href^="http"]'));
          for (const link of webLinks) {
            const href = (link as HTMLAnchorElement).href;
            if (href && !href.includes('sial') && !href.includes('comexposium') && !href.includes('linkedin') && !href.includes('facebook')) {
              result.siteWeb = href;
              break;
            }
          }

          return result;
        });

        // Mettre a jour en base
        const updateData: any = {};
        if (details.ville) updateData['adresse.ville'] = details.ville;
        if (details.codePostal) updateData['adresse.codePostal'] = details.codePostal;
        if (details.pays) updateData['adresse.pays'] = details.pays;
        if (details.telephone && !company.telephone) updateData.telephone = details.telephone;
        if (details.email && !company.emailGenerique) updateData.emailGenerique = details.email;
        if (details.siteWeb && !company.siteWeb) updateData.siteWeb = details.siteWeb;

        if (Object.keys(updateData).length > 0) {
          await LeadCompany.findByIdAndUpdate(company._id, { $set: updateData });
          enrichedCount++;
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        errors.push(`${company.raisonSociale}: ${(e as Error).message}`);
      }
    }

    await browser.close();

    // Stats finales
    const totalNeedingEnrichment = await LeadCompany.countDocuments({
      inPool: true,
      urlPageExposant: { $exists: true, $ne: '' },
      $or: [
        { 'adresse.ville': { $exists: false } },
        { 'adresse.ville': '' }
      ]
    });
    const totalInPool = await LeadCompany.countDocuments({ inPool: true });
    const totalWithAddress = await LeadCompany.countDocuments({
      inPool: true,
      'adresse.ville': { $exists: true, $ne: '' }
    });

    res.json({
      success: true,
      enriched: enrichedCount,
      batch: companiesNeedingEnrichment.length,
      remaining: totalNeedingEnrichment,
      totalInPool,
      totalWithAddress,
      progress: `${Math.round((totalWithAddress / totalInPool) * 100)}%`,
      errors: errors.slice(0, 5),
      message: totalNeedingEnrichment > 0
        ? `Vague terminee! ${totalNeedingEnrichment} entreprises restantes. Relancez dans 2 minutes.`
        : 'Toutes les entreprises sont enrichies!'
    });

  } catch (error: any) {
    console.error('[Enrich Pool Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALONS ====================

router.get('/salons', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, pays, search } = req.query;
    const filter: any = {};

    if (status) filter.statutScraping = status;
    if (pays) filter.pays = pays;
    if (search) filter.nom = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [salons, total] = await Promise.all([
      LeadSalon.find(filter).sort({ dateDebut: -1 }).skip(skip).limit(Number(limit)),
      LeadSalon.countDocuments(filter)
    ]);

    res.json({ success: true, salons, data: salons, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/salons', async (req: Request, res: Response) => {
  try {
    console.log('[CRM] Creating salon:', JSON.stringify(req.body));
    // Map frontend field names to model field names
    const salonData = {
      nom: req.body.nom,
      edition: req.body.edition,
      pays: req.body.pays,
      lieu: req.body.lieu,
      ville: req.body.ville,
      urlSalon: req.body.url || req.body.urlSalon,
      urlListeExposants: req.body.urlListeExposants,
      dateDebut: req.body.dateDebut || undefined,
      dateFin: req.body.dateFin || undefined,
      adaptateurConfig: req.body.adaptateur ? { type: req.body.adaptateur } : req.body.adaptateurConfig,
      categorie: req.body.categorie,
      sourceDecouverte: req.body.sourceDecouverte
    };
    const salon = new LeadSalon(salonData);
    await salon.save();
    res.status(201).json({ success: true, salon });
  } catch (error: any) {
    console.error('[CRM] Salon creation error:', error);
    const errorMessage = error.message || (error.errors ? Object.values(error.errors).map((e: any) => e.message).join(', ') : 'Erreur inconnue');
    res.status(400).json({ success: false, error: errorMessage });
  }
});

router.get('/salons/:id', async (req: Request, res: Response) => {
  try {
    const salon = await LeadSalon.findById(req.params.id);
    if (!salon) return res.status(404).json({ error: 'Salon not found' });
    res.json(salon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/salons/:id', async (req: Request, res: Response) => {
  try {
    const salon = await LeadSalon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!salon) return res.status(404).json({ error: 'Salon not found' });
    res.json(salon);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lancer le scraping d'un salon
router.post('/salons/:id/scrape', async (req: Request, res: Response) => {
  try {
    const salon = await LeadSalon.findById(req.params.id);
    if (!salon) return res.status(404).json({ error: 'Salon not found' });

    if (!salon.urlListeExposants) {
      return res.status(400).json({ error: 'URL des exposants non configuree pour ce salon' });
    }

    // Mettre a jour le statut
    salon.statutScraping = 'EN_COURS';
    salon.derniereExecution = new Date();
    await salon.save();

    // Determiner l'adaptateur
    const adaptateurConfig = salon.adaptateurConfig as any || {};
    const adapterName = adaptateurConfig.type || 'Generic';
    const config = {
      maxPages: adaptateurConfig.maxPages || 10,
      delay: adaptateurConfig.delay || 2000
    };

    // Lancer le scraping
    const result = await ScrapingServiceInstance.scrapeUrl(salon.urlListeExposants, adapterName, config);

    if (result.success && result.companies.length > 0) {
      // Creer les entreprises
      let created = 0;
      let duplicates = 0;

      for (const company of result.companies) {
        try {
          // Escape special regex characters in company name
          const escapedName = company.raisonSociale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // Verifier si l'entreprise existe deja (par nom ou site web)
          const existingCompany = await LeadCompany.findOne({
            $or: [
              { raisonSociale: { $regex: `^${escapedName}$`, $options: 'i' } },
              ...(company.siteWeb ? [{ siteWeb: { $regex: company.siteWeb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] : [])
            ]
          });

          if (existingCompany) {
            duplicates++;
            continue;
          }

          // Creer la nouvelle entreprise
          const paysValue = company.pays || ScrapingService.guessCountry(company.raisonSociale + ' ' + (company.ville || '')) || 'France';
          await LeadCompany.create({
            raisonSociale: company.raisonSociale,
            siteWeb: company.siteWeb,
            adresse: {
              ligne1: company.rue,
              ville: company.ville,
              codePostal: company.codePostal,
              pays: paysValue
            },
            produits: company.produits,
            telephone: company.telephone,
            emailGenerique: company.email,
            secteurActivite: company.secteurActivite || 'Agroalimentaire',
            descriptionActivite: company.descriptionActivite,
            salonSourceId: salon._id,
            urlPageExposant: company.urlPageExposant,
            numeroStand: company.numeroStand,
            statutProspection: 'NEW',
            // Automatiquement ajouter au pool de leads
            inPool: true,
            dateAddedToPool: new Date(),
            prioritePool: 3  // Priorite moyenne par defaut
          });
          created++;
        } catch (companyError: any) {
          console.error(`[CRM] Error creating company ${company.raisonSociale}:`, companyError.message);
          // Continue with next company instead of failing entire scraping
        }
      }

      // Mettre a jour le salon
      salon.statutScraping = 'TERMINE';
      salon.nbExposantsCollectes = (salon.nbExposantsCollectes || 0) + created;
      await salon.save();

      // Log scraping result (logged in salon model, no need for separate interaction)
      console.log(`[CRM] Scraping ${salon.nom}: ${created} nouvelles entreprises, ${duplicates} doublons, duree: ${result.duration}ms`);

      // AUTO-ENRICHISSEMENT: Lancer l'enrichissement en arriere-plan
      let enrichmentStatus = { enrichmentStarted: false, message: '' };
      if (created > 0) {
        try {
          enrichmentStatus = await LeadEnrichmentService.postScrapingEnrichment(salon._id.toString(), Math.min(created, 30));
          console.log(`[CRM] Post-scraping enrichment: ${enrichmentStatus.message}`);
        } catch (e) {
          console.error('[CRM] Post-scraping enrichment error:', e);
        }

        // AUTO-POOL: Ajouter au pool les entreprises avec site web
        try {
          const poolResult = await LeadCompany.updateMany(
            {
              salonSourceId: salon._id,
              siteWeb: { $exists: true, $ne: '' },
              inPool: { $ne: true },
              commercialAssigneId: { $exists: false }
            },
            {
              $set: {
                inPool: true,
                dateAddedToPool: new Date(),
                prioritePool: 3
              }
            }
          );
          console.log(`[CRM] Added ${poolResult.modifiedCount} companies to pool`);
        } catch (e) {
          console.error('[CRM] Auto-pool error:', e);
        }
      }

      res.json({
        success: true,
        totalScraped: result.totalScraped,
        companiesCreated: created,
        duplicatesSkipped: duplicates,
        duration: result.duration,
        enrichment: enrichmentStatus
      });
    } else {
      salon.statutScraping = 'ERREUR';
      await salon.save();

      res.status(400).json({
        success: false,
        error: result.errors.join(', ') || 'Aucune entreprise trouvee',
        duration: result.duration
      });
    }

  } catch (error: any) {
    // Mettre a jour le statut en cas d'erreur
    try {
      await LeadSalon.findByIdAndUpdate(req.params.id, { statutScraping: 'ERREUR' });
    } catch {}

    res.status(500).json({ error: error.message });
  }
});

// Obtenir les adaptateurs disponibles
router.get('/scraping/adapters', async (req: Request, res: Response) => {
  try {
    const adapters = ScrapingServiceInstance.getAvailableAdapters();
    res.json({
      adapters: adapters.map(name => ({
        name,
        description: getAdapterDescription(name)
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test de scraping (sans sauvegarde)
router.post('/scraping/test', async (req: Request, res: Response) => {
  try {
    const { url, adapter = 'Generic', maxPages = 3 } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    const result = await ScrapingServiceInstance.scrapeUrl(url, adapter, { maxPages });

    res.json({
      success: result.success,
      companies: result.companies.slice(0, 10), // Apercu des 10 premiers
      totalScraped: result.totalScraped,
      errors: result.errors,
      duration: result.duration
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function getAdapterDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'SITL': 'Salon International du Transport et de la Logistique (Paris)',
    'TransportLogistic': 'Transport Logistic Munich',
    'Generic': 'Adaptateur generique pour sites avec liste d\'exposants standard'
  };
  return descriptions[name] || 'Adaptateur personnalise';
}

// ==================== COMPANIES ====================

router.get('/companies', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, pays, secteur, search, commercialId, salonId } = req.query;
    const filter: any = {};

    if (status) filter.statutProspection = status;
    if (pays) filter['adresse.pays'] = pays;
    if (secteur) filter.secteurActivite = secteur;
    if (commercialId) filter.commercialAssigneId = commercialId;
    if (salonId) filter.salonSourceId = salonId;
    if (search) {
      filter.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { siteWeb: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      LeadCompany.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('salonSourceId', 'nom')
        .populate('commercialAssigneId', 'firstName lastName'),
      LeadCompany.countDocuments(filter)
    ]);

    res.json({ data: companies, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/companies', async (req: Request, res: Response) => {
  try {
    const company = new LeadCompany(req.body);
    await company.save();

    // Créer interaction
    await LeadInteraction.create({
      entrepriseId: company._id,
      typeInteraction: 'CREATION',
      description: 'Entreprise créée',
      createdBy: 'system'
    });

    res.status(201).json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await LeadCompany.findById(req.params.id)
      .populate('salonSourceId', 'nom')
      .populate('commercialAssigneId', 'firstName lastName email');

    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Récupérer contacts et interactions
    const [contacts, interactions, emails] = await Promise.all([
      LeadContact.find({ entrepriseId: company._id }).sort({ estContactPrincipal: -1 }),
      LeadInteraction.find({ entrepriseId: company._id }).sort({ createdAt: -1 }).limit(50),
      LeadEmail.find({ entrepriseId: company._id }).sort({ dateEnvoi: -1 }).limit(20)
    ]);

    res.json({ company, contacts, interactions, emails });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/companies/:id', async (req: Request, res: Response) => {
  try {
    const oldCompany = await LeadCompany.findById(req.params.id);
    const company = await LeadCompany.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Log changement de statut
    if (oldCompany && oldCompany.statutProspection !== company.statutProspection) {
      await LeadInteraction.create({
        entrepriseId: company._id,
        typeInteraction: 'CHANGEMENT_STATUT',
        description: `Statut: ${oldCompany.statutProspection} → ${company.statutProspection}`,
        createdBy: 'admin'
      });
    }

    res.json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Enrichir une entreprise (methodes gratuites + Lemlist optionnel)
router.post('/companies/:id/enrich', async (req: Request, res: Response) => {
  try {
    const company = await LeadCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const fieldsEnriched: string[] = [];
    let source = 'none';

    // 1. D'abord essayer SIRENE pour les entreprises francaises
    if (!company.adresse?.pays || ['France', 'FR', 'Italia', 'IT', 'Italy'].includes(company.adresse?.pays || '')) {
      try {
        const searchQuery = encodeURIComponent(company.raisonSociale);
        const sireneResponse = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${searchQuery}&per_page=1`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (sireneResponse.ok) {
          const data = await sireneResponse.json();
          if (data.results && data.results.length > 0) {
            const entreprise = data.results[0];
            const siege = entreprise.siege;

            if (siege?.siret && !company.siret) {
              company.siret = siege.siret;
              fieldsEnriched.push('siret');
            }
            if (siege?.adresse && !company.adresse?.ligne1) {
              if (!company.adresse) company.adresse = { pays: 'France' };
              company.adresse.ligne1 = siege.adresse;
              fieldsEnriched.push('adresse');
            }
            if (siege?.code_postal && !company.adresse?.codePostal) {
              if (!company.adresse) company.adresse = { pays: 'France' };
              company.adresse.codePostal = siege.code_postal;
              fieldsEnriched.push('codePostal');
            }
            if (siege?.libelle_commune && !company.adresse?.ville) {
              if (!company.adresse) company.adresse = { pays: 'France' };
              company.adresse.ville = siege.libelle_commune;
              fieldsEnriched.push('ville');
            }
            if (entreprise.activite_principale && !company.secteurActivite) {
              company.secteurActivite = entreprise.activite_principale;
              fieldsEnriched.push('secteurActivite');
            }

            if (fieldsEnriched.length > 0) {
              source = 'sirene';
              await company.save();
            }
          }
        }
      } catch (e) {
        console.log('[Enrich] SIRENE error:', e);
      }
    }

    // 2. Si site web disponible, scraper pour plus d'infos
    if (company.siteWeb) {
      try {
        const puppeteer = await import('puppeteer');
        const launchOptions: any = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };
        if (process.platform === 'linux') {
          launchOptions.executablePath = '/usr/bin/google-chrome-stable';
        }

        const browser = await puppeteer.default.launch(launchOptions);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        const baseUrl = company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`;
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Extraire infos de la page
        const data = await page.evaluate(() => {
          const result: any = {};
          const text = document.body.innerText;
          const html = document.body.innerHTML;

          // Email
          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch && !emailMatch[0].includes('example') && !emailMatch[0].includes('sentry')) {
            result.email = emailMatch[0];
          }

          // Telephone
          const telPatterns = [
            /(?:Tel|Phone|Telephone|T)[.:\s]*(\+?[\d\s.-]{10,20})/i,
            /(\+33[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/,
            /(\+39[\s.-]?\d{2,3}[\s.-]?\d{6,7})/,
            /(0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/
          ];
          for (const pattern of telPatterns) {
            const match = text.match(pattern);
            if (match) {
              result.telephone = match[1].replace(/[\s.-]/g, '');
              break;
            }
          }

          // Adresse
          const adresseMatch = text.match(/(\d{1,3}[,\s]+(?:rue|avenue|boulevard|place|via|viale|piazza|corso)[^,\n]{5,50})/i);
          if (adresseMatch) result.adresse = adresseMatch[1].trim();

          const cpVilleMatch = text.match(/(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+?)(?:\s*[,\n]|$)/);
          if (cpVilleMatch) {
            result.codePostal = cpVilleMatch[1];
            result.ville = cpVilleMatch[2].trim();
          }

          // LinkedIn
          const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i);
          if (linkedinMatch) result.linkedin = linkedinMatch[1];

          return result;
        });

        await browser.close();

        // Mettre a jour
        if (data.email && !company.emailGenerique) {
          company.emailGenerique = data.email;
          fieldsEnriched.push('email');
        }
        if (data.telephone && !company.telephone) {
          company.telephone = data.telephone;
          fieldsEnriched.push('telephone');
        }
        if (data.adresse && !company.adresse?.ligne1) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.ligne1 = data.adresse;
          fieldsEnriched.push('adresse');
        }
        if (data.ville && !company.adresse?.ville) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.ville = data.ville;
          fieldsEnriched.push('ville');
        }
        if (data.codePostal && !company.adresse?.codePostal) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.codePostal = data.codePostal;
          fieldsEnriched.push('codePostal');
        }
        if (data.linkedin && !company.linkedinCompanyUrl) {
          company.linkedinCompanyUrl = data.linkedin;
          fieldsEnriched.push('linkedin');
        }

        if (fieldsEnriched.length > 0) {
          source = source === 'sirene' ? 'sirene+website' : 'website';
          await company.save();
        }
      } catch (e) {
        console.log('[Enrich] Website scraping error:', e);
      }
    }

    // 3. Optionnel: Lemlist pour les contacts (si domaine disponible)
    let contactsCreated = 0;
    if (company.siteWeb) {
      try {
        let domain: string;
        try {
          domain = new URL(company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`).hostname.replace('www.', '');
        } catch {
          domain = company.siteWeb.replace('www.', '').split('/')[0];
        }

        const { company: enrichedCompany, contacts } = await LemlistService.enrichCompany(domain);

        if (enrichedCompany) {
          company.lemlistData = enrichedCompany as any;
          company.dateEnrichissement = new Date();
          if (enrichedCompany.linkedinUrl && !company.linkedinCompanyUrl) {
            company.linkedinCompanyUrl = enrichedCompany.linkedinUrl;
            fieldsEnriched.push('linkedin');
          }
          await company.save();
        }

        for (const lemlistContact of contacts) {
          if (!lemlistContact.email) continue;
          const existingContact = await LeadContact.findOne({
            entrepriseId: company._id,
            email: lemlistContact.email.toLowerCase()
          });
          if (!existingContact) {
            await LeadContact.create({
              entrepriseId: company._id,
              prenom: lemlistContact.firstName,
              nom: lemlistContact.lastName,
              poste: lemlistContact.position,
              email: lemlistContact.email.toLowerCase(),
              emailStatus: LemlistService.mapEmailStatus(lemlistContact.enrichmentStatus),
              linkedinUrl: lemlistContact.linkedinUrl,
              telephoneDirect: lemlistContact.phone,
              seniority: LemlistService.mapSeniority(lemlistContact.position),
              sourceEnrichissement: 'LEMLIST',
              dateEnrichissement: new Date()
            });
            contactsCreated++;
          }
        }
      } catch (e) {
        console.log('[Enrich] Lemlist error:', e);
      }
    }

    // Mettre a jour le statut
    if (fieldsEnriched.length > 0) {
      company.statutProspection = 'ENRICHED';
      await company.save();
    }

    // Log interaction
    await LeadInteraction.create({
      entrepriseId: company._id,
      typeInteraction: 'ENRICHISSEMENT',
      description: `Enrichissement (${source}): ${fieldsEnriched.length} champs, ${contactsCreated} contacts`,
      metadata: { source, fieldsEnriched, contactsCreated },
      createdBy: 'system'
    });

    // Recharger avec populate
    const updatedCompany = await LeadCompany.findById(company._id)
      .populate('salonSourceId', 'nom')
      .populate('commercialAssigneId', 'firstName lastName email');

    res.json({
      success: true,
      company: updatedCompany,
      fieldsEnriched,
      contactsCreated,
      source
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enrichir une entreprise - GRATUIT (SIRENE + Website scraping)
router.post('/companies/:id/enrich-free', async (req: Request, res: Response) => {
  try {
    const company = await LeadCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const fieldsEnriched: string[] = [];
    let source = 'none';

    // 1. SIRENE pour les entreprises (fonctionne meme pour certaines entreprises etrangeres)
    try {
      const searchQuery = encodeURIComponent(company.raisonSociale);
      const sireneResponse = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${searchQuery}&per_page=1`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (sireneResponse.ok) {
        const data = await sireneResponse.json();
        if (data.results && data.results.length > 0) {
          const entreprise = data.results[0];
          const siege = entreprise.siege;

          if (siege?.siret && !company.siret) {
            company.siret = siege.siret;
            fieldsEnriched.push('siret');
          }
          if (siege?.adresse && !company.adresse?.ligne1) {
            if (!company.adresse) company.adresse = { pays: 'France' };
            company.adresse.ligne1 = siege.adresse;
            fieldsEnriched.push('adresse');
          }
          if (siege?.code_postal && !company.adresse?.codePostal) {
            if (!company.adresse) company.adresse = { pays: 'France' };
            company.adresse.codePostal = siege.code_postal;
            fieldsEnriched.push('codePostal');
          }
          if (siege?.libelle_commune && !company.adresse?.ville) {
            if (!company.adresse) company.adresse = { pays: 'France' };
            company.adresse.ville = siege.libelle_commune;
            fieldsEnriched.push('ville');
          }
          if (entreprise.activite_principale && !company.secteurActivite) {
            company.secteurActivite = entreprise.activite_principale;
            fieldsEnriched.push('secteurActivite');
          }

          if (fieldsEnriched.length > 0) {
            source = 'sirene';
            await company.save();
          }
        }
      }
    } catch (e) {
      console.log('[Enrich-Free] SIRENE error:', e);
    }

    // 2. Si site web disponible, scraper pour plus d'infos
    if (company.siteWeb) {
      try {
        const puppeteer = await import('puppeteer');
        const launchOptions: any = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };
        if (process.platform === 'linux') {
          launchOptions.executablePath = '/usr/bin/google-chrome-stable';
        }

        const browser = await puppeteer.default.launch(launchOptions);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        const baseUrl = company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`;
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const data = await page.evaluate(() => {
          const result: any = {};
          const text = document.body.innerText;
          const html = document.body.innerHTML;

          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch && !emailMatch[0].includes('example') && !emailMatch[0].includes('sentry')) {
            result.email = emailMatch[0];
          }

          const telPatterns = [
            /(?:Tel|Phone|Telephone|T)[.:\s]*(\+?[\d\s.-]{10,20})/i,
            /(\+33[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/,
            /(\+39[\s.-]?\d{2,3}[\s.-]?\d{6,7})/,
            /(0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/
          ];
          for (const pattern of telPatterns) {
            const match = text.match(pattern);
            if (match) {
              result.telephone = match[1].replace(/[\s.-]/g, '');
              break;
            }
          }

          const adresseMatch = text.match(/(\d{1,3}[,\s]+(?:rue|avenue|boulevard|place|via|viale|piazza|corso)[^,\n]{5,50})/i);
          if (adresseMatch) result.adresse = adresseMatch[1].trim();

          const cpVilleMatch = text.match(/(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+?)(?:\s*[,\n]|$)/);
          if (cpVilleMatch) {
            result.codePostal = cpVilleMatch[1];
            result.ville = cpVilleMatch[2].trim();
          }

          const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i);
          if (linkedinMatch) result.linkedin = linkedinMatch[1];

          return result;
        });

        await browser.close();

        if (data.email && !company.emailGenerique) {
          company.emailGenerique = data.email;
          fieldsEnriched.push('email');
        }
        if (data.telephone && !company.telephone) {
          company.telephone = data.telephone;
          fieldsEnriched.push('telephone');
        }
        if (data.adresse && !company.adresse?.ligne1) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.ligne1 = data.adresse;
          fieldsEnriched.push('adresse');
        }
        if (data.ville && !company.adresse?.ville) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.ville = data.ville;
          fieldsEnriched.push('ville');
        }
        if (data.codePostal && !company.adresse?.codePostal) {
          if (!company.adresse) company.adresse = { pays: 'France' };
          company.adresse.codePostal = data.codePostal;
          fieldsEnriched.push('codePostal');
        }
        if (data.linkedin && !company.linkedinCompanyUrl) {
          company.linkedinCompanyUrl = data.linkedin;
          fieldsEnriched.push('linkedin');
        }

        if (fieldsEnriched.length > 0) {
          source = source === 'sirene' ? 'sirene+website' : 'website';
          await company.save();
        }
      } catch (e) {
        console.log('[Enrich-Free] Website scraping error:', e);
      }
    }

    if (fieldsEnriched.length > 0) {
      company.statutProspection = 'ENRICHED';
      await company.save();
    }

    await LeadInteraction.create({
      entrepriseId: company._id,
      typeInteraction: 'ENRICHISSEMENT',
      description: `Enrichissement gratuit (${source}): ${fieldsEnriched.length} champs`,
      metadata: { source, fieldsEnriched },
      createdBy: 'system'
    });

    const updatedCompany = await LeadCompany.findById(company._id)
      .populate('salonSourceId', 'nom')
      .populate('commercialAssigneId', 'firstName lastName email');

    res.json({
      success: true,
      company: updatedCompany,
      fieldsEnriched,
      source
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enrichir une entreprise - PAYANT (Lemlist)
router.post('/companies/:id/enrich-paid', async (req: Request, res: Response) => {
  try {
    const company = await LeadCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (!company.siteWeb) {
      return res.status(400).json({ error: 'Site web requis pour enrichissement Lemlist' });
    }

    let domain: string;
    try {
      domain = new URL(company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`).hostname.replace('www.', '');
    } catch {
      domain = company.siteWeb.replace('www.', '').split('/')[0];
    }

    const { company: enrichedCompany, contacts } = await LemlistService.enrichCompany(domain);

    const fieldsEnriched: string[] = [];
    if (enrichedCompany) {
      company.lemlistData = enrichedCompany as any;
      company.dateEnrichissement = new Date();
      if (enrichedCompany.linkedinUrl && !company.linkedinCompanyUrl) {
        company.linkedinCompanyUrl = enrichedCompany.linkedinUrl;
        fieldsEnriched.push('linkedin');
      }
      company.statutProspection = 'ENRICHED';
      await company.save();
    }

    const createdContacts = [];
    for (const lemlistContact of contacts) {
      if (!lemlistContact.email) continue;
      const existingContact = await LeadContact.findOne({
        entrepriseId: company._id,
        email: lemlistContact.email.toLowerCase()
      });
      if (!existingContact) {
        const contact = await LeadContact.create({
          entrepriseId: company._id,
          prenom: lemlistContact.firstName,
          nom: lemlistContact.lastName,
          poste: lemlistContact.position,
          email: lemlistContact.email.toLowerCase(),
          emailStatus: LemlistService.mapEmailStatus(lemlistContact.enrichmentStatus),
          linkedinUrl: lemlistContact.linkedinUrl,
          telephoneDirect: lemlistContact.phone,
          seniority: LemlistService.mapSeniority(lemlistContact.position),
          sourceEnrichissement: 'LEMLIST',
          dateEnrichissement: new Date()
        });
        createdContacts.push(contact);
      }
    }

    if (createdContacts.length > 0) {
      const hasMainContact = await LeadContact.findOne({
        entrepriseId: company._id,
        estContactPrincipal: true
      });
      if (!hasMainContact) {
        createdContacts[0].estContactPrincipal = true;
        await createdContacts[0].save();
      }
    }

    await LeadInteraction.create({
      entrepriseId: company._id,
      typeInteraction: 'ENRICHISSEMENT',
      description: `Enrichissement Lemlist: ${createdContacts.length} contacts trouves`,
      metadata: { domain, contactsCount: createdContacts.length },
      createdBy: 'system'
    });

    const updatedCompany = await LeadCompany.findById(company._id)
      .populate('salonSourceId', 'nom')
      .populate('commercialAssigneId', 'firstName lastName email');

    res.json({
      success: true,
      company: updatedCompany,
      contactsCreated: createdContacts.length,
      contacts: createdContacts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assigner un commercial
router.post('/companies/:id/assign', async (req: Request, res: Response) => {
  try {
    const { commercialId } = req.body;
    const company = await LeadCompany.findByIdAndUpdate(
      req.params.id,
      {
        commercialAssigneId: commercialId,
        dateAssignation: new Date()
      },
      { new: true }
    ).populate('commercialAssigneId', 'firstName lastName');

    if (!company) return res.status(404).json({ error: 'Company not found' });

    await LeadInteraction.create({
      entrepriseId: company._id,
      commercialId,
      typeInteraction: 'ASSIGNATION',
      description: 'Commercial assigné',
      createdBy: 'admin'
    });

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTACTS ====================

router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, emailStatus, entrepriseId, search } = req.query;
    const filter: any = {};

    if (status) filter.statutContact = status;
    if (emailStatus) filter.emailStatus = emailStatus;
    if (entrepriseId) filter.entrepriseId = entrepriseId;
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { poste: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [contacts, total] = await Promise.all([
      LeadContact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('entrepriseId', 'raisonSociale'),
      LeadContact.countDocuments(filter)
    ]);

    res.json({ data: contacts, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const contact = new LeadContact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const contact = await LeadContact.findById(req.params.id)
      .populate('entrepriseId');
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const emails = await LeadEmail.find({ contactId: contact._id }).sort({ dateEnvoi: -1 });
    res.json({ contact, emails });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const contact = await LeadContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verifier email via Lemlist
router.post('/contacts/:id/verify-email', async (req: Request, res: Response) => {
  try {
    const contact = await LeadContact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (!contact.email) return res.status(400).json({ error: 'No email to verify' });

    const result = await LemlistService.verifyEmail(contact.email);
    if (result) {
      contact.emailStatus = LemlistService.mapEmailStatus(result.status);
      contact.lemlistData = { verification: result } as any;
      await contact.save();
    }

    res.json({ success: true, contact, verification: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMAILS ====================

router.get('/emails', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type, contactId, entrepriseId } = req.query;
    const filter: any = {};

    if (status) filter.statutEnvoi = status;
    if (type) filter.typeEmail = type;
    if (contactId) filter.contactId = contactId;
    if (entrepriseId) filter.entrepriseId = entrepriseId;

    const skip = (Number(page) - 1) * Number(limit);
    const [emails, total] = await Promise.all([
      LeadEmail.find(filter)
        .sort({ dateEnvoi: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('contactId', 'prenom nom email')
        .populate('entrepriseId', 'raisonSociale'),
      LeadEmail.countDocuments(filter)
    ]);

    res.json({ data: emails, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Envoyer un email
router.post('/emails/send', async (req: Request, res: Response) => {
  try {
    const { contactId, templateId, customSubject, customHtml, variables } = req.body;

    const contact = await LeadContact.findById(contactId).populate('entrepriseId');
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (!contact.email) return res.status(400).json({ error: 'Contact has no email' });
    if (contact.optOut) return res.status(400).json({ error: 'Contact opted out' });

    let subject = customSubject;
    let html = customHtml;

    // Si template, récupérer le contenu
    if (templateId) {
      const template = await LeadEmailTemplate.findOne({ code: templateId, actif: true });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      subject = template.sujetTemplate;
      html = template.corpsHtmlTemplate;
    }

    // Préparer les variables
    const company = contact.entrepriseId as any;
    const emailVariables = {
      prenom: contact.prenom || '',
      nom: contact.nom || '',
      poste: contact.poste || '',
      entreprise: company?.raisonSociale || '',
      ...variables
    };

    // Créer l'entrée email
    const leadEmail = new LeadEmail({
      contactId: contact._id,
      entrepriseId: company?._id,
      typeEmail: templateId ? 'PRESENTATION' : 'MANUEL',
      templateId,
      sujet: subject,
      corpsHtml: html,
      langue: 'fr',
      expediteurEmail: 'commerce@symphonia-controltower.com',
      expediteurNom: 'Equipe Commerciale SYMPHONI.A',
      statutEnvoi: 'PENDING'
    });
    await leadEmail.save();

    // Envoyer via SMTP OVH
    const result = await CrmEmailService.sendTemplateEmail({
      to: contact.email,
      templateHtml: html,
      templateSubject: subject,
      variables: emailVariables
    });

    if (result && result.success) {
      leadEmail.mailgunMessageId = result.id; // Keep field for tracking
      leadEmail.dateEnvoi = new Date();
      leadEmail.statutEnvoi = 'SENT';
      await leadEmail.save();

      // Mettre à jour le contact
      contact.statutContact = 'CONTACTED';
      await contact.save();

      // Log interaction
      await LeadInteraction.create({
        entrepriseId: company?._id,
        contactId: contact._id,
        typeInteraction: 'EMAIL_ENVOYE',
        emailId: leadEmail._id,
        description: `Email envoyé: ${subject}`,
        createdBy: 'system'
      });

      res.json({ success: true, email: leadEmail, mailgunId: result.id });
    } else {
      leadEmail.statutEnvoi = 'FAILED';
      await leadEmail.save();
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook Email Tracking (for future use)
router.post('/emails/webhook', async (req: Request, res: Response) => {
  try {
    const { event, messageId, timestamp, url, deliveryStatus } = req.body;
    if (!event || !messageId) return res.status(400).json({ error: 'Invalid webhook payload' });

    const email = await LeadEmail.findOne({ mailgunMessageId: { $regex: messageId } });
    if (!email) return res.status(200).json({ received: true });

    // Mettre a jour selon l'evenement
    const status = CrmEmailService.mapEventToStatus(event);

    const eventTime = timestamp ? new Date(timestamp * 1000) : new Date();

    switch (event) {
      case 'delivered':
        email.dateDelivered = eventTime;
        email.statutEnvoi = 'DELIVERED';
        break;
      case 'opened':
        email.dateOpened = email.dateOpened || eventTime;
        email.nbOpens += 1;
        email.statutEnvoi = 'OPENED';
        await LeadInteraction.create({
          entrepriseId: email.entrepriseId,
          contactId: email.contactId,
          typeInteraction: 'EMAIL_OUVERT',
          emailId: email._id,
          createdBy: 'webhook'
        });
        break;
      case 'clicked':
        email.dateClicked = email.dateClicked || eventTime;
        email.nbClicks += 1;
        if (url) email.linksClicked.push(url);
        email.statutEnvoi = 'CLICKED';
        await LeadInteraction.create({
          entrepriseId: email.entrepriseId,
          contactId: email.contactId,
          typeInteraction: 'EMAIL_CLICKED',
          emailId: email._id,
          metadata: { url },
          createdBy: 'webhook'
        });
        break;
      case 'bounced':
      case 'failed':
        email.statutEnvoi = 'BOUNCED';
        email.bounceType = deliveryStatus?.code?.toString();
        email.bounceMessage = deliveryStatus?.message;
        // Marquer le contact comme bounced
        await LeadContact.findByIdAndUpdate(email.contactId, {
          emailStatus: 'INVALID',
          statutContact: 'BOUNCED'
        });
        break;
      case 'complained':
        email.statutEnvoi = 'COMPLAINED';
        await LeadContact.findByIdAndUpdate(email.contactId, { optOut: true, dateOptOut: new Date() });
        break;
      case 'unsubscribed':
        email.statutEnvoi = 'UNSUBSCRIBED';
        await LeadContact.findByIdAndUpdate(email.contactId, { optOut: true, dateOptOut: new Date() });
        break;
    }

    await email.save();
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[CRM Webhook Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TEMPLATES ====================

router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { type, langue, actif } = req.query;
    const filter: any = {};

    if (type) filter.typeEmail = type;
    if (langue) filter.langue = langue;
    if (actif !== undefined) filter.actif = actif === 'true';

    const templates = await LeadEmailTemplate.find(filter).sort({ typeEmail: 1, langue: 1 });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates', async (req: Request, res: Response) => {
  try {
    const template = new LeadEmailTemplate(req.body);
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await LeadEmailTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, version: (req.body.version || 1) + 1 },
      { new: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INTERACTIONS (Notes) ====================

router.post('/interactions', async (req: Request, res: Response) => {
  try {
    const interaction = new LeadInteraction(req.body);
    await interaction.save();
    res.status(201).json(interaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SALON DISCOVERY ====================

// Obtenir les salons connus + decouvrir de nouveaux
router.get('/discovery/salons', async (req: Request, res: Response) => {
  try {
    const { year, countries, discover } = req.query;

    const config = {
      year: year ? Number(year) : new Date().getFullYear(),
      countries: countries ? String(countries).split(',') : []
    };

    // Par defaut, retourner uniquement les salons connus
    if (discover !== 'true') {
      const known = SalonDiscoveryService.getKnownSalons(config);
      return res.json({
        success: true,
        known,
        discovered: [],
        total: known.length
      });
    }

    // Recherche complete avec decouverte web
    const result = await SalonDiscoveryService.discoverAll(config);
    res.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importer un salon decouvert dans la base
router.post('/discovery/import', async (req: Request, res: Response) => {
  try {
    const { salon } = req.body;

    if (!salon || !salon.nom || !salon.pays) {
      return res.status(400).json({ error: 'Salon invalide (nom et pays requis)' });
    }

    // Verifier si le salon existe deja
    const existing = await LeadSalon.findOne({
      nom: { $regex: new RegExp(salon.nom, 'i') },
      edition: salon.edition
    });

    if (existing) {
      return res.status(400).json({ error: 'Ce salon existe deja', salonId: existing._id });
    }

    // Creer le salon
    const newSalon = await LeadSalon.create({
      nom: salon.nom,
      edition: salon.edition,
      pays: salon.pays,
      lieu: salon.lieu,
      url: salon.url,
      urlListeExposants: salon.urlListeExposants,
      descriptionActivite: salon.description,
      adaptateur: 'Generic',
      statutScraping: 'A_SCRAPER',
      sourceDecouverte: salon.source
    });

    res.status(201).json({ success: true, salon: newSalon });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENRICHISSEMENT AUTOMATIQUE ====================

// Enrichir une entreprise specifique
router.post('/enrichment/company/:id', async (req: Request, res: Response) => {
  try {
    const result = await LeadEnrichmentService.enrichCompany(req.params.id);
    res.json({
      success: result.errors.length === 0,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enrichir toutes les entreprises d'un salon
router.post('/enrichment/salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.body;
    const result = await LeadEnrichmentService.enrichSalonCompanies(req.params.salonId, limit);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enrichir les nouvelles entreprises (batch)
router.post('/enrichment/batch', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.body;
    const result = await LeadEnrichmentService.enrichNewCompanies(limit);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POOL DE LEADS (COMMERCIAUX) ====================

// Obtenir les leads du pool (disponibles pour les commerciaux)
router.get('/pool', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      pays,
      ville,
      departement,
      secteur,
      minScore,
      priorite,
      hasContacts,
      search
    } = req.query;

    const filter: any = {
      inPool: true,
      commercialAssigneId: { $exists: false }
    };

    if (pays) filter['adresse.pays'] = pays;
    if (ville) filter['adresse.ville'] = { $regex: ville, $options: 'i' };
    if (departement) filter['adresse.codePostal'] = { $regex: `^${departement}` };
    if (secteur) filter.secteurActivite = secteur;
    if (minScore) filter.scoreLead = { $gte: Number(minScore) };
    if (priorite) filter.prioritePool = Number(priorite);
    if (hasContacts === 'true') filter.nbContactsEnrichis = { $gt: 0 };
    if (search) {
      filter.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { siteWeb: { $regex: search, $options: 'i' } },
        { descriptionActivite: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total, stats] = await Promise.all([
      LeadCompany.find(filter)
        .sort({ prioritePool: -1, scoreLead: -1, dateAddedToPool: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('salonSourceId', 'nom'),
      LeadCompany.countDocuments(filter),
      LeadCompany.aggregate([
        { $match: { inPool: true, commercialAssigneId: { $exists: false } } },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            avgScore: { $avg: '$scoreLead' },
            withContacts: { $sum: { $cond: [{ $gt: ['$nbContactsEnrichis', 0] }, 1, 0] } },
            byPriority: {
              $push: {
                priorite: '$prioritePool',
                count: 1
              }
            }
          }
        }
      ])
    ]);

    // Stats par pays
    const byCountry = await LeadCompany.aggregate([
      { $match: { inPool: true, commercialAssigneId: { $exists: false } } },
      { $group: { _id: '$adresse.pays', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      data: leads,
      total,
      page: Number(page),
      limit: Number(limit),
      stats: stats[0] || { totalLeads: 0, avgScore: 0, withContacts: 0 },
      byCountry
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter des leads au pool
router.post('/pool/add', async (req: Request, res: Response) => {
  try {
    const { companyIds, salonId, criteria, priorite = 3 } = req.body;

    let filter: any = {};

    if (companyIds && companyIds.length > 0) {
      filter._id = { $in: companyIds };
    } else if (salonId) {
      filter.salonSourceId = salonId;
    } else if (criteria) {
      // Criteres dynamiques: pays, hasWebsite, hasContacts, minScore
      if (criteria.pays) filter['adresse.pays'] = criteria.pays;
      if (criteria.hasWebsite) filter.siteWeb = { $exists: true, $ne: '' };
      if (criteria.hasContacts) filter.nbContactsEnrichis = { $gt: 0 };
      if (criteria.minScore) filter.scoreLead = { $gte: criteria.minScore };
      if (criteria.statut) filter.statutProspection = criteria.statut;
    } else {
      return res.status(400).json({ error: 'Specifiez companyIds, salonId ou criteria' });
    }

    // Exclure ceux deja dans le pool ou deja assignes
    filter.inPool = { $ne: true };
    filter.commercialAssigneId = { $exists: false };

    const result = await LeadCompany.updateMany(filter, {
      $set: {
        inPool: true,
        dateAddedToPool: new Date(),
        prioritePool: priorite
      }
    });

    res.json({
      success: true,
      addedToPool: result.modifiedCount
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Retirer des leads du pool
router.post('/pool/remove', async (req: Request, res: Response) => {
  try {
    const { companyIds } = req.body;

    if (!companyIds || companyIds.length === 0) {
      return res.status(400).json({ error: 'companyIds requis' });
    }

    const result = await LeadCompany.updateMany(
      { _id: { $in: companyIds }, commercialAssigneId: { $exists: false } },
      { $set: { inPool: false }, $unset: { dateAddedToPool: 1, prioritePool: 1 } }
    );

    res.json({
      success: true,
      removedFromPool: result.modifiedCount
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// S'affecter un lead (pour un commercial)
router.post('/pool/claim/:companyId', async (req: Request, res: Response) => {
  try {
    const { commercialId, commercialName } = req.body;

    if (!commercialId) {
      return res.status(400).json({ error: 'commercialId requis' });
    }

    // Verifier que le lead est disponible
    const company = await LeadCompany.findOne({
      _id: req.params.companyId,
      inPool: true,
      commercialAssigneId: { $exists: false }
    });

    if (!company) {
      return res.status(400).json({ error: 'Lead non disponible ou deja assigne' });
    }

    // Affecter le lead
    company.commercialAssigneId = commercialId;
    company.dateAssignation = new Date();
    company.inPool = false;
    company.statutProspection = 'IN_PROGRESS';
    await company.save();

    // Logger l'interaction
    await LeadInteraction.create({
      entrepriseId: company._id,
      commercialId,
      typeInteraction: 'ASSIGNATION',
      description: `Lead reclame par ${commercialName || commercialId}`,
      createdBy: commercialId
    });

    // Recuperer les contacts pour ce lead
    const contacts = await LeadContact.find({ entrepriseId: company._id });

    res.json({
      success: true,
      company,
      contacts,
      message: 'Lead assigne avec succes'
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Liberer un lead (le remettre dans le pool)
router.post('/pool/release/:companyId', async (req: Request, res: Response) => {
  try {
    const { commercialId, reason } = req.body;

    const company = await LeadCompany.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Lead non trouve' });
    }

    // Verifier que le commercial est bien assigne
    if (company.commercialAssigneId?.toString() !== commercialId) {
      return res.status(403).json({ error: 'Vous n\'etes pas assigne a ce lead' });
    }

    // Liberer le lead
    company.commercialAssigneId = undefined;
    company.dateAssignation = undefined;
    company.inPool = true;
    company.dateAddedToPool = new Date();
    company.statutProspection = 'ENRICHED';
    await company.save();

    // Logger l'interaction
    await LeadInteraction.create({
      entrepriseId: company._id,
      commercialId,
      typeInteraction: 'RELEASE',
      description: `Lead libere. Raison: ${reason || 'Non specifiee'}`,
      createdBy: commercialId
    });

    res.json({
      success: true,
      message: 'Lead remis dans le pool'
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir mes leads (pour un commercial)
router.get('/pool/my-leads/:commercialId', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter: any = {
      commercialAssigneId: req.params.commercialId
    };

    if (status) filter.statutProspection = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total, stats] = await Promise.all([
      LeadCompany.find(filter)
        .sort({ dateAssignation: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('salonSourceId', 'nom'),
      LeadCompany.countDocuments(filter),
      LeadCompany.aggregate([
        { $match: { commercialAssigneId: req.params.commercialId } },
        {
          $group: {
            _id: '$statutProspection',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Recuperer les contacts pour chaque lead
    const leadsWithContacts = await Promise.all(
      leads.map(async (lead) => {
        const contacts = await LeadContact.find({ entrepriseId: lead._id })
          .select('prenom nom email poste emailStatus')
          .limit(5);
        return {
          ...lead.toObject(),
          contacts
        };
      })
    );

    res.json({
      data: leadsWithContacts,
      total,
      page: Number(page),
      limit: Number(limit),
      statsByStatus: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats du pool
router.get('/pool/stats', async (req: Request, res: Response) => {
  try {
    const [poolStats, byCountry, bySector, topCommercials] = await Promise.all([
      LeadCompany.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            inPool: [{ $match: { inPool: true, commercialAssigneId: { $exists: false } } }, { $count: 'count' }],
            assigned: [{ $match: { commercialAssigneId: { $exists: true } } }, { $count: 'count' }],
            withContacts: [{ $match: { nbContactsEnrichis: { $gt: 0 } } }, { $count: 'count' }],
            avgScore: [{ $group: { _id: null, avg: { $avg: '$scoreLead' } } }]
          }
        }
      ]),
      LeadCompany.aggregate([
        { $match: { inPool: true } },
        { $group: { _id: '$adresse.pays', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      LeadCompany.aggregate([
        { $match: { inPool: true } },
        { $group: { _id: '$secteurActivite', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      LeadCompany.aggregate([
        { $match: { commercialAssigneId: { $exists: true } } },
        { $group: { _id: '$commercialAssigneId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const stats = poolStats[0];

    res.json({
      total: stats.total[0]?.count || 0,
      inPool: stats.inPool[0]?.count || 0,
      assigned: stats.assigned[0]?.count || 0,
      withContacts: stats.withContacts[0]?.count || 0,
      avgScore: Math.round(stats.avgScore[0]?.avg || 0),
      byCountry,
      bySector,
      topCommercials
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

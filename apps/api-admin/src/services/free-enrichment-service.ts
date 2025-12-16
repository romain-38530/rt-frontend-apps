/**
 * Free Enrichment Service - Enrichit les leads par des methodes gratuites
 * - Google Search pour trouver site web/adresse
 * - Scraping du site web de l'entreprise
 * - API SIRENE pour entreprises francaises
 */

import LeadCompany from '../models/LeadCompany';

interface EnrichmentResult {
  companyId: string;
  success: boolean;
  fieldsEnriched: string[];
  source: string;
  error?: string;
}

interface EnrichmentStats {
  processed: number;
  enriched: number;
  errors: number;
  sources: Record<string, number>;
}

class FreeEnrichmentService {

  /**
   * Enrichir une entreprise par son site web (scraper la page contact/about)
   */
  async enrichFromWebsite(company: any): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      companyId: company._id.toString(),
      success: false,
      fieldsEnriched: [],
      source: 'website'
    };

    if (!company.siteWeb) {
      result.error = 'No website';
      return result;
    }

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

      // Visiter le site principal
      const baseUrl = company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`;
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Extraire infos de la page d'accueil
      let data = await this.extractContactInfo(page);

      // Si pas assez d'info, chercher page contact
      if (!data.email || !data.telephone) {
        const contactUrls = ['/contact', '/nous-contacter', '/about', '/a-propos', '/kontakt', '/contacto'];
        for (const path of contactUrls) {
          try {
            await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const contactData = await this.extractContactInfo(page);
            data = { ...data, ...contactData };
            if (data.email && data.telephone) break;
          } catch (e) {
            // Page n'existe pas, continuer
          }
        }
      }

      await browser.close();

      // Mettre a jour en base
      const updateData: any = {};
      if (data.email && !company.emailGenerique) {
        updateData.emailGenerique = data.email;
        result.fieldsEnriched.push('email');
      }
      if (data.telephone && !company.telephone) {
        updateData.telephone = data.telephone;
        result.fieldsEnriched.push('telephone');
      }
      if (data.adresse && !company.adresse?.ligne1) {
        updateData['adresse.ligne1'] = data.adresse;
        result.fieldsEnriched.push('adresse');
      }
      if (data.ville && !company.adresse?.ville) {
        updateData['adresse.ville'] = data.ville;
        result.fieldsEnriched.push('ville');
      }
      if (data.codePostal && !company.adresse?.codePostal) {
        updateData['adresse.codePostal'] = data.codePostal;
        result.fieldsEnriched.push('codePostal');
      }
      if (data.linkedin) {
        updateData.linkedinUrl = data.linkedin;
        result.fieldsEnriched.push('linkedin');
      }

      if (Object.keys(updateData).length > 0) {
        await LeadCompany.findByIdAndUpdate(company._id, { $set: updateData });
        result.success = true;
      }

    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Extraire les infos de contact d'une page
   */
  private async extractContactInfo(page: any): Promise<any> {
    return page.evaluate(() => {
      const result: any = {};
      const text = document.body.innerText;
      const html = document.body.innerHTML;

      // Email
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !emailMatch[0].includes('example') && !emailMatch[0].includes('sentry')) {
        result.email = emailMatch[0];
      }

      // Telephone - plusieurs formats
      const telPatterns = [
        /(?:Tel|Phone|Telephone|T)[.:\s]*(\+?[\d\s.-]{10,20})/i,
        /(\+33[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/,
        /(0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/
      ];
      for (const pattern of telPatterns) {
        const match = text.match(pattern);
        if (match) {
          result.telephone = match[1].replace(/[\s.-]/g, '');
          break;
        }
      }

      // Adresse francaise
      const adresseMatch = text.match(/(\d{1,3}[,\s]+(?:rue|avenue|boulevard|place|chemin|allee|impasse|voie)[^,\n]{5,50})/i);
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
  }

  /**
   * Enrichir via API SIRENE (entreprises francaises)
   */
  async enrichFromSirene(company: any): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      companyId: company._id.toString(),
      success: false,
      fieldsEnriched: [],
      source: 'sirene'
    };

    // Verifier si c'est une entreprise francaise
    if (company.adresse?.pays && !['France', 'FR'].includes(company.adresse.pays)) {
      result.error = 'Not a French company';
      return result;
    }

    try {
      // Recherche par nom dans l'API SIRENE (gratuite)
      const searchQuery = encodeURIComponent(company.raisonSociale);
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${searchQuery}&per_page=1`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        result.error = `SIRENE API error: ${response.status}`;
        return result;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        result.error = 'No results in SIRENE';
        return result;
      }

      const entreprise = data.results[0];
      const siege = entreprise.siege;

      const updateData: any = {};

      // SIRET
      if (siege?.siret && !company.siret) {
        updateData.siret = siege.siret;
        result.fieldsEnriched.push('siret');
      }

      // Adresse
      if (siege?.adresse && !company.adresse?.ligne1) {
        updateData['adresse.ligne1'] = siege.adresse;
        result.fieldsEnriched.push('adresse');
      }
      if (siege?.code_postal && !company.adresse?.codePostal) {
        updateData['adresse.codePostal'] = siege.code_postal;
        result.fieldsEnriched.push('codePostal');
      }
      if (siege?.libelle_commune && !company.adresse?.ville) {
        updateData['adresse.ville'] = siege.libelle_commune;
        result.fieldsEnriched.push('ville');
      }

      // Activite
      if (entreprise.activite_principale && !company.secteurActivite) {
        updateData.secteurActivite = entreprise.activite_principale;
        result.fieldsEnriched.push('secteurActivite');
      }

      // Effectifs
      if (entreprise.tranche_effectif_salarie && !company.effectifs) {
        updateData.effectifs = entreprise.tranche_effectif_salarie;
        result.fieldsEnriched.push('effectifs');
      }

      if (Object.keys(updateData).length > 0) {
        await LeadCompany.findByIdAndUpdate(company._id, { $set: updateData });
        result.success = true;
      }

    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Rechercher le site web via Google (methode de secours)
   */
  async findWebsiteViaGoogle(company: any): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      companyId: company._id.toString(),
      success: false,
      fieldsEnriched: [],
      source: 'google'
    };

    if (company.siteWeb) {
      result.error = 'Already has website';
      return result;
    }

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

      // Recherche Google
      const query = encodeURIComponent(`${company.raisonSociale} site officiel`);
      await page.goto(`https://www.google.com/search?q=${query}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Extraire le premier resultat
      const firstResult = await page.evaluate(() => {
        const link = document.querySelector('a[href^="http"]:not([href*="google"])');
        return link ? (link as HTMLAnchorElement).href : null;
      });

      await browser.close();

      if (firstResult && !firstResult.includes('google') && !firstResult.includes('facebook') && !firstResult.includes('linkedin')) {
        const domain = new URL(firstResult).hostname.replace('www.', '');
        await LeadCompany.findByIdAndUpdate(company._id, { $set: { siteWeb: `https://${domain}` } });
        result.success = true;
        result.fieldsEnriched.push('siteWeb');
      } else {
        result.error = 'No website found';
      }

    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Enrichissement complet d'un batch d'entreprises
   */
  async enrichBatch(batchSize: number = 20): Promise<EnrichmentStats> {
    const stats: EnrichmentStats = {
      processed: 0,
      enriched: 0,
      errors: 0,
      sources: { website: 0, sirene: 0, google: 0 }
    };

    // Trouver les entreprises qui ont besoin d'enrichissement
    const companies = await LeadCompany.find({
      inPool: true,
      $or: [
        { emailGenerique: { $exists: false } },
        { emailGenerique: null },
        { telephone: { $exists: false } },
        { telephone: null },
        { 'adresse.ville': { $exists: false } },
        { 'adresse.ville': null }
      ]
    }).limit(batchSize);

    console.log(`[FreeEnrichment] Processing ${companies.length} companies...`);

    for (const company of companies) {
      stats.processed++;

      try {
        // 1. D'abord essayer SIRENE pour les entreprises francaises
        if (!company.adresse?.pays || ['France', 'FR'].includes(company.adresse.pays)) {
          const sireneResult = await this.enrichFromSirene(company);
          if (sireneResult.success) {
            stats.enriched++;
            stats.sources.sirene++;
            continue; // Passer a l'entreprise suivante si SIRENE a marche
          }
        }

        // 2. Si pas de site web, essayer de le trouver via Google
        if (!company.siteWeb) {
          const googleResult = await this.findWebsiteViaGoogle(company);
          if (googleResult.success) {
            stats.sources.google++;
            // Recharger l'entreprise avec le nouveau site web
            const updatedCompany = await LeadCompany.findById(company._id);
            if (updatedCompany?.siteWeb) {
              Object.assign(company, updatedCompany);
            }
          }
        }

        // 3. Enrichir via le site web
        if (company.siteWeb) {
          const websiteResult = await this.enrichFromWebsite(company);
          if (websiteResult.success) {
            stats.enriched++;
            stats.sources.website++;
          }
        }

        // Pause entre chaque entreprise pour eviter le rate limiting
        await new Promise(r => setTimeout(r, 2000));

      } catch (error: any) {
        console.error(`[FreeEnrichment] Error processing ${company.raisonSociale}:`, error.message);
        stats.errors++;
      }
    }

    console.log(`[FreeEnrichment] Done: ${stats.enriched}/${stats.processed} enriched`);
    return stats;
  }
}

export default new FreeEnrichmentService();

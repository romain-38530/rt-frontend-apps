/**
 * Routes API pour le scraping d'entreprises de transport
 * Scraping continu B2PWeb avec enregistrement des routes
 */
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { transportScrapingService } from '../services/transport-scraping-service';
import TransportCompany from '../models/TransportCompany';
import TransportOffer from '../models/TransportOffer';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// CONFIGURATION & STATUS
// ============================================

/**
 * GET /config - Configuration du scraping
 */
router.get('/config', async (_req: AuthRequest, res: Response) => {
  try {
    const config = transportScrapingService.getConfig();
    const isAuthenticated = transportScrapingService.isB2PWebAuthenticated();
    res.json({
      success: true,
      data: {
        ...config,
        b2pwebAuthenticated: isAuthenticated,
        b2pwebCredentials: config.b2pwebCredentials ? { username: config.b2pwebCredentials.username } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /config - Mettre à jour la configuration
 */
router.put('/config', async (req: AuthRequest, res: Response) => {
  try {
    const config = transportScrapingService.updateConfig(req.body);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STATISTIQUES
// ============================================

/**
 * GET /stats - Statistiques des entreprises
 */
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await transportScrapingService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /stats/offers - Statistiques des offres
 */
router.get('/stats/offers', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await transportScrapingService.getOffersStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AUTHENTIFICATION B2PWEB
// ============================================

/**
 * POST /b2pweb/auth - Authentification B2PWeb
 */
router.post('/b2pweb/auth', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username et password requis'
      });
    }

    const result = await transportScrapingService.authenticateB2PWeb(username, password);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /b2pweb/status - Statut d'authentification B2PWeb
 */
router.get('/b2pweb/status', async (_req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        authenticated: transportScrapingService.isB2PWebAuthenticated()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /b2pweb/logout - Fermer le browser et déconnecter
 * Cela force une nouvelle session avec le nouveau code après redéploiement
 */
router.post('/b2pweb/logout', async (_req: AuthRequest, res: Response) => {
  try {
    await transportScrapingService.closeBrowser();
    res.json({
      success: true,
      message: 'Browser closed. Please re-authenticate to start a new session.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /b2pweb/auth-auto - Authentification automatique avec credentials par défaut
 */
router.post('/b2pweb/auth-auto', async (_req: AuthRequest, res: Response) => {
  try {
    const config = transportScrapingService.getConfig();
    if (!config.b2pwebCredentials) {
      return res.status(400).json({
        success: false,
        error: 'Aucun identifiant B2PWeb configuré'
      });
    }

    const result = await transportScrapingService.authenticateB2PWeb(
      config.b2pwebCredentials.username,
      config.b2pwebCredentials.password
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// JOBS DE SCRAPING
// ============================================

/**
 * GET /jobs - Liste des jobs de scraping
 */
router.get('/jobs', async (_req: AuthRequest, res: Response) => {
  try {
    const jobs = transportScrapingService.getAllJobs();
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /jobs/:id - Statut d'un job
 */
router.get('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const job = transportScrapingService.getJobStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job non trouvé' });
    }
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /jobs/:id/stop - Arrêter un job
 */
router.post('/jobs/:id/stop', async (req: AuthRequest, res: Response) => {
  try {
    const success = transportScrapingService.stopJob(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Job non trouvé' });
    }
    res.json({ success: true, message: 'Job arrêté' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SCRAPING CONTINU
// ============================================

/**
 * POST /scrape/continuous/start - Démarrer le scraping continu
 */
router.post('/scrape/continuous/start', async (req: AuthRequest, res: Response) => {
  try {
    const { intervalMinutes } = req.body;

    const job = await transportScrapingService.startContinuousScraping(intervalMinutes);

    res.json({
      success: true,
      data: job,
      message: `Scraping continu démarré (intervalle: ${job.interval} minutes)`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /scrape/continuous/stop - Arrêter le scraping continu
 */
router.post('/scrape/continuous/stop', async (_req: AuthRequest, res: Response) => {
  try {
    const jobs = transportScrapingService.getAllJobs();
    const continuousJob = jobs.find(j => j.type === 'continuous' && j.isActive);

    if (!continuousJob) {
      return res.status(404).json({ success: false, error: 'Aucun scraping continu actif' });
    }

    transportScrapingService.stopJob(continuousJob.id);

    res.json({ success: true, message: 'Scraping continu arrêté' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SCRAPING ANNUAIRE (DIRECTORY)
// ============================================

/**
 * POST /scrape/directory - Lancer le scraping de l'annuaire B2PWeb
 * Récupère les fiches entreprises complètes : infos, véhicules, axes de recherche, contacts
 */
router.post('/scrape/directory', async (req: AuthRequest, res: Response) => {
  try {
    const { maxCompanies = 100 } = req.body;

    // Vérifier l'authentification B2PWeb
    if (!transportScrapingService.isB2PWebAuthenticated()) {
      return res.status(400).json({
        success: false,
        error: 'Non authentifié sur B2PWeb. Veuillez vous connecter d\'abord.'
      });
    }

    // Créer un job pour le suivi
    const job = transportScrapingService.createScrapingJob('b2pweb-directory', 'companies', { maxCompanies });
    job.status = 'running';
    job.startedAt = new Date();

    // Lancer le scraping en arrière-plan
    (async () => {
      try {
        const companies = await transportScrapingService.scrapeDirectory(maxCompanies);
        job.totalFound = companies.length;

        // Sauvegarder chaque entreprise
        for (const companyData of companies) {
          try {
            await transportScrapingService.saveDirectoryCompany(companyData);
            job.totalImported++;
          } catch (err: any) {
            job.errors.push(`Erreur sauvegarde: ${err.message}`);
          }
        }

        job.status = 'completed';
        job.completedAt = new Date();
      } catch (err: any) {
        job.status = 'failed';
        job.errors.push(err.message);
        job.completedAt = new Date();
      }
    })();

    res.json({
      success: true,
      data: job,
      message: `Scraping annuaire démarré (max: ${maxCompanies} entreprises)`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// OFFRES DE TRANSPORT
// ============================================

/**
 * GET /offers - Liste des offres avec filtres
 */
router.get('/offers', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      originDepartment,
      destinationDepartment,
      originCity,
      destinationCity,
      vehicleType,
      dateFrom,
      dateTo,
      status,
      companyId,
      page,
      limit
    } = req.query;

    const result = await transportScrapingService.searchOffers({
      search: search as string,
      originDepartment: originDepartment as string,
      destinationDepartment: destinationDepartment as string,
      originCity: originCity as string,
      destinationCity: destinationCity as string,
      vehicleType: vehicleType as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      status: status as string,
      companyId: companyId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /offers/:id - Détail d'une offre
 */
router.get('/offers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const offer = await TransportOffer.findById(req.params.id)
      .populate('company.transportCompanyId');

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /offers/:id - Supprimer une offre
 */
router.delete('/offers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const offer = await TransportOffer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }
    res.json({ success: true, message: 'Offre supprimée' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/cleanup - Nettoyer les offres expirées
 */
router.post('/offers/cleanup', async (req: AuthRequest, res: Response) => {
  try {
    const { daysOld = 7 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await TransportOffer.updateMany(
      {
        status: 'active',
        'source.lastSeenAt': { $lt: cutoffDate }
      },
      { status: 'expired' }
    );

    res.json({
      success: true,
      data: { markedExpired: result.modifiedCount },
      message: `${result.modifiedCount} offres marquées comme expirées`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// IMPORT CSV
// ============================================

/**
 * POST /import/csv - Import depuis fichier CSV
 */
router.post('/import/csv', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Fichier CSV requis' });
    }

    const sourceName = req.body.sourceName || 'csv-import';
    const csvContent = req.file.buffer.toString('utf-8');
    const delimiter = req.body.delimiter || ';';

    // Parser le CSV manuellement
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: 'Fichier CSV vide ou invalide' });
    }

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    const records = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });

    // Mapper les colonnes
    const data = records.map((row: any) => ({
      companyName: row['companyName'] || row['Nom'] || row['Entreprise'] || row['Raison sociale'] || row['name'],
      email: row['email'] || row['Email'] || row['Mail'],
      phone: row['phone'] || row['Telephone'] || row['Tel'] || row['Phone'],
      city: row['city'] || row['Ville'] || row['City'],
      postalCode: row['postalCode'] || row['Code postal'] || row['CP'],
      services: row['services'] || row['Services'],
      vehicleTypes: row['vehicleTypes'] || row['Vehicules'] || row['Types vehicules'],
      siret: row['siret'] || row['SIRET']
    })).filter((r: any) => r.companyName);

    const job = transportScrapingService.createScrapingJob('csv-import', 'companies', { sourceName });

    // Lancer l'import en arrière-plan
    transportScrapingService.importFromCSV(job.id, data, sourceName);

    res.json({
      success: true,
      data: job,
      message: `Import CSV lancé: ${data.length} lignes détectées`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GESTION DES ENTREPRISES
// ============================================

/**
 * GET /companies - Liste des entreprises avec filtres
 */
router.get('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, source, department, hasEmail, addedToLeadPool, page, limit } = req.query;

    const result = await transportScrapingService.searchCompanies({
      search: search as string,
      status: status as string,
      source: source as string,
      department: department as string,
      hasEmail: hasEmail === 'true' ? true : hasEmail === 'false' ? false : undefined,
      addedToLeadPool: addedToLeadPool === 'true' ? true : addedToLeadPool === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /companies/:id - Détail d'une entreprise
 */
router.get('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await TransportCompany.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });
    }
    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /companies/:id/routes - Routes d'une entreprise
 */
router.get('/companies/:id/routes', async (req: AuthRequest, res: Response) => {
  try {
    const result = await transportScrapingService.getCompanyRoutes(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /companies/:id/offers - Offres d'une entreprise
 */
router.get('/companies/:id/offers', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = await transportScrapingService.searchOffers({
      companyId: req.params.id,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /companies/:id - Mettre à jour une entreprise
 */
router.put('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await TransportCompany.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /companies/:id - Supprimer une entreprise
 */
router.delete('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    const success = await transportScrapingService.deleteCompany(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });
    }
    res.json({ success: true, message: 'Entreprise supprimée' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /companies/:id/status - Mettre à jour le statut de prospection
 */
router.post('/companies/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Statut requis' });
    }

    const company = await transportScrapingService.updateProspectionStatus(
      req.params.id,
      status,
      notes
    );

    if (!company) {
      return res.status(404).json({ success: false, error: 'Entreprise non trouvée' });
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /companies/add-to-lead-pool - Ajouter au Lead Pool
 */
router.post('/companies/add-to-lead-pool', async (req: AuthRequest, res: Response) => {
  try {
    const { companyIds } = req.body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste de companyIds requise'
      });
    }

    const result = await transportScrapingService.addToLeadPool(companyIds);
    res.json({
      success: true,
      data: result,
      message: `${result.success} entreprises ajoutées au Lead Pool`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /companies/bulk-action - Actions en masse
 */
router.post('/companies/bulk-action', async (req: AuthRequest, res: Response) => {
  try {
    const { action, companyIds, data } = req.body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste de companyIds requise'
      });
    }

    let result: { success: number; failed: number } = { success: 0, failed: 0 };

    switch (action) {
      case 'updateStatus':
        for (const id of companyIds) {
          try {
            await transportScrapingService.updateProspectionStatus(id, data.status, data.notes);
            result.success++;
          } catch (e) {
            result.failed++;
          }
        }
        break;

      case 'addToLeadPool':
        result = await transportScrapingService.addToLeadPool(companyIds);
        break;

      case 'delete':
        for (const id of companyIds) {
          try {
            await transportScrapingService.deleteCompany(id);
            result.success++;
          } catch (e) {
            result.failed++;
          }
        }
        break;

      case 'addTags':
        for (const id of companyIds) {
          try {
            await TransportCompany.findByIdAndUpdate(id, {
              $addToSet: { tags: { $each: data.tags } }
            });
            result.success++;
          } catch (e) {
            result.failed++;
          }
        }
        break;

      default:
        return res.status(400).json({ success: false, error: 'Action non reconnue' });
    }

    res.json({
      success: true,
      data: result,
      message: `Action "${action}" effectuée sur ${result.success} entreprises`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CREATION MANUELLE
// ============================================

/**
 * POST /companies - Créer une entreprise manuellement
 */
router.post('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const company = new TransportCompany({
      ...req.body,
      source: {
        type: 'manual',
        name: 'backoffice',
        scrapedAt: new Date()
      },
      isActive: true
    });

    await company.save();

    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DEBUG PUPPETEER
// ============================================

/**
 * GET /debug/screenshot - Prendre une capture d'écran
 */
router.get('/debug/screenshot', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await transportScrapingService.takeScreenshot();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /debug/navigate - Naviguer vers une URL
 */
router.post('/debug/navigate', async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }
    const result = await transportScrapingService.navigateTo(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /debug/click - Cliquer sur un élément par texte
 */
router.post('/debug/click', async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text required' });
    }
    const result = await transportScrapingService.clickByText(text);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /debug/html - Récupérer le HTML de la page
 */
router.get('/debug/html', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await transportScrapingService.getPageHTML();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /debug/html-search - Rechercher dans le HTML
 */
router.get('/debug/html-search', async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const result = await transportScrapingService.getPageHTML();
    if (!result.success || !result.html) {
      return res.status(400).json(result);
    }

    // Find occurrences of the query in the HTML
    const matches: string[] = [];
    const regex = new RegExp(`.{0,50}${query}.{0,50}`, 'gi');
    let match;
    while ((match = regex.exec(result.html)) !== null && matches.length < 20) {
      matches.push(match[0]);
    }

    res.json({
      success: true,
      query,
      matchCount: matches.length,
      matches,
      url: result.url
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DIAGNOSTIC
// ============================================

/**
 * GET /debug/chrome - Vérifier l'installation de Chrome
 */
router.get('/debug/chrome', async (_req: AuthRequest, res: Response) => {
  try {
    const { execSync } = require('child_process');

    const checks: Record<string, string> = {};

    // Check Chrome paths
    const paths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    for (const p of paths) {
      try {
        execSync(`ls -la ${p}`, { encoding: 'utf-8' });
        checks[p] = 'EXISTS';
      } catch {
        checks[p] = 'NOT FOUND';
      }
    }

    // Try which command
    try {
      checks['which google-chrome-stable'] = execSync('which google-chrome-stable', { encoding: 'utf-8' }).trim();
    } catch {
      checks['which google-chrome-stable'] = 'NOT IN PATH';
    }

    // Try Chrome version
    try {
      checks['chrome version'] = execSync('google-chrome-stable --version', { encoding: 'utf-8' }).trim();
    } catch (e: any) {
      checks['chrome version'] = `ERROR: ${e.message}`;
    }

    // Check dnf installed packages
    try {
      checks['dnf list google-chrome'] = execSync('dnf list installed google-chrome-stable 2>/dev/null | head -5', { encoding: 'utf-8' }).trim() || 'NOT INSTALLED';
    } catch {
      checks['dnf list google-chrome'] = 'NOT INSTALLED';
    }

    // Check CHROME_PATH env
    checks['CHROME_PATH env'] = process.env.CHROME_PATH || 'NOT SET';

    res.json({ success: true, data: checks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// EXPORT
// ============================================

/**
 * GET /export/csv - Export CSV
 */
router.get('/export/csv', async (req: AuthRequest, res: Response) => {
  try {
    const { status, source, department } = req.query;

    const csv = await transportScrapingService.exportToCSV({
      status: status as string,
      source: source as string,
      department: department as string
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transport-companies-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

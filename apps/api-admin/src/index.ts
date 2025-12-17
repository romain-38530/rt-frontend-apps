/**
 * API Admin Gateway - SYMPHONI.A
 * Administration centralisee de la plateforme
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import usersRoutes from './routes/users';
import companiesRoutes from './routes/companies';
import subscriptionsRoutes from './routes/subscriptions';
import modulesRoutes from './routes/modules';
import apiKeysRoutes from './routes/api-keys';
import auditRoutes from './routes/audit';
import announcementsRoutes from './routes/announcements';
import dashboardRoutes from './routes/dashboard';
import crmRoutes from './routes/crm';
import authRoutes from './routes/auth';
import commercialPortalRoutes from './routes/commercial-portal';

// Middleware
import { authenticateAdmin } from './middleware/auth';
// Background scraping imports
import ScrapingServiceInstance from './services/scraping-service';
import LeadSalon from './models/LeadSalon';
import LeadCompany from './models/LeadCompany';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3020;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-admin';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Documentation
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Admin Gateway API',
    version: '1.0.0',
    description: 'Administration centralisee SYMPHONI.A',
    endpoints: {
      health: '/health',

      // User Management
      users: {
        list: 'GET /api/v1/admin/users',
        create: 'POST /api/v1/admin/users',
        get: 'GET /api/v1/admin/users/:id',
        update: 'PUT /api/v1/admin/users/:id',
        delete: 'DELETE /api/v1/admin/users/:id',
        activate: 'POST /api/v1/admin/users/:id/activate',
        deactivate: 'POST /api/v1/admin/users/:id/deactivate',
        resetPassword: 'POST /api/v1/admin/users/:id/reset-password',
        activity: 'GET /api/v1/admin/users/:id/activity',
        roles: 'PUT /api/v1/admin/users/:id/roles'
      },

      // Company Management
      companies: {
        list: 'GET /api/v1/admin/companies',
        create: 'POST /api/v1/admin/companies',
        get: 'GET /api/v1/admin/companies/:id',
        update: 'PUT /api/v1/admin/companies/:id',
        delete: 'DELETE /api/v1/admin/companies/:id',
        verify: 'POST /api/v1/admin/companies/:id/verify',
        suspend: 'POST /api/v1/admin/companies/:id/suspend',
        billing: 'GET /api/v1/admin/companies/:id/billing',
        subscription: 'PUT /api/v1/admin/companies/:id/subscription',
        modules: 'PUT /api/v1/admin/companies/:id/modules'
      },

      // Subscriptions & Billing
      subscriptions: {
        list: 'GET /api/v1/admin/subscriptions',
        get: 'GET /api/v1/admin/subscriptions/:id',
        update: 'PUT /api/v1/admin/subscriptions/:id',
        cancel: 'POST /api/v1/admin/subscriptions/:id/cancel'
      },
      invoices: {
        list: 'GET /api/v1/admin/invoices',
        refund: 'POST /api/v1/admin/invoices/:id/refund'
      },

      // Platform Monitoring
      dashboard: 'GET /api/v1/admin/dashboard',
      servicesHealth: 'GET /api/v1/admin/services/health',
      metrics: 'GET /api/v1/admin/metrics',
      logs: 'GET /api/v1/admin/logs',
      errors: 'GET /api/v1/admin/errors',

      // Module Management
      modules: {
        list: 'GET /api/v1/admin/modules',
        toggle: 'PUT /api/v1/admin/modules/:id/toggle',
        usage: 'GET /api/v1/admin/modules/:id/usage'
      },

      // API Keys
      apiKeys: {
        list: 'GET /api/v1/admin/api-keys',
        create: 'POST /api/v1/admin/api-keys',
        revoke: 'DELETE /api/v1/admin/api-keys/:id'
      },

      // Integrations
      integrations: {
        list: 'GET /api/v1/admin/integrations',
        configure: 'PUT /api/v1/admin/integrations/:id'
      },

      // Audit & Compliance
      audit: {
        list: 'GET /api/v1/admin/audit',
        export: 'GET /api/v1/admin/audit/export'
      },
      gdpr: {
        requests: 'GET /api/v1/admin/gdpr/requests',
        process: 'POST /api/v1/admin/gdpr/requests/:id/process'
      },

      // Notifications & Announcements
      notifications: {
        broadcast: 'POST /api/v1/admin/notifications/broadcast'
      },
      announcements: {
        list: 'GET /api/v1/admin/announcements',
        create: 'POST /api/v1/admin/announcements',
        update: 'PUT /api/v1/admin/announcements/:id',
        delete: 'DELETE /api/v1/admin/announcements/:id'
      },

      // CRM Lead Generation
      crm: {
        dashboard: 'GET /api/v1/admin/crm/dashboard',
        salons: {
          list: 'GET /api/v1/admin/crm/salons',
          create: 'POST /api/v1/admin/crm/salons',
          get: 'GET /api/v1/admin/crm/salons/:id',
          update: 'PUT /api/v1/admin/crm/salons/:id'
        },
        companies: {
          list: 'GET /api/v1/admin/crm/companies',
          create: 'POST /api/v1/admin/crm/companies',
          get: 'GET /api/v1/admin/crm/companies/:id',
          update: 'PUT /api/v1/admin/crm/companies/:id',
          enrich: 'POST /api/v1/admin/crm/companies/:id/enrich',
          assign: 'POST /api/v1/admin/crm/companies/:id/assign'
        },
        contacts: {
          list: 'GET /api/v1/admin/crm/contacts',
          create: 'POST /api/v1/admin/crm/contacts',
          get: 'GET /api/v1/admin/crm/contacts/:id',
          update: 'PUT /api/v1/admin/crm/contacts/:id',
          verifyEmail: 'POST /api/v1/admin/crm/contacts/:id/verify-email'
        },
        emails: {
          list: 'GET /api/v1/admin/crm/emails',
          send: 'POST /api/v1/admin/crm/emails/send',
          webhook: 'POST /api/v1/admin/crm/emails/webhook'
        },
        templates: {
          list: 'GET /api/v1/admin/crm/templates',
          create: 'POST /api/v1/admin/crm/templates',
          update: 'PUT /api/v1/admin/crm/templates/:id'
        }
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RT Admin Gateway API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Auth routes (public)
app.use('/auth', authRoutes);

// Protected admin routes
app.use('/api/v1/admin/users', authenticateAdmin, usersRoutes);
app.use('/api/v1/admin/companies', authenticateAdmin, companiesRoutes);
app.use('/api/v1/admin/subscriptions', authenticateAdmin, subscriptionsRoutes);
app.use('/api/v1/admin/modules', authenticateAdmin, modulesRoutes);
app.use('/api/v1/admin/api-keys', authenticateAdmin, apiKeysRoutes);
app.use('/api/v1/admin/audit', authenticateAdmin, auditRoutes);
app.use('/api/v1/admin/announcements', authenticateAdmin, announcementsRoutes);
app.use('/api/v1/admin/crm', crmRoutes); // CRM routes (auth handled internally, webhook needs to be public)
app.use('/api/v1/commercial', commercialPortalRoutes); // Commercial portal (auth handled internally)
app.use('/api/v1/admin', authenticateAdmin, dashboardRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`RT Admin Gateway API running on port ${PORT}`);
      console.log(`Documentation: http://localhost:${PORT}/`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });


// Tache de fond pour scraper les salons actifs
async function startBackgroundScraping() {
  console.log('[Background] Starting background scraping service...');
  
  // Attendre 30 secondes avant de demarrer (laisser le serveur demarrer)
  await new Promise(r => setTimeout(r, 30000));
  
  // Fonction de scraping
  const runScraping = async () => {
    try {
      // Trouver les salons avec statut A_SCRAPER ou TERMINE (pour refresh)
      const salonsToScrape = await LeadSalon.find({
        statutScraping: { $in: ['A_SCRAPER', 'TERMINE'] },
        urlListeExposants: { $exists: true, $ne: null }
      }).limit(1); // Un salon a la fois

      for (const salon of salonsToScrape) {
        console.log('[Background] Scraping salon:', salon.nom);
        
        try {
          // Mettre a jour le statut
          salon.statutScraping = 'EN_COURS';
          salon.derniereExecution = new Date();
          await salon.save();

          // Determiner l'adaptateur
          let adapterName = 'Generic';
          const url = salon.urlListeExposants || '';
          if (url.includes('sialparis') || url.includes('sial')) adapterName = 'SIAL';
          else if (url.includes('sitl')) adapterName = 'SITL';
          else if (url.includes('transportlogistic')) adapterName = 'TransportLogistic';

          // Lancer le scraping
          const result = await ScrapingServiceInstance.scrapeUrl(salon.urlListeExposants!, adapterName);

          if (result.success && result.companies.length > 0) {
            let created = 0;
            let duplicates = 0;

            for (const company of result.companies) {
              try {
                const existingCompany = await LeadCompany.findOne({
                  $or: [
                    { raisonSociale: company.raisonSociale, salonSourceId: salon._id },
                    { siteWeb: company.siteWeb }
                  ]
                });

                if (existingCompany) {
                  duplicates++;
                  continue;
                }

                const paysValue = company.pays || 'France';
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
              } catch (e) {
                // Ignorer les erreurs individuelles
              }
            }

            // Mettre a jour le salon
            salon.statutScraping = 'TERMINE';
            salon.nbExposantsCollectes = (salon.nbExposantsCollectes || 0) + created;
            await salon.save();

            console.log('[Background] Scraping ' + salon.nom + ': ' + created + ' nouvelles, ' + duplicates + ' doublons');
          } else {
            salon.statutScraping = 'TERMINE';
            await salon.save();
          }
        } catch (error: any) {
          console.error('[Background] Scraping error for ' + salon.nom + ':', error.message);
          salon.statutScraping = 'ERREUR';
          await salon.save();
        }
      }
    } catch (error: any) {
      console.error('[Background] Background scraping error:', error.message);
    }
  };

  // Executer toutes les 10 minutes
  setInterval(runScraping, 10 * 60 * 1000);
  
  // Executer immediatement au demarrage
  runScraping();
}

export default app;

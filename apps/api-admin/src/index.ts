/**
 * API Admin Gateway - SYMPHONI.A
 * Administration centralisee de la plateforme
 * Version 3.0.0 - Sécurisée avec monitoring complet
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';

// Configuration
import { corsOptions } from './config/cors';
import { initSentry, sentryErrorHandler } from './config/sentry';
import { logger, initCloudWatchTransport } from './config/logger';
import { swaggerSpec } from './config/swagger';

// Middleware
import { authenticateAdmin } from './middleware/auth';
import { globalRateLimiter } from './middleware/rate-limiter';
import requestLogger from './middleware/request-logger';

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
import authRoutes, { seedAdminUsers } from './routes/auth';
import commercialPortalRoutes from './routes/commercial-portal';
import managerRoutes, { publicInstallationRoutes } from './routes/manager';
import transportScrapingRoutes from './routes/transport-scraping';
import healthRoutes from './routes/health';
import notificationsRoutes from './routes/notifications';
import gdprRoutes from './routes/gdpr';
import subusersRoutes from './routes/subusers';

// Background services
import ScrapingServiceInstance from './services/scraping-service';
import LeadSalon from './models/LeadSalon';
import LeadCompany from './models/LeadCompany';
import { metricsService } from './services/metrics-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3020;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-admin';
const APP_VERSION = process.env.APP_VERSION || '3.0.4';

// Initialiser Sentry (avant les autres middlewares)
initSentry(app);

// Middleware - CORS sécurisé
app.use(cors(corsOptions));

// Rate limiting global
app.use(globalRateLimiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API Documentation - Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RT Admin API Documentation'
}));

// Swagger JSON spec
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// API Documentation root
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Admin Gateway API',
    version: APP_VERSION,
    description: 'Administration centralisee SYMPHONI.A',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/auth',
      users: '/api/v1/admin/users',
      companies: '/api/v1/admin/companies',
      crm: '/api/v1/admin/crm',
      scraping: '/api/v1/admin/transport-scraping',
      notifications: '/api/v1/admin/notifications',
      gdpr: '/api/v1/admin/gdpr',
      dashboard: '/api/v1/admin/dashboard',
      analytics: '/api/v1/admin/analytics',
      logs: '/api/v1/admin/logs',
      errors: '/api/v1/admin/errors'
    }
  });
});

// Health check routes (publiques)
app.use('/health', healthRoutes);

// Auth routes (publiques avec rate limiting interne)
app.use('/auth', authRoutes);

// Public debug endpoint for Chrome check
app.get('/debug/chrome', (req, res) => {
  try {
    const { execSync } = require('child_process');
    const checks: Record<string, string> = {};

    const paths = ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
    for (const p of paths) {
      try {
        execSync(`ls -la ${p}`, { encoding: 'utf-8' });
        checks[p] = 'EXISTS';
      } catch {
        checks[p] = 'NOT FOUND';
      }
    }

    try {
      checks['which google-chrome-stable'] = execSync('which google-chrome-stable 2>/dev/null', { encoding: 'utf-8' }).trim() || 'NOT IN PATH';
    } catch { checks['which google-chrome-stable'] = 'NOT IN PATH'; }

    try {
      checks['chrome version'] = execSync('google-chrome-stable --version 2>/dev/null', { encoding: 'utf-8' }).trim();
    } catch (e: any) { checks['chrome version'] = `ERROR: ${e.message}`; }

    checks['CHROME_PATH env'] = process.env.CHROME_PATH || 'NOT SET';

    res.json({ success: true, data: checks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Protected admin routes
app.use('/api/v1/admin/users', authenticateAdmin, usersRoutes);
app.use('/api/v1/admin/companies', authenticateAdmin, companiesRoutes);
app.use('/api/v1/admin/subscriptions', authenticateAdmin, subscriptionsRoutes);
app.use('/api/v1/admin/modules', authenticateAdmin, modulesRoutes);
app.use('/api/v1/admin/api-keys', authenticateAdmin, apiKeysRoutes);
app.use('/api/v1/admin/audit', authenticateAdmin, auditRoutes);
app.use('/api/v1/admin/announcements', authenticateAdmin, announcementsRoutes);
app.use('/api/v1/admin/crm', crmRoutes);
app.use('/api/v1/commercial', commercialPortalRoutes);
app.use('/api/v1/admin/manager', managerRoutes);
app.use('/api/v1/installation', publicInstallationRoutes);
app.use('/api/v1/admin/transport-scraping', authenticateAdmin, transportScrapingRoutes);
app.use('/api/v1/admin/notifications', notificationsRoutes);
app.use('/api/v1/admin/gdpr', gdprRoutes);
app.use('/api/subusers', subusersRoutes);
app.use('/api/v1/admin', authenticateAdmin, dashboardRoutes);

// Sentry error handler (avant le handler d'erreur personnalisé)
app.use(sentryErrorHandler);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
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
  .then(async () => {
    logger.info('Connected to MongoDB');

    // Seed des utilisateurs admin par défaut
    await seedAdminUsers();
    logger.info('Admin users seeded');

    // Initialiser CloudWatch transport si configuré
    await initCloudWatchTransport();

    app.listen(PORT, () => {
      logger.info(`RT Admin Gateway API v${APP_VERSION} running on port ${PORT}`);
      logger.info(`Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await metricsService.shutdown();
  await mongoose.connection.close();
  logger.info('Shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await metricsService.shutdown();
  await mongoose.connection.close();
  process.exit(0);
});

// Background scraping task
async function startBackgroundScraping() {
  logger.info('[Background] Starting background scraping service...');

  await new Promise(r => setTimeout(r, 30000));

  const runScraping = async () => {
    try {
      const salonsToScrape = await LeadSalon.find({
        statutScraping: { $in: ['A_SCRAPER', 'TERMINE'] },
        urlListeExposants: { $exists: true, $ne: null }
      }).limit(1);

      for (const salon of salonsToScrape) {
        logger.info('[Background] Scraping salon', { nom: salon.nom });

        try {
          salon.statutScraping = 'EN_COURS';
          salon.derniereExecution = new Date();
          await salon.save();

          let adapterName = 'Generic';
          const url = salon.urlListeExposants || '';
          if (url.includes('sialparis') || url.includes('sial')) adapterName = 'SIAL';
          else if (url.includes('sitl')) adapterName = 'SITL';
          else if (url.includes('transportlogistic')) adapterName = 'TransportLogistic';

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

            salon.statutScraping = 'TERMINE';
            salon.nbExposantsCollectes = (salon.nbExposantsCollectes || 0) + created;
            await salon.save();

            logger.info('[Background] Scraping completed', { salon: salon.nom, created, duplicates });
          } else {
            salon.statutScraping = 'TERMINE';
            await salon.save();
          }
        } catch (error: any) {
          logger.error('[Background] Scraping error', { salon: salon.nom, error: error.message });
          salon.statutScraping = 'ERREUR';
          await salon.save();
        }
      }
    } catch (error: any) {
      logger.error('[Background] Background scraping error', { error: error.message });
    }
  };

  setInterval(runScraping, 10 * 60 * 1000);
  runScraping();
}

export default app;

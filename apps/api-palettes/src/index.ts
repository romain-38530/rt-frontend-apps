import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import ordersRoutes from './routes/orders';
import chequesRoutes from './routes/cheques';
import ledgerRoutes from './routes/ledger';
import sitesRoutes from './routes/sites';
import disputesRoutes from './routes/disputes';
import matchingRoutes from './routes/matching';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import epalRoutes from './routes/epal';

// Services
import { getPublicKey } from './services/crypto';
import { startEscalationScheduler } from './services/dispute-escalation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-palettes';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Documentation API
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie - Module Économie Circulaire Palettes Europe API',
    version: '2.0.0',
    description: 'API complète pour la gestion des palettes EURO EPAL avec chèques numériques, matching IA et traçabilité juridique',
    endpoints: {
      health: 'GET /health',
      publicKey: 'GET /api/v1/public-key',
      orders: {
        description: 'Gestion des commandes (legacy)',
        list: 'GET /api/v1/orders',
        create: 'POST /api/v1/orders',
        get: 'GET /api/v1/orders/:id',
        update: 'PUT /api/v1/orders/:id',
        delete: 'DELETE /api/v1/orders/:id'
      },
      cheques: {
        description: 'Chèques-palette numériques',
        list: 'GET /api/v1/palette/cheques',
        get: 'GET /api/v1/palette/cheques/:chequeId',
        create: 'POST /api/v1/palette/cheques',
        deposit: 'POST /api/v1/palette/cheques/:chequeId/deposit',
        receive: 'POST /api/v1/palette/cheques/:chequeId/receive',
        cancel: 'POST /api/v1/palette/cheques/:chequeId/cancel',
        verify: 'GET /api/v1/palette/cheques/:chequeId/verify'
      },
      ledger: {
        description: 'Registre des dettes/crédits palettes',
        list: 'GET /api/v1/palette/ledger',
        get: 'GET /api/v1/palette/ledger/:companyId',
        history: 'GET /api/v1/palette/ledger/:companyId/history',
        adjust: 'POST /api/v1/palette/ledger/:companyId/adjust',
        stats: 'GET /api/v1/palette/ledger/stats/global'
      },
      sites: {
        description: 'Sites de restitution',
        list: 'GET /api/v1/palette/sites',
        get: 'GET /api/v1/palette/sites/:siteId',
        create: 'POST /api/v1/palette/sites',
        update: 'PUT /api/v1/palette/sites/:siteId',
        quota: 'POST /api/v1/palette/sites/:siteId/quota',
        resetQuota: 'POST /api/v1/palette/sites/:siteId/reset-quota',
        activate: 'POST /api/v1/palette/sites/:siteId/activate',
        stats: 'GET /api/v1/palette/sites/:siteId/stats',
        delete: 'DELETE /api/v1/palette/sites/:siteId'
      },
      disputes: {
        description: 'Gestion des litiges',
        list: 'GET /api/v1/palette/disputes',
        get: 'GET /api/v1/palette/disputes/:disputeId',
        create: 'POST /api/v1/palette/disputes',
        proposeResolution: 'POST /api/v1/palette/disputes/:disputeId/propose-resolution',
        validate: 'POST /api/v1/palette/disputes/:disputeId/validate',
        comment: 'POST /api/v1/palette/disputes/:disputeId/comment',
        escalate: 'POST /api/v1/palette/disputes/:disputeId/escalate',
        stats: 'GET /api/v1/palette/disputes/stats/global'
      },
      matching: {
        description: 'Matching IA pour sites de restitution',
        findSites: 'POST /api/v1/palette/matching/find-sites',
        bestSite: 'POST /api/v1/palette/matching/best-site',
        stats: 'GET /api/v1/palette/matching/stats',
        simulate: 'POST /api/v1/palette/matching/simulate',
        coverage: 'GET /api/v1/palette/matching/coverage'
      },
      analytics: {
        description: 'Analytics et prédictions IA',
        predictions: 'GET /api/v1/palette/analytics/predictions/:siteId',
        anomalies: 'GET /api/v1/palette/analytics/anomalies',
        routes: 'GET /api/v1/palette/analytics/routes/:transporterId',
        networkHealth: 'GET /api/v1/palette/analytics/network-health',
        kpis: 'GET /api/v1/palette/analytics/kpis'
      },
      notifications: {
        description: 'Gestion des notifications multi-canaux',
        list: 'GET /api/v1/palette/notifications',
        get: 'GET /api/v1/palette/notifications/:notificationId',
        settings: 'POST /api/v1/palette/notifications/settings',
        getSettings: 'GET /api/v1/palette/notifications/settings/:companyId',
        stats: 'GET /api/v1/palette/notifications/stats/global'
      },
      epal: {
        description: 'Intégration registre EPAL',
        validateSerial: 'POST /api/v1/palette/epal/validate-serial',
        reportMovement: 'POST /api/v1/palette/epal/report-movement',
        stats: 'GET /api/v1/palette/epal/stats',
        sync: 'POST /api/v1/palette/epal/sync/:companyId',
        search: 'GET /api/v1/palette/epal/search/:serialNumber',
        history: 'GET /api/v1/palette/epal/history/:serialNumber'
      }
    },
    palletTypes: ['EURO_EPAL', 'EURO_EPAL_2', 'DEMI_PALETTE', 'PALETTE_PERDUE'],
    chequeStatuses: ['EMIS', 'EN_TRANSIT', 'DEPOSE', 'RECU', 'LITIGE', 'ANNULE'],
    disputeStatuses: ['OPEN', 'PROPOSED', 'RESOLVED', 'ESCALATED', 'REJECTED'],
    security: {
      algorithm: 'Ed25519',
      features: ['Signature cryptographique', 'QR Code', 'Géofencing', 'Horodatage certifié']
    }
  });
});

// Routes API
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/palette/cheques', chequesRoutes);
app.use('/api/v1/palette/ledger', ledgerRoutes);
app.use('/api/v1/palette/sites', sitesRoutes);
app.use('/api/v1/palette/disputes', disputesRoutes);
app.use('/api/v1/palette/matching', matchingRoutes);
app.use('/api/v1/palette/analytics', analyticsRoutes);
app.use('/api/v1/palette/notifications', notificationsRoutes);
app.use('/api/v1/palette/epal', epalRoutes);

// Clé publique pour vérification externe
app.get('/api/v1/public-key', (req, res) => {
  res.json({
    algorithm: 'Ed25519',
    publicKey: getPublicKey(),
    usage: 'Utilisez cette clé pour vérifier les signatures des chèques-palette'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RT Palettes API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Fonction pour réinitialiser les quotas quotidiens (à appeler via cron)
async function resetDailyQuotas() {
  const { default: PalletSite } = await import('./models/PalletSite');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await PalletSite.updateMany(
    { 'quota.lastResetDaily': { $lt: today } },
    {
      $set: {
        'quota.currentDaily': 0,
        'quota.lastResetDaily': new Date()
      }
    }
  );
  console.log('Quotas journaliers réinitialisés');
}

// Fonction pour réinitialiser les quotas hebdomadaires
async function resetWeeklyQuotas() {
  const { default: PalletSite } = await import('./models/PalletSite');
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  await PalletSite.updateMany(
    { 'quota.lastResetWeekly': { $lt: oneWeekAgo } },
    {
      $set: {
        'quota.currentWeekly': 0,
        'quota.lastResetWeekly': new Date()
      }
    }
  );
  console.log('Quotas hebdomadaires réinitialisés');
}

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Réinitialiser les quotas au démarrage
    await resetDailyQuotas();
    await resetWeeklyQuotas();

    // Planifier la réinitialisation quotidienne (minuit)
    setInterval(resetDailyQuotas, 24 * 60 * 60 * 1000);

    // Démarrer le scheduler d'escalation automatique des litiges
    startEscalationScheduler();
    console.log('⏰ Scheduler d\'escalation des litiges démarré');

    app.listen(PORT, () => {
      console.log(`🚀 RT Palettes API v2.0.0 running on port ${PORT}`);
      console.log(`📚 Documentation: http://localhost:${PORT}/`);
      console.log(`🔐 Public Key: http://localhost:${PORT}/api/v1/public-key`);
      console.log(`📊 Analytics: http://localhost:${PORT}/api/v1/palette/analytics/network-health`);
      console.log(`🔔 Notifications: http://localhost:${PORT}/api/v1/palette/notifications`);
      console.log(`🏷️  EPAL Registry: http://localhost:${PORT}/api/v1/palette/epal/stats`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

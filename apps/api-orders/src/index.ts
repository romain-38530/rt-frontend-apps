import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ordersRoutes from './routes/orders';
import invitationsRoutes from './routes/invitations';
import dispatchRoutes from './routes/dispatch';
import lanesRoutes from './routes/lanes';
import scoringRoutes from './routes/scoring';
import archiveRoutes from './routes/archive';
import carrierPortalRoutes from './routes/carrier-portal';
import trackingRoutes from './routes/tracking';
import documentsRoutes from './routes/documents';
import deliveryRoutes from './routes/delivery';
import closureRoutes from './routes/closure';
import preinvoicesRoutes from './routes/preinvoices';
import analyticsRoutes from './routes/analytics';
import aiReportsRoutes from './routes/ai-reports';
import palettesRoutes from './routes/palettes';
import emailActionsRoutes from './routes/email-actions';
import timeoutScheduler from './services/timeout-scheduler';
import preinvoiceScheduler from './services/preinvoice-scheduler';
import aiReportScheduler from './services/ai-report-scheduler';
import issueFollowUpScheduler from './services/issue-followup-scheduler';
import NotificationService from './services/notification-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-orders';

// Middleware - CORS configuration compatible with EB environment
// Liste des origines autorisÃ©es pour SYMPHONI.A
const defaultOrigins = [
  'https://portail-transporteur.symphonia-controltower.com',
  'https://portail.symphonia-controltower.com',
  'https://symphonia-controltower.com',
  'https://www.symphonia-controltower.com',
  'https://app.symphonia-controltower.com',
  'https://admin.symphonia-controltower.com',
  // CloudFront distributions
  'https://d2jq0u0kdciqvq.cloudfront.net',  // Marketing
  'https://d38w2u4cxj2s8a.cloudfront.net',  // Backoffice
  'https://d1234567890.cloudfront.net',      // Web-Industry (placeholder)
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3004'
];

const corsOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
const corsOrigins = corsOriginsEnv
  ? [...defaultOrigins, ...corsOriginsEnv.split(',')]
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Check if origin is in the allowed list
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow all *.symphonia-controltower.com subdomains
    if (origin.endsWith('.symphonia-controltower.com')) {
      return callback(null, true);
    }
    // Allow all *.cloudfront.net (AWS CloudFront)
    if (origin.endsWith('.cloudfront.net')) {
      return callback(null, true);
    }
    // Allow all *.elasticbeanstalk.com (AWS EB)
    if (origin.endsWith('.elasticbeanstalk.com')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-industrial-id', 'x-user-id', 'x-carrier-id']
}));
app.use(express.json());

// Middleware special pour AWS SNS qui envoie en text/plain
app.use('/actions/webhooks', express.text({ type: '*/*' }), (req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Si ce n'est pas du JSON, laisser tel quel
    }
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Orders API',
    version: '2.19.0',
    description: 'API de gestion des commandes SYMPHONI.A - Cycle de vie complet + AI Analytics + Email Automation avec Claude',
    endpoints: {
      health: '/health',
      orders: {
        list: 'GET /api/v1/orders',
        create: 'POST /api/v1/orders',
        get: 'GET /api/v1/orders/:orderId',
        update: 'PUT /api/v1/orders/:orderId',
        cancel: 'PUT /api/v1/orders/:orderId/cancel',
        duplicate: 'POST /api/v1/orders/:orderId/duplicate',
        events: 'GET /api/v1/orders/:orderId/events',
        delete: 'DELETE /api/v1/orders/:orderId',
        resendInvitation: 'POST /api/v1/orders/:orderId/invitations/:invitationId/resend'
      },
      invitations: {
        accept: 'POST /api/v1/invitations/accept',
        get: 'GET /api/v1/invitations/:token'
      },
      dispatch: {
        detectLane: 'POST /api/v1/dispatch/detect-lane/:orderId',
        generateChain: 'POST /api/v1/dispatch/generate-chain/:orderId',
        start: 'POST /api/v1/dispatch/start/:chainId',
        respond: 'POST /api/v1/dispatch/respond/:chainId',
        timeout: 'POST /api/v1/dispatch/timeout/:chainId/:attemptId',
        status: 'GET /api/v1/dispatch/status/:orderId',
        events: 'GET /api/v1/dispatch/events/:orderId',
        auto: 'POST /api/v1/dispatch/auto/:orderId',
        affretiaCallback: 'POST /api/v1/dispatch/affretia-callback',
        affretiaStatus: 'GET /api/v1/dispatch/affretia-status/:orderId',
        cancelAffretia: 'POST /api/v1/dispatch/cancel-affretia/:orderId',
        stats: 'GET /api/v1/dispatch/stats',
        dashboard: 'GET /api/v1/dispatch/dashboard'
      },
      lanes: {
        list: 'GET /api/v1/lanes',
        get: 'GET /api/v1/lanes/:laneId',
        create: 'POST /api/v1/lanes',
        update: 'PUT /api/v1/lanes/:laneId',
        delete: 'DELETE /api/v1/lanes/:laneId',
        addCarrier: 'POST /api/v1/lanes/:laneId/carriers',
        updateCarrier: 'PATCH /api/v1/lanes/:laneId/carriers/:carrierId',
        removeCarrier: 'DELETE /api/v1/lanes/:laneId/carriers/:carrierId',
        reorderCarriers: 'PUT /api/v1/lanes/:laneId/carriers/reorder'
      },
      scoring: {
        calculate: 'POST /api/v1/scoring/calculate',
        carrierGlobal: 'GET /api/v1/scoring/carrier/:carrierId',
        carrierHistory: 'GET /api/v1/scoring/carrier/:carrierId/history',
        topCarriers: 'GET /api/v1/scoring/top',
        stats: 'GET /api/v1/scoring/stats',
        orderScore: 'GET /api/v1/scoring/order/:orderId',
        recalculate: 'POST /api/v1/scoring/recalculate/:carrierId'
      },
      archive: {
        create: 'POST /api/v1/archive/:orderId',
        get: 'GET /api/v1/archive/:archiveId',
        list: 'GET /api/v1/archive',
        search: 'GET /api/v1/archive/search',
        verify: 'POST /api/v1/archive/:archiveId/verify',
        export: 'GET /api/v1/archive/:archiveId/export',
        stats: 'GET /api/v1/archive/stats',
        cleanup: 'POST /api/v1/archive/cleanup'
      },
      carrierPortal: {
        getOrder: 'GET /api/v1/carrier-portal/order/:chainId',
        accept: 'POST /api/v1/carrier-portal/accept/:chainId',
        refuse: 'POST /api/v1/carrier-portal/refuse/:chainId',
        myOrders: 'GET /api/v1/carrier-portal/my-orders',
        pending: 'GET /api/v1/carrier-portal/pending',
        quickRespond: 'GET /api/v1/carrier-portal/quick-respond/:chainId'
      },
      tracking: {
        getStatus: 'GET /api/v1/tracking/:orderId',
        getHistory: 'GET /api/v1/tracking/:orderId/history',
        updatePosition: 'POST /api/v1/tracking/:orderId/position',
        updateMilestone: 'POST /api/v1/tracking/:orderId/milestone',
        updateETA: 'POST /api/v1/tracking/:orderId/eta',
        ping: 'POST /api/v1/tracking/:orderId/ping',
        batch: 'POST /api/v1/tracking/:orderId/batch',
        carrierActive: 'GET /api/v1/tracking/carrier/:carrierId/active'
      },
      documents: {
        uploadUrl: 'POST /api/v1/documents/:orderId/upload-url',
        downloadUrl: 'GET /api/v1/documents/:documentId/download-url',
        upload: 'POST /api/v1/documents/:orderId/upload',
        list: 'GET /api/v1/documents/:orderId',
        detail: 'GET /api/v1/documents/detail/:documentId',
        validate: 'POST /api/v1/documents/:documentId/validate',
        reject: 'POST /api/v1/documents/:documentId/reject',
        sign: 'POST /api/v1/documents/:documentId/sign',
        check: 'GET /api/v1/documents/:orderId/check',
        stats: 'GET /api/v1/documents/stats'
      },
      delivery: {
        confirm: 'POST /api/v1/delivery/:orderId/confirm',
        reportIssue: 'POST /api/v1/delivery/:orderId/issue',
        stats: 'GET /api/v1/delivery/stats'
      },
      closure: {
        check: 'GET /api/v1/closure/:orderId/check',
        close: 'POST /api/v1/closure/:orderId/close',
        autoClose: 'POST /api/v1/closure/auto-close',
        autoArchive: 'POST /api/v1/closure/auto-archive',
        stats: 'GET /api/v1/closure/stats'
      },
      preinvoices: {
        list: 'GET /api/v1/preinvoices',
        stats: 'GET /api/v1/preinvoices/stats',
        export: 'GET /api/v1/preinvoices/export',
        sendMonthly: 'POST /api/v1/preinvoices/send-monthly',
        validate: 'POST /api/v1/preinvoices/:id/validate',
        uploadInvoice: 'POST /api/v1/preinvoices/:id/upload-invoice',
        markPaid: 'POST /api/v1/preinvoices/:id/mark-paid',
        updateCountdowns: 'POST /api/v1/preinvoices/update-countdowns'
      },
      aiReports: {
        industrialLatest: 'GET /api/v1/ai-reports/industrial/:industrialId/latest',
        industrialHistory: 'GET /api/v1/ai-reports/industrial/:industrialId/history',
        carrierLatest: 'GET /api/v1/ai-reports/carrier/:carrierId/latest',
        carrierHistory: 'GET /api/v1/ai-reports/carrier/:carrierId/history',
        logisticianLatest: 'GET /api/v1/ai-reports/logistician/:userId/latest',
        logisticianHistory: 'GET /api/v1/ai-reports/logistician/:userId/history',
        getReport: 'GET /api/v1/ai-reports/:reportId',
        generateIndustrial: 'POST /api/v1/ai-reports/generate/industrial',
        generateCarrier: 'POST /api/v1/ai-reports/generate/carrier',
        generateLogistician: 'POST /api/v1/ai-reports/generate/logistician',
        feedback: 'POST /api/v1/ai-reports/:reportId/feedback',
        triggerMonthly: 'POST /api/v1/ai-reports/trigger-monthly',
        stats: 'GET /api/v1/ai-reports/stats'
      },
      palettes: {
        status: 'GET /api/v1/palettes/:orderId/status',
        pickup: 'POST /api/v1/palettes/:orderId/pickup',
        delivery: 'POST /api/v1/palettes/:orderId/delivery',
        companyBalance: 'GET /api/v1/palettes/company/:companyId/balance'
      },
      emailActions: {
        executeAction: 'GET /actions/:token',
        submitAction: 'POST /actions/:token',
        sesWebhook: 'POST /actions/webhooks/ses-inbound',
        orderEmails: 'GET /api/v1/emails/order/:orderId',
        emailStats: 'GET /api/v1/emails/stats',
        pendingEmails: 'GET /api/v1/emails/pending',
        actionStats: 'GET /api/v1/emails/stats/:orderId?'
      }
    }
  });
});

app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/invitations', invitationsRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/lanes', lanesRoutes);
app.use('/api/v1/scoring', scoringRoutes);
app.use('/api/v1/archive', archiveRoutes);
app.use('/api/v1/carrier-portal', carrierPortalRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/closure', closureRoutes);
app.use('/api/v1/preinvoices', preinvoicesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai-reports', aiReportsRoutes);
app.use('/api/v1/palettes', palettesRoutes);

// Email actions (boutons cliquables + webhooks entrants)
app.use('/actions', emailActionsRoutes);
app.use('/api/v1/emails', emailActionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RT Orders API is running' });
});

// SMTP health check
app.get('/health/smtp', async (req, res) => {
  const result = await NotificationService.checkSmtpConnection();
  res.json(result);
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Supprimer l'index orderNumber problÃ©matique (legacy index pas dans le schÃ©ma)
    try {
      await mongoose.connection.collection('orders').dropIndex('orderNumber_1');
      console.log('[Startup] Dropped legacy orderNumber_1 index');
    } catch (e: any) {
      if (e.code === 27) {
        console.log('[Startup] orderNumber_1 index already dropped or not found');
      } else {
        console.log('[Startup] Could not drop orderNumber index:', e.message);
      }
    }

    // DÃ©marrer le scheduler de timeouts
    timeoutScheduler.start();

    // DÃ©marrer le scheduler de prÃ©facturation (envois mensuels + dÃ©comptes)
    preinvoiceScheduler.start();

    // DÃ©marrer le scheduler de rapports IA mensuels
    aiReportScheduler.start();

    // DÃ©marrer le scheduler de suivi d'incidents (relances horaires)
    issueFollowUpScheduler.start();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('SYMPHONI.A Orders API v2.17.0 - Email Automation avec Claude AI + Issue Follow-up');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  timeoutScheduler.stop();
  preinvoiceScheduler.stop();
  aiReportScheduler.stop();
  issueFollowUpScheduler.stop();
  mongoose.connection.close();
  process.exit(0);
});

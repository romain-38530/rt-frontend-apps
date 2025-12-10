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
import timeoutScheduler from './services/timeout-scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-orders';

// Middleware - CORS configuration compatible with EB environment
// Liste des origines autorisées pour SYMPHONI.A
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

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Orders API',
    version: '2.0.0',
    description: 'API de gestion des commandes SYMPHONI.A - Cycle de vie complet',
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RT Orders API is running' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Supprimer l'index orderNumber problématique (legacy index pas dans le schéma)
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

    // Démarrer le scheduler de timeouts
    timeoutScheduler.start();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('SYMPHONI.A Orders API v2.1 - Dispatch automatique activé');
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
  mongoose.connection.close();
  process.exit(0);
});

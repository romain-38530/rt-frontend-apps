/**
 * API Planning Chargement & Livraison
 * SYMPHONI.A - Contrôle & orchestration des flux physiques
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import ordersRoutes from './routes/orders';
import { planningRouter, bookingsRouter, driverRouter, ecmrRouter, aiRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-planning';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Planning API',
    version: '2.0.0',
    description: 'Module Planning Chargement & Livraison - SYMPHONI.A',
    endpoints: {
      health: '/health',

      // Planning Management
      planning: {
        sites: {
          list: 'GET /api/v1/planning/sites',
          create: 'POST /api/v1/planning/sites',
          get: 'GET /api/v1/planning/sites/:id',
          update: 'PUT /api/v1/planning/sites/:id',
          delete: 'DELETE /api/v1/planning/sites/:id'
        },
        docks: {
          list: 'GET /api/v1/planning/sites/:siteId/docks',
          create: 'POST /api/v1/planning/sites/:siteId/docks',
          update: 'PUT /api/v1/planning/docks/:id',
          updateStatus: 'PUT /api/v1/planning/docks/:id/status'
        },
        slots: {
          list: 'GET /api/v1/planning/slots',
          generate: 'POST /api/v1/planning/slots/generate',
          block: 'PUT /api/v1/planning/slots/:id/block',
          unblock: 'PUT /api/v1/planning/slots/:id/unblock'
        },
        availability: 'GET /api/v1/planning/availability'
      },

      // Bookings/RDV
      bookings: {
        list: 'GET /api/v1/bookings',
        create: 'POST /api/v1/bookings',
        get: 'GET /api/v1/bookings/:id',
        propose: 'POST /api/v1/bookings/:id/propose',
        confirm: 'POST /api/v1/bookings/:id/confirm',
        refuse: 'POST /api/v1/bookings/:id/refuse',
        cancel: 'POST /api/v1/bookings/:id/cancel',
        reschedule: 'PUT /api/v1/bookings/:id/reschedule',
        today: 'GET /api/v1/bookings/today/:siteId',
        pending: 'GET /api/v1/bookings/pending/:siteId'
      },

      // Driver Check-in
      driver: {
        checkin: 'POST /api/v1/driver/checkin',
        status: 'GET /api/v1/driver/status/:bookingId',
        queue: 'GET /api/v1/driver/queue/:siteId',
        call: 'POST /api/v1/driver/call/:checkinId',
        arriveDock: 'POST /api/v1/driver/arrive-dock/:checkinId',
        startLoading: 'POST /api/v1/driver/start-loading/:checkinId',
        endLoading: 'POST /api/v1/driver/end-loading/:checkinId',
        checkout: 'POST /api/v1/driver/checkout/:checkinId',
        geofenceEvent: 'POST /api/v1/driver/geofence-event'
      },

      // eCMR Signature
      ecmr: {
        list: 'GET /api/v1/ecmr',
        create: 'POST /api/v1/ecmr',
        get: 'GET /api/v1/ecmr/:id',
        update: 'PUT /api/v1/ecmr/:id',
        sign: 'POST /api/v1/ecmr/:id/sign',
        validate: 'POST /api/v1/ecmr/:id/validate',
        download: 'GET /api/v1/ecmr/:id/download',
        history: 'GET /api/v1/ecmr/:id/history',
        addPhoto: 'POST /api/v1/ecmr/:id/photo'
      },

      // AI Optimization
      ai: {
        suggestSlots: 'POST /api/v1/ai/suggest-slots',
        optimizePlanning: 'POST /api/v1/ai/optimize-planning',
        resolveConflict: 'POST /api/v1/ai/resolve-conflict',
        predictWaitTime: 'POST /api/v1/ai/predict-wait-time',
        stats: 'GET /api/v1/ai/stats/:siteId'
      },

      // Legacy Orders (backward compatibility)
      orders: {
        list: 'GET /api/v1/orders',
        create: 'POST /api/v1/orders',
        get: 'GET /api/v1/orders/:id',
        update: 'PUT /api/v1/orders/:id',
        delete: 'DELETE /api/v1/orders/:id'
      }
    }
  });
});

// Mount Routes
app.use('/api/v1/planning', planningRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/driver', driverRouter);
app.use('/api/v1/ecmr', ecmrRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/orders', ordersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RT Planning API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
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
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 RT Planning API running on port ${PORT}`);
      console.log(`📋 Documentation: http://localhost:${PORT}/`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

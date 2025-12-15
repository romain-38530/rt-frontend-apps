import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slotsRoutes from './routes/slots';
import docksRoutes from './routes/docks';
import sitesRoutes from './routes/sites';
import bookingsRoutes from './routes/bookings';
import appointmentsRoutes from './routes/appointments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-planning';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Planning API',
    version: '1.0.0',
    description: 'API de gestion des créneaux et docks SYMPHONI.A',
    endpoints: {
      health: '/health',
      sites: {
        list: 'GET /api/v1/sites',
        get: 'GET /api/v1/sites/:siteId',
        create: 'POST /api/v1/sites',
        update: 'PUT /api/v1/sites/:siteId',
        delete: 'DELETE /api/v1/sites/:siteId',
        planning: 'GET /api/v1/sites/:siteId/planning'
      },
      docks: {
        list: 'GET /api/v1/docks',
        get: 'GET /api/v1/docks/:dockId',
        create: 'POST /api/v1/docks',
        update: 'PUT /api/v1/docks/:dockId',
        open: 'POST /api/v1/docks/:dockId/open',
        close: 'POST /api/v1/docks/:dockId/close',
        maintenance: 'POST /api/v1/docks/:dockId/maintenance',
        delete: 'DELETE /api/v1/docks/:dockId'
      },
      slots: {
        list: 'GET /api/v1/slots',
        get: 'GET /api/v1/slots/:slotId',
        create: 'POST /api/v1/slots',
        generate: 'POST /api/v1/slots/generate',
        update: 'PUT /api/v1/slots/:slotId',
        block: 'POST /api/v1/slots/:slotId/block',
        unblock: 'POST /api/v1/slots/:slotId/unblock',
        delete: 'DELETE /api/v1/slots/:slotId'
      },
      bookings: {
        list: 'GET /api/v1/bookings',
        get: 'GET /api/v1/bookings/:bookingId',
        create: 'POST /api/v1/bookings',
        update: 'PUT /api/v1/bookings/:bookingId',
        confirm: 'POST /api/v1/bookings/:bookingId/confirm',
        cancel: 'POST /api/v1/bookings/:bookingId/cancel',
        checkin: 'POST /api/v1/bookings/:bookingId/checkin',
        checkout: 'POST /api/v1/bookings/:bookingId/checkout',
        delete: 'DELETE /api/v1/bookings/:bookingId'
      }
    }
  });
});

// Routes avec préfixe /planning pour correspondre au frontend
app.use('/api/v1/planning/sites', sitesRoutes);
app.use('/api/v1/planning/docks', docksRoutes);
app.use('/api/v1/planning/slots', slotsRoutes);
app.use('/api/v1/planning/bookings', bookingsRoutes);
app.use('/api/v1/planning/appointments', appointmentsRoutes);

// Alias sans préfixe pour compatibilité
app.use('/api/v1/sites', sitesRoutes);
app.use('/api/v1/docks', docksRoutes);
app.use('/api/v1/slots', slotsRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RT Planning API is running' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

/**
 * AFFRET.IA API v2.0
 * Affréteur Virtuel Intelligent - Backend Service
 * Port: 3017
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import http from 'http';

// Routes
import triggerRoutes from './routes/trigger';
import broadcastRoutes from './routes/broadcast';
import proposalsRoutes from './routes/proposals';
import selectionRoutes from './routes/selection';
import assignRoutes from './routes/assign';
import trackingRoutes from './routes/tracking';
import vigilanceRoutes from './routes/vigilance';
import documentsRoutes from './routes/documents';
import statsRoutes from './routes/stats';
import bourseRoutes from './routes/bourse';

// Events
import { initializeEventEmitter, getEventEmitter } from './modules/events';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3017;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-affretia';

// Socket.io pour événements temps réel
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
  }
});

// Initialiser l'émetteur d'événements avec Socket.io
initializeEventEmitter(io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Injecter io dans les requêtes
app.use((req: any, res, next) => {
  req.io = io;
  req.eventEmitter = getEventEmitter();
  next();
});

// Routes API v1
const apiV1 = '/api/v1';

app.get('/', (req, res) => {
  res.json({
    name: 'AFFRET.IA API',
    version: '2.0.0',
    description: 'Affréteur Virtuel Intelligent - 24/7',
    endpoints: {
      health: '/health',
      trigger: `${apiV1}/affretia/trigger`,
      broadcast: `${apiV1}/affretia/broadcast`,
      proposals: `${apiV1}/affretia/proposals`,
      selection: `${apiV1}/affretia/select`,
      assign: `${apiV1}/affretia/assign`,
      tracking: `${apiV1}/affretia/tracking`,
      vigilance: `${apiV1}/affretia/vigilance`,
      documents: `${apiV1}/affretia/documents`,
      stats: `${apiV1}/affretia/stats`,
      bourse: `${apiV1}/affretia/bourse`
    }
  });
});

// Mount routes
app.use(`${apiV1}/affretia/trigger`, triggerRoutes);
app.use(`${apiV1}/affretia/broadcast`, broadcastRoutes);
app.use(`${apiV1}/affretia/proposals`, proposalsRoutes);
app.use(`${apiV1}/affretia/select`, selectionRoutes);
app.use(`${apiV1}/affretia/assign`, assignRoutes);
app.use(`${apiV1}/affretia/tracking`, trackingRoutes);
app.use(`${apiV1}/affretia/vigilance`, vigilanceRoutes);
app.use(`${apiV1}/affretia/documents`, documentsRoutes);
app.use(`${apiV1}/affretia/stats`, statsRoutes);
app.use(`${apiV1}/affretia/bourse`, bourseRoutes);

// Legacy routes compatibility
app.use(`${apiV1}/affretia/sessions`, triggerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AFFRET.IA API',
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join organization room
  socket.on('join:organization', (organizationId: string) => {
    socket.join(`org:${organizationId}`);
    console.log(`Socket ${socket.id} joined org:${organizationId}`);
  });

  // Join session room
  socket.on('join:session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session:${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 AFFRET.IA API running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export { io };

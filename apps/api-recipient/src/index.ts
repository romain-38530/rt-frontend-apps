import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
import onboardingRoutes from './routes/onboarding';
import recipientsRoutes from './routes/recipients';
import deliveriesRoutes from './routes/deliveries';
import signaturesRoutes from './routes/signatures';
import incidentsRoutes from './routes/incidents';
import chatRoutes from './routes/chat';
import notificationsRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3018;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-recipient';

// Middleware de base
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Route de santé
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-recipient',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Route d'information de l'API
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RT Technologie - Recipient API',
    version: '1.0.0',
    description: 'API de gestion des destinataires, livraisons, signatures et incidents',
    port: PORT,
    endpoints: {
      onboarding: '/onboarding/*',
      recipients: '/recipients/*',
      deliveries: '/deliveries/*',
      signatures: '/signatures/*',
      incidents: '/incidents/*',
      chat: '/chats/*',
      notifications: '/notifications/*'
    },
    documentation: '/api-docs',
    health: '/health'
  });
});

// Routes de l'API
app.use('/onboarding', onboardingRoutes);
app.use('/recipients', recipientsRoutes);
app.use('/deliveries', deliveriesRoutes);
app.use('/signatures', signaturesRoutes);
app.use('/incidents', incidentsRoutes);
app.use('/chats', chatRoutes);
app.use('/notifications', notificationsRoutes);

// Gestion des erreurs 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Middleware de gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB (Recipient Database)');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Gestion des événements MongoDB
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Gestion de l'arrêt gracieux
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Démarrage du serveur
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    // Démarrage du serveur Express
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ================================================');
      console.log('   RT Technologie - Recipient API');
      console.log('================================================');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   MongoDB: ${mongoose.connection.name}`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   - POST   /onboarding/invite`);
      console.log(`   - GET    /onboarding/validate/:token`);
      console.log(`   - POST   /onboarding/register`);
      console.log(`   - PUT    /onboarding/sites`);
      console.log(`   - PUT    /onboarding/contacts`);
      console.log(`   - POST   /onboarding/complete`);
      console.log('');
      console.log(`   - GET    /recipients/me`);
      console.log(`   - PUT    /recipients/me`);
      console.log(`   - GET    /recipients/me/sites`);
      console.log(`   - POST   /recipients/me/sites`);
      console.log(`   - PUT    /recipients/me/sites/:siteId`);
      console.log(`   - PUT    /recipients/me/settings`);
      console.log('');
      console.log(`   - GET    /deliveries`);
      console.log(`   - GET    /deliveries/:id`);
      console.log(`   - GET    /deliveries/:id/tracking`);
      console.log(`   - GET    /deliveries/:id/documents`);
      console.log(`   - GET    /deliveries/:id/timeline`);
      console.log(`   - GET    /deliveries/today/:siteId`);
      console.log(`   - GET    /deliveries/upcoming`);
      console.log('');
      console.log(`   - POST   /signatures/scan-qr`);
      console.log(`   - POST   /signatures/receive`);
      console.log(`   - POST   /signatures/receive-partial`);
      console.log(`   - POST   /signatures/refuse`);
      console.log(`   - GET    /signatures/:deliveryId`);
      console.log(`   - POST   /signatures/photos`);
      console.log('');
      console.log(`   - POST   /incidents`);
      console.log(`   - GET    /incidents`);
      console.log(`   - GET    /incidents/:id`);
      console.log(`   - PUT    /incidents/:id`);
      console.log(`   - POST   /incidents/:id/photos`);
      console.log(`   - POST   /incidents/:id/acknowledge`);
      console.log(`   - POST   /incidents/:id/resolve`);
      console.log('');
      console.log(`   - GET    /chats`);
      console.log(`   - POST   /chats`);
      console.log(`   - GET    /chats/:id`);
      console.log(`   - POST   /chats/:id/messages`);
      console.log(`   - PUT    /chats/:id/read`);
      console.log('');
      console.log(`   - GET    /notifications`);
      console.log(`   - PUT    /notifications/:id/read`);
      console.log(`   - PUT    /notifications/read-all`);
      console.log('');
      console.log(`   - GET    /health`);
      console.log('');
      console.log('================================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

export default app;

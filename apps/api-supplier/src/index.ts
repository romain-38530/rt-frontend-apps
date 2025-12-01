import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import onboardingRoutes from './routes/onboarding';
import suppliersRoutes from './routes/suppliers';
import ordersRoutes from './routes/orders';
import slotsRoutes from './routes/slots';
import signaturesRoutes from './routes/signatures';
import chatRoutes from './routes/chat';
import notificationsRoutes from './routes/notifications';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3017;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-supplier',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API Routes
app.use('/onboarding', onboardingRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/orders', ordersRoutes);
app.use('/slots', slotsRoutes);
app.use('/signatures', signaturesRoutes);
app.use('/chats', chatRoutes);
app.use('/notifications', notificationsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'RT Technologie - Supplier API',
    version: '1.0.0',
    description: 'API de gestion des fournisseurs, créneaux de chargement et signatures électroniques',
    endpoints: {
      onboarding: {
        'POST /onboarding/invite': 'Inviter un fournisseur',
        'GET /onboarding/validate/:token': 'Valider un token d\'invitation',
        'POST /onboarding/register': 'Créer un compte fournisseur',
        'PUT /onboarding/contacts': 'Configurer les contacts',
        'POST /onboarding/complete': 'Finaliser l\'onboarding'
      },
      suppliers: {
        'GET /suppliers/me': 'Profil du fournisseur connecté',
        'PUT /suppliers/me': 'Mettre à jour le profil',
        'GET /suppliers/me/industrials': 'Liste des industriels liés',
        'PUT /suppliers/me/settings': 'Paramètres du fournisseur',
        'GET /suppliers': 'Liste des fournisseurs (pour industriels)'
      },
      orders: {
        'GET /orders': 'Liste des commandes avec filtres',
        'GET /orders/:id': 'Détail d\'une commande',
        'PUT /orders/:id/status': 'Mettre à jour le statut',
        'POST /orders/:id/documents': 'Upload un document',
        'GET /orders/:id/documents': 'Liste des documents',
        'GET /orders/:id/timeline': 'Historique des événements'
      },
      slots: {
        'GET /slots': 'Créneaux proposés',
        'GET /slots/:orderId': 'Créneau pour une commande',
        'POST /slots/:id/accept': 'Accepter un créneau',
        'POST /slots/:id/modify': 'Proposer une modification',
        'POST /slots/:id/reject': 'Refuser un créneau',
        'GET /slots/availability': 'Disponibilités',
        'POST /slots/propose': 'Proposer un nouveau créneau'
      },
      signatures: {
        'POST /signatures/loading': 'Signer un bon de chargement',
        'POST /signatures/qrcode/generate': 'Générer un QR code',
        'POST /signatures/qrcode/scan': 'Scanner et signer via QR',
        'GET /signatures/:orderId': 'Signatures pour une commande',
        'POST /signatures/verify': 'Vérifier une signature'
      },
      chat: {
        'GET /chats': 'Liste des conversations',
        'POST /chats': 'Créer une conversation',
        'GET /chats/:id': 'Détail d\'une conversation',
        'POST /chats/:id/messages': 'Envoyer un message',
        'POST /chats/:id/template': 'Envoyer un message template',
        'PUT /chats/:id/read': 'Marquer comme lu'
      },
      notifications: {
        'GET /notifications': 'Liste des notifications',
        'PUT /notifications/:id/read': 'Marquer comme lue',
        'PUT /notifications/read-all': 'Tout marquer comme lu',
        'GET /notifications/settings': 'Paramètres de notification',
        'POST /notifications/settings': 'Mettre à jour les paramètres'
      }
    },
    events: [
      'fournisseur.onboard.completed',
      'fournisseur.order.status_changed',
      'fournisseur.rdv.validated',
      'fournisseur.rdv.updated',
      'fournisseur.signature.completed',
      'fournisseur.document.uploaded'
    ],
    documentation: 'https://docs.rt-technologie.fr/api/supplier'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-supplier';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('RT Technologie - Supplier API');
    console.log('='.repeat(60));
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Documentation: http://localhost:${PORT}/`);
    console.log('='.repeat(60));
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;

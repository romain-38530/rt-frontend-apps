/**
 * API Storage Market - Bourse de Stockage SYMPHONI.A
 *
 * API complète pour la gestion de la marketplace de stockage:
 * - Besoins de stockage (industriels)
 * - Offres des logisticiens
 * - Gestion des capacités/sites
 * - Contrats
 * - Abonnements
 * - Moteur IA (scoring, ranking, RFP)
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Legacy routes
import ordersRoutes from './routes/orders';

// New Storage Market routes
import {
  needsRouter,
  offersRouter,
  capacityRouter,
  contractsRouter,
  subscriptionsRouter,
  aiRouter
} from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storage-market';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-storage',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Info
app.get('/', (req, res) => {
  res.json({
    service: 'Storage Market API',
    version: '2.0.0',
    description: 'API Bourse de Stockage SYMPHONI.A',
    endpoints: {
      legacy: {
        orders: '/api/v1/orders'
      },
      storageMarket: {
        needs: '/api/storage-market/needs',
        offers: '/api/storage-market/offers',
        capacity: '/api/storage-market/capacity',
        contracts: '/api/storage-market/contracts',
        subscriptions: '/api/storage-market/subscriptions',
        ai: '/api/storage-market/ai'
      }
    },
    documentation: '/api/storage-market/docs'
  });
});

// Legacy Orders routes (backwards compatibility)
app.use('/api/v1/orders', ordersRoutes);

// Storage Market API Router
const storageMarketRouter = express.Router();

storageMarketRouter.use('/needs', needsRouter);
storageMarketRouter.use('/offers', offersRouter);
storageMarketRouter.use('/capacity', capacityRouter);
storageMarketRouter.use('/contracts', contractsRouter);
storageMarketRouter.use('/subscriptions', subscriptionsRouter);
storageMarketRouter.use('/ai', aiRouter);

// Documentation endpoint
storageMarketRouter.get('/docs', (req, res) => {
  res.json({
    title: 'Storage Market API Documentation',
    version: '2.0.0',
    baseUrl: '/api/storage-market',
    endpoints: {
      needs: {
        'GET /needs': 'Liste des besoins de stockage',
        'GET /needs/my': 'Mes besoins',
        'GET /needs/published': 'Besoins publiés (pour logisticiens)',
        'GET /needs/:id': 'Détail d\'un besoin',
        'POST /needs': 'Créer un besoin',
        'PUT /needs/:id': 'Modifier un besoin',
        'POST /needs/:id/publish': 'Publier un besoin',
        'POST /needs/:id/close': 'Clôturer un besoin',
        'POST /needs/:id/attribute': 'Attribuer à un logisticien',
        'DELETE /needs/:id': 'Supprimer (brouillon)',
        'GET /needs/:id/stats': 'Statistiques'
      },
      offers: {
        'GET /offers': 'Liste des offres',
        'GET /offers/my': 'Mes offres (logisticien)',
        'GET /offers/for-need/:needId': 'Offres pour un besoin',
        'GET /offers/:id': 'Détail d\'une offre',
        'POST /offers': 'Soumettre une offre',
        'PUT /offers/:id': 'Modifier une offre',
        'POST /offers/:id/withdraw': 'Retirer une offre',
        'POST /offers/:id/shortlist': 'Mettre en shortlist',
        'POST /offers/:id/accept': 'Accepter une offre',
        'POST /offers/:id/reject': 'Rejeter une offre',
        'POST /offers/:id/counter': 'Contre-offre',
        'POST /offers/:id/respond-counter': 'Répondre à contre-offre'
      },
      capacity: {
        'GET /capacity/sites': 'Sites disponibles',
        'GET /capacity/sites/nearby': 'Sites à proximité',
        'GET /capacity/my-sites': 'Mes sites',
        'GET /capacity/sites/:id': 'Détail site',
        'POST /capacity/sites': 'Créer un site',
        'PUT /capacity/sites/:id': 'Modifier un site',
        'PATCH /capacity/sites/:id/capacity': 'Mise à jour capacité',
        'DELETE /capacity/sites/:id': 'Désactiver site',
        'GET /capacity/stats': 'Statistiques',
        'GET /capacity/regions': 'Régions disponibles'
      },
      contracts: {
        'GET /contracts': 'Liste des contrats',
        'GET /contracts/active': 'Contrats actifs',
        'GET /contracts/:id': 'Détail contrat',
        'POST /contracts/from-offer': 'Créer depuis offre',
        'POST /contracts': 'Créer manuellement',
        'PUT /contracts/:id': 'Modifier (brouillon)',
        'POST /contracts/:id/send-for-signature': 'Envoyer pour signature',
        'POST /contracts/:id/sign': 'Signer',
        'POST /contracts/:id/suspend': 'Suspendre',
        'POST /contracts/:id/terminate': 'Résilier',
        'POST /contracts/:id/amendment': 'Créer avenant',
        'PATCH /contracts/:id/execution': 'MAJ exécution (WMS)',
        'POST /contracts/:id/incident': 'Signaler incident',
        'GET /contracts/:id/invoices': 'Factures',
        'GET /contracts/stats/summary': 'Statistiques'
      },
      subscriptions: {
        'GET /subscriptions/my': 'Mon abonnement',
        'GET /subscriptions/plans': 'Plans disponibles',
        'POST /subscriptions/register': 'S\'inscrire (guest)',
        'POST /subscriptions/upgrade': 'Passer à tier supérieur',
        'POST /subscriptions/downgrade': 'Rétrograder',
        'POST /subscriptions/cancel': 'Annuler',
        'GET /subscriptions/usage': 'Usage vs limites',
        'GET /subscriptions/billing-history': 'Historique facturation',
        'PUT /subscriptions/contact': 'MAJ contact',
        'PUT /subscriptions/payment': 'MAJ paiement',
        'GET /subscriptions/metrics': 'Métriques performance',
        'POST /subscriptions/start-trial': 'Essai gratuit'
      },
      ai: {
        'POST /ai/score-offer': 'Scorer une offre',
        'POST /ai/rank-offers': 'Classer les offres',
        'POST /ai/generate-rfp': 'Générer cahier des charges',
        'POST /ai/analyze-response': 'Analyser une réponse',
        'POST /ai/recommend-logisticians': 'Recommander logisticiens',
        'GET /ai/market-insights': 'Insights marché'
      }
    },
    authentication: {
      type: 'Header-based',
      headers: {
        'x-user-id': 'ID utilisateur',
        'x-org-id': 'ID organisation',
        'x-user-type': 'Type: industrial | logistician | admin'
      }
    }
  });
});

// Mount Storage Market router
app.use('/api/storage-market', storageMarketRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Database connection and server start
async function start() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏪 Storage Market API - SYMPHONI.A                  ║
║                                                       ║
║   Server running on port ${PORT}                        ║
║   API Base: http://localhost:${PORT}/api/storage-market ║
║   Docs: http://localhost:${PORT}/api/storage-market/docs║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

start();

export default app;

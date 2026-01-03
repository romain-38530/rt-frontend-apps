import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import http from 'http';

// Import routes
import conversationsRoutes from './routes/conversations';
import messagesRoutes from './routes/messages';
import ticketsRoutes from './routes/tickets';
import knowledgeRoutes from './routes/knowledge';
import faqRoutes from './routes/faq';
import diagnosticsRoutes from './routes/diagnostics';
import statsRoutes from './routes/stats';

// Import middleware
import { authenticateToken, optionalAuth } from './middleware/auth';

// Import services
import { startHealthMonitoring } from './services/diagnostics-service';

// Import initial data
import { initialFAQs } from './data/initial-faq';
import { initialKnowledgeArticles } from './data/knowledge-base';
import FAQ from './models/FAQ';
import KnowledgeArticle from './models/KnowledgeArticle';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3016;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-chatbot';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes publiques (sans authentification)
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Chatbot API',
    version: '1.0.0',
    description: 'API complète de Chatbot IA avec intégration Claude',
    endpoints: {
      health: '/health',
      conversations: {
        create: 'POST /api/v1/conversations',
        list: 'GET /api/v1/conversations',
        get: 'GET /api/v1/conversations/:id',
        close: 'POST /api/v1/conversations/:id/close',
        feedback: 'POST /api/v1/conversations/:id/feedback',
        escalate: 'POST /api/v1/conversations/:id/escalate',
      },
      messages: {
        send: 'POST /api/v1/conversations/:id/messages',
        list: 'GET /api/v1/conversations/:id/messages',
      },
      tickets: {
        create: 'POST /api/v1/tickets',
        list: 'GET /api/v1/tickets',
        get: 'GET /api/v1/tickets/:id',
        update: 'PUT /api/v1/tickets/:id',
        assign: 'POST /api/v1/tickets/:id/assign',
        resolve: 'POST /api/v1/tickets/:id/resolve',
      },
      knowledge: {
        search: 'GET /api/v1/knowledge',
        get: 'GET /api/v1/knowledge/:id',
        helpful: 'POST /api/v1/knowledge/:id/helpful',
      },
      faq: {
        list: 'GET /api/v1/faq',
        search: 'GET /api/v1/faq/search',
        grouped: 'GET /api/v1/faq/grouped/:botType',
      },
      diagnostics: {
        run: 'POST /api/v1/diagnostics/run',
        status: 'GET /api/v1/diagnostics/status',
        service: 'GET /api/v1/diagnostics/:service',
      },
      stats: {
        conversations: 'GET /api/v1/stats/conversations',
        resolution: 'GET /api/v1/stats/resolution',
        tickets: 'GET /api/v1/stats/tickets',
      },
    },
    botTypes: [
      'helpbot',
      'planif-ia',
      'routier',
      'quai-wms',
      'livraisons',
      'expedition',
      'freight-ia',
      'copilote',
    ],
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RT Chatbot API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes API avec authentification optionnelle pour certaines
// La plupart des routes nécessitent l'authentification, mais FAQ et Knowledge peuvent être publiques

// FAQ - publique (optionalAuth permet d'enrichir si authentifié)
app.use('/api/v1/faq', optionalAuth, faqRoutes);

// Knowledge - publique
app.use('/api/v1/knowledge', optionalAuth, knowledgeRoutes);

// Diagnostics - publique pour consultation, authentification pour actions
app.use('/api/v1/diagnostics', optionalAuth, diagnosticsRoutes);

// Routes nécessitant authentification
app.use('/api/v1/conversations', authenticateToken, conversationsRoutes);
app.use('/api/v1/conversations', authenticateToken, messagesRoutes);
app.use('/api/v1/tickets', authenticateToken, ticketsRoutes);
app.use('/api/v1/stats', authenticateToken, statsRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialiser les données par défaut
async function initializeDefaultData() {
  try {
    // Vérifier si des FAQ existent déjà
    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      console.log('Initializing default FAQs...');
      await FAQ.insertMany(initialFAQs);
      console.log(`Inserted ${initialFAQs.length} FAQs`);
    }

    // Vérifier si des articles existent déjà
    const articleCount = await KnowledgeArticle.countDocuments();
    if (articleCount === 0) {
      console.log('Initializing default knowledge articles...');
      await KnowledgeArticle.insertMany(initialKnowledgeArticles);
      console.log(`Inserted ${initialKnowledgeArticles.length} knowledge articles`);
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Initialiser les données par défaut
    await initializeDefaultData();

    // Créer le serveur HTTP
    const server = http.createServer(app);

    // Initialiser WebSocket
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('WebSocket message:', data);

          // Gérer différents types de messages
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
              break;

            case 'subscribe':
              // S'abonner à des mises à jour (conversations, tickets, etc.)
              ws.send(JSON.stringify({
                type: 'subscribed',
                channel: data.channel,
                timestamp: new Date(),
              }));
              break;

            default:
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type',
              }));
          }
        } catch (error) {
          console.error('WebSocket error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Envoyer message de bienvenue
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to RT Chatbot WebSocket',
        timestamp: new Date(),
      }));
    });

    // Démarrer le monitoring de santé des services (toutes les 5 minutes)
    if (process.env.ENABLE_HEALTH_MONITORING === 'true') {
      console.log('Starting health monitoring...');
      startHealthMonitoring(5);
    }

    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`🤖 RT Chatbot API running on port ${PORT}`);
      console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
      console.log(`🔗 API documentation at http://localhost:${PORT}/`);
      console.log(`💚 Health check at http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

export default app;

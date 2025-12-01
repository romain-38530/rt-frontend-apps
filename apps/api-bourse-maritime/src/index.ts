import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import freightRequestsRouter from './routes/freight-requests';
import bidsRouter from './routes/bids';
import contractsRouter from './routes/contracts';
import carriersRouter from './routes/carriers';
import searchRouter from './routes/search';
import alertsRouter from './routes/alerts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3019;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bourse-maritime';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-bourse-maritime',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Documentation at root
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Bourse Maritime API',
    version: '1.0.0',
    description: 'Maritime freight marketplace for SYMPHONI.A platform',
    endpoints: {
      freightRequests: {
        'POST /api/v1/freight-requests': 'Create freight request',
        'GET /api/v1/freight-requests': 'List freight requests with filters (origin, destination, type, dateRange, status)',
        'GET /api/v1/freight-requests/:id': 'Get freight request details',
        'PUT /api/v1/freight-requests/:id': 'Update freight request',
        'DELETE /api/v1/freight-requests/:id': 'Cancel freight request',
        'POST /api/v1/freight-requests/:id/publish': 'Publish to marketplace',
        'POST /api/v1/freight-requests/:id/close': 'Close bidding'
      },
      bids: {
        'POST /api/v1/freight-requests/:id/bids': 'Submit bid',
        'GET /api/v1/freight-requests/:id/bids': 'List bids for request',
        'GET /api/v1/bids/my': 'Get my submitted bids',
        'PUT /api/v1/bids/:id': 'Update bid',
        'DELETE /api/v1/bids/:id': 'Withdraw bid',
        'POST /api/v1/bids/:id/accept': 'Accept bid (shipper)',
        'POST /api/v1/bids/:id/reject': 'Reject bid'
      },
      contracts: {
        'GET /api/v1/contracts': 'List contracts',
        'GET /api/v1/contracts/:id': 'Get contract details',
        'POST /api/v1/contracts/:id/sign': 'Sign contract',
        'GET /api/v1/contracts/:id/documents': 'Get contract documents',
        'POST /api/v1/contracts/:id/documents': 'Upload contract document'
      },
      carriers: {
        'GET /api/v1/carriers': 'List verified carriers',
        'GET /api/v1/carriers/:id': 'Get carrier profile',
        'GET /api/v1/carriers/:id/ratings': 'Get carrier ratings',
        'POST /api/v1/carriers/:id/rate': 'Rate carrier',
        'POST /api/v1/carriers/register': 'Register as carrier',
        'PUT /api/v1/carriers/profile': 'Update carrier profile'
      },
      searchAndMatching: {
        'GET /api/v1/search/routes': 'Search available routes',
        'GET /api/v1/search/carriers': 'Search carriers by criteria',
        'POST /api/v1/search/match/freight': 'AI matching for freight requests',
        'GET /api/v1/search/market/stats': 'Market statistics'
      },
      alerts: {
        'POST /api/v1/alerts': 'Create price/route alert',
        'GET /api/v1/alerts': 'Get my alerts',
        'GET /api/v1/alerts/:id': 'Get alert details',
        'PUT /api/v1/alerts/:id': 'Update alert',
        'DELETE /api/v1/alerts/:id': 'Delete alert',
        'PATCH /api/v1/alerts/:id/toggle': 'Toggle alert active status'
      }
    },
    features: {
      freightManagement: 'Create and manage freight requests with detailed cargo and route information',
      bidding: 'Transparent bidding system for carriers to submit competitive offers',
      aiMatching: 'Intelligent carrier matching based on route expertise, reliability, fleet suitability, and pricing',
      contracts: 'Digital contract management with electronic signatures',
      ratings: 'Comprehensive carrier rating and review system',
      marketIntelligence: 'Real-time market statistics and pricing trends',
      alerts: 'Customizable alerts for routes, prices, and carrier availability'
    },
    documentation: 'https://docs.symphoni-a.com/bourse-maritime',
    support: 'support@symphoni-a.com'
  });
});

// Mount API routes
app.use('/api/v1/freight-requests', freightRequestsRouter);
app.use('/api/v1/bids', bidsRouter);
app.use('/api/v1/contracts', contractsRouter);
app.use('/api/v1/carriers', carriersRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/alerts', alertsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Database:', MONGODB_URI);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Bourse Maritime API - SYMPHONI.A Platform');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

export default app;

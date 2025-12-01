import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  prefacturationRouter,
  invoiceRouter,
  discrepancyRouter,
  blockRouter,
  exportRouter,
  tariffRouter,
  vigilanceRouter,
  statsRouter
} from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3014;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-billing';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-billing',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/billing/prefacturation', prefacturationRouter);
app.use('/api/billing/invoice', invoiceRouter);
app.use('/api/billing/discrepancy', discrepancyRouter);
app.use('/api/billing/block', blockRouter);
app.use('/api/billing/export', exportRouter);
app.use('/api/billing/tariffs', tariffRouter);
app.use('/api/billing/vigilance', vigilanceRouter);
app.use('/api/billing/stats', statsRouter);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`API Billing service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mongoose.connection.close();
  process.exit(0);
});

export default app;

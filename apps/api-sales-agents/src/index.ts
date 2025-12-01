import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { initScheduler } from './services/scheduler';

// Routes
import agentsRouter from './routes/agents';
import contractsRouter from './routes/contracts';
import commissionsRouter from './routes/commissions';
import challengesRouter from './routes/challenges';
import clientsRouter from './routes/clients';
import portalRouter from './routes/portal';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3015;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-agents';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-sales-agents',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount routes
app.use('/agents', agentsRouter);
app.use('/contracts', contractsRouter);
app.use('/commissions', commissionsRouter);
app.use('/challenges', challengesRouter);
app.use('/clients', clientsRouter);
app.use('/portal', portalRouter);
app.use('/dashboard', dashboardRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected successfully');

    // Initialize monthly commission scheduler
    initScheduler();
    console.log('✓ Commission scheduler initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ API Sales Agents service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.connection.close();
  console.log('✓ MongoDB connection closed');
  process.exit(0);
});

export default app;

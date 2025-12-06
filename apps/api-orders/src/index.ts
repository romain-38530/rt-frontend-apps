import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ordersRoutes from './routes/orders';
import invitationsRoutes from './routes/invitations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-orders';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Orders API',
    version: '1.0.0',
    description: 'API de gestion des commandes SYMPHONI.A avec accès portail expéditeur/destinataire',
    endpoints: {
      health: '/health',
      orders: {
        list: 'GET /api/v1/orders',
        create: 'POST /api/v1/orders',
        get: 'GET /api/v1/orders/:orderId',
        update: 'PUT /api/v1/orders/:orderId',
        cancel: 'PUT /api/v1/orders/:orderId/cancel',
        duplicate: 'POST /api/v1/orders/:orderId/duplicate',
        events: 'GET /api/v1/orders/:orderId/events',
        delete: 'DELETE /api/v1/orders/:orderId',
        resendInvitation: 'POST /api/v1/orders/:orderId/invitations/:invitationId/resend'
      },
      invitations: {
        accept: 'POST /api/v1/invitations/accept',
        get: 'GET /api/v1/invitations/:token'
      }
    }
  });
});

app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/invitations', invitationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RT Orders API is running' });
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

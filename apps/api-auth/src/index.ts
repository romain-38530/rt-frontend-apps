import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import logisticianRoutes from './routes/logisticians';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-auth';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'RT Technologie Authentication API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      logisticians: {
        invite: 'POST /api/v1/logisticians/invite',
        validate: 'GET /api/v1/logisticians/validate/:token',
        register: 'POST /api/v1/logisticians/register',
        list: 'GET /api/v1/logisticians',
        get: 'GET /api/v1/logisticians/:id',
        update: 'PUT /api/v1/logisticians/:id',
        suspend: 'POST /api/v1/logisticians/:id/suspend',
        reactivate: 'POST /api/v1/logisticians/:id/reactivate',
        delete: 'DELETE /api/v1/logisticians/:id',
        shareOrder: 'POST /api/v1/logisticians/orders/share',
        revokeAccess: 'POST /api/v1/logisticians/orders/revoke',
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/logisticians', logisticianRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RT Auth API is running' });
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

/**
 * Configuration CORS sécurisée
 */

import { CorsOptions } from 'cors';

// Origines autorisées par environnement
const ALLOWED_ORIGINS: string[] = [];

// Production
if (process.env.NODE_ENV === 'production') {
  ALLOWED_ORIGINS.push(
    'https://admin.rt-technologie.com',
    'https://app.rt-technologie.com',
    'https://crm.rt-technologie.com',
    'https://affret-ia.rt-technologie.com',
    'https://app.symphonia-controltower.com',
    'https://symphonia-controltower.com',
    'https://www.symphonia-controltower.com'
  );

  // Ajouter les origines personnalisées depuis env
  if (process.env.CORS_ALLOWED_ORIGINS) {
    ALLOWED_ORIGINS.push(...process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()));
  }
}

// Développement
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3020',
    'http://localhost:5173', // Vite
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  );
}

// Logger pour déboguer
const logCorsRejection = (origin: string | undefined) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[CORS] Rejected origin: ${origin}`);
  }
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Mode permissif en développement si configuré
    if (process.env.CORS_ORIGIN === '*' && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logCorsRejection(origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 heures - cache preflight
};

export default corsOptions;

# Cahier des Charges - Backoffice RT Admin API

**Version:** 1.0
**Date:** 31 décembre 2024
**Projet:** Modernisation et sécurisation du backoffice RT Admin API

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Phase 1 - Sécurité critique](#2-phase-1---sécurité-critique)
3. [Phase 2 - Monitoring et observabilité](#3-phase-2---monitoring-et-observabilité)
4. [Phase 3 - Complétion des fonctionnalités](#4-phase-3---complétion-des-fonctionnalités)
5. [Phase 4 - Documentation et tests](#5-phase-4---documentation-et-tests)
6. [Phase 5 - Optimisation scraping B2PWeb](#6-phase-5---optimisation-scraping-b2pweb)
7. [Architecture cible](#7-architecture-cible)
8. [Planning prévisionnel](#8-planning-prévisionnel)
9. [Annexes](#9-annexes)

---

## 1. Contexte et objectifs

### 1.1 État actuel

Le backoffice RT Admin API est une application Express.js déployée sur AWS Elastic Beanstalk qui gère :
- **103 endpoints** répartis sur **13 fichiers de routes**
- **27 modèles MongoDB** (Mongoose)
- Un système CRM complet (leads, pipeline, portail commercial)
- Un service de scraping B2PWeb (transporteurs)
- Gestion des utilisateurs, entreprises, abonnements, modules

### 1.2 Audit de l'existant

| Catégorie | État | Pourcentage |
|-----------|------|-------------|
| Endpoints complets | 85/103 | 82% |
| Endpoints incomplets | 12/103 | 12% |
| Stubs (non implémentés) | 6/103 | 6% |

### 1.3 Problèmes identifiés

#### Sécurité (CRITIQUE)
- ❌ Identifiants admin codés en dur dans `auth.ts`
- ❌ Identifiants B2PWeb codés en dur dans `transport-scraping-service.ts`
- ❌ Secret JWT avec valeur par défaut
- ❌ Routes CRM sans authentification
- ❌ CORS acceptant toutes les origines
- ❌ Pas de rate limiting

#### Fonctionnalités incomplètes
- ❌ Réinitialisation de mot de passe (TODO)
- ❌ Requêtes GDPR (stub)
- ❌ Notifications broadcast (stub)
- ❌ Logs système et suivi d'erreurs (stubs)

#### Monitoring
- ❌ Pas de tracking d'erreurs centralisé
- ❌ Pas de dashboards de monitoring
- ❌ Pas de système d'alertes

### 1.4 Objectifs

1. **Sécuriser** l'application (priorité absolue)
2. **Monitorer** en temps réel les performances et erreurs
3. **Compléter** les fonctionnalités incomplètes
4. **Documenter** l'API de manière exhaustive
5. **Stabiliser** le service de scraping B2PWeb

---

## 2. Phase 1 - Sécurité critique

### 2.1 Migration des secrets vers AWS Secrets Manager

#### 2.1.1 Objectif
Supprimer tous les identifiants codés en dur et les migrer vers AWS Secrets Manager.

#### 2.1.2 Secrets à migrer

| Secret | Fichier actuel | Ligne | Criticité |
|--------|---------------|-------|-----------|
| Admin credentials | `middleware/auth.ts` | 11-30 | CRITIQUE |
| B2PWeb credentials | `services/transport-scraping-service.ts` | 45-46 | CRITIQUE |
| JWT_SECRET | `.env` / défaut | - | HAUTE |
| MongoDB URI | `.env` | - | HAUTE |

#### 2.1.3 Spécifications techniques

```typescript
// Nouveau fichier: src/services/secrets-manager.ts

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

interface AdminUser {
  email: string;
  adminKey: string;
  roles: string[];
}

interface B2PWebCredentials {
  email: string;
  password: string;
}

interface AppSecrets {
  adminUsers: AdminUser[];
  b2pwebCredentials: B2PWebCredentials;
  jwtSecret: string;
  mongodbUri: string;
}

class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-west-3' });
  }

  async getSecret(secretName: string): Promise<any> {
    // Vérifier le cache
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Récupérer depuis AWS
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.client.send(command);
    const value = JSON.parse(response.SecretString || '{}');

    // Mettre en cache
    this.cache.set(secretName, { value, expiry: Date.now() + this.cacheTTL });
    return value;
  }

  async getAppSecrets(): Promise<AppSecrets> {
    return this.getSecret('rt-admin-api/production');
  }
}

export const secretsManager = new SecretsManager();
```

#### 2.1.4 Structure du secret AWS

```json
{
  "adminUsers": [
    {
      "email": "admin@rt-technologie.com",
      "adminKey": "HASH_BCRYPT_ADMIN_KEY",
      "roles": ["super_admin", "pricing", "support", "commercial", "manager"]
    },
    {
      "email": "pricing@rt-technologie.com",
      "adminKey": "HASH_BCRYPT_PRICING_KEY",
      "roles": ["pricing"]
    },
    {
      "email": "commercial@rt-technologie.com",
      "adminKey": "HASH_BCRYPT_COMMERCIAL_KEY",
      "roles": ["commercial"]
    }
  ],
  "b2pwebCredentials": {
    "email": "scraper@b2pweb.com",
    "password": "ENCRYPTED_PASSWORD"
  },
  "jwtSecret": "STRONG_RANDOM_JWT_SECRET_256_BITS",
  "mongodbUri": "mongodb+srv://..."
}
```

#### 2.1.5 Modification de auth.ts

```typescript
// src/middleware/auth.ts - Version sécurisée

import { secretsManager } from '../services/secrets-manager';
import bcrypt from 'bcrypt';

let adminUsersCache: AdminUser[] | null = null;

async function getAdminUsers(): Promise<AdminUser[]> {
  if (!adminUsersCache) {
    const secrets = await secretsManager.getAppSecrets();
    adminUsersCache = secrets.adminUsers;
  }
  return adminUsersCache;
}

export async function verifyAdminCredentials(email: string, adminKey: string): Promise<AdminUser | null> {
  const adminUsers = await getAdminUsers();
  const user = adminUsers.find(u => u.email === email);

  if (!user) return null;

  // Comparaison sécurisée avec bcrypt
  const isValid = await bcrypt.compare(adminKey, user.adminKey);
  return isValid ? user : null;
}
```

#### 2.1.6 Livrables

- [ ] Service `secrets-manager.ts`
- [ ] Migration des identifiants admin
- [ ] Migration des identifiants B2PWeb
- [ ] Script de hash bcrypt pour les clés admin
- [ ] Documentation de rotation des secrets

---

### 2.2 Sécurisation JWT

#### 2.2.1 Objectif
Renforcer la sécurité des tokens JWT.

#### 2.2.2 Spécifications

```typescript
// src/config/jwt.config.ts

export const JWT_CONFIG = {
  accessToken: {
    expiresIn: '15m',        // Réduit de 24h à 15 minutes
    algorithm: 'HS256' as const
  },
  refreshToken: {
    expiresIn: '7d',
    algorithm: 'HS256' as const
  }
};

// Nouveau endpoint pour refresh token
// POST /api/auth/refresh
interface RefreshTokenRequest {
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### 2.2.3 Blacklist des tokens révoqués

```typescript
// src/services/token-blacklist.ts

import Redis from 'ioredis';

class TokenBlacklist {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async revoke(token: string, expiresIn: number): Promise<void> {
    await this.redis.setex(`blacklist:${token}`, expiresIn, '1');
  }

  async isRevoked(token: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${token}`);
    return result === '1';
  }
}

export const tokenBlacklist = new TokenBlacklist();
```

#### 2.2.4 Livrables

- [ ] Configuration JWT renforcée
- [ ] Endpoint refresh token
- [ ] Blacklist Redis pour tokens révoqués
- [ ] Logout avec révocation

---

### 2.3 Authentification routes CRM

#### 2.3.1 Objectif
Protéger toutes les routes CRM actuellement sans authentification.

#### 2.3.2 Routes à sécuriser

| Route | Méthode | Fichier | Ligne |
|-------|---------|---------|-------|
| `/api/crm/leads` | GET | crm.ts | 89 |
| `/api/crm/leads/:id` | GET | crm.ts | 145 |
| `/api/crm/leads` | POST | crm.ts | 201 |
| `/api/crm/leads/:id` | PUT | crm.ts | 267 |
| `/api/crm/leads/:id` | DELETE | crm.ts | 334 |
| `/api/crm/pipeline` | GET | crm.ts | 401 |
| `/api/crm/commercial/*` | ALL | crm.ts | 500+ |

#### 2.3.3 Implémentation

```typescript
// src/routes/crm.ts - Ajout middleware auth

import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Appliquer auth à toutes les routes CRM
router.use(requireAuth);

// Routes leads - nécessite rôle commercial ou admin
router.get('/leads', requireRole(['commercial', 'super_admin']), leadController.list);
router.get('/leads/:id', requireRole(['commercial', 'super_admin']), leadController.get);
router.post('/leads', requireRole(['commercial', 'super_admin']), leadController.create);
router.put('/leads/:id', requireRole(['commercial', 'super_admin']), leadController.update);
router.delete('/leads/:id', requireRole(['super_admin']), leadController.delete);

// Routes pipeline
router.get('/pipeline', requireRole(['commercial', 'manager', 'super_admin']), pipelineController.get);

// Routes portail commercial - nécessite rôle manager ou admin
router.use('/commercial', requireRole(['manager', 'super_admin']));
```

#### 2.3.4 Livrables

- [ ] Middleware `requireRole` étendu
- [ ] Application auth sur toutes routes CRM
- [ ] Tests d'accès par rôle
- [ ] Documentation des permissions

---

### 2.4 Configuration CORS sécurisée

#### 2.4.1 Objectif
Restreindre les origines autorisées pour les requêtes cross-origin.

#### 2.4.2 Configuration

```typescript
// src/config/cors.config.ts

const ALLOWED_ORIGINS = [
  'https://admin.rt-technologie.com',
  'https://app.rt-technologie.com',
  'https://crm.rt-technologie.com'
];

// Environnement développement uniquement
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
  ALLOWED_ORIGINS.push('http://localhost:3001');
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 heures
};
```

#### 2.4.3 Livrables

- [ ] Configuration CORS restrictive
- [ ] Liste des origines autorisées
- [ ] Logs des requêtes CORS bloquées

---

### 2.5 Rate Limiting

#### 2.5.1 Objectif
Protéger l'API contre les abus et attaques par déni de service.

#### 2.5.2 Spécifications

```typescript
// src/middleware/rate-limiter.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Rate limit global
export const globalRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // 1000 requêtes par fenêtre
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit strict pour auth
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 tentatives par fenêtre
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true
});

// Rate limit pour scraping
export const scrapingRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50,                   // 50 scraping jobs par heure
  message: {
    error: 'Scraping rate limit exceeded',
    retryAfter: 60 * 60
  }
});
```

#### 2.5.3 Application

```typescript
// src/app.ts

import { globalRateLimiter, authRateLimiter } from './middleware/rate-limiter';

// Rate limit global
app.use(globalRateLimiter);

// Rate limit spécifique auth
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/admin-login', authRateLimiter);

// Rate limit scraping
app.use('/api/transport-scraping', scrapingRateLimiter);
```

#### 2.5.4 Livrables

- [ ] Middleware rate limiter global
- [ ] Rate limiter strict pour authentification
- [ ] Rate limiter pour scraping
- [ ] Store Redis pour distribution
- [ ] Headers de rate limit dans réponses

---

## 3. Phase 2 - Monitoring et observabilité

### 3.1 Intégration Sentry

#### 3.1.1 Objectif
Capturer et centraliser toutes les erreurs en temps réel.

#### 3.1.2 Installation

```bash
npm install @sentry/node @sentry/tracing
```

#### 3.1.3 Configuration

```typescript
// src/config/sentry.ts

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `rt-admin-api@${process.env.APP_VERSION}`,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Mongo({ useMongoose: true }),
      new ProfilingIntegration()
    ],

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: 0.1,

    // Filtrer les erreurs sensibles
    beforeSend(event) {
      // Ne pas envoyer les erreurs avec des données sensibles
      if (event.request?.headers?.authorization) {
        delete event.request.headers.authorization;
      }
      return event;
    }
  });
}

// Middleware Express
export const sentryRequestHandler = Sentry.Handlers.requestHandler();
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = Sentry.Handlers.errorHandler();
```

#### 3.1.4 Utilisation dans le code

```typescript
// Exemple de capture d'erreur enrichie
import * as Sentry from '@sentry/node';

try {
  await scrapingService.processOffer(offerId);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'scraping',
      offerId: offerId
    },
    extra: {
      offerDetails: offer,
      scrapingConfig: config
    }
  });
  throw error;
}
```

#### 3.1.5 Alertes Sentry

Configuration des alertes à créer dans Sentry :

| Alerte | Condition | Notification |
|--------|-----------|--------------|
| Erreur critique | Niveau error + > 10/heure | Slack + Email |
| Scraping échoué | Tag service=scraping + error | Slack |
| Auth failures | Tag endpoint=login + > 20/15min | Email |
| Performance dégradée | P95 latence > 2s | Slack |

#### 3.1.6 Livrables

- [ ] Configuration Sentry
- [ ] Intégration Express
- [ ] Intégration MongoDB
- [ ] Alertes configurées
- [ ] Dashboard Sentry personnalisé

---

### 3.2 Logs structurés avec Winston + CloudWatch

#### 3.2.1 Objectif
Centraliser les logs applicatifs dans CloudWatch avec format structuré.

#### 3.2.2 Installation

```bash
npm install winston winston-cloudwatch
```

#### 3.2.3 Configuration

```typescript
// src/config/logger.ts

import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const { combine, timestamp, json, errors } = winston.format;

// Format de base
const baseFormat = combine(
  timestamp({ format: 'ISO' }),
  errors({ stack: true }),
  json()
);

// Logger principal
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: baseFormat,
  defaultMeta: {
    service: 'rt-admin-api',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console pour développement
    new winston.transports.Console({
      format: combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Ajouter CloudWatch en production
if (process.env.NODE_ENV === 'production') {
  logger.add(new WinstonCloudWatch({
    logGroupName: 'rt-admin-api',
    logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
    awsRegion: process.env.AWS_REGION || 'eu-west-3',
    jsonMessage: true,
    retentionInDays: 30
  }));
}

// Logger spécialisé pour le scraping
export const scrapingLogger = logger.child({ module: 'scraping' });

// Logger spécialisé pour le CRM
export const crmLogger = logger.child({ module: 'crm' });

// Logger spécialisé pour l'auth
export const authLogger = logger.child({ module: 'auth' });
```

#### 3.2.4 Middleware de logging HTTP

```typescript
// src/middleware/request-logger.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    });

    // Log warning si requête lente
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration
      });
    }
  });

  next();
}
```

#### 3.2.5 Livrables

- [ ] Configuration Winston
- [ ] Transport CloudWatch
- [ ] Loggers spécialisés par module
- [ ] Middleware HTTP logging
- [ ] Rotation des logs

---

### 3.3 Métriques et dashboards

#### 3.3.1 Objectif
Créer des dashboards de monitoring pour suivre les performances.

#### 3.3.2 Métriques à collecter

```typescript
// src/services/metrics.ts

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

interface MetricData {
  name: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Percent' | 'Bytes';
  dimensions?: Record<string, string>;
}

class MetricsService {
  private namespace = 'RTAdminAPI';
  private buffer: MetricData[] = [];
  private flushInterval = 60000; // 1 minute

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  record(metric: MetricData): void {
    this.buffer.push(metric);
  }

  // Métriques API
  recordApiLatency(endpoint: string, duration: number): void {
    this.record({
      name: 'APILatency',
      value: duration,
      unit: 'Seconds',
      dimensions: { Endpoint: endpoint }
    });
  }

  recordApiError(endpoint: string): void {
    this.record({
      name: 'APIErrors',
      value: 1,
      unit: 'Count',
      dimensions: { Endpoint: endpoint }
    });
  }

  // Métriques scraping
  recordScrapingJob(status: 'success' | 'failure', transporterCount: number): void {
    this.record({
      name: 'ScrapingJobStatus',
      value: 1,
      unit: 'Count',
      dimensions: { Status: status }
    });

    if (status === 'success') {
      this.record({
        name: 'TransportersScraped',
        value: transporterCount,
        unit: 'Count'
      });
    }
  }

  // Métriques CRM
  recordLeadCreated(): void {
    this.record({
      name: 'LeadsCreated',
      value: 1,
      unit: 'Count'
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = this.buffer.splice(0, this.buffer.length);

    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: metrics.map(m => ({
        MetricName: m.name,
        Value: m.value,
        Unit: m.unit,
        Timestamp: new Date(),
        Dimensions: m.dimensions
          ? Object.entries(m.dimensions).map(([Name, Value]) => ({ Name, Value }))
          : undefined
      }))
    });

    try {
      await cloudwatch.send(command);
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

export const metrics = new MetricsService();
```

#### 3.3.3 Dashboard CloudWatch

Créer un dashboard avec les widgets suivants :

**Widget 1 - Vue d'ensemble API**
- Requêtes par minute
- Latence P50, P95, P99
- Taux d'erreur 4xx/5xx

**Widget 2 - Scraping B2PWeb**
- Jobs en cours
- Jobs réussis vs échoués
- Transporteurs extraits par heure
- Temps moyen par offre

**Widget 3 - CRM**
- Leads créés par jour
- Leads par statut dans le pipeline
- Activité commerciale

**Widget 4 - Authentification**
- Connexions réussies/échouées
- Tokens actifs
- Rate limit atteint

#### 3.3.4 Livrables

- [ ] Service de métriques CloudWatch
- [ ] Dashboard CloudWatch principal
- [ ] Dashboard scraping
- [ ] Dashboard CRM
- [ ] Alarmes CloudWatch

---

### 3.4 Health checks et status page

#### 3.4.1 Objectif
Endpoint de health check pour monitoring et load balancer.

#### 3.4.2 Implémentation

```typescript
// src/routes/health.ts

import { Router } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    mongodb: { status: string; latency?: number };
    redis: { status: string; latency?: number };
    memory: { used: number; total: number; percentage: number };
  };
}

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    mongodb: { status: 'unknown' },
    redis: { status: 'unknown' },
    memory: { used: 0, total: 0, percentage: 0 }
  };

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    await mongoose.connection.db.admin().ping();
    checks.mongodb = {
      status: 'healthy',
      latency: Date.now() - mongoStart
    };
  } catch (error) {
    checks.mongodb = { status: 'unhealthy' };
  }

  // Check Redis
  try {
    const redis = new Redis(process.env.REDIS_URL);
    const redisStart = Date.now();
    await redis.ping();
    checks.redis = {
      status: 'healthy',
      latency: Date.now() - redisStart
    };
    await redis.quit();
  } catch (error) {
    checks.redis = { status: 'unhealthy' };
  }

  // Check Memory
  const memUsage = process.memoryUsage();
  checks.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  };

  // Determine overall status
  const mongoHealthy = checks.mongodb.status === 'healthy';
  const redisHealthy = checks.redis.status === 'healthy';
  const memoryHealthy = checks.memory.percentage < 90;

  let status: HealthStatus['status'] = 'healthy';
  if (!mongoHealthy) status = 'unhealthy';
  else if (!redisHealthy || !memoryHealthy) status = 'degraded';

  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    uptime: process.uptime(),
    checks
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(response);
});

// Endpoint simplifié pour load balancer
router.get('/health/live', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint de readiness
router.get('/health/ready', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send('OK');
  } catch {
    res.status(503).send('NOT READY');
  }
});

export default router;
```

#### 3.4.3 Livrables

- [ ] Endpoint `/health` complet
- [ ] Endpoint `/health/live` pour liveness probe
- [ ] Endpoint `/health/ready` pour readiness probe
- [ ] Intégration ELB health check

---

## 4. Phase 3 - Complétion des fonctionnalités

### 4.1 Réinitialisation de mot de passe

#### 4.1.1 Objectif
Implémenter le flux complet de réinitialisation de mot de passe.

#### 4.1.2 Flux

```
1. User demande reset → POST /api/auth/forgot-password
2. Système génère token → Envoie email avec lien
3. User clique lien → GET /reset-password?token=xxx
4. User soumet nouveau mdp → POST /api/auth/reset-password
5. Système valide token → Met à jour mot de passe
```

#### 4.1.3 Modèle de données

```typescript
// src/models/PasswordResetToken.ts

import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 heure
  },
  used: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index TTL pour auto-suppression
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
```

#### 4.1.4 Service email

```typescript
// src/services/email-service.ts

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION });

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private fromAddress = 'noreply@rt-technologie.com';

  async send(options: EmailOptions): Promise<void> {
    const command = new SendEmailCommand({
      Destination: { ToAddresses: [options.to] },
      Message: {
        Subject: { Data: options.subject },
        Body: { Html: { Data: options.html } }
      },
      Source: this.fromAddress
    });

    await ses.send(command);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe - RT Technologie',
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `
    });
  }
}

export const emailService = new EmailService();
```

#### 4.1.5 Routes

```typescript
// src/routes/auth.ts - Ajout des routes password reset

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { emailService } from '../services/email-service';

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Toujours retourner succès (sécurité)
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Générer token sécurisé
    const token = crypto.randomBytes(32).toString('hex');

    // Supprimer anciens tokens
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Créer nouveau token
    await PasswordResetToken.create({
      userId: user._id,
      token: await bcrypt.hash(token, 10)
    });

    // Envoyer email
    await emailService.sendPasswordReset(email, token);

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    logger.error('Forgot password error', { error, email });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validation mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Trouver token valide
    const resetTokens = await PasswordResetToken.find({
      expiresAt: { $gt: new Date() },
      used: false
    });

    let validToken = null;
    for (const rt of resetTokens) {
      if (await bcrypt.compare(token, rt.token)) {
        validToken = rt;
        break;
      }
    }

    if (!validToken) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Mettre à jour mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(validToken.userId, { password: hashedPassword });

    // Marquer token comme utilisé
    validToken.used = true;
    await validToken.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    logger.error('Reset password error', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

#### 4.1.6 Livrables

- [ ] Modèle PasswordResetToken
- [ ] Service email avec SES
- [ ] Route POST /forgot-password
- [ ] Route POST /reset-password
- [ ] Template email
- [ ] Tests unitaires

---

### 4.2 Conformité RGPD

#### 4.2.1 Objectif
Implémenter les fonctionnalités RGPD requises.

#### 4.2.2 Fonctionnalités requises

1. **Droit d'accès** - Export des données personnelles
2. **Droit à l'effacement** - Suppression des données
3. **Droit à la portabilité** - Export format standard (JSON)
4. **Registre des traitements** - Traçabilité des opérations

#### 4.2.3 Modèle de requête GDPR

```typescript
// src/models/GDPRRequest.ts

import mongoose from 'mongoose';

const gdprRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['access', 'deletion', 'portability', 'rectification'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  result: {
    type: mongoose.Schema.Types.Mixed
  },
  notes: String
}, { timestamps: true });

export const GDPRRequest = mongoose.model('GDPRRequest', gdprRequestSchema);
```

#### 4.2.4 Service GDPR

```typescript
// src/services/gdpr-service.ts

import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Activity } from '../models/Activity';
import { AuditLog } from '../models/AuditLog';

class GDPRService {
  // Export toutes les données d'un utilisateur
  async exportUserData(userId: string): Promise<object> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    // Collecter toutes les données liées
    const leads = await Lead.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ]
    }).lean();

    const activities = await Activity.find({ userId }).lean();
    const auditLogs = await AuditLog.find({ userId }).lean();

    return {
      exportDate: new Date().toISOString(),
      user: this.sanitizeUser(user),
      leads: leads.map(l => this.sanitizeLead(l)),
      activities,
      auditLogs: auditLogs.map(l => ({
        action: l.action,
        timestamp: l.createdAt,
        details: l.details
      }))
    };
  }

  // Supprimer/anonymiser les données d'un utilisateur
  async deleteUserData(userId: string): Promise<void> {
    // Anonymiser l'utilisateur (ne pas supprimer pour garder l'intégrité référentielle)
    await User.findByIdAndUpdate(userId, {
      email: `deleted_${userId}@anonymized.local`,
      firstName: 'DELETED',
      lastName: 'USER',
      phone: null,
      isDeleted: true,
      deletedAt: new Date()
    });

    // Anonymiser les leads créés
    await Lead.updateMany(
      { createdBy: userId },
      {
        $set: {
          'contact.email': 'anonymized@deleted.local',
          'contact.phone': null,
          'contact.name': 'ANONYMIZED'
        }
      }
    );

    // Supprimer les activités
    await Activity.deleteMany({ userId });
  }

  private sanitizeUser(user: any): object {
    const { password, adminKey, ...safe } = user;
    return safe;
  }

  private sanitizeLead(lead: any): object {
    return lead;
  }
}

export const gdprService = new GDPRService();
```

#### 4.2.5 Routes GDPR

```typescript
// src/routes/gdpr.ts

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { gdprService } from '../services/gdpr-service';
import { GDPRRequest } from '../models/GDPRRequest';

const router = Router();

router.use(requireAuth);

// Créer une demande GDPR
router.post('/requests', async (req, res) => {
  const { type, targetUserId, reason } = req.body;
  const requestedBy = req.user.id;

  // L'utilisateur peut seulement demander pour lui-même sauf admin
  if (targetUserId !== requestedBy && !req.user.roles.includes('super_admin')) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const request = await GDPRRequest.create({
    type,
    requestedBy,
    targetUser: targetUserId,
    reason
  });

  res.status(201).json(request);
});

// Lister les demandes (admin)
router.get('/requests', requireRole(['super_admin']), async (req, res) => {
  const requests = await GDPRRequest.find()
    .populate('requestedBy', 'email firstName lastName')
    .populate('targetUser', 'email firstName lastName')
    .sort({ createdAt: -1 });

  res.json(requests);
});

// Traiter une demande (admin)
router.post('/requests/:id/process', requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'

  const request = await GDPRRequest.findById(id);
  if (!request) {
    return res.status(404).json({ error: 'Demande non trouvée' });
  }

  if (action === 'reject') {
    request.status = 'rejected';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    await request.save();
    return res.json(request);
  }

  // Traiter selon le type
  request.status = 'processing';
  await request.save();

  try {
    switch (request.type) {
      case 'access':
      case 'portability':
        const data = await gdprService.exportUserData(request.targetUser.toString());
        request.result = data;
        break;

      case 'deletion':
        await gdprService.deleteUserData(request.targetUser.toString());
        request.result = { deleted: true };
        break;
    }

    request.status = 'completed';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    await request.save();

    res.json(request);
  } catch (error) {
    request.status = 'pending';
    await request.save();
    throw error;
  }
});

// Export direct (utilisateur pour lui-même)
router.get('/my-data', async (req, res) => {
  const data = await gdprService.exportUserData(req.user.id);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="my-data-${new Date().toISOString()}.json"`);
  res.json(data);
});

export default router;
```

#### 4.2.6 Livrables

- [ ] Modèle GDPRRequest
- [ ] Service GDPR (export, suppression)
- [ ] Routes GDPR
- [ ] Interface admin pour traitement
- [ ] Logs d'audit pour conformité
- [ ] Documentation RGPD

---

### 4.3 Système de notifications

#### 4.3.1 Objectif
Implémenter un système de notifications broadcast et ciblées.

#### 4.3.2 Modèle

```typescript
// src/models/Notification.ts

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'announcement'],
    default: 'info'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Ciblage
  target: {
    type: {
      type: String,
      enum: ['all', 'role', 'user', 'company'],
      required: true
    },
    value: String // roleId, userId, ou companyId selon le type
  },
  // Metadata
  link: String,
  imageUrl: String,
  data: mongoose.Schema.Types.Mixed,
  // Statut
  expiresAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index pour requêtes rapides
notificationSchema.index({ 'target.type': 1, 'target.value': 1 });
notificationSchema.index({ expiresAt: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);

// Lecture des notifications par utilisateur
const notificationReadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export const NotificationRead = mongoose.model('NotificationRead', notificationReadSchema);
```

#### 4.3.3 Service de notifications

```typescript
// src/services/notification-service.ts

import { Notification, NotificationRead } from '../models/Notification';
import { User } from '../models/User';

interface CreateNotificationDTO {
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  title: string;
  message: string;
  target: {
    type: 'all' | 'role' | 'user' | 'company';
    value?: string;
  };
  link?: string;
  expiresAt?: Date;
  createdBy?: string;
}

class NotificationService {
  async create(data: CreateNotificationDTO): Promise<any> {
    const notification = await Notification.create(data);

    // TODO: Envoyer via WebSocket aux utilisateurs concernés
    // await this.broadcastToTargets(notification);

    return notification;
  }

  async getForUser(userId: string, options: { unreadOnly?: boolean; limit?: number } = {}): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Construire la query pour les notifications ciblant cet utilisateur
    const query: any = {
      $or: [
        { 'target.type': 'all' },
        { 'target.type': 'user', 'target.value': userId },
        { 'target.type': 'company', 'target.value': user.companyId?.toString() }
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    };

    // Ajouter filtre par rôle si l'utilisateur a des rôles
    if (user.roles && user.roles.length > 0) {
      query.$or.push({
        'target.type': 'role',
        'target.value': { $in: user.roles }
      });
    }

    let notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .lean();

    // Ajouter le statut de lecture
    const readNotifications = await NotificationRead.find({
      userId,
      notificationId: { $in: notifications.map(n => n._id) }
    }).lean();

    const readSet = new Set(readNotifications.map(r => r.notificationId.toString()));

    notifications = notifications.map(n => ({
      ...n,
      isRead: readSet.has(n._id.toString())
    }));

    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    return notifications;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await NotificationRead.findOneAndUpdate(
      { userId, notificationId },
      { userId, notificationId, readAt: new Date() },
      { upsert: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getForUser(userId, { unreadOnly: true });

    await NotificationRead.insertMany(
      notifications.map(n => ({
        userId,
        notificationId: n._id,
        readAt: new Date()
      })),
      { ordered: false }
    ).catch(() => {}); // Ignorer les duplicates
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getForUser(userId, { unreadOnly: true });
    return notifications.length;
  }
}

export const notificationService = new NotificationService();
```

#### 4.3.4 Routes

```typescript
// src/routes/notifications.ts

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { notificationService } from '../services/notification-service';

const router = Router();

router.use(requireAuth);

// Récupérer mes notifications
router.get('/', async (req, res) => {
  const { unreadOnly, limit } = req.query;

  const notifications = await notificationService.getForUser(req.user.id, {
    unreadOnly: unreadOnly === 'true',
    limit: limit ? parseInt(limit as string) : undefined
  });

  res.json(notifications);
});

// Compter les non lues
router.get('/unread-count', async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json({ count });
});

// Marquer comme lue
router.post('/:id/read', async (req, res) => {
  await notificationService.markAsRead(req.user.id, req.params.id);
  res.json({ success: true });
});

// Marquer toutes comme lues
router.post('/read-all', async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ success: true });
});

// Créer une notification (admin)
router.post('/', requireRole(['super_admin']), async (req, res) => {
  const notification = await notificationService.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json(notification);
});

export default router;
```

#### 4.3.5 Livrables

- [ ] Modèle Notification
- [ ] Modèle NotificationRead
- [ ] Service de notifications
- [ ] Routes CRUD
- [ ] Interface admin broadcast
- [ ] (Optionnel) WebSocket pour temps réel

---

### 4.4 Système de jobs asynchrones (Bull + Redis)

#### 4.4.1 Objectif
Gérer les tâches longues (scraping, exports, emails) de manière asynchrone.

#### 4.4.2 Installation

```bash
npm install bull bull-board @bull-board/express
```

#### 4.4.3 Configuration

```typescript
// src/config/queue.ts

import Bull from 'bull';

const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
};

// Queues
export const scrapingQueue = new Bull('scraping', redisConfig);
export const emailQueue = new Bull('email', redisConfig);
export const exportQueue = new Bull('export', redisConfig);
export const gdprQueue = new Bull('gdpr', redisConfig);

// Configuration par défaut
const defaultJobOptions: Bull.JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  },
  removeOnComplete: 100, // Garder 100 jobs terminés
  removeOnFail: 50
};

scrapingQueue.defaultJobOptions = {
  ...defaultJobOptions,
  timeout: 10 * 60 * 1000 // 10 minutes pour scraping
};

emailQueue.defaultJobOptions = {
  ...defaultJobOptions,
  timeout: 30 * 1000 // 30 secondes pour email
};
```

#### 4.4.4 Workers

```typescript
// src/workers/scraping-worker.ts

import { scrapingQueue } from '../config/queue';
import { scrapingService } from '../services/transport-scraping-service';
import { logger } from '../config/logger';

scrapingQueue.process('process-offer', async (job) => {
  const { offerId, config } = job.data;

  logger.info('Processing scraping job', { jobId: job.id, offerId });

  try {
    const result = await scrapingService.processOffer(offerId, config);

    job.progress(100);
    return result;
  } catch (error) {
    logger.error('Scraping job failed', { jobId: job.id, error });
    throw error;
  }
});

scrapingQueue.on('completed', (job, result) => {
  logger.info('Scraping job completed', {
    jobId: job.id,
    transporterCount: result.transporterCount
  });
});

scrapingQueue.on('failed', (job, error) => {
  logger.error('Scraping job failed', { jobId: job.id, error: error.message });
});
```

```typescript
// src/workers/email-worker.ts

import { emailQueue } from '../config/queue';
import { emailService } from '../services/email-service';
import { logger } from '../config/logger';

emailQueue.process(async (job) => {
  const { type, to, data } = job.data;

  logger.info('Processing email job', { jobId: job.id, type, to });

  switch (type) {
    case 'password-reset':
      await emailService.sendPasswordReset(to, data.token);
      break;
    case 'welcome':
      await emailService.sendWelcome(to, data);
      break;
    case 'notification':
      await emailService.sendNotification(to, data);
      break;
  }

  return { sent: true };
});
```

#### 4.4.5 Dashboard Bull Board

```typescript
// src/config/bull-board.ts

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { scrapingQueue, emailQueue, exportQueue, gdprQueue } from './queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(scrapingQueue),
    new BullAdapter(emailQueue),
    new BullAdapter(exportQueue),
    new BullAdapter(gdprQueue)
  ],
  serverAdapter
});

export const bullBoardRouter = serverAdapter.getRouter();
```

```typescript
// src/app.ts

import { bullBoardRouter } from './config/bull-board';
import { requireAuth, requireRole } from './middleware/auth';

// Dashboard des queues (admin only)
app.use('/admin/queues', requireAuth, requireRole(['super_admin']), bullBoardRouter);
```

#### 4.4.6 Livrables

- [ ] Configuration Bull + Redis
- [ ] Queue scraping
- [ ] Queue email
- [ ] Queue export
- [ ] Queue GDPR
- [ ] Workers pour chaque queue
- [ ] Dashboard Bull Board
- [ ] Métriques de queues

---

## 5. Phase 4 - Documentation et tests

### 5.1 Documentation OpenAPI/Swagger

#### 5.1.1 Objectif
Documenter exhaustivement l'API avec OpenAPI 3.0.

#### 5.1.2 Installation

```bash
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

#### 5.1.3 Configuration

```typescript
// src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RT Admin API',
      version: process.env.APP_VERSION || '1.0.0',
      description: 'API de gestion du backoffice RT Technologie',
      contact: {
        name: 'RT Technologie',
        email: 'support@rt-technologie.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
```

#### 5.1.4 Annotations exemple

```typescript
// src/routes/users.ts

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Liste tous les utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par email ou nom
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.get('/', requireAuth, userController.list);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         companyId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 */
```

#### 5.1.5 Intégration

```typescript
// src/app.ts

import { swaggerSpec, swaggerUi } from './config/swagger';

// Documentation API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Endpoint JSON de la spec
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});
```

#### 5.1.6 Livrables

- [ ] Configuration Swagger
- [ ] Documentation toutes routes auth
- [ ] Documentation toutes routes users
- [ ] Documentation toutes routes companies
- [ ] Documentation toutes routes CRM
- [ ] Documentation toutes routes scraping
- [ ] Schémas pour tous les modèles
- [ ] Exemples de requêtes/réponses

---

### 5.2 Tests automatisés

#### 5.2.1 Objectif
Atteindre une couverture de tests de 80%.

#### 5.2.2 Installation

```bash
npm install -D jest ts-jest @types/jest supertest @types/supertest mongodb-memory-server
```

#### 5.2.3 Configuration Jest

```typescript
// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

#### 5.2.4 Setup tests

```typescript
// src/__tests__/setup.ts

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

#### 5.2.5 Exemple de test

```typescript
// src/__tests__/routes/auth.test.ts

import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import bcrypt from 'bcrypt';

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should return JWT token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should always return success message (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'any@email.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Si cet email existe');
    });
  });
});
```

#### 5.2.6 Tests à implémenter

| Module | Fichier test | Priorité |
|--------|-------------|----------|
| Auth | auth.test.ts | HAUTE |
| Users | users.test.ts | HAUTE |
| Companies | companies.test.ts | MOYENNE |
| CRM Leads | crm-leads.test.ts | HAUTE |
| CRM Pipeline | crm-pipeline.test.ts | MOYENNE |
| Scraping | scraping.test.ts | HAUTE |
| Notifications | notifications.test.ts | BASSE |
| GDPR | gdpr.test.ts | MOYENNE |
| Health | health.test.ts | BASSE |

#### 5.2.7 Livrables

- [ ] Configuration Jest
- [ ] Setup MongoDB en mémoire
- [ ] Tests auth (login, logout, refresh)
- [ ] Tests users CRUD
- [ ] Tests CRM leads
- [ ] Tests scraping
- [ ] Tests GDPR
- [ ] Tests notifications
- [ ] CI/CD pipeline tests
- [ ] Rapport de couverture

---

## 6. Phase 5 - Optimisation scraping B2PWeb

### 6.1 Contexte

Le service de scraping B2PWeb a connu **72 versions** en 2 mois, indiquant une instabilité majeure. Le problème principal est le scroll du `vue-recycle-scroller` qui ne fonctionne pas correctement.

### 6.2 Problèmes identifiés

1. **Virtual scroller** : Le composant Vue utilise un recycler qui ne répond pas aux méthodes de scroll classiques
2. **État instable** : 72 versions sans stabilité
3. **Extraction limitée** : Seulement ~20 transporteurs extraits au lieu de 500

### 6.3 Solutions proposées

#### 6.3.1 Approche 1 - Simulation utilisateur complète

```typescript
// Simuler le comportement utilisateur réel
async function scrollVueRecycler(page: Page, containerSelector: string, targetCount: number): Promise<void> {
  const container = await page.$(containerSelector);
  if (!container) throw new Error('Container not found');

  const boundingBox = await container.boundingBox();
  if (!boundingBox) throw new Error('Cannot get bounding box');

  // Position initiale au centre du container
  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;

  // Déplacer la souris dans le container
  await page.mouse.move(centerX, centerY);

  let previousCount = 0;
  let sameCountIterations = 0;

  while (true) {
    // Compter les éléments visibles
    const currentCount = await page.$$eval('.item-row', rows => rows.length);

    if (currentCount >= targetCount) {
      break;
    }

    if (currentCount === previousCount) {
      sameCountIterations++;
      if (sameCountIterations > 5) {
        // Plus d'éléments à charger
        break;
      }
    } else {
      sameCountIterations = 0;
    }

    previousCount = currentCount;

    // Scroll avec la molette
    await page.mouse.wheel({ deltaY: 300 });

    // Attendre le rendu du recycler
    await page.waitForTimeout(200);
  }
}
```

#### 6.3.2 Approche 2 - Interception API

```typescript
// Intercepter les appels API au lieu de scraper le DOM
async function interceptTransporterAPI(page: Page): Promise<Transporter[]> {
  const transporters: Transporter[] = [];

  // Intercepter les réponses API
  page.on('response', async (response) => {
    const url = response.url();

    // Détecter les appels API de la liste des transporteurs
    if (url.includes('/api/transporters') || url.includes('/api/searches')) {
      try {
        const data = await response.json();
        if (data.items || data.transporters) {
          transporters.push(...(data.items || data.transporters));
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  });

  // Naviguer et déclencher les chargements
  await triggerAllDataLoads(page);

  return transporters;
}
```

#### 6.3.3 Approche 3 - Pagination forcée

```typescript
// Forcer le chargement par pagination
async function loadAllByPagination(page: Page): Promise<void> {
  // Identifier les contrôles de pagination
  const paginationExists = await page.$('.pagination, .pager, [data-page]');

  if (paginationExists) {
    // Cliquer sur chaque page
    let hasNextPage = true;
    while (hasNextPage) {
      // Extraire données de la page courante
      await extractCurrentPageData(page);

      // Chercher bouton suivant
      const nextButton = await page.$('.next-page, .pagination-next, [aria-label="Next"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
      } else {
        hasNextPage = false;
      }
    }
  }
}
```

### 6.4 Architecture refactorisée

```typescript
// src/services/scraping/b2pweb-scraper.ts

interface ScrapingStrategy {
  name: string;
  execute(page: Page, config: ScrapingConfig): Promise<ScrapingResult>;
}

class B2PWebScraper {
  private strategies: ScrapingStrategy[] = [
    new APIInterceptionStrategy(),
    new VirtualScrollStrategy(),
    new PaginationStrategy(),
    new FallbackDOMStrategy()
  ];

  async scrape(config: ScrapingConfig): Promise<ScrapingResult> {
    const page = await this.browser.newPage();

    try {
      await this.authenticate(page);
      await this.navigateToOffers(page);

      // Essayer chaque stratégie jusqu'à succès
      for (const strategy of this.strategies) {
        try {
          logger.info(`Trying strategy: ${strategy.name}`);
          const result = await strategy.execute(page, config);

          if (result.transporters.length >= config.minExpected) {
            logger.info(`Strategy ${strategy.name} succeeded`, {
              count: result.transporters.length
            });
            return result;
          }
        } catch (error) {
          logger.warn(`Strategy ${strategy.name} failed`, { error });
        }
      }

      throw new Error('All scraping strategies failed');
    } finally {
      await page.close();
    }
  }
}
```

### 6.5 Livrables

- [ ] Analyse détaillée du vue-recycle-scroller B2PWeb
- [ ] Implémentation stratégie API interception
- [ ] Implémentation stratégie scroll améliorée
- [ ] Architecture multi-stratégie
- [ ] Tests de régression
- [ ] Monitoring spécifique scraping
- [ ] Documentation technique

---

## 7. Architecture cible

### 7.1 Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Admin Panel  │  │  CRM Panel   │  │ Forwarder UI │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS LOAD BALANCER                           │
│                      (Rate Limiting)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RT ADMIN API                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     EXPRESS.JS                              │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│  │  │  Auth   │ │  CRM    │ │Scraping │ │  Admin  │          │ │
│  │  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │          │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     SERVICES                                │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   Secrets   │ │   Email     │ │    GDPR     │          │ │
│  │  │   Manager   │ │   Service   │ │   Service   │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │  Scraping   │ │Notification │ │   Metrics   │          │ │
│  │  │   Service   │ │   Service   │ │   Service   │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   MongoDB   │      │    Redis    │      │     AWS     │
│   Atlas     │      │  (Queues)   │      │  Services   │
└─────────────┘      └─────────────┘      └─────────────┘
                                          ┌─────────────┐
                                          │ - Secrets   │
                                          │   Manager   │
                                          │ - SES       │
                                          │ - CloudWatch│
                                          │ - S3        │
                                          └─────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONITORING                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Sentry    │  │  CloudWatch  │  │  Bull Board  │          │
│  │   (Errors)   │  │   (Logs)     │  │   (Queues)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Stack technique finale

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | 18 LTS |
| Framework | Express.js | 4.x |
| Base de données | MongoDB Atlas | 6.x |
| Cache/Queue | Redis | 7.x |
| Queue manager | Bull | 4.x |
| Logging | Winston + CloudWatch | - |
| Errors | Sentry | - |
| Auth | JWT + bcrypt | - |
| Secrets | AWS Secrets Manager | - |
| Email | AWS SES | - |
| Storage | AWS S3 | - |
| Hosting | AWS Elastic Beanstalk | - |
| Documentation | Swagger/OpenAPI | 3.0 |
| Tests | Jest + Supertest | - |

---

## 8. Planning prévisionnel

### 8.1 Phase 1 - Sécurité (Priorité CRITIQUE)

| Tâche | Dépendances | Complexité |
|-------|-------------|------------|
| 1.1 AWS Secrets Manager | - | Moyenne |
| 1.2 Migration credentials | 1.1 | Faible |
| 1.3 JWT refresh tokens | - | Moyenne |
| 1.4 Auth routes CRM | - | Faible |
| 1.5 CORS sécurisé | - | Faible |
| 1.6 Rate limiting | Redis | Moyenne |

### 8.2 Phase 2 - Monitoring

| Tâche | Dépendances | Complexité |
|-------|-------------|------------|
| 2.1 Intégration Sentry | - | Faible |
| 2.2 Winston + CloudWatch | - | Moyenne |
| 2.3 Métriques CloudWatch | - | Moyenne |
| 2.4 Health checks | - | Faible |
| 2.5 Dashboards | 2.2, 2.3 | Moyenne |

### 8.3 Phase 3 - Fonctionnalités

| Tâche | Dépendances | Complexité |
|-------|-------------|------------|
| 3.1 Password reset | SES | Moyenne |
| 3.2 GDPR compliance | - | Haute |
| 3.3 Notifications | Redis | Moyenne |
| 3.4 Bull queues | Redis | Moyenne |

### 8.4 Phase 4 - Documentation & Tests

| Tâche | Dépendances | Complexité |
|-------|-------------|------------|
| 4.1 Swagger setup | - | Faible |
| 4.2 Documentation routes | - | Haute |
| 4.3 Jest setup | - | Faible |
| 4.4 Tests unitaires | 4.3 | Haute |
| 4.5 Tests intégration | 4.3 | Haute |

### 8.5 Phase 5 - Scraping

| Tâche | Dépendances | Complexité |
|-------|-------------|------------|
| 5.1 Analyse vue-recycle | - | Moyenne |
| 5.2 Stratégie API | - | Haute |
| 5.3 Stratégie scroll | - | Haute |
| 5.4 Refactoring service | 5.2, 5.3 | Haute |
| 5.5 Tests scraping | 5.4 | Moyenne |

---

## 9. Annexes

### 9.1 Liste des 103 endpoints

<details>
<summary>Voir la liste complète</summary>

#### Auth (8 endpoints)
- POST /api/auth/login
- POST /api/auth/admin-login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- POST /api/auth/verify-token

#### Users (12 endpoints)
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
- PUT /api/users/:id/password
- PUT /api/users/:id/roles
- GET /api/users/:id/activity
- POST /api/users/:id/impersonate
- GET /api/users/search
- PUT /api/users/:id/preferences
- GET /api/users/export

#### Companies (10 endpoints)
- GET /api/companies
- GET /api/companies/:id
- POST /api/companies
- PUT /api/companies/:id
- DELETE /api/companies/:id
- GET /api/companies/:id/users
- GET /api/companies/:id/subscriptions
- GET /api/companies/:id/usage
- POST /api/companies/:id/invite
- GET /api/companies/export

#### Subscriptions (8 endpoints)
- GET /api/subscriptions
- GET /api/subscriptions/:id
- POST /api/subscriptions
- PUT /api/subscriptions/:id
- DELETE /api/subscriptions/:id
- POST /api/subscriptions/:id/cancel
- POST /api/subscriptions/:id/renew
- GET /api/subscriptions/plans

#### CRM (37 endpoints)
- Leads: 12 endpoints
- Pipeline: 6 endpoints
- Commercial: 10 endpoints
- Manager: 9 endpoints

#### Transport Scraping (12 endpoints)
- GET /api/transport-scraping/status
- POST /api/transport-scraping/start
- POST /api/transport-scraping/stop
- GET /api/transport-scraping/config
- PUT /api/transport-scraping/config
- GET /api/transport-scraping/queue
- POST /api/transport-scraping/queue/add
- DELETE /api/transport-scraping/queue/:id
- GET /api/transport-scraping/results
- GET /api/transport-scraping/results/:id
- GET /api/transport-scraping/logs
- POST /api/transport-scraping/authenticate

#### Autres (16 endpoints)
- Modules: 6 endpoints
- API Keys: 4 endpoints
- Audit: 3 endpoints
- Dashboard: 3 endpoints

</details>

### 9.2 Modèles MongoDB

<details>
<summary>Voir les 27 modèles</summary>

1. User
2. Company
3. Subscription
4. Module
5. APIKey
6. AuditLog
7. Lead
8. LeadActivity
9. Pipeline
10. PipelineStage
11. Commercial
12. CommercialActivity
13. TransportOffer
14. TransportSearch
15. Transporter
16. ScrapingJob
17. ScrapingConfig
18. Notification
19. NotificationRead
20. Announcement
21. PasswordResetToken
22. RefreshToken
23. GDPRRequest
24. SystemLog
25. ErrorLog
26. Session
27. Settings

</details>

### 9.3 Variables d'environnement requises

```env
# Application
NODE_ENV=production
APP_VERSION=3.0.0
PORT=3000

# Database
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS
AWS_REGION=eu-west-3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# JWT (récupéré depuis Secrets Manager)
# JWT_SECRET=

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Frontend URLs
FRONTEND_URL=https://admin.rt-technologie.com
API_URL=https://api.rt-technologie.com

# Logging
LOG_LEVEL=info
```

---

## Validation

Ce cahier des charges doit être validé par :

- [ ] Responsable technique
- [ ] Responsable sécurité
- [ ] Product Owner
- [ ] Direction

---

**Document généré le** : 31 décembre 2024
**Auteur** : Claude AI
**Version** : 1.0

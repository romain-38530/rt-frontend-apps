/**
 * Routes Health Check
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    mongodb: { status: string; latency?: number };
    redis?: { status: string; latency?: number };
    memory: { used: number; total: number; percentage: number };
  };
}

/**
 * @route GET /health
 * @desc Health check complet avec détails
 */
router.get('/', async (req: Request, res: Response) => {
  const checks: HealthStatus['checks'] = {
    mongodb: { status: 'unknown' },
    memory: { used: 0, total: 0, percentage: 0 }
  };

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db?.admin().ping();
      checks.mongodb = {
        status: 'healthy',
        latency: Date.now() - mongoStart
      };
    } else {
      checks.mongodb = { status: 'unhealthy' };
    }
  } catch (error) {
    checks.mongodb = { status: 'unhealthy' };
  }

  // Check Redis (si configuré)
  if (process.env.REDIS_URL) {
    try {
      // Lazy check - ne pas créer de connexion juste pour le health check
      checks.redis = { status: 'configured' };
    } catch (error) {
      checks.redis = { status: 'unhealthy' };
    }
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
  const memoryHealthy = checks.memory.percentage < 90;

  let status: HealthStatus['status'] = 'healthy';
  if (!mongoHealthy) status = 'unhealthy';
  else if (!memoryHealthy) status = 'degraded';

  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Math.round(process.uptime()),
    checks
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(response);
});

/**
 * @route GET /health/live
 * @desc Liveness probe pour Kubernetes/ELB
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

/**
 * @route GET /health/ready
 * @desc Readiness probe - vérifie que l'app peut servir du trafic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Vérifier que MongoDB est connecté
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send('NOT READY - MongoDB disconnected');
    }

    await mongoose.connection.db?.admin().ping();
    res.status(200).send('READY');
  } catch {
    res.status(503).send('NOT READY');
  }
});

/**
 * @route GET /health/metrics
 * @desc Métriques système pour monitoring
 */
router.get('/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform
  });
});

export default router;

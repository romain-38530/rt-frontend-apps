/**
 * Configuration Bull Queues avec Redis
 */

import Bull, { Queue, JobOptions } from 'bull';

// Configuration Redis
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return redisUrl;
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
  };
};

// Options par défaut pour les jobs
const defaultJobOptions: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  },
  removeOnComplete: 100,
  removeOnFail: 50
};

// Créer les queues (lazy loading pour éviter les erreurs si Redis n'est pas disponible)
let _scrapingQueue: Queue | null = null;
let _emailQueue: Queue | null = null;
let _exportQueue: Queue | null = null;
let _gdprQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;

const createQueue = (name: string, jobOptions?: JobOptions): Queue => {
  const queue = new Bull(name, { redis: getRedisConfig() as any });

  // Définir les options par défaut via settings
  if (jobOptions || defaultJobOptions) {
    const opts = { ...defaultJobOptions, ...jobOptions };
    // Bull n'a pas de defaultJobOptions, on les appliquera lors de l'ajout de jobs
    (queue as any)._defaultJobOptions = opts;
  }

  // Event handlers
  queue.on('error', (error) => {
    console.error(`[Queue:${name}] Error:`, error.message);
  });

  queue.on('failed', (job, error) => {
    console.error(`[Queue:${name}] Job ${job.id} failed:`, error.message);
  });

  return queue;
};

// Getters pour les queues (créées à la demande)
export const getScrapingQueue = (): Queue => {
  if (!_scrapingQueue) {
    _scrapingQueue = createQueue('scraping', {
      timeout: 10 * 60 * 1000 // 10 minutes pour scraping
    });
  }
  return _scrapingQueue;
};

export const getEmailQueue = (): Queue => {
  if (!_emailQueue) {
    _emailQueue = createQueue('email', {
      timeout: 30 * 1000 // 30 secondes pour email
    });
  }
  return _emailQueue;
};

export const getExportQueue = (): Queue => {
  if (!_exportQueue) {
    _exportQueue = createQueue('export', {
      timeout: 5 * 60 * 1000 // 5 minutes pour export
    });
  }
  return _exportQueue;
};

export const getGdprQueue = (): Queue => {
  if (!_gdprQueue) {
    _gdprQueue = createQueue('gdpr', {
      timeout: 10 * 60 * 1000 // 10 minutes pour GDPR
    });
  }
  return _gdprQueue;
};

export const getNotificationQueue = (): Queue => {
  if (!_notificationQueue) {
    _notificationQueue = createQueue('notification', {
      timeout: 10 * 1000 // 10 secondes pour notification
    });
  }
  return _notificationQueue;
};

// Fermer toutes les queues proprement
export async function closeAllQueues(): Promise<void> {
  const queues = [_scrapingQueue, _emailQueue, _exportQueue, _gdprQueue, _notificationQueue];

  await Promise.all(
    queues.filter(q => q !== null).map(q => q!.close())
  );

  console.log('[Queues] All queues closed');
}

// Obtenir toutes les queues actives (pour Bull Board)
export function getAllQueues(): Queue[] {
  return [
    _scrapingQueue,
    _emailQueue,
    _exportQueue,
    _gdprQueue,
    _notificationQueue
  ].filter((q): q is Queue => q !== null);
}

export default {
  getScrapingQueue,
  getEmailQueue,
  getExportQueue,
  getGdprQueue,
  getNotificationQueue,
  closeAllQueues,
  getAllQueues
};

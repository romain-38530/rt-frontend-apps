/**
 * Configuration Winston Logger avec CloudWatch
 */

import winston from 'winston';

const { combine, timestamp, json, errors, colorize, simple, printf } = winston.format;

// Format personnalisé pour la console en dev
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Format de base pour production
const baseFormat = combine(
  timestamp({ format: 'ISO' }),
  errors({ stack: true }),
  json()
);

// Configuration des transports
const transports: winston.transport[] = [];

// Console transport (toujours actif)
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.Console({
      format: baseFormat
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        devFormat
      )
    })
  );
}

// Logger principal
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: baseFormat,
  defaultMeta: {
    service: 'rt-admin-api',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports
});

// Ajouter CloudWatch en production (lazy loading)
export async function initCloudWatchTransport(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.CLOUDWATCH_ENABLED === 'true') {
    try {
      const WinstonCloudWatch = (await import('winston-cloudwatch')).default;

      logger.add(new WinstonCloudWatch({
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP || 'rt-admin-api',
        logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'eu-west-3',
        jsonMessage: true,
        retentionInDays: 30
      }));

      logger.info('CloudWatch transport initialized');
    } catch (error) {
      logger.warn('CloudWatch transport not available', { error });
    }
  }
}

// Loggers spécialisés par module
export const scrapingLogger = logger.child({ module: 'scraping' });
export const crmLogger = logger.child({ module: 'crm' });
export const authLogger = logger.child({ module: 'auth' });
export const apiLogger = logger.child({ module: 'api' });

export default logger;

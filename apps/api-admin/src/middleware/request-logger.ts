/**
 * Middleware de logging des requêtes HTTP
 */

import { Request, Response, NextFunction } from 'express';
import { apiLogger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Générer un ID unique pour la requête
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);

  // Log à la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.id;

    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId
    };

    // Log niveau approprié selon le status
    if (res.statusCode >= 500) {
      apiLogger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      apiLogger.warn('HTTP Request Warning', logData);
    } else if (duration > 2000) {
      // Log warning si requête lente (> 2s)
      apiLogger.warn('Slow request detected', logData);
    } else {
      apiLogger.info('HTTP Request', logData);
    }
  });

  next();
}

export default requestLogger;

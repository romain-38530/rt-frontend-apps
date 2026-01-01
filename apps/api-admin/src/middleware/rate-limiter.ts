/**
 * Middleware Rate Limiting
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

// Store en mémoire par défaut (Redis recommandé en production)
// TODO: Ajouter RedisStore quand Redis est configuré

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

const createRateLimiter = (config: RateLimitConfig): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: config.message,
      retryAfter: Math.ceil(config.windowMs / 1000)
    },
    standardHeaders: true, // Retourne les headers `RateLimit-*`
    legacyHeaders: false,  // Désactive les headers `X-RateLimit-*`
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    keyGenerator: (req: Request) => {
      // Utiliser l'IP ou l'ID utilisateur si authentifié
      return (req as any).user?.id || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
  });
};

// Rate limit global - 1000 requêtes par 15 minutes
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later'
});

// Rate limit strict pour auth - 10 tentatives par 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

// Rate limit pour scraping - 50 jobs par heure
export const scrapingRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Scraping rate limit exceeded, please try again later'
});

// Rate limit pour API keys - 100 requêtes par minute
export const apiKeyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded'
});

// Rate limit pour password reset - 5 par heure
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests, please try again later'
});

// Rate limit pour emails - 20 par heure
export const emailRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Email rate limit exceeded, please try again later'
});

export default {
  globalRateLimiter,
  authRateLimiter,
  scrapingRateLimiter,
  apiKeyRateLimiter,
  passwordResetRateLimiter,
  emailRateLimiter
};

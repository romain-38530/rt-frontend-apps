/**
 * Configuration Sentry pour le tracking d'erreurs
 */

import * as Sentry from '@sentry/node';
import { Express, ErrorRequestHandler } from 'express';

export function initSentry(app: Express): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `rt-admin-api@${process.env.APP_VERSION || '1.0.0'}`,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Mongo({ useMongoose: true })
    ],

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Filtrer les erreurs sensibles
    beforeSend(event) {
      // Ne pas envoyer les erreurs avec des données sensibles
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Nettoyer les données sensibles dans les extras
      if (event.extra) {
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'adminKey'];
        for (const key of sensitiveKeys) {
          if (event.extra[key]) {
            event.extra[key] = '[REDACTED]';
          }
        }
      }

      return event;
    },

    // Ignorer certaines erreurs communes
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'Request aborted'
    ]
  });

  console.log('[Sentry] Initialized successfully');
}

// Middleware pour capturer les erreurs Express
export const sentryErrorHandler: ErrorRequestHandler = Sentry.Handlers.errorHandler();

// Helper pour capturer les erreurs avec contexte
export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

// Helper pour capturer les messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

// Helper pour ajouter du contexte utilisateur
export function setUserContext(user: { id: string; email?: string; roles?: string[] }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // @ts-ignore - roles n'est pas un champ standard Sentry mais utile pour nous
    roles: user.roles?.join(',')
  });
}

export default { initSentry, sentryErrorHandler, captureError, captureMessage, setUserContext };

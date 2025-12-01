import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
}

// Étendre l'interface Request d'Express pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token',
      });
    }

    // Vérifier le token via auth-api
    const authApiUrl = process.env.AUTH_API_URL || 'http://localhost:3001';

    try {
      const response = await axios.get(`${authApiUrl}/api/v1/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      if (response.status === 200 && response.data.user) {
        // Token valide - ajouter les informations user à la requête
        req.user = {
          userId: response.data.user.id || response.data.user.userId,
          email: response.data.user.email,
          role: response.data.user.role,
          companyId: response.data.user.companyId,
        };

        next();
      } else {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is not valid',
        });
      }
    } catch (authError: any) {
      // Erreur lors de la vérification du token
      if (authError.response?.status === 401) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          message: 'Please authenticate again',
        });
      }

      // Auth API non disponible - mode dégradé
      console.error('Auth API unavailable:', authError.message);

      // En mode développement, on peut accepter un token factice
      if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
        req.user = {
          userId: 'dev-user',
          email: 'dev@rt-technologie.com',
          role: 'admin',
          companyId: 'dev-company',
        };
        return next();
      }

      return res.status(503).json({
        error: 'Authentication service unavailable',
        message: 'Please try again later',
      });
    }
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

// Middleware optionnel - authentification non requise mais utilisée si présente
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Pas de token - continuer sans authentification
      return next();
    }

    // Tenter d'authentifier
    const authApiUrl = process.env.AUTH_API_URL || 'http://localhost:3001';

    try {
      const response = await axios.get(`${authApiUrl}/api/v1/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      if (response.status === 200 && response.data.user) {
        req.user = {
          userId: response.data.user.id || response.data.user.userId,
          email: response.data.user.email,
          role: response.data.user.role,
          companyId: response.data.user.companyId,
        };
      }
    } catch (error) {
      // Ignorer les erreurs en mode optionnel
      console.warn('Optional auth failed, continuing without auth');
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    next();
  }
}

// Middleware pour vérifier les rôles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

// Middleware pour vérifier que l'utilisateur accède à ses propres ressources
export function requireOwnership(userIdParam: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const resourceUserId = req.params[userIdParam] || req.query[userIdParam] || req.body[userIdParam];

    // Admin peut accéder à toutes les ressources
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    // Vérifier que l'utilisateur accède à ses propres ressources
    if (resourceUserId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
      });
    }

    next();
  };
}

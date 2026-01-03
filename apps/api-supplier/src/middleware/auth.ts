import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  supplierId?: string;
  user?: any;
}

/**
 * Middleware d'authentification JWT
 */
export const authenticateSupplier = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'No authorization token provided'
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      res.status(401).json({
        error: 'Invalid authorization format. Use: Bearer TOKEN'
      });
      return;
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    // Ajouter les informations du fournisseur à la requête
    req.supplierId = decoded.supplierId;
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token has expired',
        expiredAt: error.expiredAt
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Invalid token'
      });
      return;
    }

    res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Middleware pour vérifier les rôles
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated'
      });
      return;
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        yourRole: userRole
      });
      return;
    }

    next();
  };
};

/**
 * Middleware pour vérifier le statut du fournisseur
 */
export const checkSupplierStatus = (_allowedStatuses: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.supplierId) {
        res.status(401).json({
          error: 'Supplier ID not found in token'
        });
        return;
      }

      // Dans un cas réel, on ferait une requête à la DB
      // Pour cet exemple, on passe directement
      next();
    } catch (error: any) {
      res.status(500).json({
        error: 'Error checking supplier status',
        message: error.message
      });
    }
  };
};

/**
 * Génère un token JWT pour un fournisseur
 */
export const generateSupplierToken = (supplierId: string, additionalData?: any): string => {
  const payload = {
    supplierId,
    type: 'supplier',
    ...additionalData
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default-secret',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
    }
  );

  return token;
};

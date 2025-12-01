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
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: 'Invalid authorization format. Use: Bearer TOKEN'
      });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    // Ajouter les informations du fournisseur à la requête
    req.supplierId = decoded.supplierId;
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Middleware pour vérifier les rôles
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        yourRole: userRole
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier le statut du fournisseur
 */
export const checkSupplierStatus = (allowedStatuses: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supplierId) {
        return res.status(401).json({
          error: 'Supplier ID not found in token'
        });
      }

      // Dans un cas réel, on ferait une requête à la DB
      // Pour cet exemple, on passe directement
      next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'Error checking supplier status',
        message: error.message
      });
    }
  };
};

/**
 * Génère un token JWT pour un fournisseur
 */
export const generateSupplierToken = (supplierId: string, additionalData?: any) => {
  const payload = {
    supplierId,
    type: 'supplier',
    ...additionalData
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default-secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );

  return token;
};

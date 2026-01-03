import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  agentId?: string;
  user?: any;
  role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'sales-agents-secret-key';

/**
 * Middleware d'authentification JWT pour les administrateurs
 */
export const authenticateAdmin = (
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

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Invalid authorization format. Use: Bearer TOKEN'
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      res.status(403).json({
        error: 'Admin access required'
      });
      return;
    }

    req.userId = decoded.userId;
    req.user = decoded;
    req.role = decoded.role;

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
 * Middleware d'authentification JWT pour les agents commerciaux (portail)
 */
export const authenticateAgent = (
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

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Invalid authorization format. Use: Bearer TOKEN'
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'agent') {
      res.status(403).json({
        error: 'Agent access required'
      });
      return;
    }

    req.agentId = decoded.agentId;
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
 * Génère un token JWT pour un administrateur
 */
export const generateAdminToken = (userId: string, role: string = 'admin', additionalData?: any): string => {
  const payload = {
    userId,
    role,
    type: 'admin',
    ...additionalData
  };

  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Génère un token JWT pour un agent commercial
 */
export const generateAgentToken = (agentId: string, additionalData?: any): string => {
  const payload = {
    agentId,
    type: 'agent',
    ...additionalData
  };

  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

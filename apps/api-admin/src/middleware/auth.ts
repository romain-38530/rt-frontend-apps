/**
 * Middleware d'authentification Admin
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  companyId?: string;
}

export interface AuthRequest extends Request {
  user?: AdminUser;
}

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;

    // Check for admin roles
    const adminRoles = ['super_admin', 'admin', 'manager'];
    const hasAdminRole = decoded.roles?.some(role => adminRoles.includes(role));

    if (!hasAdminRole) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasRequiredRole = req.user.roles?.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

export const generateAdminToken = (user: AdminUser): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};

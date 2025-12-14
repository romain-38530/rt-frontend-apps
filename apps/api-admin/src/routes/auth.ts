/**
 * Routes d'authentification Admin
 */

import { Router, Request, Response } from 'express';
import { generateAdminToken, AdminUser } from '../middleware/auth';

const router = Router();

// Admin users (in production, these should be in database)
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@rt-technologie.com',
    adminKey: 'admin123',
    roles: ['super_admin', 'admin']
  },
  {
    id: '2',
    email: 'pricing@rt-technologie.com',
    adminKey: 'pricing123',
    roles: ['admin', 'manager']
  },
  {
    id: '3',
    email: 'commercial@rt-technologie.com',
    adminKey: 'commercial123',
    roles: ['manager']
  }
];

/**
 * POST /auth/admin/login
 * Authentification admin avec email + clé admin
 */
router.post('/admin/login', (req: Request, res: Response) => {
  const { email, adminKey } = req.body;

  if (!email || !adminKey) {
    return res.status(400).json({
      success: false,
      error: 'Email et clé d\'administration requis'
    });
  }

  const user = ADMIN_USERS.find(u => u.email === email && u.adminKey === adminKey);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Identifiants invalides'
    });
  }

  const tokenPayload: AdminUser = {
    id: user.id,
    email: user.email,
    roles: user.roles
  };

  const token = generateAdminToken(tokenPayload);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    }
  });
});

/**
 * POST /auth/admin/verify
 * Vérifie si un token est valide
 */
router.post('/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      valid: false
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      valid: false
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      valid: true,
      user: decoded
    });
  } catch {
    res.status(401).json({
      success: false,
      valid: false
    });
  }
});

export default router;

/**
 * Routes d'authentification Admin
 * Version sécurisée avec password reset et refresh tokens
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateAdminToken, AdminUser, authenticateAdmin, AuthRequest } from '../middleware/auth';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rate-limiter';
import { authLogger } from '../config/logger';
import { metricsService } from '../services/metrics-service';
import User from '../models/User';
import PasswordResetToken from '../models/PasswordResetToken';
import RefreshToken from '../models/RefreshToken';
import { JWT_CONFIG } from '../config/jwt';

const router = Router();

/**
 * Seed des utilisateurs admin par défaut
 * Appelé au démarrage pour s'assurer que les admins existent en DB
 */
export async function seedAdminUsers(): Promise<void> {
  const defaultAdmins = [
    {
      email: 'admin@rt-technologie.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'RT',
      roles: ['super_admin', 'admin'],
      status: 'active' as const,
      isActive: true
    },
    {
      email: 'pricing@rt-technologie.com',
      password: 'pricing123',
      firstName: 'Pricing',
      lastName: 'Manager',
      roles: ['admin', 'manager'],
      status: 'active' as const,
      isActive: true
    },
    {
      email: 'commercial@rt-technologie.com',
      password: 'commercial123',
      firstName: 'Commercial',
      lastName: 'Agent',
      roles: ['manager', 'commercial'],
      status: 'active' as const,
      isActive: true
    }
  ];

  for (const admin of defaultAdmins) {
    try {
      const existing = await User.findOne({ email: admin.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await User.create({
          ...admin,
          password: hashedPassword,
          permissions: []
        });
        authLogger.info('Admin user created', { email: admin.email });
      }
    } catch (error) {
      authLogger.error('Failed to seed admin user', { email: admin.email, error });
    }
  }
}

/**
 * POST /auth/login
 * Authentification standard (utilisateurs normaux)
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis'
    });
  }

  try {
    // Chercher l'utilisateur
    const user = await User.findOne({ email, isActive: true });

    if (!user || !user.password) {
      authLogger.warn('Login failed - user not found', { email, ip: req.ip });
      metricsService.recordLogin(false);
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      authLogger.warn('Login failed - wrong password', { email, ip: req.ip });
      metricsService.recordLogin(false);
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    const tokenPayload: AdminUser = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles || []
    };

    const accessToken = generateAdminToken(tokenPayload);

    // Créer un refresh token
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 10);

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    authLogger.info('Login successful', { email, userId: user._id });
    metricsService.recordLogin(true);

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: JWT_CONFIG.accessToken.expiresIn,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles || [],
        companyId: user.companyId
      }
    });
  } catch (error) {
    authLogger.error('Login error', { error, email });
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
});

/**
 * POST /auth/activate
 * Activer un compte avec le token d'activation
 */
router.post('/activate', async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token d\'activation requis'
    });
  }

  try {
    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      activationToken: token,
      isActive: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Si un mot de passe est fourni, le définir
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    // Activer le compte
    user.isActive = true;
    user.activationToken = undefined;
    user.activatedAt = new Date();
    await user.save();

    authLogger.info('Account activated', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Compte activé avec succès'
    });
  } catch (error) {
    authLogger.error('Activation error', { error });
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'activation'
    });
  }
});

/**
 * POST /auth/admin/login
 * Authentification admin avec email + clé admin (password)
 */
router.post('/admin/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, adminKey, password } = req.body;
  const pwd = adminKey || password; // Support both field names

  if (!email || !pwd) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis'
    });
  }

  // Chercher l'utilisateur dans la base de données
  const user = await User.findOne({ email, isActive: true });

  if (!user || !user.password) {
    authLogger.warn('Admin login failed - user not found', { email, ip: req.ip });
    metricsService.recordLogin(false);
    return res.status(401).json({
      success: false,
      error: 'Identifiants invalides'
    });
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(pwd, user.password);

  if (!isValidPassword) {
    authLogger.warn('Admin login failed - wrong password', { email, ip: req.ip });
    metricsService.recordLogin(false);
    return res.status(401).json({
      success: false,
      error: 'Identifiants invalides'
    });
  }

  // Vérifier que l'utilisateur a un rôle admin
  const adminRoles = ['super_admin', 'admin', 'manager'];
  const hasAdminRole = user.roles?.some(role => adminRoles.includes(role));

  if (!hasAdminRole) {
    authLogger.warn('Admin login failed - no admin role', { email, ip: req.ip });
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  const tokenPayload: AdminUser = {
    id: user._id?.toString() || user.id,
    email: user.email,
    roles: user.roles || []
  };

  const accessToken = generateAdminToken(tokenPayload);

  // Créer un refresh token
  const refreshTokenValue = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 10);

  await RefreshToken.create({
    userId: user._id || user.id,
    token: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    userAgent: req.get('user-agent'),
    ipAddress: req.ip
  });

  authLogger.info('Login successful', { email, userId: user._id || user.id });
  metricsService.recordLogin(true);

  res.json({
    success: true,
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn: JWT_CONFIG.accessToken.expiresIn,
    user: {
      id: user._id?.toString() || user.id,
      email: user.email,
      roles: user.roles || [],
      firstName: (user as any).firstName,
      lastName: (user as any).lastName
    }
  });
});

/**
 * POST /auth/refresh
 * Rafraîchir le token d'accès
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required'
    });
  }

  try {
    // Chercher tous les refresh tokens non révoqués et non expirés
    const tokens = await RefreshToken.find({
      revoked: false,
      expiresAt: { $gt: new Date() }
    });

    let validToken = null;
    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.token)) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(validToken.userId);
    if (!user || !user.isActive) {
      // Révoquer le token si l'utilisateur n'existe plus
      validToken.revoked = true;
      validToken.revokedReason = 'User not found or inactive';
      await validToken.save();

      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const tokenPayload: AdminUser = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles || []
    };

    const accessToken = generateAdminToken(tokenPayload);

    metricsService.recordTokenRefresh();

    res.json({
      success: true,
      accessToken,
      expiresIn: JWT_CONFIG.accessToken.expiresIn
    });
  } catch (error) {
    authLogger.error('Token refresh failed', { error });
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /auth/logout
 * Déconnexion - révoque le refresh token
 */
router.post('/logout', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      // Révoquer le refresh token spécifique
      const tokens = await RefreshToken.find({
        userId: req.user!.id,
        revoked: false
      });

      for (const token of tokens) {
        if (await bcrypt.compare(refreshToken, token.token)) {
          token.revoked = true;
          token.revokedAt = new Date();
          token.revokedReason = 'User logout';
          await token.save();
          break;
        }
      }
    }

    authLogger.info('Logout successful', { userId: req.user!.id });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /auth/logout-all
 * Révoque tous les refresh tokens de l'utilisateur
 */
router.post('/logout-all', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const count = await RefreshToken.updateMany(
      { userId: req.user!.id, revoked: false },
      { revoked: true, revokedAt: new Date(), revokedReason: 'Logout all devices' }
    );

    authLogger.info('Logout all devices', { userId: req.user!.id, revokedCount: count.modifiedCount });

    res.json({
      success: true,
      message: `Logged out from ${count.modifiedCount} device(s)`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  // Toujours retourner succès (sécurité - ne pas révéler si l'email existe)
  const successMessage = 'Si cet email existe, un lien de réinitialisation a été envoyé.';

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email required'
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      authLogger.info('Password reset requested for non-existent email', { email });
      return res.json({ success: true, message: successMessage });
    }

    // Générer token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    // Supprimer anciens tokens
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Créer nouveau token
    await PasswordResetToken.create({
      userId: user._id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 heure
    });

    // TODO: Envoyer email avec le token
    // await emailService.sendPasswordReset(email, token);

    // Pour le dev, logger le token
    if (process.env.NODE_ENV !== 'production') {
      authLogger.info('Password reset token generated (dev only)', { email, token });
    }

    authLogger.info('Password reset requested', { email, userId: user._id });

    res.json({ success: true, message: successMessage });
  } catch (error) {
    authLogger.error('Password reset error', { error, email });
    res.json({ success: true, message: successMessage });
  }
});

/**
 * POST /auth/reset-password
 * Réinitialisation du mot de passe avec token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Token and new password required'
    });
  }

  // Validation mot de passe
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters'
    });
  }

  try {
    // Trouver token valide
    const resetTokens = await PasswordResetToken.find({
      expiresAt: { $gt: new Date() },
      used: false
    });

    let validToken = null;
    for (const rt of resetTokens) {
      if (await bcrypt.compare(token, rt.token)) {
        validToken = rt;
        break;
      }
    }

    if (!validToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Mettre à jour mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(validToken.userId, { password: hashedPassword });

    // Marquer token comme utilisé
    validToken.used = true;
    await validToken.save();

    // Révoquer tous les refresh tokens (forcer re-login)
    await RefreshToken.updateMany(
      { userId: validToken.userId, revoked: false },
      { revoked: true, revokedAt: new Date(), revokedReason: 'Password reset' }
    );

    authLogger.info('Password reset successful', { userId: validToken.userId });

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    authLogger.error('Password reset error', { error });
    res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
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

/**
 * GET /auth/me
 * Récupérer les infos de l'utilisateur connecté
 */
router.get('/me', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');

    if (!user) {
      // Fallback pour les utilisateurs statiques
      return res.json({
        success: true,
        user: req.user
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        companyId: user.companyId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

/**
 * PUT /auth/change-password
 * Changer le mot de passe (utilisateur connecté)
 */
router.put('/change-password', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters'
    });
  }

  try {
    const user = await User.findById(req.user!.id);

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change password for this account'
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    authLogger.info('Password changed', { userId: req.user!.id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    authLogger.error('Password change error', { error, userId: req.user!.id });
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
});

export default router;

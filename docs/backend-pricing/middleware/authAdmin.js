/**
 * Middleware d'Authentification Admin pour les Endpoints Pricing
 *
 * Ce middleware vérifie que l'utilisateur est authentifié et possède
 * les permissions admin avant d'autoriser l'accès aux endpoints de
 * modification de pricing.
 *
 * Usage:
 * ```javascript
 * const { requireAdmin } = require('./middleware/authAdmin');
 * router.post('/api/pricing', requireAdmin, async (req, res) => { ... });
 * ```
 *
 * Service: subscriptions-contracts v2.4.0
 */

const jwt = require('jsonwebtoken');

/**
 * Configuration JWT
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rt-technologie';

/**
 * Liste des rôles admin autorisés
 */
const ADMIN_ROLES = ['admin', 'super_admin', 'pricing_manager'];

/**
 * Middleware pour vérifier l'authentification admin
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function requireAdmin(req, res, next) {
  try {
    // 1. Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis',
        error: 'MISSING_AUTH_HEADER'
      });
    }

    // 2. Extraire le token (format: "Bearer <token>")
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Format de token invalide',
        error: 'INVALID_AUTH_FORMAT'
      });
    }

    // 3. Vérifier et décoder le token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré',
          error: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token invalide',
          error: 'INVALID_TOKEN'
        });
      } else {
        throw err;
      }
    }

    // 4. Vérifier que le token contient un userId
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide: userId manquant',
        error: 'MISSING_USER_ID'
      });
    }

    // 5. Vérifier que l'utilisateur a un rôle admin
    const userRole = decoded.role || decoded.accountType;

    if (!userRole || !ADMIN_ROLES.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: permissions admin requises',
        error: 'FORBIDDEN',
        requiredRoles: ADMIN_ROLES,
        userRole: userRole || 'none'
      });
    }

    // 6. Ajouter les infos utilisateur à la requête
    req.user = {
      id: decoded.userId,
      role: userRole,
      email: decoded.email,
      accountType: decoded.accountType
    };

    // 7. Continuer vers le prochain middleware/route handler
    next();

  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'authentification',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

/**
 * Middleware optionnel pour vérifier l'authentification (sans forcer admin)
 * Utile pour les endpoints qui ont un comportement différent selon si l'utilisateur
 * est admin ou non
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Pas de token, continuer sans authentification
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER
      });

      req.user = {
        id: decoded.userId,
        role: decoded.role || decoded.accountType,
        email: decoded.email,
        accountType: decoded.accountType,
        isAdmin: ADMIN_ROLES.includes(decoded.role || decoded.accountType)
      };
    } catch (err) {
      // Token invalide ou expiré, continuer sans authentification
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Error in optionalAuth middleware:', error);
    req.user = null;
    next();
  }
}

/**
 * Fonction utilitaire pour générer un token JWT admin
 * (à utiliser lors de la connexion d'un admin)
 *
 * @param {Object} user - Objet utilisateur
 * @param {string} user.id - ID de l'utilisateur
 * @param {string} user.email - Email de l'utilisateur
 * @param {string} user.role - Rôle de l'utilisateur (admin, super_admin, etc.)
 * @param {string} expiresIn - Durée de validité du token (défaut: 7 jours)
 * @returns {string} JWT token
 */
function generateAdminToken(user, expiresIn = '7d') {
  if (!ADMIN_ROLES.includes(user.role)) {
    throw new Error(`Role ${user.role} is not an admin role`);
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      accountType: user.accountType || 'DOUANE',
      isAdmin: true
    },
    JWT_SECRET,
    {
      issuer: JWT_ISSUER,
      expiresIn: expiresIn
    }
  );
}

/**
 * Fonction utilitaire pour vérifier si un token est valide
 *
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token ou null si invalide
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER
    });
  } catch (err) {
    return null;
  }
}

/**
 * Fonction utilitaire pour vérifier si un utilisateur est admin
 *
 * @param {Object} user - Objet utilisateur (de req.user)
 * @returns {boolean} True si admin
 */
function isAdmin(user) {
  if (!user || !user.role) {
    return false;
  }
  return ADMIN_ROLES.includes(user.role);
}

module.exports = {
  requireAdmin,
  optionalAuth,
  generateAdminToken,
  verifyToken,
  isAdmin,
  ADMIN_ROLES
};

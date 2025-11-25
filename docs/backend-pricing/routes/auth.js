/**
 * Authentication Routes pour Admin
 *
 * Endpoints pour l'authentification des administrateurs:
 * - POST /api/auth/admin/login - Login admin
 * - POST /api/auth/admin/refresh - Refresh token
 * - POST /api/auth/admin/logout - Logout admin
 * - GET /api/auth/admin/me - Obtenir les infos de l'admin connecté
 *
 * Service: subscriptions-contracts v2.4.0
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateAdminToken, requireAdmin, verifyToken } = require('../middleware/authAdmin');

// Collection MongoDB pour les admins (à créer)
// Pour l'instant, on utilise une liste en dur (à remplacer par MongoDB)
const ADMIN_USERS = [
  {
    id: 'admin-1',
    email: 'admin@rt-technologie.com',
    // Password: admin123 (hashedavec bcrypt)
    password: '$2a$10$rN.xK5QhX9qGvVJzY3h8FOXvZ8hX6hVz.FQ6pqE5hC0yQmDYBXYjO',
    role: 'super_admin',
    accountType: 'DOUANE',
    firstName: 'Admin',
    lastName: 'RT Tech'
  },
  {
    id: 'pricing-manager-1',
    email: 'pricing@rt-technologie.com',
    // Password: pricing123
    password: '$2a$10$N8cqM.yYK5xX7hZ9QvF8zuKpqE5hC0yQmDYBXYjOrN.xK5QhX9qGv',
    role: 'pricing_manager',
    accountType: 'DOUANE',
    firstName: 'Pricing',
    lastName: 'Manager'
  }
];

/**
 * @route   POST /api/auth/admin/login
 * @desc    Connexion admin
 * @access  Public
 * @body    {string} email - Email de l'admin
 * @body    {string} password - Mot de passe
 * @returns {Object} Token JWT et infos utilisateur
 *
 * @example
 * POST /api/auth/admin/login
 * {
 *   "email": "admin@rt-technologie.com",
 *   "password": "admin123"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "admin-1",
 *     "email": "admin@rt-technologie.com",
 *     "role": "super_admin",
 *     "accountType": "DOUANE",
 *     "firstName": "Admin",
 *     "lastName": "RT Tech"
 *   }
 * }
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'admin par email
    const admin = ADMIN_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!admin) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer le token JWT
    const token = generateAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      accountType: admin.accountType
    }, '7d'); // Token valide 7 jours

    // Retourner le token et les infos utilisateur (sans le password)
    res.json({
      success: true,
      token: token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        accountType: admin.accountType,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

/**
 * @route   POST /api/auth/admin/refresh
 * @desc    Refresh le token JWT
 * @access  Admin (token requis)
 * @returns {Object} Nouveau token
 *
 * @example
 * POST /api/auth/admin/refresh
 * Headers: Authorization: Bearer <old-token>
 *
 * Response 200:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/admin/refresh', requireAdmin, async (req, res) => {
  try {
    // req.user est défini par le middleware requireAdmin
    const user = req.user;

    // Générer un nouveau token
    const newToken = generateAdminToken({
      id: user.id,
      email: user.email,
      role: user.role,
      accountType: user.accountType
    }, '7d');

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refresh du token'
    });
  }
});

/**
 * @route   POST /api/auth/admin/logout
 * @desc    Logout admin (invalider le token côté client)
 * @access  Admin
 * @returns {Object} Confirmation
 *
 * Note: Avec JWT, le logout se fait principalement côté client
 * en supprimant le token. Ce endpoint est là pour la cohérence.
 * En production, vous pourriez maintenir une blacklist de tokens.
 */
router.post('/admin/logout', requireAdmin, async (req, res) => {
  try {
    // TODO: En production, ajouter le token à une blacklist Redis
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // await redis.setex(`blacklist:${token}`, 7*24*60*60, 'true');

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

/**
 * @route   GET /api/auth/admin/me
 * @desc    Obtenir les infos de l'admin connecté
 * @access  Admin
 * @returns {Object} Infos utilisateur
 *
 * @example
 * GET /api/auth/admin/me
 * Headers: Authorization: Bearer <token>
 *
 * Response 200:
 * {
 *   "success": true,
 *   "user": {
 *     "id": "admin-1",
 *     "email": "admin@rt-technologie.com",
 *     "role": "super_admin",
 *     "accountType": "DOUANE"
 *   }
 * }
 */
router.get('/admin/me', requireAdmin, async (req, res) => {
  try {
    // req.user est défini par le middleware requireAdmin
    const user = req.user;

    // Trouver l'admin complet (avec firstName, lastName, etc.)
    const admin = ADMIN_USERS.find(u => u.id === user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        accountType: admin.accountType,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations'
    });
  }
});

/**
 * @route   POST /api/auth/admin/create
 * @desc    Créer un nouvel admin (super_admin seulement)
 * @access  Super Admin
 * @body    {string} email
 * @body    {string} password
 * @body    {string} role - admin, super_admin, pricing_manager
 * @body    {string} firstName
 * @body    {string} lastName
 * @returns {Object} Nouvel admin créé
 *
 * Note: En production, ceci devrait sauvegarder dans MongoDB
 */
router.post('/admin/create', requireAdmin, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les super admins peuvent créer des admins'
      });
    }

    const { email, password, role, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password et role requis'
      });
    }

    const validRoles = ['admin', 'super_admin', 'pricing_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rôle invalide. Rôles valides: ${validRoles.join(', ')}`
      });
    }

    // Vérifier si l'email existe déjà
    if (ADMIN_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Un admin avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel admin
    const newAdmin = {
      id: `admin-${Date.now()}`,
      email: email,
      password: hashedPassword,
      role: role,
      accountType: 'DOUANE',
      firstName: firstName || '',
      lastName: lastName || ''
    };

    // TODO: En production, sauvegarder dans MongoDB
    // await Admin.create(newAdmin);

    // Pour l'instant, ajouter à la liste en mémoire (temporaire)
    ADMIN_USERS.push(newAdmin);

    res.status(201).json({
      success: true,
      message: 'Admin créé avec succès',
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        accountType: newAdmin.accountType,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin'
    });
  }
});

module.exports = router;

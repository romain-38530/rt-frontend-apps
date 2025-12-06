import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Logistician from '../models/Logistician';
import LogisticianInvitation from '../models/LogisticianInvitation';
import OrderAccess from '../models/OrderAccess';
import User from '../models/User';
import emailService from '../services/email-service';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface utilisateur pour le middleware
interface AuthenticatedUser {
  userId: string;
  industrialId?: string;
  logisticianId?: string;
  companyName?: string;
  name?: string;
  email?: string;
  role?: string;
}

// Type pour les requêtes authentifiées
interface AuthenticatedRequest extends express.Request {
  user: AuthenticatedUser;
}

// Middleware d'authentification
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Helper pour obtenir l'utilisateur authentifié (garantit que user existe après authenticate)
const getUser = (req: express.Request): AuthenticatedUser => {
  return (req as AuthenticatedRequest).user;
};

// ========== INVITATIONS (Côté Industriel) ==========

/**
 * POST /logisticians/invite
 * Inviter un logisticien
 */
router.post('/invite', authenticate, async (req, res) => {
  try {
    const { email, companyName, accessLevel, message, orderIds } = req.body;
    const industrialId = getUser(req).industrialId || getUser(req).userId;
    const industrialName = getUser(req).companyName || getUser(req).name || 'Industriel';

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier si une invitation existe déjà
    const existingInvitation = await LogisticianInvitation.findOne({
      email: email.toLowerCase(),
      industrialId,
      status: 'pending',
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente pour cet email' });
    }

    // Vérifier si le logisticien existe déjà
    const existingLogistician = await Logistician.findOne({
      email: email.toLowerCase(),
      industrialId,
    });

    if (existingLogistician) {
      return res.status(400).json({ error: 'Ce logisticien existe déjà' });
    }

    // Créer l'invitation
    const invitation = new LogisticianInvitation({
      industrialId,
      industrialName,
      email: email.toLowerCase(),
      companyName,
      accessLevel: accessLevel || 'view',
      message,
      orderIds,
    });

    await invitation.save();

    // Envoyer email d'invitation
    const invitationUrl = `${process.env.LOGISTICIAN_PORTAL_URL || 'https://logistician.symphonia.com'}/invitation/${invitation.token}`;

    const emailSent = await emailService.sendLogisticianInvitation({
      email: email.toLowerCase(),
      industrialName,
      companyName,
      invitationUrl,
      accessLevel: accessLevel || 'view',
      message,
    });

    res.status(201).json({
      invitationId: invitation.invitationId,
      invitationUrl,
      expiresAt: invitation.expiresAt,
      emailSent,
    });
  } catch (error: any) {
    console.error('Erreur invitation:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

/**
 * POST /logisticians/invitations/:id/resend
 * Renvoyer une invitation
 */
router.post('/invitations/:id/resend', authenticate, async (req, res) => {
  try {
    const invitation = await LogisticianInvitation.findOne({
      invitationId: req.params.id,
      industrialId: getUser(req).industrialId || getUser(req).userId,
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    // Réinitialiser l'expiration
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.status = 'pending';
    await invitation.save();

    // Renvoyer email d'invitation
    const invitationUrl = `${process.env.LOGISTICIAN_PORTAL_URL || 'https://logistician.symphonia.com'}/invitation/${invitation.token}`;

    const emailSent = await emailService.sendLogisticianInvitation({
      email: invitation.email,
      industrialName: invitation.industrialName,
      companyName: invitation.companyName,
      invitationUrl,
      accessLevel: invitation.accessLevel,
    });

    res.json({ success: true, expiresAt: invitation.expiresAt, emailSent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /logisticians/invitations/:id
 * Annuler une invitation
 */
router.delete('/invitations/:id', authenticate, async (req, res) => {
  try {
    const invitation = await LogisticianInvitation.findOne({
      invitationId: req.params.id,
      industrialId: getUser(req).industrialId || getUser(req).userId,
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    invitation.status = 'cancelled';
    invitation.cancelledAt = new Date();
    await invitation.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/invitations/pending
 * Lister les invitations en attente
 */
router.get('/invitations/pending', authenticate, async (req, res) => {
  try {
    const invitations = await LogisticianInvitation.find({
      industrialId: getUser(req).industrialId || getUser(req).userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== VALIDATION INVITATION (Côté Logisticien) ==========

/**
 * GET /logisticians/validate/:token
 * Valider un token d'invitation
 */
router.get('/validate/:token', async (req, res) => {
  try {
    const invitation = await LogisticianInvitation.findOne({
      token: req.params.token,
    });

    if (!invitation) {
      return res.json({ valid: false, error: 'Invitation non trouvée' });
    }

    if (invitation.status !== 'pending') {
      return res.json({ valid: false, error: 'Invitation déjà utilisée ou annulée' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.json({ valid: false, error: 'Invitation expirée' });
    }

    res.json({
      valid: true,
      email: invitation.email,
      industrialName: invitation.industrialName,
      companyName: invitation.companyName,
      accessLevel: invitation.accessLevel,
      expiresAt: invitation.expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

/**
 * POST /logisticians/register
 * Accepter une invitation et créer le compte
 */
router.post('/register', async (req, res) => {
  try {
    const { token, password, companyName, contacts, siret, address } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' });
    }

    const invitation = await LogisticianInvitation.findOne({ token });

    if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation invalide ou expirée' });
    }

    // Créer l'utilisateur
    const user = new User({
      email: invitation.email,
      password,
      name: contacts?.[0]?.name || companyName,
      role: 'user',
      portal: 'logistician',
    });
    await user.save();

    // Créer le profil logisticien
    const logistician = new Logistician({
      userId: user._id,
      industrialId: invitation.industrialId,
      industrialName: invitation.industrialName,
      companyName: companyName || invitation.companyName || 'Entreprise',
      siret,
      email: invitation.email,
      address,
      contacts: contacts || [],
      status: 'active',
      accessLevel: invitation.accessLevel,
      invitedBy: invitation.industrialId,
      activatedAt: new Date(),
    });
    await logistician.save();

    // Marquer l'invitation comme acceptée
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Créer les accès aux commandes si spécifiés
    if (invitation.orderIds && invitation.orderIds.length > 0) {
      for (const orderId of invitation.orderIds) {
        const orderAccess = new OrderAccess({
          orderId,
          logisticianId: logistician.logisticianId,
          industrialId: invitation.industrialId,
          accessLevel: invitation.accessLevel,
          grantedBy: invitation.industrialId,
        });
        await orderAccess.save();
      }
    }

    // Générer le token JWT
    const accessToken = jwt.sign(
      {
        userId: user._id,
        logisticianId: logistician.logisticianId,
        industrialId: logistician.industrialId,
        email: user.email,
        portal: 'logistician',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      logisticianId: logistician.logisticianId,
      industrialId: logistician.industrialId,
      industrialName: logistician.industrialName,
      accessToken,
      refreshToken: accessToken, // TODO: implémenter refresh token
      status: logistician.status,
    });
  } catch (error: any) {
    console.error('Erreur registration:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION LOGISTICIENS (Côté Industriel) ==========

/**
 * GET /logisticians
 * Lister les logisticiens de l'industriel
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, accessLevel, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const industrialId = getUser(req).industrialId || getUser(req).userId;

    const filter: any = { industrialId };

    if (status) {
      filter.status = { $in: (status as string).split(',') };
    }
    if (accessLevel) {
      filter.accessLevel = { $in: (accessLevel as string).split(',') };
    }
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Logistician.countDocuments(filter);
    const logisticians = await Logistician.find(filter)
      .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      data: logisticians,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/me
 * Obtenir le profil du logisticien connecté
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const logistician = await Logistician.findOne({
      logisticianId: getUser(req).logisticianId,
    });

    if (!logistician) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    // Mettre à jour lastLoginAt
    logistician.lastLoginAt = new Date();
    await logistician.save();

    res.json(logistician);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /logisticians/me
 * Mettre à jour son profil
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { companyName, contacts, settings } = req.body;

    const logistician = await Logistician.findOneAndUpdate(
      { logisticianId: getUser(req).logisticianId },
      {
        $set: {
          ...(companyName && { companyName }),
          ...(contacts && { contacts }),
          ...(settings && { settings }),
        },
      },
      { new: true }
    );

    if (!logistician) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    res.json(logistician);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/me/stats
 * Obtenir mes statistiques
 */
router.get('/me/stats', authenticate, async (req, res) => {
  try {
    const logisticianId = getUser(req).logisticianId;

    const [totalOrders, activeAccess] = await Promise.all([
      OrderAccess.countDocuments({ logisticianId, revoked: false }),
      OrderAccess.find({ logisticianId, revoked: false }).limit(100),
    ]);

    res.json({
      totalOrders,
      activeOrders: totalOrders,
      completedOrders: 0, // TODO: implémenter
      sharedOrders: totalOrders,
      lastActivityAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/me/orders
 * Obtenir mes commandes partagées
 */
router.get('/me/orders', authenticate, async (req, res) => {
  try {
    const orders = await OrderAccess.find({
      logisticianId: getUser(req).logisticianId,
      revoked: false,
    }).sort({ grantedAt: -1 });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/:id
 * Obtenir un logisticien par ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const logistician = await Logistician.findOne({
      logisticianId: req.params.id,
      industrialId: getUser(req).industrialId || getUser(req).userId,
    });

    if (!logistician) {
      return res.status(404).json({ error: 'Logisticien non trouvé' });
    }

    res.json(logistician);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /logisticians/:id
 * Mettre à jour un logisticien
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { companyName, contacts, settings, accessLevel } = req.body;

    const logistician = await Logistician.findOneAndUpdate(
      {
        logisticianId: req.params.id,
        industrialId: getUser(req).industrialId || getUser(req).userId,
      },
      {
        $set: {
          ...(companyName && { companyName }),
          ...(contacts && { contacts }),
          ...(settings && { settings }),
          ...(accessLevel && { accessLevel }),
        },
      },
      { new: true }
    );

    if (!logistician) {
      return res.status(404).json({ error: 'Logisticien non trouvé' });
    }

    res.json(logistician);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /logisticians/:id/suspend
 * Suspendre un logisticien
 */
router.post('/:id/suspend', authenticate, async (req, res) => {
  try {
    const logistician = await Logistician.findOneAndUpdate(
      {
        logisticianId: req.params.id,
        industrialId: getUser(req).industrialId || getUser(req).userId,
      },
      { $set: { status: 'suspended' } },
      { new: true }
    );

    if (!logistician) {
      return res.status(404).json({ error: 'Logisticien non trouvé' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /logisticians/:id/reactivate
 * Réactiver un logisticien
 */
router.post('/:id/reactivate', authenticate, async (req, res) => {
  try {
    const logistician = await Logistician.findOneAndUpdate(
      {
        logisticianId: req.params.id,
        industrialId: getUser(req).industrialId || getUser(req).userId,
      },
      { $set: { status: 'active' } },
      { new: true }
    );

    if (!logistician) {
      return res.status(404).json({ error: 'Logisticien non trouvé' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /logisticians/:id
 * Supprimer un logisticien
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const logistician = await Logistician.findOneAndDelete({
      logisticianId: req.params.id,
      industrialId: getUser(req).industrialId || getUser(req).userId,
    });

    if (!logistician) {
      return res.status(404).json({ error: 'Logisticien non trouvé' });
    }

    // Révoquer tous les accès
    await OrderAccess.updateMany(
      { logisticianId: req.params.id },
      { $set: { revoked: true, revokedAt: new Date(), revokedBy: getUser(req).userId } }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/:id/stats
 * Obtenir les statistiques d'un logisticien
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const totalOrders = await OrderAccess.countDocuments({
      logisticianId: req.params.id,
      revoked: false,
    });

    res.json({
      totalOrders,
      activeOrders: totalOrders,
      completedOrders: 0,
      sharedOrders: totalOrders,
      lastActivityAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PARTAGE DE COMMANDES ==========

/**
 * POST /logisticians/orders/share
 * Partager une commande avec des logisticiens
 */
router.post('/orders/share', authenticate, async (req, res) => {
  try {
    const { orderId, logisticianIds, accessLevel, expiresAt } = req.body;
    const industrialId = getUser(req).industrialId || getUser(req).userId;

    if (!orderId || !logisticianIds || logisticianIds.length === 0) {
      return res.status(400).json({ error: 'orderId et logisticianIds requis' });
    }

    const sharedWith = [];

    for (const logisticianId of logisticianIds) {
      // Vérifier que le logisticien appartient à l'industriel
      const logistician = await Logistician.findOne({ logisticianId, industrialId });
      if (!logistician) continue;

      // Vérifier si un accès existe déjà
      let access = await OrderAccess.findOne({ orderId, logisticianId });

      if (access) {
        // Mettre à jour l'accès existant
        access.accessLevel = accessLevel || access.accessLevel;
        access.revoked = false;
        access.revokedAt = undefined;
        if (expiresAt) access.expiresAt = new Date(expiresAt);
        await access.save();
      } else {
        // Créer un nouvel accès
        access = new OrderAccess({
          orderId,
          logisticianId,
          industrialId,
          accessLevel: accessLevel || 'view',
          grantedBy: getUser(req).userId,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });
        await access.save();
      }

      sharedWith.push({
        logisticianId,
        accessLevel: access.accessLevel,
        notified: true, // TODO: envoyer notification
      });
    }

    res.json({ orderId, sharedWith });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/orders/:orderId/access
 * Obtenir les accès d'une commande
 */
router.get('/orders/:orderId/access', authenticate, async (req, res) => {
  try {
    const accesses = await OrderAccess.find({
      orderId: req.params.orderId,
      industrialId: getUser(req).industrialId || getUser(req).userId,
    });

    res.json(accesses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /logisticians/orders/revoke
 * Révoquer l'accès d'un logisticien à une commande
 */
router.post('/orders/revoke', authenticate, async (req, res) => {
  try {
    const { orderId, logisticianId, reason } = req.body;

    const access = await OrderAccess.findOneAndUpdate(
      {
        orderId,
        logisticianId,
        industrialId: getUser(req).industrialId || getUser(req).userId,
      },
      {
        $set: {
          revoked: true,
          revokedAt: new Date(),
          revokedBy: getUser(req).userId,
          revokeReason: reason,
        },
      },
      { new: true }
    );

    if (!access) {
      return res.status(404).json({ error: 'Accès non trouvé' });
    }

    res.json({ success: true, revokedAt: access.revokedAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /logisticians/:id/orders
 * Obtenir les commandes partagées avec un logisticien
 */
router.get('/:id/orders', authenticate, async (req, res) => {
  try {
    const orders = await OrderAccess.find({
      logisticianId: req.params.id,
      industrialId: getUser(req).industrialId || getUser(req).userId,
      revoked: false,
    });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== NOTIFICATIONS ==========

/**
 * GET /logisticians/notifications
 * Obtenir les notifications
 */
router.get('/notifications', authenticate, async (req, res) => {
  try {
    // TODO: implémenter système de notifications
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /logisticians/notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    // TODO: implémenter
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /logisticians/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    // TODO: implémenter
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

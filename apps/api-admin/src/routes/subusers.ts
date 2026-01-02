/**
 * Routes de gestion des sous-utilisateurs
 * CRUD complet avec vérification des limites d'abonnement
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import SubUser, { AccessLevel, Universe } from '../models/SubUser';
import User from '../models/User';
import { AuthRequest, authenticateAdmin } from '../middleware/auth';
import { canManageSubUsers, AccessControlRequest } from '../middleware/accessLevel';
import { canCreateSubUser, getSubUserLimitInfo } from '../services/subscription-limits';
import { authLogger } from '../config/logger';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateAdmin);

/**
 * GET /api/subusers
 * Liste des sous-utilisateurs du compte connecté
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Récupérer les sous-utilisateurs
    const subUsers = await SubUser.find({ parentUserId: userId })
      .select('-password -activationToken')
      .sort({ createdAt: -1 });

    // Récupérer les infos de limite
    const limitInfo = await getSubUserLimitInfo(userId);

    res.json({
      success: true,
      data: {
        subUsers,
        limit: {
          current: limitInfo.currentCount,
          max: limitInfo.maxAllowed,
          remaining: limitInfo.remaining,
          plan: limitInfo.plan,
          canAdd: limitInfo.allowed
        }
      }
    });
  } catch (error: any) {
    authLogger.error('Error fetching subusers', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des membres'
    });
  }
});

/**
 * GET /api/subusers/:id
 * Détails d'un sous-utilisateur
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId: userId
    }).select('-password -activationToken');

    if (!subUser) {
      return res.status(404).json({
        success: false,
        error: 'Membre non trouvé'
      });
    }

    res.json({
      success: true,
      data: subUser
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du membre'
    });
  }
});

/**
 * POST /api/subusers
 * Créer un nouveau sous-utilisateur (envoie invitation par email)
 */
router.post('/', canManageSubUsers, async (req: AccessControlRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { email, firstName, lastName, accessLevel, universes, phone } = req.body;

    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, prénom et nom sont requis'
      });
    }

    // Vérifier la limite d'abonnement
    const limitCheck = await canCreateSubUser(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.message,
        limit: {
          current: limitCheck.currentCount,
          max: limitCheck.maxAllowed,
          plan: limitCheck.plan
        }
      });
    }

    // Vérifier si l'email existe déjà (User ou SubUser)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingSubUser = await SubUser.findOne({ email: email.toLowerCase() });

    if (existingUser || existingSubUser) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Valider le niveau d'accès
    const validAccessLevels: AccessLevel[] = ['admin', 'editor', 'reader'];
    const level: AccessLevel = validAccessLevels.includes(accessLevel) ? accessLevel : 'reader';

    // Valider les univers
    const validUniverses: Universe[] = ['industry', 'logistician', 'transporter', 'forwarder', 'supplier', 'recipient'];
    const selectedUniverses: Universe[] = Array.isArray(universes)
      ? universes.filter((u: string) => validUniverses.includes(u as Universe))
      : validUniverses; // Par défaut, tous les univers

    // Générer token d'activation
    const activationToken = crypto.randomBytes(32).toString('hex');

    // Créer le sous-utilisateur
    const subUser = await SubUser.create({
      parentUserId: userId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      accessLevel: level,
      universes: selectedUniverses,
      status: 'pending',
      activationToken,
      invitedAt: new Date()
    });

    // TODO: Envoyer email d'invitation avec le token
    // await emailService.sendSubUserInvitation(email, activationToken, firstName);

    // Log en dev
    if (process.env.NODE_ENV !== 'production') {
      authLogger.info('SubUser invitation created (dev)', {
        email,
        activationToken,
        parentUserId: userId
      });
    }

    authLogger.info('SubUser created', {
      subUserId: subUser._id,
      email,
      parentUserId: userId,
      accessLevel: level
    });

    res.status(201).json({
      success: true,
      message: 'Invitation envoyée',
      data: {
        id: subUser._id,
        email: subUser.email,
        firstName: subUser.firstName,
        lastName: subUser.lastName,
        accessLevel: subUser.accessLevel,
        universes: subUser.universes,
        status: subUser.status,
        invitedAt: subUser.invitedAt
      }
    });
  } catch (error: any) {
    authLogger.error('Error creating subuser', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du membre'
    });
  }
});

/**
 * PUT /api/subusers/:id
 * Modifier un sous-utilisateur
 */
router.put('/:id', canManageSubUsers, async (req: AccessControlRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { firstName, lastName, accessLevel, universes, phone, status } = req.body;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId: userId
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        error: 'Membre non trouvé'
      });
    }

    // Mise à jour des champs
    if (firstName) subUser.firstName = firstName;
    if (lastName) subUser.lastName = lastName;
    if (phone !== undefined) subUser.phone = phone;

    // Mise à jour du niveau d'accès
    const validAccessLevels: AccessLevel[] = ['admin', 'editor', 'reader'];
    if (accessLevel && validAccessLevels.includes(accessLevel)) {
      subUser.accessLevel = accessLevel;
    }

    // Mise à jour des univers
    const validUniverses: Universe[] = ['industry', 'logistician', 'transporter', 'forwarder', 'supplier', 'recipient'];
    if (Array.isArray(universes)) {
      subUser.universes = universes.filter((u: string) => validUniverses.includes(u as Universe));
    }

    // Mise à jour du statut
    if (status && ['active', 'inactive'].includes(status)) {
      subUser.status = status;
    }

    await subUser.save();

    authLogger.info('SubUser updated', {
      subUserId: subUser._id,
      parentUserId: userId
    });

    res.json({
      success: true,
      message: 'Membre mis à jour',
      data: {
        id: subUser._id,
        email: subUser.email,
        firstName: subUser.firstName,
        lastName: subUser.lastName,
        accessLevel: subUser.accessLevel,
        universes: subUser.universes,
        status: subUser.status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du membre'
    });
  }
});

/**
 * DELETE /api/subusers/:id
 * Supprimer un sous-utilisateur
 */
router.delete('/:id', canManageSubUsers, async (req: AccessControlRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const subUser = await SubUser.findOneAndDelete({
      _id: id,
      parentUserId: userId
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        error: 'Membre non trouvé'
      });
    }

    authLogger.info('SubUser deleted', {
      subUserId: id,
      email: subUser.email,
      parentUserId: userId
    });

    res.json({
      success: true,
      message: 'Membre supprimé'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du membre'
    });
  }
});

/**
 * POST /api/subusers/:id/resend-invite
 * Renvoyer l'invitation à un sous-utilisateur
 */
router.post('/:id/resend-invite', canManageSubUsers, async (req: AccessControlRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId: userId,
      status: 'pending'
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        error: 'Membre non trouvé ou déjà activé'
      });
    }

    // Générer nouveau token
    const activationToken = crypto.randomBytes(32).toString('hex');
    subUser.activationToken = activationToken;
    subUser.invitedAt = new Date();
    await subUser.save();

    // TODO: Envoyer email d'invitation
    // await emailService.sendSubUserInvitation(subUser.email, activationToken, subUser.firstName);

    if (process.env.NODE_ENV !== 'production') {
      authLogger.info('SubUser invitation resent (dev)', {
        email: subUser.email,
        activationToken
      });
    }

    res.json({
      success: true,
      message: 'Invitation renvoyée'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du renvoi de l\'invitation'
    });
  }
});

/**
 * POST /api/subusers/activate
 * Activer un compte sous-utilisateur (route publique, appelée depuis l'email)
 */
router.post('/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token et mot de passe requis'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const subUser = await SubUser.findOne({
      activationToken: token,
      status: 'pending'
    });

    if (!subUser) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Hasher le mot de passe et activer
    subUser.password = await bcrypt.hash(password, 10);
    subUser.status = 'active';
    subUser.activationToken = undefined;
    subUser.activatedAt = new Date();
    await subUser.save();

    authLogger.info('SubUser activated', {
      subUserId: subUser._id,
      email: subUser.email
    });

    res.json({
      success: true,
      message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'activation du compte'
    });
  }
});

/**
 * GET /api/subusers/limit
 * Récupérer les informations de limite d'abonnement
 */
router.get('/limit/info', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limitInfo = await getSubUserLimitInfo(userId);

    res.json({
      success: true,
      data: {
        current: limitInfo.currentCount,
        max: limitInfo.maxAllowed,
        remaining: limitInfo.remaining,
        plan: limitInfo.plan,
        canAdd: limitInfo.allowed
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des limites'
    });
  }
});

export default router;

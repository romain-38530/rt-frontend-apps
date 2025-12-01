import { Router, Request, Response } from 'express';
import invitationService from '../services/invitation-service';
import Supplier from '../models/Supplier';

const router = Router();

/**
 * POST /onboarding/invite
 * Inviter un fournisseur (utilisé par l'industriel)
 */
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const { industrialId, companyName, siret, email, address } = req.body;

    // Validation
    if (!industrialId || !companyName || !siret || !email || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['industrialId', 'companyName', 'siret', 'email', 'address']
      });
    }

    // Vérifier si le SIRET existe déjà
    const existingSupplier = await Supplier.findOne({ siret });
    if (existingSupplier) {
      return res.status(409).json({
        error: 'Supplier with this SIRET already exists',
        supplierId: existingSupplier.supplierId
      });
    }

    const result = await invitationService.createInvitation({
      industrialId,
      companyName,
      siret,
      email,
      address
    });

    res.status(201).json({
      success: true,
      supplier: {
        supplierId: result.supplier.supplierId,
        companyName: result.supplier.companyName,
        status: result.supplier.status,
        invitedAt: result.supplier.invitedAt
      },
      invitationUrl: result.invitationUrl
    });
  } catch (error: any) {
    console.error('Error inviting supplier:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /onboarding/validate/:token
 * Valider un token d'invitation
 */
router.get('/validate/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const supplier = await invitationService.validateToken(token);

    res.json({
      valid: true,
      supplier: {
        supplierId: supplier.supplierId,
        companyName: supplier.companyName,
        siret: supplier.siret,
        address: supplier.address,
        invitedAt: supplier.invitedAt
      }
    });
  } catch (error: any) {
    console.error('Error validating token:', error);
    res.status(400).json({
      valid: false,
      error: error.message
    });
  }
});

/**
 * POST /onboarding/register
 * Créer un compte fournisseur (étape 1 de l'onboarding)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['token', 'password', 'confirmPassword']
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match'
      });
    }

    // Valider le token
    const supplier = await invitationService.validateToken(token);

    // Mettre à jour le statut
    supplier.status = 'pending';
    await supplier.save();

    res.json({
      success: true,
      message: 'Registration successful',
      supplierId: supplier.supplierId,
      nextStep: 'contacts'
    });
  } catch (error: any) {
    console.error('Error registering supplier:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /onboarding/contacts
 * Configurer les contacts (étape 2 de l'onboarding)
 */
router.put('/contacts', async (req: Request, res: Response) => {
  try {
    const { token, contacts } = req.body;

    if (!token || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['token', 'contacts (array)']
      });
    }

    // Vérifier qu'il y a au moins un contact primaire
    const hasPrimary = contacts.some((c: any) => c.isPrimary);
    if (!hasPrimary) {
      return res.status(400).json({
        error: 'At least one contact must be marked as primary'
      });
    }

    const supplier = await invitationService.validateToken(token);

    supplier.contacts = contacts;
    supplier.status = 'incomplete';
    await supplier.save();

    res.json({
      success: true,
      message: 'Contacts configured successfully',
      nextStep: 'complete'
    });
  } catch (error: any) {
    console.error('Error configuring contacts:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /onboarding/complete
 * Finaliser l'onboarding et activer le compte
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    const supplier = await Supplier.findOne({ invitationToken: token });

    if (!supplier) {
      return res.status(400).json({
        error: 'Invalid token'
      });
    }

    // Vérifier que les contacts sont configurés
    if (!supplier.contacts || supplier.contacts.length === 0) {
      return res.status(400).json({
        error: 'Contacts must be configured before completing onboarding'
      });
    }

    const activatedSupplier = await invitationService.activateSupplier(token, {
      contacts: supplier.contacts
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      supplier: {
        supplierId: activatedSupplier.supplierId,
        companyName: activatedSupplier.companyName,
        status: activatedSupplier.status,
        activatedAt: activatedSupplier.activatedAt
      }
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /onboarding/resend
 * Renvoyer une invitation
 */
router.post('/resend', async (req: Request, res: Response) => {
  try {
    const { supplierId, email } = req.body;

    if (!supplierId || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['supplierId', 'email']
      });
    }

    const result = await invitationService.resendInvitation(supplierId, email);

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      invitationUrl: result.invitationUrl
    });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

import express, { Request, Response } from 'express';
import { Recipient } from '../models/Recipient';
import { InvitationService } from '../services/invitation-service';
import crypto from 'crypto';

const router = express.Router();
const invitationService = new InvitationService();

// POST /onboarding/invite - Inviter un destinataire (appelé par l'industriel)
router.post('/invite', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      industrialId,
      companyName,
      siret,
      contactEmail,
      contactName
    } = req.body;

    // Validation
    if (!industrialId || !companyName || !siret || !contactEmail || !contactName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Vérifier si le destinataire existe déjà
    const existingRecipient = await Recipient.findOne({ siret });
    if (existingRecipient) {
      res.status(409).json({
        error: 'Recipient already exists',
        recipientId: existingRecipient.recipientId,
        status: existingRecipient.status
      });
      return;
    }

    // Générer un token d'invitation
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Générer un recipientId
    const recipientId = await (Recipient as any).generateRecipientId();

    // Créer le destinataire avec statut 'invited'
    const recipient = new Recipient({
      recipientId,
      industrialId,
      companyName,
      siret,
      invitationToken,
      status: 'invited',
      invitedAt: new Date(),
      contacts: [],
      sites: [],
      settings: {
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          etaAlerts: true,
          incidentAlerts: true,
          deliveryConfirmations: true
        },
        language: 'fr',
        timezone: 'Europe/Paris',
        autoAcceptDeliveries: false
      },
      subscription: {
        tier: 'free',
        features: ['basic_tracking', 'signature', 'incidents'],
        maxSites: 1,
        maxUsers: 3
      },
      metadata: {
        totalDeliveries: 0,
        totalIncidents: 0
      }
    });

    await recipient.save();

    // Envoyer l'email d'invitation
    await invitationService.sendInvitation(
      contactEmail,
      contactName,
      companyName,
      invitationToken,
      recipientId
    );

    res.status(201).json({
      message: 'Invitation sent successfully',
      recipientId: recipient.recipientId,
      invitationToken,
      invitationUrl: `${process.env.FRONTEND_RECIPIENT_URL}/onboarding?token=${invitationToken}`
    });
  } catch (error: any) {
    console.error('Error inviting recipient:', error);
    res.status(500).json({ error: 'Error inviting recipient', details: error.message });
  }
});

// GET /onboarding/validate/:token - Valider le token d'invitation
router.get('/validate/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const recipient = await Recipient.findOne({
      invitationToken: token,
      status: 'invited'
    });

    if (!recipient) {
      res.status(404).json({
        error: 'Invalid or expired invitation token',
        valid: false
      });
      return;
    }

    // Vérifier si l'invitation n'est pas expirée (par exemple, 7 jours)
    const invitationAge = Date.now() - recipient.invitedAt.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

    if (invitationAge > maxAge) {
      res.status(410).json({
        error: 'Invitation expired',
        valid: false
      });
      return;
    }

    res.json({
      valid: true,
      recipientId: recipient.recipientId,
      companyName: recipient.companyName,
      siret: recipient.siret,
      industrialId: recipient.industrialId
    });
  } catch (error: any) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Error validating token', details: error.message });
  }
});

// POST /onboarding/register - Créer le compte destinataire
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      invitationToken,
      primaryContact,
      password,
      acceptTerms
    } = req.body;

    // Validation
    if (!invitationToken || !primaryContact || !password || !acceptTerms) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipient = await Recipient.findOne({
      invitationToken,
      status: 'invited'
    });

    if (!recipient) {
      res.status(404).json({ error: 'Invalid invitation token' });
      return;
    }

    // Générer un contactId
    const contactId = recipient.generateContactId();

    // Ajouter le contact principal
    recipient.contacts.push({
      contactId,
      name: primaryContact.name,
      role: primaryContact.role || 'Admin',
      email: primaryContact.email,
      phone: primaryContact.phone,
      isPrimary: true,
      canSignDeliveries: true,
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    });

    // Mettre à jour le statut
    recipient.status = 'pending';
    recipient.invitationToken = undefined;

    await recipient.save();

    // Créer un compte utilisateur dans l'API Auth (appel externe)
    // TODO: Appeler l'API Auth pour créer le compte

    res.status(200).json({
      message: 'Account registered successfully',
      recipientId: recipient.recipientId,
      status: recipient.status,
      nextStep: 'configure_sites'
    });
  } catch (error: any) {
    console.error('Error registering recipient:', error);
    res.status(500).json({ error: 'Error registering recipient', details: error.message });
  }
});

// PUT /onboarding/sites - Configurer les sites de livraison
router.put('/sites', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, sites } = req.body;

    if (!recipientId || !sites || !Array.isArray(sites)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipient = await Recipient.findOne({ recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Ajouter les sites
    for (const site of sites) {
      const siteId = recipient.generateSiteId();

      recipient.sites.push({
        siteId,
        name: site.name,
        address: site.address,
        contacts: [],
        openingHours: site.openingHours || {},
        constraints: site.constraints || {
          hasDock: false,
          hasForklift: false,
          requiresAppointment: false
        },
        isActive: true
      });
    }

    await recipient.save();

    res.json({
      message: 'Sites configured successfully',
      sites: recipient.sites,
      nextStep: 'configure_contacts'
    });
  } catch (error: any) {
    console.error('Error configuring sites:', error);
    res.status(500).json({ error: 'Error configuring sites', details: error.message });
  }
});

// PUT /onboarding/contacts - Configurer les contacts supplémentaires
router.put('/contacts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, contacts } = req.body;

    if (!recipientId || !contacts || !Array.isArray(contacts)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipient = await Recipient.findOne({ recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Ajouter les contacts
    for (const contact of contacts) {
      const contactId = recipient.generateContactId();

      recipient.contacts.push({
        contactId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        siteId: contact.siteId,
        isPrimary: false,
        canSignDeliveries: contact.canSignDeliveries !== false,
        notifications: contact.notifications || {
          email: true,
          sms: false,
          push: true
        }
      });
    }

    await recipient.save();

    res.json({
      message: 'Contacts configured successfully',
      contacts: recipient.contacts,
      nextStep: 'complete'
    });
  } catch (error: any) {
    console.error('Error configuring contacts:', error);
    res.status(500).json({ error: 'Error configuring contacts', details: error.message });
  }
});

// POST /onboarding/complete - Finaliser l'onboarding
router.post('/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      res.status(400).json({ error: 'Missing recipientId' });
      return;
    }

    const recipient = await Recipient.findOne({ recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Vérifier que l'onboarding est complet
    if (recipient.sites.length === 0) {
      res.status(400).json({
        error: 'Onboarding incomplete',
        message: 'At least one site is required'
      });
      return;
    }

    if (recipient.contacts.length === 0) {
      res.status(400).json({
        error: 'Onboarding incomplete',
        message: 'At least one contact is required'
      });
      return;
    }

    // Mettre à jour le statut
    recipient.status = 'active';
    recipient.activatedAt = new Date();

    await recipient.save();

    // Émettre un événement
    // TODO: Émettre l'événement 'destinataire.onboard.completed'

    res.json({
      message: 'Onboarding completed successfully',
      recipientId: recipient.recipientId,
      status: recipient.status,
      activatedAt: recipient.activatedAt
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Error completing onboarding', details: error.message });
  }
});

export default router;

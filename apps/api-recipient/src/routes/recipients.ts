import express, { Response } from 'express';
import { Recipient } from '../models/Recipient';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// GET /recipients/me - Profil du destinataire connecté
router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Mettre à jour la dernière connexion
    recipient.lastLoginAt = new Date();
    await recipient.save();

    res.json({
      recipientId: recipient.recipientId,
      companyName: recipient.companyName,
      siret: recipient.siret,
      legalForm: recipient.legalForm,
      status: recipient.status,
      sites: recipient.sites,
      contacts: recipient.contacts,
      settings: recipient.settings,
      subscription: recipient.subscription,
      billingInfo: recipient.billingInfo,
      metadata: recipient.metadata,
      activatedAt: recipient.activatedAt,
      lastLoginAt: recipient.lastLoginAt
    });
  } catch (error: any) {
    console.error('Error fetching recipient profile:', error);
    res.status(500).json({ error: 'Error fetching recipient profile', details: error.message });
  }
});

// PUT /recipients/me - Mettre à jour le profil
router.put('/me', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const {
      companyName,
      legalForm,
      taxId,
      billingInfo
    } = req.body;

    // Mise à jour des champs autorisés
    if (companyName) recipient.companyName = companyName;
    if (legalForm) recipient.legalForm = legalForm;
    if (taxId) recipient.taxId = taxId;
    if (billingInfo) recipient.billingInfo = billingInfo;

    await recipient.save();

    res.json({
      message: 'Profile updated successfully',
      recipient: {
        recipientId: recipient.recipientId,
        companyName: recipient.companyName,
        legalForm: recipient.legalForm,
        taxId: recipient.taxId,
        billingInfo: recipient.billingInfo
      }
    });
  } catch (error: any) {
    console.error('Error updating recipient profile:', error);
    res.status(500).json({ error: 'Error updating recipient profile', details: error.message });
  }
});

// GET /recipients/me/sites - Liste des sites
router.get('/me/sites', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    res.json({
      sites: recipient.sites,
      total: recipient.sites.length,
      maxSites: recipient.subscription.maxSites
    });
  } catch (error: any) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Error fetching sites', details: error.message });
  }
});

// POST /recipients/me/sites - Ajouter un site
router.post('/me/sites', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Vérifier la limite de sites
    if (recipient.sites.length >= recipient.subscription.maxSites) {
      res.status(403).json({
        error: 'Site limit reached',
        message: `Your subscription allows up to ${recipient.subscription.maxSites} sites`,
        currentSites: recipient.sites.length,
        maxSites: recipient.subscription.maxSites
      });
      return;
    }

    const { name, address, openingHours, constraints } = req.body;

    if (!name || !address) {
      res.status(400).json({ error: 'Missing required fields: name, address' });
      return;
    }

    const siteId = recipient.generateSiteId();

    recipient.sites.push({
      siteId,
      name,
      address,
      contacts: [],
      openingHours: openingHours || {},
      constraints: constraints || {
        hasDock: false,
        hasForklift: false,
        requiresAppointment: false
      },
      isActive: true
    });

    await recipient.save();

    res.status(201).json({
      message: 'Site added successfully',
      site: recipient.sites[recipient.sites.length - 1]
    });
  } catch (error: any) {
    console.error('Error adding site:', error);
    res.status(500).json({ error: 'Error adding site', details: error.message });
  }
});

// PUT /recipients/me/sites/:siteId - Modifier un site
router.put('/me/sites/:siteId', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { siteId } = req.params;
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const siteIndex = recipient.sites.findIndex(s => s.siteId === siteId);

    if (siteIndex === -1) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    const { name, address, openingHours, constraints, isActive } = req.body;

    // Mise à jour des champs
    if (name) recipient.sites[siteIndex].name = name;
    if (address) recipient.sites[siteIndex].address = { ...recipient.sites[siteIndex].address, ...address };
    if (openingHours) recipient.sites[siteIndex].openingHours = openingHours;
    if (constraints) recipient.sites[siteIndex].constraints = { ...recipient.sites[siteIndex].constraints, ...constraints };
    if (typeof isActive === 'boolean') recipient.sites[siteIndex].isActive = isActive;

    await recipient.save();

    res.json({
      message: 'Site updated successfully',
      site: recipient.sites[siteIndex]
    });
  } catch (error: any) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Error updating site', details: error.message });
  }
});

// DELETE /recipients/me/sites/:siteId - Supprimer un site
router.delete('/me/sites/:siteId', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { siteId } = req.params;
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Vérifier qu'il reste au moins un site
    if (recipient.sites.length <= 1) {
      res.status(400).json({
        error: 'Cannot delete last site',
        message: 'At least one site is required'
      });
      return;
    }

    const siteIndex = recipient.sites.findIndex(s => s.siteId === siteId);

    if (siteIndex === -1) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    // Désactiver plutôt que supprimer (pour garder l'historique)
    recipient.sites[siteIndex].isActive = false;

    await recipient.save();

    res.json({
      message: 'Site deactivated successfully',
      siteId
    });
  } catch (error: any) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Error deleting site', details: error.message });
  }
});

// GET /recipients/me/contacts - Liste des contacts
router.get('/me/contacts', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    res.json({
      contacts: recipient.contacts,
      total: recipient.contacts.length
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Error fetching contacts', details: error.message });
  }
});

// POST /recipients/me/contacts - Ajouter un contact
router.post('/me/contacts', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const { name, role, email, phone, siteId, canSignDeliveries, notifications } = req.body;

    if (!name || !role || !email || !phone) {
      res.status(400).json({ error: 'Missing required fields: name, role, email, phone' });
      return;
    }

    const contactId = recipient.generateContactId();

    recipient.contacts.push({
      contactId,
      name,
      role,
      email,
      phone,
      siteId,
      isPrimary: false,
      canSignDeliveries: canSignDeliveries !== false,
      notifications: notifications || {
        email: true,
        sms: false,
        push: true
      }
    });

    await recipient.save();

    res.status(201).json({
      message: 'Contact added successfully',
      contact: recipient.contacts[recipient.contacts.length - 1]
    });
  } catch (error: any) {
    console.error('Error adding contact:', error);
    res.status(500).json({ error: 'Error adding contact', details: error.message });
  }
});

// PUT /recipients/me/settings - Mettre à jour les paramètres
router.put('/me/settings', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const { notifications, language, timezone, autoAcceptDeliveries } = req.body;

    // Mise à jour des paramètres
    if (notifications) {
      recipient.settings.notifications = { ...recipient.settings.notifications, ...notifications };
    }
    if (language) recipient.settings.language = language;
    if (timezone) recipient.settings.timezone = timezone;
    if (typeof autoAcceptDeliveries === 'boolean') {
      recipient.settings.autoAcceptDeliveries = autoAcceptDeliveries;
    }

    await recipient.save();

    res.json({
      message: 'Settings updated successfully',
      settings: recipient.settings
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Error updating settings', details: error.message });
  }
});

// GET /recipients/me/stats - Statistiques du destinataire
router.get('/me/stats', requireActiveRecipient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipient = await Recipient.findOne({ recipientId: req.user!.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Importer les modèles pour les stats
    const { Delivery } = await import('../models/Delivery');
    const { Incident } = await import('../models/Incident');

    // Calculer les statistiques
    const totalDeliveries = await Delivery.countDocuments({ recipientId: recipient.recipientId });
    const pendingDeliveries = await Delivery.countDocuments({
      recipientId: recipient.recipientId,
      status: { $in: ['scheduled', 'in_transit', 'arriving'] }
    });
    const completedDeliveries = await Delivery.countDocuments({
      recipientId: recipient.recipientId,
      status: 'delivered'
    });
    const totalIncidents = await Incident.countDocuments({ recipientId: recipient.recipientId });
    const openIncidents = await Incident.countDocuments({
      recipientId: recipient.recipientId,
      status: { $in: ['reported', 'acknowledged', 'investigating'] }
    });

    res.json({
      deliveries: {
        total: totalDeliveries,
        pending: pendingDeliveries,
        completed: completedDeliveries
      },
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        resolved: totalIncidents - openIncidents
      },
      sites: {
        total: recipient.sites.length,
        active: recipient.sites.filter(s => s.isActive).length
      },
      contacts: {
        total: recipient.contacts.length
      },
      averageRating: recipient.metadata.averageRating || null
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats', details: error.message });
  }
});

export default router;

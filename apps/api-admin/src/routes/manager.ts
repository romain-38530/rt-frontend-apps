/**
 * Manager Routes - Gestion pricing, packs, promos, contrats, planning installations
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import ModulePricing from '../models/ModulePricing';
import ModulePack from '../models/ModulePack';
import Promotion from '../models/Promotion';
import Contract from '../models/Contract';
import InstallationPlanning from '../models/InstallationPlanning';
import CrmCommercial from '../models/CrmCommercial';
import CrmEmailService from '../services/email-service';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Toutes les routes necessitent auth admin
router.use(authenticateAdmin);

// ==================== PRICING MODULES ====================

// Liste des tarifs modules
router.get('/pricing', async (_req: Request, res: Response) => {
  try {
    const modules = await ModulePricing.find().sort({ displayOrder: 1, category: 1 });
    res.json(modules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer un tarif module
router.post('/pricing', async (req: AuthRequest, res: Response) => {
  try {
    const module = await ModulePricing.create(req.body);
    res.status(201).json(module);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour un tarif
router.put('/pricing/:id', async (req: Request, res: Response) => {
  try {
    const module = await ModulePricing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!module) {
      return res.status(404).json({ error: 'Module non trouve' });
    }
    res.json(module);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un tarif
router.delete('/pricing/:id', async (req: Request, res: Response) => {
  try {
    await ModulePricing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PACKS ====================

// Liste des packs
router.get('/packs', async (_req: Request, res: Response) => {
  try {
    const packs = await ModulePack.find().sort({ displayOrder: 1 });
    res.json(packs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer un pack
router.post('/packs', async (req: Request, res: Response) => {
  try {
    // Calculer l'economie si non fourni
    if (req.body.pricing && !req.body.pricing.savingsPercent && req.body.pricing.originalPrice) {
      req.body.pricing.savingsPercent = Math.round(
        ((req.body.pricing.originalPrice - req.body.pricing.monthlyPrice) / req.body.pricing.originalPrice) * 100
      );
    }
    const pack = await ModulePack.create(req.body);
    res.status(201).json(pack);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour un pack
router.put('/packs/:id', async (req: Request, res: Response) => {
  try {
    const pack = await ModulePack.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!pack) {
      return res.status(404).json({ error: 'Pack non trouve' });
    }
    res.json(pack);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un pack
router.delete('/packs/:id', async (req: Request, res: Response) => {
  try {
    await ModulePack.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROMOTIONS ====================

// Liste des promotions
router.get('/promotions', async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    const filter: any = {};

    if (active === 'true') {
      const now = new Date();
      filter.isActive = true;
      filter.validFrom = { $lte: now };
      filter.validUntil = { $gte: now };
    }

    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verifier un code promo
router.get('/promotions/verify/:code', async (req: Request, res: Response) => {
  try {
    const promo = await Promotion.findOne({
      promoCode: req.params.code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!promo) {
      return res.status(404).json({ valid: false, error: 'Code promo invalide ou expire' });
    }

    if (promo.conditions.maxUsesTotal && promo.usageCount >= promo.conditions.maxUsesTotal) {
      return res.status(400).json({ valid: false, error: 'Code promo epuise' });
    }

    res.json({
      valid: true,
      promotion: {
        code: promo.promoCode,
        name: promo.promoName,
        type: promo.type,
        value: promo.value,
        conditions: promo.conditions
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer une promotion
router.post('/promotions', async (req: AuthRequest, res: Response) => {
  try {
    req.body.createdBy = req.user?.id;
    const promo = await Promotion.create(req.body);
    res.status(201).json(promo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour une promotion
router.put('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const promo = await Promotion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!promo) {
      return res.status(404).json({ error: 'Promotion non trouvee' });
    }
    res.json(promo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une promotion
router.delete('/promotions/:id', async (req: Request, res: Response) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTRATS ====================

// Liste des contrats
router.get('/contracts', async (req: Request, res: Response) => {
  try {
    const { status, commercialId, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (commercialId) filter.commercialId = commercialId;

    const skip = (Number(page) - 1) * Number(limit);
    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Contract.countDocuments(filter)
    ]);

    res.json({
      contracts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats contrats
router.get('/contracts/stats', async (_req: Request, res: Response) => {
  try {
    const [
      total,
      active,
      pending,
      mrr,
      avgCommitment,
      byStatus
    ] = await Promise.all([
      Contract.countDocuments(),
      Contract.countDocuments({ status: 'active' }),
      Contract.countDocuments({ status: 'pending_signature' }),
      Contract.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$pricing.monthlyTotal' } } }
      ]),
      Contract.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avg: { $avg: '$commitmentMonths' } } }
      ]),
      Contract.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      total,
      active,
      pending,
      mrr: mrr[0]?.total || 0,
      avgCommitment: Math.round(avgCommitment[0]?.avg || 0),
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detail contrat
router.get('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouve' });
    }
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer un contrat
router.post('/contracts', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.create(req.body);
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour un contrat
router.put('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouve' });
    }
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le statut d'un contrat
router.post('/contracts/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    const updateData: any = { status };

    if (status === 'active') {
      updateData.signedAt = new Date();
    } else if (status === 'terminated') {
      updateData.terminatedAt = new Date();
      updateData.terminationReason = reason;
    }

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouve' });
    }

    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLANNING INSTALLATIONS ====================

// Liste des installations
router.get('/installations', async (req: Request, res: Response) => {
  try {
    const { status, commercialId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (commercialId) filter.commercialId = commercialId;
    if (startDate && endDate) {
      filter['confirmedSlot.date'] = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [installations, total] = await Promise.all([
      InstallationPlanning.find(filter)
        .sort({ 'confirmedSlot.date': 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InstallationPlanning.countDocuments(filter)
    ]);

    res.json({
      installations,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Planning calendrier (vue semaine/mois)
router.get('/installations/calendar', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, assignedTo } = req.query;

    const filter: any = {
      status: { $in: ['confirmed', 'in_progress'] }
    };

    if (startDate && endDate) {
      filter['confirmedSlot.date'] = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (assignedTo) {
      filter['assignedTo.userId'] = assignedTo;
    }

    const installations = await InstallationPlanning.find(filter)
      .sort({ 'confirmedSlot.date': 1 })
      .select('title companyName confirmedSlot assignedTo status installationConfig.type');

    res.json(installations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats installations
router.get('/installations/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [
      total,
      pending,
      confirmed,
      thisWeek,
      completed,
      byStatus
    ] = await Promise.all([
      InstallationPlanning.countDocuments(),
      InstallationPlanning.countDocuments({ status: { $in: ['pending_client', 'pending_manager'] } }),
      InstallationPlanning.countDocuments({ status: 'confirmed' }),
      InstallationPlanning.countDocuments({
        status: 'confirmed',
        'confirmedSlot.date': { $gte: weekStart, $lte: weekEnd }
      }),
      InstallationPlanning.countDocuments({ status: 'completed' }),
      InstallationPlanning.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      total,
      pending,
      confirmed,
      thisWeek,
      completed,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer une installation (par commercial ou manager)
router.post('/installations', async (req: AuthRequest, res: Response) => {
  try {
    const clientToken = crypto.randomBytes(24).toString('hex');

    const installation = await InstallationPlanning.create({
      ...req.body,
      validation: {
        clientToken,
        emailsSent: []
      }
    });

    res.status(201).json(installation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Envoyer les creneaux au client
router.post('/installations/:id/send-proposal', async (req: Request, res: Response) => {
  try {
    const installation = await InstallationPlanning.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Installation non trouvee' });
    }

    if (installation.proposedSlots.length === 0) {
      return res.status(400).json({ error: 'Aucun creneau propose' });
    }

    // Generer le lien de validation
    const validationUrl = `https://commercial.symphonia-controltower.com/installation/validate/${installation.validation.clientToken}`;

    // Formater les creneaux pour l'email
    const slotsHtml = installation.proposedSlots.map((slot, idx) => {
      const date = new Date(slot.date);
      return `
        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong>Option ${idx + 1}:</strong><br>
          ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br>
          ${slot.startTime} - ${slot.endTime} (${slot.duration} min)
        </div>
      `;
    }).join('');

    // Envoyer l'email
    await CrmEmailService.sendEmail({
      to: installation.contactEmail,
      subject: `Installation SYMPHONI.A - Choisissez votre creneau`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Planification de votre installation</h2>
          <p>Bonjour ${installation.contactName},</p>
          <p>Suite a la signature de votre contrat, nous souhaitons planifier l'installation de votre solution SYMPHONI.A.</p>
          <p>Voici les creneaux disponibles:</p>
          ${slotsHtml}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Choisir mon creneau
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Type d'installation: ${installation.installationConfig.type === 'remote' ? 'A distance' : installation.installationConfig.type === 'onsite' ? 'Sur site' : 'Hybride'}<br>
            Duree estimee: ${installation.installationConfig.estimatedDuration} minutes
          </p>
          <p>Cordialement,<br>L'equipe SYMPHONI.A</p>
        </div>
      `
    });

    // Mettre a jour le statut
    installation.status = 'pending_client';
    installation.validation.emailsSent.push({
      type: 'proposal',
      sentAt: new Date(),
      to: installation.contactEmail
    });
    await installation.save();

    res.json({ success: true, message: 'Proposition envoyee au client' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Valider/Approuver une installation (manager)
router.post('/installations/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { approved, reason } = req.body;

    const installation = await InstallationPlanning.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Installation non trouvee' });
    }

    if (approved) {
      installation.status = 'confirmed';
      installation.approvedBy = req.user?.id as any;
      installation.approvedByName = req.user?.email || 'Manager';
      installation.approvedAt = new Date();
      installation.validation.managerValidatedAt = new Date();

      // Envoyer email de confirmation au client
      if (installation.confirmedSlot) {
        const date = new Date(installation.confirmedSlot.date);
        await CrmEmailService.sendEmail({
          to: installation.contactEmail,
          subject: `Installation confirmee - ${date.toLocaleDateString('fr-FR')}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Installation confirmee</h2>
              <p>Bonjour ${installation.contactName},</p>
              <p>Votre installation SYMPHONI.A est confirmee:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Date:</strong> ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p style="margin: 8px 0;"><strong>Heure:</strong> ${installation.confirmedSlot.startTime} - ${installation.confirmedSlot.endTime}</p>
                <p style="margin: 8px 0;"><strong>Duree:</strong> ${installation.confirmedSlot.duration} minutes</p>
                <p style="margin: 8px 0;"><strong>Type:</strong> ${installation.installationConfig.type === 'remote' ? 'A distance' : installation.installationConfig.type === 'onsite' ? 'Sur site' : 'Hybride'}</p>
                ${installation.installationConfig.meetingLink ? `<p style="margin: 8px 0;"><strong>Lien visio:</strong> <a href="${installation.installationConfig.meetingLink}">${installation.installationConfig.meetingLink}</a></p>` : ''}
              </div>
              <p>Vous recevrez un rappel 24h avant l'installation.</p>
              <p>Cordialement,<br>L'equipe SYMPHONI.A</p>
            </div>
          `
        });

        installation.validation.emailsSent.push({
          type: 'confirmation',
          sentAt: new Date(),
          to: installation.contactEmail
        });
      }
    } else {
      installation.status = 'cancelled';
      installation.internalNotes = (installation.internalNotes || '') + `\nRefuse par manager: ${reason}`;
    }

    await installation.save();
    res.json(installation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour une installation
router.put('/installations/:id', async (req: Request, res: Response) => {
  try {
    const installation = await InstallationPlanning.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!installation) {
      return res.status(404).json({ error: 'Installation non trouvee' });
    }
    res.json(installation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer une installation comme terminee
router.post('/installations/:id/complete', async (req: Request, res: Response) => {
  try {
    const { actualHours, notes } = req.body;

    const installation = await InstallationPlanning.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'completed',
          'installationConfig.phases.$[].completed': true,
          'installationConfig.phases.$[].completedAt': new Date(),
          internalNotes: notes
        }
      },
      { new: true }
    );

    if (!installation) {
      return res.status(404).json({ error: 'Installation non trouvee' });
    }

    // Mettre a jour le contrat associe
    await Contract.findByIdAndUpdate(
      installation.contractId,
      {
        $set: {
          'installation.status': 'completed',
          'installation.completedDate': new Date(),
          'installation.actualHours': actualHours
        }
      }
    );

    res.json(installation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VALIDATION CLIENT (sans auth) ====================

// Ces routes sont accessibles sans auth (token dans URL)
// Elles seront montees separement dans index.ts

export const publicInstallationRoutes = Router();

// Page de selection de creneau (public)
publicInstallationRoutes.get('/validate/:token', async (req: Request, res: Response) => {
  try {
    const installation = await InstallationPlanning.findOne({
      'validation.clientToken': req.params.token,
      status: { $in: ['pending_client', 'proposed'] }
    });

    if (!installation) {
      return res.status(404).json({ error: 'Lien invalide ou expire' });
    }

    res.json({
      companyName: installation.companyName,
      title: installation.title,
      proposedSlots: installation.proposedSlots,
      installationConfig: {
        type: installation.installationConfig.type,
        estimatedDuration: installation.installationConfig.estimatedDuration,
        requirements: installation.installationConfig.requirements
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Selection du creneau par le client (public)
publicInstallationRoutes.post('/validate/:token', async (req: Request, res: Response) => {
  try {
    const { slotIndex, clientNotes } = req.body;

    const installation = await InstallationPlanning.findOne({
      'validation.clientToken': req.params.token,
      status: { $in: ['pending_client', 'proposed'] }
    });

    if (!installation) {
      return res.status(404).json({ error: 'Lien invalide ou expire' });
    }

    if (slotIndex < 0 || slotIndex >= installation.proposedSlots.length) {
      return res.status(400).json({ error: 'Creneau invalide' });
    }

    const selectedSlot = installation.proposedSlots[slotIndex];
    installation.confirmedSlot = selectedSlot;
    installation.validation.clientValidatedAt = new Date();
    installation.validation.clientSelectedSlot = slotIndex;
    installation.status = 'pending_manager'; // Necessite validation manager
    if (clientNotes) installation.clientNotes = clientNotes;

    await installation.save();

    // Notifier le manager et le commercial
    const commercial = await CrmCommercial.findById(installation.commercialId);
    if (commercial) {
      await CrmEmailService.sendEmail({
        to: commercial.email,
        subject: `Installation a valider - ${installation.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Validation requise</h2>
            <p>Le client <strong>${installation.companyName}</strong> a choisi un creneau d'installation:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(selectedSlot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p style="margin: 8px 0;"><strong>Heure:</strong> ${selectedSlot.startTime} - ${selectedSlot.endTime}</p>
              ${clientNotes ? `<p style="margin: 8px 0;"><strong>Notes client:</strong> ${clientNotes}</p>` : ''}
            </div>
            <p>Ce creneau necessite la validation du manager.</p>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: 'Creneau selectionne. Vous recevrez une confirmation par email.',
      selectedSlot
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

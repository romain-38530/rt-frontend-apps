import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PalletDispute, { DisputeStatus, DisputeType, DisputePriority } from '../models/PalletDispute';
import PalletCheque from '../models/PalletCheque';
import PalletLedger from '../models/PalletLedger';
import PalletSite from '../models/PalletSite';

const router = Router();

// GET /disputes - Liste tous les litiges
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      status,
      priority,
      type,
      limit = 50,
      offset = 0,
    } = req.query;

    const filter: any = {};
    if (companyId) {
      filter.$or = [{ initiatorId: companyId }, { respondentId: companyId }];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const disputes = await PalletDispute.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await PalletDispute.countDocuments(filter);

    // Stats par statut
    const statsByStatus = await PalletDispute.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      data: disputes,
      total,
      statsByStatus: statsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /disputes/:disputeId - Détails d'un litige
router.get('/:disputeId', async (req: Request, res: Response) => {
  try {
    const dispute = await PalletDispute.findOne({ disputeId: req.params.disputeId });
    if (!dispute) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    // Récupérer le chèque associé
    const cheque = await PalletCheque.findOne({ chequeId: dispute.chequeId });

    res.json({
      dispute,
      cheque,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /disputes - Créer un nouveau litige
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      chequeId,
      initiatorId,
      initiatorName,
      type,
      description,
      claimedQuantity,
      actualQuantity,
      priority,
      photos,
    } = req.body;

    // Validation
    if (!chequeId || !initiatorId || !type || !description) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    // Vérifier que le chèque existe
    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }

    // Vérifier qu'il n'y a pas déjà un litige ouvert pour ce chèque
    const existingDispute = await PalletDispute.findOne({
      chequeId,
      status: { $in: ['OPEN', 'PROPOSED'] },
    });
    if (existingDispute) {
      return res.status(409).json({ error: 'Un litige est déjà ouvert pour ce chèque' });
    }

    // Déterminer le répondant
    const isInitiatorTransporter = initiatorId === cheque.fromCompanyId;
    const respondentId = isInitiatorTransporter ? cheque.toSiteId : cheque.fromCompanyId;

    // Récupérer le nom du répondant
    let respondentName = 'Répondant';
    if (isInitiatorTransporter) {
      const site = await PalletSite.findOne({ siteId: cheque.toSiteId });
      if (site) respondentName = site.siteName;
    } else {
      respondentName = cheque.fromCompanyName;
    }

    const disputeId = `DSP-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    const dispute = await PalletDispute.create({
      disputeId,
      chequeId,
      initiatorId,
      initiatorName: initiatorName || 'Initiateur',
      respondentId,
      respondentName,
      type,
      description,
      status: 'OPEN',
      priority: priority || 'medium',
      claimedQuantity: claimedQuantity || cheque.quantity,
      actualQuantity: actualQuantity || cheque.quantityReceived || 0,
      photos: photos || [],
      auditTrail: [{
        action: 'CREATION',
        by: initiatorId,
        at: new Date(),
        details: `Litige créé: ${type}`,
      }],
    });

    // Mettre à jour le statut du chèque
    cheque.status = 'LITIGE';
    await cheque.save();

    // Mettre à jour les stats du site
    const site = await PalletSite.findOne({ siteId: cheque.toSiteId });
    if (site) {
      site.stats.totalDisputes += 1;
      await site.save();
    }

    res.status(201).json(dispute);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /disputes/:disputeId/propose-resolution - Proposer une résolution
router.post('/:disputeId/propose-resolution', async (req: Request, res: Response) => {
  try {
    const { disputeId } = req.params;
    const { type, adjustedQuantity, description, proposedBy, proposedByName } = req.body;

    if (!type || adjustedQuantity === undefined || !description || !proposedBy) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'PROPOSED') {
      return res.status(400).json({ error: `Impossible de proposer sur un litige en statut ${dispute.status}` });
    }

    dispute.resolution = {
      type,
      adjustedQuantity,
      description,
      proposedBy,
      proposedByName: proposedByName || 'Proposant',
      proposedAt: new Date(),
    };
    dispute.status = 'PROPOSED';

    dispute.auditTrail.push({
      action: 'PROPOSITION_RESOLUTION',
      by: proposedBy,
      at: new Date(),
      details: `Proposition: ${type} - Quantité ajustée: ${adjustedQuantity}`,
    });

    await dispute.save();

    res.json(dispute);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /disputes/:disputeId/validate - Valider/Rejeter une résolution
router.post('/:disputeId/validate', async (req: Request, res: Response) => {
  try {
    const { disputeId } = req.params;
    const { accept, validatedBy, comment } = req.body;

    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    if (dispute.status !== 'PROPOSED') {
      return res.status(400).json({ error: 'Aucune proposition à valider' });
    }

    if (!dispute.resolution) {
      return res.status(400).json({ error: 'Aucune résolution proposée' });
    }

    if (accept) {
      // Accepter la résolution
      dispute.status = 'RESOLVED';
      dispute.resolution.validatedBy = validatedBy;
      dispute.resolution.validatedAt = new Date();
      dispute.resolvedAt = new Date();

      dispute.auditTrail.push({
        action: 'RESOLUTION_ACCEPTEE',
        by: validatedBy,
        at: new Date(),
        details: comment || 'Résolution acceptée',
      });

      // Appliquer l'ajustement au ledger si nécessaire
      if (dispute.resolution.type !== 'rejet') {
        const cheque = await PalletCheque.findOne({ chequeId: dispute.chequeId });
        if (cheque) {
          const adjustment = dispute.resolution.adjustedQuantity - (cheque.quantityReceived || cheque.quantity);
          if (adjustment !== 0) {
            // Ajuster le ledger de l'initiateur
            const ledger = await PalletLedger.findOne({ companyId: dispute.initiatorId });
            if (ledger) {
              ledger.balances[cheque.palletType] += adjustment;
              ledger.history.push({
                date: new Date(),
                delta: adjustment,
                reason: `Résolution litige ${disputeId}`,
                chequeId: cheque.chequeId,
                newBalance: ledger.balances[cheque.palletType],
                palletType: cheque.palletType,
              });
              await ledger.save();
            }
          }

          // Mettre à jour le chèque
          cheque.quantityReceived = dispute.resolution.adjustedQuantity;
          cheque.status = 'RECU';
          await cheque.save();
        }
      }
    } else {
      // Rejeter - escalader ou réouvrir
      dispute.status = 'ESCALATED';
      dispute.auditTrail.push({
        action: 'RESOLUTION_REJETEE',
        by: validatedBy,
        at: new Date(),
        details: comment || 'Résolution rejetée - Escalade',
      });
    }

    if (comment) {
      dispute.comments.push({
        author: validatedBy,
        authorName: 'Validateur',
        content: comment,
        at: new Date(),
      });
    }

    await dispute.save();

    res.json(dispute);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /disputes/:disputeId/comment - Ajouter un commentaire
router.post('/:disputeId/comment', async (req: Request, res: Response) => {
  try {
    const { disputeId } = req.params;
    const { author, authorName, content } = req.body;

    if (!author || !content) {
      return res.status(400).json({ error: 'Auteur et contenu requis' });
    }

    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    dispute.comments.push({
      author,
      authorName: authorName || 'Utilisateur',
      content,
      at: new Date(),
    });

    dispute.auditTrail.push({
      action: 'COMMENTAIRE_AJOUTE',
      by: author,
      at: new Date(),
    });

    await dispute.save();

    res.json(dispute);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /disputes/:disputeId/escalate - Escalader un litige
router.post('/:disputeId/escalate', async (req: Request, res: Response) => {
  try {
    const { disputeId } = req.params;
    const { escalatedBy, reason } = req.body;

    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      return res.status(404).json({ error: 'Litige non trouvé' });
    }

    dispute.status = 'ESCALATED';
    dispute.priority = 'high';

    dispute.auditTrail.push({
      action: 'ESCALADE',
      by: escalatedBy || 'système',
      at: new Date(),
      details: reason || 'Escalade manuelle',
    });

    await dispute.save();

    res.json(dispute);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /disputes/stats - Statistiques des litiges
router.get('/stats/global', async (req: Request, res: Response) => {
  try {
    const byStatus = await PalletDispute.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byType = await PalletDispute.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const byPriority = await PalletDispute.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Temps moyen de résolution
    const resolvedDisputes = await PalletDispute.find({ status: 'RESOLVED', resolvedAt: { $exists: true } });
    let avgResolutionTime = 0;
    if (resolvedDisputes.length > 0) {
      const totalTime = resolvedDisputes.reduce((sum, d) => {
        return sum + (new Date(d.resolvedAt!).getTime() - new Date(d.createdAt).getTime());
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedDisputes.length / (1000 * 60 * 60)); // en heures
    }

    const total = await PalletDispute.countDocuments();
    const open = await PalletDispute.countDocuments({ status: { $in: ['OPEN', 'PROPOSED', 'ESCALATED'] } });

    res.json({
      total,
      open,
      resolved: total - open,
      resolutionRate: total > 0 ? Math.round((total - open) / total * 100) : 0,
      avgResolutionTimeHours: avgResolutionTime,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byType: byType.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byPriority: byPriority.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

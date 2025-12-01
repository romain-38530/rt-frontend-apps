/**
 * Routes: Storage Offers
 * Gestion des offres des logisticiens
 */

import express, { Request, Response, NextFunction } from 'express';
import StorageOffer from '../models/StorageOffer';
import StorageNeed from '../models/StorageNeed';
import LogisticianSubscription from '../models/LogisticianSubscription';

const router = express.Router();

// Middleware d'authentification
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-logistician';
  const userType = req.headers['x-user-type'] as string || 'logistician';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  (req as any).userType = userType;
  next();
};

router.use(authMiddleware);

/**
 * GET /offers
 * Liste des offres (filtrable)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      needId,
      status,
      logisticianId,
      page = '1',
      limit = '20',
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (needId) query.needId = needId;
    if (status) query.status = status;
    if (logisticianId) query.logisticianId = logisticianId;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [offers, total] = await Promise.all([
      StorageOffer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      StorageOffer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: offers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /offers/my
 * Mes offres (logisticien connecté)
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { status, page = '1', limit = '20' } = req.query;

    const query: any = { logisticianId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [offers, total] = await Promise.all([
      StorageOffer.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageOffer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: offers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /offers/for-need/:needId
 * Offres reçues pour un besoin (côté industriel)
 */
router.get('/for-need/:needId', async (req: Request, res: Response) => {
  try {
    const { needId } = req.params;
    const { status, sortBy = 'aiScoring.globalScore', page = '1', limit = '20' } = req.query;

    const query: any = { needId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [offers, total] = await Promise.all([
      StorageOffer.find(query)
        .sort({ [sortBy as string]: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageOffer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: offers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /offers/:id
 * Détail d'une offre
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const offer = await StorageOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers
 * Soumettre une offre pour un besoin
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { needId } = req.body;

    // Vérifier que le besoin existe et est publié
    const need = await StorageNeed.findById(needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }
    if (need.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Ce besoin n\'accepte plus d\'offres' });
    }

    // Vérifier la deadline
    if (need.deadline && new Date(need.deadline) < new Date()) {
      return res.status(400).json({ success: false, error: 'La deadline est dépassée' });
    }

    // Vérifier l'abonnement du logisticien
    const subscription = await LogisticianSubscription.findOne({ logisticianId });
    const logisticianType = subscription?.tier === 'guest' ? 'guest' : 'subscriber';

    // Vérifier les limites
    if (subscription) {
      const monthlyCount = await StorageOffer.countDocuments({
        logisticianId,
        submittedAt: { $gte: subscription.currentUsage.lastResetDate }
      });

      if (subscription.limits.maxMonthlyResponses !== -1 &&
          monthlyCount >= subscription.limits.maxMonthlyResponses) {
        return res.status(403).json({
          success: false,
          error: 'Limite mensuelle de réponses atteinte. Passez à un abonnement supérieur.'
        });
      }
    }

    // Vérifier qu'il n'y a pas déjà une offre
    const existingOffer = await StorageOffer.findOne({ needId, logisticianId });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà soumis une offre pour ce besoin'
      });
    }

    const offerData = {
      ...req.body,
      logisticianId,
      logisticianType,
      needReference: need.reference,
      status: 'submitted',
      submittedAt: new Date(),
      statusHistory: [{
        status: 'submitted',
        changedAt: new Date(),
        changedBy: (req as any).userId
      }]
    };

    const offer = new StorageOffer(offerData);
    await offer.save();

    // Mettre à jour le compteur du besoin
    await StorageNeed.findByIdAndUpdate(needId, {
      $inc: { offersCount: 1 }
    });

    // Mettre à jour l'usage du logisticien
    if (subscription) {
      await LogisticianSubscription.findByIdAndUpdate(subscription._id, {
        $inc: { 'currentUsage.monthlyResponses': 1, 'currentUsage.activeOffers': 1 }
      });
    }

    res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /offers/:id
 * Modifier une offre (avant examen)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const offer = await StorageOffer.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    if (!['submitted', 'under_review'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette offre ne peut plus être modifiée'
      });
    }

    // Champs modifiables
    const allowedUpdates = [
      'proposedCapacity', 'proposedStartDate', 'proposedEndDate',
      'pricing', 'includedServices', 'additionalServices',
      'conditions', 'message', 'documents'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (offer as any)[field] = req.body[field];
      }
    });

    await offer.save();

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/withdraw
 * Retirer une offre
 */
router.post('/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { reason } = req.body;

    const offer = await StorageOffer.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    if (['accepted', 'rejected', 'withdrawn'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette offre ne peut pas être retirée'
      });
    }

    offer.status = 'withdrawn';
    offer.statusHistory.push({
      status: 'withdrawn',
      changedAt: new Date(),
      changedBy: (req as any).userId,
      reason: reason || 'Retrait volontaire'
    });

    await offer.save();

    // Mettre à jour l'usage
    await LogisticianSubscription.findOneAndUpdate(
      { logisticianId },
      { $inc: { 'currentUsage.activeOffers': -1 } }
    );

    res.json({ success: true, data: offer, message: 'Offre retirée' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/shortlist
 * Mettre une offre en shortlist (côté industriel)
 */
router.post('/:id/shortlist', async (req: Request, res: Response) => {
  try {
    const offer = await StorageOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    // Vérifier que le besoin appartient à l'utilisateur
    const need = await StorageNeed.findOne({
      _id: offer.needId,
      ownerOrgId: (req as any).orgId
    });

    if (!need) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    offer.status = 'shortlisted';
    offer.reviewedAt = new Date();
    offer.statusHistory.push({
      status: 'shortlisted',
      changedAt: new Date(),
      changedBy: (req as any).userId
    });

    await offer.save();

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/accept
 * Accepter une offre (côté industriel)
 */
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const offer = await StorageOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    // Vérifier que le besoin appartient à l'utilisateur
    const need = await StorageNeed.findOne({
      _id: offer.needId,
      ownerOrgId: (req as any).orgId
    });

    if (!need) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    offer.status = 'accepted';
    offer.decidedAt = new Date();
    offer.statusHistory.push({
      status: 'accepted',
      changedAt: new Date(),
      changedBy: (req as any).userId
    });

    await offer.save();

    // Attribuer le besoin
    need.status = 'ATTRIBUTED';
    need.attributedAt = new Date();
    need.attributedOfferId = offer._id.toString();
    await need.save();

    // Rejeter automatiquement les autres offres
    await StorageOffer.updateMany(
      { needId: offer.needId, _id: { $ne: offer._id }, status: { $nin: ['withdrawn', 'rejected'] } },
      {
        $set: { status: 'rejected', decidedAt: new Date() },
        $push: {
          statusHistory: {
            status: 'rejected',
            changedAt: new Date(),
            reason: 'Une autre offre a été acceptée'
          }
        }
      }
    );

    res.json({
      success: true,
      data: offer,
      message: 'Offre acceptée. Un contrat va être généré.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/reject
 * Rejeter une offre
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const offer = await StorageOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    // Vérifier que le besoin appartient à l'utilisateur
    const need = await StorageNeed.findOne({
      _id: offer.needId,
      ownerOrgId: (req as any).orgId
    });

    if (!need) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    offer.status = 'rejected';
    offer.decidedAt = new Date();
    offer.statusHistory.push({
      status: 'rejected',
      changedAt: new Date(),
      changedBy: (req as any).userId,
      reason
    });

    await offer.save();

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/counter
 * Faire une contre-offre
 */
router.post('/:id/counter', async (req: Request, res: Response) => {
  try {
    const offer = await StorageOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    // Vérifier que le besoin appartient à l'utilisateur
    const need = await StorageNeed.findOne({
      _id: offer.needId,
      ownerOrgId: (req as any).orgId
    });

    if (!need) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const { requestedChanges, newPricing, newStartDate, newEndDate, message } = req.body;

    offer.status = 'counter_offer';
    offer.counterOffer = {
      requestedChanges,
      newPricing,
      newStartDate: newStartDate ? new Date(newStartDate) : undefined,
      newEndDate: newEndDate ? new Date(newEndDate) : undefined,
      message,
      createdAt: new Date(),
      status: 'pending'
    };
    offer.statusHistory.push({
      status: 'counter_offer',
      changedAt: new Date(),
      changedBy: (req as any).userId
    });

    await offer.save();

    res.json({ success: true, data: offer, message: 'Contre-offre envoyée' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /offers/:id/respond-counter
 * Répondre à une contre-offre (logisticien)
 */
router.post('/:id/respond-counter', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { accept, updatedOffer } = req.body;

    const offer = await StorageOffer.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!offer || !offer.counterOffer) {
      return res.status(404).json({ success: false, error: 'Contre-offre non trouvée' });
    }

    if (accept) {
      // Accepter la contre-offre et mettre à jour l'offre
      offer.counterOffer.status = 'accepted';

      if (updatedOffer?.pricing) offer.pricing = updatedOffer.pricing;
      if (updatedOffer?.proposedStartDate) offer.proposedStartDate = new Date(updatedOffer.proposedStartDate);
      if (updatedOffer?.proposedEndDate) offer.proposedEndDate = new Date(updatedOffer.proposedEndDate);

      offer.status = 'submitted'; // Retour en attente de décision
      offer.statusHistory.push({
        status: 'submitted',
        changedAt: new Date(),
        changedBy: (req as any).userId,
        reason: 'Contre-offre acceptée, offre mise à jour'
      });
    } else {
      // Rejeter la contre-offre
      offer.counterOffer.status = 'rejected';
      offer.status = 'withdrawn';
      offer.statusHistory.push({
        status: 'withdrawn',
        changedAt: new Date(),
        changedBy: (req as any).userId,
        reason: 'Contre-offre refusée'
      });
    }

    await offer.save();

    res.json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

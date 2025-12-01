/**
 * Routes: Storage Needs
 * Gestion des besoins de stockage (Industriels/Donneurs d'ordre)
 */

import express, { Request, Response, NextFunction } from 'express';
import StorageNeed from '../models/StorageNeed';

const router = express.Router();

// Middleware d'authentification simulé
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // En production, vérifier le JWT
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  next();
};

router.use(authMiddleware);

/**
 * GET /needs
 * Liste des besoins de stockage
 * Query: status, storageType, region, page, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      storageType,
      region,
      country,
      minCapacity,
      maxCapacity,
      page = '1',
      limit = '20'
    } = req.query;

    const query: any = {};

    // Filtres
    if (status) query.status = status;
    if (storageType) query.storageType = storageType;
    if (region) query['location.region'] = new RegExp(region as string, 'i');
    if (country) query['location.country'] = country;
    if (minCapacity) query['volume.quantity'] = { $gte: Number(minCapacity) };
    if (maxCapacity) {
      query['volume.quantity'] = {
        ...query['volume.quantity'],
        $lte: Number(maxCapacity)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [needs, total] = await Promise.all([
      StorageNeed.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageNeed.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: needs,
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
 * GET /needs/my
 * Mes besoins de stockage
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const { status, page = '1', limit = '20' } = req.query;

    const query: any = { ownerOrgId: orgId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [needs, total] = await Promise.all([
      StorageNeed.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageNeed.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: needs,
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
 * GET /needs/published
 * Besoins publiés (pour logisticiens)
 */
router.get('/published', async (req: Request, res: Response) => {
  try {
    const {
      storageType,
      region,
      minCapacity,
      temperatureRequired,
      page = '1',
      limit = '20'
    } = req.query;

    const query: any = {
      status: 'published',
      'publication.deadline': { $gte: new Date() }
    };

    if (storageType) query.storageType = storageType;
    if (region) query['location.region'] = new RegExp(region as string, 'i');
    if (minCapacity) query['volume.quantity'] = { $gte: Number(minCapacity) };
    if (temperatureRequired) query['constraints.temperatureControl.required'] = temperatureRequired === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [needs, total] = await Promise.all([
      StorageNeed.find(query)
        .select('-ownerContact.phone -internalNotes') // Masquer infos sensibles
        .sort({ 'publication.deadline': 1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageNeed.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: needs,
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
 * GET /needs/:id
 * Détail d'un besoin
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const need = await StorageNeed.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    res.json({ success: true, data: need });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /needs
 * Créer un nouveau besoin de stockage
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;

    const needData = {
      ...req.body,
      ownerOrgId: orgId,
      createdBy: userId,
      status: 'draft'
    };

    const need = new StorageNeed(needData);
    await need.save();

    res.status(201).json({ success: true, data: need });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /needs/:id
 * Mettre à jour un besoin
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;

    const need = await StorageNeed.findOne({
      _id: req.params.id,
      ownerOrgId: orgId
    });

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    // Ne pas modifier si déjà attribué
    if (['attributed', 'closed'].includes(need.status)) {
      return res.status(400).json({ success: false, error: 'Ce besoin ne peut plus être modifié' });
    }

    Object.assign(need, req.body);
    await need.save();

    res.json({ success: true, data: need });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /needs/:id/publish
 * Publier un besoin
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const { publicationType, deadline, targetLogisticians } = req.body;

    const need = await StorageNeed.findOne({
      _id: req.params.id,
      ownerOrgId: orgId
    });

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    if (need.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Seul un brouillon peut être publié' });
    }

    // Mettre à jour le statut
    need.status = 'PUBLISHED';
    need.publicationType = publicationType || 'GLOBAL';
    need.publishedAt = new Date();
    if (deadline) {
      need.deadline = new Date(deadline);
    }
    if (targetLogisticians?.length) {
      need.referredLogisticians = targetLogisticians;
    }

    await need.save();

    res.json({ success: true, data: need, message: 'Besoin publié avec succès' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /needs/:id/close
 * Clôturer un besoin
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const { reason } = req.body;

    const need = await StorageNeed.findOne({
      _id: req.params.id,
      ownerOrgId: orgId
    });

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    need.status = 'CLOSED';
    need.closedAt = new Date();

    await need.save();

    res.json({ success: true, data: need, message: 'Besoin clôturé' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /needs/:id/attribute
 * Attribuer un besoin à un logisticien (accepter une offre)
 */
router.post('/:id/attribute', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const { offerId, logisticianId } = req.body;

    const need = await StorageNeed.findOne({
      _id: req.params.id,
      ownerOrgId: orgId
    });

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    if (need.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Seul un besoin publié peut être attribué' });
    }

    need.status = 'ATTRIBUTED';
    need.attributedAt = new Date();
    need.attributedOfferId = offerId;

    await need.save();

    res.json({ success: true, data: need, message: 'Besoin attribué avec succès' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /needs/:id
 * Supprimer un besoin (brouillon uniquement)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;

    const need = await StorageNeed.findOne({
      _id: req.params.id,
      ownerOrgId: orgId,
      status: 'draft'
    });

    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Besoin non trouvé ou ne peut pas être supprimé'
      });
    }

    await need.deleteOne();

    res.json({ success: true, message: 'Besoin supprimé' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /needs/:id/stats
 * Statistiques d'un besoin publié
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const need = await StorageNeed.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    // Import StorageOffer pour compter les réponses
    const StorageOffer = (await import('../models/StorageOffer')).default;

    const [offerStats] = await StorageOffer.aggregate([
      { $match: { needId: need._id.toString() } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.pricePerUnit' }
        }
      }
    ]);

    const totalOffers = await StorageOffer.countDocuments({ needId: need._id.toString() });

    res.json({
      success: true,
      data: {
        needId: need._id,
        reference: need.reference,
        status: need.status,
        viewCount: need.viewCount || 0,
        totalOffers,
        offersByStatus: offerStats || [],
        daysRemaining: need.deadline
          ? Math.ceil((new Date(need.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

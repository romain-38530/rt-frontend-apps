import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PalletSite from '../models/PalletSite';
import PalletCheque from '../models/PalletCheque';

const router = Router();

// GET /sites - Liste tous les sites
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      active,
      priority,
      city,
      limit = 50,
      offset = 0,
    } = req.query;

    const filter: any = {};
    if (companyId) filter.companyId = companyId;
    if (active !== undefined) filter.active = active === 'true';
    if (priority) filter.priority = priority;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };

    const sites = await PalletSite.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await PalletSite.countDocuments(filter);

    res.json({
      data: sites,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /sites/:siteId - Détails d'un site
router.get('/:siteId', async (req: Request, res: Response) => {
  try {
    const site = await PalletSite.findOne({ siteId: req.params.siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    res.json(site);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /sites - Créer un nouveau site
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      companyName,
      siteName,
      address,
      geofencing,
      quota,
      capacities,
      openingHours,
      priority,
      priorityScore,
      contactEmail,
      contactPhone,
      notes,
    } = req.body;

    // Validation
    if (!companyId || !siteName || !address || !address.coordinates) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const siteId = `SITE-${uuidv4().substring(0, 12).toUpperCase()}`;

    const site = await PalletSite.create({
      siteId,
      companyId,
      companyName: companyName || 'Entreprise',
      siteName,
      address: {
        street: address.street || '',
        city: address.city || '',
        postalCode: address.postalCode || '',
        country: address.country || 'France',
        coordinates: {
          latitude: address.coordinates.latitude,
          longitude: address.coordinates.longitude,
        },
      },
      geofencing: geofencing || { radius: 100, strictMode: false },
      quota: quota || { maxDaily: 100, currentDaily: 0, maxWeekly: 500, currentWeekly: 0 },
      capacities: capacities || {
        EURO_EPAL: 1000,
        EURO_EPAL_2: 500,
        DEMI_PALETTE: 200,
        PALETTE_PERDUE: 100,
      },
      openingHours: openingHours || undefined,
      priority: priority || 'NETWORK',
      priorityScore: priorityScore || 50,
      active: true,
      contactEmail,
      contactPhone,
      notes,
      stats: {
        totalReceived: 0,
        totalDisputes: 0,
        avgRating: 5,
      },
    });

    res.status(201).json(site);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /sites/:siteId - Mettre à jour un site
router.put('/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const updates = req.body;

    // Ne pas permettre la modification de certains champs
    delete updates.siteId;
    delete updates.createdAt;
    delete updates.stats;

    const site = await PalletSite.findOneAndUpdate(
      { siteId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    res.json(site);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /sites/:siteId/quota - Mettre à jour le quota
router.post('/:siteId/quota', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { maxDaily, maxWeekly } = req.body;

    const site = await PalletSite.findOne({ siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    if (maxDaily !== undefined) site.quota.maxDaily = maxDaily;
    if (maxWeekly !== undefined) site.quota.maxWeekly = maxWeekly;

    await site.save();

    res.json({
      message: 'Quota mis à jour',
      quota: site.quota,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /sites/:siteId/reset-quota - Réinitialiser les quotas journaliers/hebdo
router.post('/:siteId/reset-quota', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { type } = req.body; // 'daily' ou 'weekly'

    const site = await PalletSite.findOne({ siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    if (type === 'daily' || !type) {
      site.quota.currentDaily = 0;
      site.quota.lastResetDaily = new Date();
    }
    if (type === 'weekly' || !type) {
      site.quota.currentWeekly = 0;
      site.quota.lastResetWeekly = new Date();
    }

    await site.save();

    res.json({
      message: 'Quota réinitialisé',
      quota: site.quota,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /sites/:siteId/activate - Activer/désactiver un site
router.post('/:siteId/activate', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { active } = req.body;

    const site = await PalletSite.findOneAndUpdate(
      { siteId },
      { active: active !== false },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    res.json({
      message: site.active ? 'Site activé' : 'Site désactivé',
      site,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /sites/:siteId - Supprimer un site (désactivation)
router.delete('/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;

    // Vérifier s'il y a des chèques en cours
    const pendingCheques = await PalletCheque.countDocuments({
      toSiteId: siteId,
      status: { $in: ['EMIS', 'EN_TRANSIT', 'DEPOSE'] },
    });

    if (pendingCheques > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer: ${pendingCheques} chèque(s) en cours`,
      });
    }

    const site = await PalletSite.findOneAndUpdate(
      { siteId },
      { active: false },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    res.json({ message: 'Site désactivé', site });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /sites/:siteId/stats - Statistiques d'un site
router.get('/:siteId/stats', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { period = '30d' } = req.query;

    const site = await PalletSite.findOne({ siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Statistiques des chèques reçus
    const chequesStats = await PalletCheque.aggregate([
      {
        $match: {
          toSiteId: siteId,
          'timestamps.receivedAt': { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$palletType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantityReceived' },
        },
      },
    ]);

    // Chèques en attente
    const pendingCheques = await PalletCheque.countDocuments({
      toSiteId: siteId,
      status: { $in: ['EMIS', 'DEPOSE'] },
    });

    res.json({
      site: {
        siteId: site.siteId,
        siteName: site.siteName,
        active: site.active,
      },
      quota: site.quota,
      stats: site.stats,
      period,
      chequesStats,
      pendingCheques,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

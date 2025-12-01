/**
 * Routes: Logistician Capacity / Sites
 * Gestion des sites et capacités des logisticiens
 */

import express, { Request, Response, NextFunction } from 'express';
import LogisticianSite from '../models/LogisticianSite';
import LogisticianSubscription from '../models/LogisticianSubscription';

const router = express.Router();

// Middleware d'authentification
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-logistician';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  next();
};

router.use(authMiddleware);

/**
 * GET /capacity/sites
 * Liste des sites (publics) avec capacités disponibles
 */
router.get('/sites', async (req: Request, res: Response) => {
  try {
    const {
      region,
      country,
      storageType,
      temperatureCondition,
      minCapacity,
      adrAuthorized,
      customsAuthorized,
      page = '1',
      limit = '20'
    } = req.query;

    const query: any = { active: true };

    if (region) query.region = new RegExp(region as string, 'i');
    if (country) query.country = country;
    if (storageType) query.storageTypes = storageType;
    if (temperatureCondition) query.temperatureConditions = temperatureCondition;
    if (minCapacity) query['availableCapacity.quantity'] = { $gte: Number(minCapacity) };
    if (adrAuthorized === 'true') query.adrAuthorized = true;
    if (customsAuthorized === 'true') query.customsAuthorized = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [sites, total] = await Promise.all([
      LogisticianSite.find(query)
        .select('-pricing.pricePerSqmMonth -pricing.pricePerPaletteMonth') // Masquer tarifs détaillés
        .sort({ 'availableCapacity.quantity': -1 })
        .skip(skip)
        .limit(Number(limit)),
      LogisticianSite.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: sites,
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
 * GET /capacity/sites/nearby
 * Sites à proximité (géolocalisation)
 */
router.get('/sites/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '50', storageType, minCapacity } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude et longitude requises'
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusKm = Number(radius);

    // Calcul approximatif des bornes (1 degré ≈ 111 km)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const query: any = {
      active: true,
      'coordinates.latitude': { $gte: latitude - latDelta, $lte: latitude + latDelta },
      'coordinates.longitude': { $gte: longitude - lngDelta, $lte: longitude + lngDelta }
    };

    if (storageType) query.storageTypes = storageType;
    if (minCapacity) query['availableCapacity.quantity'] = { $gte: Number(minCapacity) };

    const sites = await LogisticianSite.find(query).limit(50);

    // Calculer la distance et trier
    const sitesWithDistance = sites.map(site => {
      const distance = calculateDistance(
        latitude, longitude,
        site.coordinates?.latitude || 0,
        site.coordinates?.longitude || 0
      );
      return { ...site.toObject(), distance };
    }).filter(s => s.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: sitesWithDistance,
      center: { latitude, longitude },
      radius: radiusKm
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calcul de distance Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /capacity/my-sites
 * Mes sites (logisticien connecté)
 */
router.get('/my-sites', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const sites = await LogisticianSite.find({ logisticianId })
      .sort({ name: 1 });

    res.json({ success: true, data: sites });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /capacity/sites/:id
 * Détail d'un site
 */
router.get('/sites/:id', async (req: Request, res: Response) => {
  try {
    const site = await LogisticianSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    res.json({ success: true, data: site });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /capacity/sites
 * Créer un nouveau site
 */
router.post('/sites', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    // Vérifier l'abonnement et les limites
    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (subscription) {
      const currentSites = await LogisticianSite.countDocuments({ logisticianId, active: true });

      if (subscription.limits.maxSites !== -1 && currentSites >= subscription.limits.maxSites) {
        return res.status(403).json({
          success: false,
          error: `Limite de ${subscription.limits.maxSites} sites atteinte. Passez à un abonnement supérieur.`
        });
      }
    }

    const siteData = {
      ...req.body,
      logisticianId,
      logisticianName: req.body.logisticianName || 'Logisticien',
      active: true,
      verified: false,
      lastCapacityUpdate: new Date()
    };

    const site = new LogisticianSite(siteData);
    await site.save();

    // Mettre à jour l'usage
    if (subscription) {
      await LogisticianSubscription.findByIdAndUpdate(subscription._id, {
        $inc: { 'currentUsage.activeSites': 1 }
      });
    }

    res.status(201).json({ success: true, data: site });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /capacity/sites/:id
 * Modifier un site
 */
router.put('/sites/:id', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const site = await LogisticianSite.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    // Champs modifiables
    const allowedUpdates = [
      'name', 'address', 'city', 'postalCode', 'region', 'country', 'coordinates',
      'totalCapacity', 'availableCapacity', 'reservedCapacity',
      'storageTypes', 'temperatureConditions',
      'ceilingHeight', 'docksCount', 'handlingEquipment', 'securityFeatures',
      'certifications', 'adrAuthorized', 'adrClasses', 'customsAuthorized',
      'wmsSystem', 'apiAvailable', 'realTimeTracking',
      'pricing', 'operatingHours', 'active'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (site as any)[field] = req.body[field];
      }
    });

    site.lastCapacityUpdate = new Date();
    await site.save();

    res.json({ success: true, data: site });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /capacity/sites/:id/capacity
 * Mise à jour rapide de la capacité disponible
 */
router.patch('/sites/:id/capacity', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { availableQuantity, reservedQuantity } = req.body;

    const site = await LogisticianSite.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    if (availableQuantity !== undefined) {
      site.availableCapacity.quantity = availableQuantity;
    }
    if (reservedQuantity !== undefined) {
      if (!site.reservedCapacity) {
        site.reservedCapacity = { unit: site.availableCapacity.unit, quantity: 0 };
      }
      site.reservedCapacity.quantity = reservedQuantity;
    }

    site.lastCapacityUpdate = new Date();
    await site.save();

    res.json({
      success: true,
      data: {
        siteId: site._id,
        availableCapacity: site.availableCapacity,
        reservedCapacity: site.reservedCapacity,
        lastCapacityUpdate: site.lastCapacityUpdate
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /capacity/sites/:id
 * Désactiver un site
 */
router.delete('/sites/:id', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const site = await LogisticianSite.findOne({
      _id: req.params.id,
      logisticianId
    });

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    // Désactivation plutôt que suppression
    site.active = false;
    await site.save();

    // Mettre à jour l'usage
    await LogisticianSubscription.findOneAndUpdate(
      { logisticianId },
      { $inc: { 'currentUsage.activeSites': -1 } }
    );

    res.json({ success: true, message: 'Site désactivé' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /capacity/stats
 * Statistiques de capacité (logisticien)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const sites = await LogisticianSite.find({ logisticianId, active: true });

    const stats = {
      totalSites: sites.length,
      totalCapacity: {
        sqm: 0,
        pallets: 0
      },
      availableCapacity: {
        sqm: 0,
        pallets: 0
      },
      utilizationRate: 0,
      byRegion: {} as Record<string, number>,
      byStorageType: {} as Record<string, number>
    };

    sites.forEach(site => {
      // Capacités par unité
      if (site.totalCapacity.unit === 'sqm') {
        stats.totalCapacity.sqm += site.totalCapacity.quantity;
        stats.availableCapacity.sqm += site.availableCapacity.quantity;
      } else if (site.totalCapacity.unit === 'pallets') {
        stats.totalCapacity.pallets += site.totalCapacity.quantity;
        stats.availableCapacity.pallets += site.availableCapacity.quantity;
      }

      // Par région
      if (!stats.byRegion[site.region]) stats.byRegion[site.region] = 0;
      stats.byRegion[site.region]++;

      // Par type de stockage
      site.storageTypes.forEach(type => {
        if (!stats.byStorageType[type]) stats.byStorageType[type] = 0;
        stats.byStorageType[type]++;
      });
    });

    // Taux d'utilisation global
    const totalAll = stats.totalCapacity.sqm + stats.totalCapacity.pallets;
    const availableAll = stats.availableCapacity.sqm + stats.availableCapacity.pallets;
    stats.utilizationRate = totalAll > 0 ? Math.round((1 - availableAll / totalAll) * 100) : 0;

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /capacity/sites/:id/verify
 * Demander la vérification d'un site (admin)
 */
router.post('/sites/:id/verify', async (req: Request, res: Response) => {
  try {
    // En production, vérifier les droits admin
    const site = await LogisticianSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    site.verified = true;
    await site.save();

    res.json({ success: true, data: site, message: 'Site vérifié' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /capacity/regions
 * Liste des régions avec sites disponibles
 */
router.get('/regions', async (req: Request, res: Response) => {
  try {
    const regions = await LogisticianSite.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: { country: '$country', region: '$region' },
          siteCount: { $sum: 1 },
          totalAvailableCapacity: { $sum: '$availableCapacity.quantity' }
        }
      },
      { $sort: { '_id.country': 1, '_id.region': 1 } }
    ]);

    res.json({ success: true, data: regions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

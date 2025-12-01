import { Router, Request, Response } from 'express';
import { findBestSites, findBestSite, getMatchingStats } from '../services/matching';
import { PalletType } from '../models/PalletCheque';

const router = Router();

// POST /matching/find-sites - Trouver les meilleurs sites de restitution
router.post('/find-sites', async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      quantity,
      palletType,
      radiusKm,
      companyId,
      excludeSiteIds,
      limit = 10,
    } = req.body;

    // Validation
    if (latitude === undefined || longitude === undefined || !quantity || !palletType) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants (latitude, longitude, quantity, palletType)',
      });
    }

    // Valider les coordonnées
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordonnées invalides' });
    }

    // Valider le type de palette
    const validTypes: PalletType[] = ['EURO_EPAL', 'EURO_EPAL_2', 'DEMI_PALETTE', 'PALETTE_PERDUE'];
    if (!validTypes.includes(palletType)) {
      return res.status(400).json({ error: 'Type de palette invalide' });
    }

    const sites = await findBestSites({
      location: { latitude, longitude },
      quantity,
      palletType,
      radiusKm: radiusKm || 30,
      companyId,
      excludeSiteIds: excludeSiteIds || [],
    });

    // Limiter les résultats
    const limitedSites = sites.slice(0, Number(limit));

    res.json({
      query: {
        location: { latitude, longitude },
        quantity,
        palletType,
        radiusKm: radiusKm || 30,
      },
      results: limitedSites,
      total: sites.length,
      returned: limitedSites.length,
      bestSite: limitedSites[0] || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /matching/best-site - Trouver LE meilleur site (automatique)
router.post('/best-site', async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      quantity,
      palletType,
      radiusKm,
      companyId,
    } = req.body;

    // Validation
    if (latitude === undefined || longitude === undefined || !quantity || !palletType) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
      });
    }

    const bestSite = await findBestSite({
      location: { latitude, longitude },
      quantity,
      palletType,
      radiusKm: radiusKm || 30,
      companyId,
    });

    if (!bestSite) {
      return res.status(404).json({
        error: 'Aucun site disponible dans le rayon spécifié',
        suggestion: 'Essayez d\'augmenter le rayon de recherche',
      });
    }

    res.json({
      success: true,
      site: bestSite,
      message: `Site optimal trouvé: ${bestSite.siteName} (${bestSite.distance} km, score: ${bestSite.matchingScore}/100)`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /matching/stats - Statistiques du matching
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getMatchingStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /matching/simulate - Simuler un matching (pour tests)
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      quantity,
      palletType,
      radiusKm = 30,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Coordonnées requises' });
    }

    const sites = await findBestSites({
      location: { latitude, longitude },
      quantity: quantity || 10,
      palletType: palletType || 'EURO_EPAL',
      radiusKm,
    });

    // Retourner une analyse détaillée
    const analysis = {
      searchParams: {
        location: { latitude, longitude },
        quantity: quantity || 10,
        palletType: palletType || 'EURO_EPAL',
        radiusKm,
      },
      sitesFound: sites.length,
      sitesOpen: sites.filter(s => s.isOpen).length,
      sitesClosed: sites.filter(s => !s.isOpen).length,
      avgDistance: sites.length > 0
        ? Math.round(sites.reduce((sum, s) => sum + s.distance, 0) / sites.length * 10) / 10
        : 0,
      avgScore: sites.length > 0
        ? Math.round(sites.reduce((sum, s) => sum + s.matchingScore, 0) / sites.length)
        : 0,
      byPriority: {
        INTERNAL: sites.filter(s => s.priority === 'INTERNAL').length,
        NETWORK: sites.filter(s => s.priority === 'NETWORK').length,
        EXTERNAL: sites.filter(s => s.priority === 'EXTERNAL').length,
      },
      top3: sites.slice(0, 3).map(s => ({
        rank: s.rank,
        name: s.siteName,
        city: s.address.city,
        distance: s.distance,
        score: s.matchingScore,
        isOpen: s.isOpen,
        quotaRemaining: s.quotaRemaining,
      })),
    };

    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /matching/coverage - Zones de couverture
router.get('/coverage', async (req: Request, res: Response) => {
  try {
    const { PalletSite } = await import('../models/PalletSite');

    // Récupérer tous les sites actifs avec leurs coordonnées
    const sites = await PalletSite.find({ active: true })
      .select('siteId siteName address.city address.coordinates priority')
      .lean();

    // Grouper par ville
    const byCity: Record<string, number> = {};
    sites.forEach(site => {
      const city = site.address.city || 'Inconnu';
      byCity[city] = (byCity[city] || 0) + 1;
    });

    // Top 10 villes
    const topCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    res.json({
      totalSites: sites.length,
      byCity,
      topCities,
      sites: sites.map(s => ({
        siteId: s.siteId,
        name: s.siteName,
        city: s.address.city,
        lat: s.address.coordinates.latitude,
        lng: s.address.coordinates.longitude,
        priority: s.priority,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

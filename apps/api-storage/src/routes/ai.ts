/**
 * Routes: AI Services
 * Moteur IA pour scoring, ranking et génération RFP
 */

import express, { Request, Response, NextFunction } from 'express';
import StorageNeed from '../models/StorageNeed';
import StorageOffer from '../models/StorageOffer';
import LogisticianSite from '../models/LogisticianSite';
import LogisticianSubscription from '../models/LogisticianSubscription';

const router = express.Router();

// Middleware d'authentification
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  next();
};

router.use(authMiddleware);

/**
 * POST /ai/score-offer
 * Calculer le score IA d'une offre
 */
router.post('/score-offer', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.body;

    const offer = await StorageOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    const need = await StorageNeed.findById(offer.needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    const site = await LogisticianSite.findById(offer.siteId);
    const subscription = await LogisticianSubscription.findOne({ logisticianId: offer.logisticianId });

    // Calculer les scores
    const scoring = await calculateOfferScore(offer, need, site, subscription);

    // Sauvegarder le score
    offer.aiScoring = scoring;
    await offer.save();

    res.json({ success: true, data: scoring });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /ai/rank-offers
 * Classer les offres pour un besoin avec IA
 */
router.post('/rank-offers', async (req: Request, res: Response) => {
  try {
    const { needId, weights } = req.body;

    const need = await StorageNeed.findById(needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    // Récupérer toutes les offres actives
    const offers = await StorageOffer.find({
      needId,
      status: { $in: ['submitted', 'under_review', 'shortlisted'] }
    });

    if (offers.length === 0) {
      return res.json({ success: true, data: [], message: 'Aucune offre à classer' });
    }

    // Calculer les scores pour chaque offre
    const rankedOffers = await Promise.all(offers.map(async (offer) => {
      const site = await LogisticianSite.findById(offer.siteId);
      const subscription = await LogisticianSubscription.findOne({ logisticianId: offer.logisticianId });

      const scoring = await calculateOfferScore(offer, need, site, subscription, weights);

      // Mettre à jour l'offre
      offer.aiScoring = scoring;
      await offer.save();

      return {
        offerId: offer._id,
        logisticianId: offer.logisticianId,
        logisticianName: offer.logisticianName,
        logisticianType: offer.logisticianType,
        siteName: offer.siteName,
        globalScore: scoring.globalScore,
        scores: {
          price: scoring.priceScore,
          location: scoring.locationScore,
          capacity: scoring.capacityScore,
          service: scoring.serviceScore,
          reliability: scoring.reliabilityScore,
          certification: scoring.certificationScore
        },
        factors: scoring.factors,
        pricing: offer.pricing,
        proposedStartDate: offer.proposedStartDate
      };
    }));

    // Trier par score global décroissant
    rankedOffers.sort((a, b) => b.globalScore - a.globalScore);

    // Ajouter le rang
    const rankedWithPosition = rankedOffers.map((offer, index) => ({
      ...offer,
      rank: index + 1,
      recommendation: index === 0 ? 'BEST_MATCH' : index < 3 ? 'RECOMMENDED' : 'STANDARD'
    }));

    res.json({
      success: true,
      data: rankedWithPosition,
      summary: {
        totalOffers: rankedWithPosition.length,
        bestMatch: rankedWithPosition[0],
        averageScore: Math.round(rankedOffers.reduce((sum, o) => sum + o.globalScore, 0) / rankedOffers.length),
        priceRange: {
          min: Math.min(...rankedOffers.map(o => o.pricing.pricePerUnit)),
          max: Math.max(...rankedOffers.map(o => o.pricing.pricePerUnit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /ai/generate-rfp
 * Générer un cahier des charges (RFP) à partir d'un besoin
 */
router.post('/generate-rfp', async (req: Request, res: Response) => {
  try {
    const { needId, format = 'markdown' } = req.body;

    const need = await StorageNeed.findById(needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    const rfp = generateRFPDocument(need, format);

    res.json({
      success: true,
      data: {
        needId: need._id,
        reference: need.reference,
        format,
        content: rfp.content,
        sections: rfp.sections,
        generatedAt: new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /ai/analyze-response
 * Analyser une réponse/offre de logisticien
 */
router.post('/analyze-response', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.body;

    const offer = await StorageOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre non trouvée' });
    }

    const need = await StorageNeed.findById(offer.needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    const analysis = analyzeOfferCompliance(offer, need);

    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /ai/recommend-logisticians
 * Recommander des logisticiens pour un besoin
 */
router.post('/recommend-logisticians', async (req: Request, res: Response) => {
  try {
    const { needId, maxResults = 10 } = req.body;

    const need = await StorageNeed.findById(needId);
    if (!need) {
      return res.status(404).json({ success: false, error: 'Besoin non trouvé' });
    }

    // Rechercher des sites compatibles
    const query: any = {
      active: true,
      'availableCapacity.quantity': { $gte: need.volume.quantity * 0.8 } // Au moins 80% de la capacité demandée
    };

    // Filtres selon le besoin
    if (need.storageType) {
      query.storageTypes = need.storageType;
    }
    if (need.constraints?.temperature && need.constraints.temperature !== 'ambient') {
      query.temperatureConditions = { $in: [need.constraints.temperature] };
    }
    if (need.constraints?.adrAuthorized) {
      query.adrAuthorized = true;
    }
    if (need.location?.region) {
      query.region = new RegExp(need.location.region, 'i');
    }

    const sites = await LogisticianSite.find(query)
      .limit(maxResults * 2);

    // Scorer chaque site
    const scoredSites = await Promise.all(sites.map(async (site) => {
      const subscription = await LogisticianSubscription.findOne({ logisticianId: site.logisticianId });
      const score = calculateSiteCompatibility(site, need, subscription);

      return {
        siteId: site._id,
        siteName: site.name,
        logisticianId: site.logisticianId,
        logisticianName: site.logisticianName,
        logisticianType: subscription?.tier || 'guest',
        location: {
          city: site.city,
          region: site.region,
          country: site.country
        },
        availableCapacity: site.availableCapacity,
        storageTypes: site.storageTypes,
        certifications: site.certifications,
        verified: site.verified,
        rating: subscription?.metrics?.rating || 0,
        compatibilityScore: score.total,
        matchDetails: score.details
      };
    }));

    // Trier et limiter
    scoredSites.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const recommendations = scoredSites.slice(0, maxResults);

    res.json({
      success: true,
      data: recommendations,
      criteria: {
        storageType: need.storageType,
        region: need.location?.region,
        minCapacity: need.volume.quantity,
        specialRequirements: {
          adr: need.constraints?.adrAuthorized,
          temperature: need.constraints?.temperature
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /ai/market-insights
 * Insights marché (prix moyens, tendances)
 */
router.get('/market-insights', async (req: Request, res: Response) => {
  try {
    const { region, storageType } = req.query;

    const matchQuery: any = { status: 'accepted' };
    if (region) matchQuery['location.region'] = new RegExp(region as string, 'i');

    // Prix moyens par type de stockage
    const priceInsights = await StorageOffer.aggregate([
      { $match: { status: 'accepted' } },
      {
        $group: {
          _id: '$pricing.unit',
          avgPrice: { $avg: '$pricing.pricePerUnit' },
          minPrice: { $min: '$pricing.pricePerUnit' },
          maxPrice: { $max: '$pricing.pricePerUnit' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Demande par région
    const demandByRegion = await StorageNeed.aggregate([
      { $match: { status: { $in: ['published', 'attributed'] } } },
      {
        $group: {
          _id: '$location.region',
          needCount: { $sum: 1 },
          totalVolume: { $sum: '$volume.quantity' }
        }
      },
      { $sort: { needCount: -1 } },
      { $limit: 10 }
    ]);

    // Capacité disponible par région
    const supplyByRegion = await LogisticianSite.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: '$region',
          siteCount: { $sum: 1 },
          totalAvailable: { $sum: '$availableCapacity.quantity' }
        }
      },
      { $sort: { totalAvailable: -1 } },
      { $limit: 10 }
    ]);

    // Types de stockage les plus demandés
    const storageTypesDemand = await StorageNeed.aggregate([
      { $match: { status: { $in: ['published', 'attributed'] } } },
      { $group: { _id: '$storageType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        pricing: priceInsights,
        demandByRegion,
        supplyByRegion,
        storageTypesDemand,
        marketTrends: {
          demandGrowth: '+12%',
          avgPriceChange: '+3%',
          hotRegions: demandByRegion.slice(0, 3).map((r: any) => r._id),
          period: 'Last 3 months'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// === Fonctions de calcul IA ===

interface ScoringWeights {
  price?: number;
  location?: number;
  capacity?: number;
  service?: number;
  reliability?: number;
  certification?: number;
}

async function calculateOfferScore(
  offer: any,
  need: any,
  site: any,
  subscription: any,
  weights: ScoringWeights = {}
): Promise<any> {
  const defaultWeights = {
    price: 0.25,
    location: 0.15,
    capacity: 0.20,
    service: 0.15,
    reliability: 0.15,
    certification: 0.10
  };

  const w = { ...defaultWeights, ...weights };
  const factors: any[] = [];

  // Score Prix (inverse - moins cher = meilleur)
  const priceScore = calculatePriceScore(offer, need);
  factors.push({
    factor: 'Compétitivité prix',
    impact: priceScore > 70 ? 'positive' : priceScore > 50 ? 'neutral' : 'negative',
    weight: w.price,
    details: `Prix proposé: ${offer.pricing.pricePerUnit} ${offer.pricing.currency}/${offer.pricing.unit}`
  });

  // Score Localisation
  const locationScore = calculateLocationScore(site, need);
  factors.push({
    factor: 'Proximité géographique',
    impact: locationScore > 70 ? 'positive' : locationScore > 50 ? 'neutral' : 'negative',
    weight: w.location,
    details: site ? `${site.city}, ${site.region}` : 'Non spécifié'
  });

  // Score Capacité
  const capacityScore = calculateCapacityScore(offer, need, site);
  factors.push({
    factor: 'Adéquation capacité',
    impact: capacityScore > 80 ? 'positive' : capacityScore > 60 ? 'neutral' : 'negative',
    weight: w.capacity,
    details: `${offer.proposedCapacity.quantity} ${offer.proposedCapacity.unit} proposés`
  });

  // Score Services
  const serviceScore = calculateServiceScore(offer, need, site);
  factors.push({
    factor: 'Services proposés',
    impact: serviceScore > 70 ? 'positive' : serviceScore > 50 ? 'neutral' : 'negative',
    weight: w.service,
    details: `${offer.includedServices?.length || 0} services inclus`
  });

  // Score Fiabilité
  const reliabilityScore = calculateReliabilityScore(subscription);
  factors.push({
    factor: 'Fiabilité logisticien',
    impact: reliabilityScore > 70 ? 'positive' : reliabilityScore > 50 ? 'neutral' : 'negative',
    weight: w.reliability,
    details: subscription?.metrics?.rating ? `Note: ${subscription.metrics.rating}/5` : 'Nouveau'
  });

  // Score Certifications
  const certificationScore = calculateCertificationScore(site, need);
  factors.push({
    factor: 'Certifications',
    impact: certificationScore > 70 ? 'positive' : certificationScore > 50 ? 'neutral' : 'negative',
    weight: w.certification,
    details: site?.certifications?.length ? site.certifications.join(', ') : 'Aucune'
  });

  // Score global pondéré
  const globalScore = Math.round(
    priceScore * w.price +
    locationScore * w.location +
    capacityScore * w.capacity +
    serviceScore * w.service +
    reliabilityScore * w.reliability +
    certificationScore * w.certification
  );

  return {
    globalScore,
    priceScore,
    locationScore,
    capacityScore,
    serviceScore,
    reliabilityScore,
    certificationScore,
    computedAt: new Date(),
    factors
  };
}

function calculatePriceScore(offer: any, need: any): number {
  // Score basé sur le prix - à améliorer avec des données de marché
  const basePrice = offer.pricing.pricePerUnit;
  // Prix de référence approximatif par type
  const refPrices: Record<string, number> = {
    sqm: 12,
    pallets: 8,
    cbm: 15,
    linear_meters: 20
  };
  const refPrice = refPrices[offer.pricing.unit] || 10;

  if (basePrice <= refPrice * 0.8) return 95;
  if (basePrice <= refPrice) return 80;
  if (basePrice <= refPrice * 1.2) return 65;
  if (basePrice <= refPrice * 1.5) return 50;
  return 30;
}

function calculateLocationScore(site: any, need: any): number {
  if (!site || !need.location) return 50;

  let score = 50;

  // Même région
  if (site.region?.toLowerCase() === need.location.region?.toLowerCase()) {
    score += 30;
  }
  // Même pays
  if (site.country?.toLowerCase() === need.location.country?.toLowerCase()) {
    score += 15;
  }
  // Même ville
  if (site.city?.toLowerCase() === need.location.city?.toLowerCase()) {
    score += 5;
  }

  return Math.min(100, score);
}

function calculateCapacityScore(offer: any, need: any, site: any): number {
  const requested = need.volume.quantity;
  const proposed = offer.proposedCapacity.quantity;

  // Capacité parfaite
  if (proposed >= requested && proposed <= requested * 1.2) return 95;
  // Légèrement supérieur (flexibilité)
  if (proposed >= requested * 1.2 && proposed <= requested * 1.5) return 85;
  // Largement supérieur
  if (proposed > requested * 1.5) return 70;
  // Légèrement inférieur
  if (proposed >= requested * 0.9) return 75;
  // Insuffisant
  if (proposed >= requested * 0.7) return 50;

  return 30;
}

function calculateServiceScore(offer: any, need: any, site: any): number {
  let score = 50;

  // Services inclus
  const servicesCount = offer.includedServices?.length || 0;
  score += Math.min(20, servicesCount * 5);

  // WMS / Tracking temps réel
  if (site?.realTimeTracking) score += 10;
  if (site?.apiAvailable) score += 10;
  if (site?.wmsSystem) score += 10;

  return Math.min(100, score);
}

function calculateReliabilityScore(subscription: any): number {
  if (!subscription) return 50;

  let score = 50;

  // Type d'abonnement
  if (subscription.tier === 'premium') score += 20;
  else if (subscription.tier === 'subscriber') score += 10;

  // Métriques
  if (subscription.metrics) {
    score += (subscription.metrics.rating || 0) * 6; // Max 30 points
    score += Math.min(10, (subscription.metrics.totalContractsWon || 0) * 2);
    if (subscription.metrics.successRate > 80) score += 10;
  }

  return Math.min(100, score);
}

function calculateCertificationScore(site: any, need: any): number {
  if (!site) return 50;

  let score = 50;

  // Certifications générales
  const certCount = site.certifications?.length || 0;
  score += Math.min(20, certCount * 5);

  // ADR si requis
  if (need.constraints?.adrRequired && site.adrAuthorized) score += 15;

  // Douanes si requis
  if (need.constraints?.customsRequired && site.customsAuthorized) score += 15;

  // Site vérifié
  if (site.verified) score += 10;

  return Math.min(100, score);
}

function calculateSiteCompatibility(site: any, need: any, subscription: any): any {
  const details: any[] = [];
  let total = 0;

  // Capacité
  const capacityMatch = site.availableCapacity.quantity >= need.volume.quantity;
  if (capacityMatch) {
    total += 30;
    details.push({ criterion: 'capacity', match: true, score: 30 });
  } else {
    details.push({ criterion: 'capacity', match: false, score: 0 });
  }

  // Type de stockage
  const typeMatch = site.storageTypes.includes(need.storageType);
  if (typeMatch) {
    total += 25;
    details.push({ criterion: 'storageType', match: true, score: 25 });
  } else {
    details.push({ criterion: 'storageType', match: false, score: 0 });
  }

  // Région
  const regionMatch = site.region?.toLowerCase() === need.location?.region?.toLowerCase();
  if (regionMatch) {
    total += 20;
    details.push({ criterion: 'region', match: true, score: 20 });
  } else {
    total += 5;
    details.push({ criterion: 'region', match: false, score: 5 });
  }

  // Fiabilité logisticien
  const reliabilityBonus = subscription?.tier === 'premium' ? 15 :
                          subscription?.tier === 'subscriber' ? 10 : 5;
  total += reliabilityBonus;
  details.push({ criterion: 'reliability', match: true, score: reliabilityBonus });

  // Site vérifié
  if (site.verified) {
    total += 10;
    details.push({ criterion: 'verified', match: true, score: 10 });
  }

  return { total, details };
}

function generateRFPDocument(need: any, format: string): any {
  const sections = [];

  // Section 1: Présentation
  sections.push({
    title: '1. Présentation du besoin',
    content: `
## Référence: ${need.reference}

**Type de stockage:** ${need.storageType}
**Volume demandé:** ${need.volume.quantity} ${need.volume.unit}
**Durée:** ${need.duration?.value} ${need.duration?.unit}

### Localisation souhaitée
- Région: ${need.location?.region || 'Non spécifié'}
- Pays: ${need.location?.country || 'France'}
${need.location?.city ? `- Ville: ${need.location.city}` : ''}
`
  });

  // Section 2: Contraintes
  sections.push({
    title: '2. Contraintes et exigences',
    content: `
### Conditions de stockage
${need.constraints?.temperatureControl?.required ? `- **Température contrôlée requise:** ${need.constraints.temperatureControl.targetRange?.join(' à ')}°C` : '- Température ambiante'}
${need.constraints?.adrRequired ? '- **Produits ADR:** Autorisation requise' : ''}
${need.constraints?.customsRequired ? '- **Zone douanière:** Requise' : ''}

### Accessibilité
${need.constraints?.accessibility?.vehicleTypes ? `- Types de véhicules: ${need.constraints.accessibility.vehicleTypes.join(', ')}` : ''}
${need.constraints?.accessibility?.requiresForklift ? '- Chariot élévateur requis' : ''}
`
  });

  // Section 3: Services attendus
  sections.push({
    title: '3. Services attendus',
    content: `
### Services obligatoires
- Réception des marchandises
- Stockage sécurisé
- Préparation de commandes
- Expédition

### Services optionnels appréciés
- Suivi en temps réel (WMS)
- Intégration API
- Gestion des retours
- Co-packing
`
  });

  // Section 4: Modalités de réponse
  sections.push({
    title: '4. Modalités de réponse',
    content: `
### Date limite de réponse
${need.publication?.deadline ? new Date(need.publication.deadline).toLocaleDateString('fr-FR') : 'À définir'}

### Éléments attendus dans votre proposition
1. Présentation de votre société et site proposé
2. Capacité disponible et conditions de stockage
3. Tarification détaillée (stockage, manutention, services)
4. Délai de mise à disposition
5. Certifications et références

### Contact
Pour toute question, utilisez la messagerie intégrée de la plateforme.
`
  });

  const content = sections.map(s => `# ${s.title}\n${s.content}`).join('\n\n---\n\n');

  return { content, sections };
}

function analyzeOfferCompliance(offer: any, need: any): any {
  const compliance: any[] = [];
  let overallScore = 0;
  let maxScore = 0;

  // Capacité
  maxScore += 20;
  if (offer.proposedCapacity.quantity >= need.volume.quantity) {
    compliance.push({ criterion: 'Capacité suffisante', status: 'compliant', score: 20 });
    overallScore += 20;
  } else {
    compliance.push({
      criterion: 'Capacité suffisante',
      status: 'non_compliant',
      score: 0,
      detail: `Proposé: ${offer.proposedCapacity.quantity}, Requis: ${need.volume.quantity}`
    });
  }

  // Date de début
  maxScore += 15;
  const needStart = new Date(need.duration?.startDate || Date.now());
  const offerStart = new Date(offer.proposedStartDate);
  if (offerStart <= needStart) {
    compliance.push({ criterion: 'Date de début', status: 'compliant', score: 15 });
    overallScore += 15;
  } else {
    compliance.push({
      criterion: 'Date de début',
      status: 'partial',
      score: 8,
      detail: `Proposé: ${offerStart.toLocaleDateString()}, Souhaité: ${needStart.toLocaleDateString()}`
    });
    overallScore += 8;
  }

  // Tarification complète
  maxScore += 15;
  if (offer.pricing?.pricePerUnit && offer.pricing?.currency) {
    compliance.push({ criterion: 'Tarification complète', status: 'compliant', score: 15 });
    overallScore += 15;
  } else {
    compliance.push({ criterion: 'Tarification complète', status: 'non_compliant', score: 0 });
  }

  return {
    offerId: offer._id,
    needId: need._id,
    complianceItems: compliance,
    overallScore,
    maxScore,
    complianceRate: Math.round((overallScore / maxScore) * 100),
    recommendation: overallScore >= maxScore * 0.8 ? 'APPROVED' :
                   overallScore >= maxScore * 0.6 ? 'REVIEW_NEEDED' : 'NOT_RECOMMENDED'
  };
}

export default router;

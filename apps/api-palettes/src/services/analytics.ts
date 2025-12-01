import PalletCheque from '../models/PalletCheque';
import PalletSite from '../models/PalletSite';
import PalletDispute from '../models/PalletDispute';
import PalletLedger from '../models/PalletLedger';

/**
 * Service d'analytics et statistiques avancées
 * - Prédictions de délais
 * - Détection d'anomalies
 * - Optimisation de routes
 * - KPIs réseau
 */

// Prédire le délai moyen de restitution pour un site
export async function predictRestitutionDelay(siteId: string) {
  try {
    const site = await PalletSite.findOne({ siteId });
    if (!site) {
      throw new Error('Site non trouvé');
    }

    // Récupérer les chèques reçus par ce site sur les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cheques = await PalletCheque.find({
      toSiteId: siteId,
      status: 'RECU',
      'timestamps.receivedAt': { $exists: true },
      'timestamps.emittedAt': { $gte: thirtyDaysAgo },
    });

    if (cheques.length === 0) {
      return {
        siteId,
        siteName: site.siteName,
        avgDelayHours: null,
        avgDelayDays: null,
        sampleSize: 0,
        confidence: 'low',
        message: 'Pas assez de données historiques',
      };
    }

    // Calculer les délais
    const delays = cheques.map(cheque => {
      const emitted = new Date(cheque.timestamps.emittedAt).getTime();
      const received = new Date(cheque.timestamps.receivedAt!).getTime();
      return (received - emitted) / (1000 * 60 * 60); // en heures
    });

    const avgDelayHours = delays.reduce((sum, d) => sum + d, 0) / delays.length;
    const medianDelay = delays.sort((a, b) => a - b)[Math.floor(delays.length / 2)];
    const minDelay = Math.min(...delays);
    const maxDelay = Math.max(...delays);

    // Déterminer la confiance
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (cheques.length >= 50) confidence = 'high';
    else if (cheques.length >= 20) confidence = 'medium';

    return {
      siteId,
      siteName: site.siteName,
      avgDelayHours: Math.round(avgDelayHours * 10) / 10,
      avgDelayDays: Math.round((avgDelayHours / 24) * 10) / 10,
      medianDelayHours: Math.round(medianDelay * 10) / 10,
      minDelayHours: Math.round(minDelay * 10) / 10,
      maxDelayHours: Math.round(maxDelay * 10) / 10,
      sampleSize: cheques.length,
      confidence,
      period: '30 derniers jours',
    };
  } catch (error: any) {
    throw new Error(`Erreur prédiction délai: ${error.message}`);
  }
}

// Détecter des anomalies dans les transactions
export async function detectAnomalies() {
  try {
    const anomalies: any[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Détection de scans multiples (même chèque scanné plusieurs fois dans un court laps de temps)
    const recentCheques = await PalletCheque.find({
      updatedAt: { $gte: sevenDaysAgo },
    });

    const chequeUpdates = new Map<string, number>();
    for (const cheque of recentCheques) {
      const count = chequeUpdates.get(cheque.chequeId) || 0;
      chequeUpdates.set(cheque.chequeId, count + 1);
    }

    for (const [chequeId, count] of chequeUpdates) {
      if (count > 5) {
        const cheque = await PalletCheque.findOne({ chequeId });
        anomalies.push({
          type: 'MULTIPLE_SCANS',
          severity: count > 10 ? 'high' : 'medium',
          chequeId,
          details: `Chèque modifié ${count} fois en 7 jours`,
          companyId: cheque?.fromCompanyId,
          detectedAt: new Date(),
        });
      }
    }

    // 2. Géolocalisations incohérentes (dépôt et réception très éloignés)
    const chequesWithGeo = await PalletCheque.find({
      'geolocations.deposit': { $exists: true },
      'geolocations.receipt': { $exists: true },
      'timestamps.emittedAt': { $gte: sevenDaysAgo },
    });

    for (const cheque of chequesWithGeo) {
      if (cheque.geolocations.deposit && cheque.geolocations.receipt) {
        const distance = calculateDistance(
          cheque.geolocations.deposit.lat,
          cheque.geolocations.deposit.lng,
          cheque.geolocations.receipt.lat,
          cheque.geolocations.receipt.lng
        );

        // Si la distance est > 1000 km, c'est suspect
        if (distance > 1000) {
          anomalies.push({
            type: 'INCONSISTENT_GEOLOCATION',
            severity: 'high',
            chequeId: cheque.chequeId,
            details: `Distance suspecte: ${Math.round(distance)} km entre dépôt et réception`,
            distance: Math.round(distance),
            companyId: cheque.fromCompanyId,
            siteId: cheque.toSiteId,
            detectedAt: new Date(),
          });
        }
      }
    }

    // 3. Quantités anormalement élevées
    const highQuantityCheques = await PalletCheque.find({
      quantity: { $gt: 100 },
      'timestamps.emittedAt': { $gte: sevenDaysAgo },
    });

    for (const cheque of highQuantityCheques) {
      anomalies.push({
        type: 'HIGH_QUANTITY',
        severity: cheque.quantity > 200 ? 'high' : 'medium',
        chequeId: cheque.chequeId,
        details: `Quantité anormalement élevée: ${cheque.quantity} palettes`,
        quantity: cheque.quantity,
        companyId: cheque.fromCompanyId,
        detectedAt: new Date(),
      });
    }

    // 4. Taux de litiges anormalement élevé par entreprise
    const companies = await PalletCheque.distinct('fromCompanyId');

    for (const companyId of companies) {
      const totalCheques = await PalletCheque.countDocuments({
        fromCompanyId: companyId,
        'timestamps.emittedAt': { $gte: sevenDaysAgo },
      });

      const disputeCheques = await PalletCheque.countDocuments({
        fromCompanyId: companyId,
        status: 'LITIGE',
        'timestamps.emittedAt': { $gte: sevenDaysAgo },
      });

      if (totalCheques > 10 && disputeCheques / totalCheques > 0.3) {
        anomalies.push({
          type: 'HIGH_DISPUTE_RATE',
          severity: 'high',
          companyId,
          details: `Taux de litiges élevé: ${Math.round(disputeCheques / totalCheques * 100)}% (${disputeCheques}/${totalCheques})`,
          disputeRate: Math.round(disputeCheques / totalCheques * 100),
          detectedAt: new Date(),
        });
      }
    }

    return {
      total: anomalies.length,
      anomalies: anomalies.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      }),
      period: '7 derniers jours',
      checkedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Erreur détection anomalies: ${error.message}`);
  }
}

// Calculer les routes optimales pour un transporteur
export async function calculateOptimalRoutes(transporterId: string) {
  try {
    // Récupérer tous les chèques en transit pour ce transporteur
    const chequesInTransit = await PalletCheque.find({
      fromCompanyId: transporterId,
      status: { $in: ['EN_TRANSIT', 'DEPOSE'] },
    });

    if (chequesInTransit.length === 0) {
      return {
        transporterId,
        routes: [],
        message: 'Aucun chèque en transit',
      };
    }

    // Récupérer les sites de destination
    const siteIds = [...new Set(chequesInTransit.map(c => c.toSiteId))];
    const sites = await PalletSite.find({ siteId: { $in: siteIds } });

    // Calculer les distances et scores pour chaque site
    const siteScores = sites.map(site => {
      const chequesForSite = chequesInTransit.filter(c => c.toSiteId === site.siteId);
      const totalQuantity = chequesForSite.reduce((sum, c) => sum + c.quantity, 0);

      // Score basé sur : quantité, priorité du site, quota disponible
      const quotaUsagePercent = site.quota.currentDaily / site.quota.maxDaily * 100;
      const priorityBonus = site.priority === 'INTERNAL' ? 30 : site.priority === 'NETWORK' ? 15 : 0;
      const quotaScore = quotaUsagePercent < 80 ? 20 : 5;

      const score = totalQuantity * 2 + site.priorityScore + priorityBonus + quotaScore;

      return {
        siteId: site.siteId,
        siteName: site.siteName,
        address: `${site.address.street}, ${site.address.city}`,
        coordinates: site.address.coordinates,
        chequesCount: chequesForSite.length,
        totalQuantity,
        priority: site.priority,
        priorityScore: site.priorityScore,
        quotaAvailable: site.quota.maxDaily - site.quota.currentDaily,
        quotaUsagePercent: Math.round(quotaUsagePercent),
        score: Math.round(score),
        chequeIds: chequesForSite.map(c => c.chequeId),
      };
    });

    // Trier par score décroissant
    const sortedRoutes = siteScores.sort((a, b) => b.score - a.score);

    // Ajouter un ordre de visite recommandé
    const routeWithOrder = sortedRoutes.map((route, index) => ({
      ...route,
      recommendedOrder: index + 1,
      recommendation: index === 0 ? 'PRIORITAIRE' : index < 3 ? 'RECOMMANDE' : 'STANDARD',
    }));

    return {
      transporterId,
      totalSites: sortedRoutes.length,
      totalCheques: chequesInTransit.length,
      totalQuantity: chequesInTransit.reduce((sum, c) => sum + c.quantity, 0),
      routes: routeWithOrder,
      optimizedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Erreur calcul routes: ${error.message}`);
  }
}

// Obtenir la santé globale du réseau
export async function getNetworkHealth() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Taux de restitution
    const totalCheques = await PalletCheque.countDocuments({
      'timestamps.emittedAt': { $gte: thirtyDaysAgo },
    });

    const receivedCheques = await PalletCheque.countDocuments({
      status: 'RECU',
      'timestamps.emittedAt': { $gte: thirtyDaysAgo },
    });

    const restitutionRate = totalCheques > 0 ? Math.round((receivedCheques / totalCheques) * 100) : 0;

    // 2. Délai moyen de restitution
    const chequesWithDelay = await PalletCheque.find({
      status: 'RECU',
      'timestamps.receivedAt': { $exists: true },
      'timestamps.emittedAt': { $gte: thirtyDaysAgo },
    });

    let avgDelayHours = 0;
    if (chequesWithDelay.length > 0) {
      const totalDelay = chequesWithDelay.reduce((sum, cheque) => {
        const emitted = new Date(cheque.timestamps.emittedAt).getTime();
        const received = new Date(cheque.timestamps.receivedAt!).getTime();
        return sum + (received - emitted);
      }, 0);
      avgDelayHours = Math.round((totalDelay / chequesWithDelay.length) / (1000 * 60 * 60));
    }

    // 3. Taux de litiges
    const totalDisputes = await PalletDispute.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const disputeRate = totalCheques > 0 ? Math.round((totalDisputes / totalCheques) * 100) : 0;

    // 4. Sites actifs
    const activeSites = await PalletSite.countDocuments({ active: true });
    const totalSites = await PalletSite.countDocuments();

    // 5. Volume de palettes échangées
    const allCheques = await PalletCheque.find({
      'timestamps.emittedAt': { $gte: thirtyDaysAgo },
    });

    const totalPallets = allCheques.reduce((sum, c) => sum + c.quantity, 0);

    // 6. Santé globale (score 0-100)
    let healthScore = 100;
    if (restitutionRate < 80) healthScore -= (80 - restitutionRate);
    if (disputeRate > 10) healthScore -= (disputeRate - 10) * 2;
    if (avgDelayHours > 72) healthScore -= Math.min(20, (avgDelayHours - 72) / 24 * 5);
    healthScore = Math.max(0, Math.round(healthScore));

    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (healthScore < 50) healthStatus = 'critical';
    else if (healthScore < 70) healthStatus = 'warning';
    else if (healthScore < 90) healthStatus = 'good';

    return {
      healthScore,
      healthStatus,
      period: '30 derniers jours',
      metrics: {
        restitution: {
          rate: restitutionRate,
          total: totalCheques,
          received: receivedCheques,
          pending: totalCheques - receivedCheques,
        },
        delay: {
          avgHours: avgDelayHours,
          avgDays: Math.round(avgDelayHours / 24 * 10) / 10,
        },
        disputes: {
          rate: disputeRate,
          total: totalDisputes,
          perWeek: Math.round(totalDisputes / 4.3),
        },
        sites: {
          active: activeSites,
          total: totalSites,
          activeRate: Math.round((activeSites / totalSites) * 100),
        },
        volume: {
          totalPallets,
          avgPerDay: Math.round(totalPallets / 30),
          avgPerCheque: totalCheques > 0 ? Math.round(totalPallets / totalCheques) : 0,
        },
      },
      recommendations: generateRecommendations(restitutionRate, disputeRate, avgDelayHours),
      calculatedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Erreur calcul santé réseau: ${error.message}`);
  }
}

// Générer des recommandations basées sur les KPIs
function generateRecommendations(restitutionRate: number, disputeRate: number, avgDelayHours: number): string[] {
  const recommendations: string[] = [];

  if (restitutionRate < 80) {
    recommendations.push('Améliorer le taux de restitution : contacter les sites avec des palettes en attente');
  }

  if (disputeRate > 10) {
    recommendations.push('Taux de litiges élevé : vérifier la qualité des palettes et la formation des chauffeurs');
  }

  if (avgDelayHours > 72) {
    recommendations.push('Délai de restitution trop long : optimiser les routes et encourager les dépôts rapides');
  }

  if (recommendations.length === 0) {
    recommendations.push('Réseau en bonne santé : continuer les efforts actuels');
  }

  return recommendations;
}

// Fonction utilitaire : calcul de distance entre deux coordonnées GPS
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Obtenir des KPIs détaillés
export async function getDetailedKPIs() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // KPIs par type de palette
    const chequesByType = await PalletCheque.aggregate([
      { $match: { 'timestamps.emittedAt': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$palletType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    // KPIs par statut
    const chequesByStatus = await PalletCheque.aggregate([
      { $match: { 'timestamps.emittedAt': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Top 5 sites les plus actifs
    const topSites = await PalletCheque.aggregate([
      { $match: { 'timestamps.emittedAt': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$toSiteId',
          siteName: { $first: '$toSiteName' },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Top 5 transporteurs les plus actifs
    const topTransporters = await PalletCheque.aggregate([
      { $match: { 'timestamps.emittedAt': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$fromCompanyId',
          companyName: { $first: '$fromCompanyName' },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return {
      period: '7 derniers jours',
      byPalletType: chequesByType.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalQuantity: item.totalQuantity };
        return acc;
      }, {} as any),
      byStatus: chequesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as any),
      topSites,
      topTransporters,
      generatedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Erreur calcul KPIs: ${error.message}`);
  }
}

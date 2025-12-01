/**
 * Module: AI Scoring Engine
 * Moteur de scoring IA AFFRET.IA
 * Score global = (Prix × 40%) + (Qualité × 60%)
 */

export interface ScoringConfig {
  weights: {
    price: number;      // default: 0.40
    quality: number;    // default: 0.25
    distance: number;   // default: 0.15
    historical: number; // default: 0.10
    reactivity: number; // default: 0.05
    vigilance: number;  // default: 0.05
  };
  thresholds: {
    autoAcceptScore: number;       // default: 85
    minAcceptableScore: number;    // default: 60
    priceTolerancePercent: number; // default: 15
  };
}

export interface CarrierData {
  carrierId: string;
  carrierName: string;
  proposedPrice: number;
  distance?: number;
  historicalData?: {
    totalMissions: number;
    onTimeRate: number;
    averageRating: number;
    lastMissionDate?: string;
  };
  vigilanceScore?: number;
  responseTime?: number; // seconds
}

export interface OrderData {
  orderId: string;
  estimatedPrice: number;
  distance: number;
  pickupDate: string;
  deliveryDate: string;
  goodsType: string;
  weight: number;
  requirements?: string[];
}

export interface ScoringResult {
  carrierId: string;
  carrierName: string;
  totalScore: number;
  breakdown: {
    price: number;
    quality: number;
    distance: number;
    historical: number;
    reactivity: number;
    vigilance: number;
  };
  recommendation: string;
  autoAcceptable: boolean;
}

class AIScoringEngine {
  private config: ScoringConfig;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      weights: {
        price: config?.weights?.price ?? 0.40,
        quality: config?.weights?.quality ?? 0.25,
        distance: config?.weights?.distance ?? 0.15,
        historical: config?.weights?.historical ?? 0.10,
        reactivity: config?.weights?.reactivity ?? 0.05,
        vigilance: config?.weights?.vigilance ?? 0.05
      },
      thresholds: {
        autoAcceptScore: config?.thresholds?.autoAcceptScore ?? 85,
        minAcceptableScore: config?.thresholds?.minAcceptableScore ?? 60,
        priceTolerancePercent: config?.thresholds?.priceTolerancePercent ?? 15
      }
    };
  }

  /**
   * Calculer le score prix (0-100)
   * Plus le prix est proche ou inférieur à l'estimation, plus le score est élevé
   */
  calculatePriceScore(proposedPrice: number, estimatedPrice: number): number {
    if (estimatedPrice <= 0) return 50;

    const variation = ((proposedPrice - estimatedPrice) / estimatedPrice) * 100;

    // Prix inférieur ou égal à l'estimation = score max
    if (variation <= 0) {
      return Math.min(100, 100 + (variation * 0.5)); // Bonus pour prix inférieur
    }

    // Prix supérieur à l'estimation = pénalité progressive
    if (variation <= 5) return 90;
    if (variation <= 10) return 80;
    if (variation <= 15) return 70;
    if (variation <= 20) return 60;
    if (variation <= 25) return 50;
    if (variation <= 30) return 40;
    if (variation <= 40) return 30;
    if (variation <= 50) return 20;
    return 10;
  }

  /**
   * Calculer le score qualité basé sur l'historique (0-100)
   */
  calculateQualityScore(historicalData?: CarrierData['historicalData']): number {
    if (!historicalData) return 50; // Score neutre si pas d'historique

    let score = 0;

    // On-time rate (40% du score qualité)
    score += (historicalData.onTimeRate / 100) * 40;

    // Average rating (40% du score qualité)
    score += (historicalData.averageRating / 5) * 40;

    // Experience bonus (20% du score qualité)
    const experienceBonus = Math.min(20, historicalData.totalMissions * 0.1);
    score += experienceBonus;

    return Math.round(Math.min(100, score));
  }

  /**
   * Calculer le score distance (0-100)
   * Transporteurs proches du point de chargement favorisés
   */
  calculateDistanceScore(carrierDistance?: number, orderDistance?: number): number {
    if (!carrierDistance || !orderDistance) return 50;

    // Ratio de distance du transporteur par rapport à la distance totale
    const ratio = carrierDistance / orderDistance;

    if (ratio <= 0.1) return 100;  // Très proche
    if (ratio <= 0.2) return 90;
    if (ratio <= 0.3) return 80;
    if (ratio <= 0.4) return 70;
    if (ratio <= 0.5) return 60;
    if (ratio <= 0.7) return 50;
    if (ratio <= 1.0) return 40;
    return 30;
  }

  /**
   * Calculer le score historique (0-100)
   * Basé sur les missions précédentes avec ce transporteur
   */
  calculateHistoricalScore(historicalData?: CarrierData['historicalData']): number {
    if (!historicalData || historicalData.totalMissions === 0) return 50;

    let score = 50; // Base

    // Nombre de missions
    if (historicalData.totalMissions >= 50) score += 20;
    else if (historicalData.totalMissions >= 20) score += 15;
    else if (historicalData.totalMissions >= 10) score += 10;
    else if (historicalData.totalMissions >= 5) score += 5;

    // Récence (bonus si mission récente)
    if (historicalData.lastMissionDate) {
      const daysSinceLastMission = Math.floor(
        (Date.now() - new Date(historicalData.lastMissionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastMission <= 7) score += 15;
      else if (daysSinceLastMission <= 30) score += 10;
      else if (daysSinceLastMission <= 90) score += 5;
    }

    // On-time rate contribution
    score += (historicalData.onTimeRate / 100) * 15;

    return Math.round(Math.min(100, score));
  }

  /**
   * Calculer le score réactivité (0-100)
   * Basé sur le temps de réponse
   */
  calculateReactivityScore(responseTime?: number): number {
    if (!responseTime) return 50;

    // Temps en secondes
    const minutes = responseTime / 60;

    if (minutes <= 5) return 100;   // < 5 min
    if (minutes <= 15) return 90;  // < 15 min
    if (minutes <= 30) return 80;  // < 30 min
    if (minutes <= 60) return 70;  // < 1h
    if (minutes <= 120) return 60; // < 2h
    if (minutes <= 240) return 50; // < 4h
    if (minutes <= 480) return 40; // < 8h
    if (minutes <= 1440) return 30; // < 24h
    return 20;
  }

  /**
   * Calculer le score vigilance (0-100)
   */
  calculateVigilanceScore(vigilanceScore?: number): number {
    return vigilanceScore ?? 50;
  }

  /**
   * Calculer le score total pour un transporteur
   */
  calculateTotalScore(carrier: CarrierData, order: OrderData): ScoringResult {
    const breakdown = {
      price: this.calculatePriceScore(carrier.proposedPrice, order.estimatedPrice),
      quality: this.calculateQualityScore(carrier.historicalData),
      distance: this.calculateDistanceScore(carrier.distance, order.distance),
      historical: this.calculateHistoricalScore(carrier.historicalData),
      reactivity: this.calculateReactivityScore(carrier.responseTime),
      vigilance: this.calculateVigilanceScore(carrier.vigilanceScore)
    };

    // Score pondéré
    const totalScore = Math.round(
      breakdown.price * this.config.weights.price +
      breakdown.quality * this.config.weights.quality +
      breakdown.distance * this.config.weights.distance +
      breakdown.historical * this.config.weights.historical +
      breakdown.reactivity * this.config.weights.reactivity +
      breakdown.vigilance * this.config.weights.vigilance
    );

    // Générer recommandation
    let recommendation = '';
    if (totalScore >= 85) {
      recommendation = 'Excellent candidat - Recommandé pour attribution automatique';
    } else if (totalScore >= 75) {
      recommendation = 'Très bon candidat - Recommandé';
    } else if (totalScore >= 65) {
      recommendation = 'Bon candidat - Acceptable';
    } else if (totalScore >= 55) {
      recommendation = 'Candidat moyen - À considérer si peu d\'alternatives';
    } else {
      recommendation = 'Candidat faible - Non recommandé';
    }

    return {
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      totalScore,
      breakdown,
      recommendation,
      autoAcceptable: totalScore >= this.config.thresholds.autoAcceptScore
    };
  }

  /**
   * Scorer et classer plusieurs transporteurs
   */
  rankCarriers(carriers: CarrierData[], order: OrderData): ScoringResult[] {
    const results = carriers.map(carrier => this.calculateTotalScore(carrier, order));
    return results.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Sélectionner le meilleur transporteur
   */
  selectBestCarrier(carriers: CarrierData[], order: OrderData): ScoringResult | null {
    const ranked = this.rankCarriers(carriers, order);
    if (ranked.length === 0) return null;

    const best = ranked[0];

    // Vérifier si le score minimum est atteint
    if (best.totalScore < this.config.thresholds.minAcceptableScore) {
      return null;
    }

    return best;
  }

  /**
   * Générer une contre-offre IA
   */
  generateCounterOffer(
    proposedPrice: number,
    estimatedPrice: number,
    carrierScore: number
  ): { counterPrice: number; message: string } | null {
    const variation = ((proposedPrice - estimatedPrice) / estimatedPrice) * 100;

    // Si le prix est acceptable (< 15% au-dessus), pas de contre-offre
    if (variation <= this.config.thresholds.priceTolerancePercent) {
      return null;
    }

    // Calculer une contre-offre
    let targetVariation: number;
    if (carrierScore >= 80) {
      targetVariation = 10; // Bon transporteur, on accepte 10% au-dessus
    } else if (carrierScore >= 70) {
      targetVariation = 5; // Transporteur moyen, on vise 5%
    } else {
      targetVariation = 0; // Transporteur faible, on vise le prix estimé
    }

    const counterPrice = Math.round(estimatedPrice * (1 + targetVariation / 100));

    return {
      counterPrice,
      message: `Nous vous proposons ${counterPrice}€ pour cette mission. Ce tarif est basé sur notre analyse de marché et prend en compte votre profil transporteur.`
    };
  }

  /**
   * Analyser la complexité d'une commande
   */
  analyzeOrderComplexity(order: OrderData): {
    complexity: 'low' | 'medium' | 'high';
    score: number;
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 0;

    // Distance
    if (order.distance > 500) {
      factors.push('Longue distance');
      score += 20;
    } else if (order.distance > 200) {
      factors.push('Distance moyenne');
      score += 10;
    }

    // Poids
    if (order.weight > 20000) {
      factors.push('Charge lourde');
      score += 20;
    } else if (order.weight > 10000) {
      factors.push('Charge moyenne');
      score += 10;
    }

    // Type de marchandise
    if (order.goodsType === 'dangerous') {
      factors.push('Matières dangereuses (ADR)');
      score += 30;
    } else if (order.goodsType === 'refrigerated' || order.goodsType === 'frozen') {
      factors.push('Transport frigorifique');
      score += 25;
    }

    // Exigences spéciales
    if (order.requirements && order.requirements.length > 0) {
      factors.push(`${order.requirements.length} exigence(s) spéciale(s)`);
      score += order.requirements.length * 5;
    }

    // Délai
    const pickupDate = new Date(order.pickupDate);
    const now = new Date();
    const hoursUntilPickup = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilPickup < 24) {
      factors.push('Urgence (< 24h)');
      score += 30;
    } else if (hoursUntilPickup < 48) {
      factors.push('Délai court (< 48h)');
      score += 15;
    }

    let complexity: 'low' | 'medium' | 'high';
    if (score >= 50) {
      complexity = 'high';
    } else if (score >= 25) {
      complexity = 'medium';
    } else {
      complexity = 'low';
    }

    return { complexity, score, factors };
  }

  /**
   * Vérifier si une proposition peut être auto-acceptée
   */
  canAutoAccept(proposalScore: number, priceVariation: number): boolean {
    return (
      proposalScore >= this.config.thresholds.autoAcceptScore &&
      priceVariation <= this.config.thresholds.priceTolerancePercent
    );
  }
}

// Export singleton
export const aiScoringEngine = new AIScoringEngine();
export default AIScoringEngine;

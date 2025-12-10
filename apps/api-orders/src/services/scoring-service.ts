/**
 * ScoringService - Service de scoring des transporteurs SYMPHONI.A
 * Calcule les scores par transport et agrégés selon les critères métier
 */
import { v4 as uuidv4 } from 'uuid';
import { CarrierOrderScore, CarrierGlobalScore, ICarrierOrderScore, ICarrierGlobalScore, IScoreCriteria } from '../models/CarrierScore';
import Order from '../models/Order';
import EventService from './event-service';

interface ScoreInput {
  orderId: string;
  carrierId: string;
  carrierName: string;
  industrialId: string;
  // Données de performance
  pickupScheduledAt?: Date;
  pickupActualAt?: Date;
  deliveryScheduledAt?: Date;
  deliveryActualAt?: Date;
  appointmentRespected?: boolean;
  trackingResponses?: number; // Nombre de mises à jour tracking
  trackingExpected?: number; // Nombre attendu
  podDeliveredAt?: Date;
  deliveryCompletedAt?: Date;
  hadIncident?: boolean;
  incidentResolutionTimeMinutes?: number;
  communicationScore?: number; // Score manuel 0-100
}

class ScoringService {
  // Poids des critères (total = 100)
  private static readonly WEIGHTS = {
    pickupPunctuality: 15,
    deliveryPunctuality: 20,
    appointmentRespect: 15,
    trackingReactivity: 15,
    podDelay: 15,
    incidentManagement: 10,
    communication: 10
  };

  /**
   * Calcule et enregistre le score pour un transport
   */
  static async calculateOrderScore(input: ScoreInput): Promise<ICarrierOrderScore> {
    const order = await Order.findOne({ orderId: input.orderId });
    if (!order) throw new Error('Commande non trouvée');

    // Calculer chaque composante du score
    const criteria = this.calculateCriteria(input);

    // Calculer le score final pondéré
    const finalScore = this.calculateWeightedScore(criteria);

    // Créer l'enregistrement du score
    const scoreRecord = new CarrierOrderScore({
      scoreId: `score_${uuidv4()}`,
      orderId: input.orderId,
      orderReference: order.reference,
      carrierId: input.carrierId,
      carrierName: input.carrierName,
      industrialId: input.industrialId,
      criteria,
      finalScore,
      calculationData: {
        plannedPickupTime: input.pickupScheduledAt,
        actualPickupTime: input.pickupActualAt,
        pickupDelayMinutes: input.pickupScheduledAt && input.pickupActualAt ?
          Math.round((input.pickupActualAt.getTime() - input.pickupScheduledAt.getTime()) / 60000) : undefined,
        plannedDeliveryTime: input.deliveryScheduledAt,
        actualDeliveryTime: input.deliveryActualAt,
        deliveryDelayMinutes: input.deliveryScheduledAt && input.deliveryActualAt ?
          Math.round((input.deliveryActualAt.getTime() - input.deliveryScheduledAt.getTime()) / 60000) : undefined,
        trackingUpdatesCount: input.trackingResponses || 0,
        expectedTrackingUpdates: input.trackingExpected || 0,
        podUploadedAt: input.podDeliveredAt,
        podDelayHours: input.podDeliveredAt && input.deliveryCompletedAt ?
          Math.round((input.podDeliveredAt.getTime() - input.deliveryCompletedAt.getTime()) / 3600000) : undefined,
        incidentsCount: input.hadIncident ? 1 : 0,
        incidentsResolved: input.hadIncident && input.incidentResolutionTimeMinutes ? 1 : 0
      },
      bonusMalus: [],
      impactOnGlobalScore: 0
    });

    await scoreRecord.save();

    // Enregistrer l'événement
    await EventService.carrierScored(
      input.orderId,
      order.reference,
      input.carrierId,
      input.carrierName,
      finalScore
    );

    // Mettre à jour le score global du transporteur
    await this.updateGlobalScore(input.carrierId, input.carrierName);

    return scoreRecord;
  }

  /**
   * Calcule le détail de chaque critère (format IScoreCriteria)
   */
  private static calculateCriteria(input: ScoreInput): ICarrierOrderScore['criteria'] {
    return {
      pickupPunctuality: {
        name: 'Ponctualité enlèvement',
        weight: this.WEIGHTS.pickupPunctuality,
        score: this.calculatePunctualityScore(input.pickupScheduledAt, input.pickupActualAt)
      },
      deliveryPunctuality: {
        name: 'Ponctualité livraison',
        weight: this.WEIGHTS.deliveryPunctuality,
        score: this.calculatePunctualityScore(input.deliveryScheduledAt, input.deliveryActualAt)
      },
      appointmentRespect: {
        name: 'Respect des RDV',
        weight: this.WEIGHTS.appointmentRespect,
        score: this.calculateAppointmentScore(input.appointmentRespected)
      },
      trackingReactivity: {
        name: 'Réactivité tracking',
        weight: this.WEIGHTS.trackingReactivity,
        score: this.calculateTrackingScore(input.trackingResponses, input.trackingExpected)
      },
      podDelay: {
        name: 'Délai POD',
        weight: this.WEIGHTS.podDelay,
        score: this.calculatePodDelayScore(input.podDeliveredAt, input.deliveryCompletedAt)
      },
      incidentManagement: {
        name: 'Gestion incidents',
        weight: this.WEIGHTS.incidentManagement,
        score: this.calculateIncidentScore(input.hadIncident, input.incidentResolutionTimeMinutes)
      },
      communication: {
        name: 'Communication',
        weight: this.WEIGHTS.communication,
        score: input.communicationScore ?? 80
      }
    };
  }

  /**
   * Score de ponctualité (enlèvement ou livraison)
   */
  private static calculatePunctualityScore(scheduled?: Date, actual?: Date): number {
    if (!scheduled || !actual) return 80;

    const diffMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);

    if (diffMinutes <= 0) return 100;
    if (diffMinutes <= 15) return 90;
    if (diffMinutes <= 30) return 80;
    if (diffMinutes <= 60) return 60;
    if (diffMinutes <= 120) return 40;
    return 20;
  }

  /**
   * Score de respect des rendez-vous
   */
  private static calculateAppointmentScore(respected?: boolean): number {
    if (respected === undefined) return 80;
    return respected ? 100 : 30;
  }

  /**
   * Score de réactivité tracking
   */
  private static calculateTrackingScore(responses?: number, expected?: number): number {
    if (!expected || expected === 0) return 80;
    if (!responses) return 40;

    const ratio = responses / expected;
    if (ratio >= 1) return 100;
    if (ratio >= 0.8) return 80;
    if (ratio >= 0.5) return 60;
    return 40;
  }

  /**
   * Score délai POD (Proof of Delivery)
   */
  private static calculatePodDelayScore(podAt?: Date, deliveryAt?: Date): number {
    if (!podAt || !deliveryAt) return 80;

    const delayHours = (podAt.getTime() - deliveryAt.getTime()) / (1000 * 60 * 60);

    if (delayHours <= 2) return 100;
    if (delayHours <= 6) return 90;
    if (delayHours <= 24) return 80;
    if (delayHours <= 48) return 60;
    if (delayHours <= 72) return 40;
    return 20;
  }

  /**
   * Score gestion des incidents
   */
  private static calculateIncidentScore(hadIncident?: boolean, resolutionMinutes?: number): number {
    if (!hadIncident) return 100;

    if (!resolutionMinutes) return 30;

    if (resolutionMinutes <= 30) return 90;
    if (resolutionMinutes <= 60) return 80;
    if (resolutionMinutes <= 120) return 60;
    if (resolutionMinutes <= 240) return 40;
    return 20;
  }

  /**
   * Calcule le score final pondéré
   */
  private static calculateWeightedScore(criteria: ICarrierOrderScore['criteria']): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const criterion of Object.values(criteria)) {
      totalScore += criterion.score * criterion.weight;
      totalWeight += criterion.weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Met à jour le score global d'un transporteur
   */
  static async updateGlobalScore(carrierId: string, carrierName: string): Promise<ICarrierGlobalScore> {
    // Récupérer les 30 derniers scores du transporteur
    const recentScores = await CarrierOrderScore.find({ carrierId })
      .sort({ createdAt: -1 })
      .limit(30);

    if (recentScores.length === 0) {
      throw new Error('Aucun score pour ce transporteur');
    }

    // Calculer la moyenne
    const averageScore = Math.round(
      recentScores.reduce((sum, s) => sum + s.finalScore, 0) / recentScores.length
    );

    // Préparer les scores récents pour l'historique
    const recentScoresList = recentScores.map(s => ({
      orderId: s.orderId,
      score: s.finalScore,
      date: s.createdAt
    }));

    // Calculer la tendance
    const trend = this.calculateTrendValue(recentScores);

    // Mettre à jour ou créer le score global
    const globalScore = await CarrierGlobalScore.findOneAndUpdate(
      { carrierId },
      {
        $set: {
          carrierId,
          carrierName,
          globalScore: averageScore,
          recentScores: recentScoresList,
          'stats.totalTransports': recentScores.length,
          'stats.averageScore': averageScore,
          'stats.trendLastMonth': trend,
          lastCalculatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return globalScore;
  }

  /**
   * Calcule la tendance (amélioration/dégradation)
   */
  private static calculateTrendValue(scores: ICarrierOrderScore[]): number {
    if (scores.length < 5) return 0;

    const recent = scores.slice(0, 5);
    const previous = scores.slice(5, 10);

    if (previous.length === 0) return 0;

    const recentAvg = recent.reduce((sum, s) => sum + s.finalScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + s.finalScore, 0) / previous.length;

    return Math.round(recentAvg - previousAvg);
  }

  /**
   * Récupère le score global d'un transporteur
   */
  static async getCarrierGlobalScore(carrierId: string): Promise<ICarrierGlobalScore | null> {
    return CarrierGlobalScore.findOne({ carrierId });
  }

  /**
   * Récupère l'historique des scores d'un transporteur
   */
  static async getCarrierScoreHistory(
    carrierId: string,
    limit = 50
  ): Promise<ICarrierOrderScore[]> {
    return CarrierOrderScore.find({ carrierId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Récupère les meilleurs transporteurs pour un industriel
   */
  static async getTopCarriers(
    industrialId: string,
    limit = 10
  ): Promise<ICarrierGlobalScore[]> {
    // Récupérer les transporteurs qui ont travaillé avec cet industriel
    const carrierIds = await CarrierOrderScore.distinct('carrierId', { industrialId });

    return CarrierGlobalScore.find({ carrierId: { $in: carrierIds } })
      .sort({ globalScore: -1 })
      .limit(limit);
  }

  /**
   * Récupère les statistiques de scoring pour le dashboard
   */
  static async getScoringStats(industrialId: string): Promise<{
    totalCarriers: number;
    averageScore: number;
    topPerformer: ICarrierGlobalScore | null;
    lowPerformer: ICarrierGlobalScore | null;
    distribution: { range: string; count: number }[];
  }> {
    const carrierIds = await CarrierOrderScore.distinct('carrierId', { industrialId });
    const globalScores = await CarrierGlobalScore.find({ carrierId: { $in: carrierIds } });

    if (globalScores.length === 0) {
      return {
        totalCarriers: 0,
        averageScore: 0,
        topPerformer: null,
        lowPerformer: null,
        distribution: []
      };
    }

    const sorted = globalScores.sort((a, b) => b.globalScore - a.globalScore);

    // Calculer la distribution
    const distribution = [
      { range: '90-100', count: globalScores.filter(s => s.globalScore >= 90).length },
      { range: '80-89', count: globalScores.filter(s => s.globalScore >= 80 && s.globalScore < 90).length },
      { range: '70-79', count: globalScores.filter(s => s.globalScore >= 70 && s.globalScore < 80).length },
      { range: '60-69', count: globalScores.filter(s => s.globalScore >= 60 && s.globalScore < 70).length },
      { range: '<60', count: globalScores.filter(s => s.globalScore < 60).length }
    ];

    return {
      totalCarriers: globalScores.length,
      averageScore: Math.round(
        globalScores.reduce((sum, s) => sum + s.globalScore, 0) / globalScores.length
      ),
      topPerformer: sorted[0],
      lowPerformer: sorted[sorted.length - 1],
      distribution
    };
  }
}

export default ScoringService;

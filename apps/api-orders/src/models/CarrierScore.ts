/**
 * Modèle CarrierScore - Scoring transporteur SYMPHONI.A
 * Évalue la performance des transporteurs après chaque transport
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IScoreCriteria {
  name: string;
  weight: number;  // Poids dans le calcul (0-100)
  score: number;   // Score obtenu (0-100)
  comment?: string;
}

export interface ICarrierOrderScore extends Document {
  scoreId: string;
  orderId: string;
  orderReference: string;
  carrierId: string;
  carrierName: string;
  industrialId: string;

  // Scores détaillés par critère
  criteria: {
    // Ponctualité au chargement (±15 min = 100, ±30 min = 80, ±1h = 50, >1h = 0)
    pickupPunctuality: IScoreCriteria;
    // Ponctualité à la livraison
    deliveryPunctuality: IScoreCriteria;
    // Respect des RDV planifiés
    appointmentRespect: IScoreCriteria;
    // Réactivité tracking (mises à jour régulières)
    trackingReactivity: IScoreCriteria;
    // Délai de dépôt POD (BL/CMR)
    podDelay: IScoreCriteria;
    // Incidents déclarés
    incidentManagement: IScoreCriteria;
    // Qualité communication
    communication: IScoreCriteria;
  };

  // Score final (0-100)
  finalScore: number;

  // Données de calcul
  calculationData: {
    plannedPickupTime: Date;
    actualPickupTime?: Date;
    pickupDelayMinutes?: number;
    plannedDeliveryTime: Date;
    actualDeliveryTime?: Date;
    deliveryDelayMinutes?: number;
    trackingUpdatesCount: number;
    expectedTrackingUpdates: number;
    podUploadedAt?: Date;
    podDelayHours?: number;
    incidentsCount: number;
    incidentsResolved: number;
  };

  // Bonus/Malus
  bonusMalus: {
    type: 'bonus' | 'malus';
    value: number;
    reason: string;
  }[];

  // Commentaire industriel
  industrialFeedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    submittedAt: Date;
  };

  // Impact sur le score global du transporteur
  impactOnGlobalScore: number;

  createdAt: Date;
}

// Score global du transporteur (agrégé)
export interface ICarrierGlobalScore extends Document {
  carrierId: string;
  carrierName: string;

  // Score global actuel
  globalScore: number;

  // Historique des scores (moyenne mobile sur 30 derniers transports)
  recentScores: {
    orderId: string;
    score: number;
    date: Date;
  }[];

  // Statistiques
  stats: {
    totalTransports: number;
    averageScore: number;
    trendLastMonth: number;  // +/- variation
    acceptanceRate: number;
    punctualityRate: number;
    podDelayAverage: number;  // En heures
    incidentRate: number;
  };

  // Badges et certifications
  badges: {
    type: 'gold' | 'silver' | 'bronze' | 'verified' | 'preferred';
    earnedAt: Date;
    expiresAt?: Date;
  }[];

  // Seuils d'alerte
  alerts: {
    type: 'score_drop' | 'incident_spike' | 'pod_delay';
    triggeredAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
  }[];

  lastCalculatedAt: Date;
  updatedAt: Date;
}

const ScoreCriteriaSchema = new Schema<IScoreCriteria>({
  name: { type: String, required: true },
  weight: { type: Number, required: true },
  score: { type: Number, required: true },
  comment: String
}, { _id: false });

const CarrierOrderScoreSchema = new Schema<ICarrierOrderScore>({
  scoreId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  orderReference: { type: String, required: true },
  carrierId: { type: String, required: true, index: true },
  carrierName: { type: String, required: true },
  industrialId: { type: String, required: true, index: true },

  criteria: {
    pickupPunctuality: ScoreCriteriaSchema,
    deliveryPunctuality: ScoreCriteriaSchema,
    appointmentRespect: ScoreCriteriaSchema,
    trackingReactivity: ScoreCriteriaSchema,
    podDelay: ScoreCriteriaSchema,
    incidentManagement: ScoreCriteriaSchema,
    communication: ScoreCriteriaSchema
  },

  finalScore: { type: Number, required: true, index: true },

  calculationData: {
    plannedPickupTime: Date,
    actualPickupTime: Date,
    pickupDelayMinutes: Number,
    plannedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryDelayMinutes: Number,
    trackingUpdatesCount: Number,
    expectedTrackingUpdates: Number,
    podUploadedAt: Date,
    podDelayHours: Number,
    incidentsCount: { type: Number, default: 0 },
    incidentsResolved: { type: Number, default: 0 }
  },

  bonusMalus: [{
    type: { type: String, enum: ['bonus', 'malus'] },
    value: Number,
    reason: String
  }],

  industrialFeedback: {
    rating: { type: Number, enum: [1, 2, 3, 4, 5] },
    comment: String,
    submittedAt: Date
  },

  impactOnGlobalScore: Number
}, { timestamps: true });

const CarrierGlobalScoreSchema = new Schema<ICarrierGlobalScore>({
  carrierId: { type: String, required: true, unique: true, index: true },
  carrierName: { type: String, required: true },

  globalScore: { type: Number, default: 80, index: true },

  recentScores: [{
    orderId: String,
    score: Number,
    date: Date
  }],

  stats: {
    totalTransports: { type: Number, default: 0 },
    averageScore: { type: Number, default: 80 },
    trendLastMonth: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 100 },
    punctualityRate: { type: Number, default: 100 },
    podDelayAverage: { type: Number, default: 0 },
    incidentRate: { type: Number, default: 0 }
  },

  badges: [{
    type: { type: String, enum: ['gold', 'silver', 'bronze', 'verified', 'preferred'] },
    earnedAt: Date,
    expiresAt: Date
  }],

  alerts: [{
    type: { type: String, enum: ['score_drop', 'incident_spike', 'pod_delay'] },
    triggeredAt: Date,
    resolved: { type: Boolean, default: false },
    resolvedAt: Date
  }],

  lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const CarrierOrderScore = mongoose.model<ICarrierOrderScore>('CarrierOrderScore', CarrierOrderScoreSchema);
export const CarrierGlobalScore = mongoose.model<ICarrierGlobalScore>('CarrierGlobalScore', CarrierGlobalScoreSchema);

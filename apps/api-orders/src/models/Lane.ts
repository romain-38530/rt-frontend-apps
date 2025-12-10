/**
 * Modèle Lane - Lignes de transport SYMPHONI.A
 * Représente une ligne de transport avec ses transporteurs préférentiels
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ILaneCarrier {
  carrierId: string;
  carrierName: string;
  position: number;  // Position dans la cascade (1 = premier appelé)
  // Informations de contact pour les notifications
  contact?: {
    email?: string;
    phone?: string;
    contactName?: string;  // Nom du contact principal
  };
  priceGrid?: {
    basePrice: number;
    pricePerKm?: number;
    pricePerKg?: number;
    pricePerPalette?: number;
    currency: string;
  };
  constraints?: string[];  // ADR, HAYON, FRIGO, etc.
  minScore: number;  // Score minimum requis (0-100)
  responseDelayMinutes: number;  // Délai de réponse avant timeout (défaut: 120)
  isActive: boolean;
  lastUsed?: Date;
  successRate?: number;  // Taux d'acceptation
}

export interface ILane extends Document {
  laneId: string;
  industrialId: string;
  name: string;
  description?: string;

  // Critères géographiques
  origin: {
    city?: string;
    postalCodePrefix?: string;  // Ex: "75" pour Paris
    region?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
      radiusKm: number;  // Rayon de correspondance
    };
  };
  destination: {
    city?: string;
    postalCodePrefix?: string;
    region?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
      radiusKm: number;
    };
  };

  // Critères marchandise
  merchandiseTypes?: string[];  // Types de marchandises acceptées
  requiredConstraints?: string[];  // Contraintes obligatoires (ADR, FRIGO, etc.)

  // Chaîne de transporteurs
  carriers: ILaneCarrier[];

  // Configuration dispatch
  dispatchConfig: {
    autoDispatch: boolean;  // Dispatch automatique à la création
    escalateToAffretia: boolean;  // Escalade vers Affret.IA si tous refusent
    maxAttempts: number;  // Nombre max de transporteurs à contacter
    defaultResponseDelayMinutes: number;  // Délai par défaut
    notificationChannels: ('email' | 'sms' | 'portal')[];
  };

  // Statistiques
  stats: {
    totalOrders: number;
    successfulOrders: number;
    escalatedOrders: number;
    averageResponseTime: number;  // En minutes
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const LaneCarrierSchema = new Schema<ILaneCarrier>({
  carrierId: { type: String, required: true },
  carrierName: { type: String, required: true },
  position: { type: Number, required: true },
  contact: {
    email: String,
    phone: String,
    contactName: String
  },
  priceGrid: {
    basePrice: Number,
    pricePerKm: Number,
    pricePerKg: Number,
    pricePerPalette: Number,
    currency: { type: String, default: 'EUR' }
  },
  constraints: [String],
  minScore: { type: Number, default: 70 },
  responseDelayMinutes: { type: Number, default: 120 },
  isActive: { type: Boolean, default: true },
  lastUsed: Date,
  successRate: Number
}, { _id: false });

const LaneSchema = new Schema<ILane>({
  laneId: { type: String, required: true, unique: true, index: true },
  industrialId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,

  origin: {
    city: String,
    postalCodePrefix: String,
    region: String,
    country: { type: String, required: true, default: 'France' },
    coordinates: {
      latitude: Number,
      longitude: Number,
      radiusKm: { type: Number, default: 50 }
    }
  },
  destination: {
    city: String,
    postalCodePrefix: String,
    region: String,
    country: { type: String, required: true, default: 'France' },
    coordinates: {
      latitude: Number,
      longitude: Number,
      radiusKm: { type: Number, default: 50 }
    }
  },

  merchandiseTypes: [String],
  requiredConstraints: [String],

  carriers: [LaneCarrierSchema],

  dispatchConfig: {
    autoDispatch: { type: Boolean, default: true },
    escalateToAffretia: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 5 },
    defaultResponseDelayMinutes: { type: Number, default: 120 },
    notificationChannels: {
      type: [String],
      enum: ['email', 'sms', 'portal'],
      default: ['email', 'portal']
    }
  },

  stats: {
    totalOrders: { type: Number, default: 0 },
    successfulOrders: { type: Number, default: 0 },
    escalatedOrders: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  },

  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// Indexes
LaneSchema.index({ industrialId: 1, isActive: 1 });
LaneSchema.index({ 'origin.postalCodePrefix': 1, 'destination.postalCodePrefix': 1 });
LaneSchema.index({ 'origin.city': 1, 'destination.city': 1 });

export default mongoose.model<ILane>('Lane', LaneSchema);

/**
 * Model: CarrierProposal
 * Proposition d'un transporteur pour une session AFFRET.IA
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICarrierProposal extends Document {
  sessionId: string;
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;

  responseType: 'accept' | 'counter' | 'reject' | 'no_response';

  // Prix
  proposedPrice: number;
  originalEstimate: number;
  priceVariation: number;
  currency: string;

  // Détails
  pickupDate: Date;
  deliveryDate: Date;
  vehicle?: {
    type: string;
    registration?: string;
    driver?: string;
    phone?: string;
  };
  conditions?: string;

  // Scoring IA
  score: number;
  scoreBreakdown: {
    price: number;
    quality: number;
    distance: number;
    historical: number;
    reactivity: number;
    vigilance: number;
  };

  // Metadata
  respondedAt: Date;
  responseTime: number; // seconds
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'negotiating';

  // Négociation
  negotiationHistory?: Array<{
    type: 'counter' | 'message';
    from: 'carrier' | 'shipper';
    price?: number;
    message?: string;
    timestamp: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const CarrierProposalSchema = new Schema<ICarrierProposal>({
  sessionId: { type: String, required: true, index: true },
  carrierId: { type: String, required: true, index: true },
  carrierName: { type: String, required: true },
  carrierLogo: String,

  responseType: {
    type: String,
    enum: ['accept', 'counter', 'reject', 'no_response'],
    default: 'no_response'
  },

  proposedPrice: { type: Number, required: true },
  originalEstimate: { type: Number, required: true },
  priceVariation: Number,
  currency: { type: String, default: 'EUR' },

  pickupDate: Date,
  deliveryDate: Date,
  vehicle: {
    type: { type: String },
    registration: String,
    driver: String,
    phone: String
  },
  conditions: String,

  score: { type: Number, default: 0 },
  scoreBreakdown: {
    price: { type: Number, default: 0 },
    quality: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    historical: { type: Number, default: 0 },
    reactivity: { type: Number, default: 0 },
    vigilance: { type: Number, default: 0 }
  },

  respondedAt: Date,
  responseTime: Number,
  expiresAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'negotiating'],
    default: 'pending'
  },

  negotiationHistory: [{
    type: { type: String, enum: ['counter', 'message'] },
    from: { type: String, enum: ['carrier', 'shipper'] },
    price: Number,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
CarrierProposalSchema.index({ sessionId: 1, status: 1 });
CarrierProposalSchema.index({ carrierId: 1, createdAt: -1 });
CarrierProposalSchema.index({ score: -1 });

// Pre-save: calculer variation prix
CarrierProposalSchema.pre('save', function(next) {
  if (this.proposedPrice && this.originalEstimate) {
    this.priceVariation = ((this.proposedPrice - this.originalEstimate) / this.originalEstimate) * 100;
  }
  next();
});

// Méthodes statiques
CarrierProposalSchema.statics.findBySession = function(sessionId: string) {
  return this.find({ sessionId }).sort({ score: -1 });
};

CarrierProposalSchema.statics.getBestProposal = function(sessionId: string) {
  return this.findOne({ sessionId, status: { $in: ['pending', 'accepted'] } }).sort({ score: -1 });
};

export default mongoose.model<ICarrierProposal>('CarrierProposal', CarrierProposalSchema);

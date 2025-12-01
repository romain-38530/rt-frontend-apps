/**
 * Model: StorageOffer
 * Offre/Proposition d'un logisticien pour un besoin de stockage
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IStorageOffer extends Document {
  needId: string;
  needReference: string;

  // Logisticien
  logisticianId: string;
  logisticianName: string;
  logisticianType: 'subscriber' | 'guest';
  siteId: string;
  siteName: string;

  // Proposition
  proposedCapacity: {
    unit: string;
    quantity: number;
  };
  proposedStartDate: Date;
  proposedEndDate?: Date;

  // Tarification
  pricing: {
    pricePerUnit: number;
    unit: string;
    currency: string;
    setupFees?: number;
    handlingFees?: number;
    minimumBilling?: number;
    paymentTerms?: string;
  };

  // Services inclus
  includedServices: string[];
  additionalServices?: {
    name: string;
    price: number;
    description?: string;
  }[];

  // Conditions
  conditions?: {
    minCommitment?: string;
    cancellationPolicy?: string;
    insuranceIncluded?: boolean;
    insuranceDetails?: string;
  };

  // Documents
  documents?: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }[];

  // Message/commentaire
  message?: string;

  // Scoring IA
  aiScoring?: {
    globalScore: number;
    priceScore: number;
    locationScore: number;
    capacityScore: number;
    serviceScore: number;
    reliabilityScore: number;
    certificationScore: number;
    computedAt: Date;
    factors: {
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
      details?: string;
    }[];
  };

  // Statut
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'counter_offer';

  // Contre-offre
  counterOffer?: {
    requestedChanges: string;
    newPricing?: {
      pricePerUnit: number;
      unit: string;
      currency: string;
    };
    newStartDate?: Date;
    newEndDate?: Date;
    message?: string;
    createdAt: Date;
    status: 'pending' | 'accepted' | 'rejected';
  };

  // Historique
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: string;
    reason?: string;
  }[];

  // Dates
  submittedAt: Date;
  expiresAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const StorageOfferSchema = new Schema<IStorageOffer>({
  needId: { type: String, required: true, index: true },
  needReference: { type: String, required: true },

  logisticianId: { type: String, required: true, index: true },
  logisticianName: { type: String, required: true },
  logisticianType: { type: String, enum: ['subscriber', 'guest'], required: true },
  siteId: { type: String, required: true },
  siteName: { type: String, required: true },

  proposedCapacity: {
    unit: { type: String, enum: ['sqm', 'pallets', 'linear_meters', 'cbm'], required: true },
    quantity: { type: Number, required: true }
  },
  proposedStartDate: { type: Date, required: true },
  proposedEndDate: Date,

  pricing: {
    pricePerUnit: { type: Number, required: true },
    unit: { type: String, required: true },
    currency: { type: String, default: 'EUR' },
    setupFees: Number,
    handlingFees: Number,
    minimumBilling: Number,
    paymentTerms: String
  },

  includedServices: [String],
  additionalServices: [{
    name: String,
    price: Number,
    description: String
  }],

  conditions: {
    minCommitment: String,
    cancellationPolicy: String,
    insuranceIncluded: Boolean,
    insuranceDetails: String
  },

  documents: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: Date
  }],

  message: String,

  aiScoring: {
    globalScore: Number,
    priceScore: Number,
    locationScore: Number,
    capacityScore: Number,
    serviceScore: Number,
    reliabilityScore: Number,
    certificationScore: Number,
    computedAt: Date,
    factors: [{
      factor: String,
      impact: { type: String, enum: ['positive', 'negative', 'neutral'] },
      weight: Number,
      details: String
    }]
  },

  status: {
    type: String,
    enum: ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'expired', 'counter_offer'],
    default: 'submitted',
    index: true
  },

  counterOffer: {
    requestedChanges: String,
    newPricing: {
      pricePerUnit: Number,
      unit: String,
      currency: String
    },
    newStartDate: Date,
    newEndDate: Date,
    message: String,
    createdAt: Date,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'] }
  },

  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    reason: String
  }],

  submittedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  reviewedAt: Date,
  decidedAt: Date
}, {
  timestamps: true
});

// Index composites
StorageOfferSchema.index({ needId: 1, status: 1 });
StorageOfferSchema.index({ logisticianId: 1, status: 1 });
StorageOfferSchema.index({ 'aiScoring.globalScore': -1 });
StorageOfferSchema.index({ submittedAt: -1 });

export default mongoose.model<IStorageOffer>('StorageOffer', StorageOfferSchema);

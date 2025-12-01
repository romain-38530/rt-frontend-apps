/**
 * Model: LogisticianSubscription
 * Abonnement d'un logisticien à la Bourse de Stockage
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ILogisticianSubscription extends Document {
  logisticianId: string;
  logisticianName: string;

  // Type d'abonnement
  tier: 'guest' | 'subscriber' | 'premium';

  // Période
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;

  // Tarification
  pricing: {
    monthlyFee: number;
    annualFee?: number;
    currency: string;
    billingCycle: 'monthly' | 'annually';
    commissionRate?: number; // % sur les contrats
  };

  // Limites selon le tier
  limits: {
    maxSites: number;
    maxActiveOffers: number;
    maxMonthlyResponses: number;
    apiAccess: boolean;
    prioritySupport: boolean;
    featuredListing: boolean;
    analyticsAccess: 'basic' | 'advanced' | 'full';
  };

  // Usage actuel
  currentUsage: {
    activeSites: number;
    activeOffers: number;
    monthlyResponses: number;
    lastResetDate: Date;
  };

  // Fonctionnalités
  features: {
    realTimeNotifications: boolean;
    aiRecommendations: boolean;
    customBranding: boolean;
    dedicatedAccount: boolean;
    wmsIntegration: boolean;
    bulkOperations: boolean;
    exportReports: boolean;
  };

  // Paiement
  payment?: {
    method: 'card' | 'sepa' | 'invoice';
    lastFourDigits?: string;
    expiryDate?: string;
    billingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };

  // Historique de facturation
  billingHistory?: {
    invoiceRef: string;
    amount: number;
    period: string;
    issuedAt: Date;
    paidAt?: Date;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
  }[];

  // Statut
  status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';

  // Raison si suspendu/annulé
  statusReason?: string;

  // Auto-renouvellement
  autoRenew: boolean;

  // Historique des changements
  tierHistory?: {
    fromTier: string;
    toTier: string;
    changedAt: Date;
    reason?: string;
  }[];

  // Métriques
  metrics?: {
    totalContractsWon: number;
    totalRevenue: number;
    avgResponseTime: number; // en heures
    successRate: number; // %
    rating: number; // 0-5
    reviewCount: number;
  };

  // Contact principal
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };

  // Notes admin
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LogisticianSubscriptionSchema = new Schema<ILogisticianSubscription>({
  logisticianId: { type: String, required: true, unique: true },
  logisticianName: { type: String, required: true },

  tier: {
    type: String,
    enum: ['guest', 'subscriber', 'premium'],
    default: 'guest',
    index: true
  },

  startDate: { type: Date, required: true, default: Date.now },
  endDate: Date,
  trialEndDate: Date,

  pricing: {
    monthlyFee: { type: Number, default: 0 },
    annualFee: Number,
    currency: { type: String, default: 'EUR' },
    billingCycle: { type: String, enum: ['monthly', 'annually'], default: 'monthly' },
    commissionRate: Number
  },

  limits: {
    maxSites: { type: Number, default: 1 },
    maxActiveOffers: { type: Number, default: 5 },
    maxMonthlyResponses: { type: Number, default: 10 },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    featuredListing: { type: Boolean, default: false },
    analyticsAccess: { type: String, enum: ['basic', 'advanced', 'full'], default: 'basic' }
  },

  currentUsage: {
    activeSites: { type: Number, default: 0 },
    activeOffers: { type: Number, default: 0 },
    monthlyResponses: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },

  features: {
    realTimeNotifications: { type: Boolean, default: true },
    aiRecommendations: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    dedicatedAccount: { type: Boolean, default: false },
    wmsIntegration: { type: Boolean, default: false },
    bulkOperations: { type: Boolean, default: false },
    exportReports: { type: Boolean, default: false }
  },

  payment: {
    method: { type: String, enum: ['card', 'sepa', 'invoice'] },
    lastFourDigits: String,
    expiryDate: String,
    billingAddress: {
      street: String,
      city: String,
      postalCode: String,
      country: String
    }
  },

  billingHistory: [{
    invoiceRef: String,
    amount: Number,
    period: String,
    issuedAt: Date,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] }
  }],

  status: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'],
    default: 'trial',
    index: true
  },

  statusReason: String,
  autoRenew: { type: Boolean, default: true },

  tierHistory: [{
    fromTier: String,
    toTier: String,
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],

  metrics: {
    totalContractsWon: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 }
  },

  primaryContact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    role: String
  },

  adminNotes: String
}, {
  timestamps: true
});

// Définir les limites par défaut selon le tier
LogisticianSubscriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('tier')) {
    switch (this.tier) {
      case 'guest':
        this.limits = {
          maxSites: 1,
          maxActiveOffers: 5,
          maxMonthlyResponses: 10,
          apiAccess: false,
          prioritySupport: false,
          featuredListing: false,
          analyticsAccess: 'basic'
        };
        this.features = {
          realTimeNotifications: true,
          aiRecommendations: false,
          customBranding: false,
          dedicatedAccount: false,
          wmsIntegration: false,
          bulkOperations: false,
          exportReports: false
        };
        this.pricing.monthlyFee = 0;
        this.pricing.commissionRate = 5; // 5% sur contrats
        break;

      case 'subscriber':
        this.limits = {
          maxSites: 10,
          maxActiveOffers: 50,
          maxMonthlyResponses: 100,
          apiAccess: true,
          prioritySupport: false,
          featuredListing: true,
          analyticsAccess: 'advanced'
        };
        this.features = {
          realTimeNotifications: true,
          aiRecommendations: true,
          customBranding: false,
          dedicatedAccount: false,
          wmsIntegration: true,
          bulkOperations: true,
          exportReports: true
        };
        this.pricing.monthlyFee = 199;
        this.pricing.commissionRate = 2; // 2% sur contrats
        break;

      case 'premium':
        this.limits = {
          maxSites: -1, // Illimité
          maxActiveOffers: -1,
          maxMonthlyResponses: -1,
          apiAccess: true,
          prioritySupport: true,
          featuredListing: true,
          analyticsAccess: 'full'
        };
        this.features = {
          realTimeNotifications: true,
          aiRecommendations: true,
          customBranding: true,
          dedicatedAccount: true,
          wmsIntegration: true,
          bulkOperations: true,
          exportReports: true
        };
        this.pricing.monthlyFee = 499;
        this.pricing.commissionRate = 0; // Pas de commission
        break;
    }
  }
  next();
});

// Index
LogisticianSubscriptionSchema.index({ status: 1, endDate: 1 });
LogisticianSubscriptionSchema.index({ 'metrics.rating': -1 });

export default mongoose.model<ILogisticianSubscription>('LogisticianSubscription', LogisticianSubscriptionSchema);

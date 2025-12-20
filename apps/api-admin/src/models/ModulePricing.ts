/**
 * ModulePricing - Tarification des modules
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IModulePricing extends Document {
  moduleCode: string;
  moduleName: string;
  description: string;
  category: 'core' | 'transport' | 'logistics' | 'finance' | 'analytics' | 'integration' | 'addon';

  // Tarification
  pricing: {
    type: 'flat' | 'per_user' | 'per_transaction' | 'tiered';
    basePrice: number; // Prix mensuel de base
    setupFee: number; // Frais d'installation
    currency: string;

    // Pour tarification par utilisateur
    pricePerUser?: number;
    includedUsers?: number;

    // Pour tarification par transaction
    pricePerTransaction?: number;
    includedTransactions?: number;

    // Pour tarification par paliers
    tiers?: {
      upTo: number;
      price: number;
    }[];
  };

  // Options d'installation
  installation: {
    estimatedHours: number; // Temps estime d'installation
    requiresOnsite: boolean; // Necessite intervention sur site
    complexity: 'simple' | 'medium' | 'complex';
  };

  // Metadata
  isActive: boolean;
  displayOrder: number;
  features: string[];
  dependencies: string[]; // Modules requis

  createdAt: Date;
  updatedAt: Date;
}

const ModulePricingSchema = new Schema<IModulePricing>({
  moduleCode: { type: String, required: true, unique: true },
  moduleName: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['core', 'transport', 'logistics', 'finance', 'analytics', 'integration', 'addon'],
    default: 'addon'
  },

  pricing: {
    type: { type: String, enum: ['flat', 'per_user', 'per_transaction', 'tiered'], default: 'flat' },
    basePrice: { type: Number, required: true, default: 0 },
    setupFee: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    pricePerUser: Number,
    includedUsers: Number,
    pricePerTransaction: Number,
    includedTransactions: Number,
    tiers: [{
      upTo: Number,
      price: Number
    }]
  },

  installation: {
    estimatedHours: { type: Number, default: 2 },
    requiresOnsite: { type: Boolean, default: false },
    complexity: { type: String, enum: ['simple', 'medium', 'complex'], default: 'simple' }
  },

  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  features: [{ type: String }],
  dependencies: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<IModulePricing>('ModulePricing', ModulePricingSchema);

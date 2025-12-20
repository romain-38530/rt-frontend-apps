/**
 * Promotion - Offres promotionnelles
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
  promoCode: string;
  promoName: string;
  description: string;

  // Type de promotion
  type: 'percentage' | 'fixed_amount' | 'free_months' | 'free_setup' | 'bundle_discount';

  // Valeur de la promotion
  value: {
    percentage?: number; // % de reduction
    fixedAmount?: number; // Montant fixe
    freeMonths?: number; // Mois gratuits
    currency?: string;
  };

  // Applicabilite
  applicableTo: {
    type: 'all' | 'modules' | 'packs' | 'specific';
    moduleCodes?: string[]; // Si specific ou modules
    packCodes?: string[]; // Si specific ou packs
  };

  // Conditions
  conditions: {
    minContractMonths?: number; // Engagement minimum
    minAmount?: number; // Montant minimum de commande
    newCustomersOnly?: boolean;
    maxUsesTotal?: number;
    maxUsesPerCustomer?: number;
    requiresCommercialCode?: boolean; // Necessite code commercial
    commercialCodes?: string[]; // Codes commerciaux autorises
  };

  // Validite
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;

  // Suivi
  usageCount: number;
  totalDiscountGiven: number;

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>({
  promoCode: { type: String, required: true, unique: true, uppercase: true },
  promoName: { type: String, required: true },
  description: { type: String },

  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_months', 'free_setup', 'bundle_discount'],
    required: true
  },

  value: {
    percentage: Number,
    fixedAmount: Number,
    freeMonths: Number,
    currency: { type: String, default: 'EUR' }
  },

  applicableTo: {
    type: { type: String, enum: ['all', 'modules', 'packs', 'specific'], default: 'all' },
    moduleCodes: [String],
    packCodes: [String]
  },

  conditions: {
    minContractMonths: Number,
    minAmount: Number,
    newCustomersOnly: { type: Boolean, default: false },
    maxUsesTotal: Number,
    maxUsesPerCustomer: { type: Number, default: 1 },
    requiresCommercialCode: { type: Boolean, default: false },
    commercialCodes: [String]
  },

  isActive: { type: Boolean, default: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },

  usageCount: { type: Number, default: 0 },
  totalDiscountGiven: { type: Number, default: 0 },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Index pour recherche rapide par code
PromotionSchema.index({ promoCode: 1 });
PromotionSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);

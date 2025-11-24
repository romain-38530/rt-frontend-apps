/**
 * Pricing Model for RT Technologie Account Types
 *
 * This model stores dynamic pricing information for all account types,
 * including base prices, variants (invited vs premium), promotions, and price history.
 *
 * Service: subscriptions-contracts v2.4.0
 * Collection: pricing
 */

const mongoose = require('mongoose');

/**
 * Variant Schema
 * Represents different pricing variants for an account type
 * Example: TRANSPORTEUR_INVITE (free) vs TRANSPORTEUR_PREMIUM (499€)
 */
const VariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    description: 'Variant name (e.g., TRANSPORTEUR_INVITE, TRANSPORTEUR_PREMIUM)'
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    description: 'Price in euros for this variant'
  },
  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP'],
    description: 'Currency code'
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Conditions required for this variant (e.g., { invitedBy: "EXPEDITEUR" })'
  },
  features: {
    type: [String],
    default: [],
    description: 'Additional features included in this variant'
  },
  description: {
    type: String,
    description: 'Human-readable description of this variant'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this variant is currently available'
  }
}, { _id: false });

/**
 * Promotion Schema
 * Represents promotional discounts with codes and validity periods
 */
const PromotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    description: 'Promotion code (e.g., LAUNCH2025, SUMMER50)'
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    description: 'Type of discount'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    description: 'Discount value (percentage or fixed amount in euros)'
  },
  validFrom: {
    type: Date,
    required: true,
    description: 'Start date of promotion validity'
  },
  validUntil: {
    type: Date,
    required: true,
    description: 'End date of promotion validity'
  },
  maxUses: {
    type: Number,
    default: null,
    description: 'Maximum number of times this promo can be used (null = unlimited)'
  },
  usedCount: {
    type: Number,
    default: 0,
    description: 'Number of times this promo has been used'
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Additional conditions for promotion eligibility'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this promotion is currently active'
  }
}, { _id: false });

/**
 * Price History Entry Schema
 * Tracks all price changes for audit and reporting
 */
const PriceHistorySchema = new mongoose.Schema({
  previousPrice: {
    type: Number,
    required: true,
    description: 'Previous price before change'
  },
  newPrice: {
    type: Number,
    required: true,
    description: 'New price after change'
  },
  changedAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp of price change'
  },
  changedBy: {
    type: String,
    description: 'Admin user who made the change'
  },
  reason: {
    type: String,
    description: 'Reason for price change'
  }
}, { _id: false });

/**
 * Main Pricing Schema
 */
const PricingSchema = new mongoose.Schema({
  accountType: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    enum: [
      'TRANSPORTEUR',
      'EXPEDITEUR',
      'PLATEFORME_LOGISTIQUE',
      'COMMISSIONNAIRE',
      'COMMISSIONNAIRE_AGRÉÉ',
      'DOUANE'
    ],
    description: 'Account type identifier (must match backend account types)'
  },
  displayName: {
    type: String,
    required: true,
    description: 'Human-readable display name (e.g., "Transporteur", "Industriel")'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    description: 'Base price in euros for this account type'
  },
  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP'],
    description: 'Currency code'
  },
  billingPeriod: {
    type: String,
    default: 'monthly',
    enum: ['monthly', 'yearly', 'one-time'],
    description: 'Billing frequency'
  },
  variants: {
    type: [VariantSchema],
    default: [],
    description: 'Price variants (e.g., invited vs premium versions)'
  },
  promotions: {
    type: [PromotionSchema],
    default: [],
    description: 'Active promotions for this account type'
  },
  priceHistory: {
    type: [PriceHistorySchema],
    default: [],
    description: 'History of price changes'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this pricing is currently active'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Additional metadata for pricing configuration'
  }
}, {
  timestamps: true,
  collection: 'pricing'
});

// Indexes for efficient querying
PricingSchema.index({ accountType: 1 });
PricingSchema.index({ isActive: 1 });
PricingSchema.index({ 'variants.name': 1 });
PricingSchema.index({ 'promotions.code': 1 });

// Virtual for current active promotions
PricingSchema.virtual('activePromotions').get(function() {
  const now = new Date();
  return this.promotions.filter(promo =>
    promo.isActive &&
    promo.validFrom <= now &&
    promo.validUntil >= now &&
    (promo.maxUses === null || promo.usedCount < promo.maxUses)
  );
});

// Method to calculate final price with conditions
PricingSchema.methods.calculatePrice = function(conditions = {}, promoCode = null) {
  let finalPrice = this.basePrice;
  let appliedVariant = null;
  let appliedPromo = null;

  // Check if any variant matches the conditions
  for (const variant of this.variants) {
    if (!variant.isActive) continue;

    // Check if all variant conditions are met
    const conditionsMet = Object.entries(variant.conditions || {}).every(([key, value]) => {
      return conditions[key] === value;
    });

    if (conditionsMet) {
      finalPrice = variant.price;
      appliedVariant = variant;
      break; // Use first matching variant
    }
  }

  // Apply promotion if provided
  if (promoCode) {
    const now = new Date();
    const promo = this.promotions.find(p =>
      p.code === promoCode.toUpperCase() &&
      p.isActive &&
      p.validFrom <= now &&
      p.validUntil >= now &&
      (p.maxUses === null || p.usedCount < p.maxUses)
    );

    if (promo) {
      if (promo.discountType === 'percentage') {
        finalPrice = finalPrice * (1 - promo.discountValue / 100);
      } else if (promo.discountType === 'fixed') {
        finalPrice = Math.max(0, finalPrice - promo.discountValue);
      }
      appliedPromo = promo;
    }
  }

  return {
    originalPrice: this.basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
    currency: this.currency,
    billingPeriod: this.billingPeriod,
    appliedVariant: appliedVariant ? {
      name: appliedVariant.name,
      price: appliedVariant.price,
      features: appliedVariant.features
    } : null,
    appliedPromo: appliedPromo ? {
      code: appliedPromo.code,
      discountType: appliedPromo.discountType,
      discountValue: appliedPromo.discountValue
    } : null
  };
};

// Method to update price with history tracking
PricingSchema.methods.updatePrice = function(newPrice, changedBy, reason) {
  if (this.basePrice !== newPrice) {
    this.priceHistory.push({
      previousPrice: this.basePrice,
      newPrice: newPrice,
      changedAt: new Date(),
      changedBy: changedBy,
      reason: reason
    });
    this.basePrice = newPrice;
  }
  return this.save();
};

// Method to add or update variant
PricingSchema.methods.updateVariant = function(variantName, variantData) {
  const existingIndex = this.variants.findIndex(v => v.name === variantName);

  if (existingIndex >= 0) {
    // Update existing variant
    this.variants[existingIndex] = { ...this.variants[existingIndex].toObject(), ...variantData };
  } else {
    // Add new variant
    this.variants.push({ name: variantName, ...variantData });
  }

  return this.save();
};

// Method to add promotion
PricingSchema.methods.addPromotion = function(promotionData) {
  // Check if promotion code already exists
  const existingPromo = this.promotions.find(p => p.code === promotionData.code.toUpperCase());

  if (existingPromo) {
    throw new Error(`Promotion code ${promotionData.code} already exists`);
  }

  this.promotions.push({
    ...promotionData,
    code: promotionData.code.toUpperCase()
  });

  return this.save();
};

// Method to increment promotion usage
PricingSchema.methods.incrementPromoUsage = function(promoCode) {
  const promo = this.promotions.find(p => p.code === promoCode.toUpperCase());

  if (promo) {
    promo.usedCount++;
    return this.save();
  }

  throw new Error(`Promotion code ${promoCode} not found`);
};

// Ensure virtuals are included in JSON output
PricingSchema.set('toJSON', { virtuals: true });
PricingSchema.set('toObject', { virtuals: true });

const Pricing = mongoose.model('Pricing', PricingSchema);

module.exports = Pricing;

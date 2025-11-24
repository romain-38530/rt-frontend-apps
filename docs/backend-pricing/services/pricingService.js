/**
 * Pricing Service for RT Technologie
 *
 * Business logic for managing dynamic pricing, calculating final prices,
 * handling promotions, and tracking price history.
 *
 * Service: subscriptions-contracts v2.4.0
 */

const Pricing = require('../models/Pricing');

class PricingService {
  /**
   * Get all active pricing configurations
   * @returns {Promise<Array>} Array of pricing documents
   */
  async getAllPricing() {
    try {
      const pricing = await Pricing.find({ isActive: true }).sort({ accountType: 1 });
      return pricing;
    } catch (error) {
      throw new Error(`Failed to fetch pricing: ${error.message}`);
    }
  }

  /**
   * Get pricing for a specific account type
   * @param {string} accountType - Account type identifier (e.g., TRANSPORTEUR)
   * @returns {Promise<Object>} Pricing document
   */
  async getPricingByAccountType(accountType) {
    try {
      const pricing = await Pricing.findOne({
        accountType: accountType.toUpperCase(),
        isActive: true
      });

      if (!pricing) {
        throw new Error(`Pricing not found for account type: ${accountType}`);
      }

      return pricing;
    } catch (error) {
      throw new Error(`Failed to fetch pricing for ${accountType}: ${error.message}`);
    }
  }

  /**
   * Calculate final price for an account type with conditions and promo code
   * @param {string} accountType - Account type identifier
   * @param {Object} conditions - Conditions object (e.g., { invitedBy: 'EXPEDITEUR' })
   * @param {string} promoCode - Optional promotion code
   * @returns {Promise<Object>} Price calculation result
   */
  async calculatePrice(accountType, conditions = {}, promoCode = null) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Use the model's calculatePrice method
      const result = pricing.calculatePrice(conditions, promoCode);

      // If a promo was applied, increment its usage counter
      if (result.appliedPromo && promoCode) {
        // Note: This increments immediately. In production, you might want to
        // increment only after successful payment/subscription creation
        await pricing.incrementPromoUsage(promoCode);
      }

      return {
        accountType: pricing.accountType,
        displayName: pricing.displayName,
        ...result
      };
    } catch (error) {
      throw new Error(`Failed to calculate price: ${error.message}`);
    }
  }

  /**
   * Calculate prices for multiple account types (for comparison)
   * @param {Array<string>} accountTypes - Array of account type identifiers
   * @param {Object} conditions - Conditions object
   * @returns {Promise<Array>} Array of price calculations
   */
  async calculateMultiplePrices(accountTypes, conditions = {}) {
    try {
      const results = await Promise.all(
        accountTypes.map(async (type) => {
          try {
            return await this.calculatePrice(type, conditions);
          } catch (error) {
            // Return error info if pricing not found for this type
            return {
              accountType: type,
              error: error.message
            };
          }
        })
      );

      return results;
    } catch (error) {
      throw new Error(`Failed to calculate multiple prices: ${error.message}`);
    }
  }

  /**
   * Create or update pricing for an account type
   * @param {string} accountType - Account type identifier
   * @param {Object} pricingData - Pricing data
   * @returns {Promise<Object>} Created/updated pricing document
   */
  async createOrUpdatePricing(accountType, pricingData) {
    try {
      const existing = await Pricing.findOne({ accountType: accountType.toUpperCase() });

      if (existing) {
        // Update existing pricing
        Object.assign(existing, pricingData);
        await existing.save();
        return existing;
      } else {
        // Create new pricing
        const pricing = new Pricing({
          accountType: accountType.toUpperCase(),
          ...pricingData
        });
        await pricing.save();
        return pricing;
      }
    } catch (error) {
      throw new Error(`Failed to create/update pricing: ${error.message}`);
    }
  }

  /**
   * Update base price for an account type (with history tracking)
   * @param {string} accountType - Account type identifier
   * @param {number} newPrice - New price value
   * @param {string} changedBy - Admin user who made the change
   * @param {string} reason - Reason for price change
   * @returns {Promise<Object>} Updated pricing document
   */
  async updateBasePrice(accountType, newPrice, changedBy, reason) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Validate new price
      if (typeof newPrice !== 'number' || newPrice < 0) {
        throw new Error('Invalid price value');
      }

      // Use model's updatePrice method (includes history tracking)
      await pricing.updatePrice(newPrice, changedBy, reason);

      return pricing;
    } catch (error) {
      throw new Error(`Failed to update price: ${error.message}`);
    }
  }

  /**
   * Add or update a pricing variant
   * @param {string} accountType - Account type identifier
   * @param {string} variantName - Variant name (e.g., TRANSPORTEUR_INVITE)
   * @param {Object} variantData - Variant data
   * @returns {Promise<Object>} Updated pricing document
   */
  async updateVariant(accountType, variantName, variantData) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Validate variant data
      if (!variantData.price || typeof variantData.price !== 'number') {
        throw new Error('Variant must have a valid price');
      }

      // Use model's updateVariant method
      await pricing.updateVariant(variantName, variantData);

      return pricing;
    } catch (error) {
      throw new Error(`Failed to update variant: ${error.message}`);
    }
  }

  /**
   * Add a promotion to an account type
   * @param {string} accountType - Account type identifier
   * @param {Object} promotionData - Promotion data
   * @returns {Promise<Object>} Updated pricing document
   */
  async addPromotion(accountType, promotionData) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Validate promotion data
      this.validatePromotionData(promotionData);

      // Use model's addPromotion method
      await pricing.addPromotion(promotionData);

      return pricing;
    } catch (error) {
      throw new Error(`Failed to add promotion: ${error.message}`);
    }
  }

  /**
   * Validate a promotion code for an account type
   * @param {string} accountType - Account type identifier
   * @param {string} promoCode - Promotion code to validate
   * @returns {Promise<Object>} Validation result with promo details
   */
  async validatePromoCode(accountType, promoCode) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      const now = new Date();
      const promo = pricing.promotions.find(p =>
        p.code === promoCode.toUpperCase() &&
        p.isActive &&
        p.validFrom <= now &&
        p.validUntil >= now &&
        (p.maxUses === null || p.usedCount < p.maxUses)
      );

      if (!promo) {
        return {
          valid: false,
          message: 'Invalid or expired promotion code'
        };
      }

      return {
        valid: true,
        promo: {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          validUntil: promo.validUntil,
          remainingUses: promo.maxUses ? promo.maxUses - promo.usedCount : null
        }
      };
    } catch (error) {
      throw new Error(`Failed to validate promo code: ${error.message}`);
    }
  }

  /**
   * Deactivate a promotion
   * @param {string} accountType - Account type identifier
   * @param {string} promoCode - Promotion code to deactivate
   * @returns {Promise<Object>} Updated pricing document
   */
  async deactivatePromotion(accountType, promoCode) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      const promo = pricing.promotions.find(p => p.code === promoCode.toUpperCase());

      if (!promo) {
        throw new Error(`Promotion code ${promoCode} not found`);
      }

      promo.isActive = false;
      await pricing.save();

      return pricing;
    } catch (error) {
      throw new Error(`Failed to deactivate promotion: ${error.message}`);
    }
  }

  /**
   * Get price history for an account type
   * @param {string} accountType - Account type identifier
   * @param {number} limit - Maximum number of history entries to return
   * @returns {Promise<Array>} Price history entries
   */
  async getPriceHistory(accountType, limit = 50) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Return most recent entries first
      const history = pricing.priceHistory
        .sort((a, b) => b.changedAt - a.changedAt)
        .slice(0, limit);

      return {
        accountType: pricing.accountType,
        displayName: pricing.displayName,
        currentPrice: pricing.basePrice,
        history: history
      };
    } catch (error) {
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }
  }

  /**
   * Get all active promotions across all account types
   * @returns {Promise<Array>} Array of active promotions
   */
  async getAllActivePromotions() {
    try {
      const allPricing = await this.getAllPricing();
      const now = new Date();

      const activePromotions = [];

      for (const pricing of allPricing) {
        const promos = pricing.promotions.filter(p =>
          p.isActive &&
          p.validFrom <= now &&
          p.validUntil >= now &&
          (p.maxUses === null || p.usedCount < p.maxUses)
        );

        for (const promo of promos) {
          activePromotions.push({
            accountType: pricing.accountType,
            displayName: pricing.displayName,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            validFrom: promo.validFrom,
            validUntil: promo.validUntil,
            usedCount: promo.usedCount,
            maxUses: promo.maxUses
          });
        }
      }

      return activePromotions;
    } catch (error) {
      throw new Error(`Failed to fetch active promotions: ${error.message}`);
    }
  }

  /**
   * Determine appropriate pricing variant based on user context
   * @param {string} accountType - Account type identifier
   * @param {Object} userContext - User context with invitation info, features, etc.
   * @returns {Promise<Object>} Recommended variant and conditions
   */
  async determineVariant(accountType, userContext = {}) {
    try {
      const pricing = await this.getPricingByAccountType(accountType);

      // Build conditions object based on user context
      const conditions = {};

      if (userContext.invitedBy) {
        conditions.invitedBy = userContext.invitedBy;
      }

      if (userContext.hasFeatures) {
        conditions.hasFeatures = userContext.hasFeatures;
      }

      if (userContext.companySize) {
        conditions.companySize = userContext.companySize;
      }

      // Calculate price with conditions
      const result = pricing.calculatePrice(conditions);

      return {
        accountType: pricing.accountType,
        displayName: pricing.displayName,
        recommendedVariant: result.appliedVariant,
        price: result.finalPrice,
        currency: result.currency,
        billingPeriod: result.billingPeriod,
        conditions: conditions
      };
    } catch (error) {
      throw new Error(`Failed to determine variant: ${error.message}`);
    }
  }

  /**
   * Validate promotion data
   * @private
   * @param {Object} promotionData - Promotion data to validate
   * @throws {Error} If validation fails
   */
  validatePromotionData(promotionData) {
    if (!promotionData.code || typeof promotionData.code !== 'string') {
      throw new Error('Promotion must have a valid code');
    }

    if (!promotionData.discountType || !['percentage', 'fixed'].includes(promotionData.discountType)) {
      throw new Error('Promotion must have a valid discountType (percentage or fixed)');
    }

    if (typeof promotionData.discountValue !== 'number' || promotionData.discountValue <= 0) {
      throw new Error('Promotion must have a valid discountValue greater than 0');
    }

    if (promotionData.discountType === 'percentage' && promotionData.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (!promotionData.validFrom || !promotionData.validUntil) {
      throw new Error('Promotion must have validFrom and validUntil dates');
    }

    if (new Date(promotionData.validUntil) <= new Date(promotionData.validFrom)) {
      throw new Error('Promotion validUntil must be after validFrom');
    }
  }

  /**
   * Get pricing summary for all account types (for admin dashboard)
   * @returns {Promise<Array>} Summary of all pricing configurations
   */
  async getPricingSummary() {
    try {
      const allPricing = await this.getAllPricing();

      return allPricing.map(pricing => ({
        accountType: pricing.accountType,
        displayName: pricing.displayName,
        basePrice: pricing.basePrice,
        currency: pricing.currency,
        billingPeriod: pricing.billingPeriod,
        variantsCount: pricing.variants.length,
        activePromotionsCount: pricing.activePromotions.length,
        totalPromotionsCount: pricing.promotions.length,
        lastUpdated: pricing.updatedAt,
        isActive: pricing.isActive
      }));
    } catch (error) {
      throw new Error(`Failed to fetch pricing summary: ${error.message}`);
    }
  }
}

module.exports = new PricingService();

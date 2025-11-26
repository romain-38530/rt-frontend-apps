/**
 * Hook React pour le Système de Pricing Dynamique
 *
 * Ce hook permet de:
 * - Récupérer tous les prix
 * - Récupérer le prix pour un type de compte spécifique
 * - Calculer le prix final avec conditions et code promo
 * - Valider un code promotionnel
 *
 * Usage:
 * ```tsx
 * const { pricing, calculatePrice, validatePromo } = usePricing();
 *
 * const result = await calculatePrice('TRANSPORTEUR', { invitedBy: 'EXPEDITEUR' });
 * console.log(result.finalPrice); // 0€ (gratuit car invité)
 * ```
 */
/**
 * Types de comptes backend (noms officiels)
 */
export type BackendAccountType = 'TRANSPORTEUR' | 'EXPEDITEUR' | 'PLATEFORME_LOGISTIQUE' | 'COMMISSIONNAIRE' | 'COMMISSIONNAIRE_AGRÉÉ' | 'DOUANE';
/**
 * Variante de prix
 */
export interface PriceVariant {
    name: string;
    price: number;
    currency: string;
    conditions: Record<string, any>;
    features: string[];
    description?: string;
    isActive: boolean;
}
/**
 * Promotion
 */
export interface Promotion {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    conditions?: Record<string, any>;
}
/**
 * Document de pricing complet
 */
export interface Pricing {
    _id: string;
    accountType: BackendAccountType;
    displayName: string;
    basePrice: number;
    currency: string;
    billingPeriod: 'monthly' | 'yearly' | 'one-time';
    variants: PriceVariant[];
    promotions: Promotion[];
    isActive: boolean;
    metadata?: {
        description?: string;
        features?: string[];
        portalUrl?: string;
        upgradeOnly?: boolean;
        adminOnly?: boolean;
    };
    createdAt: string;
    updatedAt: string;
}
/**
 * Résultat du calcul de prix
 */
export interface PriceCalculationResult {
    accountType: BackendAccountType;
    displayName: string;
    originalPrice: number;
    finalPrice: number;
    currency: string;
    billingPeriod: string;
    appliedVariant: {
        name: string;
        price: number;
        features: string[];
    } | null;
    appliedPromo: {
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
    } | null;
}
/**
 * Résultat de validation de code promo
 */
export interface PromoValidationResult {
    valid: boolean;
    message?: string;
    promo?: {
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        validUntil: string;
        remainingUses: number | null;
    };
}
/**
 * Conditions pour le calcul de prix
 */
export interface PriceConditions {
    invitedBy?: BackendAccountType;
    hasFeatures?: string[];
    companySize?: string;
    [key: string]: any;
}
/**
 * Options de configuration du hook
 */
export interface UsePricingOptions {
    apiUrl?: string;
    autoLoad?: boolean;
}
/**
 * Retour du hook usePricing
 */
export interface UsePricingReturn {
    pricing: Record<BackendAccountType, Pricing>;
    allPricing: Pricing[];
    loading: boolean;
    error: string | null;
    fetchAllPricing: () => Promise<void>;
    fetchPricingByType: (accountType: BackendAccountType) => Promise<Pricing | null>;
    calculatePrice: (accountType: BackendAccountType, conditions?: PriceConditions, promoCode?: string) => Promise<PriceCalculationResult | null>;
    calculateMultiplePrices: (accountTypes: BackendAccountType[], conditions?: PriceConditions) => Promise<PriceCalculationResult[]>;
    validatePromo: (accountType: BackendAccountType, promoCode: string) => Promise<PromoValidationResult | null>;
    refresh: () => Promise<void>;
}
/**
 * Hook pour gérer le pricing dynamique
 */
export declare function usePricing(options?: UsePricingOptions): UsePricingReturn;
/**
 * Hook spécialisé pour calculer un prix spécifique
 * Utile pour afficher le prix sur une page de sélection de type de compte
 */
export declare function usePriceCalculator(accountType: BackendAccountType, conditions?: PriceConditions, promoCode?: string): {
    result: PriceCalculationResult | null;
    loading: boolean;
    error: string | null;
};
/**
 * Formater un prix pour l'affichage
 */
export declare function formatPrice(price: number, currency?: string, billingPeriod?: string): string;
/**
 * Calculer le pourcentage de réduction
 */
export declare function calculateDiscountPercentage(originalPrice: number, finalPrice: number): number;
/**
 * Vérifier si une promotion est encore valide
 */
export declare function isPromotionValid(promotion: Promotion): boolean;
/**
 * Obtenir les promotions actives pour un pricing
 */
export declare function getActivePromotions(pricing: Pricing): Promotion[];
//# sourceMappingURL=usePricing.d.ts.map
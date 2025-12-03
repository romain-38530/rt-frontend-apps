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
import { useState, useEffect, useCallback } from 'react';
// ==========================================
// Hook Principal
// ==========================================
/**
 * Hook pour gérer le pricing dynamique
 */
export function usePricing(options = {}) {
    const { apiUrl = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net', autoLoad = true } = options;
    // État
    const [pricing, setPricing] = useState({});
    const [allPricing, setAllPricing] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    /**
     * Récupérer tous les prix
     */
    const fetchAllPricing = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/pricing`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                setAllPricing(result.data);
                // Convertir en objet indexé par accountType
                const pricingMap = {};
                result.data.forEach((p) => {
                    pricingMap[p.accountType] = p;
                });
                setPricing(pricingMap);
            }
            else {
                throw new Error('Format de réponse invalide');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des prix';
            setError(errorMessage);
            console.error('Error fetching all pricing:', err);
        }
        finally {
            setLoading(false);
        }
    }, [apiUrl]);
    /**
     * Récupérer le pricing pour un type de compte spécifique
     */
    const fetchPricingByType = useCallback(async (accountType) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/pricing/${accountType}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Pricing non trouvé pour le type: ${accountType}`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                // Mettre à jour le cache
                setPricing(prev => ({
                    ...prev,
                    [accountType]: result.data
                }));
                return result.data;
            }
            else {
                throw new Error('Format de réponse invalide');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du prix';
            setError(errorMessage);
            console.error(`Error fetching pricing for ${accountType}:`, err);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [apiUrl]);
    /**
     * Calculer le prix final avec conditions et code promo
     */
    const calculatePrice = useCallback(async (accountType, conditions = {}, promoCode) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/pricing/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountType,
                    conditions,
                    promoCode: promoCode || undefined
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
            else {
                throw new Error('Format de réponse invalide');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du calcul du prix';
            setError(errorMessage);
            console.error('Error calculating price:', err);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [apiUrl]);
    /**
     * Calculer les prix pour plusieurs types de comptes (comparaison)
     */
    const calculateMultiplePrices = useCallback(async (accountTypes, conditions = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/pricing/calculate/multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountTypes,
                    conditions
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                return result.data;
            }
            else {
                throw new Error('Format de réponse invalide');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du calcul des prix multiples';
            setError(errorMessage);
            console.error('Error calculating multiple prices:', err);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, [apiUrl]);
    /**
     * Valider un code promotionnel
     */
    const validatePromo = useCallback(async (accountType, promoCode) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/pricing/validate-promo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountType,
                    promoCode
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
            else {
                throw new Error('Format de réponse invalide');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation du code promo';
            setError(errorMessage);
            console.error('Error validating promo code:', err);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [apiUrl]);
    /**
     * Rafraîchir les données
     */
    const refresh = useCallback(async () => {
        await fetchAllPricing();
    }, [fetchAllPricing]);
    // Charger automatiquement au montage si autoLoad est true
    useEffect(() => {
        if (autoLoad) {
            fetchAllPricing();
        }
    }, [autoLoad, fetchAllPricing]);
    return {
        // État
        pricing: pricing,
        allPricing,
        loading,
        error,
        // Actions
        fetchAllPricing,
        fetchPricingByType,
        calculatePrice,
        calculateMultiplePrices,
        validatePromo,
        refresh
    };
}
// ==========================================
// Hook Spécialisé: usePriceCalculator
// ==========================================
/**
 * Hook spécialisé pour calculer un prix spécifique
 * Utile pour afficher le prix sur une page de sélection de type de compte
 */
export function usePriceCalculator(accountType, conditions = {}, promoCode) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { calculatePrice } = usePricing({ autoLoad: false });
    useEffect(() => {
        let isMounted = true;
        const calculate = async () => {
            setLoading(true);
            setError(null);
            try {
                const priceResult = await calculatePrice(accountType, conditions, promoCode);
                if (isMounted) {
                    setResult(priceResult);
                }
            }
            catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erreur de calcul');
                }
            }
            finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        calculate();
        return () => {
            isMounted = false;
        };
    }, [accountType, JSON.stringify(conditions), promoCode, calculatePrice]);
    return { result, loading, error };
}
// ==========================================
// Utilitaires
// ==========================================
/**
 * Formater un prix pour l'affichage
 */
export function formatPrice(price, currency = 'EUR', billingPeriod) {
    const formattedPrice = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(price);
    if (billingPeriod === 'monthly') {
        return `${formattedPrice}/mois`;
    }
    else if (billingPeriod === 'yearly') {
        return `${formattedPrice}/an`;
    }
    return formattedPrice;
}
/**
 * Calculer le pourcentage de réduction
 */
export function calculateDiscountPercentage(originalPrice, finalPrice) {
    if (originalPrice === 0)
        return 0;
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}
/**
 * Vérifier si une promotion est encore valide
 */
export function isPromotionValid(promotion) {
    const now = new Date();
    const validFrom = new Date(promotion.validFrom);
    const validUntil = new Date(promotion.validUntil);
    return (promotion.isActive &&
        now >= validFrom &&
        now <= validUntil &&
        (promotion.maxUses === null || promotion.usedCount < promotion.maxUses));
}
/**
 * Obtenir les promotions actives pour un pricing
 */
export function getActivePromotions(pricing) {
    return pricing.promotions.filter(isPromotionValid);
}
//# sourceMappingURL=usePricing.js.map
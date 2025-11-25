/**
 * Pricing API Routes pour RT Technologie
 *
 * 7 endpoints pour gérer le pricing dynamique:
 * 1. GET /api/pricing - Liste tous les prix
 * 2. GET /api/pricing/:accountType - Prix pour un type de compte spécifique
 * 3. POST /api/pricing/calculate - Calculer le prix final avec conditions
 * 4. POST /api/pricing - Créer/mettre à jour un pricing (admin)
 * 5. PUT /api/pricing/:accountType - Mettre à jour un prix (admin)
 * 6. POST /api/pricing/:accountType/promotion - Ajouter une promotion (admin)
 * 7. GET /api/pricing/:accountType/history - Historique des prix (admin)
 *
 * Service: subscriptions-contracts v2.4.0
 */

const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricingService');
const { requireAdmin } = require('../middleware/authAdmin');

// ==========================================
// ENDPOINTS PUBLICS (Pas d'auth requise)
// ==========================================

/**
 * @route   GET /api/pricing
 * @desc    Récupérer tous les prix actifs
 * @access  Public
 * @returns {Array} Liste de tous les pricing actifs
 *
 * @example
 * GET /api/pricing
 *
 * Response 200:
 * [
 *   {
 *     "_id": "...",
 *     "accountType": "TRANSPORTEUR",
 *     "displayName": "Transporteur",
 *     "basePrice": 49,
 *     "currency": "EUR",
 *     "variants": [...],
 *     "promotions": [...]
 *   },
 *   ...
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const pricing = await pricingService.getAllPricing();

    res.status(200).json({
      success: true,
      count: pricing.length,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching all pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prix',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pricing/summary
 * @desc    Récupérer un résumé de tous les prix (pour dashboard admin)
 * @access  Public (devrait être admin en production)
 * @returns {Array} Résumé des pricing
 *
 * @example
 * GET /api/pricing/summary
 *
 * Response 200:
 * [
 *   {
 *     "accountType": "TRANSPORTEUR",
 *     "displayName": "Transporteur",
 *     "basePrice": 49,
 *     "variantsCount": 2,
 *     "activePromotionsCount": 1,
 *     "lastUpdated": "2025-11-24T..."
 *   },
 *   ...
 * ]
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await pricingService.getPricingSummary();

    res.status(200).json({
      success: true,
      count: summary.length,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé des prix',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pricing/promotions/active
 * @desc    Récupérer toutes les promotions actives
 * @access  Public
 * @returns {Array} Liste des promotions actives
 *
 * @example
 * GET /api/pricing/promotions/active
 *
 * Response 200:
 * [
 *   {
 *     "accountType": "TRANSPORTEUR",
 *     "code": "LAUNCH2025",
 *     "discountType": "percentage",
 *     "discountValue": 50,
 *     "validUntil": "2025-12-31T..."
 *   },
 *   ...
 * ]
 */
router.get('/promotions/active', async (req, res) => {
  try {
    const promotions = await pricingService.getAllActivePromotions();

    res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des promotions actives',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pricing/:accountType
 * @desc    Récupérer le pricing pour un type de compte spécifique
 * @access  Public
 * @param   {string} accountType - Type de compte (TRANSPORTEUR, EXPEDITEUR, etc.)
 * @returns {Object} Pricing document
 *
 * @example
 * GET /api/pricing/TRANSPORTEUR
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accountType": "TRANSPORTEUR",
 *     "displayName": "Transporteur",
 *     "basePrice": 49,
 *     "variants": [...],
 *     "promotions": [...],
 *     "activePromotions": [...]
 *   }
 * }
 */
router.get('/:accountType', async (req, res) => {
  try {
    const { accountType } = req.params;
    const pricing = await pricingService.getPricingByAccountType(accountType);

    res.status(200).json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error(`Error fetching pricing for ${req.params.accountType}:`, error);
    res.status(404).json({
      success: false,
      message: `Pricing non trouvé pour le type de compte: ${req.params.accountType}`,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pricing/calculate
 * @desc    Calculer le prix final avec conditions et code promo
 * @access  Public
 * @body    {string} accountType - Type de compte
 * @body    {Object} conditions - Conditions (ex: { invitedBy: "EXPEDITEUR" })
 * @body    {string} promoCode - Code promotionnel (optionnel)
 * @returns {Object} Résultat du calcul de prix
 *
 * @example
 * POST /api/pricing/calculate
 * {
 *   "accountType": "TRANSPORTEUR",
 *   "conditions": { "invitedBy": "EXPEDITEUR" },
 *   "promoCode": "LAUNCH2025"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accountType": "TRANSPORTEUR",
 *     "displayName": "Transporteur",
 *     "originalPrice": 49,
 *     "finalPrice": 0,
 *     "currency": "EUR",
 *     "billingPeriod": "monthly",
 *     "appliedVariant": {
 *       "name": "TRANSPORTEUR_INVITE",
 *       "price": 0
 *     },
 *     "appliedPromo": null
 *   }
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { accountType, conditions = {}, promoCode } = req.body;

    // Validation
    if (!accountType) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre accountType est requis'
      });
    }

    const result = await pricingService.calculatePrice(accountType, conditions, promoCode);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du prix',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pricing/calculate/multiple
 * @desc    Calculer les prix pour plusieurs types de comptes (comparaison)
 * @access  Public
 * @body    {Array<string>} accountTypes - Liste des types de comptes
 * @body    {Object} conditions - Conditions communes
 * @returns {Array} Résultats des calculs de prix
 *
 * @example
 * POST /api/pricing/calculate/multiple
 * {
 *   "accountTypes": ["TRANSPORTEUR", "EXPEDITEUR", "PLATEFORME_LOGISTIQUE"],
 *   "conditions": {}
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     { "accountType": "TRANSPORTEUR", "finalPrice": 49, ... },
 *     { "accountType": "EXPEDITEUR", "finalPrice": 499, ... },
 *     { "accountType": "PLATEFORME_LOGISTIQUE", "finalPrice": 199, ... }
 *   ]
 * }
 */
router.post('/calculate/multiple', async (req, res) => {
  try {
    const { accountTypes, conditions = {} } = req.body;

    // Validation
    if (!accountTypes || !Array.isArray(accountTypes) || accountTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre accountTypes doit être un tableau non vide'
      });
    }

    const results = await pricingService.calculateMultiplePrices(accountTypes, conditions);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error calculating multiple prices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des prix multiples',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pricing/validate-promo
 * @desc    Valider un code promotionnel pour un type de compte
 * @access  Public
 * @body    {string} accountType - Type de compte
 * @body    {string} promoCode - Code promotionnel
 * @returns {Object} Résultat de validation
 *
 * @example
 * POST /api/pricing/validate-promo
 * {
 *   "accountType": "TRANSPORTEUR",
 *   "promoCode": "LAUNCH2025"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "promo": {
 *       "code": "LAUNCH2025",
 *       "discountType": "percentage",
 *       "discountValue": 50,
 *       "validUntil": "2025-12-31T...",
 *       "remainingUses": 95
 *     }
 *   }
 * }
 */
router.post('/validate-promo', async (req, res) => {
  try {
    const { accountType, promoCode } = req.body;

    // Validation
    if (!accountType || !promoCode) {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres accountType et promoCode sont requis'
      });
    }

    const result = await pricingService.validatePromoCode(accountType, promoCode);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code promo',
      error: error.message
    });
  }
});

// ==========================================
// ENDPOINTS ADMIN (Auth requise)
// ==========================================

/**
 * Les endpoints admin utilisent le middleware requireAdmin importé depuis
 * middleware/authAdmin.js qui vérifie:
 * - Présence du token JWT dans le header Authorization
 * - Validité du token (signature, expiration)
 * - Permissions admin de l'utilisateur
 *
 * Pour utiliser ces endpoints, incluez le header:
 * Authorization: Bearer <jwt-token>
 *
 * Le token doit contenir un rôle admin (admin, super_admin, pricing_manager)
 */

/**
 * @route   POST /api/pricing
 * @desc    Créer ou mettre à jour un pricing (admin)
 * @access  Admin
 * @body    {string} accountType - Type de compte
 * @body    {string} displayName - Nom d'affichage
 * @body    {number} basePrice - Prix de base
 * @body    {Array} variants - Variantes de prix (optionnel)
 * @body    {Array} promotions - Promotions (optionnel)
 * @returns {Object} Pricing créé/mis à jour
 *
 * @example
 * POST /api/pricing
 * {
 *   "accountType": "TRANSPORTEUR",
 *   "displayName": "Transporteur",
 *   "basePrice": 49,
 *   "currency": "EUR",
 *   "billingPeriod": "monthly",
 *   "variants": [
 *     {
 *       "name": "TRANSPORTEUR_INVITE",
 *       "price": 0,
 *       "conditions": { "invitedBy": "EXPEDITEUR" }
 *     },
 *     {
 *       "name": "TRANSPORTEUR_PREMIUM",
 *       "price": 499,
 *       "conditions": { "hasFeatures": ["create_orders"] }
 *     }
 *   ]
 * }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { accountType, ...pricingData } = req.body;

    // Validation
    if (!accountType) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre accountType est requis'
      });
    }

    if (typeof pricingData.basePrice !== 'number' || pricingData.basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'basePrice doit être un nombre positif'
      });
    }

    const pricing = await pricingService.createOrUpdatePricing(accountType, pricingData);

    res.status(200).json({
      success: true,
      message: 'Pricing créé/mis à jour avec succès',
      data: pricing
    });
  } catch (error) {
    console.error('Error creating/updating pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour du pricing',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/pricing/:accountType
 * @desc    Mettre à jour le prix de base (admin) avec historique
 * @access  Admin
 * @param   {string} accountType - Type de compte
 * @body    {number} newPrice - Nouveau prix
 * @body    {string} reason - Raison du changement
 * @returns {Object} Pricing mis à jour
 *
 * @example
 * PUT /api/pricing/TRANSPORTEUR
 * {
 *   "newPrice": 59,
 *   "reason": "Ajustement inflation 2025"
 * }
 */
router.put('/:accountType', requireAdmin, async (req, res) => {
  try {
    const { accountType } = req.params;
    const { newPrice, reason } = req.body;

    // Validation
    if (typeof newPrice !== 'number' || newPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'newPrice doit être un nombre positif'
      });
    }

    // TODO: Récupérer l'ID de l'admin depuis le token JWT
    const changedBy = req.user?.id || 'admin';

    const pricing = await pricingService.updateBasePrice(
      accountType,
      newPrice,
      changedBy,
      reason || 'Mise à jour manuelle'
    );

    res.status(200).json({
      success: true,
      message: 'Prix mis à jour avec succès',
      data: pricing
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du prix',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/pricing/:accountType/variant
 * @desc    Ajouter ou mettre à jour une variante de prix (admin)
 * @access  Admin
 * @param   {string} accountType - Type de compte
 * @body    {string} variantName - Nom de la variante
 * @body    {number} price - Prix de la variante
 * @body    {Object} conditions - Conditions d'application
 * @body    {Array} features - Fonctionnalités incluses (optionnel)
 * @returns {Object} Pricing mis à jour
 *
 * @example
 * PUT /api/pricing/TRANSPORTEUR/variant
 * {
 *   "variantName": "TRANSPORTEUR_INVITE",
 *   "price": 0,
 *   "conditions": { "invitedBy": "EXPEDITEUR" },
 *   "features": ["basic_transport", "signature_digitale"]
 * }
 */
router.put('/:accountType/variant', requireAdmin, async (req, res) => {
  try {
    const { accountType } = req.params;
    const { variantName, ...variantData } = req.body;

    // Validation
    if (!variantName) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre variantName est requis'
      });
    }

    const pricing = await pricingService.updateVariant(accountType, variantName, variantData);

    res.status(200).json({
      success: true,
      message: 'Variante ajoutée/mise à jour avec succès',
      data: pricing
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la variante',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pricing/:accountType/promotion
 * @desc    Ajouter une promotion (admin)
 * @access  Admin
 * @param   {string} accountType - Type de compte
 * @body    {string} code - Code promo
 * @body    {string} discountType - Type de réduction (percentage ou fixed)
 * @body    {number} discountValue - Valeur de la réduction
 * @body    {Date} validFrom - Date de début
 * @body    {Date} validUntil - Date de fin
 * @body    {number} maxUses - Nombre max d'utilisations (optionnel)
 * @returns {Object} Pricing mis à jour
 *
 * @example
 * POST /api/pricing/TRANSPORTEUR/promotion
 * {
 *   "code": "LAUNCH2025",
 *   "discountType": "percentage",
 *   "discountValue": 50,
 *   "validFrom": "2025-11-24T00:00:00Z",
 *   "validUntil": "2025-12-31T23:59:59Z",
 *   "maxUses": 100
 * }
 */
router.post('/:accountType/promotion', requireAdmin, async (req, res) => {
  try {
    const { accountType } = req.params;
    const promotionData = req.body;

    const pricing = await pricingService.addPromotion(accountType, promotionData);

    res.status(200).json({
      success: true,
      message: 'Promotion ajoutée avec succès',
      data: pricing
    });
  } catch (error) {
    console.error('Error adding promotion:', error);
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la promotion',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/pricing/:accountType/promotion/:promoCode
 * @desc    Désactiver une promotion (admin)
 * @access  Admin
 * @param   {string} accountType - Type de compte
 * @param   {string} promoCode - Code promo à désactiver
 * @returns {Object} Pricing mis à jour
 *
 * @example
 * DELETE /api/pricing/TRANSPORTEUR/promotion/LAUNCH2025
 */
router.delete('/:accountType/promotion/:promoCode', requireAdmin, async (req, res) => {
  try {
    const { accountType, promoCode } = req.params;

    const pricing = await pricingService.deactivatePromotion(accountType, promoCode);

    res.status(200).json({
      success: true,
      message: 'Promotion désactivée avec succès',
      data: pricing
    });
  } catch (error) {
    console.error('Error deactivating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de la promotion',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pricing/:accountType/history
 * @desc    Récupérer l'historique des prix (admin)
 * @access  Admin
 * @param   {string} accountType - Type de compte
 * @query   {number} limit - Nombre max d'entrées (défaut: 50)
 * @returns {Object} Historique des prix
 *
 * @example
 * GET /api/pricing/TRANSPORTEUR/history?limit=20
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accountType": "TRANSPORTEUR",
 *     "currentPrice": 49,
 *     "history": [
 *       {
 *         "previousPrice": 39,
 *         "newPrice": 49,
 *         "changedAt": "2025-11-01T...",
 *         "changedBy": "admin",
 *         "reason": "Ajustement inflation"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
router.get('/:accountType/history', requireAdmin, async (req, res) => {
  try {
    const { accountType } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await pricingService.getPriceHistory(accountType, limit);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

module.exports = router;

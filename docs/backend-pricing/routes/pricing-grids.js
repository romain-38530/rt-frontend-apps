/**
 * Pricing Grids Routes - Grilles Tarifaires Transport
 *
 * Endpoints pour gérer les grilles tarifaires des transporteurs:
 * - POST /api/pricing-grids - Créer une grille
 * - GET /api/pricing-grids - Lister les grilles
 * - GET /api/pricing-grids/:gridId - Détails d'une grille
 * - PUT /api/pricing-grids/:gridId - Modifier une grille
 * - DELETE /api/pricing-grids/:gridId - Supprimer une grille (DRAFT uniquement)
 * - POST /api/pricing-grids/:gridId/activate - Activer une grille
 * - POST /api/pricing-grids/:gridId/suspend - Suspendre une grille
 * - POST /api/pricing-grids/:gridId/archive - Archiver une grille
 * - POST /api/pricing-grids/calculate - Calculer un prix
 * - GET /api/pricing-grids/zones/list - Lister les zones disponibles
 * - GET /api/pricing-grids/options/list - Lister les options disponibles
 * - GET /api/pricing-grids/types/transport - Lister les types de transport
 *
 * Service: subscriptions-contracts v2.5.0
 */

const express = require('express');
const router = express.Router();
const {
  PricingGrid,
  TRANSPORT_TYPES,
  CALCULATION_TYPES,
  GEOGRAPHIC_ZONES,
  PRICING_OPTIONS,
  GRID_STATUS
} = require('../models/PricingGrids');
const { requireAuth } = require('../middleware/auth'); // Middleware d'authentification standard

// ==========================================
// Endpoints Publics (ou avec auth légère)
// ==========================================

/**
 * @route   GET /api/pricing-grids/zones/list
 * @desc    Lister toutes les zones géographiques disponibles
 * @access  Public
 * @returns {Object} Liste des zones avec leurs codes et noms
 *
 * @example
 * GET /api/pricing-grids/zones/list
 *
 * Response 200:
 * {
 *   "success": true,
 *   "zones": {
 *     "IDF": "Île-de-France",
 *     "AURA": "Auvergne-Rhône-Alpes",
 *     ...
 *   },
 *   "count": 23
 * }
 */
router.get('/zones/list', async (req, res) => {
  try {
    res.json({
      success: true,
      zones: GEOGRAPHIC_ZONES,
      count: Object.keys(GEOGRAPHIC_ZONES).length,
      categories: {
        france: Object.keys(GEOGRAPHIC_ZONES).filter(k => k.length > 2).length,
        europe: Object.keys(GEOGRAPHIC_ZONES).filter(k => k.length === 2).length
      }
    });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des zones'
    });
  }
});

/**
 * @route   GET /api/pricing-grids/options/list
 * @desc    Lister toutes les options tarifaires disponibles
 * @access  Public
 * @returns {Object} Liste des options avec leurs détails
 *
 * @example
 * GET /api/pricing-grids/options/list
 *
 * Response 200:
 * {
 *   "success": true,
 *   "options": {
 *     "ADR": {
 *       "name": "ADR",
 *       "description": "Transport de matières dangereuses",
 *       "type": "percentage",
 *       "defaultValue": 25
 *     },
 *     ...
 *   },
 *   "count": 9
 * }
 */
router.get('/options/list', async (req, res) => {
  try {
    res.json({
      success: true,
      options: PRICING_OPTIONS,
      count: Object.keys(PRICING_OPTIONS).length
    });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des options'
    });
  }
});

/**
 * @route   GET /api/pricing-grids/types/transport
 * @desc    Lister tous les types de transport disponibles
 * @access  Public
 * @returns {Object} Liste des types de transport
 *
 * @example
 * GET /api/pricing-grids/types/transport
 *
 * Response 200:
 * {
 *   "success": true,
 *   "types": ["FTL", "LTL", "ADR", "FRIGO", ...],
 *   "count": 10,
 *   "details": {
 *     "FTL": "Full Truck Load (complet)",
 *     ...
 *   }
 * }
 */
router.get('/types/transport', async (req, res) => {
  try {
    const typeDetails = {
      FTL: 'Full Truck Load (complet)',
      LTL: 'Less Than Truck Load (groupage)',
      ADR: 'Matières dangereuses',
      FRIGO: 'Transport frigorifique',
      HAYON: 'Hayon élévateur',
      MESSAGERIE: 'Colis/messagerie',
      EXPRESS: 'Livraison express',
      PALETTE: 'Transport par palettes',
      VRAC: 'Transport en vrac',
      BENNE: 'Transport benne'
    };

    res.json({
      success: true,
      types: Object.values(TRANSPORT_TYPES),
      count: Object.values(TRANSPORT_TYPES).length,
      details: typeDetails
    });
  } catch (error) {
    console.error('Get transport types error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types de transport'
    });
  }
});

/**
 * @route   POST /api/pricing-grids/calculate
 * @desc    Calculer le prix pour une demande de transport
 * @access  Public (ou avec auth légère)
 * @body    {string} gridId - ID de la grille tarifaire
 * @body    {Object} request - Détails de la demande
 * @returns {Object} Détails du calcul de prix
 *
 * @example
 * POST /api/pricing-grids/calculate
 * {
 *   "gridId": "grille-123",
 *   "request": {
 *     "originZone": "IDF",
 *     "destinationZone": "AURA",
 *     "distance": 450,
 *     "weight": 5000,
 *     "volume": 12,
 *     "palletCount": 10,
 *     "options": ["HAYON", "EXPRESS"]
 *   }
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "gridId": "grille-123",
 *   "breakdown": {
 *     "basePrice": 800,
 *     "zoneModifier": 100,
 *     "optionsTotal": 150,
 *     "subtotal": 950,
 *     "finalPrice": 1100,
 *     "currency": "EUR",
 *     "details": [...]
 *   }
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { gridId, request } = req.body;

    // Validation
    if (!gridId || !request) {
      return res.status(400).json({
        success: false,
        message: 'gridId et request requis'
      });
    }

    // Récupérer la grille
    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier que la grille est active
    if (!grid.isValidAt()) {
      return res.status(400).json({
        success: false,
        message: 'Cette grille tarifaire n\'est pas active ou est expirée'
      });
    }

    // Calculer le prix
    const breakdown = grid.calculatePrice(request);

    res.json({
      success: true,
      gridId: grid._id,
      gridName: grid.gridName,
      transportType: grid.transportType,
      calculationType: grid.calculationType,
      breakdown
    });

  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du prix',
      error: error.message
    });
  }
});

// ==========================================
// Endpoints CRUD (authentification requise)
// ==========================================

/**
 * @route   POST /api/pricing-grids
 * @desc    Créer une nouvelle grille tarifaire
 * @access  Transporteur authentifié
 * @body    {Object} grid - Détails de la grille
 * @returns {Object} Grille créée
 *
 * @example
 * POST /api/pricing-grids
 * Headers: Authorization: Bearer <token>
 * {
 *   "gridName": "Tarif FTL National 2025",
 *   "transportType": "FTL",
 *   "calculationType": "PER_KM",
 *   "tiers": [
 *     { "minValue": 0, "maxValue": 100, "basePrice": 200, "unitPrice": 1.5 },
 *     { "minValue": 100, "maxValue": 300, "basePrice": 300, "unitPrice": 1.2 },
 *     { "minValue": 300, "maxValue": null, "basePrice": 500, "unitPrice": 1.0 }
 *   ],
 *   "zones": [
 *     { "zone": "IDF", "priceMultiplier": 1.0, "fixedSupplement": 0, "estimatedDeliveryDays": 1 },
 *     { "zone": "AURA", "priceMultiplier": 1.2, "fixedSupplement": 50, "estimatedDeliveryDays": 2 }
 *   ],
 *   "options": [
 *     { "optionCode": "HAYON", "type": "fixed", "value": 50, "enabled": true },
 *     { "optionCode": "EXPRESS", "type": "percentage", "value": 30, "enabled": true }
 *   ],
 *   "minOrder": 100,
 *   "validFrom": "2025-01-01",
 *   "validUntil": "2025-12-31"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "grid": { ... },
 *   "message": "Grille tarifaire créée avec succès"
 * }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;  // Depuis le middleware d'auth
    const carrierId = req.user.carrierId || userId; // ID du transporteur

    const gridData = {
      ...req.body,
      carrierId,
      createdBy: userId,
      lastModifiedBy: userId,
      status: GRID_STATUS.DRAFT // Toujours créer en DRAFT
    };

    // Validation des champs requis
    if (!gridData.gridName || !gridData.transportType || !gridData.calculationType) {
      return res.status(400).json({
        success: false,
        message: 'gridName, transportType et calculationType requis'
      });
    }

    const grid = await PricingGrid.create(gridData);

    res.status(201).json({
      success: true,
      grid,
      message: 'Grille tarifaire créée avec succès (statut: DRAFT)'
    });

  } catch (error) {
    console.error('Create grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la grille',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pricing-grids
 * @desc    Lister les grilles tarifaires (filtrables)
 * @access  Authentifié (transporteur voit ses grilles, admin voit toutes)
 * @query   {string} carrierId - Filtrer par transporteur (admin uniquement)
 * @query   {string} transportType - Filtrer par type de transport
 * @query   {string} status - Filtrer par statut (DRAFT, ACTIVE, SUSPENDED, ARCHIVED)
 * @query   {number} limit - Limite de résultats (défaut: 50)
 * @query   {number} skip - Nombre de résultats à sauter (pagination)
 * @returns {Object} Liste des grilles
 *
 * @example
 * GET /api/pricing-grids?transportType=FTL&status=ACTIVE&limit=10
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grids": [...],
 *   "count": 10,
 *   "total": 25,
 *   "hasMore": true
 * }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const {
      carrierId,
      transportType,
      status,
      limit = 50,
      skip = 0
    } = req.query;

    // Construire la query
    const query = {};

    // Si pas admin, ne voir que ses propres grilles
    if (!isAdmin) {
      query.carrierId = req.user.carrierId || userId;
    } else if (carrierId) {
      query.carrierId = carrierId;
    }

    if (transportType) {
      query.transportType = transportType;
    }

    if (status) {
      query.status = status;
    }

    // Exécuter la requête
    const grids = await PricingGrid.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await PricingGrid.countDocuments(query);

    res.json({
      success: true,
      grids,
      count: grids.length,
      total,
      hasMore: (parseInt(skip) + grids.length) < total,
      filters: { carrierId, transportType, status }
    });

  } catch (error) {
    console.error('List grids error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des grilles'
    });
  }
});

/**
 * @route   GET /api/pricing-grids/:gridId
 * @desc    Récupérer les détails d'une grille tarifaire
 * @access  Authentifié (propriétaire ou admin)
 * @param   {string} gridId - ID de la grille
 * @returns {Object} Détails de la grille
 *
 * @example
 * GET /api/pricing-grids/grille-123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grid": { ... }
 * }
 */
router.get('/:gridId', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette grille'
      });
    }

    res.json({
      success: true,
      grid
    });

  } catch (error) {
    console.error('Get grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la grille'
    });
  }
});

/**
 * @route   PUT /api/pricing-grids/:gridId
 * @desc    Modifier une grille tarifaire
 * @access  Propriétaire ou admin (uniquement si DRAFT ou SUSPENDED)
 * @param   {string} gridId - ID de la grille
 * @body    {Object} updates - Modifications à apporter
 * @returns {Object} Grille modifiée
 *
 * @example
 * PUT /api/pricing-grids/grille-123
 * {
 *   "gridName": "Tarif FTL National 2025 - Mise à jour",
 *   "minOrder": 150,
 *   "zones": [...]
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grid": { ... },
 *   "message": "Grille mise à jour"
 * }
 */
router.put('/:gridId', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier que la grille est modifiable
    if (grid.status === GRID_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une grille ACTIVE. Suspendez-la d\'abord.'
      });
    }

    if (grid.status === GRID_STATUS.ARCHIVED) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une grille ARCHIVED'
      });
    }

    // Appliquer les modifications
    const allowedFields = [
      'gridName', 'description', 'transportType', 'calculationType',
      'tiers', 'zones', 'options', 'minOrder', 'currency',
      'validFrom', 'validUntil', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        grid[field] = req.body[field];
      }
    });

    grid.lastModifiedBy = userId;

    await grid.save();

    res.json({
      success: true,
      grid,
      message: 'Grille tarifaire mise à jour'
    });

  } catch (error) {
    console.error('Update grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la grille',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/pricing-grids/:gridId
 * @desc    Supprimer une grille tarifaire (DRAFT uniquement)
 * @access  Propriétaire ou admin
 * @param   {string} gridId - ID de la grille
 * @returns {Object} Confirmation de suppression
 *
 * @example
 * DELETE /api/pricing-grids/grille-123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Grille supprimée"
 * }
 */
router.delete('/:gridId', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Seules les grilles DRAFT peuvent être supprimées
    if (grid.status !== GRID_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Seules les grilles en statut DRAFT peuvent être supprimées. Utilisez l\'archivage pour les autres.'
      });
    }

    await grid.deleteOne();

    res.json({
      success: true,
      message: 'Grille tarifaire supprimée'
    });

  } catch (error) {
    console.error('Delete grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la grille'
    });
  }
});

// ==========================================
// Endpoints de Gestion de Statut
// ==========================================

/**
 * @route   POST /api/pricing-grids/:gridId/activate
 * @desc    Activer une grille tarifaire (DRAFT → ACTIVE)
 * @access  Propriétaire ou admin
 * @param   {string} gridId - ID de la grille
 * @returns {Object} Grille activée
 *
 * @example
 * POST /api/pricing-grids/grille-123/activate
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grid": { ... },
 *   "message": "Grille activée"
 * }
 */
router.post('/:gridId/activate', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier le statut actuel
    if (grid.status === GRID_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Cette grille est déjà active'
      });
    }

    if (grid.status === GRID_STATUS.ARCHIVED) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'activer une grille archivée'
      });
    }

    // Activer
    grid.status = GRID_STATUS.ACTIVE;
    grid.lastModifiedBy = userId;

    await grid.save();

    res.json({
      success: true,
      grid,
      message: 'Grille tarifaire activée avec succès'
    });

  } catch (error) {
    console.error('Activate grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de la grille'
    });
  }
});

/**
 * @route   POST /api/pricing-grids/:gridId/suspend
 * @desc    Suspendre une grille tarifaire (ACTIVE → SUSPENDED)
 * @access  Propriétaire ou admin
 * @param   {string} gridId - ID de la grille
 * @returns {Object} Grille suspendue
 *
 * @example
 * POST /api/pricing-grids/grille-123/suspend
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grid": { ... },
 *   "message": "Grille suspendue"
 * }
 */
router.post('/:gridId/suspend', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Suspendre
    grid.status = GRID_STATUS.SUSPENDED;
    grid.lastModifiedBy = userId;

    await grid.save();

    res.json({
      success: true,
      grid,
      message: 'Grille tarifaire suspendue'
    });

  } catch (error) {
    console.error('Suspend grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension de la grille'
    });
  }
});

/**
 * @route   POST /api/pricing-grids/:gridId/archive
 * @desc    Archiver une grille tarifaire (ANY → ARCHIVED)
 * @access  Propriétaire ou admin
 * @param   {string} gridId - ID de la grille
 * @returns {Object} Grille archivée
 *
 * @example
 * POST /api/pricing-grids/grille-123/archive
 *
 * Response 200:
 * {
 *   "success": true,
 *   "grid": { ... },
 *   "message": "Grille archivée"
 * }
 */
router.post('/:gridId/archive', requireAuth, async (req, res) => {
  try {
    const { gridId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const grid = await PricingGrid.findById(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Grille tarifaire non trouvée'
      });
    }

    // Vérifier les permissions
    if (!isAdmin && grid.carrierId !== (req.user.carrierId || userId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Archiver
    grid.status = GRID_STATUS.ARCHIVED;
    grid.lastModifiedBy = userId;

    await grid.save();

    res.json({
      success: true,
      grid,
      message: 'Grille tarifaire archivée (conservée pour historique)'
    });

  } catch (error) {
    console.error('Archive grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage de la grille'
    });
  }
});

module.exports = router;

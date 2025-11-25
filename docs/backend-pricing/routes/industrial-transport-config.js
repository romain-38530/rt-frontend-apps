/**
 * Industrial Transport Configuration Routes
 *
 * Endpoints pour gérer la configuration des types de transport attendus par les industriels:
 * - GET /api/industrial/:id/transport-config - Récupérer la configuration
 * - POST /api/industrial/:id/transport-config - Créer/modifier la configuration
 * - POST /api/industrial/:id/transport-config/add-type - Ajouter un type
 * - POST /api/industrial/:id/transport-config/remove-type - Retirer un type
 * - GET /api/industrial/:id/carriers/compatibility - Rapport de compatibilité
 *
 * Service: subscriptions-contracts v2.5.0
 */

const express = require('express');
const router = express.Router();
const { IndustrialTransportConfig } = require('../models/IndustrialTransportConfig');
const { TRANSPORT_TYPES } = require('../models/PricingGrids');
const { requireAuth } = require('../middleware/auth');

// ==========================================
// Endpoints de Configuration
// ==========================================

/**
 * @route   GET /api/industrial/:id/transport-config
 * @desc    Récupérer la configuration des types de transport attendus par un industriel
 * @access  Authentifié (industriel concerné ou admin)
 * @param   {string} id - ID de l'industriel
 * @returns {Object} Configuration actuelle
 *
 * @example
 * GET /api/industrial/industrial-123/transport-config
 *
 * Response 200:
 * {
 *   "success": true,
 *   "config": {
 *     "industrialId": "industrial-123",
 *     "transportTypes": [
 *       {
 *         "transportType": "FTL",
 *         "isRequired": true,
 *         "priority": 10,
 *         "notes": "Essentiel pour nos livraisons",
 *         "addedAt": "2025-01-15T10:00:00Z"
 *       },
 *       {
 *         "transportType": "FRIGO",
 *         "isRequired": true,
 *         "priority": 8,
 *         "addedAt": "2025-01-15T10:00:00Z"
 *       },
 *       {
 *         "transportType": "EXPRESS",
 *         "isRequired": false,
 *         "priority": 5,
 *         "addedAt": "2025-01-15T10:00:00Z"
 *       }
 *     ],
 *     "mandatoryForCarriers": true,
 *     "autoRejectIncompatible": false,
 *     "createdAt": "2025-01-15T10:00:00Z",
 *     "updatedAt": "2025-01-20T14:30:00Z"
 *   },
 *   "summary": {
 *     "requiredTypes": ["FTL", "FRIGO"],
 *     "optionalTypes": ["EXPRESS"],
 *     "totalTypes": 3
 *   }
 * }
 */
router.get('/:id/transport-config', requireAuth, async (req, res) => {
  try {
    const { id: industrialId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    // Vérifier les permissions
    if (!isAdmin && req.user.industrialId !== industrialId && userId !== industrialId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette configuration'
      });
    }

    // Récupérer ou créer la configuration
    const config = await IndustrialTransportConfig.getOrCreateConfig(industrialId);

    res.json({
      success: true,
      config,
      summary: {
        requiredTypes: config.getRequiredTypes(),
        optionalTypes: config.getOptionalTypes(),
        totalTypes: config.transportTypes.length
      }
    });

  } catch (error) {
    console.error('Get transport config error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/industrial/:id/transport-config
 * @desc    Créer ou mettre à jour la configuration complète
 * @access  Industriel concerné ou admin
 * @param   {string} id - ID de l'industriel
 * @body    {Object} config - Configuration complète
 * @returns {Object} Configuration mise à jour
 *
 * @example
 * POST /api/industrial/industrial-123/transport-config
 * Headers: Authorization: Bearer <token>
 * {
 *   "transportTypes": [
 *     {
 *       "transportType": "FTL",
 *       "isRequired": true,
 *       "priority": 10,
 *       "notes": "Essentiel pour nos livraisons"
 *     },
 *     {
 *       "transportType": "FRIGO",
 *       "isRequired": true,
 *       "priority": 8
 *     },
 *     {
 *       "transportType": "EXPRESS",
 *       "isRequired": false,
 *       "priority": 5
 *     }
 *   ],
 *   "mandatoryForCarriers": true,
 *   "autoRejectIncompatible": false,
 *   "notes": "Configuration pour l'année 2025"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "config": { ... },
 *   "message": "Configuration mise à jour avec succès",
 *   "changes": {
 *     "added": ["FTL", "FRIGO", "EXPRESS"],
 *     "removed": [],
 *     "modified": []
 *   }
 * }
 */
router.post('/:id/transport-config', requireAuth, async (req, res) => {
  try {
    const { id: industrialId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    // Vérifier les permissions
    if (!isAdmin && req.user.industrialId !== industrialId && userId !== industrialId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const {
      transportTypes,
      mandatoryForCarriers,
      autoRejectIncompatible,
      notes
    } = req.body;

    // Validation
    if (transportTypes && !Array.isArray(transportTypes)) {
      return res.status(400).json({
        success: false,
        message: 'transportTypes doit être un tableau'
      });
    }

    // Vérifier que tous les types sont valides
    if (transportTypes) {
      const validTypes = Object.values(TRANSPORT_TYPES);
      for (const tt of transportTypes) {
        if (!validTypes.includes(tt.transportType)) {
          return res.status(400).json({
            success: false,
            message: `Type de transport invalide: ${tt.transportType}`
          });
        }
      }
    }

    // Récupérer la config existante pour comparer
    const oldConfig = await IndustrialTransportConfig.findOne({ industrialId });
    const oldTypes = oldConfig ? oldConfig.transportTypes.map(t => t.transportType) : [];

    // Créer ou mettre à jour
    const config = await IndustrialTransportConfig.upsertConfig(
      industrialId,
      {
        transportTypes,
        mandatoryForCarriers,
        autoRejectIncompatible,
        notes
      },
      userId
    );

    // Calculer les changements
    const newTypes = config.transportTypes.map(t => t.transportType);
    const changes = {
      added: newTypes.filter(t => !oldTypes.includes(t)),
      removed: oldTypes.filter(t => !newTypes.includes(t)),
      modified: newTypes.filter(t => oldTypes.includes(t))
    };

    res.json({
      success: true,
      config,
      message: 'Configuration mise à jour avec succès',
      changes
    });

  } catch (error) {
    console.error('Update transport config error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/industrial/:id/transport-config/add-type
 * @desc    Ajouter un type de transport à la configuration
 * @access  Industriel concerné ou admin
 * @param   {string} id - ID de l'industriel
 * @body    {string} transportType - Type de transport à ajouter
 * @body    {boolean} isRequired - Est-ce un type obligatoire ? (défaut: true)
 * @body    {number} priority - Priorité 0-10 (défaut: 5)
 * @body    {string} notes - Notes optionnelles
 * @returns {Object} Configuration mise à jour
 *
 * @example
 * POST /api/industrial/industrial-123/transport-config/add-type
 * Headers: Authorization: Bearer <token>
 * {
 *   "transportType": "ADR",
 *   "isRequired": true,
 *   "priority": 9,
 *   "notes": "Nécessaire pour le transport de produits chimiques"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "config": { ... },
 *   "message": "Type de transport ADR ajouté avec succès"
 * }
 */
router.post('/:id/transport-config/add-type', requireAuth, async (req, res) => {
  try {
    const { id: industrialId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    // Vérifier les permissions
    if (!isAdmin && req.user.industrialId !== industrialId && userId !== industrialId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const {
      transportType,
      isRequired = true,
      priority = 5,
      notes
    } = req.body;

    // Validation
    if (!transportType) {
      return res.status(400).json({
        success: false,
        message: 'transportType requis'
      });
    }

    const validTypes = Object.values(TRANSPORT_TYPES);
    if (!validTypes.includes(transportType)) {
      return res.status(400).json({
        success: false,
        message: `Type de transport invalide: ${transportType}. Types valides: ${validTypes.join(', ')}`
      });
    }

    // Récupérer ou créer la configuration
    const config = await IndustrialTransportConfig.getOrCreateConfig(industrialId);

    // Ajouter le type
    try {
      config.addTransportType(transportType, isRequired, priority);

      if (notes) {
        const addedType = config.transportTypes.find(t => t.transportType === transportType);
        if (addedType) {
          addedType.notes = notes;
        }
      }

      config.lastModifiedBy = userId;
      await config.save();

      res.json({
        success: true,
        config,
        message: `Type de transport ${transportType} ajouté avec succès`
      });

    } catch (err) {
      if (err.message.includes('déjà configuré')) {
        return res.status(409).json({
          success: false,
          message: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    console.error('Add transport type error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du type de transport',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/industrial/:id/transport-config/remove-type
 * @desc    Retirer un type de transport de la configuration
 * @access  Industriel concerné ou admin
 * @param   {string} id - ID de l'industriel
 * @body    {string} transportType - Type de transport à retirer
 * @returns {Object} Configuration mise à jour
 *
 * @example
 * POST /api/industrial/industrial-123/transport-config/remove-type
 * Headers: Authorization: Bearer <token>
 * {
 *   "transportType": "BENNE"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "config": { ... },
 *   "message": "Type de transport BENNE retiré avec succès"
 * }
 */
router.post('/:id/transport-config/remove-type', requireAuth, async (req, res) => {
  try {
    const { id: industrialId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    // Vérifier les permissions
    if (!isAdmin && req.user.industrialId !== industrialId && userId !== industrialId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { transportType } = req.body;

    // Validation
    if (!transportType) {
      return res.status(400).json({
        success: false,
        message: 'transportType requis'
      });
    }

    // Récupérer la configuration
    const config = await IndustrialTransportConfig.findOne({ industrialId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Aucune configuration trouvée pour cet industriel'
      });
    }

    // Vérifier que le type existe
    const exists = config.transportTypes.some(t => t.transportType === transportType);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `Type de transport ${transportType} non trouvé dans la configuration`
      });
    }

    // Retirer le type
    config.removeTransportType(transportType);
    config.lastModifiedBy = userId;
    await config.save();

    res.json({
      success: true,
      config,
      message: `Type de transport ${transportType} retiré avec succès`
    });

  } catch (error) {
    console.error('Remove transport type error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du type de transport',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/industrial/:id/carriers/compatibility
 * @desc    Obtenir un rapport de compatibilité pour les transporteurs
 * @access  Industriel concerné ou admin
 * @param   {string} id - ID de l'industriel
 * @query   {string[]} carrierIds - IDs des transporteurs à vérifier (optionnel)
 * @returns {Object} Rapport de compatibilité détaillé
 *
 * @example
 * GET /api/industrial/industrial-123/carriers/compatibility
 * Headers: Authorization: Bearer <token>
 *
 * Response 200:
 * {
 *   "success": true,
 *   "industrialId": "industrial-123",
 *   "configSummary": {
 *     "requiredTypes": ["FTL", "FRIGO"],
 *     "optionalTypes": ["EXPRESS"],
 *     "mandatoryForCarriers": true,
 *     "autoRejectIncompatible": false
 *   },
 *   "carriers": [
 *     {
 *       "carrierId": "carrier-1",
 *       "carrierName": "Transport Express SA",
 *       "isCompatible": true,
 *       "score": 100,
 *       "reason": "Compatible",
 *       "required": {
 *         "expected": ["FTL", "FRIGO"],
 *         "matching": ["FTL", "FRIGO"],
 *         "missing": []
 *       },
 *       "optional": {
 *         "expected": ["EXPRESS"],
 *         "matching": ["EXPRESS"]
 *       },
 *       "extra": ["ADR", "HAYON"],
 *       "recommendation": "Excellent match"
 *     },
 *     {
 *       "carrierId": "carrier-2",
 *       "carrierName": "Logistique Rapide",
 *       "isCompatible": false,
 *       "score": 50,
 *       "reason": "Types requis manquants: FRIGO",
 *       "required": {
 *         "expected": ["FTL", "FRIGO"],
 *         "matching": ["FTL"],
 *         "missing": ["FRIGO"]
 *       },
 *       "optional": {
 *         "expected": ["EXPRESS"],
 *         "matching": []
 *       },
 *       "extra": [],
 *       "recommendation": "Partial match"
 *     }
 *   ],
 *   "statistics": {
 *     "total": 2,
 *     "compatible": 1,
 *     "incompatible": 1,
 *     "compatibilityRate": 50,
 *     "averageScore": 75
 *   }
 * }
 */
router.get('/:id/carriers/compatibility', requireAuth, async (req, res) => {
  try {
    const { id: industrialId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    // Vérifier les permissions
    if (!isAdmin && req.user.industrialId !== industrialId && userId !== industrialId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer la configuration
    const config = await IndustrialTransportConfig.findOne({ industrialId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Aucune configuration trouvée pour cet industriel. Créez-en une d\'abord.'
      });
    }

    // Récupérer les transporteurs
    // NOTE: Ici on devrait interroger la collection "carriers" pour récupérer leurs types de transport
    // Pour l'exemple, on suppose que les IDs sont fournis dans la query ou on récupère tous les carriers

    // TODO: Intégrer avec la vraie collection "carriers"
    // const Carrier = require('../models/Carrier');
    // const carriers = await Carrier.find({ status: 'active' });

    // Pour la démo, données fictives
    const demoCarriers = [
      {
        carrierId: 'carrier-1',
        carrierName: 'Transport Express SA',
        transportTypes: ['FTL', 'FRIGO', 'EXPRESS', 'ADR', 'HAYON']
      },
      {
        carrierId: 'carrier-2',
        carrierName: 'Logistique Rapide',
        transportTypes: ['FTL', 'LTL']
      },
      {
        carrierId: 'carrier-3',
        carrierName: 'Frigo Transport',
        transportTypes: ['FRIGO', 'FTL', 'EXPRESS']
      },
      {
        carrierId: 'carrier-4',
        carrierName: 'Messagerie Nationale',
        transportTypes: ['MESSAGERIE', 'EXPRESS', 'PALETTE']
      }
    ];

    // Vérifier la compatibilité
    const compatibilityResults = await IndustrialTransportConfig.checkMultipleCarriers(
      industrialId,
      demoCarriers
    );

    // Calculer les statistiques
    const compatible = compatibilityResults.filter(c => c.isCompatible).length;
    const incompatible = compatibilityResults.length - compatible;
    const totalScore = compatibilityResults.reduce((sum, c) => sum + c.score, 0);
    const averageScore = Math.round(totalScore / compatibilityResults.length);

    res.json({
      success: true,
      industrialId,
      configSummary: {
        requiredTypes: config.getRequiredTypes(),
        optionalTypes: config.getOptionalTypes(),
        mandatoryForCarriers: config.mandatoryForCarriers,
        autoRejectIncompatible: config.autoRejectIncompatible
      },
      carriers: compatibilityResults,
      statistics: {
        total: compatibilityResults.length,
        compatible,
        incompatible,
        compatibilityRate: Math.round((compatible / compatibilityResults.length) * 100),
        averageScore
      }
    });

  } catch (error) {
    console.error('Check carriers compatibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de compatibilité',
      error: error.message
    });
  }
});

module.exports = router;

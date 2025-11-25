/**
 * Industrial Transport Configuration Model
 *
 * Ce modèle permet aux industriels de configurer les types de transport
 * qu'ils attendent de la part des transporteurs.
 *
 * Service: subscriptions-contracts v2.5.0
 * Collection: industrial_transport_configs
 */

const mongoose = require('mongoose');
const { TRANSPORT_TYPES } = require('./PricingGrids');

// ==========================================
// Schema: Type de Transport Requis
// ==========================================

const RequiredTransportTypeSchema = new mongoose.Schema({
  transportType: {
    type: String,
    required: true,
    enum: Object.values(TRANSPORT_TYPES),
    description: 'Type de transport'
  },

  isRequired: {
    type: Boolean,
    default: true,
    description: 'Ce type est-il obligatoire pour référencer le transporteur ?'
  },

  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
    description: 'Priorité (0 = faible, 10 = élevée)'
  },

  notes: {
    type: String,
    maxlength: 500,
    description: 'Notes sur ce type de transport'
  },

  addedAt: {
    type: Date,
    default: Date.now,
    description: 'Date d\'ajout de ce type'
  }
}, { _id: false });

// ==========================================
// Schema Principal: Configuration Industriel
// ==========================================

const IndustrialTransportConfigSchema = new mongoose.Schema({
  // Industriel concerné
  industrialId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    description: 'ID de l\'industriel'
  },

  // Types de transport attendus
  transportTypes: {
    type: [RequiredTransportTypeSchema],
    default: [],
    description: 'Types de transport attendus par l\'industriel'
  },

  // Options de configuration
  mandatoryForCarriers: {
    type: Boolean,
    default: true,
    description: 'Les transporteurs doivent-ils avoir AU MOINS UN type requis ?'
  },

  autoRejectIncompatible: {
    type: Boolean,
    default: false,
    description: 'Rejeter automatiquement les transporteurs sans types requis ?'
  },

  // Métadonnées
  configuredBy: {
    type: String,
    description: 'ID de l\'utilisateur qui a configuré'
  },

  lastModifiedBy: {
    type: String,
    description: 'ID du dernier modificateur'
  },

  notes: {
    type: String,
    maxlength: 2000,
    description: 'Notes internes sur la configuration'
  }

}, {
  timestamps: true,  // createdAt, updatedAt
  collection: 'industrial_transport_configs'
});

// ==========================================
// Index
// ==========================================

IndustrialTransportConfigSchema.index({ industrialId: 1 });
IndustrialTransportConfigSchema.index({ 'transportTypes.transportType': 1 });

// ==========================================
// Méthodes d'Instance
// ==========================================

/**
 * Obtenir les types de transport requis (obligatoires)
 */
IndustrialTransportConfigSchema.methods.getRequiredTypes = function() {
  return this.transportTypes
    .filter(t => t.isRequired)
    .map(t => t.transportType);
};

/**
 * Obtenir les types de transport optionnels
 */
IndustrialTransportConfigSchema.methods.getOptionalTypes = function() {
  return this.transportTypes
    .filter(t => !t.isRequired)
    .map(t => t.transportType);
};

/**
 * Vérifier si un transporteur est compatible
 *
 * @param {string[]} carrierTransportTypes - Types de transport du transporteur
 * @returns {Object} Résultat de compatibilité
 */
IndustrialTransportConfigSchema.methods.checkCarrierCompatibility = function(carrierTransportTypes) {
  const requiredTypes = this.getRequiredTypes();
  const optionalTypes = this.getOptionalTypes();

  // Types requis manquants
  const missingRequired = requiredTypes.filter(type => !carrierTransportTypes.includes(type));

  // Types requis présents
  const matchingRequired = requiredTypes.filter(type => carrierTransportTypes.includes(type));

  // Types optionnels présents
  const matchingOptional = optionalTypes.filter(type => carrierTransportTypes.includes(type));

  // Types du transporteur non attendus par l'industriel
  const allExpectedTypes = [...requiredTypes, ...optionalTypes];
  const extraTypes = carrierTransportTypes.filter(type => !allExpectedTypes.includes(type));

  // Calculer le score de compatibilité (0-100)
  let score = 0;

  if (requiredTypes.length > 0) {
    // Score basé sur les types requis (80% du score)
    const requiredScore = (matchingRequired.length / requiredTypes.length) * 80;
    score += requiredScore;

    // Score basé sur les types optionnels (20% du score)
    if (optionalTypes.length > 0) {
      const optionalScore = (matchingOptional.length / optionalTypes.length) * 20;
      score += optionalScore;
    } else {
      score += 20; // Bonus si pas de types optionnels
    }
  } else {
    // Si pas de types requis, score basé uniquement sur les optionnels
    if (optionalTypes.length > 0) {
      score = (matchingOptional.length / optionalTypes.length) * 100;
    } else {
      score = 100; // Pas de configuration = compatible
    }
  }

  score = Math.round(score);

  // Déterminer si compatible
  let isCompatible = true;
  let reason = 'Compatible';

  if (this.mandatoryForCarriers && missingRequired.length > 0) {
    isCompatible = false;
    reason = `Types requis manquants: ${missingRequired.join(', ')}`;
  }

  return {
    isCompatible,
    score,
    reason,
    required: {
      expected: requiredTypes,
      matching: matchingRequired,
      missing: missingRequired
    },
    optional: {
      expected: optionalTypes,
      matching: matchingOptional
    },
    extra: extraTypes,
    recommendation: score >= 80 ? 'Excellent match' :
                    score >= 60 ? 'Good match' :
                    score >= 40 ? 'Partial match' :
                    'Low compatibility'
  };
};

/**
 * Ajouter un type de transport
 */
IndustrialTransportConfigSchema.methods.addTransportType = function(transportType, isRequired = true, priority = 5) {
  // Vérifier si le type existe déjà
  const exists = this.transportTypes.some(t => t.transportType === transportType);

  if (exists) {
    throw new Error(`Type de transport ${transportType} déjà configuré`);
  }

  this.transportTypes.push({
    transportType,
    isRequired,
    priority,
    addedAt: new Date()
  });

  // Trier par priorité décroissante
  this.transportTypes.sort((a, b) => b.priority - a.priority);

  return this;
};

/**
 * Retirer un type de transport
 */
IndustrialTransportConfigSchema.methods.removeTransportType = function(transportType) {
  this.transportTypes = this.transportTypes.filter(t => t.transportType !== transportType);
  return this;
};

/**
 * Mettre à jour un type de transport
 */
IndustrialTransportConfigSchema.methods.updateTransportType = function(transportType, updates) {
  const typeConfig = this.transportTypes.find(t => t.transportType === transportType);

  if (!typeConfig) {
    throw new Error(`Type de transport ${transportType} non trouvé`);
  }

  if (updates.isRequired !== undefined) {
    typeConfig.isRequired = updates.isRequired;
  }

  if (updates.priority !== undefined) {
    typeConfig.priority = updates.priority;
  }

  if (updates.notes !== undefined) {
    typeConfig.notes = updates.notes;
  }

  // Re-trier par priorité
  this.transportTypes.sort((a, b) => b.priority - a.priority);

  return this;
};

// ==========================================
// Méthodes Statiques
// ==========================================

/**
 * Créer ou mettre à jour la configuration pour un industriel
 */
IndustrialTransportConfigSchema.statics.upsertConfig = async function(industrialId, config, userId) {
  const existing = await this.findOne({ industrialId });

  if (existing) {
    // Mise à jour
    Object.assign(existing, config);
    existing.lastModifiedBy = userId;
    return existing.save();
  } else {
    // Création
    return this.create({
      industrialId,
      ...config,
      configuredBy: userId,
      lastModifiedBy: userId
    });
  }
};

/**
 * Obtenir la configuration pour un industriel (ou créer vide)
 */
IndustrialTransportConfigSchema.statics.getOrCreateConfig = async function(industrialId) {
  let config = await this.findOne({ industrialId });

  if (!config) {
    config = await this.create({
      industrialId,
      transportTypes: [],
      mandatoryForCarriers: true,
      autoRejectIncompatible: false
    });
  }

  return config;
};

/**
 * Vérifier la compatibilité de plusieurs transporteurs
 */
IndustrialTransportConfigSchema.statics.checkMultipleCarriers = async function(industrialId, carriers) {
  const config = await this.findOne({ industrialId });

  if (!config) {
    // Pas de configuration = tous compatibles
    return carriers.map(carrier => ({
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      isCompatible: true,
      score: 100,
      reason: 'Aucune configuration définie'
    }));
  }

  return carriers.map(carrier => {
    const compatibility = config.checkCarrierCompatibility(carrier.transportTypes || []);

    return {
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      ...compatibility
    };
  });
};

// ==========================================
// Export
// ==========================================

const IndustrialTransportConfig = mongoose.model('IndustrialTransportConfig', IndustrialTransportConfigSchema);

module.exports = {
  IndustrialTransportConfig
};

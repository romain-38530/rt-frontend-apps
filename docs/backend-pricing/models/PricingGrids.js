/**
 * Pricing Grids Models - Grilles Tarifaires Transport
 *
 * Ce modèle permet aux transporteurs de définir leurs grilles tarifaires
 * pour différents types de transport avec des zones géographiques et options.
 *
 * Service: subscriptions-contracts v2.5.0
 * Collection: pricing_grids
 */

const mongoose = require('mongoose');

// ==========================================
// Enums et Constantes
// ==========================================

/**
 * Types de Transport Disponibles (10)
 */
const TRANSPORT_TYPES = {
  FTL: 'FTL',                    // Full Truck Load (complet)
  LTL: 'LTL',                    // Less Than Truck Load (groupage)
  ADR: 'ADR',                    // Matières dangereuses
  FRIGO: 'FRIGO',                // Transport frigorifique
  HAYON: 'HAYON',                // Hayon élévateur
  MESSAGERIE: 'MESSAGERIE',      // Colis/messagerie
  EXPRESS: 'EXPRESS',            // Livraison express
  PALETTE: 'PALETTE',            // Transport par palettes
  VRAC: 'VRAC',                  // Transport en vrac
  BENNE: 'BENNE'                 // Transport benne
};

/**
 * Types de Calcul de Prix (6)
 */
const CALCULATION_TYPES = {
  PER_KM: 'PER_KM',              // Prix au kilomètre
  FLAT_RATE: 'FLAT_RATE',        // Prix forfaitaire
  PER_WEIGHT: 'PER_WEIGHT',      // Prix au poids (kg)
  PER_VOLUME: 'PER_VOLUME',      // Prix au volume (m³)
  PER_PALLET: 'PER_PALLET',      // Prix par palette
  HYBRID: 'HYBRID'               // Combinaison de plusieurs types
};

/**
 * Zones Géographiques (23)
 * 13 régions françaises + 10 pays européens
 */
const GEOGRAPHIC_ZONES = {
  // Régions France
  IDF: 'Île-de-France',
  AURA: 'Auvergne-Rhône-Alpes',
  BFC: 'Bourgogne-Franche-Comté',
  BRE: 'Bretagne',
  CVL: 'Centre-Val de Loire',
  GRAND_EST: 'Grand Est',
  HDF: 'Hauts-de-France',
  NORMANDIE: 'Normandie',
  NAQ: 'Nouvelle-Aquitaine',
  OCC: 'Occitanie',
  PDL: 'Pays de la Loire',
  PACA: 'Provence-Alpes-Côte d\'Azur',
  CORSE: 'Corse',

  // Pays Europe
  BE: 'Belgique',
  LU: 'Luxembourg',
  DE: 'Allemagne',
  CH: 'Suisse',
  IT: 'Italie',
  ES: 'Espagne',
  PT: 'Portugal',
  NL: 'Pays-Bas',
  UK: 'Royaume-Uni',
  AT: 'Autriche'
};

/**
 * Options Tarifaires (9)
 */
const PRICING_OPTIONS = {
  ADR: {
    name: 'ADR',
    description: 'Transport de matières dangereuses',
    type: 'percentage',  // ou 'fixed'
    defaultValue: 25     // 25% de majoration
  },
  HAYON: {
    name: 'HAYON',
    description: 'Hayon élévateur',
    type: 'fixed',
    defaultValue: 50     // 50€ fixe
  },
  FRIGO: {
    name: 'FRIGO',
    description: 'Transport frigorifique',
    type: 'percentage',
    defaultValue: 20     // 20% de majoration
  },
  EXPRESS: {
    name: 'EXPRESS',
    description: 'Livraison express (<24h)',
    type: 'percentage',
    defaultValue: 30     // 30% de majoration
  },
  MULTIPOINT: {
    name: 'MULTIPOINT',
    description: 'Livraison multi-points',
    type: 'fixed',
    defaultValue: 40     // 40€ par point supplémentaire
  },
  FRAGILE: {
    name: 'FRAGILE',
    description: 'Marchandise fragile',
    type: 'percentage',
    defaultValue: 10     // 10% de majoration
  },
  OVERSIZE: {
    name: 'OVERSIZE',
    description: 'Hors gabarit',
    type: 'percentage',
    defaultValue: 35     // 35% de majoration
  },
  WEEKEND: {
    name: 'WEEKEND',
    description: 'Livraison weekend',
    type: 'percentage',
    defaultValue: 40     // 40% de majoration
  },
  NIGHT: {
    name: 'NIGHT',
    description: 'Livraison de nuit',
    type: 'percentage',
    defaultValue: 50     // 50% de majoration
  }
};

/**
 * Statuts des Grilles Tarifaires
 */
const GRID_STATUS = {
  DRAFT: 'DRAFT',           // Brouillon (modifiable, non visible)
  ACTIVE: 'ACTIVE',         // Active (visible et utilisée)
  SUSPENDED: 'SUSPENDED',   // Suspendue (visible mais non utilisée)
  ARCHIVED: 'ARCHIVED'      // Archivée (historique seulement)
};

// ==========================================
// Schema: Paliers de Prix (Tiers)
// ==========================================

const TierSchema = new mongoose.Schema({
  // Seuils
  minValue: {
    type: Number,
    required: true,
    min: 0,
    description: 'Valeur minimale (kg, m³, km, palettes...)'
  },
  maxValue: {
    type: Number,
    default: null,  // null = infini
    description: 'Valeur maximale (null = infini)'
  },

  // Prix
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    description: 'Prix de base pour ce palier'
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Prix par unité (si applicable)'
  }
}, { _id: false });

// ==========================================
// Schema: Zone Tarifaire
// ==========================================

const ZoneRateSchema = new mongoose.Schema({
  zone: {
    type: String,
    required: true,
    enum: Object.keys(GEOGRAPHIC_ZONES),
    description: 'Code de la zone géographique'
  },

  // Multiplicateur de prix pour cette zone
  priceMultiplier: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0,
    description: 'Multiplicateur de prix (1.0 = 100%, 1.2 = +20%)'
  },

  // Supplément fixe pour cette zone
  fixedSupplement: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Supplément fixe en euros'
  },

  // Délai de livraison estimé (en jours)
  estimatedDeliveryDays: {
    type: Number,
    default: 1,
    min: 0,
    description: 'Délai de livraison en jours ouvrés'
  }
}, { _id: false });

// ==========================================
// Schema: Option Tarifaire Personnalisée
// ==========================================

const CustomOptionSchema = new mongoose.Schema({
  optionCode: {
    type: String,
    required: true,
    enum: Object.keys(PRICING_OPTIONS),
    description: 'Code de l\'option'
  },

  // Surcharge du type (percentage ou fixed)
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    description: 'Type de majoration'
  },

  // Surcharge de la valeur
  value: {
    type: Number,
    required: true,
    min: 0,
    description: 'Valeur de la majoration'
  },

  enabled: {
    type: Boolean,
    default: true,
    description: 'Option activée ou non'
  }
}, { _id: false });

// ==========================================
// Schema Principal: Grille Tarifaire
// ==========================================

const PricingGridSchema = new mongoose.Schema({
  // Identité de la grille
  gridName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    description: 'Nom de la grille tarifaire'
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    description: 'Description détaillée'
  },

  // Propriétaire (transporteur)
  carrierId: {
    type: String,
    required: true,
    index: true,
    description: 'ID du transporteur propriétaire'
  },

  // Type de transport
  transportType: {
    type: String,
    required: true,
    enum: Object.values(TRANSPORT_TYPES),
    index: true,
    description: 'Type de transport concerné'
  },

  // Type de calcul
  calculationType: {
    type: String,
    required: true,
    enum: Object.values(CALCULATION_TYPES),
    description: 'Méthode de calcul du prix'
  },

  // Statut
  status: {
    type: String,
    required: true,
    enum: Object.values(GRID_STATUS),
    default: GRID_STATUS.DRAFT,
    index: true,
    description: 'Statut de la grille'
  },

  // Paliers de prix
  tiers: {
    type: [TierSchema],
    default: [],
    validate: {
      validator: function(tiers) {
        // Vérifier que les paliers ne se chevauchent pas
        for (let i = 0; i < tiers.length - 1; i++) {
          const current = tiers[i];
          const next = tiers[i + 1];

          if (current.maxValue && next.minValue < current.maxValue) {
            return false; // Chevauchement détecté
          }
        }
        return true;
      },
      message: 'Les paliers ne doivent pas se chevaucher'
    }
  },

  // Zones géographiques
  zones: {
    type: [ZoneRateSchema],
    default: [],
    description: 'Tarification par zone géographique'
  },

  // Options tarifaires
  options: {
    type: [CustomOptionSchema],
    default: [],
    description: 'Options tarifaires disponibles'
  },

  // Paramètres globaux
  minOrder: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Montant minimum de commande (€)'
  },

  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP', 'CHF'],
    description: 'Devise'
  },

  // Validité temporelle
  validFrom: {
    type: Date,
    default: Date.now,
    description: 'Date de début de validité'
  },

  validUntil: {
    type: Date,
    default: null,  // null = pas de date de fin
    description: 'Date de fin de validité (null = indéfini)'
  },

  // Métadonnées
  createdBy: {
    type: String,
    description: 'ID de l\'utilisateur créateur'
  },

  lastModifiedBy: {
    type: String,
    description: 'ID du dernier modificateur'
  },

  notes: {
    type: String,
    maxlength: 2000,
    description: 'Notes internes'
  }

}, {
  timestamps: true,  // createdAt, updatedAt
  collection: 'pricing_grids'
});

// ==========================================
// Index
// ==========================================

PricingGridSchema.index({ carrierId: 1, transportType: 1, status: 1 });
PricingGridSchema.index({ status: 1, validFrom: 1, validUntil: 1 });
PricingGridSchema.index({ transportType: 1, status: 1 });

// ==========================================
// Méthodes d'Instance
// ==========================================

/**
 * Vérifier si la grille est valide à une date donnée
 */
PricingGridSchema.methods.isValidAt = function(date = new Date()) {
  if (this.status !== GRID_STATUS.ACTIVE) return false;
  if (this.validFrom && date < this.validFrom) return false;
  if (this.validUntil && date > this.validUntil) return false;
  return true;
};

/**
 * Calculer le prix pour une demande de transport
 *
 * @param {Object} request - Demande de transport
 * @param {string} request.originZone - Zone d'origine
 * @param {string} request.destinationZone - Zone de destination
 * @param {number} request.distance - Distance en km (si PER_KM)
 * @param {number} request.weight - Poids en kg (si PER_WEIGHT)
 * @param {number} request.volume - Volume en m³ (si PER_VOLUME)
 * @param {number} request.palletCount - Nombre de palettes (si PER_PALLET)
 * @param {string[]} request.options - Options demandées
 * @returns {Object} Détails du calcul de prix
 */
PricingGridSchema.methods.calculatePrice = function(request) {
  const breakdown = {
    basePrice: 0,
    zoneModifier: 0,
    optionsTotal: 0,
    subtotal: 0,
    finalPrice: 0,
    currency: this.currency,
    details: []
  };

  // 1. Calculer le prix de base selon le type de calcul
  let baseValue = 0;
  let unitLabel = '';

  switch (this.calculationType) {
    case CALCULATION_TYPES.PER_KM:
      baseValue = request.distance || 0;
      unitLabel = 'km';
      break;
    case CALCULATION_TYPES.PER_WEIGHT:
      baseValue = request.weight || 0;
      unitLabel = 'kg';
      break;
    case CALCULATION_TYPES.PER_VOLUME:
      baseValue = request.volume || 0;
      unitLabel = 'm³';
      break;
    case CALCULATION_TYPES.PER_PALLET:
      baseValue = request.palletCount || 0;
      unitLabel = 'palettes';
      break;
    case CALCULATION_TYPES.FLAT_RATE:
      baseValue = 1;
      unitLabel = 'forfait';
      break;
    case CALCULATION_TYPES.HYBRID:
      // Pour HYBRID, on pourrait combiner plusieurs facteurs
      baseValue = (request.distance || 0) + (request.weight || 0) * 0.1;
      unitLabel = 'mixte';
      break;
  }

  // Trouver le palier approprié
  const tier = this.tiers.find(t => {
    return baseValue >= t.minValue && (t.maxValue === null || baseValue <= t.maxValue);
  });

  if (!tier) {
    breakdown.details.push({
      label: 'Aucun palier trouvé',
      value: 0,
      unit: unitLabel
    });
    return breakdown;
  }

  // Prix de base = basePrice du palier + (valeur × unitPrice)
  breakdown.basePrice = tier.basePrice + (baseValue * tier.unitPrice);
  breakdown.details.push({
    label: `Prix de base (${baseValue} ${unitLabel})`,
    value: breakdown.basePrice,
    calculation: `${tier.basePrice}€ + (${baseValue} × ${tier.unitPrice}€)`
  });

  // 2. Appliquer le modificateur de zone
  const destinationZoneRate = this.zones.find(z => z.zone === request.destinationZone);

  if (destinationZoneRate) {
    const zoneMultiplier = destinationZoneRate.priceMultiplier;
    const zoneSupplement = destinationZoneRate.fixedSupplement;

    breakdown.zoneModifier = (breakdown.basePrice * (zoneMultiplier - 1)) + zoneSupplement;
    breakdown.details.push({
      label: `Zone ${GEOGRAPHIC_ZONES[request.destinationZone]}`,
      value: breakdown.zoneModifier,
      calculation: `${breakdown.basePrice}€ × ${zoneMultiplier} + ${zoneSupplement}€`
    });
  }

  breakdown.subtotal = breakdown.basePrice + breakdown.zoneModifier;

  // 3. Appliquer les options
  if (request.options && request.options.length > 0) {
    request.options.forEach(optCode => {
      const customOption = this.options.find(o => o.optionCode === optCode && o.enabled);

      if (customOption) {
        let optionPrice = 0;

        if (customOption.type === 'percentage') {
          optionPrice = breakdown.subtotal * (customOption.value / 100);
        } else {
          optionPrice = customOption.value;
        }

        breakdown.optionsTotal += optionPrice;
        breakdown.details.push({
          label: PRICING_OPTIONS[optCode].description,
          value: optionPrice,
          calculation: customOption.type === 'percentage'
            ? `${customOption.value}%`
            : `${customOption.value}€ fixe`
        });
      }
    });
  }

  // 4. Prix final
  breakdown.finalPrice = breakdown.subtotal + breakdown.optionsTotal;

  // 5. Vérifier le montant minimum
  if (breakdown.finalPrice < this.minOrder) {
    breakdown.details.push({
      label: 'Commande minimum appliquée',
      value: this.minOrder - breakdown.finalPrice,
      calculation: `Minimum ${this.minOrder}€`
    });
    breakdown.finalPrice = this.minOrder;
  }

  // Arrondir à 2 décimales
  breakdown.basePrice = Math.round(breakdown.basePrice * 100) / 100;
  breakdown.zoneModifier = Math.round(breakdown.zoneModifier * 100) / 100;
  breakdown.optionsTotal = Math.round(breakdown.optionsTotal * 100) / 100;
  breakdown.subtotal = Math.round(breakdown.subtotal * 100) / 100;
  breakdown.finalPrice = Math.round(breakdown.finalPrice * 100) / 100;

  return breakdown;
};

// ==========================================
// Méthodes Statiques
// ==========================================

/**
 * Récupérer les grilles actives pour un transporteur et un type de transport
 */
PricingGridSchema.statics.getActiveGrids = function(carrierId, transportType = null) {
  const query = {
    carrierId,
    status: GRID_STATUS.ACTIVE,
    validFrom: { $lte: new Date() },
    $or: [
      { validUntil: null },
      { validUntil: { $gte: new Date() } }
    ]
  };

  if (transportType) {
    query.transportType = transportType;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// ==========================================
// Export
// ==========================================

const PricingGrid = mongoose.model('PricingGrid', PricingGridSchema);

module.exports = {
  PricingGrid,
  TRANSPORT_TYPES,
  CALCULATION_TYPES,
  GEOGRAPHIC_ZONES,
  PRICING_OPTIONS,
  GRID_STATUS
};

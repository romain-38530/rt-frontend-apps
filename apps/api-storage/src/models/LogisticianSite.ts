/**
 * Model: LogisticianSite
 * Site/Entrepôt d'un logisticien avec ses capacités
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ILogisticianSite extends Document {
  logisticianId: string;
  logisticianName: string;

  // Informations du site
  name: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Capacités
  totalCapacity: {
    unit: string;
    quantity: number;
  };
  availableCapacity: {
    unit: string;
    quantity: number;
  };
  reservedCapacity?: {
    unit: string;
    quantity: number;
  };

  // Types de stockage possibles
  storageTypes: string[];
  temperatureConditions: string[];

  // Infrastructure
  ceilingHeight: number;
  docksCount: number;
  handlingEquipment: string[];
  securityFeatures: string[];

  // Certifications
  certifications: string[];
  adrAuthorized: boolean;
  adrClasses?: string[];
  customsAuthorized: boolean;

  // WMS & Intégration
  wmsSystem?: string;
  apiAvailable: boolean;
  realTimeTracking: boolean;

  // Tarification
  pricing: {
    pricePerSqmMonth?: number;
    pricePerPaletteMonth?: number;
    pricePerMovement?: number;
    setupFees?: number;
    currency: string;
  };

  // Disponibilité
  operatingHours: {
    start: string;
    end: string;
    days: string[];
  };

  // Status
  active: boolean;
  verified: boolean;
  lastCapacityUpdate: Date;

  createdAt: Date;
  updatedAt: Date;
}

const LogisticianSiteSchema = new Schema<ILogisticianSite>({
  logisticianId: { type: String, required: true, index: true },
  logisticianName: { type: String, required: true },

  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  region: { type: String, required: true, index: true },
  country: { type: String, required: true, index: true },
  coordinates: {
    latitude: Number,
    longitude: Number
  },

  totalCapacity: {
    unit: { type: String, enum: ['sqm', 'pallets', 'linear_meters', 'cbm'], required: true },
    quantity: { type: Number, required: true }
  },
  availableCapacity: {
    unit: { type: String, enum: ['sqm', 'pallets', 'linear_meters', 'cbm'], required: true },
    quantity: { type: Number, required: true }
  },
  reservedCapacity: {
    unit: String,
    quantity: Number
  },

  storageTypes: [{
    type: String,
    enum: ['long_term', 'temporary', 'picking', 'cross_dock', 'customs', 'temperature']
  }],
  temperatureConditions: [{
    type: String,
    enum: ['ambient', 'refrigerated', 'frozen', 'controlled']
  }],

  ceilingHeight: { type: Number, default: 10 },
  docksCount: { type: Number, default: 1 },
  handlingEquipment: [String],
  securityFeatures: [String],

  certifications: [String],
  adrAuthorized: { type: Boolean, default: false },
  adrClasses: [String],
  customsAuthorized: { type: Boolean, default: false },

  wmsSystem: String,
  apiAvailable: { type: Boolean, default: false },
  realTimeTracking: { type: Boolean, default: false },

  pricing: {
    pricePerSqmMonth: Number,
    pricePerPaletteMonth: Number,
    pricePerMovement: Number,
    setupFees: Number,
    currency: { type: String, default: 'EUR' }
  },

  operatingHours: {
    start: { type: String, default: '08:00' },
    end: { type: String, default: '18:00' },
    days: { type: [String], default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
  },

  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  lastCapacityUpdate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index géospatial pour recherche par proximité
LogisticianSiteSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
LogisticianSiteSchema.index({ storageTypes: 1, temperatureConditions: 1 });
LogisticianSiteSchema.index({ active: 1, 'availableCapacity.quantity': -1 });

export default mongoose.model<ILogisticianSite>('LogisticianSite', LogisticianSiteSchema);

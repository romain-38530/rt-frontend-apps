/**
 * Model: Site
 * Site logistique (entrepôt, usine, fournisseur, destinataire)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
  reference: string;

  // Propriétaire
  ownerOrgId: string;
  ownerOrgName: string;
  ownerType: 'logistician' | 'industrial' | 'supplier' | 'recipient';

  // Informations
  name: string;
  type: 'warehouse' | 'factory' | 'supplier' | 'recipient' | 'cross_dock';
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;

  // Géolocalisation & Géofence
  geofence: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };

  // Horaires d'ouverture
  operatingHours: {
    dayOfWeek: number;
    open: string;
    close: string;
    breakStart?: string;
    breakEnd?: string;
  }[];

  // Jours fériés et fermetures
  holidays: string[];
  exceptionalClosures: {
    date: string;
    reason: string;
  }[];

  // Configuration créneaux
  defaultSlotDuration: number;
  slotCapacity: number;

  // Contraintes
  constraints: {
    maxTruckLength?: number;
    maxTruckWeight?: number;
    requiresBadge: boolean;
    requiresAppointment: boolean;
    adrAuthorized: boolean;
    temperatureControlled: boolean;
    minBookingNotice: number;
    maxBookingAdvance: number;
    toleranceMinutes: number;
  };

  // Contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Instructions
  accessInstructions?: string;
  securityInstructions?: string;
  parkingInstructions?: string;

  // Statut
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISite>({
  reference: { type: String, required: true, unique: true },

  ownerOrgId: { type: String, required: true, index: true },
  ownerOrgName: { type: String, required: true },
  ownerType: {
    type: String,
    enum: ['logistician', 'industrial', 'supplier', 'recipient'],
    required: true
  },

  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['warehouse', 'factory', 'supplier', 'recipient', 'cross_dock'],
    required: true
  },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  region: { type: String, required: true },
  country: { type: String, default: 'France' },

  geofence: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 500 }
  },

  operatingHours: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    open: String,
    close: String,
    breakStart: String,
    breakEnd: String
  }],

  holidays: [String],
  exceptionalClosures: [{
    date: String,
    reason: String
  }],

  defaultSlotDuration: { type: Number, default: 60 },
  slotCapacity: { type: Number, default: 1 },

  constraints: {
    maxTruckLength: Number,
    maxTruckWeight: Number,
    requiresBadge: { type: Boolean, default: false },
    requiresAppointment: { type: Boolean, default: true },
    adrAuthorized: { type: Boolean, default: false },
    temperatureControlled: { type: Boolean, default: false },
    minBookingNotice: { type: Number, default: 4 },
    maxBookingAdvance: { type: Number, default: 30 },
    toleranceMinutes: { type: Number, default: 30 }
  },

  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },

  accessInstructions: String,
  securityInstructions: String,
  parkingInstructions: String,

  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Auto-génération de la référence
SiteSchema.pre('save', async function(next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Site').countDocuments();
    this.reference = `SITE-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index géospatial
SiteSchema.index({ 'geofence.latitude': 1, 'geofence.longitude': 1 });
SiteSchema.index({ ownerOrgId: 1, active: 1 });
SiteSchema.index({ city: 1, region: 1 });

export default mongoose.model<ISite>('Site', SiteSchema);

/**
 * Modèle Site - Représente un site/entrepôt
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteGeofence {
  type: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number; // in meters
  radiusMeters?: number; // alias for radius
  latitude?: number; // shorthand for center.lat
  longitude?: number; // shorthand for center.lng
  coordinates?: { lat: number; lng: number }[];
}

export interface ISiteOperatingHour {
  dayOfWeek: number; // 0-6, Sunday = 0
  open?: string;     // "08:00"
  close?: string;    // "18:00"
  openTime?: string; // alias for open
  closeTime?: string; // alias for close
}

export interface ISite extends Document {
  siteId: string;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  industrialId: string;
  isActive: boolean;
  openingHours: ISiteOperatingHour[];
  operatingHours: ISiteOperatingHour[]; // alias for openingHours
  defaultSlotDuration?: number; // in minutes
  holidays?: string[]; // Array of date strings "YYYY-MM-DD"
  // Extended properties for driver app
  geofence?: ISiteGeofence;
  accessInstructions?: string;
  securityInstructions?: string;
  parkingInstructions?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISite>({
  siteId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'France' }
  },
  industrialId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true },
  openingHours: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    open: { type: String },
    close: { type: String },
    openTime: { type: String },
    closeTime: { type: String }
  }],
  operatingHours: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    open: { type: String },
    close: { type: String },
    openTime: { type: String },
    closeTime: { type: String }
  }],
  defaultSlotDuration: { type: Number, default: 30 },
  holidays: [{ type: String }],
  // Extended properties for driver app
  geofence: {
    type: { type: String, enum: ['circle', 'polygon'] },
    center: {
      lat: { type: Number },
      lng: { type: Number }
    },
    radius: { type: Number },
    radiusMeters: { type: Number },
    latitude: { type: Number },
    longitude: { type: Number },
    coordinates: [{
      lat: { type: Number },
      lng: { type: Number }
    }]
  },
  accessInstructions: { type: String },
  securityInstructions: { type: String },
  parkingInstructions: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String }
}, {
  timestamps: true
});

SiteSchema.index({ industrialId: 1, isActive: 1 });

export default mongoose.model<ISite>('Site', SiteSchema);

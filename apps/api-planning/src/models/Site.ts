/**
 * Modèle Site - Représente un site/entrepôt
 */
import mongoose, { Document, Schema } from 'mongoose';

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
  openingHours: {
    dayOfWeek: number; // 0-6, Sunday = 0
    openTime: string;  // "08:00"
    closeTime: string; // "18:00"
  }[];
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
    openTime: { type: String },
    closeTime: { type: String }
  }]
}, {
  timestamps: true
});

SiteSchema.index({ industrialId: 1, isActive: 1 });

export default mongoose.model<ISite>('Site', SiteSchema);

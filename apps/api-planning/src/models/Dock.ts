/**
 * Model: Dock
 * Quai de chargement/déchargement
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDock extends Document {
  siteId: string;

  // Identification
  name: string;
  number: number;
  type: 'loading' | 'unloading' | 'mixed' | 'adr' | 'temperature_controlled';

  // Capacité
  capacity: number;
  maxTruckLength?: number;
  maxTruckHeight?: number;

  // Équipements
  hasForklift: boolean;
  hasRamp: boolean;
  hasDockLeveler: boolean;
  hasRefrigeration: boolean;

  // Statut
  status: 'available' | 'occupied' | 'maintenance' | 'blocked';
  statusReason?: string;
  currentBookingId?: string;

  // Contraintes spéciales
  adrOnly: boolean;
  temperatureOnly: boolean;
  priorityTransporters: string[];

  // Ordre d'affichage
  displayOrder: number;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DockSchema = new Schema<IDock>({
  siteId: { type: String, required: true, index: true },

  name: { type: String, required: true },
  number: { type: Number, required: true },
  type: {
    type: String,
    enum: ['loading', 'unloading', 'mixed', 'adr', 'temperature_controlled'],
    default: 'mixed'
  },

  capacity: { type: Number, default: 1 },
  maxTruckLength: Number,
  maxTruckHeight: Number,

  hasForklift: { type: Boolean, default: false },
  hasRamp: { type: Boolean, default: false },
  hasDockLeveler: { type: Boolean, default: false },
  hasRefrigeration: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'blocked'],
    default: 'available'
  },
  statusReason: String,
  currentBookingId: String,

  adrOnly: { type: Boolean, default: false },
  temperatureOnly: { type: Boolean, default: false },
  priorityTransporters: [String],

  displayOrder: { type: Number, default: 0 },

  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index composites
DockSchema.index({ siteId: 1, status: 1 });
DockSchema.index({ siteId: 1, number: 1 }, { unique: true });
DockSchema.index({ siteId: 1, type: 1, active: 1 });

export default mongoose.model<IDock>('Dock', DockSchema);

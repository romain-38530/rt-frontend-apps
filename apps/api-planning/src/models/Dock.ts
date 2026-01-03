/**
 * Modèle Dock - Représente un quai de chargement/déchargement
 */
import mongoose, { Document, Schema } from 'mongoose';

export type DockStatus = 'available' | 'occupied' | 'maintenance' | 'closed';
export type DockType = 'loading' | 'unloading' | 'both' | 'adr';

export interface IDock extends Document {
  dockId: string;
  siteId: string;
  name: string;
  type: DockType;
  status: DockStatus;
  capacity: number; // Nombre de véhicules simultanés
  isActive: boolean;
  features: string[]; // ex: ['hayon', 'frigorifique', 'matières-dangereuses']
  notes: string;
  // Extended properties for AI routing
  adrOnly?: boolean;
  hasRefrigeration?: boolean;
  currentBookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DockSchema = new Schema<IDock>({
  dockId: { type: String, required: true, unique: true },
  siteId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['loading', 'unloading', 'both', 'adr'], default: 'both' },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'closed'], default: 'available' },
  capacity: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  features: [{ type: String }],
  notes: { type: String, default: '' },
  // Extended properties for AI routing
  adrOnly: { type: Boolean, default: false },
  hasRefrigeration: { type: Boolean, default: false },
  currentBookingId: { type: String }
}, {
  timestamps: true
});

DockSchema.index({ siteId: 1, status: 1 });
DockSchema.index({ siteId: 1, isActive: 1 });
DockSchema.index({ currentBookingId: 1 });

export default mongoose.model<IDock>('Dock', DockSchema);

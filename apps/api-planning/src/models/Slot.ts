/**
 * Modèle Slot - Représente un créneau horaire
 */
import mongoose, { Document, Schema } from 'mongoose';

export type SlotStatus = 'available' | 'reserved' | 'confirmed' | 'blocked' | 'completed' | 'cancelled';

export interface ISlot extends Document {
  slotId: string;
  dockId: string;
  siteId: string;
  date: Date;
  startTime: string;  // "08:00"
  endTime: string;    // "09:00"
  duration: number;   // en minutes
  status: SlotStatus;
  isBlocked: boolean;
  blockReason?: string;
  blockedBy?: string;
  blockedAt?: Date;
  bookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>({
  slotId: { type: String, required: true, unique: true },
  dockId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  status: { 
    type: String, 
    enum: ['available', 'reserved', 'confirmed', 'blocked', 'completed', 'cancelled'], 
    default: 'available' 
  },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  blockedBy: { type: String },
  blockedAt: { type: Date },
  bookingId: { type: String }
}, {
  timestamps: true
});

SlotSchema.index({ siteId: 1, date: 1, status: 1 });
SlotSchema.index({ dockId: 1, date: 1 });
SlotSchema.index({ date: 1, isBlocked: 1 });

export default mongoose.model<ISlot>('Slot', SlotSchema);

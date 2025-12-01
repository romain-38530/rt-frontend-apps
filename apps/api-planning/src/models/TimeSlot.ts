/**
 * Model: TimeSlot
 * Créneau horaire de planning
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeSlot extends Document {
  siteId: string;
  dockId: string;

  // Date et heure
  date: string;
  startTime: string;
  endTime: string;
  duration: number;

  // Type de flux
  flowType: 'FTL' | 'LTL' | 'express' | 'adr' | 'temperature' | 'messagerie';

  // Capacité
  totalCapacity: number;
  bookedCapacity: number;
  availableCapacity: number;

  // Statut
  status: 'available' | 'partial' | 'full' | 'blocked';
  blockedReason?: string;
  blockedBy?: string;

  // Priorités
  isPriority: boolean;
  isExpress: boolean;
  isAdr: boolean;

  // Réservations associées
  bookingIds: string[];

  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  siteId: { type: String, required: true, index: true },
  dockId: { type: String, required: true, index: true },

  date: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },

  flowType: {
    type: String,
    enum: ['FTL', 'LTL', 'express', 'adr', 'temperature', 'messagerie'],
    default: 'FTL'
  },

  totalCapacity: { type: Number, default: 1 },
  bookedCapacity: { type: Number, default: 0 },
  availableCapacity: { type: Number, default: 1 },

  status: {
    type: String,
    enum: ['available', 'partial', 'full', 'blocked'],
    default: 'available'
  },
  blockedReason: String,
  blockedBy: String,

  isPriority: { type: Boolean, default: false },
  isExpress: { type: Boolean, default: false },
  isAdr: { type: Boolean, default: false },

  bookingIds: [String]
}, {
  timestamps: true
});

// Update available capacity and status
TimeSlotSchema.pre('save', function(next) {
  this.availableCapacity = this.totalCapacity - this.bookedCapacity;

  if (this.status !== 'blocked') {
    if (this.availableCapacity <= 0) {
      this.status = 'full';
    } else if (this.bookedCapacity > 0) {
      this.status = 'partial';
    } else {
      this.status = 'available';
    }
  }
  next();
});

// Index composites
TimeSlotSchema.index({ siteId: 1, date: 1, status: 1 });
TimeSlotSchema.index({ dockId: 1, date: 1 });
TimeSlotSchema.index({ date: 1, startTime: 1 });
TimeSlotSchema.index({ siteId: 1, dockId: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);

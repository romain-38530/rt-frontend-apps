/**
 * Model: DriverCheckin
 * Check-in chauffeur sur site (Borne virtuelle)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverCheckin extends Document {
  bookingId: string;
  bookingReference: string;
  siteId: string;

  // Chauffeur
  driverName: string;
  driverPhone?: string;
  transporterOrgId: string;
  transporterName: string;

  // Véhicule
  plateNumber: string;
  trailerNumber?: string;

  // Mode de check-in
  checkinMode: 'app' | 'qr_code' | 'kiosk' | 'manual';
  checkinCode?: string;

  // Géolocalisation
  checkinLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isWithinGeofence: boolean;

  // Statut
  status: 'en_route' | 'arrived' | 'waiting' | 'called' | 'at_dock' | 'loading' | 'signing' | 'completed' | 'departed';

  // Quai assigné
  assignedDockId?: string;
  assignedDockName?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;

  // Timestamps
  arrivedAt?: Date;
  checkedInAt: Date;
  calledAt?: Date;
  atDockAt?: Date;
  loadingStartedAt?: Date;
  loadingEndedAt?: Date;
  signedAt?: Date;
  departedAt?: Date;

  // Instructions
  displayedInstructions?: string;
  securityAcknowledged: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const DriverCheckinSchema = new Schema<IDriverCheckin>({
  bookingId: { type: String, required: true, index: true },
  bookingReference: { type: String, required: true },
  siteId: { type: String, required: true, index: true },

  driverName: { type: String, required: true },
  driverPhone: String,
  transporterOrgId: { type: String, required: true, index: true },
  transporterName: { type: String, required: true },

  plateNumber: { type: String, required: true },
  trailerNumber: String,

  checkinMode: {
    type: String,
    enum: ['app', 'qr_code', 'kiosk', 'manual'],
    required: true
  },
  checkinCode: String,

  checkinLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  isWithinGeofence: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['en_route', 'arrived', 'waiting', 'called', 'at_dock', 'loading', 'signing', 'completed', 'departed'],
    default: 'waiting',
    index: true
  },

  assignedDockId: String,
  assignedDockName: String,
  queuePosition: Number,
  estimatedWaitMinutes: Number,

  arrivedAt: Date,
  checkedInAt: { type: Date, default: Date.now },
  calledAt: Date,
  atDockAt: Date,
  loadingStartedAt: Date,
  loadingEndedAt: Date,
  signedAt: Date,
  departedAt: Date,

  displayedInstructions: String,
  securityAcknowledged: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index composites
DriverCheckinSchema.index({ siteId: 1, status: 1 });
DriverCheckinSchema.index({ siteId: 1, checkedInAt: -1 });
DriverCheckinSchema.index({ bookingId: 1 }, { unique: true });

export default mongoose.model<IDriverCheckin>('DriverCheckin', DriverCheckinSchema);

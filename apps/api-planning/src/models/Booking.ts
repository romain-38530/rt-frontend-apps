/**
 * Modèle Booking - Représente une réservation de créneau
 */
import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'checked_in' | 'at_dock' | 'loading' | 'unloading';
export type BookingType = 'loading' | 'unloading';

export interface IBookingMetrics {
  waitTimeMinutes?: number;
  loadingTimeMinutes?: number;
  totalTimeMinutes?: number;
  delayMinutes?: number;
  dockTimeMinutes?: number;
}

export interface IBookingCargo {
  description?: string;
  palletCount?: number;
  weight?: number;
  volume?: number;
  adrClass?: string;
  isAdr?: boolean;
  requiresRefrigeration?: boolean;
  temperatureRequired?: number;
  palletCountActual?: number;
  weightActual?: number;
}

export interface IBookingTransporter {
  orgId?: string;
  orgName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface IBookingVehicle {
  plateNumber?: string;
  trailerNumber?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
}

export interface IBookingTimestamps {
  checkedInAt?: Date;
  atDockAt?: Date;
  loadingStartedAt?: Date;
  loadingCompletedAt?: Date;
  loadingEndedAt?: Date;
  departedAt?: Date;
  signedAt?: Date;
  calledAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
}

export interface IBookingStatusHistoryEntry {
  status: string;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
}

export interface IBookingSiteOwner {
  orgName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface IBookingRequester {
  orgName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface IBooking extends Document {
  bookingId: string;
  reference?: string;
  slotId: string;
  dockId: string;
  dockName?: string;
  siteId: string;
  siteName?: string;
  carrierId?: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  orderId?: string;
  orderReference?: string;
  type: BookingType;
  status: BookingStatus;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  requestedDate?: Date;
  confirmedDate?: Date;
  requestedTimeSlot?: { start: string; end: string };
  confirmedTimeSlot?: { start: string; end: string };
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  notes?: string;
  createdBy: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  // Extended properties
  metrics?: IBookingMetrics;
  cargo?: IBookingCargo;
  transporter?: IBookingTransporter;
  siteOwner?: IBookingSiteOwner;
  requester?: IBookingRequester;
  vehicle?: IBookingVehicle;
  timestamps?: IBookingTimestamps;
  statusHistory?: IBookingStatusHistoryEntry[];
  ecmrId?: string;
  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true },
  reference: { type: String },
  slotId: { type: String, required: true, index: true },
  dockId: { type: String, required: true, index: true },
  dockName: { type: String },
  siteId: { type: String, required: true, index: true },
  siteName: { type: String },
  carrierId: { type: String },
  carrierName: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  vehiclePlate: { type: String },
  orderId: { type: String },
  orderReference: { type: String },
  type: { type: String, enum: ['loading', 'unloading'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'checked_in', 'at_dock', 'loading', 'unloading'],
    default: 'pending'
  },
  scheduledDate: { type: Date, required: true },
  scheduledStartTime: { type: String, required: true },
  scheduledEndTime: { type: String, required: true },
  requestedDate: { type: Date },
  confirmedDate: { type: Date },
  requestedTimeSlot: {
    start: { type: String },
    end: { type: String }
  },
  confirmedTimeSlot: {
    start: { type: String },
    end: { type: String }
  },
  actualArrivalTime: { type: Date },
  actualDepartureTime: { type: Date },
  notes: { type: String },
  createdBy: { type: String, required: true },
  confirmedBy: { type: String },
  confirmedAt: { type: Date },
  cancelledBy: { type: String },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  // Extended properties
  metrics: {
    waitTimeMinutes: { type: Number },
    loadingTimeMinutes: { type: Number },
    totalTimeMinutes: { type: Number },
    delayMinutes: { type: Number },
    dockTimeMinutes: { type: Number }
  },
  cargo: {
    description: { type: String },
    palletCount: { type: Number },
    weight: { type: Number },
    volume: { type: Number },
    adrClass: { type: String },
    isAdr: { type: Boolean },
    requiresRefrigeration: { type: Boolean },
    temperatureRequired: { type: Number },
    palletCountActual: { type: Number },
    weightActual: { type: Number }
  },
  transporter: {
    orgId: { type: String },
    orgName: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String }
  },
  siteOwner: {
    orgName: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String }
  },
  requester: {
    orgName: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String }
  },
  vehicle: {
    plateNumber: { type: String },
    trailerNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    vehicleType: { type: String }
  },
  timestamps: {
    checkedInAt: { type: Date },
    atDockAt: { type: Date },
    loadingStartedAt: { type: Date },
    loadingCompletedAt: { type: Date },
    loadingEndedAt: { type: Date },
    departedAt: { type: Date },
    signedAt: { type: Date },
    calledAt: { type: Date },
    arrivedAt: { type: Date },
    completedAt: { type: Date }
  },
  statusHistory: [{
    status: { type: String },
    changedAt: { type: Date },
    changedBy: { type: String },
    notes: { type: String }
  }],
  ecmrId: { type: String }
}, {
  timestamps: true
});

BookingSchema.index({ siteId: 1, scheduledDate: 1, status: 1 });
BookingSchema.index({ carrierId: 1, status: 1 });
BookingSchema.index({ orderId: 1 });
BookingSchema.index({ reference: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);

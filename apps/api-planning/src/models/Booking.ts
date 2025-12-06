/**
 * Modèle Booking - Représente une réservation de créneau
 */
import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingType = 'loading' | 'unloading';

export interface IBooking extends Document {
  bookingId: string;
  slotId: string;
  dockId: string;
  siteId: string;
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
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  notes?: string;
  createdBy: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true },
  slotId: { type: String, required: true, index: true },
  dockId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, index: true },
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
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], 
    default: 'pending' 
  },
  scheduledDate: { type: Date, required: true },
  scheduledStartTime: { type: String, required: true },
  scheduledEndTime: { type: String, required: true },
  actualArrivalTime: { type: Date },
  actualDepartureTime: { type: Date },
  notes: { type: String },
  createdBy: { type: String, required: true },
  confirmedBy: { type: String },
  confirmedAt: { type: Date },
  cancelledBy: { type: String },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, {
  timestamps: true
});

BookingSchema.index({ siteId: 1, scheduledDate: 1, status: 1 });
BookingSchema.index({ carrierId: 1, status: 1 });
BookingSchema.index({ orderId: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);

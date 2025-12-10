/**
 * Modèle Order - Représente une commande de transport SYMPHONI.A
 */
import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'draft' | 'created' | 'sent_to_carrier' | 'carrier_accepted' | 'carrier_refused'
  | 'in_transit' | 'arrived_pickup' | 'loaded' | 'arrived_delivery' | 'delivered'
  | 'closed' | 'cancelled' | 'escalated';

export type TrackingLevel = 'basic' | 'gps' | 'premium';

export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  enablePortalAccess?: boolean;
  portalRole?: 'supplier' | 'recipient';
}

export interface IGoods {
  description: string;
  weight: number;
  volume?: number;
  quantity: number;
  palettes?: number;
  packaging?: string;
  value?: number;
}

export interface IConstraint {
  type: string;
  value?: string | number | boolean;
  description?: string;
}

export interface IOrderDates {
  pickupDate: Date;
  pickupTimeSlotStart?: string;
  pickupTimeSlotEnd?: string;
  deliveryDate: Date;
  deliveryTimeSlotStart?: string;
  deliveryTimeSlotEnd?: string;
}

// Informations véhicule du transporteur
export interface IVehicleInfo {
  truckPlate?: string;       // Plaque tracteur
  trailerPlate?: string;     // Plaque remorque
  driverName?: string;       // Nom du chauffeur
  driverPhone?: string;      // Téléphone du chauffeur
}

// RDV pris par le transporteur
export interface IAppointments {
  pickupAppointment?: Date;           // RDV de chargement confirmé
  pickupAppointmentSlot?: string;     // Créneau (ex: "08:00-10:00")
  pickupConfirmedAt?: Date;           // Date de confirmation
  deliveryAppointment?: Date;         // RDV de livraison confirmé
  deliveryAppointmentSlot?: string;   // Créneau
  deliveryConfirmedAt?: Date;         // Date de confirmation
}

export interface IOrder extends Document {
  orderId: string;
  reference: string;
  status: OrderStatus;
  trackingLevel: TrackingLevel;
  industrialId: string;
  logisticianId?: string;
  logisticianManaged?: boolean;
  carrierId?: string;
  carrierName?: string;
  supplierId?: string;
  recipientId?: string;
  flowType?: 'inbound' | 'outbound';
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  dates: IOrderDates;
  goods: IGoods;
  constraints: IConstraint[];
  estimatedPrice?: number;
  finalPrice?: number;
  agreedPrice?: number;
  currency: string;
  vehicleInfo?: IVehicleInfo;
  appointments?: IAppointments;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  eta?: Date;
  documentIds: string[];
  portalInvitations: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;
  carrierNotes?: string;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'France' },
  latitude: Number,
  longitude: Number,
  contactName: String,
  contactPhone: String,
  contactEmail: String,
  instructions: String,
  enablePortalAccess: { type: Boolean, default: false },
  portalRole: { type: String, enum: ['supplier', 'recipient'] }
}, { _id: false });

const GoodsSchema = new Schema<IGoods>({
  description: { type: String, required: true },
  weight: { type: Number, required: true },
  volume: Number,
  quantity: { type: Number, required: true, default: 1 },
  palettes: Number,
  packaging: String,
  value: Number
}, { _id: false });

const ConstraintSchema = new Schema<IConstraint>({
  type: { type: String, required: true },
  value: Schema.Types.Mixed,
  description: String
}, { _id: false });

const OrderDatesSchema = new Schema<IOrderDates>({
  pickupDate: { type: Date, required: true },
  pickupTimeSlotStart: String,
  pickupTimeSlotEnd: String,
  deliveryDate: { type: Date, required: true },
  deliveryTimeSlotStart: String,
  deliveryTimeSlotEnd: String
}, { _id: false });

const VehicleInfoSchema = new Schema<IVehicleInfo>({
  truckPlate: String,
  trailerPlate: String,
  driverName: String,
  driverPhone: String
}, { _id: false });

const AppointmentsSchema = new Schema<IAppointments>({
  pickupAppointment: Date,
  pickupAppointmentSlot: String,
  pickupConfirmedAt: Date,
  deliveryAppointment: Date,
  deliveryAppointmentSlot: String,
  deliveryConfirmedAt: Date
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  reference: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['draft', 'created', 'sent_to_carrier', 'carrier_accepted', 'carrier_refused',
           'in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery', 'delivered',
           'closed', 'cancelled', 'escalated'],
    default: 'created'
  },
  trackingLevel: { type: String, enum: ['basic', 'gps', 'premium'], default: 'basic' },
  industrialId: { type: String, required: true, index: true },
  logisticianId: { type: String, index: true },
  logisticianManaged: { type: Boolean, default: false },
  carrierId: { type: String, index: true },
  carrierName: String,
  supplierId: { type: String, index: true },
  recipientId: { type: String, index: true },
  flowType: { type: String, enum: ['inbound', 'outbound'] },
  pickupAddress: { type: AddressSchema, required: true },
  deliveryAddress: { type: AddressSchema, required: true },
  dates: { type: OrderDatesSchema, required: true },
  goods: { type: GoodsSchema, required: true },
  constraints: [ConstraintSchema],
  estimatedPrice: Number,
  finalPrice: Number,
  agreedPrice: Number,
  currency: { type: String, default: 'EUR' },
  vehicleInfo: VehicleInfoSchema,
  appointments: AppointmentsSchema,
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  eta: Date,
  documentIds: [String],
  portalInvitations: [String],
  createdBy: { type: String, required: true },
  notes: String,
  carrierNotes: String
}, { timestamps: true });

OrderSchema.index({ status: 1, industrialId: 1 });
OrderSchema.index({ 'dates.pickupDate': 1 });
OrderSchema.index({ 'dates.deliveryDate': 1 });
OrderSchema.index({ reference: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);

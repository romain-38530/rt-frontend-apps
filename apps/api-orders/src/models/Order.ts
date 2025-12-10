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

export interface IOrder extends Document {
  orderId: string;
  reference: string;
  status: OrderStatus;
  trackingLevel: TrackingLevel;
  industrialId: string;
  logisticianId?: string;  // Si logistique externalisée
  logisticianManaged?: boolean;  // Si true, logisticien gère le transport
  carrierId?: string;
  supplierId?: string;
  recipientId?: string;
  // Flux de la marchandise
  flowType?: 'inbound' | 'outbound';  // inbound = fournisseur->industriel, outbound = industriel->destinataire
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  dates: IOrderDates;
  goods: IGoods;
  constraints: IConstraint[];
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;
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
  currency: { type: String, default: 'EUR' },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  eta: Date,
  documentIds: [String],
  portalInvitations: [String],
  createdBy: { type: String, required: true },
  notes: String
}, { timestamps: true });

// Indexes for efficient queries
OrderSchema.index({ status: 1, industrialId: 1 });
OrderSchema.index({ 'dates.pickupDate': 1 });
OrderSchema.index({ 'dates.deliveryDate': 1 });
OrderSchema.index({ reference: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);

/**
 * Modèle Order - Représente une commande de transport SYMPHONI.A
 */
import mongoose, { Document } from 'mongoose';
export type OrderStatus = 'draft' | 'created' | 'sent_to_carrier' | 'carrier_accepted' | 'carrier_refused' | 'in_transit' | 'arrived_pickup' | 'loaded' | 'arrived_delivery' | 'delivered' | 'closed' | 'cancelled' | 'escalated';
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
    logisticianId?: string;
    logisticianManaged?: boolean;
    carrierId?: string;
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
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map
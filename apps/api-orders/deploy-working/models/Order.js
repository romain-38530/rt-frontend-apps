"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Modèle Order - Représente une commande de transport SYMPHONI.A
 */
const mongoose_1 = __importStar(require("mongoose"));
const AddressSchema = new mongoose_1.Schema({
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
const GoodsSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    weight: { type: Number, required: true },
    volume: Number,
    quantity: { type: Number, required: true, default: 1 },
    palettes: Number,
    packaging: String,
    value: Number
}, { _id: false });
const ConstraintSchema = new mongoose_1.Schema({
    type: { type: String, required: true },
    value: mongoose_1.Schema.Types.Mixed,
    description: String
}, { _id: false });
const OrderDatesSchema = new mongoose_1.Schema({
    pickupDate: { type: Date, required: true },
    pickupTimeSlotStart: String,
    pickupTimeSlotEnd: String,
    actualPickupDate: Date,
    deliveryDate: { type: Date, required: true },
    deliveryTimeSlotStart: String,
    deliveryTimeSlotEnd: String,
    actualDeliveryDate: Date
}, { _id: false });
const VehicleInfoSchema = new mongoose_1.Schema({
    truckPlate: String,
    trailerPlate: String,
    driverName: String,
    driverPhone: String
}, { _id: false });
const AppointmentsSchema = new mongoose_1.Schema({
    pickupAppointment: Date,
    pickupAppointmentSlot: String,
    pickupConfirmedAt: Date,
    deliveryAppointment: Date,
    deliveryAppointmentSlot: String,
    deliveryConfirmedAt: Date
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, unique: true },
    reference: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['draft', 'created', 'sent_to_carrier', 'carrier_accepted', 'carrier_refused',
            'in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery', 'delivered',
            'completed', 'closed', 'cancelled', 'escalated', 'incident', 'archived'],
        default: 'created'
    },
    trackingLevel: { type: String, enum: ['basic', 'gps', 'premium'], default: 'basic' },
    industrialId: { type: String, required: true, index: true },
    logisticianId: { type: String, index: true },
    logisticianManaged: { type: Boolean, default: false },
    carrierId: { type: String, index: true },
    carrierName: String,
    carrierEmail: String,
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
exports.default = mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=Order.js.map
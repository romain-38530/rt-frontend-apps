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
 * Modèle Lane - Lignes de transport SYMPHONI.A
 * Représente une ligne de transport avec ses transporteurs préférentiels
 */
const mongoose_1 = __importStar(require("mongoose"));
const LaneCarrierSchema = new mongoose_1.Schema({
    carrierId: { type: String, required: true },
    carrierName: { type: String, required: true },
    position: { type: Number, required: true },
    contact: {
        email: String,
        phone: String,
        contactName: String
    },
    priceGrid: {
        basePrice: Number,
        pricePerKm: Number,
        pricePerKg: Number,
        pricePerPalette: Number,
        currency: { type: String, default: 'EUR' }
    },
    constraints: [String],
    minScore: { type: Number, default: 70 },
    responseDelayMinutes: { type: Number, default: 120 },
    isActive: { type: Boolean, default: true },
    lastUsed: Date,
    successRate: Number
}, { _id: false });
const LaneSchema = new mongoose_1.Schema({
    laneId: { type: String, required: true, unique: true, index: true },
    industrialId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    origin: {
        city: String,
        postalCodePrefix: String,
        region: String,
        country: { type: String, required: true, default: 'France' },
        coordinates: {
            latitude: Number,
            longitude: Number,
            radiusKm: { type: Number, default: 50 }
        }
    },
    destination: {
        city: String,
        postalCodePrefix: String,
        region: String,
        country: { type: String, required: true, default: 'France' },
        coordinates: {
            latitude: Number,
            longitude: Number,
            radiusKm: { type: Number, default: 50 }
        }
    },
    merchandiseTypes: [String],
    requiredConstraints: [String],
    carriers: [LaneCarrierSchema],
    dispatchConfig: {
        autoDispatch: { type: Boolean, default: true },
        escalateToAffretia: { type: Boolean, default: true },
        maxAttempts: { type: Number, default: 5 },
        defaultResponseDelayMinutes: { type: Number, default: 120 },
        notificationChannels: {
            type: [String],
            enum: ['email', 'sms', 'portal'],
            default: ['email', 'portal']
        }
    },
    stats: {
        totalOrders: { type: Number, default: 0 },
        successfulOrders: { type: Number, default: 0 },
        escalatedOrders: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true }
}, { timestamps: true });
// Indexes
LaneSchema.index({ industrialId: 1, isActive: 1 });
LaneSchema.index({ 'origin.postalCodePrefix': 1, 'destination.postalCodePrefix': 1 });
LaneSchema.index({ 'origin.city': 1, 'destination.city': 1 });
exports.default = mongoose_1.default.model('Lane', LaneSchema);
//# sourceMappingURL=Lane.js.map
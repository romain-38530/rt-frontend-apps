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
 * Modèle DispatchChain - Chaîne d'affectation SYMPHONI.A
 * Gère le processus d'envoi séquentiel aux transporteurs
 */
const mongoose_1 = __importStar(require("mongoose"));
const DispatchAttemptSchema = new mongoose_1.Schema({
    carrierId: { type: String, required: true },
    carrierName: { type: String, required: true },
    position: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'sent', 'accepted', 'refused', 'timeout', 'skipped'],
        default: 'pending'
    },
    sentAt: Date,
    respondedAt: Date,
    expiresAt: Date,
    reminderSentAt: Date,
    responseDelayMinutes: { type: Number, default: 120 },
    refusalReason: String,
    skipReason: String,
    notificationChannels: {
        type: [String],
        enum: ['email', 'sms', 'portal'],
        default: ['email', 'portal']
    },
    notificationsSent: [{
            channel: { type: String, enum: ['email', 'sms', 'portal'] },
            sentAt: Date,
            status: { type: String, enum: ['sent', 'delivered', 'failed'] }
        }],
    proposedPrice: Number,
    finalPrice: Number
}, { _id: false });
const DispatchChainSchema = new mongoose_1.Schema({
    chainId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    orderReference: { type: String, required: true },
    industrialId: { type: String, required: true, index: true },
    laneId: String,
    laneName: String,
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'escalated', 'cancelled'],
        default: 'pending',
        index: true
    },
    assignedCarrierId: String,
    assignedCarrierName: String,
    assignedAt: Date,
    attempts: [DispatchAttemptSchema],
    currentAttemptIndex: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    escalation: {
        escalatedAt: Date,
        affretiaOrderId: String,
        status: { type: String, enum: ['pending', 'in_progress', 'assigned', 'failed'] },
        assignedCarrierId: String,
        assignedCarrierName: String,
        assignedAt: Date,
        proposedPrice: Number
    },
    config: {
        autoEscalate: { type: Boolean, default: true },
        notifyIndustrial: { type: Boolean, default: true },
        requirePriceConfirmation: { type: Boolean, default: false }
    },
    startedAt: Date,
    completedAt: Date
}, { timestamps: true });
// Indexes
DispatchChainSchema.index({ status: 1, 'attempts.expiresAt': 1 }); // Pour le job de timeout
DispatchChainSchema.index({ industrialId: 1, status: 1 });
exports.default = mongoose_1.default.model('DispatchChain', DispatchChainSchema);
//# sourceMappingURL=DispatchChain.js.map
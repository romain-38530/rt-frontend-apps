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
 * Modèle OrderEvent - Système événementiel SYMPHONI.A
 * Trace tous les événements du cycle de vie d'une commande
 */
const mongoose_1 = __importStar(require("mongoose"));
const OrderEventSchema = new mongoose_1.Schema({
    eventId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderReference: { type: String, required: true, index: true },
    eventType: {
        type: String,
        required: true,
        enum: [
            'order.created', 'order.updated', 'order.cancelled',
            'order.lane.detected', 'dispatch.chain.generated',
            'order.sent.to.carrier', 'carrier.accepted', 'carrier.refused', 'carrier.timeout',
            'order.escalated.to.affretia', 'affretia.carrier.assigned',
            'tracking.started', 'tracking.eta.updated', 'tracking.delay.detected', 'tracking.position.updated', 'tracking.ping.requested',
            'order.in.transit', 'order.arrived.pickup', 'order.loaded', 'order.arrived.delivery', 'order.delivered', 'delivered',
            'rdv.requested', 'rdv.proposed', 'rdv.confirmed', 'rdv.cancelled',
            'documents.uploaded', 'documents.ocr.completed', 'documents.verified', 'document_uploaded', 'document_validated', 'document_rejected', 'document_signed',
            'incident_reported', 'incident_resolved',
            'carrier.scored', 'score_calculated', 'order.completed', 'order.archived', 'order.closed'
        ],
        index: true
    },
    timestamp: { type: Date, default: Date.now, index: true },
    source: {
        type: String,
        required: true,
        enum: ['system', 'user', 'carrier', 'api', 'erp', 'affretia', 'tracking', 'recipient', 'supplier', 'industrial']
    },
    actorId: String,
    actorType: {
        type: String,
        enum: ['industrial', 'carrier', 'supplier', 'recipient', 'system']
    },
    actorName: String,
    data: { type: mongoose_1.Schema.Types.Mixed },
    metadata: {
        ip: String,
        userAgent: String,
        channel: { type: String, enum: ['web', 'mobile', 'api', 'email', 'sms'] }
    },
    previousStatus: String,
    newStatus: String,
    description: { type: String, required: true }
}, { timestamps: true });
// Indexes for efficient queries
OrderEventSchema.index({ orderId: 1, timestamp: -1 });
OrderEventSchema.index({ eventType: 1, timestamp: -1 });
OrderEventSchema.index({ 'data.carrierId': 1, eventType: 1 });
exports.default = mongoose_1.default.model('OrderEvent', OrderEventSchema);
//# sourceMappingURL=OrderEvent.js.map
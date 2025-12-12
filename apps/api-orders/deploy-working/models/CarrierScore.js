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
exports.CarrierGlobalScore = exports.CarrierOrderScore = void 0;
/**
 * Modèle CarrierScore - Scoring transporteur SYMPHONI.A
 * Évalue la performance des transporteurs après chaque transport
 */
const mongoose_1 = __importStar(require("mongoose"));
const ScoreCriteriaSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    score: { type: Number, required: true },
    comment: String
}, { _id: false });
const CarrierOrderScoreSchema = new mongoose_1.Schema({
    scoreId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    orderReference: { type: String, required: true },
    carrierId: { type: String, required: true, index: true },
    carrierName: { type: String, required: true },
    industrialId: { type: String, required: true, index: true },
    criteria: {
        pickupPunctuality: ScoreCriteriaSchema,
        deliveryPunctuality: ScoreCriteriaSchema,
        appointmentRespect: ScoreCriteriaSchema,
        trackingReactivity: ScoreCriteriaSchema,
        podDelay: ScoreCriteriaSchema,
        incidentManagement: ScoreCriteriaSchema,
        communication: ScoreCriteriaSchema
    },
    finalScore: { type: Number, required: true, index: true },
    calculationData: {
        plannedPickupTime: Date,
        actualPickupTime: Date,
        pickupDelayMinutes: Number,
        plannedDeliveryTime: Date,
        actualDeliveryTime: Date,
        deliveryDelayMinutes: Number,
        trackingUpdatesCount: Number,
        expectedTrackingUpdates: Number,
        podUploadedAt: Date,
        podDelayHours: Number,
        incidentsCount: { type: Number, default: 0 },
        incidentsResolved: { type: Number, default: 0 }
    },
    bonusMalus: [{
            type: { type: String, enum: ['bonus', 'malus'] },
            value: Number,
            reason: String
        }],
    industrialFeedback: {
        rating: { type: Number, enum: [1, 2, 3, 4, 5] },
        comment: String,
        submittedAt: Date
    },
    impactOnGlobalScore: Number
}, { timestamps: true });
const CarrierGlobalScoreSchema = new mongoose_1.Schema({
    carrierId: { type: String, required: true, unique: true, index: true },
    carrierName: { type: String, required: true },
    globalScore: { type: Number, default: 80, index: true },
    recentScores: [{
            orderId: String,
            score: Number,
            date: Date
        }],
    stats: {
        totalTransports: { type: Number, default: 0 },
        averageScore: { type: Number, default: 80 },
        trendLastMonth: { type: Number, default: 0 },
        acceptanceRate: { type: Number, default: 100 },
        punctualityRate: { type: Number, default: 100 },
        podDelayAverage: { type: Number, default: 0 },
        incidentRate: { type: Number, default: 0 }
    },
    badges: [{
            type: { type: String, enum: ['gold', 'silver', 'bronze', 'verified', 'preferred'] },
            earnedAt: Date,
            expiresAt: Date
        }],
    alerts: [{
            type: { type: String, enum: ['score_drop', 'incident_spike', 'pod_delay'] },
            triggeredAt: Date,
            resolved: { type: Boolean, default: false },
            resolvedAt: Date
        }],
    lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.CarrierOrderScore = mongoose_1.default.model('CarrierOrderScore', CarrierOrderScoreSchema);
exports.CarrierGlobalScore = mongoose_1.default.model('CarrierGlobalScore', CarrierGlobalScoreSchema);
//# sourceMappingURL=CarrierScore.js.map
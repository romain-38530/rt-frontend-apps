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
 * Modèle OrderArchive - Archivage légal 10 ans SYMPHONI.A
 * Conservation des preuves de transport conformément à la réglementation
 */
const mongoose_1 = __importStar(require("mongoose"));
const ArchiveDocumentSchema = new mongoose_1.Schema({
    documentId: { type: String, required: true },
    type: {
        type: String,
        enum: ['bl', 'cmr', 'pod', 'invoice', 'ecmr', 'other'],
        required: true
    },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    checksum: { type: String, required: true },
    s3Key: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
    ocrData: mongoose_1.Schema.Types.Mixed,
    signatures: [{
            role: { type: String, enum: ['driver', 'sender', 'receiver'] },
            signedAt: Date,
            signatureType: { type: String, enum: ['manual', 'digital', 'eidas'] },
            signatureData: String
        }]
}, { _id: false });
const OrderArchiveSchema = new mongoose_1.Schema({
    archiveId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    orderReference: { type: String, required: true, index: true },
    industrialId: { type: String, required: true, index: true },
    orderSnapshot: {
        pickupAddress: mongoose_1.Schema.Types.Mixed,
        deliveryAddress: mongoose_1.Schema.Types.Mixed,
        dates: mongoose_1.Schema.Types.Mixed,
        goods: mongoose_1.Schema.Types.Mixed,
        constraints: [mongoose_1.Schema.Types.Mixed],
        carrierId: String,
        carrierName: String,
        finalPrice: Number,
        currency: { type: String, default: 'EUR' }
    },
    documents: [ArchiveDocumentSchema],
    timeline: [{
            eventType: String,
            timestamp: Date,
            description: String
        }],
    carrierScore: {
        finalScore: Number,
        criteria: mongoose_1.Schema.Types.Mixed
    },
    archiveMetadata: {
        archivedAt: { type: Date, required: true },
        archivedBy: { type: String, required: true },
        archiveVersion: { type: String, default: '1.0' },
        legalRetentionYears: { type: Number, default: 10 },
        expiresAt: { type: Date, required: true, index: true },
        storageClass: {
            type: String,
            enum: ['standard', 'glacier', 'deep_archive'],
            default: 'glacier'
        },
        s3Bucket: String,
        encryptionType: {
            type: String,
            enum: ['AES256', 'aws:kms'],
            default: 'AES256'
        }
    },
    integrity: {
        checksum: { type: String, required: true },
        calculatedAt: { type: Date, required: true },
        verified: { type: Boolean, default: true },
        lastVerifiedAt: Date
    },
    accessLog: [{
            accessedAt: Date,
            accessedBy: String,
            action: { type: String, enum: ['view', 'download', 'verify'] },
            ip: String
        }],
    status: {
        type: String,
        enum: ['active', 'expired', 'destroyed'],
        default: 'active',
        index: true
    }
}, { timestamps: true });
// Indexes
OrderArchiveSchema.index({ 'archiveMetadata.expiresAt': 1, status: 1 });
OrderArchiveSchema.index({ industrialId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('OrderArchive', OrderArchiveSchema);
//# sourceMappingURL=OrderArchive.js.map
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
 * Modèle Document - Gestion des documents de transport SYMPHONI.A
 * CMR, BL, POD, Factures, Certificats, etc.
 */
const mongoose_1 = __importStar(require("mongoose"));
const DocumentSchema = new mongoose_1.Schema({
    documentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderReference: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['cmr', 'bl', 'pod', 'invoice', 'packing_list', 'certificate', 'customs', 'photo', 'damage_report', 'other']
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'validated', 'rejected', 'archived']
    },
    // Fichier
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    s3Key: String,
    s3Bucket: String,
    url: String,
    // Métadonnées
    uploadedBy: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true, enum: ['carrier', 'driver', 'supplier', 'recipient', 'industrial', 'system'] }
    },
    uploadedAt: { type: Date, default: Date.now },
    // Validation
    validatedBy: {
        id: String,
        name: String,
        role: String
    },
    validatedAt: Date,
    rejectionReason: String,
    // Signature électronique
    signature: {
        signedBy: String,
        signedAt: Date,
        signatureData: String,
        ipAddress: String,
        deviceInfo: String
    },
    // Géolocalisation
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    notes: String
}, {
    timestamps: true
});
// Index composé pour recherche rapide
DocumentSchema.index({ orderId: 1, type: 1 });
DocumentSchema.index({ orderId: 1, status: 1 });
DocumentSchema.index({ 'uploadedBy.id': 1, uploadedAt: -1 });
exports.default = mongoose_1.default.model('Document', DocumentSchema);
//# sourceMappingURL=Document.js.map
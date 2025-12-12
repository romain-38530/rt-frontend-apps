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
 * Modèle PortalInvitation - Invitation pour accès portail expéditeur/destinataire
 */
const mongoose_1 = __importStar(require("mongoose"));
const PortalInvitationSchema = new mongoose_1.Schema({
    invitationId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    phone: String,
    contactName: { type: String, required: true },
    role: { type: String, enum: ['supplier', 'recipient', 'logistician', 'carrier'], required: true },
    status: {
        type: String,
        enum: ['pending', 'sent', 'accepted', 'expired'],
        default: 'pending'
    },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    userId: String,
    invitedBy: { type: String, required: true },
    portalUrl: String
}, { timestamps: true });
// Index for finding invitations by email
PortalInvitationSchema.index({ email: 1, status: 1 });
// Index for token lookup (for accepting invitations)
PortalInvitationSchema.index({ token: 1 });
exports.default = mongoose_1.default.model('PortalInvitation', PortalInvitationSchema);
//# sourceMappingURL=PortalInvitation.js.map
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
 * Modèle PreInvoice - Préfacturation SYMPHONI.A
 * Gestion du cycle de facturation transporteur avec contrôle intelligent
 */
const mongoose_1 = __importStar(require("mongoose"));
const PreInvoiceLineSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true },
    orderReference: { type: String, required: true },
    pickupDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true },
    pickupCity: { type: String, required: true },
    deliveryCity: { type: String, required: true },
    baseAmount: { type: Number, required: true },
    waitingHours: { type: Number, default: 0 },
    waitingAmount: { type: Number, default: 0 },
    delayHours: { type: Number, default: 0 },
    delayPenalty: { type: Number, default: 0 },
    fuelSurcharge: { type: Number, default: 0 },
    tolls: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    cmrValidated: { type: Boolean, default: false },
    cmrNotes: String,
    kpiData: {
        onTimePickup: { type: Boolean, default: true },
        onTimeDelivery: { type: Boolean, default: true },
        documentsComplete: { type: Boolean, default: true },
        incidentFree: { type: Boolean, default: true }
    }
}, { _id: false });
const BankDetailsSchema = new mongoose_1.Schema({
    bankName: { type: String, required: true },
    iban: { type: String, required: true },
    bic: { type: String, required: true },
    accountHolder: { type: String, required: true }
}, { _id: false });
const PreInvoiceSchema = new mongoose_1.Schema({
    preInvoiceId: { type: String, required: true, unique: true, index: true },
    preInvoiceNumber: { type: String, required: true, unique: true, index: true },
    period: {
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    industrialId: { type: String, required: true, index: true },
    industrialName: { type: String, required: true },
    industrialEmail: { type: String, required: true },
    carrierId: { type: String, required: true, index: true },
    carrierName: { type: String, required: true },
    carrierEmail: { type: String, required: true },
    carrierSiret: String,
    lines: [PreInvoiceLineSchema],
    totals: {
        baseAmount: { type: Number, default: 0 },
        waitingAmount: { type: Number, default: 0 },
        delayPenalty: { type: Number, default: 0 },
        fuelSurcharge: { type: Number, default: 0 },
        tolls: { type: Number, default: 0 },
        otherCharges: { type: Number, default: 0 },
        subtotalHT: { type: Number, default: 0 },
        tvaRate: { type: Number, default: 20 },
        tvaAmount: { type: Number, default: 0 },
        totalTTC: { type: Number, default: 0 }
    },
    kpis: {
        totalOrders: { type: Number, default: 0 },
        onTimePickupRate: { type: Number, default: 100 },
        onTimeDeliveryRate: { type: Number, default: 100 },
        documentsCompleteRate: { type: Number, default: 100 },
        incidentFreeRate: { type: Number, default: 100 },
        averageWaitingHours: { type: Number, default: 0 },
        totalWaitingHours: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'sent_to_industrial', 'validated_industrial', 'invoice_uploaded',
            'invoice_accepted', 'invoice_rejected', 'payment_pending', 'paid', 'disputed'],
        default: 'pending'
    },
    industrialValidation: {
        validatedAt: Date,
        validatedBy: String,
        comments: String,
        adjustments: [{
                lineIndex: Number,
                originalAmount: Number,
                adjustedAmount: Number,
                reason: String
            }]
    },
    carrierInvoice: {
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceAmount: Number,
        documentId: String,
        uploadedAt: Date,
        bankDetails: BankDetailsSchema
    },
    invoiceControl: {
        preInvoiceAmount: Number,
        carrierInvoiceAmount: Number,
        difference: Number,
        differencePercent: Number,
        autoAccepted: Boolean,
        controlDate: Date,
        controlNotes: String
    },
    payment: {
        dueDate: Date,
        paymentTermDays: { type: Number, default: 30 },
        daysRemaining: Number,
        paidAt: Date,
        paidAmount: Number,
        paymentReference: String,
        bankDetails: BankDetailsSchema
    },
    history: [{
            date: { type: Date, default: Date.now },
            action: { type: String, required: true },
            actor: { type: String, required: true },
            details: String
        }],
    sentToIndustrialAt: Date
}, { timestamps: true });
// Indexes
PreInvoiceSchema.index({ industrialId: 1, 'period.year': 1, 'period.month': 1 });
PreInvoiceSchema.index({ carrierId: 1, 'period.year': 1, 'period.month': 1 });
PreInvoiceSchema.index({ status: 1, 'payment.dueDate': 1 });
PreInvoiceSchema.index({ 'period.year': 1, 'period.month': 1, status: 1 });
exports.default = mongoose_1.default.model('PreInvoice', PreInvoiceSchema);
//# sourceMappingURL=PreInvoice.js.map
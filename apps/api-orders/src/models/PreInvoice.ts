/**
 * Modèle PreInvoice - Préfacturation SYMPHONI.A
 * Gestion du cycle de facturation transporteur avec contrôle intelligent
 */
import mongoose, { Document, Schema } from 'mongoose';

export type PreInvoiceStatus =
  | 'pending'              // En attente de validation industriel
  | 'sent_to_industrial'   // Email envoyé à l'industriel pour validation
  | 'validated_industrial' // Validé par l'industriel
  | 'invoice_uploaded'     // Facture transporteur déposée
  | 'invoice_accepted'     // Facture acceptée (montants concordent)
  | 'invoice_rejected'     // Facture rejetée (écart de montant)
  | 'payment_pending'      // En attente de paiement
  | 'paid'                 // Payé
  | 'disputed';            // Litige

export interface IPreInvoiceLine {
  orderId: string;
  orderReference: string;
  pickupDate: Date;
  deliveryDate: Date;
  pickupCity: string;
  deliveryCity: string;
  baseAmount: number;          // Montant de base du transport
  waitingHours: number;        // Heures d'attente détectées sur CMR
  waitingAmount: number;       // Montant heures d'attente
  delayHours: number;          // Heures de retard
  delayPenalty: number;        // Pénalité de retard (peut être négatif)
  fuelSurcharge: number;       // Surcharge carburant
  tolls: number;               // Péages
  otherCharges: number;        // Autres frais
  totalAmount: number;         // Total ligne
  cmrValidated: boolean;       // CMR validé
  cmrNotes?: string;           // Notes CMR
  kpiData: {
    onTimePickup: boolean;
    onTimeDelivery: boolean;
    documentsComplete: boolean;
    incidentFree: boolean;
  };
}

export interface ICarrierBankDetails {
  bankName: string;
  iban: string;
  bic: string;
  accountHolder: string;
}

export interface IPreInvoice extends Document {
  preInvoiceId: string;
  preInvoiceNumber: string;      // Format: PRE-YYYYMM-XXXXX

  // Période de facturation
  period: {
    month: number;               // 1-12
    year: number;
    startDate: Date;
    endDate: Date;
  };

  // Parties
  industrialId: string;
  industrialName: string;
  industrialEmail: string;
  carrierId: string;
  carrierName: string;
  carrierEmail: string;
  carrierSiret?: string;

  // Lignes de préfacturation
  lines: IPreInvoiceLine[];

  // Totaux calculés
  totals: {
    baseAmount: number;
    waitingAmount: number;
    delayPenalty: number;
    fuelSurcharge: number;
    tolls: number;
    otherCharges: number;
    subtotalHT: number;
    tvaRate: number;
    tvaAmount: number;
    totalTTC: number;
  };

  // KPIs agrégés
  kpis: {
    totalOrders: number;
    onTimePickupRate: number;
    onTimeDeliveryRate: number;
    documentsCompleteRate: number;
    incidentFreeRate: number;
    averageWaitingHours: number;
    totalWaitingHours: number;
  };

  // Workflow
  status: PreInvoiceStatus;

  // Validation industriel
  industrialValidation?: {
    validatedAt: Date;
    validatedBy: string;
    comments?: string;
    adjustments?: {
      lineIndex: number;
      originalAmount: number;
      adjustedAmount: number;
      reason: string;
    }[];
  };

  // Facture transporteur
  carrierInvoice?: {
    invoiceNumber: string;
    invoiceDate: Date;
    invoiceAmount: number;
    documentId: string;          // Référence au document S3
    uploadedAt: Date;
    bankDetails: ICarrierBankDetails;
  };

  // Contrôle automatique
  invoiceControl?: {
    preInvoiceAmount: number;
    carrierInvoiceAmount: number;
    difference: number;
    differencePercent: number;
    autoAccepted: boolean;       // Auto-accepté si écart < 1%
    controlDate: Date;
    controlNotes?: string;
  };

  // Paiement
  payment?: {
    dueDate: Date;               // Date d'échéance
    paymentTermDays: number;     // Délai de paiement (30, 45, 60 jours)
    daysRemaining: number;       // Jours restants avant échéance
    paidAt?: Date;
    paidAmount?: number;
    paymentReference?: string;
    bankDetails: ICarrierBankDetails;
  };

  // Historique
  history: {
    date: Date;
    action: string;
    actor: string;
    details?: string;
  }[];

  // Dates
  createdAt: Date;
  updatedAt: Date;
  sentToIndustrialAt?: Date;
}

const PreInvoiceLineSchema = new Schema<IPreInvoiceLine>({
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

const BankDetailsSchema = new Schema<ICarrierBankDetails>({
  bankName: { type: String, required: true },
  iban: { type: String, required: true },
  bic: { type: String, required: true },
  accountHolder: { type: String, required: true }
}, { _id: false });

const PreInvoiceSchema = new Schema<IPreInvoice>({
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

export default mongoose.model<IPreInvoice>('PreInvoice', PreInvoiceSchema);

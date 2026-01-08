import mongoose, { Schema, Document } from 'mongoose';

export interface IPrefacturationLine {
  orderReference: string;
  deliveryDate: Date;
  origin: string;
  destination: string;
  weight: number;
  pallets: number;
  tariffCode: string;
  baseAmount: number;
  fuelSurcharge: number;
  options: Array<{
    code: string;
    label: string;
    amount: number;
  }>;
  totalHT: number;
  tva: number;
  totalTTC: number;
  discrepancies?: Array<{
    type: 'weight' | 'pallets' | 'options' | 'tariff' | 'documents';
    description: string;
    expectedValue: any;
    actualValue: any;
    impact: number;
  }>;
}

export interface IPrefacturation extends Document {
  reference: string;
  carrier: {
    id: string;
    name: string;
    siret: string;
    email?: string;
  };
  client: {
    id: string;
    name: string;
    siret: string;
    email?: string;
  };
  period: {
    month: number;
    year: number;
    start: Date;
    end: Date;
  };
  lines: IPrefacturationLine[];
  totals: {
    baseAmount: number;
    fuelSurcharge: number;
    options: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
    discrepancyAmount: number;
  };
  status: 'draft' | 'pending' | 'sent_to_industrial' | 'validated_industrial' | 'invoice_uploaded' | 'invoice_accepted' | 'invoice_rejected' | 'payment_pending' | 'paid' | 'disputed';
  hasDiscrepancies: boolean;
  discrepanciesCount: number;
  blocks: Array<{
    type: string;
    reason: string;
  }>;
  // Industrial validation
  industrialValidation?: {
    validatedAt: Date;
    validatedBy: string;
    comments?: string;
  };
  // Carrier invoice upload
  carrierInvoice?: {
    invoiceNumber: string;
    invoiceDate: Date;
    invoiceAmount: number;
    documentId: string;
    uploadedAt: Date;
  };
  // Invoice control (comparison)
  invoiceControl?: {
    preInvoiceAmount: number;
    carrierInvoiceAmount: number;
    difference: number;
    differencePercent: number;
    autoAccepted: boolean;
  };
  // Payment info
  payment?: {
    dueDate: Date;
    paymentTermDays: number;
    daysRemaining: number;
    paidAt?: Date;
    paidAmount?: number;
    paymentReference?: string;
    bankDetails?: {
      bankName: string;
      iban: string;
      bic: string;
      accountHolder: string;
    };
  };
  // KPIs
  kpis?: {
    totalOrders: number;
    onTimePickupRate: number;
    onTimeDeliveryRate: number;
    documentsCompleteRate: number;
    incidentFreeRate: number;
    averageWaitingHours: number;
  };
  validationDate?: Date;
  finalizationDate?: Date;
  invoiceReference?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const prefacturationLineSchema = new Schema({
  orderReference: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  weight: { type: Number, required: true },
  pallets: { type: Number, required: true },
  tariffCode: { type: String, required: true },
  baseAmount: { type: Number, required: true },
  fuelSurcharge: { type: Number, required: true },
  options: [{
    code: String,
    label: String,
    amount: Number
  }],
  totalHT: { type: Number, required: true },
  tva: { type: Number, required: true },
  totalTTC: { type: Number, required: true },
  discrepancies: [{
    type: { type: String, enum: ['weight', 'pallets', 'options', 'tariff', 'documents'] },
    description: String,
    expectedValue: Schema.Types.Mixed,
    actualValue: Schema.Types.Mixed,
    impact: Number
  }]
});

const prefacturationSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  carrier: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    siret: String,
    email: String
  },
  client: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    siret: String,
    email: String
  },
  period: {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  lines: [prefacturationLineSchema],
  totals: {
    baseAmount: { type: Number, required: true },
    fuelSurcharge: { type: Number, required: true },
    options: { type: Number, default: 0 },
    totalHT: { type: Number, required: true },
    tva: { type: Number, required: true },
    totalTTC: { type: Number, required: true },
    discrepancyAmount: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent_to_industrial', 'validated_industrial', 'invoice_uploaded', 'invoice_accepted', 'invoice_rejected', 'payment_pending', 'paid', 'disputed'],
    default: 'draft'
  },
  hasDiscrepancies: { type: Boolean, default: false },
  discrepanciesCount: { type: Number, default: 0 },
  blocks: [{
    type: String,
    reason: String
  }],
  // Industrial validation
  industrialValidation: {
    validatedAt: Date,
    validatedBy: String,
    comments: String
  },
  // Carrier invoice
  carrierInvoice: {
    invoiceNumber: String,
    invoiceDate: Date,
    invoiceAmount: Number,
    documentId: String,
    uploadedAt: Date
  },
  // Invoice control
  invoiceControl: {
    preInvoiceAmount: Number,
    carrierInvoiceAmount: Number,
    difference: Number,
    differencePercent: Number,
    autoAccepted: Boolean
  },
  // Payment
  payment: {
    dueDate: Date,
    paymentTermDays: { type: Number, default: 30 },
    daysRemaining: Number,
    paidAt: Date,
    paidAmount: Number,
    paymentReference: String,
    bankDetails: {
      bankName: String,
      iban: String,
      bic: String,
      accountHolder: String
    }
  },
  // KPIs
  kpis: {
    totalOrders: Number,
    onTimePickupRate: Number,
    onTimeDeliveryRate: Number,
    documentsCompleteRate: Number,
    incidentFreeRate: Number,
    averageWaitingHours: Number
  },
  validationDate: Date,
  finalizationDate: Date,
  invoiceReference: String,
  pdfUrl: String,
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

prefacturationSchema.index({ reference: 1 });
prefacturationSchema.index({ 'carrier.id': 1, 'period.start': 1 });
prefacturationSchema.index({ status: 1 });
prefacturationSchema.index({ hasDiscrepancies: 1 });

export const Prefacturation = mongoose.model<IPrefacturation>('Prefacturation', prefacturationSchema);

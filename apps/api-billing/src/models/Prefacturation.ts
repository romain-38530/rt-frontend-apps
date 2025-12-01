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
  };
  client: {
    id: string;
    name: string;
    siret: string;
  };
  period: {
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
  status: 'draft' | 'pending_validation' | 'validated' | 'finalized' | 'invoiced';
  hasDiscrepancies: boolean;
  discrepanciesCount: number;
  blocks: Array<{
    type: string;
    reason: string;
  }>;
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
    siret: String
  },
  client: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    siret: String
  },
  period: {
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
    enum: ['draft', 'pending_validation', 'validated', 'finalized', 'invoiced'],
    default: 'draft'
  },
  hasDiscrepancies: { type: Boolean, default: false },
  discrepanciesCount: { type: Number, default: 0 },
  blocks: [{
    type: String,
    reason: String
  }],
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

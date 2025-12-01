import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRResult {
  invoiceNumber?: string;
  invoiceDate?: Date;
  totalAmount?: number;
  tva?: number;
  carrier?: {
    name?: string;
    siret?: string;
    address?: string;
  };
  client?: {
    name?: string;
    siret?: string;
  };
  lines?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  confidence: number;
  rawText?: string;
}

export interface ICarrierInvoice extends Document {
  reference: string;
  carrier: {
    id: string;
    name: string;
  };
  uploadDate: Date;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  ocrResult?: IOCRResult;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrError?: string;
  validation: {
    status: 'pending' | 'in_progress' | 'validated' | 'rejected';
    validatedBy?: string;
    validatedAt?: Date;
    rejectionReason?: string;
  };
  matching: {
    prefacturationId?: string;
    matchScore?: number;
    discrepancies?: Array<{
      field: string;
      expected: any;
      actual: any;
      difference: number;
    }>;
  };
  totalAmount: number;
  period?: {
    start: Date;
    end: Date;
  };
  notes?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const carrierInvoiceSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  carrier: {
    id: { type: String, required: true },
    name: { type: String, required: true }
  },
  uploadDate: { type: Date, default: Date.now },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  ocrResult: {
    invoiceNumber: String,
    invoiceDate: Date,
    totalAmount: Number,
    tva: Number,
    carrier: {
      name: String,
      siret: String,
      address: String
    },
    client: {
      name: String,
      siret: String
    },
    lines: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      total: Number
    }],
    confidence: Number,
    rawText: String
  },
  ocrStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  ocrError: String,
  validation: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'validated', 'rejected'],
      default: 'pending'
    },
    validatedBy: String,
    validatedAt: Date,
    rejectionReason: String
  },
  matching: {
    prefacturationId: String,
    matchScore: Number,
    discrepancies: [{
      field: String,
      expected: Schema.Types.Mixed,
      actual: Schema.Types.Mixed,
      difference: Number
    }]
  },
  totalAmount: { type: Number, required: true },
  period: {
    start: Date,
    end: Date
  },
  notes: String,
  uploadedBy: { type: String, required: true }
}, {
  timestamps: true
});

carrierInvoiceSchema.index({ reference: 1 });
carrierInvoiceSchema.index({ 'carrier.id': 1, uploadDate: -1 });
carrierInvoiceSchema.index({ 'validation.status': 1 });
carrierInvoiceSchema.index({ ocrStatus: 1 });

export const CarrierInvoice = mongoose.model<ICarrierInvoice>('CarrierInvoice', carrierInvoiceSchema);

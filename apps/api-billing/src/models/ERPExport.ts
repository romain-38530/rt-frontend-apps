import mongoose, { Schema, Document } from 'mongoose';

export interface IERPExportLine {
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  label: string;
  reference: string;
  analyticalCode?: string;
}

export interface IERPExport extends Document {
  reference: string;
  exportDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  erpSystem: 'sage' | 'sap' | 'cegid' | 'quadratus' | 'ebp' | 'other';
  format: 'csv' | 'xml' | 'json' | 'edi' | 'fec';
  type: 'invoices' | 'payments' | 'general_ledger' | 'analytical';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'sent';
  prefacturations: Array<{
    id: string;
    reference: string;
    amount: number;
  }>;
  lines: IERPExportLine[];
  totals: {
    linesCount: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  validation: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  transmission: {
    method?: 'api' | 'ftp' | 'email' | 'manual';
    sentAt?: Date;
    sentBy?: string;
    confirmationRef?: string;
  };
  error?: {
    message: string;
    details?: any;
    occurredAt: Date;
  };
  metadata?: {
    journalCode?: string;
    companyCode?: string;
    fiscalYear?: number;
    customFields?: Record<string, any>;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const erpExportLineSchema = new Schema({
  accountCode: { type: String, required: true },
  accountLabel: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  label: { type: String, required: true },
  reference: { type: String, required: true },
  analyticalCode: String
});

const erpExportSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  exportDate: { type: Date, default: Date.now },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  erpSystem: {
    type: String,
    enum: ['sage', 'sap', 'cegid', 'quadratus', 'ebp', 'other'],
    required: true
  },
  format: {
    type: String,
    enum: ['csv', 'xml', 'json', 'edi', 'fec'],
    required: true
  },
  type: {
    type: String,
    enum: ['invoices', 'payments', 'general_ledger', 'analytical'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'sent'],
    default: 'pending'
  },
  prefacturations: [{
    id: String,
    reference: String,
    amount: Number
  }],
  lines: [erpExportLineSchema],
  totals: {
    linesCount: { type: Number, default: 0 },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  validation: {
    isValid: { type: Boolean, default: true },
    errors: [String],
    warnings: [String]
  },
  transmission: {
    method: { type: String, enum: ['api', 'ftp', 'email', 'manual'] },
    sentAt: Date,
    sentBy: String,
    confirmationRef: String
  },
  error: {
    message: String,
    details: Schema.Types.Mixed,
    occurredAt: Date
  },
  metadata: {
    journalCode: String,
    companyCode: String,
    fiscalYear: Number,
    customFields: Schema.Types.Mixed
  },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

erpExportSchema.index({ reference: 1 });
erpExportSchema.index({ exportDate: -1 });
erpExportSchema.index({ status: 1 });
erpExportSchema.index({ erpSystem: 1, 'period.start': 1 });

export const ERPExport = mongoose.model<IERPExport>('ERPExport', erpExportSchema);

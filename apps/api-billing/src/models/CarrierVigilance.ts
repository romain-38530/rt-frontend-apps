import mongoose, { Schema, Document } from 'mongoose';

export interface IVigilanceDocument {
  type: 'urssaf' | 'assurance' | 'licence' | 'kbis' | 'other';
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  alertDays: number;
  metadata?: {
    documentNumber?: string;
    issuingAuthority?: string;
    customFields?: Record<string, any>;
  };
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ICarrierVigilance extends Document {
  carrier: {
    id: string;
    name: string;
    siret: string;
  };
  documents: IVigilanceDocument[];
  overallStatus: 'compliant' | 'warning' | 'non_compliant';
  compliance: {
    hasURSSAF: boolean;
    hasAssurance: boolean;
    hasLicence: boolean;
    hasKBIS: boolean;
    allValid: boolean;
    expiringCount: number;
    expiredCount: number;
    missingCount: number;
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    documentType?: string;
    expiryDate?: Date;
    createdAt: Date;
  }>;
  billingRestrictions: {
    isBlocked: boolean;
    reason?: string;
    blockedSince?: Date;
  };
  lastReviewDate?: Date;
  lastReviewedBy?: string;
  nextReviewDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vigilanceDocumentSchema = new Schema({
  type: {
    type: String,
    enum: ['urssaf', 'assurance', 'licence', 'kbis', 'other'],
    required: true
  },
  documentName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['valid', 'expiring_soon', 'expired', 'missing'],
    default: 'valid'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: String,
  verifiedAt: Date,
  rejectionReason: String,
  alertDays: { type: Number, default: 30 },
  metadata: {
    documentNumber: String,
    issuingAuthority: String,
    customFields: Schema.Types.Mixed
  },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: String
});

const carrierVigilanceSchema = new Schema({
  carrier: {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    siret: { type: String, required: true }
  },
  documents: [vigilanceDocumentSchema],
  overallStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non_compliant'],
    default: 'warning'
  },
  compliance: {
    hasURSSAF: { type: Boolean, default: false },
    hasAssurance: { type: Boolean, default: false },
    hasLicence: { type: Boolean, default: false },
    hasKBIS: { type: Boolean, default: false },
    allValid: { type: Boolean, default: false },
    expiringCount: { type: Number, default: 0 },
    expiredCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 }
  },
  alerts: [{
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    message: String,
    documentType: String,
    expiryDate: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  billingRestrictions: {
    isBlocked: { type: Boolean, default: false },
    reason: String,
    blockedSince: Date
  },
  lastReviewDate: Date,
  lastReviewedBy: String,
  nextReviewDate: Date,
  notes: String
}, {
  timestamps: true
});

carrierVigilanceSchema.index({ 'carrier.id': 1 });
carrierVigilanceSchema.index({ overallStatus: 1 });
carrierVigilanceSchema.index({ 'compliance.allValid': 1 });
carrierVigilanceSchema.index({ 'documents.expiryDate': 1 });

export const CarrierVigilance = mongoose.model<ICarrierVigilance>('CarrierVigilance', carrierVigilanceSchema);

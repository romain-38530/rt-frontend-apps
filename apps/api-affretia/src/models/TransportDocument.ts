/**
 * Model: TransportDocument
 * Documents de transport (BL, CMR, POD, etc.)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITransportDocument extends Document {
  orderId: string;
  sessionId?: string;

  type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'packing_list' | 'customs' | 'other';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storagePath?: string;

  // OCR
  ocrProcessed: boolean;
  ocrConfidence?: number;
  extractedData?: {
    documentNumber?: string;
    date?: string;
    shipper?: {
      name?: string;
      address?: string;
    };
    consignee?: {
      name?: string;
      address?: string;
    };
    carrier?: {
      name?: string;
      license?: string;
    };
    goods?: {
      description?: string;
      weight?: number;
      packages?: number;
      pallets?: number;
    };
    receivedBy?: string;
    receivedAt?: string;
    signature?: boolean;
    remarks?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    currency?: string;
  };

  // Validation
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  validationErrors?: string[];

  // Metadata
  uploadedBy: string;
  source: 'carrier' | 'shipper' | 'ocr' | 'api';

  // Archivage
  archived: boolean;
  archiveId?: string;
  retentionUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const TransportDocumentSchema = new Schema<ITransportDocument>({
  orderId: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },

  type: {
    type: String,
    enum: ['bl', 'cmr', 'pod', 'invoice', 'packing_list', 'customs', 'other'],
    required: true
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  storagePath: String,

  ocrProcessed: { type: Boolean, default: false },
  ocrConfidence: Number,
  extractedData: {
    documentNumber: String,
    date: String,
    shipper: {
      name: String,
      address: String
    },
    consignee: {
      name: String,
      address: String
    },
    carrier: {
      name: String,
      license: String
    },
    goods: {
      description: String,
      weight: Number,
      packages: Number,
      pallets: Number
    },
    receivedBy: String,
    receivedAt: String,
    signature: Boolean,
    remarks: String,
    invoiceNumber: String,
    totalAmount: Number,
    currency: String
  },

  validated: { type: Boolean, default: false },
  validatedBy: String,
  validatedAt: Date,
  validationErrors: [String],

  uploadedBy: { type: String, required: true },
  source: {
    type: String,
    enum: ['carrier', 'shipper', 'ocr', 'api'],
    default: 'carrier'
  },

  archived: { type: Boolean, default: false },
  archiveId: String,
  retentionUntil: Date
}, {
  timestamps: true
});

// Indexes
TransportDocumentSchema.index({ orderId: 1, type: 1 });
TransportDocumentSchema.index({ uploadedBy: 1, createdAt: -1 });
TransportDocumentSchema.index({ archived: 1, retentionUntil: 1 });

// Pre-save: calculer date de rétention (10 ans légal)
TransportDocumentSchema.pre('save', function(next) {
  if (!this.retentionUntil) {
    const retention = new Date();
    retention.setFullYear(retention.getFullYear() + 10);
    this.retentionUntil = retention;
  }
  next();
});

// Méthodes
TransportDocumentSchema.methods.validate = async function(userId: string, errors?: string[]) {
  this.validated = errors ? errors.length === 0 : true;
  this.validatedBy = userId;
  this.validatedAt = new Date();
  this.validationErrors = errors || [];
  return this.save();
};

TransportDocumentSchema.methods.archive = async function(archiveId: string) {
  this.archived = true;
  this.archiveId = archiveId;
  return this.save();
};

// Statics
TransportDocumentSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

TransportDocumentSchema.statics.findMissingDocuments = function(orderId: string, requiredTypes: string[]) {
  return this.find({ orderId, type: { $in: requiredTypes } })
    .then((docs: any[]) => {
      const foundTypes = docs.map(d => d.type);
      return requiredTypes.filter(t => !foundTypes.includes(t));
    });
};

export default mongoose.model<ITransportDocument>('TransportDocument', TransportDocumentSchema);

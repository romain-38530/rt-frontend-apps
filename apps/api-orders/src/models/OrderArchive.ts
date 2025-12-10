/**
 * Modèle OrderArchive - Archivage légal 10 ans SYMPHONI.A
 * Conservation des preuves de transport conformément à la réglementation
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IArchiveDocument {
  documentId: string;
  type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'ecmr' | 'other';
  filename: string;
  mimeType: string;
  size: number;
  checksum: string;  // SHA-256 pour intégrité
  s3Key: string;
  uploadedAt: Date;
  ocrData?: Record<string, any>;
  signatures?: {
    role: 'driver' | 'sender' | 'receiver';
    signedAt: Date;
    signatureType: 'manual' | 'digital' | 'eidas';
    signatureData?: string;
  }[];
}

export interface IOrderArchive extends Document {
  archiveId: string;
  orderId: string;
  orderReference: string;
  industrialId: string;

  // Données de la commande (snapshot complet)
  orderSnapshot: {
    pickupAddress: Record<string, any>;
    deliveryAddress: Record<string, any>;
    dates: Record<string, any>;
    goods: Record<string, any>;
    constraints: any[];
    carrierId?: string;
    carrierName?: string;
    finalPrice?: number;
    currency: string;
  };

  // Documents archivés
  documents: IArchiveDocument[];

  // Événements clés (résumé)
  timeline: {
    eventType: string;
    timestamp: Date;
    description: string;
  }[];

  // Scoring du transport
  carrierScore?: {
    finalScore: number;
    criteria: Record<string, number>;
  };

  // Métadonnées d'archivage
  archiveMetadata: {
    archivedAt: Date;
    archivedBy: string;
    archiveVersion: string;
    legalRetentionYears: number;
    expiresAt: Date;  // Date de destruction autorisée
    storageClass: 'standard' | 'glacier' | 'deep_archive';
    s3Bucket: string;
    encryptionType: 'AES256' | 'aws:kms';
  };

  // Intégrité
  integrity: {
    checksum: string;  // SHA-256 de tout le document
    calculatedAt: Date;
    verified: boolean;
    lastVerifiedAt?: Date;
  };

  // Accès et audit
  accessLog: {
    accessedAt: Date;
    accessedBy: string;
    action: 'view' | 'download' | 'verify';
    ip?: string;
  }[];

  // Statut
  status: 'active' | 'expired' | 'destroyed';

  createdAt: Date;
  updatedAt: Date;
}

const ArchiveDocumentSchema = new Schema<IArchiveDocument>({
  documentId: { type: String, required: true },
  type: {
    type: String,
    enum: ['bl', 'cmr', 'pod', 'invoice', 'ecmr', 'other'],
    required: true
  },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  checksum: { type: String, required: true },
  s3Key: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
  ocrData: Schema.Types.Mixed,
  signatures: [{
    role: { type: String, enum: ['driver', 'sender', 'receiver'] },
    signedAt: Date,
    signatureType: { type: String, enum: ['manual', 'digital', 'eidas'] },
    signatureData: String
  }]
}, { _id: false });

const OrderArchiveSchema = new Schema<IOrderArchive>({
  archiveId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  orderReference: { type: String, required: true, index: true },
  industrialId: { type: String, required: true, index: true },

  orderSnapshot: {
    pickupAddress: Schema.Types.Mixed,
    deliveryAddress: Schema.Types.Mixed,
    dates: Schema.Types.Mixed,
    goods: Schema.Types.Mixed,
    constraints: [Schema.Types.Mixed],
    carrierId: String,
    carrierName: String,
    finalPrice: Number,
    currency: { type: String, default: 'EUR' }
  },

  documents: [ArchiveDocumentSchema],

  timeline: [{
    eventType: String,
    timestamp: Date,
    description: String
  }],

  carrierScore: {
    finalScore: Number,
    criteria: Schema.Types.Mixed
  },

  archiveMetadata: {
    archivedAt: { type: Date, required: true },
    archivedBy: { type: String, required: true },
    archiveVersion: { type: String, default: '1.0' },
    legalRetentionYears: { type: Number, default: 10 },
    expiresAt: { type: Date, required: true, index: true },
    storageClass: {
      type: String,
      enum: ['standard', 'glacier', 'deep_archive'],
      default: 'glacier'
    },
    s3Bucket: String,
    encryptionType: {
      type: String,
      enum: ['AES256', 'aws:kms'],
      default: 'AES256'
    }
  },

  integrity: {
    checksum: { type: String, required: true },
    calculatedAt: { type: Date, required: true },
    verified: { type: Boolean, default: true },
    lastVerifiedAt: Date
  },

  accessLog: [{
    accessedAt: Date,
    accessedBy: String,
    action: { type: String, enum: ['view', 'download', 'verify'] },
    ip: String
  }],

  status: {
    type: String,
    enum: ['active', 'expired', 'destroyed'],
    default: 'active',
    index: true
  }
}, { timestamps: true });

// Indexes
OrderArchiveSchema.index({ 'archiveMetadata.expiresAt': 1, status: 1 });
OrderArchiveSchema.index({ industrialId: 1, createdAt: -1 });

export default mongoose.model<IOrderArchive>('OrderArchive', OrderArchiveSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ISignaturePhoto {
  photoId: string;
  url: string;
  description?: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  metadata?: {
    size: number;
    mimeType: string;
    resolution?: string;
  };
}

export interface IPartialReception {
  receivedItems: Array<{
    reference: string;
    description: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityRejected?: number;
    reason?: string;
  }>;
  totalReceived: number;
  totalRejected: number;
  receivedPercentage: number;
}

export interface IRefusalDetails {
  reason: 'damaged' | 'wrong_product' | 'late_delivery' | 'no_order' | 'incomplete' | 'quality_issue' | 'other';
  detailedReason: string;
  affectedItems?: Array<{
    reference: string;
    description: string;
    quantity: number;
    issue: string;
  }>;
  actionTaken: 'returned' | 'kept_with_reservation' | 'partial_acceptance' | 'total_refusal';
  requiresPickup: boolean;
}

export interface IDeliverySignature extends Document {
  signatureId: string;
  deliveryId: string;
  recipientId: string;
  siteId: string;
  type: 'reception' | 'partial_reception' | 'refusal';
  method: 'smartphone' | 'qrcode' | 'kiosk' | 'tablet' | 'web';
  signatureData: string;
  signerName: string;
  signerRole: string;
  signerEmail?: string;
  signerPhone?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp: Date;
  reservations?: string;
  partialReception?: IPartialReception;
  refusalDetails?: IRefusalDetails;
  photos: ISignaturePhoto[];
  cmrId?: string;
  ecmrSigned: boolean;
  ecmrUrl?: string;
  qrCodeScanned: boolean;
  qrCodeData?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    browser?: string;
    ipAddress?: string;
  };
  verification: {
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    verificationMethod?: 'email' | 'sms' | 'manual';
  };
  notifications: {
    recipientNotified: boolean;
    transporterNotified: boolean;
    industrialNotified: boolean;
    supplierNotified: boolean;
    notifiedAt?: Date;
  };
  metadata: {
    duration?: number;
    retries?: number;
    signatureQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  };
  createdAt: Date;
  updatedAt: Date;
  // Méthodes du schema
  addPhoto(url: string, description?: string, location?: { lat: number; lng: number }): void;
  validateSignature(): { valid: boolean; errors: string[] };
}

const SignaturePhotoSchema = new Schema<ISignaturePhoto>({
  photoId: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  timestamp: { type: Date, required: true },
  location: {
    lat: Number,
    lng: Number
  },
  metadata: {
    size: Number,
    mimeType: String,
    resolution: String
  }
});

const PartialReceptionSchema = new Schema<IPartialReception>({
  receivedItems: [{
    reference: { type: String, required: true },
    description: { type: String, required: true },
    quantityOrdered: { type: Number, required: true },
    quantityReceived: { type: Number, required: true },
    quantityRejected: Number,
    reason: String
  }],
  totalReceived: { type: Number, required: true },
  totalRejected: { type: Number, default: 0 },
  receivedPercentage: { type: Number, required: true }
});

const RefusalDetailsSchema = new Schema<IRefusalDetails>({
  reason: {
    type: String,
    enum: ['damaged', 'wrong_product', 'late_delivery', 'no_order', 'incomplete', 'quality_issue', 'other'],
    required: true
  },
  detailedReason: { type: String, required: true },
  affectedItems: [{
    reference: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    issue: { type: String, required: true }
  }],
  actionTaken: {
    type: String,
    enum: ['returned', 'kept_with_reservation', 'partial_acceptance', 'total_refusal'],
    required: true
  },
  requiresPickup: { type: Boolean, default: false }
});

const DeliverySignatureSchema = new Schema<IDeliverySignature>(
  {
    signatureId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deliveryId: {
      type: String,
      required: true,
      index: true
    },
    recipientId: {
      type: String,
      required: true,
      index: true
    },
    siteId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['reception', 'partial_reception', 'refusal'],
      required: true
    },
    method: {
      type: String,
      enum: ['smartphone', 'qrcode', 'kiosk', 'tablet', 'web'],
      required: true
    },
    signatureData: {
      type: String,
      required: true
    },
    signerName: {
      type: String,
      required: true
    },
    signerRole: {
      type: String,
      required: true
    },
    signerEmail: String,
    signerPhone: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    reservations: String,
    partialReception: PartialReceptionSchema,
    refusalDetails: RefusalDetailsSchema,
    photos: [SignaturePhotoSchema],
    cmrId: String,
    ecmrSigned: {
      type: Boolean,
      default: false
    },
    ecmrUrl: String,
    qrCodeScanned: {
      type: Boolean,
      default: false
    },
    qrCodeData: String,
    deviceInfo: {
      userAgent: String,
      platform: String,
      browser: String,
      ipAddress: String
    },
    verification: {
      verified: { type: Boolean, default: false },
      verifiedBy: String,
      verifiedAt: Date,
      verificationMethod: {
        type: String,
        enum: ['email', 'sms', 'manual']
      }
    },
    notifications: {
      recipientNotified: { type: Boolean, default: false },
      transporterNotified: { type: Boolean, default: false },
      industrialNotified: { type: Boolean, default: false },
      supplierNotified: { type: Boolean, default: false },
      notifiedAt: Date
    },
    metadata: {
      duration: Number,
      retries: { type: Number, default: 0 },
      signatureQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes pour les recherches fréquentes
DeliverySignatureSchema.index({ deliveryId: 1, type: 1 });
DeliverySignatureSchema.index({ recipientId: 1, timestamp: -1 });
DeliverySignatureSchema.index({ siteId: 1, timestamp: -1 });
DeliverySignatureSchema.index({ cmrId: 1 });

// Méthode pour générer un signatureId unique
DeliverySignatureSchema.statics.generateSignatureId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ signatureId: new RegExp(`^SIG-${year}-`) });
  return `SIG-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Méthode pour ajouter une photo
DeliverySignatureSchema.methods.addPhoto = function(
  url: string,
  description?: string,
  location?: { lat: number; lng: number }
): void {
  this.photos.push({
    photoId: `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    description,
    timestamp: new Date(),
    location
  });
};

// Méthode pour valider la signature
DeliverySignatureSchema.methods.validateSignature = function(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!this.signatureData || this.signatureData.length < 100) {
    errors.push('Signature data is too short or missing');
  }

  if (!this.signerName || this.signerName.trim().length < 2) {
    errors.push('Signer name is required');
  }

  if (this.type === 'partial_reception' && !this.partialReception) {
    errors.push('Partial reception details are required for partial reception type');
  }

  if (this.type === 'refusal' && !this.refusalDetails) {
    errors.push('Refusal details are required for refusal type');
  }

  if (this.refusalDetails && this.refusalDetails.requiresPickup && this.photos.length === 0) {
    errors.push('Photos are required when pickup is needed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const DeliverySignature = mongoose.model<IDeliverySignature>('DeliverySignature', DeliverySignatureSchema);

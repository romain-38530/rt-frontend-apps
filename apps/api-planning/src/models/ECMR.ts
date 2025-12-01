/**
 * Model: ECMR
 * Lettre de voiture électronique (eCMR)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IECMR extends Document {
  reference: string;

  // Liens
  bookingId: string;
  bookingReference: string;
  orderId?: string;
  orderReference?: string;

  // Parties
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  carrier: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };

  // Lieux
  loadingPlace: {
    address: string;
    city: string;
    country: string;
    date: string;
  };
  deliveryPlace: {
    address: string;
    city: string;
    country: string;
    requestedDate?: string;
  };

  // Marchandises
  goods: {
    description: string;
    packaging: string;
    quantity: number;
    weight: number;
    volume?: number;
    marks?: string;
    adrClass?: string;
    adrUnNumber?: string;
  }[];
  totalWeight: number;
  totalPackages: number;

  // Documents joints
  attachedDocuments: string[];

  // Instructions
  senderInstructions?: string;
  paymentInstructions?: string;
  specialAgreements?: string;

  // Véhicule
  vehiclePlate: string;
  trailerPlate?: string;

  // Signatures
  signatures: {
    party: 'sender' | 'carrier' | 'recipient';
    signedBy: string;
    signedAt: Date;
    signatureData: string;
    ipAddress?: string;
    deviceInfo?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
    };
    comments?: string;
  }[];

  // Réserves
  senderReserves?: string;
  carrierReserves?: string;
  recipientReserves?: string;

  // Photos
  photos: {
    type: 'loading' | 'unloading' | 'damage' | 'other';
    url: string;
    takenAt: Date;
    takenBy: string;
  }[];

  // Statut
  status: 'draft' | 'pending_sender' | 'pending_carrier' | 'pending_recipient' | 'signed' | 'validated' | 'disputed';

  // PDF généré
  pdfUrl?: string;
  pdfGeneratedAt?: Date;

  // Conformité eIDAS
  eidasCompliant: boolean;
  timestampToken?: string;
  archiveId?: string;

  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
}

const ECMRSchema = new Schema<IECMR>({
  reference: { type: String, required: true, unique: true },

  bookingId: { type: String, required: true, index: true },
  bookingReference: { type: String, required: true },
  orderId: String,
  orderReference: String,

  sender: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'France' },
    contactName: String,
    contactPhone: String,
    contactEmail: String
  },
  carrier: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'France' },
    contactName: String,
    contactPhone: String,
    contactEmail: String
  },
  recipient: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'France' },
    contactName: String,
    contactPhone: String,
    contactEmail: String
  },

  loadingPlace: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'France' },
    date: { type: String, required: true }
  },
  deliveryPlace: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'France' },
    requestedDate: String
  },

  goods: [{
    description: { type: String, required: true },
    packaging: String,
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true },
    volume: Number,
    marks: String,
    adrClass: String,
    adrUnNumber: String
  }],
  totalWeight: { type: Number, required: true },
  totalPackages: { type: Number, required: true },

  attachedDocuments: [String],

  senderInstructions: String,
  paymentInstructions: String,
  specialAgreements: String,

  vehiclePlate: { type: String, required: true },
  trailerPlate: String,

  signatures: [{
    party: { type: String, enum: ['sender', 'carrier', 'recipient'], required: true },
    signedBy: { type: String, required: true },
    signedAt: { type: Date, default: Date.now },
    signatureData: { type: String, required: true },
    ipAddress: String,
    deviceInfo: String,
    geolocation: {
      latitude: Number,
      longitude: Number
    },
    comments: String
  }],

  senderReserves: String,
  carrierReserves: String,
  recipientReserves: String,

  photos: [{
    type: { type: String, enum: ['loading', 'unloading', 'damage', 'other'] },
    url: String,
    takenAt: Date,
    takenBy: String
  }],

  status: {
    type: String,
    enum: ['draft', 'pending_sender', 'pending_carrier', 'pending_recipient', 'signed', 'validated', 'disputed'],
    default: 'draft',
    index: true
  },

  pdfUrl: String,
  pdfGeneratedAt: Date,

  eidasCompliant: { type: Boolean, default: false },
  timestampToken: String,
  archiveId: String,

  validatedAt: Date
}, {
  timestamps: true
});

// Auto-génération de la référence
ECMRSchema.pre('save', async function(next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ECMR').countDocuments();
    this.reference = `CMR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index composites
ECMRSchema.index({ bookingId: 1 });
ECMRSchema.index({ status: 1, createdAt: -1 });
ECMRSchema.index({ 'sender.name': 1 });
ECMRSchema.index({ 'carrier.name': 1 });

export default mongoose.model<IECMR>('ECMR', ECMRSchema);

import mongoose, { Schema, Document } from 'mongoose';

export type PalletType = 'EURO_EPAL' | 'EURO_EPAL_2' | 'DEMI_PALETTE' | 'PALETTE_PERDUE';
export type ChequeStatus = 'EMIS' | 'EN_TRANSIT' | 'DEPOSE' | 'RECU' | 'LITIGE' | 'ANNULE';

export interface IPalletCheque extends Document {
  chequeId: string;
  qrCode: string;
  orderId?: string;
  fromCompanyId: string;
  fromCompanyName: string;
  toSiteId: string;
  toSiteName: string;
  quantity: number;
  quantityReceived?: number;
  palletType: PalletType;
  status: ChequeStatus;
  vehiclePlate?: string;
  driverName?: string;
  timestamps: {
    emittedAt: Date;
    depositedAt?: Date;
    receivedAt?: Date;
  };
  geolocations: {
    deposit?: { lat: number; lng: number };
    receipt?: { lat: number; lng: number };
  };
  signatures: {
    transporter?: string;
    receiver?: string;
  };
  photos: Array<{
    type: 'deposit' | 'receipt' | 'dispute';
    url: string;
    at: Date;
  }>;
  cryptoSignature: string;
  matchingInfo?: {
    suggestedRank: number;
    distance: number;
    score: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PalletChequeSchema = new Schema<IPalletCheque>({
  chequeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  qrCode: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    index: true,
  },
  fromCompanyId: {
    type: String,
    required: true,
    index: true,
  },
  fromCompanyName: {
    type: String,
    required: true,
  },
  toSiteId: {
    type: String,
    required: true,
    index: true,
  },
  toSiteName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  quantityReceived: {
    type: Number,
  },
  palletType: {
    type: String,
    enum: ['EURO_EPAL', 'EURO_EPAL_2', 'DEMI_PALETTE', 'PALETTE_PERDUE'],
    required: true,
  },
  status: {
    type: String,
    enum: ['EMIS', 'EN_TRANSIT', 'DEPOSE', 'RECU', 'LITIGE', 'ANNULE'],
    default: 'EMIS',
    index: true,
  },
  vehiclePlate: String,
  driverName: String,
  timestamps: {
    emittedAt: { type: Date, default: Date.now },
    depositedAt: Date,
    receivedAt: Date,
  },
  geolocations: {
    deposit: {
      lat: Number,
      lng: Number,
    },
    receipt: {
      lat: Number,
      lng: Number,
    },
  },
  signatures: {
    transporter: String,
    receiver: String,
  },
  photos: [{
    type: { type: String, enum: ['deposit', 'receipt', 'dispute'] },
    url: String,
    at: Date,
  }],
  cryptoSignature: {
    type: String,
    required: true,
  },
  matchingInfo: {
    suggestedRank: Number,
    distance: Number,
    score: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PalletChequeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour recherches fréquentes
PalletChequeSchema.index({ fromCompanyId: 1, status: 1 });
PalletChequeSchema.index({ toSiteId: 1, status: 1 });
PalletChequeSchema.index({ 'timestamps.emittedAt': -1 });

export default mongoose.model<IPalletCheque>('PalletCheque', PalletChequeSchema);

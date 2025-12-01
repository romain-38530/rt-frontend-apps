import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  lat: number;
  lng: number;
}

export interface ISupplierSignature extends Document {
  signatureId: string;
  orderId: string;
  supplierId: string;
  type: 'loading' | 'delivery_note';
  method: 'smartphone' | 'qrcode' | 'kiosk';
  signatureData: string;
  signerName: string;
  signerRole: string;
  location?: ILocation;
  timestamp: Date;
  deviceInfo?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

const SupplierSignatureSchema = new Schema<ISupplierSignature>(
  {
    signatureId: {
      type: String,
      unique: true,
      required: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    supplierId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['loading', 'delivery_note'],
      required: true
    },
    method: {
      type: String,
      enum: ['smartphone', 'qrcode', 'kiosk'],
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
    location: {
      type: LocationSchema
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    deviceInfo: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index composés pour les requêtes fréquentes
SupplierSignatureSchema.index({ orderId: 1, type: 1 });
SupplierSignatureSchema.index({ supplierId: 1, timestamp: -1 });

// Génération automatique du signatureId
SupplierSignatureSchema.pre('save', async function (next) {
  if (this.isNew && !this.signatureId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const count = await mongoose.model('SupplierSignature').countDocuments();
    this.signatureId = `SIG-${year}${month}${day}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model<ISupplierSignature>('SupplierSignature', SupplierSignatureSchema);

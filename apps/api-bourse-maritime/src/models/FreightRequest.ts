import mongoose, { Schema, Document } from 'mongoose';

export interface IFreightRequest extends Document {
  reference: string;
  shipper: {
    companyId: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
  origin: {
    port: string;
    country: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  destination: {
    port: string;
    country: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  cargo: {
    type: 'container' | 'bulk' | 'roro' | 'breakbulk' | 'tanker';
    description: string;
    weight: number;
    volume: number;
    containerType?: string;
    containerCount?: number;
    hazmat: boolean;
    temperature?: number;
    specialHandling?: string;
  };
  schedule: {
    loadingDate: Date;
    deliveryDeadline: Date;
    flexibility: string;
  };
  requirements: {
    incoterm: string;
    insurance: boolean;
    customsClearance: boolean;
    documentation: string[];
  };
  pricing: {
    targetPrice?: number;
    currency: string;
    paymentTerms: string;
  };
  status: 'draft' | 'published' | 'bidding' | 'awarded' | 'inProgress' | 'completed' | 'cancelled';
  bidsCount: number;
  lowestBid?: number;
  highestBid?: number;
  selectedBid?: string;
  awardedAt?: Date;
  publishedAt?: Date;
  closingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FreightRequestSchema: Schema = new Schema({
  reference: {
    type: String,
    unique: true,
    required: true
  },
  shipper: {
    companyId: { type: String, required: true },
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true }
  },
  origin: {
    port: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  destination: {
    port: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  cargo: {
    type: {
      type: String,
      enum: ['container', 'bulk', 'roro', 'breakbulk', 'tanker'],
      required: true
    },
    description: { type: String, required: true },
    weight: { type: Number, required: true },
    volume: { type: Number, required: true },
    containerType: String,
    containerCount: Number,
    hazmat: { type: Boolean, default: false },
    temperature: Number,
    specialHandling: String
  },
  schedule: {
    loadingDate: { type: Date, required: true },
    deliveryDeadline: { type: Date, required: true },
    flexibility: String
  },
  requirements: {
    incoterm: { type: String, required: true },
    insurance: { type: Boolean, default: false },
    customsClearance: { type: Boolean, default: false },
    documentation: [String]
  },
  pricing: {
    targetPrice: Number,
    currency: { type: String, required: true, default: 'USD' },
    paymentTerms: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'bidding', 'awarded', 'inProgress', 'completed', 'cancelled'],
    default: 'draft'
  },
  bidsCount: { type: Number, default: 0 },
  lowestBid: Number,
  highestBid: Number,
  selectedBid: { type: Schema.Types.ObjectId, ref: 'Bid' },
  awardedAt: Date,
  publishedAt: Date,
  closingDate: Date
}, {
  timestamps: true
});

// Auto-generate reference number
FreightRequestSchema.pre('save', async function(next) {
  if (!this.reference) {
    const count = await mongoose.model('FreightRequest').countDocuments();
    this.reference = `BM-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
FreightRequestSchema.index({ status: 1, publishedAt: -1 });
FreightRequestSchema.index({ 'origin.port': 1, 'destination.port': 1 });
FreightRequestSchema.index({ 'cargo.type': 1 });
FreightRequestSchema.index({ 'schedule.loadingDate': 1 });

export default mongoose.model<IFreightRequest>('FreightRequest', FreightRequestSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBid extends Document {
  reference: string;
  freightRequestId: string;
  carrier: {
    companyId: string;
    companyName: string;
    contactName: string;
    rating: number;
    completedJobs: number;
  };
  pricing: {
    amount: number;
    currency: string;
    breakdown: {
      freight: number;
      bunker: number;
      thc: number;
      documentation: number;
      insurance: number;
      other: number;
    };
  };
  vessel: {
    name: string;
    imo: string;
    type: string;
    flag: string;
    capacity: number;
    yearBuilt: number;
  };
  schedule: {
    estimatedDeparture: Date;
    estimatedArrival: Date;
    transitDays: number;
  };
  terms: {
    validity: Date;
    paymentTerms: string;
    conditions: string[];
  };
  status: 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  submittedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema: Schema = new Schema({
  reference: {
    type: String,
    unique: true,
    required: true
  },
  freightRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'FreightRequest',
    required: true
  },
  carrier: {
    companyId: { type: String, required: true },
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    rating: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 }
  },
  pricing: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    breakdown: {
      freight: { type: Number, required: true },
      bunker: { type: Number, default: 0 },
      thc: { type: Number, default: 0 },
      documentation: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  vessel: {
    name: { type: String, required: true },
    imo: { type: String, required: true },
    type: { type: String, required: true },
    flag: { type: String, required: true },
    capacity: { type: Number, required: true },
    yearBuilt: { type: Number, required: true }
  },
  schedule: {
    estimatedDeparture: { type: Date, required: true },
    estimatedArrival: { type: Date, required: true },
    transitDays: { type: Number, required: true }
  },
  terms: {
    validity: { type: Date, required: true },
    paymentTerms: { type: String, required: true },
    conditions: [String]
  },
  status: {
    type: String,
    enum: ['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate reference number
BidSchema.pre('save', async function(next) {
  if (!this.reference) {
    const count = await mongoose.model('Bid').countDocuments();
    this.reference = `BID-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
BidSchema.index({ freightRequestId: 1, status: 1 });
BidSchema.index({ 'carrier.companyId': 1 });
BidSchema.index({ submittedAt: -1 });

export default mongoose.model<IBid>('Bid', BidSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ICarrier extends Document {
  companyId: string;
  company: {
    name: string;
    registrationNumber: string;
    country: string;
    address: string;
    email: string;
    phone: string;
    website?: string;
  };
  fleet: {
    vesselCount: number;
    totalCapacity: number;
    vesselTypes: string[];
    vessels: Array<{
      name: string;
      imo: string;
      type: string;
      flag: string;
      capacity: number;
      yearBuilt: number;
      status: 'active' | 'maintenance' | 'retired';
    }>;
  };
  certifications: Array<{
    type: string;
    number: string;
    issuedBy: string;
    issuedDate: Date;
    validUntil: Date;
    status: 'valid' | 'expired' | 'pending';
  }>;
  routes: Array<{
    origin: string;
    destination: string;
    frequency: string;
    avgTransitTime: number;
  }>;
  ratings: {
    overall: number;
    reliability: number;
    communication: number;
    pricing: number;
    totalReviews: number;
  };
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  stats: {
    completedJobs: number;
    totalVolume: number;
    onTimeDelivery: number;
    cancelledJobs: number;
    disputedJobs: number;
  };
  preferences: {
    cargoTypes: string[];
    regions: string[];
    minContractValue: number;
    paymentTerms: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const CarrierSchema: Schema = new Schema({
  companyId: {
    type: String,
    required: true,
    unique: true
  },
  company: {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: String
  },
  fleet: {
    vesselCount: { type: Number, default: 0 },
    totalCapacity: { type: Number, default: 0 },
    vesselTypes: [String],
    vessels: [{
      name: { type: String, required: true },
      imo: { type: String, required: true },
      type: { type: String, required: true },
      flag: { type: String, required: true },
      capacity: { type: Number, required: true },
      yearBuilt: { type: Number, required: true },
      status: {
        type: String,
        enum: ['active', 'maintenance', 'retired'],
        default: 'active'
      }
    }]
  },
  certifications: [{
    type: { type: String, required: true },
    number: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['valid', 'expired', 'pending'],
      default: 'valid'
    }
  }],
  routes: [{
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    frequency: { type: String, required: true },
    avgTransitTime: { type: Number, required: true }
  }],
  ratings: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    reliability: { type: Number, default: 0, min: 0, max: 5 },
    communication: { type: Number, default: 0, min: 0, max: 5 },
    pricing: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: String,
  stats: {
    completedJobs: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 100 },
    cancelledJobs: { type: Number, default: 0 },
    disputedJobs: { type: Number, default: 0 }
  },
  preferences: {
    cargoTypes: [String],
    regions: [String],
    minContractValue: { type: Number, default: 0 },
    paymentTerms: [String]
  }
}, {
  timestamps: true
});

// Indexes
CarrierSchema.index({ companyId: 1 });
CarrierSchema.index({ verified: 1 });
CarrierSchema.index({ 'ratings.overall': -1 });
CarrierSchema.index({ 'company.country': 1 });

export default mongoose.model<ICarrier>('Carrier', CarrierSchema);

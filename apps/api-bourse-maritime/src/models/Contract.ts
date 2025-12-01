import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
  reference: string;
  freightRequestId: string;
  bidId: string;
  shipper: {
    companyId: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  carrier: {
    companyId: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  cargo: {
    type: string;
    description: string;
    weight: number;
    volume: number;
    specialRequirements: string;
  };
  route: {
    origin: {
      port: string;
      country: string;
      address: string;
    };
    destination: {
      port: string;
      country: string;
      address: string;
    };
  };
  schedule: {
    loadingDate: Date;
    deliveryDeadline: Date;
    estimatedDeparture: Date;
    estimatedArrival: Date;
  };
  pricing: {
    totalAmount: number;
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
  paymentSchedule: Array<{
    milestone: string;
    percentage: number;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue';
  }>;
  terms: {
    incoterm: string;
    paymentTerms: string;
    insurance: boolean;
    liability: string;
    disputeResolution: string;
    cancellationPolicy: string;
    additionalTerms: string[];
  };
  documents: Array<{
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  signatures: {
    shipper: {
      signedAt?: Date;
      signedBy?: string;
      signature?: string;
      ipAddress?: string;
    };
    carrier: {
      signedAt?: Date;
      signedBy?: string;
      signature?: string;
      ipAddress?: string;
    };
  };
  status: 'draft' | 'pendingSignatures' | 'active' | 'completed' | 'disputed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema: Schema = new Schema({
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
  bidId: {
    type: Schema.Types.ObjectId,
    ref: 'Bid',
    required: true
  },
  shipper: {
    companyId: { type: String, required: true },
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: { type: String, required: true }
  },
  carrier: {
    companyId: { type: String, required: true },
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: { type: String, required: true }
  },
  cargo: {
    type: { type: String, required: true },
    description: { type: String, required: true },
    weight: { type: Number, required: true },
    volume: { type: Number, required: true },
    specialRequirements: String
  },
  route: {
    origin: {
      port: { type: String, required: true },
      country: { type: String, required: true },
      address: { type: String, required: true }
    },
    destination: {
      port: { type: String, required: true },
      country: { type: String, required: true },
      address: { type: String, required: true }
    }
  },
  schedule: {
    loadingDate: { type: Date, required: true },
    deliveryDeadline: { type: Date, required: true },
    estimatedDeparture: { type: Date, required: true },
    estimatedArrival: { type: Date, required: true }
  },
  pricing: {
    totalAmount: { type: Number, required: true },
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
  paymentSchedule: [{
    milestone: { type: String, required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    }
  }],
  terms: {
    incoterm: { type: String, required: true },
    paymentTerms: { type: String, required: true },
    insurance: { type: Boolean, default: false },
    liability: String,
    disputeResolution: String,
    cancellationPolicy: String,
    additionalTerms: [String]
  },
  documents: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String
  }],
  signatures: {
    shipper: {
      signedAt: Date,
      signedBy: String,
      signature: String,
      ipAddress: String
    },
    carrier: {
      signedAt: Date,
      signedBy: String,
      signature: String,
      ipAddress: String
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pendingSignatures', 'active', 'completed', 'disputed', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Auto-generate reference number
ContractSchema.pre('save', async function(next) {
  if (!this.reference) {
    const count = await mongoose.model('Contract').countDocuments();
    this.reference = `CTR-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
ContractSchema.index({ status: 1 });
ContractSchema.index({ 'shipper.companyId': 1 });
ContractSchema.index({ 'carrier.companyId': 1 });
ContractSchema.index({ freightRequestId: 1 });

export default mongoose.model<IContract>('Contract', ContractSchema);

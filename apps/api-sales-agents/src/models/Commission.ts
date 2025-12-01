import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  commissionId: string;
  agentId: mongoose.Types.ObjectId;
  period: {
    month: number;
    year: number;
  };
  clients: Array<{
    clientId: mongoose.Types.ObjectId;
    clientName: string;
    subscriptionAmount: number;
    commissionAmount: number;
  }>;
  totalClients: number;
  totalAmount: number;
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  validatedBy?: mongoose.Types.ObjectId;
  validatedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  statementPdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>({
  commissionId: {
    type: String,
    unique: true,
    required: true
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  clients: [{
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentClient',
      required: true
    },
    clientName: {
      type: String,
      required: true
    },
    subscriptionAmount: {
      type: Number,
      required: true
    },
    commissionAmount: {
      type: Number,
      required: true
    }
  }],
  totalClients: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'paid', 'cancelled'],
    default: 'pending'
  },
  validatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  paidAt: Date,
  paymentReference: String,
  statementPdfUrl: String
}, {
  timestamps: true
});

// Pre-save hook to generate commissionId
CommissionSchema.pre('save', async function(next) {
  if (!this.commissionId) {
    const year = this.period.year;
    const month = String(this.period.month).padStart(2, '0');
    const count = await Commission.countDocuments({
      commissionId: new RegExp(`^COM-${year}-${month}`)
    });
    this.commissionId = `COM-${year}-${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
CommissionSchema.index({ commissionId: 1 });
CommissionSchema.index({ agentId: 1 });
CommissionSchema.index({ status: 1 });
CommissionSchema.index({ 'period.year': 1, 'period.month': 1 });

const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);

export default Commission;

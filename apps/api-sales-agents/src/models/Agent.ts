import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  region: string;
  status: 'pending_signature' | 'active' | 'suspended' | 'terminated' | 'non_compliant';
  documents: Array<{
    type: 'id_card' | 'kbis' | 'urssaf' | 'rib';
    url: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedAt?: Date;
    expiresAt?: Date;
  }>;
  bankDetails: {
    iban: string;
    bic: string;
    bankName: string;
  };
  contractId?: mongoose.Types.ObjectId;
  portalAccess: {
    enabled: boolean;
    lastLogin?: Date;
    passwordHash?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  terminatedAt?: Date;
}

const AgentSchema = new Schema<IAgent>({
  agentId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'France' }
  },
  region: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_signature', 'active', 'suspended', 'terminated', 'non_compliant'],
    default: 'pending_signature'
  },
  documents: [{
    type: {
      type: String,
      enum: ['id_card', 'kbis', 'urssaf', 'rib'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    expiresAt: Date
  }],
  bankDetails: {
    iban: String,
    bic: String,
    bankName: String
  },
  contractId: {
    type: Schema.Types.ObjectId,
    ref: 'AgentContract'
  },
  portalAccess: {
    enabled: {
      type: Boolean,
      default: false
    },
    lastLogin: Date,
    passwordHash: String
  },
  activatedAt: Date,
  terminatedAt: Date
}, {
  timestamps: true
});

// Pre-save hook to generate agentId
AgentSchema.pre('save', async function(next) {
  if (!this.agentId) {
    const year = new Date().getFullYear();
    const count = await Agent.countDocuments({ agentId: new RegExp(`^AGT-${year}`) });
    this.agentId = `AGT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
AgentSchema.index({ agentId: 1 });
AgentSchema.index({ email: 1 });
AgentSchema.index({ status: 1 });
AgentSchema.index({ region: 1 });

const Agent = mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;

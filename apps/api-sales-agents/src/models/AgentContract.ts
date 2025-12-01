import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentContract extends Document {
  contractId: string;
  agentId: mongoose.Types.ObjectId;
  templateVersion: string;
  commissionRate: number;
  region: string;
  duration: 'unlimited' | '1_year';
  clauses: string[];
  pdfUrl?: string;
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated';
  signature?: {
    signedAt: Date;
    signatureData: string;
    ipAddress: string;
    deviceInfo: string;
  };
  createdAt: Date;
  sentAt?: Date;
  signedAt?: Date;
}

const AgentContractSchema = new Schema<IAgentContract>({
  contractId: {
    type: String,
    unique: true,
    required: true
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  templateVersion: {
    type: String,
    required: true,
    default: 'v1.0'
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 70
  },
  region: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    enum: ['unlimited', '1_year'],
    default: 'unlimited'
  },
  clauses: [{
    type: String
  }],
  pdfUrl: String,
  status: {
    type: String,
    enum: ['draft', 'sent', 'signed', 'expired', 'terminated'],
    default: 'draft'
  },
  signature: {
    signedAt: Date,
    signatureData: String,
    ipAddress: String,
    deviceInfo: String
  },
  sentAt: Date,
  signedAt: Date
}, {
  timestamps: true
});

// Pre-save hook to generate contractId
AgentContractSchema.pre('save', async function(next) {
  if (!this.contractId) {
    const year = new Date().getFullYear();
    const count = await AgentContract.countDocuments({ contractId: new RegExp(`^CTR-${year}`) });
    this.contractId = `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
AgentContractSchema.index({ contractId: 1 });
AgentContractSchema.index({ agentId: 1 });
AgentContractSchema.index({ status: 1 });

const AgentContract = mongoose.model<IAgentContract>('AgentContract', AgentContractSchema);

export default AgentContract;

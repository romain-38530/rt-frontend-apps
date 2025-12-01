import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentClient extends Document {
  clientId: string;
  agentId: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  subscriptionType: string;
  subscriptionAmount: number;
  status: 'prospect' | 'active' | 'churned';
  signedAt?: Date;
  churnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgentClientSchema = new Schema<IAgentClient>({
  clientId: {
    type: String,
    unique: true,
    required: true
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  subscriptionType: {
    type: String,
    required: true
  },
  subscriptionAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['prospect', 'active', 'churned'],
    default: 'prospect'
  },
  signedAt: Date,
  churnedAt: Date
}, {
  timestamps: true
});

// Pre-save hook to generate clientId
AgentClientSchema.pre('save', async function(next) {
  if (!this.clientId) {
    const year = new Date().getFullYear();
    const count = await AgentClient.countDocuments({ clientId: new RegExp(`^CLI-${year}`) });
    this.clientId = `CLI-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
AgentClientSchema.index({ clientId: 1 });
AgentClientSchema.index({ agentId: 1 });
AgentClientSchema.index({ status: 1 });
AgentClientSchema.index({ email: 1 });

const AgentClient = mongoose.model<IAgentClient>('AgentClient', AgentClientSchema);

export default AgentClient;

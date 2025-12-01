import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
  reference: string;
  prefacturationId: string;
  invoiceId?: string;
  orderReference?: string;
  type: 'tariff' | 'weight' | 'pallets' | 'documents' | 'delay' | 'quality' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
  initiator: {
    type: 'carrier' | 'client' | 'internal';
    id: string;
    name: string;
  };
  subject: string;
  description: string;
  evidence: Array<{
    type: 'document' | 'photo' | 'email' | 'note';
    url?: string;
    description: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  amount: {
    disputed: number;
    proposed?: number;
    final?: number;
  };
  timeline: Array<{
    date: Date;
    action: string;
    actor: string;
    comment?: string;
    status: string;
  }>;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolution?: {
    decision: string;
    adjustedAmount?: number;
    comment: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  prefacturationId: { type: String, required: true },
  invoiceId: String,
  orderReference: String,
  type: {
    type: String,
    enum: ['tariff', 'weight', 'pallets', 'documents', 'delay', 'quality', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'rejected', 'escalated'],
    default: 'open'
  },
  initiator: {
    type: { type: String, enum: ['carrier', 'client', 'internal'], required: true },
    id: { type: String, required: true },
    name: { type: String, required: true }
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  evidence: [{
    type: { type: String, enum: ['document', 'photo', 'email', 'note'], required: true },
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String
  }],
  amount: {
    disputed: { type: Number, required: true },
    proposed: Number,
    final: Number
  },
  timeline: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    comment: String,
    status: String
  }],
  assignedTo: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  resolution: {
    decision: String,
    adjustedAmount: Number,
    comment: String,
    resolvedBy: String,
    resolvedAt: Date
  },
  dueDate: Date,
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

disputeSchema.index({ reference: 1 });
disputeSchema.index({ prefacturationId: 1 });
disputeSchema.index({ type: 1, status: 1 });
disputeSchema.index({ priority: 1, status: 1 });

export const Dispute = mongoose.model<IDispute>('Dispute', disputeSchema);

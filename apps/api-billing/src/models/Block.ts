import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  reference: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late' | 'manual';
  entity: {
    type: 'order' | 'carrier' | 'client' | 'prefacturation';
    id: string;
    reference?: string;
  };
  reason: string;
  details?: {
    missingDocs?: string[];
    vigilanceExpired?: {
      documentType: string;
      expiryDate: Date;
    };
    palletsDiscrepancy?: {
      expected: number;
      actual: number;
      difference: number;
    };
    delayDays?: number;
    customData?: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'cancelled';
  resolution?: {
    action: string;
    comment: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  impact: {
    blocksBilling: boolean;
    requiresApproval: boolean;
    affectedAmount?: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['missing_documents', 'vigilance', 'pallets', 'late', 'manual'],
    required: true
  },
  entity: {
    type: { type: String, enum: ['order', 'carrier', 'client', 'prefacturation'], required: true },
    id: { type: String, required: true },
    reference: String
  },
  reason: { type: String, required: true },
  details: {
    missingDocs: [String],
    vigilanceExpired: {
      documentType: String,
      expiryDate: Date
    },
    palletsDiscrepancy: {
      expected: Number,
      actual: Number,
      difference: Number
    },
    delayDays: Number,
    customData: Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  resolution: {
    action: String,
    comment: String,
    resolvedBy: String,
    resolvedAt: Date
  },
  impact: {
    blocksBilling: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    affectedAmount: Number
  },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

blockSchema.index({ reference: 1 });
blockSchema.index({ 'entity.type': 1, 'entity.id': 1 });
blockSchema.index({ type: 1, status: 1 });
blockSchema.index({ severity: 1 });

export const Block = mongoose.model<IBlock>('Block', blockSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: string;
  botType: 'helpbot' | 'planif-ia' | 'routier' | 'quai-wms' | 'livraisons' | 'expedition' | 'freight-ia' | 'copilote';
  messages: string[]; // Array of message IDs
  status: 'active' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    context?: any;
  };
  transferredToTechnician: boolean;
  technicianId?: string;
  interactionCount: number;
  rating?: number; // 1-5
  feedback?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  botType: {
    type: String,
    required: true,
    enum: ['helpbot', 'planif-ia', 'routier', 'quai-wms', 'livraisons', 'expedition', 'freight-ia', 'copilote'],
    index: true,
  },
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message',
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed', 'escalated'],
    default: 'active',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    context: Schema.Types.Mixed,
  },
  transferredToTechnician: {
    type: Boolean,
    default: false,
    index: true,
  },
  technicianId: {
    type: String,
    index: true,
  },
  interactionCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: String,
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
ConversationSchema.index({ userId: 1, status: 1 });
ConversationSchema.index({ botType: 1, status: 1 });
ConversationSchema.index({ createdAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

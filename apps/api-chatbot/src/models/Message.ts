import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    filename?: string;
    size?: number;
  }>;
  metadata: {
    responseTime?: number; // ms
    suggestedActions?: string[];
    shouldTransfer?: boolean;
    detectedIntent?: string;
    confidence?: number;
    relatedArticles?: string[];
  };
  timestamp: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system'],
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link'],
    },
    url: String,
    filename: String,
    size: Number,
  }],
  metadata: {
    responseTime: Number,
    suggestedActions: [String],
    shouldTransfer: Boolean,
    detectedIntent: String,
    confidence: Number,
    relatedArticles: [String],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for performance
MessageSchema.index({ conversationId: 1, timestamp: 1 });
MessageSchema.index({ createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);

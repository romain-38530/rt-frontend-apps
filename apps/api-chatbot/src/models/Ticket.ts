import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  conversationId: mongoose.Types.ObjectId | string;
  userId: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  assignedTo?: string;
  category: string;
  tags: string[];
  sla: {
    responseBy: Date;
    resolveBy: Date;
    responded: boolean;
    respondedAt?: Date;
  };
  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  relatedTickets: string[];
  attachments: Array<{
    type: string;
    url: string;
    filename: string;
  }>;
  comments: Array<{
    userId: string;
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled'],
    default: 'open',
    required: true,
    index: true,
  },
  assignedTo: {
    type: String,
    index: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  tags: [String],
  sla: {
    responseBy: {
      type: Date,
      required: true,
    },
    resolveBy: {
      type: Date,
      required: true,
    },
    responded: {
      type: Boolean,
      default: false,
    },
    respondedAt: Date,
  },
  resolution: {
    description: String,
    resolvedBy: String,
    resolvedAt: Date,
  },
  relatedTickets: [{
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
  }],
  attachments: [{
    type: String,
    url: String,
    filename: String,
  }],
  comments: [{
    userId: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
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

TicketSchema.pre('save', function(this: ITicket, next) {
  this.updatedAt = new Date();
  next();
});

// Calculate SLA dates based on priority
TicketSchema.pre('save', function(this: ITicket & { isNew: boolean }, next) {
  if (this.isNew && !this.sla?.responseBy) {
    const now = new Date();
    const slaHours: Record<string, { response: number; resolve: number }> = {
      urgent: { response: 1, resolve: 4 },
      high: { response: 4, resolve: 24 },
      medium: { response: 8, resolve: 72 },
      low: { response: 24, resolve: 168 },
    };

    const config = slaHours[this.priority];
    if (config && this.sla) {
      this.sla.responseBy = new Date(now.getTime() + config.response * 60 * 60 * 1000);
      this.sla.resolveBy = new Date(now.getTime() + config.resolve * 60 * 60 * 1000);
    }
  }
  next();
});

// Indexes for performance
TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ assignedTo: 1, status: 1 });
TicketSchema.index({ priority: 1, status: 1 });
TicketSchema.index({ createdAt: -1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);

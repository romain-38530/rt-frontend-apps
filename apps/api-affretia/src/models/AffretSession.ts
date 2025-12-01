/**
 * Model: AffretSession
 * Session AFFRET.IA - Cycle complet d'affrètement
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAffretSession extends Document {
  orderId: string;
  organizationId: string;
  status: string;
  triggerType: 'manual' | 'auto' | 'capability-gap';
  triggerReason?: string;
  priority: 'normal' | 'high' | 'urgent';

  // Shortlist
  shortlist?: {
    id: string;
    carriers: Array<{
      carrierId: string;
      carrierName: string;
      score: number;
      matchScore: number;
      estimatedPrice: number;
      distance: number;
    }>;
    generatedAt: Date;
  };

  // Broadcast
  broadcast?: {
    id: string;
    channels: string[];
    sentAt: Date;
    stats: {
      totalSent: number;
      delivered: number;
      opened: number;
      clicked: number;
      responded: number;
    };
  };

  // Selection
  selectedProposalId?: string;
  selectedCarrierId?: string;
  selectedPrice?: number;

  // Assignment
  assignment?: {
    id: string;
    carrierId: string;
    carrierName: string;
    finalPrice: number;
    trackingLevel: string;
    trackingId?: string;
    confirmedAt?: Date;
  };

  // Metadata
  createdBy?: string;
  closedAt?: Date;
  closedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AffretSessionSchema = new Schema<IAffretSession>({
  orderId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: [
      'pending',
      'analyzing',
      'shortlist_generated',
      'broadcasting',
      'awaiting_responses',
      'selecting',
      'assigned',
      'in_transit',
      'delivered',
      'closed',
      'failed',
      'cancelled'
    ],
    default: 'pending'
  },
  triggerType: {
    type: String,
    enum: ['manual', 'auto', 'capability-gap'],
    required: true
  },
  triggerReason: String,
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },

  shortlist: {
    id: String,
    carriers: [{
      carrierId: String,
      carrierName: String,
      score: Number,
      matchScore: Number,
      estimatedPrice: Number,
      distance: Number
    }],
    generatedAt: Date
  },

  broadcast: {
    id: String,
    channels: [String],
    sentAt: Date,
    stats: {
      totalSent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      responded: { type: Number, default: 0 }
    }
  },

  selectedProposalId: String,
  selectedCarrierId: String,
  selectedPrice: Number,

  assignment: {
    id: String,
    carrierId: String,
    carrierName: String,
    finalPrice: Number,
    trackingLevel: String,
    trackingId: String,
    confirmedAt: Date
  },

  createdBy: String,
  closedAt: Date,
  closedReason: String
}, {
  timestamps: true
});

// Indexes
AffretSessionSchema.index({ status: 1 });
AffretSessionSchema.index({ createdAt: -1 });
AffretSessionSchema.index({ organizationId: 1, status: 1 });

// Methods
AffretSessionSchema.methods.updateStatus = async function(newStatus: string, reason?: string) {
  this.status = newStatus;
  if (newStatus === 'closed' || newStatus === 'failed' || newStatus === 'cancelled') {
    this.closedAt = new Date();
    this.closedReason = reason;
  }
  return this.save();
};

export default mongoose.model<IAffretSession>('AffretSession', AffretSessionSchema);

/**
 * Model: BroadcastCampaign
 * Campagne de diffusion multi-canal AFFRET.IA
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastCampaign extends Document {
  sessionId: string;
  orderId: string;

  // Configuration
  channels: Array<'email' | 'marketplace' | 'push' | 'sms'>;
  message?: string;
  estimatedPrice: number;
  deadline: Date;

  // Destinataires
  recipients: Array<{
    carrierId: string;
    carrierName: string;
    email?: string;
    phone?: string;
    channel: string;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    respondedAt?: Date;
    status: string;
    errorMessage?: string;
  }>;

  // Statistiques
  stats: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    responded: number;
    bounced: number;
    failed: number;
    byChannel: {
      email?: { sent: number; delivered: number; opened: number; clicked: number };
      marketplace?: { sent: number; delivered: number; opened: number; clicked: number };
      push?: { sent: number; delivered: number; opened: number; clicked: number };
      sms?: { sent: number; delivered: number; opened: number; clicked: number };
    };
  };

  // Status
  status: 'draft' | 'sending' | 'sent' | 'completed' | 'failed';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const BroadcastCampaignSchema = new Schema<IBroadcastCampaign>({
  sessionId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },

  channels: [{
    type: String,
    enum: ['email', 'marketplace', 'push', 'sms']
  }],
  message: String,
  estimatedPrice: Number,
  deadline: Date,

  recipients: [{
    carrierId: { type: String, required: true },
    carrierName: String,
    email: String,
    phone: String,
    channel: { type: String, enum: ['email', 'marketplace', 'push', 'sms'] },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'bounced', 'failed'],
      default: 'pending'
    },
    errorMessage: String
  }],

  stats: {
    totalSent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    responded: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    byChannel: {
      email: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      },
      marketplace: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      },
      push: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      },
      sms: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      }
    }
  },

  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'completed', 'failed'],
    default: 'draft'
  },

  completedAt: Date
}, {
  timestamps: true
});

// Methods
BroadcastCampaignSchema.methods.updateRecipientStatus = async function(
  carrierId: string,
  status: string,
  timestamp?: Date
) {
  const recipient = this.recipients.find((r: any) => r.carrierId === carrierId);
  if (recipient) {
    recipient.status = status;
    const ts = timestamp || new Date();

    switch (status) {
      case 'sent': recipient.sentAt = ts; break;
      case 'delivered': recipient.deliveredAt = ts; break;
      case 'opened': recipient.openedAt = ts; break;
      case 'clicked': recipient.clickedAt = ts; break;
      case 'responded': recipient.respondedAt = ts; break;
    }

    // Update stats
    this.recalculateStats();
    return this.save();
  }
  return this;
};

BroadcastCampaignSchema.methods.recalculateStats = function() {
  const stats = {
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    responded: 0,
    bounced: 0,
    failed: 0
  };

  this.recipients.forEach((r: any) => {
    if (r.sentAt) stats.totalSent++;
    if (r.deliveredAt) stats.delivered++;
    if (r.openedAt) stats.opened++;
    if (r.clickedAt) stats.clicked++;
    if (r.respondedAt) stats.responded++;
    if (r.status === 'bounced') stats.bounced++;
    if (r.status === 'failed') stats.failed++;
  });

  this.stats = { ...this.stats, ...stats };
};

export default mongoose.model<IBroadcastCampaign>('BroadcastCampaign', BroadcastCampaignSchema);

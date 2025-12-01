import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'email' | 'sms' | 'push' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface INotification extends Document {
  notificationId: string;
  type: NotificationType;
  recipient: string; // email, phone, deviceId, or webhook URL
  subject?: string;
  body: string;
  status: NotificationStatus;
  relatedEntity?: {
    type: 'cheque' | 'dispute' | 'site' | 'quota';
    id: string;
  };
  metadata?: {
    companyId?: string;
    chequeId?: string;
    disputeId?: string;
    siteId?: string;
    action?: string;
  };
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'webhook'],
    required: true,
    index: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered'],
    default: 'pending',
    index: true,
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['cheque', 'dispute', 'site', 'quota'],
    },
    id: String,
  },
  metadata: {
    companyId: String,
    chequeId: String,
    disputeId: String,
    siteId: String,
    action: String,
  },
  sentAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  error: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
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

NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour recherches fréquentes
NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ 'metadata.companyId': 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);

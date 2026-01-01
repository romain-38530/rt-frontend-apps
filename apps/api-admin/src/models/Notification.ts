/**
 * Modèle pour les notifications
 */

import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'announcement';
export type NotificationTargetType = 'all' | 'role' | 'user' | 'company';

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  target: {
    type: NotificationTargetType;
    value?: string;
  };
  link?: string;
  imageUrl?: string;
  data?: any;
  expiresAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface INotificationRead extends Document {
  userId: mongoose.Types.ObjectId;
  notificationId: mongoose.Types.ObjectId;
  readAt: Date;
}

const notificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'announcement'],
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  target: {
    type: {
      type: String,
      enum: ['all', 'role', 'user', 'company'],
      required: true
    },
    value: String
  },
  link: String,
  imageUrl: String,
  data: Schema.Types.Mixed,
  expiresAt: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index pour requêtes rapides
notificationSchema.index({ 'target.type': 1, 'target.value': 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: -1 });

// Index TTL pour auto-suppression (optionnel)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const notificationReadSchema = new Schema<INotificationRead>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationId: {
    type: Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

// Index unique pour éviter les doublons
notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const NotificationRead = mongoose.model<INotificationRead>('NotificationRead', notificationReadSchema);

export default Notification;

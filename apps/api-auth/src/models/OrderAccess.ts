import mongoose, { Schema, Document } from 'mongoose';

export type OrderAccessLevel = 'view' | 'edit' | 'sign' | 'full';

export interface IOrderAccess extends Document {
  accessId: string;
  orderId: string;
  logisticianId: string;
  industrialId: string;
  accessLevel: OrderAccessLevel;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}

const OrderAccessSchema = new Schema<IOrderAccess>({
  accessId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  },
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  logisticianId: {
    type: String,
    required: true,
    index: true,
  },
  industrialId: {
    type: String,
    required: true,
    index: true,
  },
  accessLevel: {
    type: String,
    enum: ['view', 'edit', 'sign', 'full'],
    default: 'view',
  },
  grantedBy: {
    type: String,
    required: true,
  },
  grantedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  revokedAt: Date,
  revokedBy: String,
  revokeReason: String,
}, {
  timestamps: true,
});

// Index composés pour recherche efficace
OrderAccessSchema.index({ orderId: 1, logisticianId: 1 }, { unique: true });
OrderAccessSchema.index({ logisticianId: 1, revoked: 1 });
OrderAccessSchema.index({ orderId: 1, revoked: 1 });

export default mongoose.model<IOrderAccess>('OrderAccess', OrderAccessSchema);

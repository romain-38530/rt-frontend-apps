import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type OrderAccessLevel = 'view' | 'edit' | 'sign' | 'full';

export interface ILogisticianInvitation extends Document {
  invitationId: string;
  industrialId: string;
  industrialName: string;
  email: string;
  companyName?: string;
  accessLevel: OrderAccessLevel;
  token: string;
  status: InvitationStatus;
  message?: string;
  orderIds?: string[];
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  cancelledAt?: Date;
}

const LogisticianInvitationSchema = new Schema<ILogisticianInvitation>({
  invitationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  },
  industrialId: {
    type: String,
    required: true,
    index: true,
  },
  industrialName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  companyName: {
    type: String,
  },
  accessLevel: {
    type: String,
    enum: ['view', 'edit', 'sign', 'full'],
    default: 'view',
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex'),
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending',
  },
  message: {
    type: String,
  },
  orderIds: [{
    type: String,
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
  },
  acceptedAt: Date,
  cancelledAt: Date,
}, {
  timestamps: true,
});

// Index pour recherche par token
LogisticianInvitationSchema.index({ token: 1 });
LogisticianInvitationSchema.index({ industrialId: 1, status: 1 });
LogisticianInvitationSchema.index({ email: 1, status: 1 });

// Méthode pour vérifier si l'invitation est valide
LogisticianInvitationSchema.methods.isValid = function(): boolean {
  return this.status === 'pending' && new Date() < this.expiresAt;
};

export default mongoose.model<ILogisticianInvitation>('LogisticianInvitation', LogisticianInvitationSchema);

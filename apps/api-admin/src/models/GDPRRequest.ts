/**
 * Modèle pour les demandes GDPR
 */

import mongoose, { Schema, Document } from 'mongoose';

export type GDPRRequestType = 'access' | 'deletion' | 'portability' | 'rectification';
export type GDPRRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface IGDPRRequest extends Document {
  type: GDPRRequestType;
  status: GDPRRequestStatus;
  requestedBy: mongoose.Types.ObjectId;
  targetUser: mongoose.Types.ObjectId;
  reason?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  result?: any;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const gdprRequestSchema = new Schema<IGDPRRequest>({
  type: {
    type: String,
    enum: ['access', 'deletion', 'portability', 'rectification'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: String,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  result: Schema.Types.Mixed,
  notes: String
}, {
  timestamps: true
});

// Index pour recherche rapide
gdprRequestSchema.index({ status: 1 });
gdprRequestSchema.index({ requestedBy: 1 });
gdprRequestSchema.index({ targetUser: 1 });
gdprRequestSchema.index({ createdAt: -1 });

export const GDPRRequest = mongoose.model<IGDPRRequest>('GDPRRequest', gdprRequestSchema);
export default GDPRRequest;

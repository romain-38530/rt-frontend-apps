import mongoose, { Schema, Document } from 'mongoose';

export type DisputeType = 'quantite_incorrecte' | 'qualite_non_conforme' | 'type_incorrect' | 'non_reception' | 'hors_delai' | 'autre';
export type DisputeStatus = 'OPEN' | 'PROPOSED' | 'RESOLVED' | 'ESCALATED' | 'REJECTED';
export type DisputePriority = 'high' | 'medium' | 'low';
export type ResolutionType = 'ajustement_total' | 'ajustement_partiel' | 'rejet' | 'compensation';

export interface IResolution {
  type: ResolutionType;
  adjustedQuantity: number;
  description: string;
  proposedBy: string;
  proposedByName: string;
  proposedAt: Date;
  validatedBy?: string;
  validatedAt?: Date;
}

export interface IDisputeComment {
  author: string;
  authorName: string;
  content: string;
  at: Date;
}

export interface IPalletDispute extends Document {
  disputeId: string;
  chequeId: string;
  initiatorId: string;
  initiatorName: string;
  respondentId: string;
  respondentName: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  claimedQuantity: number;
  actualQuantity: number;
  resolution?: IResolution;
  comments: IDisputeComment[];
  photos: string[];
  auditTrail: Array<{
    action: string;
    by: string;
    at: Date;
    details?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const ResolutionSchema = new Schema<IResolution>({
  type: {
    type: String,
    enum: ['ajustement_total', 'ajustement_partiel', 'rejet', 'compensation'],
    required: true,
  },
  adjustedQuantity: { type: Number, required: true },
  description: { type: String, required: true },
  proposedBy: { type: String, required: true },
  proposedByName: { type: String, required: true },
  proposedAt: { type: Date, default: Date.now },
  validatedBy: String,
  validatedAt: Date,
});

const CommentSchema = new Schema<IDisputeComment>({
  author: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  at: { type: Date, default: Date.now },
});

const PalletDisputeSchema = new Schema<IPalletDispute>({
  disputeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  chequeId: {
    type: String,
    required: true,
    index: true,
  },
  initiatorId: {
    type: String,
    required: true,
    index: true,
  },
  initiatorName: {
    type: String,
    required: true,
  },
  respondentId: {
    type: String,
    required: true,
    index: true,
  },
  respondentName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['quantite_incorrecte', 'qualite_non_conforme', 'type_incorrect', 'non_reception', 'hors_delai', 'autre'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'PROPOSED', 'RESOLVED', 'ESCALATED', 'REJECTED'],
    default: 'OPEN',
    index: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  claimedQuantity: {
    type: Number,
    required: true,
  },
  actualQuantity: {
    type: Number,
    required: true,
  },
  resolution: ResolutionSchema,
  comments: [CommentSchema],
  photos: [String],
  auditTrail: [{
    action: { type: String, required: true },
    by: { type: String, required: true },
    at: { type: Date, default: Date.now },
    details: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: Date,
});

PalletDisputeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour recherches fréquentes
PalletDisputeSchema.index({ status: 1, priority: -1 });
PalletDisputeSchema.index({ createdAt: -1 });

export default mongoose.model<IPalletDispute>('PalletDispute', PalletDisputeSchema);

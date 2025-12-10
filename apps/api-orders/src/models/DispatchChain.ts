/**
 * Modèle DispatchChain - Chaîne d'affectation SYMPHONI.A
 * Gère le processus d'envoi séquentiel aux transporteurs
 */
import mongoose, { Document, Schema } from 'mongoose';

export type DispatchAttemptStatus =
  | 'pending'      // En attente d'envoi
  | 'sent'         // Envoyé, en attente de réponse
  | 'accepted'     // Accepté par le transporteur
  | 'refused'      // Refusé par le transporteur
  | 'timeout'      // Délai de réponse dépassé
  | 'skipped';     // Sauté (transporteur non éligible)

export interface IDispatchAttempt {
  carrierId: string;
  carrierName: string;
  position: number;
  status: DispatchAttemptStatus;
  sentAt?: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  reminderSentAt?: Date;  // Date d'envoi du rappel (50% du délai)
  responseDelayMinutes: number;
  refusalReason?: string;
  skipReason?: string;
  notificationChannels: ('email' | 'sms' | 'portal')[];
  notificationsSent: {
    channel: 'email' | 'sms' | 'portal';
    sentAt: Date;
    status: 'sent' | 'delivered' | 'failed';
  }[];
  proposedPrice?: number;
  finalPrice?: number;
}

export interface IDispatchChain extends Document {
  chainId: string;
  orderId: string;
  orderReference: string;
  industrialId: string;
  laneId?: string;
  laneName?: string;

  // Statut global de la chaîne
  status: 'pending' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';

  // Transporteur assigné (si accepté)
  assignedCarrierId?: string;
  assignedCarrierName?: string;
  assignedAt?: Date;

  // Tentatives d'affectation
  attempts: IDispatchAttempt[];
  currentAttemptIndex: number;
  maxAttempts: number;

  // Escalade Affret.IA
  escalation?: {
    escalatedAt: Date;
    affretiaOrderId?: string;
    status: 'pending' | 'in_progress' | 'assigned' | 'failed';
    assignedCarrierId?: string;
    assignedCarrierName?: string;
    assignedAt?: Date;
    proposedPrice?: number;
  };

  // Configuration
  config: {
    autoEscalate: boolean;
    notifyIndustrial: boolean;
    requirePriceConfirmation: boolean;
  };

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchAttemptSchema = new Schema<IDispatchAttempt>({
  carrierId: { type: String, required: true },
  carrierName: { type: String, required: true },
  position: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'accepted', 'refused', 'timeout', 'skipped'],
    default: 'pending'
  },
  sentAt: Date,
  respondedAt: Date,
  expiresAt: Date,
  reminderSentAt: Date,
  responseDelayMinutes: { type: Number, default: 120 },
  refusalReason: String,
  skipReason: String,
  notificationChannels: {
    type: [String],
    enum: ['email', 'sms', 'portal'],
    default: ['email', 'portal']
  },
  notificationsSent: [{
    channel: { type: String, enum: ['email', 'sms', 'portal'] },
    sentAt: Date,
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }],
  proposedPrice: Number,
  finalPrice: Number
}, { _id: false });

const DispatchChainSchema = new Schema<IDispatchChain>({
  chainId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  orderReference: { type: String, required: true },
  industrialId: { type: String, required: true, index: true },
  laneId: String,
  laneName: String,

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'escalated', 'cancelled'],
    default: 'pending',
    index: true
  },

  assignedCarrierId: String,
  assignedCarrierName: String,
  assignedAt: Date,

  attempts: [DispatchAttemptSchema],
  currentAttemptIndex: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },

  escalation: {
    escalatedAt: Date,
    affretiaOrderId: String,
    status: { type: String, enum: ['pending', 'in_progress', 'assigned', 'failed'] },
    assignedCarrierId: String,
    assignedCarrierName: String,
    assignedAt: Date,
    proposedPrice: Number
  },

  config: {
    autoEscalate: { type: Boolean, default: true },
    notifyIndustrial: { type: Boolean, default: true },
    requirePriceConfirmation: { type: Boolean, default: false }
  },

  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

// Indexes
DispatchChainSchema.index({ status: 1, 'attempts.expiresAt': 1 });  // Pour le job de timeout
DispatchChainSchema.index({ industrialId: 1, status: 1 });

export default mongoose.model<IDispatchChain>('DispatchChain', DispatchChainSchema);

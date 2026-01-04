/**
 * IssueFollowUp - Suivi des incidents avec relances horaires
 * Permet de notifier le destinataire et relancer le transporteur pour des updates
 */
import mongoose, { Document, Schema } from 'mongoose';

export type FollowUpStatus =
  | 'active'       // Relances en cours
  | 'resolved'     // Incident resolu
  | 'escalated'    // Escalade manager
  | 'cancelled';   // Annule

export interface IFollowUpMessage {
  type: 'recipient_notification' | 'carrier_followup' | 'carrier_response' | 'status_update';
  sentAt: Date;
  messageId?: string;
  recipient: string;
  content: string;
  responseReceived?: boolean;
  responseAt?: Date;
  responseContent?: string;
}

export interface IIssueFollowUp extends Document {
  followUpId: string;

  // Commande concernee
  orderId: string;
  orderReference: string;

  // Email qui a declenche l'incident
  sourceEmailId: string;

  // Parties impliquees
  carrierEmail: string;
  carrierName?: string;
  recipientEmail: string;
  recipientName?: string;
  industrialEmail?: string;

  // Details de l'incident
  issueType: string;
  issueSeverity: 'low' | 'medium' | 'high' | 'critical';
  issueDescription: string;

  // Statut du suivi
  status: FollowUpStatus;

  // Messages envoyes
  messages: IFollowUpMessage[];

  // Planification des relances
  nextFollowUpAt?: Date;
  followUpCount: number;
  maxFollowUps: number;         // Nombre max de relances (defaut: 24 = 24h)
  followUpIntervalMinutes: number;  // Intervalle entre relances (defaut: 60)

  // Resolution
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpMessageSchema = new Schema<IFollowUpMessage>({
  type: {
    type: String,
    required: true,
    enum: ['recipient_notification', 'carrier_followup', 'carrier_response', 'status_update']
  },
  sentAt: { type: Date, required: true },
  messageId: String,
  recipient: { type: String, required: true },
  content: { type: String, required: true },
  responseReceived: Boolean,
  responseAt: Date,
  responseContent: String
}, { _id: false });

const IssueFollowUpSchema = new Schema<IIssueFollowUp>({
  followUpId: { type: String, required: true, unique: true },

  orderId: { type: String, required: true, index: true },
  orderReference: { type: String, required: true },

  sourceEmailId: { type: String, required: true },

  carrierEmail: { type: String, required: true },
  carrierName: String,
  recipientEmail: { type: String, required: true },
  recipientName: String,
  industrialEmail: String,

  issueType: { type: String, required: true },
  issueSeverity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  issueDescription: { type: String, required: true },

  status: {
    type: String,
    required: true,
    default: 'active',
    enum: ['active', 'resolved', 'escalated', 'cancelled']
  },

  messages: [FollowUpMessageSchema],

  nextFollowUpAt: { type: Date, index: true },
  followUpCount: { type: Number, default: 0 },
  maxFollowUps: { type: Number, default: 24 },
  followUpIntervalMinutes: { type: Number, default: 60 },

  resolvedAt: Date,
  resolvedBy: String,
  resolution: String
}, { timestamps: true });

// Index pour le scheduler de relances
IssueFollowUpSchema.index({ status: 1, nextFollowUpAt: 1 });

export default mongoose.model<IIssueFollowUp>('IssueFollowUp', IssueFollowUpSchema);

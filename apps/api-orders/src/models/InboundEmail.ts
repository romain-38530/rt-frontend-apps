/**
 * InboundEmail - Emails recus pour traitement automatique
 * Stocke les emails entrants et leur analyse par Claude
 */
import mongoose, { Document, Schema } from 'mongoose';

export type EmailProcessingStatus =
  | 'received'      // Email recu
  | 'parsing'       // En cours d'analyse
  | 'analyzed'      // Analyse par Claude terminee
  | 'processing'    // Action en cours
  | 'completed'     // Traitement termine
  | 'failed'        // Echec du traitement
  | 'ignored';      // Email ignore (spam, hors sujet)

export type DetectedIntent =
  | 'status_update'       // Mise a jour de statut (ex: "je suis arrive")
  | 'position_update'     // Mise a jour position
  | 'eta_update'          // Changement ETA
  | 'issue_report'        // Signalement d'incident
  | 'delivery_confirm'    // Confirmation de livraison
  | 'question'            // Question necessitant reponse
  | 'document_attached'   // Document joint
  | 'acknowledgment'      // Simple accusé reception
  | 'complaint'           // Plainte/reclamation
  | 'unknown';            // Intent non reconnu

export interface IInboundEmail extends Document {
  emailId: string;
  messageId: string;          // ID SES du message

  // Expediteur
  fromEmail: string;
  fromName?: string;

  // Destinataire (notre adresse)
  toEmail: string;

  // Contenu
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    s3Key?: string;
  }>;

  // Contexte detecte
  relatedOrderId?: string;
  relatedOrderReference?: string;
  relatedActionToken?: string;  // Si c'est une reponse a un email avec action

  // Analyse Claude
  claudeAnalysis?: {
    intent: DetectedIntent;
    confidence: number;        // 0-1
    extractedData?: Record<string, any>;  // Donnees extraites (position, statut, etc)
    suggestedAction?: string;
    suggestedResponse?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    summary?: string;
  };

  // Actions effectuees
  actionsExecuted?: Array<{
    action: string;
    timestamp: Date;
    success: boolean;
    result?: any;
  }>;

  // Reponse automatique
  autoReply?: {
    sent: boolean;
    sentAt?: Date;
    messageId?: string;
    content?: string;
  };

  // Statut
  status: EmailProcessingStatus;
  processingError?: string;

  // Timestamps
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
}

const InboundEmailSchema = new Schema<IInboundEmail>({
  emailId: { type: String, required: true, unique: true },
  messageId: { type: String, required: true, index: true },

  fromEmail: { type: String, required: true, index: true },
  fromName: { type: String },
  toEmail: { type: String, required: true },

  subject: { type: String, required: true },
  bodyText: { type: String },
  bodyHtml: { type: String },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    s3Key: String
  }],

  relatedOrderId: { type: String, index: true },
  relatedOrderReference: { type: String },
  relatedActionToken: { type: String },

  claudeAnalysis: {
    intent: {
      type: String,
      enum: ['status_update', 'position_update', 'eta_update', 'issue_report',
             'delivery_confirm', 'question', 'document_attached', 'acknowledgment',
             'complaint', 'unknown']
    },
    confidence: Number,
    extractedData: Schema.Types.Mixed,
    suggestedAction: String,
    suggestedResponse: String,
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    summary: String
  },

  actionsExecuted: [{
    action: String,
    timestamp: Date,
    success: Boolean,
    result: Schema.Types.Mixed
  }],

  autoReply: {
    sent: Boolean,
    sentAt: Date,
    messageId: String,
    content: String
  },

  status: {
    type: String,
    required: true,
    default: 'received',
    enum: ['received', 'parsing', 'analyzed', 'processing', 'completed', 'failed', 'ignored']
  },
  processingError: String,

  receivedAt: { type: Date, required: true },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Index pour recherche par email et commande
InboundEmailSchema.index({ fromEmail: 1, relatedOrderId: 1 });
InboundEmailSchema.index({ status: 1, receivedAt: -1 });

export default mongoose.model<IInboundEmail>('InboundEmail', InboundEmailSchema);

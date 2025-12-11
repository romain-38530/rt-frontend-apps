import mongoose, { Schema, Document } from 'mongoose';

export type EmailType = 'PRESENTATION' | 'COMMERCIAL_INTRO' | 'RELANCE_1' | 'RELANCE_2' | 'MANUEL';
export type EmailSendStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'UNSUBSCRIBED' | 'FAILED';

export interface ILeadEmail extends Document {
  contactId: mongoose.Types.ObjectId;
  entrepriseId: mongoose.Types.ObjectId;

  // Contenu
  typeEmail: EmailType;
  templateId?: string;
  sujet: string;
  corpsHtml?: string;
  corpsText?: string;
  langue: string;

  // Envoi
  expediteurEmail: string;
  expediteurNom: string;
  mailgunMessageId?: string;
  dateEnvoi?: Date;
  statutEnvoi: EmailSendStatus;

  // Tracking
  dateDelivered?: Date;
  dateOpened?: Date;
  nbOpens: number;
  dateClicked?: Date;
  nbClicks: number;
  linksClicked: string[];

  // Erreurs
  bounceType?: string;
  bounceMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LeadEmailSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId, ref: 'LeadContact', required: true },
  entrepriseId: { type: Schema.Types.ObjectId, ref: 'LeadCompany', required: true },

  // Contenu
  typeEmail: {
    type: String,
    enum: ['PRESENTATION', 'COMMERCIAL_INTRO', 'RELANCE_1', 'RELANCE_2', 'MANUEL'],
    required: true
  },
  templateId: String,
  sujet: { type: String, required: true },
  corpsHtml: String,
  corpsText: String,
  langue: { type: String, default: 'fr', maxlength: 2 },

  // Envoi
  expediteurEmail: { type: String, required: true },
  expediteurNom: { type: String, required: true },
  mailgunMessageId: String,
  dateEnvoi: Date,
  statutEnvoi: {
    type: String,
    enum: ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED', 'FAILED'],
    default: 'PENDING'
  },

  // Tracking
  dateDelivered: Date,
  dateOpened: Date,
  nbOpens: { type: Number, default: 0 },
  dateClicked: Date,
  nbClicks: { type: Number, default: 0 },
  linksClicked: [String],

  // Erreurs
  bounceType: String,
  bounceMessage: String
}, {
  timestamps: true
});

LeadEmailSchema.index({ contactId: 1 });
LeadEmailSchema.index({ entrepriseId: 1 });
LeadEmailSchema.index({ statutEnvoi: 1 });
LeadEmailSchema.index({ dateEnvoi: -1 });
LeadEmailSchema.index({ mailgunMessageId: 1 });
LeadEmailSchema.index({ typeEmail: 1 });

export default mongoose.model<ILeadEmail>('LeadEmail', LeadEmailSchema);

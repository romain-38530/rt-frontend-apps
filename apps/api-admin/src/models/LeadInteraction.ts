import mongoose, { Schema, Document } from 'mongoose';

export type InteractionType =
  | 'CREATION'
  | 'ENRICHISSEMENT'
  | 'EMAIL_ENVOYE'
  | 'EMAIL_OUVERT'
  | 'EMAIL_CLICKED'
  | 'EMAIL_RECU'
  | 'ASSIGNATION'
  | 'CHANGEMENT_STATUT'
  | 'NOTE'
  | 'APPEL'
  | 'RDV'
  | 'CONVERSION';

export interface ILeadInteraction extends Document {
  entrepriseId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  commercialId?: mongoose.Types.ObjectId;
  typeInteraction: InteractionType;
  description?: string;
  metadata?: Record<string, unknown>;
  emailId?: mongoose.Types.ObjectId;
  createdBy?: string;
  createdAt: Date;
}

const LeadInteractionSchema = new Schema({
  entrepriseId: { type: Schema.Types.ObjectId, ref: 'LeadCompany', required: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'LeadContact' },
  commercialId: { type: Schema.Types.ObjectId, ref: 'User' },
  typeInteraction: {
    type: String,
    enum: [
      'CREATION',
      'ENRICHISSEMENT',
      'EMAIL_ENVOYE',
      'EMAIL_OUVERT',
      'EMAIL_CLICKED',
      'EMAIL_RECU',
      'ASSIGNATION',
      'CHANGEMENT_STATUT',
      'NOTE',
      'APPEL',
      'RDV',
      'CONVERSION'
    ],
    required: true
  },
  description: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
  emailId: { type: Schema.Types.ObjectId, ref: 'LeadEmail' },
  createdBy: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

LeadInteractionSchema.index({ entrepriseId: 1, createdAt: -1 });
LeadInteractionSchema.index({ contactId: 1 });
LeadInteractionSchema.index({ typeInteraction: 1 });
LeadInteractionSchema.index({ createdAt: -1 });

export default mongoose.model<ILeadInteraction>('LeadInteraction', LeadInteractionSchema);

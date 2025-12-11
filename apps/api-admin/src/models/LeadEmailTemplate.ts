import mongoose, { Schema, Document } from 'mongoose';

export type EmailTemplateType = 'PRESENTATION' | 'COMMERCIAL_INTRO' | 'RELANCE_1' | 'RELANCE_2';

export interface ILeadEmailTemplate extends Document {
  code: string;
  nom: string;
  typeEmail: EmailTemplateType;
  langue: string;
  sujetTemplate: string;
  corpsHtmlTemplate: string;
  corpsTextTemplate?: string;
  variablesDisponibles: string[];
  actif: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeadEmailTemplateSchema = new Schema({
  code: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  typeEmail: {
    type: String,
    enum: ['PRESENTATION', 'COMMERCIAL_INTRO', 'RELANCE_1', 'RELANCE_2'],
    required: true
  },
  langue: { type: String, required: true, maxlength: 2 },
  sujetTemplate: { type: String, required: true },
  corpsHtmlTemplate: { type: String, required: true },
  corpsTextTemplate: String,
  variablesDisponibles: [String],
  actif: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

LeadEmailTemplateSchema.index({ typeEmail: 1, langue: 1 });
LeadEmailTemplateSchema.index({ actif: 1 });

export default mongoose.model<ILeadEmailTemplate>('LeadEmailTemplate', LeadEmailTemplateSchema);

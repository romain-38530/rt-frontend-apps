import mongoose, { Schema, Document } from 'mongoose';

export type EmailStatus = 'UNKNOWN' | 'VALID' | 'INVALID' | 'CATCH_ALL' | 'DISPOSABLE' | 'RISKY';
export type ContactStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'MEETING_SCHEDULED' | 'CONVERTED' | 'OPTED_OUT' | 'BOUNCED';
export type EnrichmentSource = 'APOLLO' | 'HUNTER' | 'LEMLIST' | 'MANUAL' | 'SCRAPING';
export type Seniority = 'director' | 'vp' | 'manager' | 'senior' | 'entry' | 'unknown';

export interface ILeadContact extends Document {
  entrepriseId: mongoose.Types.ObjectId;

  // Identité
  civilite?: string;
  prenom?: string;
  nom: string;
  poste?: string;
  seniority?: Seniority;

  // Coordonnées
  email?: string;
  emailStatus: EmailStatus;
  telephoneDirect?: string;
  linkedinUrl?: string;

  // Enrichissement
  sourceEnrichissement?: EnrichmentSource;
  apolloPersonId?: string;
  hunterData?: Record<string, unknown>;
  lemlistData?: Record<string, unknown>;
  dateEnrichissement?: Date;

  // Prospection
  statutContact: ContactStatus;
  estContactPrincipal: boolean;
  optOut: boolean;
  dateOptOut?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const LeadContactSchema = new Schema({
  entrepriseId: { type: Schema.Types.ObjectId, ref: 'LeadCompany', required: true },

  // Identité
  civilite: String,
  prenom: String,
  nom: { type: String, required: true },
  poste: String,
  seniority: {
    type: String,
    enum: ['director', 'vp', 'manager', 'senior', 'entry', 'unknown'],
    default: 'unknown'
  },

  // Coordonnées
  email: { type: String, lowercase: true },
  emailStatus: {
    type: String,
    enum: ['UNKNOWN', 'VALID', 'INVALID', 'CATCH_ALL', 'DISPOSABLE', 'RISKY'],
    default: 'UNKNOWN'
  },
  telephoneDirect: String,
  linkedinUrl: String,

  // Enrichissement
  sourceEnrichissement: {
    type: String,
    enum: ['APOLLO', 'HUNTER', 'LEMLIST', 'MANUAL', 'SCRAPING']
  },
  apolloPersonId: String,
  hunterData: { type: Schema.Types.Mixed, default: {} },
  lemlistData: { type: Schema.Types.Mixed, default: {} },
  dateEnrichissement: Date,

  // Prospection
  statutContact: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'CONVERTED', 'OPTED_OUT', 'BOUNCED'],
    default: 'NEW'
  },
  estContactPrincipal: { type: Boolean, default: false },
  optOut: { type: Boolean, default: false },
  dateOptOut: Date
}, {
  timestamps: true
});

LeadContactSchema.index({ entrepriseId: 1 });
LeadContactSchema.index({ email: 1 });
LeadContactSchema.index({ statutContact: 1 });
LeadContactSchema.index({ entrepriseId: 1, estContactPrincipal: 1 });
LeadContactSchema.index({ nom: 'text', prenom: 'text', poste: 'text' });
LeadContactSchema.index({ emailStatus: 1 });
LeadContactSchema.index({ seniority: 1 });

export default mongoose.model<ILeadContact>('LeadContact', LeadContactSchema);

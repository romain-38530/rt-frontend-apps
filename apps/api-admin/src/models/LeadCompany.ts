import mongoose, { Schema, Document } from 'mongoose';

export type ProspectionStatus = 'NEW' | 'ENRICHED' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'BLACKLISTED';

export interface ILeadCompany extends Document {
  // Identification
  raisonSociale: string;
  formeJuridique?: string;
  siren?: string;
  siret?: string;
  tvaIntracommunautaire?: string;

  // Coordonnées
  adresse: {
    ligne1?: string;
    ligne2?: string;
    codePostal?: string;
    ville?: string;
    pays: string;
  };
  telephone?: string;
  emailGenerique?: string;
  siteWeb?: string;
  linkedinCompanyUrl?: string;

  // Informations business
  secteurActivite?: string;
  codeNaf?: string;
  effectifTranche?: string;
  chiffreAffairesTranche?: string;
  descriptionActivite?: string;

  // Enrichissement Apollo (legacy)
  apolloOrgId?: string;
  apolloData?: Record<string, unknown>;
  dateEnrichissementApollo?: Date;

  // Enrichissement Lemlist
  lemlistData?: Record<string, unknown>;
  dateEnrichissement?: Date;

  // Source
  salonSourceId?: mongoose.Types.ObjectId;
  urlPageExposant?: string;
  numeroStand?: string;

  // Prospection
  statutProspection: ProspectionStatus;
  commercialAssigneId?: mongoose.Types.ObjectId;
  dateAssignation?: Date;
  scoreLead?: number;

  // Pool de leads
  inPool: boolean;
  dateAddedToPool?: Date;
  nbContactsEnrichis?: number;
  lastContactAttempt?: Date;
  prioritePool?: number; // 1-5, 5 = haute priorite

  createdAt: Date;
  updatedAt: Date;
}

const LeadCompanySchema = new Schema({
  // Identification
  raisonSociale: { type: String, required: true },
  formeJuridique: String,
  siren: { type: String, maxlength: 9 },
  siret: { type: String, maxlength: 14 },
  tvaIntracommunautaire: String,

  // Coordonnées
  adresse: {
    ligne1: String,
    ligne2: String,
    codePostal: String,
    ville: String,
    pays: { type: String, required: true, maxlength: 50 }
  },
  telephone: String,
  emailGenerique: String,
  siteWeb: String,
  linkedinCompanyUrl: String,

  // Informations business
  secteurActivite: String,
  codeNaf: String,
  effectifTranche: String,
  chiffreAffairesTranche: String,
  descriptionActivite: String,

  // Enrichissement Apollo (legacy)
  apolloOrgId: String,
  apolloData: { type: Schema.Types.Mixed, default: {} },
  dateEnrichissementApollo: Date,

  // Enrichissement Lemlist
  lemlistData: { type: Schema.Types.Mixed, default: {} },
  dateEnrichissement: Date,

  // Source
  salonSourceId: { type: Schema.Types.ObjectId, ref: 'LeadSalon' },
  urlPageExposant: String,
  numeroStand: String,

  // Prospection
  statutProspection: {
    type: String,
    enum: ['NEW', 'ENRICHED', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST', 'BLACKLISTED'],
    default: 'NEW'
  },
  commercialAssigneId: { type: Schema.Types.ObjectId, ref: 'User' },
  dateAssignation: Date,
  scoreLead: { type: Number, min: 0, max: 100 },

  // Pool de leads
  inPool: { type: Boolean, default: false },
  dateAddedToPool: Date,
  nbContactsEnrichis: { type: Number, default: 0 },
  lastContactAttempt: Date,
  prioritePool: { type: Number, min: 1, max: 5, default: 3 }
}, {
  timestamps: true
});

// Index unique sur SIREN si présent
LeadCompanySchema.index({ siren: 1 }, { unique: true, sparse: true });
LeadCompanySchema.index({ adresse_pays: 1 });
LeadCompanySchema.index({ statutProspection: 1 });
LeadCompanySchema.index({ commercialAssigneId: 1 });
LeadCompanySchema.index({ salonSourceId: 1 });
LeadCompanySchema.index({ raisonSociale: 'text', descriptionActivite: 'text' });
LeadCompanySchema.index({ secteurActivite: 1 });
LeadCompanySchema.index({ scoreLead: -1 });
LeadCompanySchema.index({ inPool: 1, prioritePool: -1, scoreLead: -1 });
LeadCompanySchema.index({ inPool: 1, 'adresse.pays': 1 });

export default mongoose.model<ILeadCompany>('LeadCompany', LeadCompanySchema);

import mongoose, { Schema, Document } from 'mongoose';

export type ScrapingStatus = 'A_SCRAPER' | 'EN_COURS' | 'TERMINE' | 'ERREUR' | 'DESACTIVE';

export interface ILeadSalon extends Document {
  nom: string;
  edition?: string;
  dateDebut?: Date;
  dateFin?: Date;
  lieu?: string;
  ville?: string;
  pays: string;
  urlSalon?: string;
  urlListeExposants?: string;
  categorie?: string;
  statutScraping: ScrapingStatus;
  derniereExecution?: Date;
  nbExposantsCollectes: number;
  adaptateurConfig?: Record<string, unknown>;
  sourceDecouverte?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSalonSchema = new Schema({
  nom: { type: String, required: true },
  edition: String,
  dateDebut: Date,
  dateFin: Date,
  lieu: String,
  ville: String,
  pays: { type: String, required: true, maxlength: 50 },
  urlSalon: String,
  urlListeExposants: String,
  categorie: String,
  statutScraping: {
    type: String,
    enum: ['A_SCRAPER', 'EN_COURS', 'TERMINE', 'ERREUR', 'DESACTIVE'],
    default: 'A_SCRAPER'
  },
  derniereExecution: Date,
  nbExposantsCollectes: { type: Number, default: 0 },
  adaptateurConfig: { type: Schema.Types.Mixed, default: {} },
  sourceDecouverte: String
}, {
  timestamps: true
});

LeadSalonSchema.index({ dateDebut: 1, dateFin: 1 });
LeadSalonSchema.index({ statutScraping: 1 });
LeadSalonSchema.index({ pays: 1 });
LeadSalonSchema.index({ nom: 'text' });

export default mongoose.model<ILeadSalon>('LeadSalon', LeadSalonSchema);

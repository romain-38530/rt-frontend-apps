import mongoose, { Schema, Document } from 'mongoose';

export interface ICrmCommercial extends Document {
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  type: 'internal' | 'external';  // Interne ou externe
  status: 'active' | 'inactive' | 'on_leave';
  region?: string;
  specialisation?: string[];  // Ex: Transport, Logistique, Agroalimentaire
  objectifMensuel?: number;  // Nombre de leads a traiter par mois
  linkedinUrl?: string;
  avatar?: string;
  notes?: string;
  dateEmbauche?: Date;
  // Configuration des commissions
  commissionConfig: {
    tauxConversion: number;      // Montant par lead converti (EUR)
    tauxSignature: number;       // Montant par contrat signe (EUR)
    tauxRecurrent: number;       // % sur revenu recurrent mensuel
    bonusObjectif: number;       // Bonus si objectif atteint (EUR)
  };
  stats: {
    leadsAssignes: number;
    leadsConverts: number;
    leadsEnCours: number;
    tauxConversion: number;
    commissionsTotal: number;
    commissionsPending: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CrmCommercialSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  telephone: String,
  type: {
    type: String,
    enum: ['internal', 'external'],
    default: 'internal'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  },
  region: String,
  specialisation: [String],
  objectifMensuel: { type: Number, default: 50 },
  linkedinUrl: String,
  avatar: String,
  notes: String,
  dateEmbauche: Date,
  commissionConfig: {
    tauxConversion: { type: Number, default: 50 },      // 50 EUR par lead converti
    tauxSignature: { type: Number, default: 200 },      // 200 EUR par contrat signe
    tauxRecurrent: { type: Number, default: 5 },        // 5% sur revenu recurrent
    bonusObjectif: { type: Number, default: 500 }       // 500 EUR si objectif atteint
  },
  stats: {
    leadsAssignes: { type: Number, default: 0 },
    leadsConverts: { type: Number, default: 0 },
    leadsEnCours: { type: Number, default: 0 },
    tauxConversion: { type: Number, default: 0 },
    commissionsTotal: { type: Number, default: 0 },
    commissionsPending: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

CrmCommercialSchema.index({ email: 1 });
CrmCommercialSchema.index({ status: 1 });
CrmCommercialSchema.index({ type: 1 });

export default mongoose.model<ICrmCommercial>('CrmCommercial', CrmCommercialSchema);

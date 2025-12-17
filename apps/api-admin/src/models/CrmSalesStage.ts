import mongoose, { Schema, Document } from 'mongoose';

// Etapes predefinies du pipeline de vente
export const SALES_STAGES = [
  { order: 1, code: 'QUALIFICATION', label: 'Qualification', description: 'Verification de l\'interet et du besoin' },
  { order: 2, code: 'PREMIER_CONTACT', label: 'Premier Contact', description: 'Prise de contact initiale avec le prospect' },
  { order: 3, code: 'DECOUVERTE', label: 'Decouverte', description: 'Analyse des besoins et attentes' },
  { order: 4, code: 'PROPOSITION', label: 'Proposition', description: 'Presentation de l\'offre commerciale' },
  { order: 5, code: 'NEGOCIATION', label: 'Negociation', description: 'Discussion des termes et conditions' },
  { order: 6, code: 'CLOSING', label: 'Closing', description: 'Finalisation et signature du contrat' }
];

export interface ICrmSalesStage extends Document {
  leadCompanyId: mongoose.Types.ObjectId;
  commercialId: mongoose.Types.ObjectId;
  stageCode: string;
  stageOrder: number;
  stageLabel: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dateDebut?: Date;
  dateFin?: Date;
  notes?: string;
  actionsTaken?: string[];
  nextAction?: string;
  nextActionDate?: Date;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CrmSalesStageSchema = new Schema({
  leadCompanyId: { type: Schema.Types.ObjectId, ref: 'LeadCompany', required: true },
  commercialId: { type: Schema.Types.ObjectId, ref: 'CrmCommercial', required: true },
  stageCode: { type: String, required: true },
  stageOrder: { type: Number, required: true },
  stageLabel: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending'
  },
  dateDebut: Date,
  dateFin: Date,
  notes: String,
  actionsTaken: [String],
  nextAction: String,
  nextActionDate: Date,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

CrmSalesStageSchema.index({ leadCompanyId: 1, stageCode: 1 }, { unique: true });
CrmSalesStageSchema.index({ commercialId: 1 });
CrmSalesStageSchema.index({ status: 1 });
CrmSalesStageSchema.index({ stageOrder: 1 });

export default mongoose.model<ICrmSalesStage>('CrmSalesStage', CrmSalesStageSchema);

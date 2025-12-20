/**
 * Contract - Contrats clients
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IContract extends Document {
  contractNumber: string;

  // Client
  companyId: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;

  // Commercial
  commercialId: mongoose.Types.ObjectId;
  commercialName: string;

  // Type de contrat
  type: 'pack' | 'custom' | 'individual_modules';
  packCode?: string;
  packName?: string;

  // Modules souscrits
  modules: {
    moduleCode: string;
    moduleName: string;
    monthlyPrice: number;
    users?: number;
  }[];

  // Tarification
  pricing: {
    monthlyTotal: number;
    setupFeeTotal: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    paymentMethod: 'card' | 'sepa' | 'transfer' | 'check';
  };

  // Promotions appliquees
  promotions: {
    promoCode: string;
    promoName: string;
    discountAmount: number;
    type: string;
  }[];

  // Duree
  startDate: Date;
  endDate?: Date;
  commitmentMonths: number; // Engagement en mois
  autoRenewal: boolean;
  renewalNoticeDate?: Date; // Date de notification avant renouvellement

  // Statut
  status: 'draft' | 'pending_signature' | 'active' | 'suspended' | 'terminated' | 'expired';
  signedAt?: Date;
  signedBy?: string;
  terminatedAt?: Date;
  terminationReason?: string;

  // Installation
  installation: {
    status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduledDate?: Date;
    completedDate?: Date;
    estimatedHours: number;
    actualHours?: number;
    installerId?: mongoose.Types.ObjectId;
    installerName?: string;
    notes?: string;
  };

  // Documents
  documents: {
    type: 'contract' | 'amendment' | 'invoice' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
  }[];

  // Notes internes
  internalNotes: string;

  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>({
  contractNumber: { type: String, required: true, unique: true },

  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: String,

  commercialId: { type: Schema.Types.ObjectId, ref: 'CrmCommercial' },
  commercialName: { type: String },

  type: { type: String, enum: ['pack', 'custom', 'individual_modules'], default: 'custom' },
  packCode: String,
  packName: String,

  modules: [{
    moduleCode: { type: String, required: true },
    moduleName: { type: String, required: true },
    monthlyPrice: { type: Number, required: true },
    users: Number
  }],

  pricing: {
    monthlyTotal: { type: Number, required: true },
    setupFeeTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'monthly' },
    paymentMethod: { type: String, enum: ['card', 'sepa', 'transfer', 'check'], default: 'sepa' }
  },

  promotions: [{
    promoCode: String,
    promoName: String,
    discountAmount: Number,
    type: String
  }],

  startDate: { type: Date, required: true },
  endDate: Date,
  commitmentMonths: { type: Number, default: 12 },
  autoRenewal: { type: Boolean, default: true },
  renewalNoticeDate: Date,

  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'suspended', 'terminated', 'expired'],
    default: 'draft'
  },
  signedAt: Date,
  signedBy: String,
  terminatedAt: Date,
  terminationReason: String,

  installation: {
    status: { type: String, enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    scheduledDate: Date,
    completedDate: Date,
    estimatedHours: { type: Number, default: 4 },
    actualHours: Number,
    installerId: { type: Schema.Types.ObjectId, ref: 'User' },
    installerName: String,
    notes: String
  },

  documents: [{
    type: { type: String, enum: ['contract', 'amendment', 'invoice', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  internalNotes: String
}, {
  timestamps: true
});

// Index pour recherche
ContractSchema.index({ companyId: 1 });
ContractSchema.index({ commercialId: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ 'installation.status': 1, 'installation.scheduledDate': 1 });

// Generer numero de contrat
ContractSchema.pre('save', async function(next) {
  if (!this.contractNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Contract').countDocuments();
    this.contractNumber = `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model<IContract>('Contract', ContractSchema);

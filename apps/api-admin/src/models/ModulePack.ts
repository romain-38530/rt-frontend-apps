/**
 * ModulePack - Packs de modules avec remises
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IModulePack extends Document {
  packCode: string;
  packName: string;
  description: string;
  targetAudience: string; // Ex: "PME Transport", "Grande entreprise logistique"

  // Modules inclus
  modules: {
    moduleCode: string;
    moduleName: string;
    includedUsers?: number; // Utilisateurs inclus pour ce module
  }[];

  // Tarification du pack
  pricing: {
    monthlyPrice: number; // Prix mensuel total
    setupFee: number; // Frais d'installation pack
    annualDiscount: number; // % de remise si paiement annuel
    currency: string;
    originalPrice: number; // Prix total sans remise (pour afficher l'economie)
    savingsPercent: number; // % d'economie
  };

  // Installation
  installation: {
    totalEstimatedHours: number;
    phaseCount: number; // Nombre de phases d'installation
    phases: {
      name: string;
      duration: number; // heures
      description: string;
    }[];
  };

  // Validite
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  maxSubscriptions?: number; // Limite de souscriptions
  currentSubscriptions: number;

  // Affichage
  displayOrder: number;
  badge?: string; // Ex: "Plus populaire", "Meilleur rapport qualite-prix"
  color?: string; // Couleur theme du pack

  createdAt: Date;
  updatedAt: Date;
}

const ModulePackSchema = new Schema<IModulePack>({
  packCode: { type: String, required: true, unique: true },
  packName: { type: String, required: true },
  description: { type: String },
  targetAudience: { type: String },

  modules: [{
    moduleCode: { type: String, required: true },
    moduleName: { type: String, required: true },
    includedUsers: Number
  }],

  pricing: {
    monthlyPrice: { type: Number, required: true },
    setupFee: { type: Number, default: 0 },
    annualDiscount: { type: Number, default: 10 },
    currency: { type: String, default: 'EUR' },
    originalPrice: { type: Number },
    savingsPercent: { type: Number }
  },

  installation: {
    totalEstimatedHours: { type: Number, default: 8 },
    phaseCount: { type: Number, default: 1 },
    phases: [{
      name: String,
      duration: Number,
      description: String
    }]
  },

  isActive: { type: Boolean, default: true },
  validFrom: Date,
  validUntil: Date,
  maxSubscriptions: Number,
  currentSubscriptions: { type: Number, default: 0 },

  displayOrder: { type: Number, default: 0 },
  badge: String,
  color: String
}, {
  timestamps: true
});

export default mongoose.model<IModulePack>('ModulePack', ModulePackSchema);

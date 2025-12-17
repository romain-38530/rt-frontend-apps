import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  // Authentification portail commercial
  accessCode: string;           // Code unique pour connexion (ex: COM-ABC123)
  passwordHash?: string;        // Mot de passe hashé
  tempPassword?: string;        // Mot de passe temporaire envoyé par email
  mustChangePassword: boolean;  // Doit changer son mot de passe
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
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
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAccessCode(): string;
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
  // Authentification portail commercial
  accessCode: { type: String, unique: true, sparse: true },
  passwordHash: String,
  tempPassword: String,
  mustChangePassword: { type: Boolean, default: true },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
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

// Generer un code d'acces unique
CrmCommercialSchema.methods.generateAccessCode = function(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'COM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Comparer le mot de passe
CrmCommercialSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

// Hash le mot de passe avant sauvegarde
CrmCommercialSchema.pre('save', async function(next) {
  if (this.isModified('tempPassword') && this.tempPassword) {
    this.passwordHash = await bcrypt.hash(this.tempPassword, 10);
  }
  // Generer accessCode si pas present
  if (!this.accessCode) {
    let code: string;
    let exists = true;
    while (exists) {
      code = 'COM-';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = await mongoose.model('CrmCommercial').exists({ accessCode: code }) as any;
    }
    this.accessCode = code!;
  }
  next();
});

CrmCommercialSchema.index({ email: 1 });
CrmCommercialSchema.index({ accessCode: 1 });
CrmCommercialSchema.index({ status: 1 });
CrmCommercialSchema.index({ type: 1 });

export default mongoose.model<ICrmCommercial>('CrmCommercial', CrmCommercialSchema);

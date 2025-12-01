/**
 * Model: VigilanceCheck
 * Vérification conformité transporteur - Devoir de vigilance
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IVigilanceCheck extends Document {
  carrierId: string;
  carrierName: string;

  overallStatus: 'compliant' | 'warning' | 'non_compliant' | 'blacklisted' | 'pending';
  complianceScore: number;

  checks: {
    kbis: {
      status: string;
      documentId?: string;
      issuedAt?: Date;
      expiresAt?: Date;
      daysUntilExpiry?: number;
      verified: boolean;
      verifiedAt?: Date;
    };
    urssaf: {
      status: string;
      documentId?: string;
      issuedAt?: Date;
      expiresAt?: Date;
      daysUntilExpiry?: number;
      verified: boolean;
      verifiedAt?: Date;
    };
    insurance: {
      status: string;
      documentId?: string;
      provider?: string;
      policyNumber?: string;
      coverage: number;
      minRequired: number;
      expiresAt?: Date;
      daysUntilExpiry?: number;
      verified: boolean;
    };
    license: {
      status: string;
      documentId?: string;
      licenseNumber?: string;
      issuedAt?: Date;
      expiresAt?: Date;
      daysUntilExpiry?: number;
      verified: boolean;
    };
    identity: {
      status: string;
      documentId?: string;
      verified: boolean;
      verifiedAt?: Date;
    };
    rib: {
      status: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      holderName?: string;
      matchesCompany: boolean;
      verified: boolean;
    };
    incidents: {
      totalIncidents: number;
      unresolvedIncidents: number;
      severeIncidents: number;
      lastIncidentAt?: Date;
      status: string;
    };
  };

  rejectionReasons: string[];

  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    documentType?: string;
    createdAt: Date;
    acknowledgedAt?: Date;
  }>;

  lastCheckedAt: Date;
  nextCheckDue: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VigilanceCheckSchema = new Schema<IVigilanceCheck>({
  carrierId: { type: String, required: true, unique: true, index: true },
  carrierName: { type: String, required: true },

  overallStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non_compliant', 'blacklisted', 'pending'],
    default: 'pending'
  },
  complianceScore: { type: Number, default: 0 },

  checks: {
    kbis: {
      status: { type: String, enum: ['valid', 'expired', 'expiring_soon', 'missing', 'invalid'], default: 'missing' },
      documentId: String,
      issuedAt: Date,
      expiresAt: Date,
      daysUntilExpiry: Number,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    urssaf: {
      status: { type: String, enum: ['valid', 'expired', 'expiring_soon', 'missing', 'invalid'], default: 'missing' },
      documentId: String,
      issuedAt: Date,
      expiresAt: Date,
      daysUntilExpiry: Number,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    insurance: {
      status: { type: String, enum: ['valid', 'expired', 'expiring_soon', 'missing', 'insufficient'], default: 'missing' },
      documentId: String,
      provider: String,
      policyNumber: String,
      coverage: { type: Number, default: 0 },
      minRequired: { type: Number, default: 100000 },
      expiresAt: Date,
      daysUntilExpiry: Number,
      verified: { type: Boolean, default: false }
    },
    license: {
      status: { type: String, enum: ['valid', 'expired', 'expiring_soon', 'missing', 'suspended'], default: 'missing' },
      documentId: String,
      licenseNumber: String,
      issuedAt: Date,
      expiresAt: Date,
      daysUntilExpiry: Number,
      verified: { type: Boolean, default: false }
    },
    identity: {
      status: { type: String, enum: ['valid', 'missing', 'invalid'], default: 'missing' },
      documentId: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    rib: {
      status: { type: String, enum: ['valid', 'invalid', 'missing', 'mismatch'], default: 'missing' },
      iban: String,
      bic: String,
      bankName: String,
      holderName: String,
      matchesCompany: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    },
    incidents: {
      totalIncidents: { type: Number, default: 0 },
      unresolvedIncidents: { type: Number, default: 0 },
      severeIncidents: { type: Number, default: 0 },
      lastIncidentAt: Date,
      status: { type: String, enum: ['clean', 'warning', 'blocked'], default: 'clean' }
    }
  },

  rejectionReasons: [String],

  alerts: [{
    id: String,
    type: { type: String, enum: ['expiry_j30', 'expiry_j15', 'expiry_j7', 'expired', 'document_invalid', 'incident'] },
    message: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    documentType: String,
    createdAt: { type: Date, default: Date.now },
    acknowledgedAt: Date
  }],

  lastCheckedAt: { type: Date, default: Date.now },
  nextCheckDue: Date
}, {
  timestamps: true
});

// Calculer le score de conformité
VigilanceCheckSchema.methods.calculateComplianceScore = function() {
  let score = 0;
  let maxScore = 0;

  const weights = {
    kbis: 20,
    urssaf: 15,
    insurance: 25,
    license: 20,
    identity: 10,
    rib: 5,
    incidents: 5
  };

  // KBIS
  maxScore += weights.kbis;
  if (this.checks.kbis.status === 'valid') score += weights.kbis;
  else if (this.checks.kbis.status === 'expiring_soon') score += weights.kbis * 0.7;

  // URSSAF
  maxScore += weights.urssaf;
  if (this.checks.urssaf.status === 'valid') score += weights.urssaf;
  else if (this.checks.urssaf.status === 'expiring_soon') score += weights.urssaf * 0.7;

  // Insurance
  maxScore += weights.insurance;
  if (this.checks.insurance.status === 'valid') score += weights.insurance;
  else if (this.checks.insurance.status === 'expiring_soon') score += weights.insurance * 0.7;
  else if (this.checks.insurance.status === 'insufficient') score += weights.insurance * 0.5;

  // License
  maxScore += weights.license;
  if (this.checks.license.status === 'valid') score += weights.license;
  else if (this.checks.license.status === 'expiring_soon') score += weights.license * 0.7;

  // Identity
  maxScore += weights.identity;
  if (this.checks.identity.status === 'valid') score += weights.identity;

  // RIB
  maxScore += weights.rib;
  if (this.checks.rib.status === 'valid' && this.checks.rib.matchesCompany) score += weights.rib;
  else if (this.checks.rib.status === 'valid') score += weights.rib * 0.7;

  // Incidents
  maxScore += weights.incidents;
  if (this.checks.incidents.status === 'clean') score += weights.incidents;
  else if (this.checks.incidents.status === 'warning') score += weights.incidents * 0.5;

  this.complianceScore = Math.round((score / maxScore) * 100);
  return this.complianceScore;
};

// Mettre à jour le statut global
VigilanceCheckSchema.methods.updateOverallStatus = function() {
  this.calculateComplianceScore();
  this.rejectionReasons = [];

  // Check for blocking conditions
  if (this.checks.kbis.status === 'missing') this.rejectionReasons.push('kbis_missing');
  if (this.checks.kbis.status === 'expired') this.rejectionReasons.push('kbis_expired');
  if (this.checks.insurance.status === 'missing') this.rejectionReasons.push('insurance_missing');
  if (this.checks.insurance.status === 'expired') this.rejectionReasons.push('insurance_expired');
  if (this.checks.insurance.status === 'insufficient') this.rejectionReasons.push('insurance_insufficient');
  if (this.checks.license.status === 'missing') this.rejectionReasons.push('license_missing');
  if (this.checks.license.status === 'expired') this.rejectionReasons.push('license_expired');
  if (this.checks.license.status === 'suspended') this.rejectionReasons.push('license_suspended');
  if (this.checks.incidents.status === 'blocked') this.rejectionReasons.push('incidents_unresolved');

  // Determine overall status
  if (this.checks.incidents.status === 'blocked') {
    this.overallStatus = 'blacklisted';
  } else if (this.rejectionReasons.length > 0) {
    this.overallStatus = 'non_compliant';
  } else if (this.complianceScore >= 80) {
    this.overallStatus = 'compliant';
  } else {
    this.overallStatus = 'warning';
  }

  return this.overallStatus;
};

export default mongoose.model<IVigilanceCheck>('VigilanceCheck', VigilanceCheckSchema);

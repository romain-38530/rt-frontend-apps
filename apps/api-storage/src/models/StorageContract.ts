/**
 * Model: StorageContract
 * Contrat de stockage entre un donneur d'ordre et un logisticien
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IStorageContract extends Document {
  reference: string;

  // Liens
  needId: string;
  needReference: string;
  offerId: string;

  // Parties
  clientOrgId: string;
  clientName: string;
  clientContact: {
    name: string;
    email: string;
    phone?: string;
  };

  logisticianId: string;
  logisticianName: string;
  logisticianContact: {
    name: string;
    email: string;
    phone?: string;
  };

  // Site
  siteId: string;
  siteName: string;
  siteAddress: string;

  // Détails du stockage
  storageType: string;
  capacity: {
    unit: string;
    quantity: number;
  };

  // Période
  startDate: Date;
  endDate?: Date;
  duration: {
    value: number;
    unit: string;
  };
  renewable: boolean;
  renewalTerms?: string;

  // Tarification contractuelle
  pricing: {
    pricePerUnit: number;
    unit: string;
    currency: string;
    setupFees?: number;
    handlingFees?: number;
    minimumBilling?: number;
    totalEstimated?: number;
  };

  // Services contractuels
  services: {
    name: string;
    included: boolean;
    price?: number;
    description?: string;
  }[];

  // Conditions générales
  terms: {
    paymentTerms: string;
    cancellationPolicy: string;
    liabilityLimit?: number;
    insuranceRequired: boolean;
    insuranceMinimum?: number;
    penalties?: {
      type: string;
      amount: number;
      conditions: string;
    }[];
  };

  // Documents contractuels
  documents: {
    type: 'contract' | 'amendment' | 'insurance' | 'certificate' | 'other';
    name: string;
    url: string;
    signedAt?: Date;
    signedBy?: string;
    uploadedAt: Date;
  }[];

  // Signatures
  signatures: {
    party: 'client' | 'logistician';
    signedBy: string;
    signedAt: Date;
    ipAddress?: string;
    method: 'electronic' | 'manual';
  }[];

  // Statut
  status: 'draft' | 'pending_signature' | 'active' | 'suspended' | 'terminated' | 'completed' | 'disputed';

  // Suivi d'exécution
  execution?: {
    currentOccupancy: {
      unit: string;
      quantity: number;
      lastUpdate: Date;
    };
    totalMovements: number;
    lastMovementDate?: Date;
    incidents: {
      date: Date;
      type: string;
      description: string;
      resolved: boolean;
      resolvedAt?: Date;
    }[];
  };

  // Facturation
  billing?: {
    billingCycle: 'monthly' | 'quarterly' | 'annually';
    nextBillingDate: Date;
    totalBilled: number;
    totalPaid: number;
    invoices: {
      reference: string;
      amount: number;
      issuedAt: Date;
      dueDate: Date;
      paidAt?: Date;
      status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    }[];
  };

  // WMS Integration
  wmsIntegration?: {
    enabled: boolean;
    wmsSystem: string;
    apiEndpoint?: string;
    lastSync?: Date;
    syncStatus: 'active' | 'paused' | 'error';
  };

  // Historique
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: string;
    reason?: string;
  }[];

  // Avenants
  amendments?: {
    reference: string;
    description: string;
    changes: Record<string, any>;
    effectiveDate: Date;
    signedAt?: Date;
    status: 'draft' | 'pending' | 'signed' | 'rejected';
  }[];

  // Notes internes
  notes?: {
    content: string;
    createdBy: string;
    createdAt: Date;
    visibility: 'internal' | 'shared';
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const StorageContractSchema = new Schema<IStorageContract>({
  reference: { type: String, required: true, unique: true },

  needId: { type: String, required: true, index: true },
  needReference: { type: String, required: true },
  offerId: { type: String, required: true, index: true },

  clientOrgId: { type: String, required: true, index: true },
  clientName: { type: String, required: true },
  clientContact: {
    name: String,
    email: String,
    phone: String
  },

  logisticianId: { type: String, required: true, index: true },
  logisticianName: { type: String, required: true },
  logisticianContact: {
    name: String,
    email: String,
    phone: String
  },

  siteId: { type: String, required: true },
  siteName: { type: String, required: true },
  siteAddress: { type: String, required: true },

  storageType: {
    type: String,
    enum: ['long_term', 'temporary', 'picking', 'cross_dock', 'customs', 'temperature'],
    required: true
  },
  capacity: {
    unit: { type: String, enum: ['sqm', 'pallets', 'linear_meters', 'cbm'], required: true },
    quantity: { type: Number, required: true }
  },

  startDate: { type: Date, required: true },
  endDate: Date,
  duration: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], required: true }
  },
  renewable: { type: Boolean, default: false },
  renewalTerms: String,

  pricing: {
    pricePerUnit: { type: Number, required: true },
    unit: { type: String, required: true },
    currency: { type: String, default: 'EUR' },
    setupFees: Number,
    handlingFees: Number,
    minimumBilling: Number,
    totalEstimated: Number
  },

  services: [{
    name: String,
    included: Boolean,
    price: Number,
    description: String
  }],

  terms: {
    paymentTerms: { type: String, required: true },
    cancellationPolicy: { type: String, required: true },
    liabilityLimit: Number,
    insuranceRequired: { type: Boolean, default: true },
    insuranceMinimum: Number,
    penalties: [{
      type: String,
      amount: Number,
      conditions: String
    }]
  },

  documents: [{
    type: { type: String, enum: ['contract', 'amendment', 'insurance', 'certificate', 'other'] },
    name: String,
    url: String,
    signedAt: Date,
    signedBy: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  signatures: [{
    party: { type: String, enum: ['client', 'logistician'] },
    signedBy: String,
    signedAt: Date,
    ipAddress: String,
    method: { type: String, enum: ['electronic', 'manual'] }
  }],

  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'suspended', 'terminated', 'completed', 'disputed'],
    default: 'draft',
    index: true
  },

  execution: {
    currentOccupancy: {
      unit: String,
      quantity: Number,
      lastUpdate: Date
    },
    totalMovements: { type: Number, default: 0 },
    lastMovementDate: Date,
    incidents: [{
      date: Date,
      type: String,
      description: String,
      resolved: { type: Boolean, default: false },
      resolvedAt: Date
    }]
  },

  billing: {
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'annually'] },
    nextBillingDate: Date,
    totalBilled: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    invoices: [{
      reference: String,
      amount: Number,
      issuedAt: Date,
      dueDate: Date,
      paidAt: Date,
      status: { type: String, enum: ['pending', 'paid', 'overdue', 'cancelled'] }
    }]
  },

  wmsIntegration: {
    enabled: { type: Boolean, default: false },
    wmsSystem: String,
    apiEndpoint: String,
    lastSync: Date,
    syncStatus: { type: String, enum: ['active', 'paused', 'error'] }
  },

  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    reason: String
  }],

  amendments: [{
    reference: String,
    description: String,
    changes: Schema.Types.Mixed,
    effectiveDate: Date,
    signedAt: Date,
    status: { type: String, enum: ['draft', 'pending', 'signed', 'rejected'] }
  }],

  notes: [{
    content: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    visibility: { type: String, enum: ['internal', 'shared'], default: 'internal' }
  }]
}, {
  timestamps: true
});

// Auto-génération de la référence
StorageContractSchema.pre('save', async function(next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('StorageContract').countDocuments();
    this.reference = `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index composites
StorageContractSchema.index({ clientOrgId: 1, status: 1 });
StorageContractSchema.index({ logisticianId: 1, status: 1 });
StorageContractSchema.index({ startDate: 1, endDate: 1 });
StorageContractSchema.index({ 'billing.nextBillingDate': 1 });

export default mongoose.model<IStorageContract>('StorageContract', StorageContractSchema);

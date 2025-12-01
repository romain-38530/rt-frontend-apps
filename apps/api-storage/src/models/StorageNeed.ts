/**
 * Model: StorageNeed
 * Besoin de stockage publié par un industriel
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IStorageNeed extends Document {
  reference: string;

  // Industriel
  ownerOrgId: string;
  ownerOrgName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Caractéristiques
  storageType: string;
  volume: {
    unit: string;
    quantity: number;
    palletType?: string;
  };
  duration: {
    startDate: Date;
    endDate?: Date;
    durationMonths?: number;
    flexible: boolean;
    renewable: boolean;
    minCommitment?: number;
  };
  location: {
    country: string;
    region?: string;
    department?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    maxRadius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  constraints: {
    temperature: string;
    temperatureRange?: {
      min: number;
      max: number;
    };
    adrAuthorized: boolean;
    adrClasses?: string[];
    securityLevel: string;
    certifications: string[];
    specificRequirements?: string[];
  };
  infrastructure?: {
    minCeilingHeight?: number;
    minDocks?: number;
    handlingEquipment?: string[];
    wmsRequired: boolean;
    apiIntegration: boolean;
  };
  operational?: {
    operatingHours?: {
      start: string;
      end: string;
      days: string[];
    };
    dailyMovements?: number;
    pickingRequired: boolean;
    copackingRequired: boolean;
    labelingRequired: boolean;
  };

  // Budget
  budget?: {
    indicative?: number;
    maxBudget?: number;
    currency: string;
    period: string;
    negotiable: boolean;
  };

  // Publication
  publicationType: string;
  referredLogisticians?: string[];

  // Documents
  technicalSpecsUrl?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  // RFP IA
  rfpGenerated: boolean;
  rfpContent?: string;
  rfpStandardized: boolean;

  // Status
  status: string;
  deadline: Date;
  publishedAt?: Date;
  closedAt?: Date;
  attributedAt?: Date;
  attributedOfferId?: string;

  // Stats
  viewCount: number;
  offersCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const StorageNeedSchema = new Schema<IStorageNeed>({
  reference: { type: String, required: true, unique: true },

  ownerOrgId: { type: String, required: true, index: true },
  ownerOrgName: { type: String, required: true },
  contactName: String,
  contactEmail: String,
  contactPhone: String,

  storageType: {
    type: String,
    enum: ['long_term', 'temporary', 'picking', 'cross_dock', 'customs', 'temperature'],
    required: true
  },

  volume: {
    unit: { type: String, enum: ['sqm', 'pallets', 'linear_meters', 'cbm'], required: true },
    quantity: { type: Number, required: true },
    palletType: String
  },

  duration: {
    startDate: { type: Date, required: true },
    endDate: Date,
    durationMonths: Number,
    flexible: { type: Boolean, default: false },
    renewable: { type: Boolean, default: false },
    minCommitment: Number
  },

  location: {
    country: { type: String, required: true },
    region: String,
    department: String,
    city: String,
    postalCode: String,
    address: String,
    maxRadius: Number,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  constraints: {
    temperature: {
      type: String,
      enum: ['ambient', 'refrigerated', 'frozen', 'controlled'],
      default: 'ambient'
    },
    temperatureRange: {
      min: Number,
      max: Number
    },
    adrAuthorized: { type: Boolean, default: false },
    adrClasses: [String],
    securityLevel: {
      type: String,
      enum: ['standard', 'high', 'maximum'],
      default: 'standard'
    },
    certifications: [String],
    specificRequirements: [String]
  },

  infrastructure: {
    minCeilingHeight: Number,
    minDocks: Number,
    handlingEquipment: [String],
    wmsRequired: { type: Boolean, default: false },
    apiIntegration: { type: Boolean, default: false }
  },

  operational: {
    operatingHours: {
      start: String,
      end: String,
      days: [String]
    },
    dailyMovements: Number,
    pickingRequired: { type: Boolean, default: false },
    copackingRequired: { type: Boolean, default: false },
    labelingRequired: { type: Boolean, default: false }
  },

  budget: {
    indicative: Number,
    maxBudget: Number,
    currency: { type: String, default: 'EUR' },
    period: { type: String, enum: ['monthly', 'yearly', 'total'], default: 'monthly' },
    negotiable: { type: Boolean, default: true }
  },

  publicationType: {
    type: String,
    enum: ['GLOBAL', 'REFERRED_ONLY', 'MIXED'],
    default: 'GLOBAL'
  },
  referredLogisticians: [String],

  technicalSpecsUrl: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],

  rfpGenerated: { type: Boolean, default: false },
  rfpContent: String,
  rfpStandardized: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ATTRIBUTED', 'CANCELLED'],
    default: 'DRAFT',
    index: true
  },
  deadline: { type: Date, required: true },
  publishedAt: Date,
  closedAt: Date,
  attributedAt: Date,
  attributedOfferId: String,

  viewCount: { type: Number, default: 0 },
  offersCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Générer une référence unique
StorageNeedSchema.pre('save', async function(next) {
  if (!this.reference) {
    const count = await mongoose.model('StorageNeed').countDocuments();
    this.reference = `STK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index pour recherche géographique
StorageNeedSchema.index({ 'location.region': 1, 'location.country': 1 });
StorageNeedSchema.index({ status: 1, publicationType: 1 });
StorageNeedSchema.index({ deadline: 1 });

export default mongoose.model<IStorageNeed>('StorageNeed', StorageNeedSchema);

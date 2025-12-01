import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipientSite {
  siteId: string;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contacts: string[];
  openingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  constraints?: {
    maxVehicleHeight?: number;
    maxVehicleWeight?: number;
    hasDock: boolean;
    hasForklift: boolean;
    requiresAppointment: boolean;
    specialInstructions?: string;
  };
  isActive: boolean;
}

export interface IRecipientContact {
  contactId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  siteId?: string;
  isPrimary: boolean;
  canSignDeliveries: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface IRecipient extends Document {
  recipientId: string;
  industrialId: string;
  companyName: string;
  siret: string;
  legalForm?: string;
  taxId?: string;
  sites: IRecipientSite[];
  contacts: IRecipientContact[];
  status: 'invited' | 'pending' | 'active' | 'incomplete' | 'suspended';
  invitationToken?: string;
  invitedAt: Date;
  activatedAt?: Date;
  lastLoginAt?: Date;
  settings: {
    notifications: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
      etaAlerts: boolean;
      incidentAlerts: boolean;
      deliveryConfirmations: boolean;
    };
    language: string;
    timezone: string;
    autoAcceptDeliveries: boolean;
  };
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    features: string[];
    validUntil?: Date;
    maxSites: number;
    maxUsers: number;
  };
  billingInfo?: {
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    vatNumber?: string;
    paymentMethod?: string;
  };
  metadata: {
    totalDeliveries: number;
    totalIncidents: number;
    averageRating?: number;
    industry?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSiteSchema = new Schema<IRecipientSite>({
  siteId: { type: String, required: true },
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'France' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contacts: [{ type: String }],
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  constraints: {
    maxVehicleHeight: Number,
    maxVehicleWeight: Number,
    hasDock: { type: Boolean, default: false },
    hasForklift: { type: Boolean, default: false },
    requiresAppointment: { type: Boolean, default: false },
    specialInstructions: String
  },
  isActive: { type: Boolean, default: true }
});

const RecipientContactSchema = new Schema<IRecipientContact>({
  contactId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  siteId: String,
  isPrimary: { type: Boolean, default: false },
  canSignDeliveries: { type: Boolean, default: true },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
});

const RecipientSchema = new Schema<IRecipient>(
  {
    recipientId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    industrialId: {
      type: String,
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true
    },
    siret: {
      type: String,
      required: true,
      unique: true
    },
    legalForm: String,
    taxId: String,
    sites: [RecipientSiteSchema],
    contacts: [RecipientContactSchema],
    status: {
      type: String,
      enum: ['invited', 'pending', 'active', 'incomplete', 'suspended'],
      default: 'invited',
      index: true
    },
    invitationToken: {
      type: String,
      index: true,
      sparse: true
    },
    invitedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    activatedAt: Date,
    lastLoginAt: Date,
    settings: {
      notifications: {
        emailEnabled: { type: Boolean, default: true },
        smsEnabled: { type: Boolean, default: false },
        pushEnabled: { type: Boolean, default: true },
        etaAlerts: { type: Boolean, default: true },
        incidentAlerts: { type: Boolean, default: true },
        deliveryConfirmations: { type: Boolean, default: true }
      },
      language: { type: String, default: 'fr' },
      timezone: { type: String, default: 'Europe/Paris' },
      autoAcceptDeliveries: { type: Boolean, default: false }
    },
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
      },
      features: [String],
      validUntil: Date,
      maxSites: { type: Number, default: 1 },
      maxUsers: { type: Number, default: 3 }
    },
    billingInfo: {
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: String
      },
      vatNumber: String,
      paymentMethod: String
    },
    metadata: {
      totalDeliveries: { type: Number, default: 0 },
      totalIncidents: { type: Number, default: 0 },
      averageRating: Number,
      industry: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes pour les recherches fréquentes
RecipientSchema.index({ industrialId: 1, status: 1 });
RecipientSchema.index({ 'sites.siteId': 1 });
RecipientSchema.index({ 'contacts.email': 1 });

// Méthode pour générer un recipientId unique
RecipientSchema.statics.generateRecipientId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ recipientId: new RegExp(`^RCP-${year}-`) });
  return `RCP-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Méthode pour générer un siteId unique
RecipientSchema.methods.generateSiteId = function(): string {
  const existingSites = this.sites.length;
  return `SITE-${this.recipientId}-${String(existingSites + 1).padStart(2, '0')}`;
};

// Méthode pour générer un contactId unique
RecipientSchema.methods.generateContactId = function(): string {
  const existingContacts = this.contacts.length;
  return `CONTACT-${this.recipientId}-${String(existingContacts + 1).padStart(2, '0')}`;
};

export const Recipient = mongoose.model<IRecipient>('Recipient', RecipientSchema);

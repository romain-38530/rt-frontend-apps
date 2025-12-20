/**
 * TransportCompany - Entreprises de transport scrapees pour Affret IA
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ITransportCompany extends Document {
  // Identite
  companyName: string;
  legalName?: string;
  siret?: string;
  siren?: string;
  tvaNumber?: string;
  naf?: string; // Code NAF/APE

  // Contact
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  linkedin?: string;

  // Adresse
  address: {
    street?: string;
    postalCode?: string;
    city?: string;
    department?: string;
    departmentCode?: string;
    region?: string;
    country: string;
    lat?: number;
    lng?: number;
  };

  // Activite transport
  transportInfo: {
    licenseNumber?: string; // Numero licence transport
    licenseType?: 'light' | 'heavy' | 'both'; // Leger (<3.5T), Lourd (>3.5T)
    fleetSize?: number;
    employeeCount?: number;
    turnover?: number; // CA en euros
    foundedYear?: number;

    // Services
    services: string[]; // FTL, LTL, Express, International, etc.
    specializations: string[]; // Frigo, ADR, Exceptionnel, etc.
    vehicleTypes: string[]; // Camion, Semi, Fourgon, etc.

    // Zones
    operatingZones: string[]; // National, Europe, International
    coveredDepartments: string[]; // 75, 93, 94, etc.
    coveredCountries: string[];
  };

  // Contact principal
  mainContact?: {
    firstName?: string;
    lastName?: string;
    position?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
  };

  // Source et scraping
  source: {
    type: 'scraping' | 'import' | 'manual' | 'api';
    name: string; // societe.com, transport-magazine, csv import, etc.
    url?: string;
    scrapedAt: Date;
    lastUpdated?: Date;
  };

  // Enrichissement
  enrichment: {
    emailVerified?: boolean;
    emailVerifiedAt?: Date;
    phoneVerified?: boolean;
    dataQualityScore?: number; // 0-100
    enrichedAt?: Date;
    enrichmentSource?: string;
  };

  // Statut prospection
  prospectionStatus: 'new' | 'to_contact' | 'contacted' | 'interested' | 'not_interested' | 'client' | 'blacklist';

  // Integration
  addedToLeadPool: boolean;
  leadPoolId?: mongoose.Types.ObjectId;
  addedToLeadPoolAt?: Date;

  // Tags et notes
  tags: string[];
  notes?: string;
  score?: number; // Score de pertinence pour Affret IA

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransportCompanySchema = new Schema<ITransportCompany>({
  companyName: { type: String, required: true },
  legalName: String,
  siret: { type: String, index: true },
  siren: { type: String, index: true },
  tvaNumber: String,
  naf: String,

  email: { type: String, index: true },
  phone: String,
  fax: String,
  website: String,
  linkedin: String,

  address: {
    street: String,
    postalCode: String,
    city: String,
    department: String,
    departmentCode: { type: String, index: true },
    region: String,
    country: { type: String, default: 'France' },
    lat: Number,
    lng: Number
  },

  transportInfo: {
    licenseNumber: String,
    licenseType: { type: String, enum: ['light', 'heavy', 'both'] },
    fleetSize: Number,
    employeeCount: Number,
    turnover: Number,
    foundedYear: Number,
    services: [String],
    specializations: [String],
    vehicleTypes: [String],
    operatingZones: [String],
    coveredDepartments: [String],
    coveredCountries: [String]
  },

  mainContact: {
    firstName: String,
    lastName: String,
    position: String,
    email: String,
    phone: String,
    linkedinUrl: String
  },

  source: {
    type: { type: String, enum: ['scraping', 'import', 'manual', 'api'], required: true },
    name: { type: String, required: true },
    url: String,
    scrapedAt: { type: Date, default: Date.now },
    lastUpdated: Date
  },

  enrichment: {
    emailVerified: Boolean,
    emailVerifiedAt: Date,
    phoneVerified: Boolean,
    dataQualityScore: { type: Number, min: 0, max: 100 },
    enrichedAt: Date,
    enrichmentSource: String
  },

  prospectionStatus: {
    type: String,
    enum: ['new', 'to_contact', 'contacted', 'interested', 'not_interested', 'client', 'blacklist'],
    default: 'new'
  },

  addedToLeadPool: { type: Boolean, default: false },
  leadPoolId: { type: Schema.Types.ObjectId, ref: 'LeadCompany' },
  addedToLeadPoolAt: Date,

  tags: [String],
  notes: String,
  score: { type: Number, min: 0, max: 100 },

  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index pour recherche
TransportCompanySchema.index({ companyName: 'text', 'address.city': 'text' });
TransportCompanySchema.index({ 'address.departmentCode': 1, prospectionStatus: 1 });
TransportCompanySchema.index({ 'source.name': 1 });
TransportCompanySchema.index({ addedToLeadPool: 1 });
TransportCompanySchema.index({ score: -1 });

export default mongoose.model<ITransportCompany>('TransportCompany', TransportCompanySchema);

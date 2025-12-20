/**
 * TransportOffer - Annonces de transport scrapées en continu
 * Stocke les offres/demandes de transport avec routes et transporteurs
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ITransportOffer extends Document {
  // Référence externe
  externalId: string; // ID sur b2pweb ou autre source
  source: {
    name: 'b2pweb' | 'chronotruck' | 'timocom' | 'teleroute' | 'other';
    url?: string;
    scrapedAt: Date;
    lastSeenAt: Date;
  };

  // Type d'annonce
  offerType: 'offer' | 'demand'; // Offre de transport ou demande de fret

  // Transporteur
  company: {
    name: string;
    externalId?: string;
    transportCompanyId?: mongoose.Types.ObjectId; // Lien vers TransportCompany
  };

  // Contact
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  // Route / Trajet
  route: {
    origin: {
      city?: string;
      postalCode?: string;
      department?: string;
      country: string;
      lat?: number;
      lng?: number;
    };
    destination: {
      city?: string;
      postalCode?: string;
      department?: string;
      country: string;
      lat?: number;
      lng?: number;
    };
    distance?: number; // km
    duration?: number; // minutes estimées
  };

  // Dates
  loadingDate?: Date;
  deliveryDate?: Date;
  flexibility?: string; // "fixe", "+-1 jour", etc.

  // Marchandise
  cargo?: {
    type?: string; // Palette, Vrac, Conteneur, etc.
    weight?: number; // kg
    volume?: number; // m3
    length?: number; // m
    width?: number; // m
    height?: number; // m
    quantity?: number;
    description?: string;
    adr?: boolean; // Matières dangereuses
    temperature?: {
      min?: number;
      max?: number;
    };
  };

  // Véhicule requis/proposé
  vehicle?: {
    type?: string; // Tautliner, Frigo, Benne, etc.
    capacity?: number; // tonnes
    features?: string[]; // Hayon, Grue, etc.
  };

  // Prix
  price?: {
    amount?: number;
    currency: string;
    type?: 'fixed' | 'negotiable' | 'on_demand';
    perKm?: number;
  };

  // Statut
  status: 'active' | 'expired' | 'matched' | 'archived';
  expiresAt?: Date;

  // Matching Affret IA
  matchedWithShipment?: mongoose.Types.ObjectId;
  matchScore?: number;
  matchedAt?: Date;

  // Notes internes
  notes?: string;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const TransportOfferSchema = new Schema<ITransportOffer>({
  externalId: { type: String, required: true },
  source: {
    name: { type: String, enum: ['b2pweb', 'chronotruck', 'timocom', 'teleroute', 'other'], required: true },
    url: String,
    scrapedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }
  },

  offerType: { type: String, enum: ['offer', 'demand'], default: 'offer' },

  company: {
    name: { type: String, required: true },
    externalId: String,
    transportCompanyId: { type: Schema.Types.ObjectId, ref: 'TransportCompany' }
  },

  contact: {
    name: String,
    email: String,
    phone: String
  },

  route: {
    origin: {
      city: String,
      postalCode: String,
      department: String,
      country: { type: String, default: 'France' },
      lat: Number,
      lng: Number
    },
    destination: {
      city: String,
      postalCode: String,
      department: String,
      country: { type: String, default: 'France' },
      lat: Number,
      lng: Number
    },
    distance: Number,
    duration: Number
  },

  loadingDate: Date,
  deliveryDate: Date,
  flexibility: String,

  cargo: {
    type: String,
    weight: Number,
    volume: Number,
    length: Number,
    width: Number,
    height: Number,
    quantity: Number,
    description: String,
    adr: Boolean,
    temperature: {
      min: Number,
      max: Number
    }
  },

  vehicle: {
    type: String,
    capacity: Number,
    features: [String]
  },

  price: {
    amount: Number,
    currency: { type: String, default: 'EUR' },
    type: { type: String, enum: ['fixed', 'negotiable', 'on_demand'] },
    perKm: Number
  },

  status: { type: String, enum: ['active', 'expired', 'matched', 'archived'], default: 'active' },
  expiresAt: Date,

  matchedWithShipment: { type: Schema.Types.ObjectId, ref: 'Shipment' },
  matchScore: Number,
  matchedAt: Date,

  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Index uniques pour éviter doublons
TransportOfferSchema.index({ externalId: 1, 'source.name': 1 }, { unique: true });

// Index pour recherche
TransportOfferSchema.index({ 'company.name': 'text', 'route.origin.city': 'text', 'route.destination.city': 'text' });
TransportOfferSchema.index({ 'route.origin.department': 1 });
TransportOfferSchema.index({ 'route.destination.department': 1 });
TransportOfferSchema.index({ 'route.origin.country': 1, 'route.destination.country': 1 });
TransportOfferSchema.index({ status: 1 });
TransportOfferSchema.index({ loadingDate: 1 });
TransportOfferSchema.index({ 'source.lastSeenAt': 1 });
TransportOfferSchema.index({ 'company.transportCompanyId': 1 });

export default mongoose.model<ITransportOffer>('TransportOffer', TransportOfferSchema);

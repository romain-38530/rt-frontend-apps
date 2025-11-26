/**
 * Types pour l'intégration Affret.IA
 * Recherche de transporteurs dans le réseau de 40,000 carriers
 */

// ========== RECHERCHE ==========

export interface CarrierSearchRequest {
  orderId?: string; // Recherche pour une commande spécifique
  pickupAddress: SearchAddress;
  deliveryAddress: SearchAddress;
  pickupDate: string;
  deliveryDate?: string;
  goods: SearchGoods;
  constraints?: SearchConstraints;
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  filters?: CarrierFilters;
  limit?: number; // Max résultats
}

export interface SearchAddress {
  country: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface SearchGoods {
  type: 'pallet' | 'package' | 'bulk' | 'container' | 'vehicle' | 'other';
  weight: number; // kg
  volume?: number; // m³
  quantity?: number;
  dangerous?: boolean;
  temperature?: 'ambient' | 'refrigerated' | 'frozen';
}

export interface SearchConstraints {
  vehicleTypes?: string[]; // 'van', 'truck', 'semi', etc.
  certifications?: string[]; // ISO, HACCP, etc.
  insurance?: boolean;
  express?: boolean;
}

export interface CarrierFilters {
  minScore?: number; // Score min (0-100)
  maxDistance?: number; // Distance max en km
  specializations?: string[];
  languages?: string[];
  verified?: boolean;
}

// ========== RÉSULTATS ==========

export interface CarrierSearchResult {
  totalResults: number;
  carriers: AffretCarrier[];
  searchId: string; // ID de la recherche
  expiresAt: string; // Expiration des résultats
}

export interface AffretCarrier {
  id: string;
  name: string;
  logo?: string;
  description?: string;

  // Localisation
  country: string;
  city: string;
  coverage: string[]; // Pays/régions couverts

  // Capacités
  fleet: {
    total: number;
    types: FleetType[];
  };
  specializations: string[];
  certifications: string[];

  // Performance
  score: number; // 0-100
  totalDeliveries: number;
  onTimeRate: number; // %
  verified: boolean;

  // Estimation
  estimatedPrice?: {
    amount: number;
    currency: string;
    breakdown?: PriceBreakdown;
  };
  estimatedDuration?: number; // En heures
  distance?: number; // En km

  // Disponibilité
  available: boolean;
  availabilityDate?: string;

  // Contact
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface FleetType {
  type: string; // 'van', 'truck', 'semi', etc.
  count: number;
  capacity?: {
    weight: number; // kg
    volume: number; // m³
    pallets?: number;
  };
}

export interface PriceBreakdown {
  transport: number;
  fuel: number;
  tolls?: number;
  insurance?: number;
  handling?: number;
  other?: number;
}

// ========== OFFRES ==========

export type OfferStatus =
  | 'pending' // En attente de réponse carrier
  | 'submitted' // Offre soumise
  | 'accepted' // Acceptée par shipper
  | 'rejected' // Rejetée par shipper
  | 'withdrawn' // Retirée par carrier
  | 'expired'; // Expirée

export interface AffretOffer {
  id: string;
  searchId: string;
  orderId?: string;
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;

  status: OfferStatus;

  // Prix
  price: {
    amount: number;
    currency: string;
    breakdown?: PriceBreakdown;
    validUntil: string; // Date expiration
  };

  // Transport
  pickupDate: string;
  deliveryDate: string;
  estimatedDuration: number; // Heures
  distance: number; // km
  route?: {
    waypoints: Array<{ city: string; eta: string }>;
  };

  // Véhicule assigné
  vehicle?: {
    type: string;
    registration?: string;
    driver?: {
      name: string;
      phone: string;
    };
  };

  // Conditions
  terms?: string;
  insurance: boolean;
  tracking: 'basic' | 'gps' | 'premium';

  // Metadata
  submittedAt: string;
  expiresAt: string;
  respondedAt?: string;
  notes?: string;
}

// ========== NÉGOCIATION ==========

export type NegotiationStatus =
  | 'open' // Ouverte
  | 'counter_offered' // Contre-offre faite
  | 'agreed' // Accord trouvé
  | 'failed' // Échec
  | 'cancelled'; // Annulée

export interface Negotiation {
  id: string;
  offerId: string;
  orderId?: string;
  carrierId: string;
  shipperId: string;

  status: NegotiationStatus;

  // Historique des offres
  offers: NegotiationOffer[];
  currentOffer: NegotiationOffer;

  // Messages
  messages: NegotiationMessage[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  agreedPrice?: {
    amount: number;
    currency: string;
  };
}

export interface NegotiationOffer {
  id: string;
  offeredBy: 'shipper' | 'carrier';
  price: {
    amount: number;
    currency: string;
    breakdown?: PriceBreakdown;
  };
  conditions?: {
    pickupDate?: string;
    deliveryDate?: string;
    terms?: string;
  };
  offeredAt: string;
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface NegotiationMessage {
  id: string;
  from: 'shipper' | 'carrier';
  message: string;
  attachments?: string[];
  sentAt: string;
  read: boolean;
}

// ========== ENCHÈRES (BIDDING) ==========

export type BidStatus =
  | 'draft' // Brouillon
  | 'published' // Publiée
  | 'active' // En cours
  | 'closed' // Clôturée
  | 'awarded' // Attribuée
  | 'cancelled'; // Annulée

export interface Bid {
  id: string;
  orderId: string;

  status: BidStatus;

  // Configuration
  config: {
    type: 'open' | 'sealed' | 'reverse'; // Type d'enchère
    startingPrice?: number;
    reservePrice?: number; // Prix de réserve
    currency: string;
    bidIncrement?: number; // Incrément minimum
    autoExtend?: boolean; // Extension auto si offre dernière minute
  };

  // Dates
  publishedAt?: string;
  startsAt: string;
  endsAt: string;
  extendedUntil?: string; // Si auto-extend

  // Participants
  invitedCarriers?: string[]; // IDs carriers invités (si pas public)
  participants: BidParticipant[];

  // Offres
  bids: BidOffer[];
  winningBid?: BidOffer;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BidParticipant {
  carrierId: string;
  carrierName: string;
  joinedAt: string;
  lastBidAt?: string;
  totalBids: number;
}

export interface BidOffer {
  id: string;
  bidId: string;
  carrierId: string;
  carrierName: string;

  price: {
    amount: number;
    currency: string;
  };

  // Conditions additionnelles
  conditions?: {
    pickupDate?: string;
    deliveryDate?: string;
    notes?: string;
  };

  submittedAt: string;
  rank?: number; // Classement (1 = meilleure offre)
  isWinning: boolean;
}

// ========== REQUÊTES & RÉPONSES ==========

export interface SendOfferRequestRequest {
  searchId: string;
  carrierId: string;
  orderId?: string;
  message?: string;
  deadline?: string; // Date limite réponse
}

export interface AcceptOfferRequest {
  offerId: string;
  orderId?: string;
  createOrder?: boolean; // Créer la commande automatiquement
}

export interface CounterOfferRequest {
  offerId: string;
  newPrice: {
    amount: number;
    currency: string;
  };
  conditions?: {
    pickupDate?: string;
    deliveryDate?: string;
    terms?: string;
  };
  message?: string;
}

export interface CreateBidRequest {
  orderId: string;
  config: Bid['config'];
  startsAt: string;
  endsAt: string;
  invitedCarriers?: string[];
  description?: string;
}

export interface PlaceBidRequest {
  bidId: string;
  price: {
    amount: number;
    currency: string;
  };
  conditions?: {
    pickupDate?: string;
    deliveryDate?: string;
    notes?: string;
  };
}

// ========== STATISTIQUES ==========

export interface AffretStats {
  totalCarriers: number;
  averageScore: number;
  coverageCountries: string[];
  averageResponseTime: number; // En heures
  successRate: number; // % d'offres acceptées
  topSpecializations: Array<{ name: string; count: number }>;
}

export interface SearchHistory {
  id: string;
  searchRequest: CarrierSearchRequest;
  results: number;
  createdAt: string;
  offersReceived: number;
  status: 'pending' | 'offers_received' | 'order_created' | 'expired';
}

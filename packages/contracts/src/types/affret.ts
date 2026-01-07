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

export type AffretOfferStatus =
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

  status: AffretOfferStatus;

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

// ========== ÉVÉNEMENTS SYSTÈME (13 events) ==========

export type AffretEventType =
  | 'affretia.trigger.no-carrier-accepted'
  | 'affretia.trigger.capability-gap'
  | 'affretia.trigger.manual'
  | 'affretia.shortlist.generated'
  | 'affretia.broadcasted.to.market'
  | 'affretia.carrier.responded'
  | 'affretia.best-carrier.selected'
  | 'affretia.order.assigned'
  | 'affretia.tracking.start'
  | 'affretia.carrier.rejected.vigilance'
  | 'affretia.transport.scored'
  | 'affretia.order.closed'
  | 'documents.uploaded';

export interface AffretEvent {
  id: string;
  type: AffretEventType;
  timestamp: string;
  sessionId: string;
  orderId?: string;
  carrierId?: string;
  payload: Record<string, unknown>;
  metadata?: {
    userId?: string;
    source?: string;
    ip?: string;
  };
}

export interface AffretEventTriggerNoCarrier extends AffretEvent {
  type: 'affretia.trigger.no-carrier-accepted';
  payload: {
    orderId: string;
    reason: 'all_refused' | 'timeout' | 'no_response';
    attemptedCarriers: number;
    elapsedTime: number; // seconds
  };
}

export interface AffretEventTriggerCapabilityGap extends AffretEvent {
  type: 'affretia.trigger.capability-gap';
  payload: {
    orderId: string;
    missingCapabilities: string[]; // 'ADR', 'refrigerated', 'hayon', etc.
    searchedCarriers: number;
  };
}

export interface AffretEventTriggerManual extends AffretEvent {
  type: 'affretia.trigger.manual';
  payload: {
    orderId: string;
    triggeredBy: string;
    reason?: string;
  };
}

export interface AffretEventShortlistGenerated extends AffretEvent {
  type: 'affretia.shortlist.generated';
  payload: {
    shortlistId: string;
    totalCandidates: number; // 20-200
    criteria: {
      geographic: number;
      temporal: number;
      capability: number;
      historical: number;
    };
  };
}

export interface AffretEventBroadcasted extends AffretEvent {
  type: 'affretia.broadcasted.to.market';
  payload: {
    broadcastId: string;
    channels: BroadcastChannel[];
    recipientsCount: number;
    estimatedPrice: number;
  };
}

export interface AffretEventCarrierResponded extends AffretEvent {
  type: 'affretia.carrier.responded';
  payload: {
    carrierId: string;
    carrierName: string;
    responseType: CarrierResponseType;
    proposedPrice?: number;
    responseTime: number; // seconds
  };
}

export interface AffretEventBestCarrierSelected extends AffretEvent {
  type: 'affretia.best-carrier.selected';
  payload: {
    carrierId: string;
    carrierName: string;
    score: number;
    finalPrice: number;
    selectionCriteria: {
      priceScore: number;
      qualityScore: number;
      distanceScore: number;
      historicalScore: number;
    };
  };
}

export interface AffretEventOrderAssigned extends AffretEvent {
  type: 'affretia.order.assigned';
  payload: {
    carrierId: string;
    carrierName: string;
    assignmentId: string;
    trackingLevel: AffretTrackingLevel;
    estimatedPickup: string;
    estimatedDelivery: string;
  };
}

export interface AffretEventTrackingStart extends AffretEvent {
  type: 'affretia.tracking.start';
  payload: {
    trackingId: string;
    level: AffretTrackingLevel;
    provider?: string; // 'openstreetmap', 'vehizen', 'gps_smartphone'
  };
}

export interface AffretEventCarrierRejectedVigilance extends AffretEvent {
  type: 'affretia.carrier.rejected.vigilance';
  payload: {
    carrierId: string;
    carrierName: string;
    rejectionReasons: VigilanceRejectReason[];
    complianceScore: number;
  };
}

export interface AffretEventTransportScored extends AffretEvent {
  type: 'affretia.transport.scored';
  payload: {
    carrierId: string;
    finalScore: number;
    breakdown: {
      punctuality: number;
      appointmentRespect: number;
      podSpeed: number;
      incidentManagement: number;
      communicationQuality: number;
    };
    previousScore: number;
    newAverageScore: number;
  };
}

export interface AffretEventOrderClosed extends AffretEvent {
  type: 'affretia.order.closed';
  payload: {
    success: boolean;
    finalPrice: number;
    documentsReceived: AffretDocumentType[];
    syncedToERP: boolean;
    archivedAt: string;
  };
}

export interface AffretEventDocumentsUploaded extends AffretEvent {
  type: 'documents.uploaded';
  payload: {
    documentId: string;
    documentType: AffretDocumentType;
    filename: string;
    ocrProcessed: boolean;
    extractedData?: Record<string, string>;
  };
}

// ========== DÉCLENCHEMENT (TRIGGER) ==========

export type TriggerType = 'manual' | 'auto' | 'capability-gap';

export interface AffretTriggerRequest {
  orderId: string;
  triggerType: TriggerType;
  reason?: string;
  organizationId: string;
  userId?: string;
  priority?: 'normal' | 'high' | 'urgent';
  maxPrice?: number;
  maxResponseTime?: number; // hours
}

export interface AffretSession {
  id: string;
  orderId: string;
  organizationId: string;
  status: SessionStatus;
  triggerType: TriggerType;
  triggerReason?: string;

  // Shortlist
  shortlist?: {
    id: string;
    carriers: ShortlistCarrier[];
    generatedAt: string;
  };

  // Broadcast
  broadcast?: {
    id: string;
    channels: BroadcastChannel[];
    sentAt: string;
    stats: BroadcastStats;
  };

  // Propositions
  proposals: CarrierProposal[];
  selectedProposal?: CarrierProposal;

  // Assignment
  assignment?: Assignment;

  // Metadata
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedReason?: string;
}

export type SessionStatus =
  | 'pending'
  | 'analyzing'
  | 'shortlist_generated'
  | 'broadcasting'
  | 'awaiting_responses'
  | 'selecting'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'closed'
  | 'failed'
  | 'cancelled';

export interface ShortlistCarrier {
  carrierId: string;
  carrierName: string;
  score: number;
  matchScore: number;
  estimatedPrice: number;
  distance: number;
  historicalPerformance?: {
    totalMissions: number;
    onTimeRate: number;
    averageRating: number;
  };
}

// ========== DIFFUSION (BROADCAST) ==========

export type BroadcastChannel = 'email' | 'marketplace' | 'push' | 'sms';

export interface BroadcastRequest {
  sessionId: string;
  channels: BroadcastChannel[];
  message?: string;
  deadline?: string;
  estimatedPrice?: number;
}

export interface BroadcastStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  byChannel: Record<BroadcastChannel, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}

export interface BroadcastRecipient {
  carrierId: string;
  carrierName: string;
  email?: string;
  phone?: string;
  channel: BroadcastChannel;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  respondedAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'responded' | 'bounced' | 'failed';
}

// ========== PROPOSITIONS TRANSPORTEUR ==========

export type CarrierResponseType = 'accept' | 'counter' | 'reject' | 'no_response';

export interface CarrierProposal {
  id: string;
  sessionId: string;
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;

  responseType: CarrierResponseType;

  // Prix
  proposedPrice: number;
  originalEstimate: number;
  priceVariation: number; // %
  currency: string;

  // Détails
  pickupDate: string;
  deliveryDate: string;
  vehicle?: {
    type: string;
    registration?: string;
    driver?: string;
  };
  conditions?: string;

  // Scoring
  score: number;
  scoreBreakdown: {
    price: number; // 40%
    quality: number; // 25%
    distance: number; // 15%
    historical: number; // 10%
    reactivity: number; // 5%
    vigilance: number; // 5%
  };

  // Metadata
  respondedAt: string;
  responseTime: number; // seconds
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'negotiating';
}

// ========== SÉLECTION IA ==========

export interface AISelectionRequest {
  sessionId: string;
  autoAcceptThreshold?: number; // Score min pour auto-accept (default: 85)
  priceTolerancePercent?: number; // Tolérance prix (default: 15%)
}

export interface AISelectionResult {
  selectedCarrierId: string;
  selectedCarrierName: string;
  selectedPrice: number;
  score: number;
  confidence: number; // 0-100
  recommendation: string;
  alternatives: Array<{
    carrierId: string;
    carrierName: string;
    price: number;
    score: number;
    reason: string;
  }>;
  autoAccepted: boolean;
}

export interface AIScoringConfig {
  weights: {
    price: number; // default: 0.40
    quality: number; // default: 0.25
    distance: number; // default: 0.15
    historical: number; // default: 0.10
    reactivity: number; // default: 0.05
    vigilance: number; // default: 0.05
  };
  thresholds: {
    autoAcceptScore: number; // default: 85
    minAcceptableScore: number; // default: 60
    priceTolerancePercent: number; // default: 15
  };
}

// ========== ASSIGNATION ==========

export interface AssignmentRequest {
  sessionId: string;
  carrierId: string;
  finalPrice: number;
  trackingLevel: AffretTrackingLevel;
  notes?: string;
}

export interface Assignment {
  id: string;
  sessionId: string;
  orderId: string;
  carrierId: string;
  carrierName: string;

  finalPrice: number;
  currency: string;

  trackingLevel: AffretTrackingLevel;
  trackingId?: string;

  vehicle?: {
    type: string;
    registration: string;
    driver: {
      name: string;
      phone: string;
    };
  };

  schedule: {
    pickupDate: string;
    deliveryDate: string;
    pickupWindow?: { start: string; end: string };
    deliveryWindow?: { start: string; end: string };
  };

  status: AssignmentStatus;
  statusHistory: Array<{
    status: AssignmentStatus;
    timestamp: string;
    notes?: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

export type AssignmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// ========== TRACKING ==========

export type AffretTrackingLevel = 'basic' | 'intermediate' | 'premium';

export interface TrackingConfig {
  orderId: string;
  level: AffretTrackingLevel;
  provider?: 'email' | 'gps_smartphone' | 'openstreetmap' | 'vehizen' | 'other';
  updateFrequency?: number; // minutes
  alerts?: {
    delay: boolean;
    deviation: boolean;
    geofence: boolean;
    eta: boolean;
  };
}

export interface TrackingUpdate {
  id: string;
  orderId: string;
  timestamp: string;

  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
  };

  status: AffretTrackingStatus;
  eta?: string;

  source: 'manual' | 'gps' | 'api' | 'geofence';
  provider?: string;
}

export type AffretTrackingStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'near_destination'
  | 'delivered'
  | 'delayed'
  | 'incident';

// ========== DOCUMENTS ==========

export type AffretDocumentType = 'bl' | 'cmr' | 'pod' | 'invoice' | 'packing_list' | 'customs' | 'other';

export interface TransportDocument {
  id: string;
  orderId: string;
  sessionId?: string;

  type: AffretDocumentType;
  filename: string;
  mimeType: string;
  size: number; // bytes
  url: string;

  // OCR
  ocrProcessed: boolean;
  ocrConfidence?: number;
  extractedData?: DocumentExtractedData;

  // Validation
  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  validationErrors?: string[];

  // Metadata
  uploadedBy: string;
  uploadedAt: string;
  source: 'carrier' | 'shipper' | 'ocr' | 'api';
}

export interface DocumentExtractedData {
  // Commun
  documentNumber?: string;
  date?: string;

  // BL/CMR
  shipper?: {
    name?: string;
    address?: string;
  };
  consignee?: {
    name?: string;
    address?: string;
  };
  carrier?: {
    name?: string;
    license?: string;
  };

  // Marchandise
  goods?: {
    description?: string;
    weight?: number;
    packages?: number;
    pallets?: number;
  };

  // POD
  receivedBy?: string;
  receivedAt?: string;
  signature?: boolean;
  remarks?: string;

  // Facture
  invoiceNumber?: string;
  totalAmount?: number;
  currency?: string;
}

export interface DocumentUploadRequest {
  orderId: string;
  type: AffretDocumentType;
  file: File | Blob;
  filename?: string;
  processOCR?: boolean;
}

export interface DocumentReminderConfig {
  orderId: string;
  documentTypes: AffretDocumentType[];
  reminderSchedule: {
    'J+1'?: boolean;
    'J+2'?: boolean;
    'J+7'?: boolean;
    'J+30'?: boolean;
    'after_48h_voice'?: boolean;
  };
}

// ========== VIGILANCE ==========

export type AffretVigilanceStatus = 'compliant' | 'warning' | 'non_compliant' | 'blacklisted' | 'pending';

export type VigilanceRejectReason =
  | 'kbis_expired'
  | 'kbis_missing'
  | 'urssaf_expired'
  | 'urssaf_missing'
  | 'insurance_expired'
  | 'insurance_missing'
  | 'insurance_insufficient'
  | 'license_expired'
  | 'license_missing'
  | 'license_suspended'
  | 'identity_missing'
  | 'rib_invalid'
  | 'blacklisted'
  | 'incidents_unresolved';

export interface VigilanceCheck {
  carrierId: string;
  carrierName: string;

  overallStatus: AffretVigilanceStatus;
  complianceScore: number; // 0-100

  checks: {
    kbis: AffretVigilanceDocument;
    urssaf: AffretVigilanceDocument;
    insurance: VigilanceInsurance;
    license: AffretVigilanceDocument;
    identity: AffretVigilanceDocument;
    rib: VigilanceRib;
    incidents: VigilanceIncidents;
  };

  rejectionReasons: VigilanceRejectReason[];

  lastCheckedAt: string;
  nextCheckDue: string;
  alerts: AffretVigilanceAlert[];
}

export interface AffretVigilanceDocument {
  status: 'valid' | 'expired' | 'expiring_soon' | 'missing' | 'invalid';
  documentId?: string;
  issuedAt?: string;
  expiresAt?: string;
  daysUntilExpiry?: number;
  verified: boolean;
  verifiedAt?: string;
}

export interface VigilanceInsurance {
  status: 'valid' | 'expired' | 'expiring_soon' | 'missing' | 'insufficient';
  documentId?: string;
  provider?: string;
  policyNumber?: string;
  coverage: number; // Amount
  minRequired: number;
  expiresAt?: string;
  daysUntilExpiry?: number;
  verified: boolean;
}

export interface VigilanceRib {
  status: 'valid' | 'invalid' | 'missing' | 'mismatch';
  iban?: string; // Masked
  bic?: string;
  bankName?: string;
  holderName?: string;
  matchesCompany: boolean;
  verified: boolean;
}

export interface VigilanceIncidents {
  totalIncidents: number;
  unresolvedIncidents: number;
  severeIncidents: number;
  lastIncidentAt?: string;
  status: 'clean' | 'warning' | 'blocked';
}

export interface AffretVigilanceAlert {
  id: string;
  type: 'expiry_j30' | 'expiry_j15' | 'expiry_j7' | 'expired' | 'document_invalid' | 'incident';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  documentType?: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface VigilanceCheckRequest {
  carrierId: string;
  checks?: Array<'kbis' | 'urssaf' | 'insurance' | 'license' | 'identity' | 'rib' | 'incidents' | 'blacklist'>;
  forceRefresh?: boolean;
}

// ========== SCORING FINAL ==========

export interface TransportScoring {
  orderId: string;
  carrierId: string;

  // Critères (0-100 chacun)
  criteria: {
    punctuality: number; // Respect horaires
    appointmentRespect: number; // Présence RDV
    podSpeed: number; // Rapidité POD (< 24h = 100)
    incidentManagement: number; // Gestion incidents
    communicationQuality: number; // Réactivité com
    delayJustification: number; // Pénalités réduites si justifié
  };

  // Score final pondéré
  finalScore: number;

  // Impact
  previousCarrierScore: number;
  newCarrierScore: number;

  // Metadata
  scoredAt: string;
  scoredBy: 'auto' | 'manual';
  notes?: string;
}

// ========== CLÔTURE ==========

export interface OrderCloseRequest {
  sessionId: string;
  success: boolean;
  documentsReceived: AffretDocumentType[];
  finalNotes?: string;
  syncToERP?: boolean;
}

export interface OrderCloseResult {
  sessionId: string;
  orderId: string;

  success: boolean;
  finalPrice: number;

  // Documents
  documentsStatus: {
    required: AffretDocumentType[];
    received: AffretDocumentType[];
    missing: AffretDocumentType[];
  };

  // Sync
  erpSynced: boolean;
  erpSyncError?: string;

  // Archivage
  archived: boolean;
  archiveId?: string;
  retentionYears: number; // 10 ans légal

  // Facturation
  invoiceGenerated: boolean;
  invoiceId?: string;

  // Stats mise à jour
  carrierScoreUpdated: boolean;
  newCarrierScore?: number;

  closedAt: string;
}

// ========== BOURSE AFFRET.IA ==========

export interface BourseOffer {
  id: string;
  sessionId: string;
  orderId: string;

  // Détails transport
  pickup: {
    city: string;
    postalCode: string;
    country: string;
    date: string;
    window?: { start: string; end: string };
  };
  delivery: {
    city: string;
    postalCode: string;
    country: string;
    date: string;
    window?: { start: string; end: string };
  };

  // Marchandise
  goods: {
    type: string;
    weight: number;
    volume?: number;
    pallets?: number;
    dangerous: boolean;
    temperature?: string;
  };

  // Prix
  estimatedPrice: number;
  currency: string;
  priceNegotiable: boolean;

  // Visibilité
  visibility: 'public' | 'premium' | 'invited';
  targetRadius: number; // km around pickup/delivery

  // Metadata
  publishedAt: string;
  expiresAt: string;
  viewCount: number;
  responseCount: number;
  status: 'active' | 'attributed' | 'expired' | 'cancelled';
}

// ========== DASHBOARD STATS ==========

export interface AffretDashboardStats {
  // KPIs principaux
  totalSessions: number;
  successRate: number;
  averageResponseTime: number; // hours
  averagePrice: number;

  // Par période
  period: {
    start: string;
    end: string;
  };

  // Détails
  sessionsByStatus: Record<SessionStatus, number>;
  sessionsByTrigger: Record<TriggerType, number>;

  // Performance
  topCarriers: Array<{
    carrierId: string;
    carrierName: string;
    missions: number;
    averageScore: number;
    onTimeRate: number;
  }>;

  // Géographie
  topRoutes: Array<{
    origin: string;
    destination: string;
    count: number;
    averagePrice: number;
  }>;

  // Tendances
  priceEvolution: Array<{
    date: string;
    averagePrice: number;
    volume: number;
  }>;
}

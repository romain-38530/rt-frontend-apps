/**
 * SYMPHONI.A - Order Dispatch & Lane Matching API Client
 * Service TypeScript pour le dispatch automatique des commandes
 * Conforme au cahier des charges "Fonctionnement d'une Commande de Transport"
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DISPATCH_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';

// =============================================================================
// TYPES - STATUTS DE COMMANDE
// =============================================================================

export type OrderStatus =
  | 'draft'                    // Brouillon
  | 'created'                  // Creee
  | 'pending_dispatch'         // En attente d'affectation
  | 'sent_to_carrier'          // Envoyee au transporteur
  | 'awaiting_carrier_response'// En attente reponse transporteur
  | 'carrier_accepted'         // Acceptee par transporteur
  | 'carrier_refused'          // Refusee par transporteur
  | 'carrier_timeout'          // Timeout transporteur
  | 'escalated_affretia'       // Escaladee vers Affret.IA
  | 'in_transit'               // En transit
  | 'arrived_pickup'           // Arrive au chargement
  | 'loaded'                   // Charge
  | 'arrived_delivery'         // Arrive a la livraison
  | 'delivered'                // Livre
  | 'documents_pending'        // En attente documents
  | 'scoring_pending'          // En attente scoring
  | 'closed'                   // Cloturee
  | 'cancelled'                // Annulee
  | 'archived';                // Archivee

// =============================================================================
// TYPES - LANE MATCHING
// =============================================================================

export interface TransportLane {
  id: string;
  industrielId: string;
  name: string;

  // Origine
  origin: {
    country: string;
    region?: string;
    postalCodePrefix?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
    radius?: number;           // km
  };

  // Destination
  destination: {
    country: string;
    region?: string;
    postalCodePrefix?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
    radius?: number;           // km
  };

  // Caracteristiques
  goodsTypes?: string[];       // Types de marchandises
  constraints?: string[];      // ADR, hayon, frigo, etc.
  vehicleTypes?: string[];     // Types de vehicules acceptes

  // Transporteurs associes (chaine de dispatch)
  carrierChain: LaneCarrier[];

  // Statistiques
  stats: {
    totalOrders: number;
    avgTransitDays: number;
    avgPrice: number;
    successRate: number;       // % livraisons reussies
  };

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LaneCarrier {
  carrierId: string;
  carrierName: string;
  position: number;            // Position dans la chaine (1 = premier)
  priority: 'high' | 'medium' | 'low';

  // Tarification
  pricingGridId?: string;
  fixedPrice?: number;
  pricePerKm?: number;

  // Performance
  score: number;
  onTimeRate: number;
  acceptanceRate: number;

  // Contraintes
  minVolume?: number;
  maxVolume?: number;
  availableDays?: number[];    // 0=Dim, 1=Lun, etc.

  isActive: boolean;
}

export interface LaneMatchResult {
  laneId: string;
  laneName: string;
  confidence: number;          // 0-100
  matchedCriteria: string[];
  carrierChain: LaneCarrier[];
  estimatedPrice?: number;
  estimatedTransitDays?: number;
}

// =============================================================================
// TYPES - DISPATCH CHAIN
// =============================================================================

export interface DispatchConfig {
  id: string;
  industrielId: string;

  // Delais de reponse
  carrierResponseTimeout: number;    // Secondes (defaut: 7200 = 2h)
  escalationDelay: number;           // Delai avant escalade Affret.IA
  maxCarriersInChain: number;        // Max transporteurs avant escalade

  // Notifications
  notificationChannels: ('email' | 'sms' | 'push' | 'webhook')[];
  reminderEnabled: boolean;
  reminderDelayMinutes: number;      // Rappel avant timeout

  // Regles d'eligibilite
  eligibilityRules: {
    minScore: number;                // Score minimum requis
    requireVigilanceCompliant: boolean;
    requireActiveInsurance: boolean;
    requirePricingGrid: boolean;
    excludeBlocked: boolean;
  };

  // Escalade auto
  autoEscalateToAffretIA: boolean;
  affretIAConfig?: {
    maxPrice?: number;
    minScore?: number;
    preferredCarriers?: string[];
  };

  createdAt: string;
  updatedAt: string;
}

export interface DispatchChain {
  id: string;
  orderId: string;
  laneId?: string;
  industrielId: string;

  // Chaine de transporteurs
  carriers: DispatchChainEntry[];

  // Statut actuel
  currentPosition: number;           // Position actuelle dans la chaine
  currentCarrierId?: string;
  sentAt?: string;                   // Date d'envoi au transporteur actuel
  responseDeadline?: string;         // Date limite de reponse

  // Resultats
  status: 'pending' | 'in_progress' | 'accepted' | 'exhausted' | 'escalated';
  acceptedBy?: string;
  acceptedAt?: string;

  // Escalade
  escalatedToAffretIA: boolean;
  affretIASearchId?: string;

  generatedAt: string;
  completedAt?: string;
}

export interface DispatchChainEntry {
  position: number;
  carrierId: string;
  carrierName: string;
  score: number;
  estimatedPrice?: number;

  // Statut
  status: 'pending' | 'sent' | 'accepted' | 'refused' | 'timeout' | 'skipped';
  sentAt?: string;
  respondedAt?: string;
  refusalReason?: string;

  // Eligibilite
  isEligible: boolean;
  ineligibilityReasons?: string[];
}

// =============================================================================
// TYPES - CARRIER ACCEPTANCE
// =============================================================================

export interface CarrierNotification {
  id: string;
  orderId: string;
  carrierId: string;
  dispatchChainId: string;

  // Contenu
  type: 'new_order' | 'reminder' | 'timeout_warning';
  channels: ('email' | 'sms' | 'push' | 'webhook')[];

  // Details commande
  orderSummary: {
    reference: string;
    pickupAddress: string;
    deliveryAddress: string;
    pickupDate: string;
    deliveryDate?: string;
    goodsDescription: string;
    weight?: number;
    pallets?: number;
    constraints?: string[];
    estimatedPrice?: number;
  };

  // Delais
  responseDeadline: string;
  timeoutAt: string;

  // Statut
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  respondedAt?: string;
  response?: 'accepted' | 'refused';
}

export interface CarrierResponse {
  orderId: string;
  carrierId: string;
  response: 'accept' | 'refuse';
  refusalReason?: string;
  proposedPrice?: number;
  proposedPickupDate?: string;
  notes?: string;
}

// =============================================================================
// TYPES - TRACKING PRICING
// =============================================================================

export type TrackingLevel = 'basic' | 'intermediate' | 'premium';

export interface TrackingPricing {
  level: TrackingLevel;
  name: string;
  description: string;

  // Tarification
  pricingType: 'monthly' | 'per_transport';
  priceMonthly?: number;
  pricePerTransport?: number;

  // Fonctionnalites
  features: {
    updateMethod: 'email' | 'app' | 'api';
    updateFrequency: string;           // "manuel", "30s", "1-5s"
    gpsTracking: boolean;
    geofencing: boolean;
    etaPrediction: boolean;
    realtimeMap: boolean;
    delayDetection: boolean;
    autoRescheduling: boolean;
  };

  isActive: boolean;
}

export const TRACKING_PRICING: Record<TrackingLevel, TrackingPricing> = {
  basic: {
    level: 'basic',
    name: 'Basic - Mail',
    description: 'Suivi par email avec liens cliquables',
    pricingType: 'monthly',
    priceMonthly: 50,
    features: {
      updateMethod: 'email',
      updateFrequency: 'manuel',
      gpsTracking: false,
      geofencing: false,
      etaPrediction: false,
      realtimeMap: false,
      delayDetection: false,
      autoRescheduling: false,
    },
    isActive: true,
  },
  intermediate: {
    level: 'intermediate',
    name: 'Intermediaire - GPS Smartphone',
    description: 'Tracking GPS via application mobile',
    pricingType: 'monthly',
    priceMonthly: 150,
    features: {
      updateMethod: 'app',
      updateFrequency: '30s',
      gpsTracking: true,
      geofencing: true,
      etaPrediction: false,
      realtimeMap: true,
      delayDetection: true,
      autoRescheduling: false,
    },
    isActive: true,
  },
  premium: {
    level: 'premium',
    name: 'Premium - API TomTom',
    description: 'Telematique haute frequence avec prediction IA',
    pricingType: 'per_transport',
    pricePerTransport: 4,
    features: {
      updateMethod: 'api',
      updateFrequency: '1-5s',
      gpsTracking: true,
      geofencing: true,
      etaPrediction: true,
      realtimeMap: true,
      delayDetection: true,
      autoRescheduling: true,
    },
    isActive: true,
  },
};

// =============================================================================
// TYPES - ARCHIVAGE LEGAL
// =============================================================================

export interface LegalArchive {
  id: string;
  orderId: string;
  industrielId: string;
  carrierId: string;

  // Periode de retention
  archivedAt: string;
  retentionYears: number;              // 10 ans par defaut
  expiresAt: string;                   // Date d'expiration de l'archive
  deletionScheduledAt?: string;

  // Documents archives
  documents: ArchivedDocument[];

  // Metadata
  orderReference: string;
  transportDate: string;
  pickupAddress: string;
  deliveryAddress: string;

  // Verification
  checksum: string;                    // Hash de verification integrite
  verifiedAt?: string;
  verifiedBy?: string;

  // Statut
  status: 'active' | 'pending_deletion' | 'deleted';
}

export interface ArchivedDocument {
  id: string;
  type: 'cmr' | 'bl' | 'pod' | 'invoice' | 'customs' | 'other';
  name: string;
  originalUrl: string;
  archiveUrl: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  uploadedAt: string;
  archivedAt: string;
}

// =============================================================================
// TYPES - EVENEMENTS
// =============================================================================

export type OrderEventType =
  // Creation
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  // Lane Matching
  | 'order.lane.detected'
  | 'order.lane.not_found'
  // Dispatch
  | 'dispatch.chain.generated'
  | 'dispatch.chain.exhausted'
  | 'order.sent.to.carrier'
  | 'carrier.notified'
  | 'carrier.reminder.sent'
  // Reponse transporteur
  | 'carrier.accepted'
  | 'carrier.refused'
  | 'carrier.timeout'
  | 'carrier.counter_offer'
  // Escalade
  | 'order.escalated.to.affretia'
  | 'affretia.carrier.assigned'
  // Tracking
  | 'tracking.started'
  | 'tracking.eta.updated'
  | 'tracking.delay.detected'
  | 'tracking.position.updated'
  // Etapes transport
  | 'order.arrived.pickup'
  | 'order.loaded'
  | 'order.departed.pickup'
  | 'order.arrived.delivery'
  | 'order.delivered'
  // Documents
  | 'documents.uploaded'
  | 'documents.ocr.completed'
  | 'documents.verified'
  // Finalisation
  | 'carrier.scored'
  | 'order.closed'
  | 'order.archived';

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;

  // Acteur
  triggeredBy: {
    type: 'user' | 'carrier' | 'system' | 'cron' | 'webhook';
    id?: string;
    name?: string;
  };

  // Donnees
  payload: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;

  // Metadata
  timestamp: string;
  processedAt?: string;
}

// =============================================================================
// API FUNCTIONS - FETCH HELPER
// =============================================================================

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur reseau' }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// API FUNCTIONS - LANE MATCHING
// =============================================================================

export async function detectLane(params: {
  orderId: string;
  pickupAddress: {
    country: string;
    postalCode: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  deliveryAddress: {
    country: string;
    postalCode: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  goodsType?: string;
  constraints?: string[];
  vehicleType?: string;
}): Promise<{
  matches: LaneMatchResult[];
  bestMatch?: LaneMatchResult;
  event: OrderEvent;
}> {
  return fetchAPI('/lanes/detect', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getLanes(industrielId: string): Promise<{
  lanes: TransportLane[];
  total: number;
}> {
  return fetchAPI(`/lanes?industrielId=${industrielId}`);
}

export async function getLane(laneId: string): Promise<TransportLane> {
  return fetchAPI(`/lanes/${laneId}`);
}

export async function createLane(params: {
  industrielId: string;
  name: string;
  origin: TransportLane['origin'];
  destination: TransportLane['destination'];
  goodsTypes?: string[];
  constraints?: string[];
  vehicleTypes?: string[];
  carrierChain?: Omit<LaneCarrier, 'score' | 'onTimeRate' | 'acceptanceRate'>[];
}): Promise<{ lane: TransportLane }> {
  return fetchAPI('/lanes', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateLane(
  laneId: string,
  params: Partial<Omit<TransportLane, 'id' | 'industrielId' | 'createdAt' | 'updatedAt'>>
): Promise<{ lane: TransportLane }> {
  return fetchAPI(`/lanes/${laneId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function addCarrierToLane(
  laneId: string,
  params: {
    carrierId: string;
    position?: number;
    priority?: 'high' | 'medium' | 'low';
    pricingGridId?: string;
    fixedPrice?: number;
  }
): Promise<{ lane: TransportLane }> {
  return fetchAPI(`/lanes/${laneId}/carriers`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function removeCarrierFromLane(
  laneId: string,
  carrierId: string
): Promise<{ success: boolean }> {
  return fetchAPI(`/lanes/${laneId}/carriers/${carrierId}`, {
    method: 'DELETE',
  });
}

export async function reorderLaneCarriers(
  laneId: string,
  carrierIds: string[]
): Promise<{ lane: TransportLane }> {
  return fetchAPI(`/lanes/${laneId}/carriers/reorder`, {
    method: 'POST',
    body: JSON.stringify({ carrierIds }),
  });
}

// =============================================================================
// API FUNCTIONS - DISPATCH CHAIN
// =============================================================================

export async function generateDispatchChain(params: {
  orderId: string;
  industrielId: string;
  laneId?: string;
  forceRegenerate?: boolean;
}): Promise<{
  chain: DispatchChain;
  event: OrderEvent;
}> {
  return fetchAPI('/dispatch/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDispatchChain(orderId: string): Promise<DispatchChain> {
  return fetchAPI(`/dispatch/chain/${orderId}`);
}

export async function startDispatch(orderId: string): Promise<{
  chain: DispatchChain;
  notification: CarrierNotification;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/start`, {
    method: 'POST',
  });
}

export async function skipToNextCarrier(
  orderId: string,
  params?: { reason?: string }
): Promise<{
  chain: DispatchChain;
  notification?: CarrierNotification;
  escalated: boolean;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/next`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function escalateToAffretIA(orderId: string): Promise<{
  chain: DispatchChain;
  affretSearchId: string;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/escalate`, {
    method: 'POST',
  });
}

// =============================================================================
// API FUNCTIONS - CARRIER RESPONSE
// =============================================================================

export async function respondToOrder(
  orderId: string,
  params: CarrierResponse
): Promise<{
  success: boolean;
  chain: DispatchChain;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/respond`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function acceptOrder(
  orderId: string,
  carrierId: string,
  params?: {
    proposedPrice?: number;
    notes?: string;
  }
): Promise<{
  success: boolean;
  chain: DispatchChain;
  trackingActivated: boolean;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ carrierId, ...params }),
  });
}

export async function refuseOrder(
  orderId: string,
  carrierId: string,
  params: {
    reason: string;
    suggestAlternative?: boolean;
  }
): Promise<{
  success: boolean;
  chain: DispatchChain;
  nextCarrier?: { carrierId: string; carrierName: string };
  escalated: boolean;
  event: OrderEvent;
}> {
  return fetchAPI(`/dispatch/${orderId}/refuse`, {
    method: 'POST',
    body: JSON.stringify({ carrierId, ...params }),
  });
}

// =============================================================================
// API FUNCTIONS - DISPATCH CONFIG
// =============================================================================

export async function getDispatchConfig(industrielId: string): Promise<DispatchConfig> {
  return fetchAPI(`/dispatch/config/${industrielId}`);
}

export async function updateDispatchConfig(
  industrielId: string,
  params: Partial<Omit<DispatchConfig, 'id' | 'industrielId' | 'createdAt' | 'updatedAt'>>
): Promise<{ config: DispatchConfig }> {
  return fetchAPI(`/dispatch/config/${industrielId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

// Valeurs par defaut du timeout (2 heures)
export const DEFAULT_CARRIER_TIMEOUT_SECONDS = 7200;  // 2 heures
export const DEFAULT_REMINDER_DELAY_MINUTES = 30;     // Rappel 30 min avant timeout

// =============================================================================
// API FUNCTIONS - TRACKING PRICING
// =============================================================================

export async function getTrackingPricing(): Promise<{
  levels: TrackingPricing[];
}> {
  return fetchAPI('/tracking/pricing');
}

export async function calculateTrackingCost(params: {
  level: TrackingLevel;
  transportCount?: number;
  monthlySubscription?: boolean;
}): Promise<{
  level: TrackingLevel;
  unitPrice: number;
  totalPrice: number;
  billingType: 'monthly' | 'per_transport';
}> {
  return fetchAPI('/tracking/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function subscribeToTracking(params: {
  industrielId: string;
  level: TrackingLevel;
  billingCycle?: 'monthly' | 'annual';
}): Promise<{
  subscription: {
    id: string;
    level: TrackingLevel;
    priceMonthly: number;
    startDate: string;
  };
}> {
  return fetchAPI('/tracking/subscribe', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// API FUNCTIONS - LEGAL ARCHIVING (10 YEARS)
// =============================================================================

export async function archiveOrder(orderId: string): Promise<{
  archive: LegalArchive;
  event: OrderEvent;
}> {
  return fetchAPI(`/archive/${orderId}`, {
    method: 'POST',
  });
}

export async function getArchive(archiveId: string): Promise<LegalArchive> {
  return fetchAPI(`/archive/${archiveId}`);
}

export async function getOrderArchive(orderId: string): Promise<LegalArchive> {
  return fetchAPI(`/archive/order/${orderId}`);
}

export async function searchArchives(params: {
  industrielId?: string;
  carrierId?: string;
  dateFrom?: string;
  dateTo?: string;
  orderReference?: string;
  page?: number;
  limit?: number;
}): Promise<{
  archives: LegalArchive[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params.industrielId) query.append('industrielId', params.industrielId);
  if (params.carrierId) query.append('carrierId', params.carrierId);
  if (params.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params.dateTo) query.append('dateTo', params.dateTo);
  if (params.orderReference) query.append('orderReference', params.orderReference);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/archive?${query}`);
}

export async function verifyArchiveIntegrity(archiveId: string): Promise<{
  valid: boolean;
  checksumMatch: boolean;
  documentsValid: boolean;
  issues?: string[];
}> {
  return fetchAPI(`/archive/${archiveId}/verify`, {
    method: 'POST',
  });
}

export async function downloadArchive(
  archiveId: string,
  format: 'zip' | 'pdf'
): Promise<{
  downloadUrl: string;
  expiresAt: string;
}> {
  return fetchAPI(`/archive/${archiveId}/download?format=${format}`);
}

// Duree de retention legale par defaut (10 ans)
export const LEGAL_RETENTION_YEARS = 10;

// =============================================================================
// API FUNCTIONS - ORDER EVENTS
// =============================================================================

export async function getOrderEvents(
  orderId: string,
  params?: {
    types?: OrderEventType[];
    limit?: number;
  }
): Promise<{
  events: OrderEvent[];
  total: number;
}> {
  const query = new URLSearchParams();
  if (params?.types) query.append('types', params.types.join(','));
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/events/order/${orderId}?${query}`);
}

export async function getEventTimeline(orderId: string): Promise<{
  timeline: Array<{
    phase: string;
    events: OrderEvent[];
    startedAt?: string;
    completedAt?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
}> {
  return fetchAPI(`/events/order/${orderId}/timeline`);
}

// =============================================================================
// API FUNCTIONS - ORDER LIFECYCLE
// =============================================================================

export async function closeOrder(
  orderId: string,
  params?: {
    notes?: string;
    autoArchive?: boolean;
  }
): Promise<{
  success: boolean;
  scored: boolean;
  archived: boolean;
  events: OrderEvent[];
}> {
  return fetchAPI(`/orders/${orderId}/close`, {
    method: 'POST',
    body: JSON.stringify(params || { autoArchive: true }),
  });
}

export async function getOrderStatus(orderId: string): Promise<{
  orderId: string;
  status: OrderStatus;
  dispatchChain?: DispatchChain;
  currentCarrier?: {
    id: string;
    name: string;
    acceptedAt?: string;
  };
  tracking?: {
    level: TrackingLevel;
    active: boolean;
    lastPosition?: { lat: number; lng: number; timestamp: string };
    eta?: string;
  };
  documents?: {
    uploaded: number;
    pending: number;
    verified: number;
  };
  scoring?: {
    scored: boolean;
    score?: number;
  };
  archive?: {
    archived: boolean;
    archiveId?: string;
  };
}> {
  return fetchAPI(`/orders/${orderId}/status`);
}

// =============================================================================
// API FUNCTIONS - STATISTICS
// =============================================================================

export async function getDispatchStats(industrielId: string): Promise<{
  totalOrders: number;
  dispatchedOrders: number;
  acceptanceRate: number;               // % acceptes par premier transporteur
  avgResponseTime: number;              // Temps moyen de reponse (heures)
  escalationRate: number;               // % escalades vers Affret.IA
  byCarrier: Array<{
    carrierId: string;
    carrierName: string;
    ordersSent: number;
    accepted: number;
    refused: number;
    timeout: number;
    avgResponseTime: number;
  }>;
  byLane: Array<{
    laneId: string;
    laneName: string;
    ordersCount: number;
    successRate: number;
  }>;
}> {
  return fetchAPI(`/stats/dispatch/${industrielId}`);
}

export async function getArchiveStats(industrielId: string): Promise<{
  totalArchived: number;
  totalDocuments: number;
  totalSizeBytes: number;
  byYear: Array<{ year: number; count: number; sizeBytes: number }>;
  expiringThisYear: number;
  integrityIssues: number;
}> {
  return fetchAPI(`/stats/archive/${industrielId}`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    draft: 'Brouillon',
    created: 'Creee',
    pending_dispatch: 'En attente d\'affectation',
    sent_to_carrier: 'Envoyee au transporteur',
    awaiting_carrier_response: 'En attente reponse',
    carrier_accepted: 'Acceptee',
    carrier_refused: 'Refusee',
    carrier_timeout: 'Timeout',
    escalated_affretia: 'Escaladee Affret.IA',
    in_transit: 'En transit',
    arrived_pickup: 'Arrive chargement',
    loaded: 'Charge',
    arrived_delivery: 'Arrive livraison',
    delivered: 'Livre',
    documents_pending: 'Documents en attente',
    scoring_pending: 'Scoring en attente',
    closed: 'Cloturee',
    cancelled: 'Annulee',
    archived: 'Archivee',
  };
  return labels[status] || status;
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    draft: 'gray',
    created: 'blue',
    pending_dispatch: 'orange',
    sent_to_carrier: 'blue',
    awaiting_carrier_response: 'orange',
    carrier_accepted: 'green',
    carrier_refused: 'red',
    carrier_timeout: 'red',
    escalated_affretia: 'purple',
    in_transit: 'blue',
    arrived_pickup: 'blue',
    loaded: 'blue',
    arrived_delivery: 'blue',
    delivered: 'green',
    documents_pending: 'orange',
    scoring_pending: 'orange',
    closed: 'green',
    cancelled: 'gray',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}

export function getTrackingLevelLabel(level: TrackingLevel): string {
  return TRACKING_PRICING[level]?.name || level;
}

export function getTrackingPrice(level: TrackingLevel): string {
  const pricing = TRACKING_PRICING[level];
  if (!pricing) return '-';

  if (pricing.pricingType === 'monthly') {
    return `${pricing.priceMonthly}€/mois`;
  }
  return `${pricing.pricePerTransport}€/transport`;
}

export function formatTimeoutDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}min`;
}

export function getEventLabel(type: OrderEventType): string {
  const labels: Record<OrderEventType, string> = {
    'order.created': 'Commande creee',
    'order.updated': 'Commande mise a jour',
    'order.cancelled': 'Commande annulee',
    'order.lane.detected': 'Ligne detectee',
    'order.lane.not_found': 'Ligne non trouvee',
    'dispatch.chain.generated': 'Chaine de dispatch generee',
    'dispatch.chain.exhausted': 'Chaine de dispatch epuisee',
    'order.sent.to.carrier': 'Envoyee au transporteur',
    'carrier.notified': 'Transporteur notifie',
    'carrier.reminder.sent': 'Rappel envoye',
    'carrier.accepted': 'Acceptee par transporteur',
    'carrier.refused': 'Refusee par transporteur',
    'carrier.timeout': 'Timeout transporteur',
    'carrier.counter_offer': 'Contre-offre transporteur',
    'order.escalated.to.affretia': 'Escaladee vers Affret.IA',
    'affretia.carrier.assigned': 'Transporteur Affret.IA assigne',
    'tracking.started': 'Tracking demarre',
    'tracking.eta.updated': 'ETA mis a jour',
    'tracking.delay.detected': 'Retard detecte',
    'tracking.position.updated': 'Position mise a jour',
    'order.arrived.pickup': 'Arrive au chargement',
    'order.loaded': 'Chargement effectue',
    'order.departed.pickup': 'Depart du chargement',
    'order.arrived.delivery': 'Arrive a la livraison',
    'order.delivered': 'Livre',
    'documents.uploaded': 'Documents uploades',
    'documents.ocr.completed': 'OCR termine',
    'documents.verified': 'Documents verifies',
    'carrier.scored': 'Transporteur note',
    'order.closed': 'Commande cloturee',
    'order.archived': 'Commande archivee',
  };
  return labels[type] || type;
}

export function calculateRetentionExpiryDate(archivedAt: string | Date): Date {
  const archived = new Date(archivedAt);
  archived.setFullYear(archived.getFullYear() + LEGAL_RETENTION_YEARS);
  return archived;
}

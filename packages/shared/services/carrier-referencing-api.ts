/**
 * SYMPHONI.A - Carrier Referencing API Client
 * Service TypeScript pour le systeme de referencement transporteurs
 * Conforme au cahier des charges v4
 */

// API de referencement transporteurs - pointe vers authz-eb
const API_BASE_URL = process.env.NEXT_PUBLIC_CARRIERS_API_URL || 'https://ddaywxps9n701.cloudfront.net/api';

// =============================================================================
// TYPES - NIVEAUX DE REFERENCEMENT
// =============================================================================

export type CarrierLevel = 'guest' | 'referenced' | 'premium';

export type CarrierStatus =
  | 'pending_invitation'    // En attente d'invitation
  | 'invited'               // Invite
  | 'pending_validation'    // En attente validation documents
  | 'active'                // Actif/Reference
  | 'blocked'               // Bloque
  | 'suspended'             // Suspendu temporairement
  | 'churned';              // Desactive

export type VigilanceStatus = 'compliant' | 'warning' | 'blocked' | 'pending';

export type BlockingReason =
  | 'documents_expired'     // Documents expires
  | 'insurance_lapsed'      // Assurance expiree
  | 'score_below_threshold' // Score en dessous du seuil
  | 'unpaid_invoices'       // Factures impayees
  | 'compliance_violation'  // Violation conformite
  | 'manual_block';         // Blocage manuel

// =============================================================================
// TYPES - TRANSPORTEUR REFERENCE
// =============================================================================

export interface ReferencedCarrier {
  id: string;
  externalId?: string;           // ID Affret.IA si importe
  companyId: string;
  companyName: string;
  siret?: string;
  vatNumber?: string;

  // Niveau et statut
  level: CarrierLevel;
  status: CarrierStatus;
  vigilanceStatus: VigilanceStatus;

  // Scores
  overallScore: number;
  scoreDetails: {
    onTimeDelivery: number;
    communication: number;
    damageRate: number;
    documentation: number;
    responsiveness: number;
    pricing: number;
    compliance: number;
  };

  // Position dans la chaine de dispatch
  dispatchOrder: number;
  dispatchPriority: 'high' | 'medium' | 'low';

  // Documents et vigilance
  documents: CarrierDocument[];
  vigilanceAlerts: VigilanceAlert[];

  // Tarification
  pricingGrids: PricingGrid[];

  // Options/Supplements
  options: CarrierOption[];

  // Historique blocages
  blockingHistory: BlockingEvent[];
  currentBlockReason?: BlockingReason;
  blockedAt?: string;
  blockedUntil?: string;

  // Metriques
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageResponseTime: number;      // En heures
  lastActivityAt?: string;

  // Contact
  contact: {
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country: string;
  };

  // Capacites
  fleet?: {
    total: number;
    types: Array<{ type: string; count: number; capacity?: number }>;
  };
  coverage?: string[];              // Pays/regions couverts
  specializations?: string[];       // ADR, Frigo, etc.
  certifications?: string[];        // ISO, HACCP, etc.

  // Metadata
  referencedBy: string;             // Industriel qui l'a reference
  referencedAt: string;
  premiumSince?: string;
  source: 'manual' | 'affret_ia' | 'invitation';
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TYPES - DOCUMENTS TRANSPORTEUR
// =============================================================================

export type CarrierDocumentType =
  | 'kbis'                  // Extrait Kbis
  | 'licence_transport'     // Licence de transport
  | 'insurance_rc'          // Assurance RC
  | 'insurance_goods'       // Assurance marchandises
  | 'adr_certificate'       // Certificat ADR
  | 'haccp_certificate'     // Certificat HACCP
  | 'iso_certificate'       // Certification ISO
  | 'other';

export interface CarrierDocument {
  id: string;
  carrierId: string;
  type: CarrierDocumentType;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;

  // Validite
  issuedAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;

  // Verification
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;

  // Alertes envoyees
  alertsSent: {
    j30?: string;           // Date alerte J-30
    j15?: string;           // Date alerte J-15
    j7?: string;            // Date alerte J-7
  };

  uploadedAt: string;
  updatedAt: string;
}

// =============================================================================
// TYPES - ALERTES VIGILANCE
// =============================================================================

export type AlertType =
  | 'document_expiring_30'   // Document expire dans 30 jours
  | 'document_expiring_15'   // Document expire dans 15 jours
  | 'document_expiring_7'    // Document expire dans 7 jours
  | 'document_expired'       // Document expire
  | 'score_warning'          // Score en baisse
  | 'insurance_expiring'     // Assurance bientot expiree
  | 'compliance_issue'       // Probleme de conformite
  | 'blocking_imminent';     // Blocage imminent

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface VigilanceAlert {
  id: string;
  carrierId: string;
  type: AlertType;
  severity: AlertSeverity;

  title: string;
  message: string;

  // Document concerne (si applicable)
  documentId?: string;
  documentType?: CarrierDocumentType;

  // Actions
  actionRequired: boolean;
  actionUrl?: string;
  actionLabel?: string;

  // Notification
  notifiedAt?: string;
  notificationChannels: ('email' | 'sms' | 'push' | 'in_app')[];

  // Resolution
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;

  // Auto-actions
  autoBlockAt?: string;     // Date blocage auto si non resolu
  autoBlockReason?: BlockingReason;

  createdAt: string;
  expiresAt?: string;
}

// =============================================================================
// TYPES - EVENEMENTS REFERENCEMENT
// =============================================================================

export type CarrierEventType =
  | 'carrier.invited'           // Transporteur invite
  | 'carrier.registered'        // Transporteur inscrit
  | 'carrier.documents_uploaded' // Documents uploades
  | 'carrier.validated'         // Valide/Reference
  | 'carrier.premium_requested' // Demande premium
  | 'carrier.premium_granted'   // Premium accorde
  | 'carrier.blocked'           // Bloque
  | 'carrier.unblocked'         // Debloque
  | 'carrier.score_updated'     // Score mis a jour
  | 'carrier.dispatch_updated'  // Position dispatch mise a jour
  | 'document.uploaded'         // Document uploade
  | 'document.verified'         // Document verifie
  | 'document.rejected'         // Document rejete
  | 'document.expired'          // Document expire
  | 'alert.created'             // Alerte creee
  | 'alert.resolved'            // Alerte resolue
  | 'pricing.updated';          // Grille tarifaire mise a jour

export interface CarrierEvent {
  id: string;
  carrierId: string;
  type: CarrierEventType;

  // Acteur
  triggeredBy: {
    type: 'user' | 'system' | 'carrier' | 'cron';
    id?: string;
    name?: string;
  };

  // Donnees de l'evenement
  payload: Record<string, any>;

  // Metadonnees
  previousState?: Record<string, any>;
  newState?: Record<string, any>;

  createdAt: string;
}

// =============================================================================
// TYPES - CHAINE DE DISPATCH
// =============================================================================

export interface DispatchChainConfig {
  id: string;
  industrielId: string;
  name: string;

  // Criteres de tri
  sortCriteria: DispatchSortCriterion[];

  // Filtres
  filters: {
    minScore?: number;
    requiredCertifications?: string[];
    requiredOptions?: string[];
    maxDistance?: number;         // km
    excludeBlocked: boolean;
    premiumOnly?: boolean;
  };

  // Limites
  maxCarriersInChain: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchSortCriterion {
  field: 'score' | 'level' | 'responseTime' | 'price' | 'distance' | 'availability';
  order: 'asc' | 'desc';
  weight: number;               // Poids du critere (0-1)
}

export interface DispatchChainResult {
  orderId: string;
  industrielId: string;
  carriers: DispatchCarrierEntry[];
  totalEligible: number;
  generatedAt: string;
}

export interface DispatchCarrierEntry {
  rank: number;
  carrierId: string;
  carrierName: string;
  level: CarrierLevel;
  score: number;
  estimatedPrice?: number;
  estimatedResponseTime?: number;   // En heures
  distance?: number;                // km
  availability: 'available' | 'busy' | 'unknown';
  matchScore: number;               // Score de correspondance (0-100)
}

// =============================================================================
// TYPES - GRILLES TARIFAIRES
// =============================================================================

export type ShipmentType = 'ftl' | 'ltl' | 'express' | 'groupage';

export interface PricingGrid {
  id: string;
  carrierId: string;
  name: string;
  shipmentType: ShipmentType;

  // Validite
  validFrom: string;
  validUntil?: string;
  isActive: boolean;

  // Zones
  zones: PricingZone[];

  // Prix de base
  baseRates: PricingRate[];

  // Supplements
  supplements: PricingSupplement[];

  // Remises
  discounts: PricingDiscount[];

  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingZone {
  id: string;
  name: string;
  countries?: string[];
  postalCodes?: string[];         // Codes postaux ou prefixes
  regions?: string[];
}

export interface PricingRate {
  id: string;
  fromZone: string;
  toZone: string;

  // Tarifs FTL (par vehicule)
  ftlRates?: {
    van?: number;
    truck_3t5?: number;
    truck_7t5?: number;
    truck_12t?: number;
    truck_19t?: number;
    semi?: number;
  };

  // Tarifs LTL (par palette/kg)
  ltlRates?: {
    perPallet?: number;
    perKg?: number;
    perM3?: number;
    minCharge?: number;
  };

  // Tarifs express
  expressMultiplier?: number;     // Multiplicateur prix express

  transitDays: number;            // Jours de transit
}

export interface PricingSupplement {
  id: string;
  code: string;
  name: string;
  type: 'fixed' | 'percentage' | 'per_unit';
  amount: number;
  unit?: string;                  // 'palette', 'kg', etc.
  conditions?: string;
  isOptional: boolean;
}

export interface PricingDiscount {
  id: string;
  name: string;
  type: 'volume' | 'contract' | 'loyalty' | 'promotional';
  discountPercent: number;
  minVolume?: number;
  validFrom?: string;
  validUntil?: string;
}

// =============================================================================
// TYPES - OPTIONS TRANSPORTEUR
// =============================================================================

export interface CarrierOption {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: 'equipment' | 'service' | 'certification' | 'handling';
  isActive: boolean;

  // Tarification
  pricing?: {
    type: 'included' | 'fixed' | 'per_unit' | 'on_request';
    amount?: number;
    unit?: string;
  };
}

// Options standard
export const CARRIER_OPTIONS = {
  // Equipements
  ADR: { code: 'ADR', name: 'Transport matieres dangereuses', category: 'equipment' },
  HAYON: { code: 'HAYON', name: 'Hayon elevateur', category: 'equipment' },
  FRIGO: { code: 'FRIGO', name: 'Camion frigorifique', category: 'equipment' },
  BACHE: { code: 'BACHE', name: 'Bache coulissante', category: 'equipment' },
  CITERNE: { code: 'CITERNE', name: 'Citerne', category: 'equipment' },

  // Services
  EXPRESS: { code: 'EXPRESS', name: 'Livraison express', category: 'service' },
  WEEKEND: { code: 'WEEKEND', name: 'Livraison weekend', category: 'service' },
  GPS: { code: 'GPS', name: 'Tracking GPS temps reel', category: 'service' },
  ASSURANCE_PLUS: { code: 'ASSURANCE_PLUS', name: 'Assurance etendue', category: 'service' },

  // Manutention
  DECHARGE: { code: 'DECHARGE', name: 'Dechargement inclus', category: 'handling' },
  ETAGE: { code: 'ETAGE', name: 'Livraison a l\'etage', category: 'handling' },
  INSTALLATION: { code: 'INSTALLATION', name: 'Installation sur site', category: 'handling' },
} as const;

// =============================================================================
// TYPES - BLOCAGE
// =============================================================================

export interface BlockingEvent {
  id: string;
  carrierId: string;
  reason: BlockingReason;

  // Details
  description: string;
  triggeredBy: {
    type: 'user' | 'system' | 'cron';
    id?: string;
    name?: string;
  };

  // Documents concernes
  relatedDocuments?: string[];

  // Resolution
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  blockedAt: string;
  unblockedAt?: string;
}

// =============================================================================
// TYPES - IMPORT AFFRET.IA
// =============================================================================

export interface AffretImportRequest {
  affretCarrierId: string;
  industrielId: string;
  level?: CarrierLevel;
  dispatchOrder?: number;
  notes?: string;
}

export interface AffretImportResult {
  success: boolean;
  carrier?: ReferencedCarrier;
  error?: string;
  warnings?: string[];
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
// API FUNCTIONS - TRANSPORTEURS REFERENCES
// =============================================================================

export async function getReferencedCarriers(params?: {
  industrielId?: string;
  level?: CarrierLevel;
  status?: CarrierStatus;
  vigilanceStatus?: VigilanceStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  carriers: ReferencedCarrier[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.industrielId) query.append('industrielId', params.industrielId);
  if (params?.level) query.append('level', params.level);
  if (params?.status) query.append('status', params.status);
  if (params?.vigilanceStatus) query.append('vigilanceStatus', params.vigilanceStatus);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  return fetchAPI(`/carriers?${query}`);
}

export async function getCarrier(id: string): Promise<ReferencedCarrier> {
  return fetchAPI(`/carriers/${id}`);
}

export async function createCarrier(params: {
  companyName: string;
  siret?: string;
  vatNumber?: string;
  contact: ReferencedCarrier['contact'];
  level?: CarrierLevel;
  industrielId: string;
  options?: string[];
  notes?: string;
}): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI('/carriers', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateCarrier(
  id: string,
  params: Partial<{
    companyName: string;
    contact: Partial<ReferencedCarrier['contact']>;
    options: string[];
    dispatchOrder: number;
    notes: string;
  }>
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// API FUNCTIONS - NIVEAUX DE REFERENCEMENT
// =============================================================================

export async function upgradeToReferenced(
  carrierId: string,
  params?: { notes?: string }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/upgrade/referenced`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function requestPremium(
  carrierId: string,
  params: { reason: string; documents?: string[] }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/premium/request`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function grantPremium(
  carrierId: string,
  params?: { notes?: string }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/premium/grant`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function revokePremium(
  carrierId: string,
  params: { reason: string }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/premium/revoke`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// API FUNCTIONS - INVITATION
// =============================================================================

export async function inviteCarrier(params: {
  email: string;
  companyName: string;
  industrielId: string;
  message?: string;
  level?: CarrierLevel;
}): Promise<{
  invitation: { id: string; token: string; expiresAt: string };
  event: CarrierEvent;
}> {
  return fetchAPI('/carriers/invite', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function resendInvitation(
  invitationId: string
): Promise<{ success: boolean; event: CarrierEvent }> {
  return fetchAPI(`/carriers/invite/${invitationId}/resend`, {
    method: 'POST',
  });
}

export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean }> {
  return fetchAPI(`/carriers/invite/${invitationId}/cancel`, {
    method: 'POST',
  });
}

// =============================================================================
// API FUNCTIONS - BLOCAGE
// =============================================================================

export async function blockCarrier(
  carrierId: string,
  params: {
    reason: BlockingReason;
    description: string;
    until?: string;           // Date de fin de blocage
  }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/block`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function unblockCarrier(
  carrierId: string,
  params?: { notes?: string }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/unblock`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function getBlockingHistory(carrierId: string): Promise<{
  events: BlockingEvent[];
  currentBlock?: BlockingEvent;
}> {
  return fetchAPI(`/carriers/${carrierId}/blocking-history`);
}

// =============================================================================
// API FUNCTIONS - DOCUMENTS
// =============================================================================

/**
 * Obtenir une URL presignee S3 pour upload de document
 */
export async function getDocumentUploadUrl(
  carrierId: string,
  params: {
    fileName: string;
    contentType: string;
    documentType: CarrierDocumentType;
  }
): Promise<{
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  bucket: string;
}> {
  return fetchAPI(`/carriers/${carrierId}/documents/upload-url`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Confirmer l'upload et creer l'enregistrement document
 */
export async function confirmDocumentUpload(
  carrierId: string,
  params: {
    s3Key: string;
    documentType: CarrierDocumentType;
    fileName: string;
    expiresAt?: string;
    notes?: string;
  }
): Promise<{ document: CarrierDocument }> {
  return fetchAPI(`/carriers/${carrierId}/documents/confirm-upload`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Upload complet d'un document (presigned URL + upload S3 + confirmation)
 */
export async function uploadDocument(
  carrierId: string,
  params: {
    type: CarrierDocumentType;
    file: File;
    expiresAt?: string;
    notes?: string;
  }
): Promise<{ document: CarrierDocument; analyzed?: boolean }> {
  // 1. Obtenir URL presignee
  const { uploadUrl, s3Key } = await getDocumentUploadUrl(carrierId, {
    fileName: params.file.name,
    contentType: params.file.type || 'application/octet-stream',
    documentType: params.type,
  });

  // 2. Upload direct vers S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: params.file,
    headers: {
      'Content-Type': params.file.type || 'application/octet-stream',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Erreur upload S3: ${uploadResponse.status}`);
  }

  // 3. Confirmer l'upload
  const { document } = await confirmDocumentUpload(carrierId, {
    s3Key,
    documentType: params.type,
    fileName: params.file.name,
    expiresAt: params.expiresAt,
    notes: params.notes,
  });

  // 4. Lancer l'analyse OCR automatique (non-bloquant)
  let analyzed = false;
  try {
    await analyzeDocument(carrierId, document.id);
    analyzed = true;
  } catch (e) {
    console.warn('OCR analysis failed:', e);
  }

  return { document, analyzed };
}

/**
 * Analyser un document avec OCR (Textract) pour extraire les dates
 */
export async function analyzeDocument(
  carrierId: string,
  documentId: string
): Promise<{
  success: boolean;
  documentId: string;
  analysis: {
    extractedText: string;
    datesFound: Array<{
      raw: string;
      parsed: string;
      isValidityDate: boolean;
      context: string;
    }>;
    suggestedExpiryDate: string | null;
    confidence: 'high' | 'medium' | 'low' | 'none';
  };
  updated: boolean;
}> {
  return fetchAPI(`/carriers/${carrierId}/documents/${documentId}/analyze`, {
    method: 'POST',
  });
}

/**
 * Definir manuellement la date d'expiration d'un document
 */
export async function setDocumentExpiry(
  carrierId: string,
  documentId: string,
  expiryDate: string
): Promise<{
  success: boolean;
  documentId: string;
  expiryDate: string;
  vigilanceStatus: VigilanceStatus;
}> {
  return fetchAPI(`/carriers/${carrierId}/documents/${documentId}/set-expiry`, {
    method: 'POST',
    body: JSON.stringify({ expiryDate }),
  });
}

/**
 * Obtenir un document specifique avec URL de telechargement
 */
export async function getDocument(
  carrierId: string,
  documentId: string
): Promise<{ document: CarrierDocument }> {
  return fetchAPI(`/carriers/${carrierId}/documents/${documentId}`);
}

export async function getDocuments(carrierId: string): Promise<{
  documents: CarrierDocument[];
  expiringSoon: CarrierDocument[];    // Documents expirant dans 30 jours
  expired: CarrierDocument[];
}> {
  return fetchAPI(`/carriers/${carrierId}/documents`);
}

export async function verifyDocument(
  carrierId: string,
  documentId: string,
  params: { approved: boolean; rejectionReason?: string }
): Promise<{ document: CarrierDocument; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/documents/${documentId}/verify`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteDocument(
  carrierId: string,
  documentId: string
): Promise<{ success: boolean; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/documents/${documentId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// API FUNCTIONS - ALERTES VIGILANCE
// =============================================================================

export async function getAlerts(params?: {
  carrierId?: string;
  industrielId?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  isResolved?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  alerts: VigilanceAlert[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: {
    critical: number;
    warning: number;
    info: number;
    unresolved: number;
  };
}> {
  const query = new URLSearchParams();
  if (params?.carrierId) query.append('carrierId', params.carrierId);
  if (params?.industrielId) query.append('industrielId', params.industrielId);
  if (params?.type) query.append('type', params.type);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.isResolved !== undefined) query.append('isResolved', params.isResolved.toString());
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/vigilance/alerts?${query}`);
}

export async function resolveAlert(
  alertId: string,
  params?: { notes?: string }
): Promise<{ alert: VigilanceAlert; event: CarrierEvent }> {
  return fetchAPI(`/vigilance/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function snoozeAlert(
  alertId: string,
  params: { snoozeDays: number; reason?: string }
): Promise<{ alert: VigilanceAlert }> {
  return fetchAPI(`/vigilance/alerts/${alertId}/snooze`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Generer manuellement les alertes d'expiration (normalement en cron)
export async function triggerExpirationAlerts(
  industrielId?: string
): Promise<{ alertsCreated: number; alerts: VigilanceAlert[] }> {
  return fetchAPI('/vigilance/trigger-expiration-check', {
    method: 'POST',
    body: JSON.stringify({ industrielId }),
  });
}

// =============================================================================
// API FUNCTIONS - CHAINE DE DISPATCH
// =============================================================================

export async function getDispatchChain(
  industrielId: string,
  params?: {
    orderId?: string;
    requiredOptions?: string[];
    minScore?: number;
    limit?: number;
  }
): Promise<DispatchChainResult> {
  const query = new URLSearchParams();
  query.append('industrielId', industrielId);
  if (params?.orderId) query.append('orderId', params.orderId);
  if (params?.requiredOptions) query.append('requiredOptions', params.requiredOptions.join(','));
  if (params?.minScore) query.append('minScore', params.minScore.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/dispatch/chain?${query}`);
}

export async function getDispatchConfig(industrielId: string): Promise<DispatchChainConfig> {
  return fetchAPI(`/dispatch/config/${industrielId}`);
}

export async function updateDispatchConfig(
  industrielId: string,
  params: Partial<Omit<DispatchChainConfig, 'id' | 'industrielId' | 'createdAt' | 'updatedAt'>>
): Promise<{ config: DispatchChainConfig }> {
  return fetchAPI(`/dispatch/config/${industrielId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function updateCarrierDispatchOrder(
  carrierId: string,
  params: { dispatchOrder: number; priority?: 'high' | 'medium' | 'low' }
): Promise<{ carrier: ReferencedCarrier; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/dispatch-order`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function reorderDispatchChain(
  industrielId: string,
  params: { carrierIds: string[] }    // IDs dans le nouvel ordre
): Promise<{ carriers: ReferencedCarrier[]; events: CarrierEvent[] }> {
  return fetchAPI(`/dispatch/reorder/${industrielId}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// API FUNCTIONS - GRILLES TARIFAIRES
// =============================================================================

export async function getPricingGrids(carrierId: string): Promise<{
  grids: PricingGrid[];
  activeGrids: PricingGrid[];
}> {
  return fetchAPI(`/carriers/${carrierId}/pricing`);
}

export async function createPricingGrid(
  carrierId: string,
  params: Omit<PricingGrid, 'id' | 'carrierId' | 'createdAt' | 'updatedAt'>
): Promise<{ grid: PricingGrid; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/pricing`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updatePricingGrid(
  carrierId: string,
  gridId: string,
  params: Partial<Omit<PricingGrid, 'id' | 'carrierId' | 'createdAt' | 'updatedAt'>>
): Promise<{ grid: PricingGrid; event: CarrierEvent }> {
  return fetchAPI(`/carriers/${carrierId}/pricing/${gridId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deletePricingGrid(
  carrierId: string,
  gridId: string
): Promise<{ success: boolean }> {
  return fetchAPI(`/carriers/${carrierId}/pricing/${gridId}`, {
    method: 'DELETE',
  });
}

export async function calculatePrice(params: {
  carrierId: string;
  shipmentType: ShipmentType;
  fromZone: string;
  toZone: string;
  weight?: number;
  volume?: number;
  pallets?: number;
  options?: string[];
}): Promise<{
  basePrice: number;
  supplements: Array<{ code: string; name: string; amount: number }>;
  discounts: Array<{ name: string; amount: number }>;
  totalPrice: number;
  currency: string;
  transitDays: number;
  gridId: string;
}> {
  return fetchAPI('/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// API FUNCTIONS - IMPORT AFFRET.IA
// =============================================================================

export async function importFromAffret(
  params: AffretImportRequest
): Promise<AffretImportResult> {
  return fetchAPI('/carriers/import/affret', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function bulkImportFromAffret(
  params: {
    affretCarrierIds: string[];
    industrielId: string;
    level?: CarrierLevel;
  }
): Promise<{
  imported: ReferencedCarrier[];
  failed: Array<{ affretCarrierId: string; error: string }>;
  events: CarrierEvent[];
}> {
  return fetchAPI('/carriers/import/affret/bulk', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function syncWithAffret(carrierId: string): Promise<{
  carrier: ReferencedCarrier;
  updated: boolean;
  changes: string[];
}> {
  return fetchAPI(`/carriers/${carrierId}/sync-affret`, {
    method: 'POST',
  });
}

// =============================================================================
// API FUNCTIONS - EVENEMENTS
// =============================================================================

export async function getEvents(params?: {
  carrierId?: string;
  industrielId?: string;
  type?: CarrierEventType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{
  events: CarrierEvent[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.carrierId) query.append('carrierId', params.carrierId);
  if (params?.industrielId) query.append('industrielId', params.industrielId);
  if (params?.type) query.append('type', params.type);
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/events?${query}`);
}

// =============================================================================
// API FUNCTIONS - STATISTIQUES
// =============================================================================

export async function getCarrierStats(industrielId: string): Promise<{
  totalCarriers: number;
  byLevel: { guest: number; referenced: number; premium: number };
  byStatus: Record<CarrierStatus, number>;
  byVigilance: { compliant: number; warning: number; blocked: number; pending: number };
  averageScore: number;
  topCarriers: ReferencedCarrier[];
  alertsSummary: { critical: number; warning: number; info: number };
}> {
  return fetchAPI(`/stats/carriers/${industrielId}`);
}

export async function getVigilanceStats(industrielId: string): Promise<{
  documentsExpiringSoon: number;
  documentsExpired: number;
  carriersAtRisk: number;
  carriersBlocked: number;
  alertsByType: Record<AlertType, number>;
  complianceRate: number;           // % transporteurs conformes
}> {
  return fetchAPI(`/stats/vigilance/${industrielId}`);
}

// =============================================================================
// API FUNCTIONS - PERFORMANCE TRANSPORTEURS
// =============================================================================

export interface CarrierPerformanceMetrics {
  onTimeRate: number;              // % livraisons a l'heure
  damageRate: number;              // % dommages
  totalDeliveries: number;
  avgCommunicationRating: number | null;
  incidentCount: number;
  lastUpdated: string;
}

export interface CarrierPerformanceRecord {
  orderId: string;
  deliveryType: 'on_time' | 'late' | 'early';
  delayMinutes: number;
  wasOnTime: boolean;
  damageReported: boolean;
  damageDescription?: string;
  communicationRating: number | null;
  incidentType: 'none' | 'delay' | 'damage' | 'no_show' | 'other';
  incidentDescription?: string;
  deliveredAt: string;
  expectedAt: string | null;
  recordedAt: string;
  source: string;
}

/**
 * Obtenir les metriques de performance d'un transporteur
 */
export async function getCarrierPerformance(
  carrierId: string,
  params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  success: boolean;
  carrierId: string;
  metrics: CarrierPerformanceMetrics;
  score: number;
  scoreDetails: Record<string, number>;
  records: CarrierPerformanceRecord[];
  count: number;
}> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  return fetchAPI(`/carriers/${carrierId}/performance${queryString ? `?${queryString}` : ''}`);
}

/**
 * Enregistrer une performance de livraison (appele par le tracking)
 */
export async function recordCarrierPerformance(
  carrierId: string,
  params: {
    orderId: string;
    deliveryType: 'on_time' | 'late' | 'early';
    delayMinutes?: number;
    damageReported?: boolean;
    damageDescription?: string;
    communicationRating?: number;
    incidentType?: 'none' | 'delay' | 'damage' | 'no_show' | 'other';
    incidentDescription?: string;
    deliveredAt?: string;
    expectedAt?: string;
  }
): Promise<{
  success: boolean;
  carrierId: string;
  orderId: string;
  performanceMetrics: CarrierPerformanceMetrics;
}> {
  return fetchAPI(`/carriers/${carrierId}/performance`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getLevelLabel(level: CarrierLevel): string {
  const labels: Record<CarrierLevel, string> = {
    guest: 'Guest (Niveau 2)',
    referenced: 'Reference (Niveau 1)',
    premium: 'Premium (Niveau 1+)',
  };
  return labels[level] || level;
}

export function getLevelColor(level: CarrierLevel): string {
  const colors: Record<CarrierLevel, string> = {
    guest: 'gray',
    referenced: 'blue',
    premium: 'gold',
  };
  return colors[level] || 'gray';
}

export function getStatusLabel(status: CarrierStatus): string {
  const labels: Record<CarrierStatus, string> = {
    pending_invitation: 'En attente d\'invitation',
    invited: 'Invite',
    pending_validation: 'Validation en cours',
    active: 'Actif',
    blocked: 'Bloque',
    suspended: 'Suspendu',
    churned: 'Desactive',
  };
  return labels[status] || status;
}

export function getStatusColor(status: CarrierStatus): string {
  const colors: Record<CarrierStatus, string> = {
    pending_invitation: 'gray',
    invited: 'blue',
    pending_validation: 'orange',
    active: 'green',
    blocked: 'red',
    suspended: 'yellow',
    churned: 'gray',
  };
  return colors[status] || 'gray';
}

export function getVigilanceStatusLabel(status: VigilanceStatus): string {
  const labels: Record<VigilanceStatus, string> = {
    compliant: 'Conforme',
    warning: 'Alerte',
    blocked: 'Bloque',
    pending: 'En attente',
  };
  return labels[status] || status;
}

export function getVigilanceStatusColor(status: VigilanceStatus): string {
  const colors: Record<VigilanceStatus, string> = {
    compliant: 'green',
    warning: 'orange',
    blocked: 'red',
    pending: 'gray',
  };
  return colors[status] || 'gray';
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    info: 'blue',
    warning: 'orange',
    critical: 'red',
  };
  return colors[severity] || 'gray';
}

export function getBlockingReasonLabel(reason: BlockingReason): string {
  const labels: Record<BlockingReason, string> = {
    documents_expired: 'Documents expires',
    insurance_lapsed: 'Assurance expiree',
    score_below_threshold: 'Score insuffisant',
    unpaid_invoices: 'Factures impayees',
    compliance_violation: 'Non-conformite',
    manual_block: 'Blocage manuel',
  };
  return labels[reason] || reason;
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryAlertLevel(daysUntilExpiry: number): AlertSeverity | null {
  if (daysUntilExpiry <= 0) return 'critical';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 15) return 'warning';
  if (daysUntilExpiry <= 30) return 'info';
  return null;
}

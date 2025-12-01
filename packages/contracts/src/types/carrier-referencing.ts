/**
 * Types pour le système de Référencement Transporteur
 * Niveaux: Guest (N2), Referenced (N1), Premium (N1+)
 * Alertes vigilance: J-30, J-15, J-7
 */

// ========== NIVEAUX DE RÉFÉRENCEMENT ==========

export type CarrierLevel = 'guest' | 'referenced' | 'premium';

export type CarrierStatus =
  | 'pending_invitation' // Invitation en cours
  | 'invited'            // Invité, en attente d'inscription
  | 'pending_validation' // Documents en cours de validation
  | 'active'             // Actif et validé
  | 'blocked'            // Bloqué
  | 'suspended'          // Suspendu temporairement
  | 'churned';           // Désactivé/parti

export type CarrierVigilanceStatus = 'ok' | 'warning' | 'critical' | 'blocked';

// ========== TRANSPORTEUR RÉFÉRENCÉ ==========

export interface ReferencedCarrier {
  id: string;
  organizationId: string;

  // Informations de base
  name: string;
  siret?: string;
  vatNumber?: string;
  logo?: string;

  // Contact
  contact: CarrierContact;

  // Niveau et statut
  level: CarrierLevel;
  status: CarrierStatus;
  vigilanceStatus: CarrierVigilanceStatus;

  // Documents
  documents: CarrierDocument[];
  documentsValidUntil?: string; // Date d'expiration la plus proche

  // Performance
  score: number; // 0-100
  stats: CarrierStats;

  // Affret.IA
  affretId?: string;
  importedFromAffret?: boolean;
  affretSyncedAt?: string;

  // Premium
  premiumSince?: string;
  premiumRequestedAt?: string;

  // Blocage
  blockedAt?: string;
  blockedReason?: string;
  blockedBy?: string;
  unblockScheduledAt?: string;

  // Dates
  invitedAt?: string;
  registeredAt?: string;
  validatedAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierContact {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface CarrierStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageScore: number;
  onTimeRate: number; // %
  acceptanceRate: number; // %
  averageResponseTime: number; // Minutes
  lastOrderAt?: string;
}

// ========== DOCUMENTS TRANSPORTEUR ==========

export type CarrierDocumentType =
  | 'kbis'              // Extrait Kbis
  | 'licence_transport' // Licence de transport
  | 'insurance_rc'      // Assurance RC
  | 'insurance_goods'   // Assurance marchandises
  | 'adr_certificate'   // Certificat ADR
  | 'haccp_certificate' // Certificat HACCP
  | 'iso_certificate'   // Certification ISO
  | 'other';            // Autre

export type DocumentVerificationStatus =
  | 'pending'   // En attente de vérification
  | 'verified'  // Vérifié et valide
  | 'rejected'  // Rejeté
  | 'expired';  // Expiré

export interface CarrierDocument {
  id: string;
  carrierId: string;
  type: CarrierDocumentType;
  name: string;

  // Fichier
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;

  // Validité
  issuedAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;

  // Vérification
  status: DocumentVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;

  // Alertes envoyées
  alertsSent: {
    j30?: string; // Date d'envoi alerte J-30
    j15?: string; // Date d'envoi alerte J-15
    j7?: string;  // Date d'envoi alerte J-7
  };

  // Dates
  uploadedAt: string;
  updatedAt: string;
}

// Documents obligatoires par niveau
export const REQUIRED_DOCUMENTS: Record<CarrierLevel, CarrierDocumentType[]> = {
  guest: [],
  referenced: ['kbis', 'licence_transport', 'insurance_rc'],
  premium: ['kbis', 'licence_transport', 'insurance_rc', 'insurance_goods'],
};

// ========== ALERTES VIGILANCE ==========

export type VigilanceAlertType =
  | 'document_expiring_30' // Document expire dans 30 jours
  | 'document_expiring_15' // Document expire dans 15 jours
  | 'document_expiring_7'  // Document expire dans 7 jours
  | 'document_expired'     // Document expiré
  | 'score_dropped'        // Score en baisse
  | 'inactivity'           // Inactivité prolongée
  | 'compliance_issue';    // Problème de conformité

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'ignored';

export interface CarrierVigilanceAlert {
  id: string;
  carrierId: string;
  carrierName: string;
  organizationId: string;

  type: VigilanceAlertType;
  severity: AlertSeverity;
  status: AlertStatus;

  // Détails
  title: string;
  message: string;
  documentId?: string;
  documentType?: CarrierDocumentType;

  // Dates
  expirationDate?: string;
  daysUntilExpiry?: number;

  // Actions
  actionRequired: string;
  actionUrl?: string;

  // Auto-blocage
  autoBlockEnabled: boolean;
  autoBlockAt?: string; // Date de blocage automatique si non résolu

  // Notifications envoyées
  notificationsSent: AlertNotification[];

  // Résolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;

  // Dates
  createdAt: string;
  updatedAt: string;
}

export interface AlertNotification {
  channel: 'email' | 'sms' | 'push' | 'in_app';
  sentAt: string;
  recipient: string;
}

// ========== GRILLES TARIFAIRES ==========

export type ShipmentType = 'FTL' | 'LTL';

export interface PricingGrid {
  id: string;
  carrierId: string;
  organizationId: string;

  name: string;
  shipmentType: ShipmentType;
  isDefault: boolean;

  // Validité
  validFrom: string;
  validUntil?: string;
  isActive: boolean;

  // Tarifs de base par zone
  baseRates: ZoneRate[];

  // Suppléments
  supplements: PricingSupplement[];

  // Remises
  discounts: PricingDiscount[];

  // Conditions
  conditions?: string;
  minimumOrder?: number;
  currency: string;

  // Import Affret.IA
  importedFromAffret?: boolean;
  affretSyncedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ZoneRate {
  id: string;
  originZone: string;    // Ex: "FR-75", "FR-IDF", "FR"
  destinationZone: string;

  // Tarification
  pricePerKm?: number;
  pricePerKg?: number;
  flatRate?: number;
  minimumPrice: number;

  // Délais
  transitDays: number;
}

export interface PricingSupplement {
  id: string;
  code: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  conditions?: string;

  // Types de suppléments courants
  // 'ADR' - Matières dangereuses
  // 'HAYON' - Hayon élévateur
  // 'EXPRESS' - Livraison express
  // 'FRIGO' - Température dirigée
  // 'WEEKEND' - Livraison weekend
  // 'NUIT' - Livraison de nuit
}

export interface PricingDiscount {
  id: string;
  name: string;
  type: 'volume' | 'commitment' | 'loyalty';

  // Conditions
  minVolume?: number;        // Volume minimum (palette/kg)
  minCommitment?: number;    // Engagement minimum (mois)
  minOrders?: number;        // Nombre minimum de commandes

  // Réduction
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

// ========== ÉVÉNEMENTS TRANSPORTEUR ==========

export type CarrierEventType =
  // Cycle de vie
  | 'carrier.invited'
  | 'carrier.registered'
  | 'carrier.documents_uploaded'
  | 'carrier.validated'
  | 'carrier.premium_requested'
  | 'carrier.premium_granted'
  | 'carrier.blocked'
  | 'carrier.unblocked'
  | 'carrier.score_updated'
  // Documents
  | 'document.uploaded'
  | 'document.verified'
  | 'document.rejected'
  | 'document.expired'
  // Alertes
  | 'alert.created'
  | 'alert.resolved'
  // Tarification
  | 'pricing.updated'
  | 'pricing.imported';

export interface CarrierEvent {
  id: string;
  carrierId: string;
  organizationId: string;

  type: CarrierEventType;
  title: string;
  description: string;

  // Contexte
  metadata?: Record<string, any>;
  documentId?: string;
  alertId?: string;
  pricingGridId?: string;

  // Utilisateur
  performedBy?: {
    userId: string;
    userName: string;
  };

  createdAt: string;
}

// ========== HISTORIQUE BLOCAGE ==========

export interface BlockingHistory {
  id: string;
  carrierId: string;
  organizationId: string;

  action: 'blocked' | 'unblocked';
  reason: string;

  // Auto-blocage
  isAutomatic: boolean;
  alertId?: string;

  // Utilisateur
  performedBy?: {
    userId: string;
    userName: string;
  };

  createdAt: string;
}

// ========== REQUÊTES ==========

export interface InviteCarrierRequest {
  email: string;
  companyName: string;
  contactName?: string;
  phone?: string;
  level?: CarrierLevel;
  message?: string;
}

export interface UpdateCarrierRequest {
  name?: string;
  siret?: string;
  vatNumber?: string;
  contact?: Partial<CarrierContact>;
  level?: CarrierLevel;
}

export interface BlockCarrierRequest {
  carrierId: string;
  reason: string;
  duration?: number; // Jours, si temporaire
  notifyCarrier?: boolean;
}

export interface UploadCarrierDocumentRequest {
  carrierId: string;
  type: CarrierDocumentType;
  file: File;
  expiresAt?: string;
}

export interface VerifyCarrierDocumentRequest {
  documentId: string;
  isVerified: boolean;
  rejectionReason?: string;
}

export interface CreatePricingGridRequest {
  carrierId: string;
  name: string;
  shipmentType: ShipmentType;
  baseRates: Omit<ZoneRate, 'id'>[];
  supplements?: Omit<PricingSupplement, 'id'>[];
  discounts?: Omit<PricingDiscount, 'id'>[];
  validFrom: string;
  validUntil?: string;
  currency?: string;
}

export interface ImportFromAffretRequest {
  affretCarrierId: string;
  level?: CarrierLevel;
  importPricing?: boolean;
}

// ========== FILTRES ==========

export interface ReferencedCarrierFilters {
  search?: string;
  level?: CarrierLevel;
  status?: CarrierStatus;
  vigilanceStatus?: CarrierVigilanceStatus;
  hasExpiredDocuments?: boolean;
  importedFromAffret?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'score' | 'createdAt' | 'lastActivityAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AlertFilters {
  carrierId?: string;
  type?: VigilanceAlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface EventFilters {
  carrierId?: string;
  type?: CarrierEventType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ========== STATISTIQUES ==========

export interface CarrierReferencingStats {
  total: number;
  byLevel: Record<CarrierLevel, number>;
  byStatus: Record<CarrierStatus, number>;
  byVigilance: Record<CarrierVigilanceStatus, number>;

  // Documents
  documentsExpiringSoon: number;
  documentsExpired: number;

  // Activité
  activeThisMonth: number;
  newThisMonth: number;
  churnedThisMonth: number;

  // Performance
  averageScore: number;
  averageAcceptanceRate: number;
}

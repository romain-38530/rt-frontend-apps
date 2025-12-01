/**
 * Types pour l'archivage légal 10 ans
 * Conformité réglementaire transport
 */

// ========== CONSTANTES ==========

export const LEGAL_RETENTION_YEARS = 10;
export const ARCHIVE_CHECKSUM_ALGORITHM = 'sha256';

// ========== STATUTS ==========

export type ArchiveStatus =
  | 'active'           // Archive active et accessible
  | 'pending_deletion' // En attente de suppression (fin rétention)
  | 'deleted';         // Supprimée

export type ArchivedDocumentType =
  | 'cmr'      // Lettre de voiture CMR
  | 'bl'       // Bon de livraison
  | 'pod'      // Proof of delivery
  | 'invoice'  // Facture
  | 'customs'  // Documents douaniers
  | 'other';   // Autres documents

// ========== ARCHIVE ==========

export interface LegalArchive {
  id: string;
  orderId: string;
  organizationId: string;

  status: ArchiveStatus;

  // Rétention
  retentionYears: number; // Par défaut: 10
  archivedAt: string;
  expiresAt: string; // Date de fin de rétention

  // Documents archivés
  documents: ArchivedDocument[];
  totalDocuments: number;
  totalSize: number; // En octets

  // Intégrité
  checksum: string; // Hash SHA-256 de l'ensemble
  checksumVerifiedAt?: string;
  integrityValid: boolean;

  // Métadonnées commande
  orderMetadata: OrderArchiveMetadata;

  // Accès
  accessLog: ArchiveAccessLog[];
  lastAccessedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ArchivedDocument {
  id: string;
  archiveId: string;
  type: ArchivedDocumentType;
  name: string;

  // Fichier
  archiveUrl: string;  // URL dans le stockage d'archive
  originalUrl: string; // URL originale (peut être supprimée)
  fileSize: number;
  mimeType: string;

  // Intégrité
  checksum: string;
  originalChecksum: string;
  checksumMatch: boolean;

  // Métadonnées
  originalUploadedAt: string;
  archivedAt: string;
  metadata?: Record<string, any>;
}

export interface OrderArchiveMetadata {
  orderNumber: string;
  orderDate: string;

  // Parties
  shipper: {
    name: string;
    siret?: string;
    address: string;
  };
  carrier: {
    name: string;
    siret?: string;
    address: string;
  };
  recipient: {
    name: string;
    address: string;
  };

  // Transport
  origin: {
    address: string;
    city: string;
    country: string;
  };
  destination: {
    address: string;
    city: string;
    country: string;
  };

  // Marchandise
  goods: {
    description: string;
    weight: number;
    packages: number;
  };

  // Dates
  pickupDate?: string;
  deliveryDate?: string;

  // Montants
  totalAmount?: number;
  currency?: string;
}

// ========== LOG D'ACCÈS ==========

export interface ArchiveAccessLog {
  id: string;
  archiveId: string;

  action: 'view' | 'download' | 'verify' | 'export';

  // Utilisateur
  userId: string;
  userName: string;
  userEmail: string;

  // Contexte
  ipAddress?: string;
  userAgent?: string;
  reason?: string;

  timestamp: string;
}

// ========== VÉRIFICATION INTÉGRITÉ ==========

export interface IntegrityCheckResult {
  archiveId: string;
  checkedAt: string;

  isValid: boolean;

  // Résultats par document
  documentResults: Array<{
    documentId: string;
    documentName: string;
    expectedChecksum: string;
    actualChecksum: string;
    isValid: boolean;
  }>;

  // Global
  overallChecksum: string;
  expectedOverallChecksum: string;

  // Problèmes détectés
  issues: Array<{
    type: 'checksum_mismatch' | 'file_missing' | 'file_corrupted';
    documentId: string;
    message: string;
  }>;
}

// ========== EXPORT ==========

export type ExportFormat = 'zip' | 'pdf';

export interface ArchiveExportRequest {
  archiveId: string;
  format: ExportFormat;
  includeMetadata: boolean;
  includeAccessLog: boolean;
  reason?: string;
}

export interface ArchiveExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: ExportFormat;
  documentsCount: number;
}

// ========== REQUÊTES ==========

export interface ArchiveOrderRequest {
  orderId: string;
  documentIds?: string[]; // Si non spécifié, archive tous les documents
  retentionYears?: number; // Par défaut: 10
}

export interface SearchArchivesRequest {
  search?: string;
  orderNumber?: string;
  shipperName?: string;
  carrierName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: ArchiveStatus;
  page?: number;
  limit?: number;
}

export interface ArchiveSearchResult {
  archives: LegalArchive[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== STATISTIQUES ==========

export interface ArchiveStats {
  totalArchives: number;
  totalSize: number; // En octets
  totalDocuments: number;

  // Par statut
  byStatus: Record<ArchiveStatus, number>;

  // Par année
  byYear: Array<{
    year: number;
    count: number;
    size: number;
  }>;

  // Expirations
  expiringThisYear: number;
  expiringNextYear: number;

  // Intégrité
  lastGlobalVerificationAt?: string;
  invalidArchives: number;

  // Accès
  totalAccesses: number;
  accessesThisMonth: number;
}

// ========== RÉTENTION ==========

export interface RetentionPolicy {
  id: string;
  organizationId: string;

  name: string;
  description?: string;

  // Durée
  retentionYears: number;

  // Application
  applyTo: {
    documentTypes: ArchivedDocumentType[];
    orderTypes?: string[];
  };

  // Actions automatiques
  autoArchive: boolean; // Archiver automatiquement à la clôture commande
  autoDelete: boolean;  // Supprimer automatiquement après rétention

  // Notifications
  notifyBeforeExpiry: boolean;
  notifyDaysBefore: number[];

  isDefault: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

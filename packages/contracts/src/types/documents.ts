/**
 * Types pour le système de gestion documentaire et OCR
 */

// ========== TYPES DE DOCUMENTS ==========

export type DocumentType =
  | 'cmr' // Lettre de voiture
  | 'invoice' // Facture
  | 'delivery_note' // Bon de livraison
  | 'packing_list' // Liste de colisage
  | 'pod' // Proof of delivery
  | 'customs' // Déclaration douanière
  | 'insurance' // Assurance
  | 'contract' // Contrat
  | 'other'; // Autre

export type DocumentStatus =
  | 'pending' // En attente
  | 'uploading' // Upload en cours
  | 'uploaded' // Uploadé
  | 'processing' // Traitement OCR en cours
  | 'processed' // Traitement terminé
  | 'failed' // Échec
  | 'archived'; // Archivé

export type OCRStatus =
  | 'pending' // En attente
  | 'processing' // En cours
  | 'completed' // Terminé
  | 'failed'; // Échec

// ========== INTERFACES PRINCIPALES ==========

export interface Document {
  id: string;
  orderId: string;
  type: DocumentType;
  status: DocumentStatus;
  name: string;
  originalName: string;
  fileSize: number; // En octets
  mimeType: string;
  extension: string;
  uploadedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  uploadedAt: string; // ISO date
  url: string; // URL S3
  thumbnailUrl?: string; // URL de la miniature
  ocrResult?: OCRResult;
  metadata?: DocumentMetadata;
  tags?: string[];
  notes?: string;
  isRequired?: boolean;
  isVerified?: boolean;
  verifiedBy?: {
    userId: string;
    userName: string;
    verifiedAt: string;
  };
  expiresAt?: string; // Date d'expiration si applicable
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  width?: number; // Pour images
  height?: number; // Pour images
  pages?: number; // Pour PDFs
  version?: string; // Version du document
  language?: string; // Langue détectée
  confidence?: number; // Score de confiance OCR (0-100)
  [key: string]: any; // Métadonnées personnalisées
}

// ========== OCR ==========

export interface OCRResult {
  id: string;
  documentId: string;
  status: OCRStatus;
  processedAt?: string;
  confidence: number; // Score de confiance global (0-100)
  text: string; // Texte brut extrait
  structuredData?: OCRStructuredData;
  blocks?: OCRBlock[];
  lines?: OCRLine[];
  words?: OCRWord[];
  detectedLanguages?: string[];
  processingTime?: number; // En millisecondes
  error?: string;
}

export interface OCRStructuredData {
  // Données spécifiques selon le type de document
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  currency?: string;
  supplierName?: string;
  supplierAddress?: string;
  customerName?: string;
  customerAddress?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  // CMR spécifique
  cmrNumber?: string;
  carrierName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  goodsDescription?: string;
  weight?: number;
  // Autres champs personnalisés
  [key: string]: any;
}

export interface OCRBlock {
  id: string;
  blockType: 'text' | 'table' | 'image' | 'title' | 'paragraph';
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  page?: number;
}

export interface OCRLine {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
  page?: number;
}

export interface OCRWord {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ========== REQUÊTES & RÉPONSES ==========

export interface UploadDocumentRequest {
  orderId: string;
  type: DocumentType;
  file: File;
  tags?: string[];
  notes?: string;
  isRequired?: boolean;
  performOCR?: boolean; // Lancer l'OCR automatiquement
}

export interface UploadDocumentResponse {
  document: Document;
  uploadUrl?: string; // Pre-signed URL pour upload direct S3
}

export interface DocumentFilters {
  orderId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  isVerified?: boolean;
  hasOCR?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'name' | 'type' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedDocuments {
  data: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TriggerOCRRequest {
  documentId: string;
  language?: string; // Langue du document
  detectTables?: boolean; // Détecter les tableaux
  extractStructuredData?: boolean; // Extraire les données structurées
}

export interface VerifyDocumentRequest {
  documentId: string;
  isVerified: boolean;
  notes?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  totalSize: number; // En octets
  averageOCRConfidence?: number;
  documentsWithOCR: number;
  verifiedDocuments: number;
  requiredDocuments: {
    total: number;
    uploaded: number;
    missing: number;
  };
}

// ========== TEMPLATES DE DOCUMENTS ==========

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  isRequired: boolean;
  orderStatuses: string[]; // Statuts de commande où ce document est requis
  autoOCR: boolean; // OCR automatique
  fields: DocumentTemplateField[];
  validationRules?: DocumentValidationRule[];
}

export interface DocumentTemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  ocrField?: string; // Champ OCR correspondant
  options?: string[]; // Pour type 'select'
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface DocumentValidationRule {
  field: string;
  rule: 'required' | 'format' | 'range' | 'custom';
  params?: any;
  message: string;
}

// ========== EXPORT ==========

export interface BulkExportRequest {
  documentIds: string[];
  format: 'zip' | 'pdf'; // ZIP de fichiers ou PDF combiné
  includeMetadata?: boolean;
  includeOCR?: boolean;
}

export interface BulkExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  documentsCount: number;
}

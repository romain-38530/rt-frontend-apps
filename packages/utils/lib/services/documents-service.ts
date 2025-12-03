/**
 * Service API pour la gestion documentaire et OCR
 * Gère upload, download, OCR, vérification
 */

import { createApiClient } from '../api-client';
import type {
  Document,
  PaginatedDocuments,
  UploadDocumentRequest,
  UploadDocumentResponse,
  DocumentFilters,
  TriggerOCRRequest,
  OCRResult,
  VerifyDocumentRequest,
  DocumentStats,
  DocumentTemplate,
  BulkExportRequest,
  BulkExportResponse,
  DocumentType,
  DocumentStatus,
} from '@rt/contracts';

// Client API pour les documents
const documentsApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_DOCUMENTS_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1',
  timeout: 60000, // 60s pour les uploads
  retries: 3,
});

export class DocumentsService {
  // ========== CRUD DOCUMENTS ==========

  /**
   * Récupérer tous les documents avec filtres
   */
  static async getDocuments(filters?: DocumentFilters): Promise<PaginatedDocuments> {
    return await documentsApi.get<PaginatedDocuments>('/documents', filters);
  }

  /**
   * Récupérer un document par ID
   */
  static async getDocumentById(documentId: string): Promise<Document> {
    return await documentsApi.get<Document>(`/documents/${documentId}`);
  }

  /**
   * Récupérer les documents d'une commande
   */
  static async getDocumentsByOrderId(orderId: string): Promise<Document[]> {
    return await documentsApi.get<Document[]>(`/documents/orders/${orderId}`);
  }

  /**
   * Upload un document
   * @param request Requête d'upload avec file
   * @returns Document créé
   */
  static async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('orderId', request.orderId);
    formData.append('type', request.type);

    if (request.tags) {
      formData.append('tags', JSON.stringify(request.tags));
    }
    if (request.notes) {
      formData.append('notes', request.notes);
    }
    if (request.isRequired !== undefined) {
      formData.append('isRequired', String(request.isRequired));
    }
    if (request.performOCR !== undefined) {
      formData.append('performOCR', String(request.performOCR));
    }

    return await documentsApi.post<Document>('/documents/upload', formData);
  }

  /**
   * Upload multiple documents
   */
  static async uploadMultipleDocuments(
    orderId: string,
    files: Array<{ file: File; type: DocumentType; performOCR?: boolean }>
  ): Promise<Document[]> {
    const uploads = files.map((item) =>
      this.uploadDocument({
        orderId,
        type: item.type,
        file: item.file,
        performOCR: item.performOCR,
      })
    );

    return await Promise.all(uploads);
  }

  /**
   * Mettre à jour un document
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<Pick<Document, 'type' | 'tags' | 'notes' | 'isRequired'>>
  ): Promise<Document> {
    return await documentsApi.put<Document>(`/documents/${documentId}`, updates);
  }

  /**
   * Supprimer un document
   */
  static async deleteDocument(documentId: string): Promise<void> {
    return await documentsApi.delete(`/documents/${documentId}`);
  }

  /**
   * Archiver un document
   */
  static async archiveDocument(documentId: string): Promise<Document> {
    return await documentsApi.post<Document>(`/documents/${documentId}/archive`);
  }

  // ========== DOWNLOAD ==========

  /**
   * Télécharger un document
   * @returns URL de téléchargement (pre-signed S3 URL)
   */
  static async getDownloadUrl(documentId: string): Promise<string> {
    const response = await documentsApi.get<{ url: string; expiresAt: string }>(
      `/documents/${documentId}/download`
    );
    return response.url;
  }

  /**
   * Télécharger un document (ouvre dans le navigateur)
   */
  static async downloadDocument(documentId: string): Promise<void> {
    const url = await this.getDownloadUrl(documentId);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  /**
   * Télécharger plusieurs documents (ZIP)
   */
  static async downloadMultipleDocuments(documentIds: string[]): Promise<string> {
    const response = await documentsApi.post<{ url: string }>('/documents/download-multiple', {
      documentIds,
    });
    return response.url;
  }

  // ========== OCR ==========

  /**
   * Lancer l'OCR sur un document
   */
  static async triggerOCR(request: TriggerOCRRequest): Promise<OCRResult> {
    return await documentsApi.post<OCRResult>(
      `/documents/${request.documentId}/ocr`,
      request
    );
  }

  /**
   * Récupérer le résultat OCR d'un document
   */
  static async getOCRResult(documentId: string): Promise<OCRResult | null> {
    try {
      return await documentsApi.get<OCRResult>(`/documents/${documentId}/ocr`);
    } catch (error: any) {
      if (error.status === 404) {
        return null; // Pas de résultat OCR
      }
      throw error;
    }
  }

  /**
   * Re-lancer l'OCR sur un document (si échec précédent)
   */
  static async retryOCR(documentId: string): Promise<OCRResult> {
    return await documentsApi.post<OCRResult>(`/documents/${documentId}/ocr/retry`);
  }

  /**
   * Valider/corriger les données OCR
   */
  static async updateOCRData(
    documentId: string,
    structuredData: Record<string, any>
  ): Promise<OCRResult> {
    return await documentsApi.put<OCRResult>(`/documents/${documentId}/ocr`, {
      structuredData,
    });
  }

  // ========== VÉRIFICATION ==========

  /**
   * Vérifier/valider un document
   */
  static async verifyDocument(request: VerifyDocumentRequest): Promise<Document> {
    return await documentsApi.post<Document>(
      `/documents/${request.documentId}/verify`,
      request
    );
  }

  /**
   * Obtenir les documents non vérifiés d'une commande
   */
  static async getUnverifiedDocuments(orderId: string): Promise<Document[]> {
    return await documentsApi.get<Document[]>(`/documents/orders/${orderId}/unverified`);
  }

  // ========== STATISTIQUES ==========

  /**
   * Obtenir les statistiques globales
   */
  static async getDocumentStats(userId?: string): Promise<DocumentStats> {
    return await documentsApi.get<DocumentStats>('/documents/stats', { userId });
  }

  /**
   * Obtenir les statistiques d'une commande
   */
  static async getOrderDocumentStats(orderId: string): Promise<DocumentStats> {
    return await documentsApi.get<DocumentStats>(`/documents/orders/${orderId}/stats`);
  }

  // ========== TEMPLATES ==========

  /**
   * Récupérer les templates de documents
   */
  static async getDocumentTemplates(orderStatus?: string): Promise<DocumentTemplate[]> {
    return await documentsApi.get<DocumentTemplate[]>('/documents/templates', {
      orderStatus,
    });
  }

  /**
   * Obtenir les documents requis manquants pour une commande
   */
  static async getMissingRequiredDocuments(orderId: string): Promise<DocumentTemplate[]> {
    return await documentsApi.get<DocumentTemplate[]>(
      `/documents/orders/${orderId}/missing-required`
    );
  }

  // ========== EXPORT ==========

  /**
   * Exporter plusieurs documents (ZIP ou PDF combiné)
   */
  static async bulkExport(request: BulkExportRequest): Promise<BulkExportResponse> {
    return await documentsApi.post<BulkExportResponse>('/documents/export', request);
  }

  /**
   * Exporter tous les documents d'une commande
   */
  static async exportOrderDocuments(
    orderId: string,
    format: 'zip' | 'pdf' = 'zip'
  ): Promise<BulkExportResponse> {
    return await documentsApi.post<BulkExportResponse>(`/documents/orders/${orderId}/export`, {
      format,
    });
  }

  // ========== HELPERS ==========

  /**
   * Obtenir l'icône d'un type de document
   */
  static getDocumentTypeIcon(type: DocumentType): string {
    const icons: Record<DocumentType, string> = {
      cmr: '📄',
      invoice: '🧾',
      delivery_note: '📋',
      packing_list: '📦',
      pod: '✅',
      customs: '🛂',
      insurance: '🛡️',
      contract: '📝',
      other: '📎',
    };
    return icons[type] || '📎';
  }

  /**
   * Obtenir le label d'un type de document
   */
  static getDocumentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      cmr: 'Lettre de voiture (CMR)',
      invoice: 'Facture',
      delivery_note: 'Bon de livraison',
      packing_list: 'Liste de colisage',
      pod: 'Preuve de livraison',
      customs: 'Déclaration douanière',
      insurance: 'Certificat d\'assurance',
      contract: 'Contrat',
      other: 'Autre document',
    };
    return labels[type] || 'Document';
  }

  /**
   * Obtenir la couleur d'un statut
   */
  static getStatusColor(status: DocumentStatus): string {
    const colors: Record<DocumentStatus, string> = {
      pending: '#f59e0b',
      uploading: '#3b82f6',
      uploaded: '#10b981',
      processing: '#8b5cf6',
      processed: '#10b981',
      failed: '#ef4444',
      archived: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut
   */
  static getStatusLabel(status: DocumentStatus): string {
    const labels: Record<DocumentStatus, string> = {
      pending: 'En attente',
      uploading: 'Upload en cours',
      uploaded: 'Uploadé',
      processing: 'Traitement en cours',
      processed: 'Traité',
      failed: 'Échec',
      archived: 'Archivé',
    };
    return labels[status] || status;
  }

  /**
   * Formater la taille d'un fichier
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Vérifier si un fichier est une image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Vérifier si un fichier est un PDF
   */
  static isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  /**
   * Vérifier si le type de fichier est supporté pour l'OCR
   */
  static isOCRSupported(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf',
    ];
    return supportedTypes.includes(mimeType);
  }

  /**
   * Valider un fichier avant upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Le fichier est trop volumineux (max ${this.formatFileSize(maxSize)})`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté',
      };
    }

    return { valid: true };
  }

  /**
   * Obtenir la couleur du score de confiance OCR
   */
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return '#10b981'; // Vert
    if (confidence >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  }

  /**
   * Obtenir le label du score de confiance OCR
   */
  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 90) return 'Excellent';
    if (confidence >= 70) return 'Bon';
    if (confidence >= 50) return 'Moyen';
    return 'Faible';
  }
}

export default DocumentsService;

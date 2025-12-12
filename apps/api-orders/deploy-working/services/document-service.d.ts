import { DocumentType, IDocument } from '../models/Document';
interface UploadDocumentParams {
    orderId: string;
    type: DocumentType;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    fileData?: string;
    s3Key?: string;
    s3Bucket?: string;
    url?: string;
    uploadedBy: {
        id: string;
        name: string;
        role: 'carrier' | 'supplier' | 'recipient' | 'industrial' | 'system';
    };
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    notes?: string;
}
interface SignDocumentParams {
    signedBy: string;
    signatureData: string;
    ipAddress?: string;
    deviceInfo?: string;
}
declare class DocumentService {
    /**
     * Upload un nouveau document
     */
    static uploadDocument(params: UploadDocumentParams): Promise<{
        success: boolean;
        document?: IDocument;
        error?: string;
    }>;
    /**
     * Valide un document
     */
    static validateDocument(documentId: string, validatedBy: {
        id: string;
        name: string;
        role: string;
    }): Promise<{
        success: boolean;
        document?: IDocument;
        error?: string;
    }>;
    /**
     * Rejette un document
     */
    static rejectDocument(documentId: string, rejectedBy: {
        id: string;
        name: string;
        role: string;
    }, reason: string): Promise<{
        success: boolean;
        document?: IDocument;
        error?: string;
    }>;
    /**
     * Signe un document (POD/BL) - Signature électronique
     */
    static signDocument(documentId: string, signParams: SignDocumentParams): Promise<{
        success: boolean;
        document?: IDocument;
        error?: string;
    }>;
    /**
     * Récupère les documents d'une commande
     */
    static getOrderDocuments(orderId: string): Promise<IDocument[]>;
    /**
     * Récupère un document par son ID
     */
    static getDocument(documentId: string): Promise<IDocument | null>;
    /**
     * Vérifie si tous les documents requis sont présents et validés
     */
    static checkRequiredDocuments(orderId: string): Promise<{
        complete: boolean;
        missing: DocumentType[];
        pending: DocumentType[];
        validated: DocumentType[];
    }>;
    /**
     * Archive les documents d'une commande
     */
    static archiveOrderDocuments(orderId: string): Promise<number>;
    /**
     * Notifie les parties de l'upload d'un document
     */
    private static notifyDocumentUploaded;
    /**
     * Notifie le transporteur du rejet d'un document
     */
    private static notifyDocumentRejected;
    /**
     * Statistiques des documents
     */
    static getDocumentStats(industrialId?: string): Promise<{
        total: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        recentUploads: number;
    }>;
}
export default DocumentService;
//# sourceMappingURL=document-service.d.ts.map
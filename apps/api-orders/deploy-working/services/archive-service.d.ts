import { IOrderArchive } from '../models/OrderArchive';
interface ArchiveDocumentInput {
    type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'ecmr' | 'other';
    filename: string;
    size: number;
    mimeType: string;
    content: Buffer;
    s3Key?: string;
}
declare class ArchiveService {
    private static readonly RETENTION_YEARS;
    /**
     * Archive une commande avec tous ses documents
     */
    static archiveOrder(orderId: string, documents: ArchiveDocumentInput[], archivedBy?: string): Promise<IOrderArchive>;
    /**
     * Crée un snapshot de la commande pour l'archive
     */
    private static createOrderSnapshot;
    /**
     * Calcule le checksum SHA-256 d'un fichier
     */
    private static calculateChecksum;
    /**
     * Récupère une archive par ID
     */
    static getArchive(archiveId: string, accessedBy?: string): Promise<IOrderArchive | null>;
    /**
     * Récupère les archives d'un industriel
     */
    static getArchivesByIndustrial(industrialId: string, options?: {
        page?: number;
        limit?: number;
        year?: number;
    }): Promise<{
        archives: IOrderArchive[];
        total: number;
    }>;
    /**
     * Vérifie l'intégrité d'une archive
     */
    static verifyArchiveIntegrity(archiveId: string): Promise<{
        isValid: boolean;
        issues: string[];
    }>;
    /**
     * Recherche dans les archives
     */
    static searchArchives(industrialId: string, searchParams: {
        reference?: string;
        carrierName?: string;
        startDate?: Date;
        endDate?: Date;
        city?: string;
    }): Promise<IOrderArchive[]>;
    /**
     * Exporte une archive (pour conformité légale)
     */
    static exportArchive(archiveId: string, exportedBy?: string): Promise<{
        archive: IOrderArchive;
        exportedAt: Date;
        exportFormat: string;
    }>;
    /**
     * Statistiques d'archivage
     */
    static getArchiveStats(industrialId: string): Promise<{
        totalArchives: number;
        totalDocuments: number;
        archivesByYear: {
            year: number;
            count: number;
        }[];
        storageEstimateGB: number;
        oldestArchive: Date | null;
        newestArchive: Date | null;
    }>;
    /**
     * Nettoie les archives expirées (à exécuter via CRON)
     */
    static cleanupExpiredArchives(): Promise<{
        processed: number;
        deleted: number;
    }>;
}
export default ArchiveService;
//# sourceMappingURL=archive-service.d.ts.map
import { IPreInvoice, ICarrierBankDetails, PreInvoiceStatus } from '../models/PreInvoice';
interface CMRAnalysis {
    waitingHours: number;
    delayHours: number;
    arrivalTime?: Date;
    departureTime?: Date;
    notes: string[];
}
declare class PreInvoiceService {
    /**
     * Génère un numéro de préfacture
     */
    private static generatePreInvoiceNumber;
    /**
     * Analyse le CMR pour détecter heures d'attente et retards
     */
    static analyzeCMR(orderId: string): Promise<CMRAnalysis>;
    /**
     * Ajoute une commande terminée à la préfacturation
     */
    static addCompletedOrder(orderId: string): Promise<IPreInvoice | null>;
    /**
     * Recalcule les totaux d'une préfacture
     */
    private static recalculateTotals;
    /**
     * Envoie les préfactures du mois aux industriels pour validation
     * À appeler le 1er du mois
     */
    static sendMonthlyPreInvoicesToIndustrials(): Promise<number>;
    /**
     * Validation par l'industriel
     */
    static validateByIndustrial(preInvoiceId: string, validatedBy: string, comments?: string, adjustments?: {
        lineIndex: number;
        adjustedAmount: number;
        reason: string;
    }[]): Promise<IPreInvoice | null>;
    /**
     * Upload de la facture transporteur
     */
    static uploadCarrierInvoice(preInvoiceId: string, invoiceData: {
        invoiceNumber: string;
        invoiceDate: Date;
        invoiceAmount: number;
        documentId: string;
        bankDetails: ICarrierBankDetails;
    }): Promise<IPreInvoice | null>;
    /**
     * Contrôle automatique facture vs préfacture
     */
    static performInvoiceControl(preInvoiceId: string): Promise<IPreInvoice | null>;
    /**
     * Met à jour le décompte des jours restants avant paiement
     * Envoie des rappels automatiques à l'industriel
     */
    static updatePaymentCountdowns(): Promise<number>;
    /**
     * Marque une préfacture comme payée
     */
    static markAsPaid(preInvoiceId: string, paymentReference: string, paidAmount: number): Promise<IPreInvoice | null>;
    /**
     * Génère l'export Excel des règlements à effectuer
     */
    static generatePaymentExport(): Promise<any[]>;
    /**
     * Récupère les préfactures avec filtres
     */
    static getPreInvoices(filters: {
        industrialId?: string;
        carrierId?: string;
        status?: PreInvoiceStatus;
        month?: number;
        year?: number;
    }): Promise<IPreInvoice[]>;
    /**
     * Récupère une préfacture par ID
     */
    static getPreInvoiceById(preInvoiceId: string): Promise<IPreInvoice | null>;
    /**
     * Récupère une préfacture par numéro
     */
    static getPreInvoiceByNumber(preInvoiceNumber: string): Promise<IPreInvoice | null>;
}
export default PreInvoiceService;
//# sourceMappingURL=preinvoice-service.d.ts.map
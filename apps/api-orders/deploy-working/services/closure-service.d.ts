interface ClosureResult {
    success: boolean;
    orderId: string;
    status: 'completed' | 'pending_documents' | 'pending_score' | 'error';
    message: string;
}
declare class ClosureService {
    /**
     * Vérifie si une commande peut être clôturée
     */
    static checkClosureEligibility(orderId: string): Promise<{
        eligible: boolean;
        reason?: string;
        missingItems?: string[];
    }>;
    /**
     * Clôture une commande manuellement
     */
    static closeOrder(orderId: string, closedBy: {
        id: string;
        name: string;
    }): Promise<ClosureResult>;
    /**
     * Clôture automatique des commandes livrées depuis plus de X heures
     * À exécuter via un cron job
     */
    static autoCloseDeliveredOrders(hoursAfterDelivery?: number): Promise<{
        processed: number;
        closed: number;
        pending: number;
        errors: string[];
    }>;
    /**
     * Archivage automatique des commandes clôturées depuis plus de X jours
     * Conservation 10 ans selon les obligations légales
     */
    static autoArchiveCompletedOrders(daysAfterClosure?: number): Promise<{
        processed: number;
        archived: number;
        errors: string[];
    }>;
    /**
     * Notifie la clôture d'une commande
     */
    private static notifyOrderClosed;
    /**
     * Statistiques de clôture
     */
    static getClosureStats(industrialId?: string): Promise<{
        totalCompleted: number;
        totalArchived: number;
        pendingClosure: number;
        averageClosureTime: number;
    }>;
}
export default ClosureService;
//# sourceMappingURL=closure-service.d.ts.map
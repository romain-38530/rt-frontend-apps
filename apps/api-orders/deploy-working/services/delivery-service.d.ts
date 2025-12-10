interface DeliveryConfirmationParams {
    orderId: string;
    confirmedBy: {
        id: string;
        name: string;
        role: 'recipient' | 'industrial';
        email?: string;
    };
    signature: {
        data: string;
        timestamp: Date;
        ipAddress?: string;
        deviceInfo?: string;
    };
    receivedBy?: string;
    receivedAt?: Date;
    notes?: string;
    condition?: 'good' | 'damaged' | 'partial';
    damageNotes?: string;
    photos?: string[];
    location?: {
        latitude: number;
        longitude: number;
    };
}
interface DeliveryIssueParams {
    orderId: string;
    reportedBy: {
        id: string;
        name: string;
        role: string;
        email?: string;
    };
    issueType: 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other';
    description: string;
    severity: 'minor' | 'major' | 'critical';
    photos?: string[];
}
declare class DeliveryService {
    /**
     * Confirme la livraison avec signature électronique
     */
    static confirmDelivery(params: DeliveryConfirmationParams): Promise<{
        success: boolean;
        order?: any;
        error?: string;
    }>;
    /**
     * Signale un problème de livraison
     */
    static reportDeliveryIssue(params: DeliveryIssueParams): Promise<{
        success: boolean;
        issueId?: string;
        error?: string;
    }>;
    /**
     * Déclenche les actions post-livraison (scoring, archivage)
     */
    private static triggerPostDeliveryActions;
    /**
     * Notifie la confirmation de livraison
     */
    private static notifyDeliveryConfirmed;
    /**
     * Notifie un problème de livraison
     */
    private static notifyDeliveryIssue;
    /**
     * Récupère les statistiques de livraison
     */
    static getDeliveryStats(industrialId?: string): Promise<{
        totalDelivered: number;
        onTime: number;
        delayed: number;
        withIssues: number;
        averageDeliveryTime: number;
    }>;
}
export default DeliveryService;
//# sourceMappingURL=delivery-service.d.ts.map
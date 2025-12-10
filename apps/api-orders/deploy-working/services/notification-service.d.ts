interface CarrierNotificationParams {
    carrierId: string;
    carrierName: string;
    carrierEmail: string;
    carrierPhone?: string;
    orderReference: string;
    orderId: string;
    chainId: string;
    pickupCity: string;
    deliveryCity: string;
    pickupDate: Date;
    deliveryDate: Date;
    goodsDescription: string;
    weight: number;
    expiresAt: Date;
    responseUrl: string;
}
interface ReminderParams {
    carrierId: string;
    carrierName: string;
    carrierEmail: string;
    orderReference: string;
    minutesRemaining: number;
    responseUrl: string;
}
declare class NotificationService {
    /**
     * Envoie une invitation de transport à un transporteur
     */
    static sendCarrierInvitation(params: CarrierNotificationParams): Promise<boolean>;
    /**
     * Helper pour envoyer un email avec fallback console
     */
    private static sendEmail;
    /**
     * Envoie un rappel de timeout imminent
     */
    static sendTimeoutReminder(params: ReminderParams): Promise<boolean>;
    /**
     * Notifie un transporteur qu'il a été sélectionné
     */
    static sendCarrierConfirmation(carrierEmail: string, carrierName: string, orderReference: string, portalUrl: string): Promise<boolean>;
    /**
     * Notifie l'industriel du statut du dispatch
     */
    static notifyIndustrialDispatchStatus(industrialEmail: string, industrialName: string, orderReference: string, status: 'carrier_found' | 'escalated' | 'timeout', carrierName?: string): Promise<boolean>;
    /**
     * Vérifie l'état de la connexion SMTP
     */
    static checkSmtpConnection(): Promise<{
        connected: boolean;
        message: string;
    }>;
}
export default NotificationService;
//# sourceMappingURL=notification-service.d.ts.map
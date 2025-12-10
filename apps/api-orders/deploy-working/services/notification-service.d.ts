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
     * Envoie une demande de validation de préfacture à l'industriel
     */
    static sendPreInvoiceValidationRequest(industrialEmail: string, industrialName: string, preInvoiceNumber: string, carrierName: string, totalAmount: number, kpis: any, orderCount: number): Promise<boolean>;
    /**
     * Notifie le transporteur que sa préfacture est validée
     */
    static notifyCarrierPreInvoiceValidated(carrierEmail: string, carrierName: string, preInvoiceNumber: string, totalAmount: number): Promise<boolean>;
    /**
     * Notifie le transporteur que sa facture est acceptée
     */
    static notifyCarrierInvoiceAccepted(carrierEmail: string, carrierName: string, preInvoiceNumber: string, amount: number, dueDate: Date): Promise<boolean>;
    /**
     * Notifie le transporteur que sa facture est rejetée
     */
    static notifyCarrierInvoiceRejected(carrierEmail: string, carrierName: string, preInvoiceNumber: string, expectedAmount: number, invoiceAmount: number, difference: number): Promise<boolean>;
    /**
     * Notifie le transporteur du paiement envoyé
     */
    static notifyCarrierPaymentSent(carrierEmail: string, carrierName: string, preInvoiceNumber: string, amount: number, paymentReference: string): Promise<boolean>;
    /**
     * Rappel de paiement imminent à l'industriel
     */
    static sendPaymentReminderToIndustrial(industrialEmail: string, industrialName: string, preInvoiceNumber: string, carrierName: string, amount: number, daysRemaining: number, dueDate: Date): Promise<boolean>;
    /**
     * Notification de paiement en retard
     */
    static sendOverduePaymentAlert(industrialEmail: string, industrialName: string, preInvoiceNumber: string, carrierName: string, amount: number, daysOverdue: number): Promise<boolean>;
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
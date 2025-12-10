declare class PreInvoiceScheduler {
    private monthlyIntervalId;
    private dailyIntervalId;
    private isRunning;
    /**
     * Démarre le scheduler
     */
    start(): void;
    /**
     * Arrête le scheduler
     */
    stop(): void;
    /**
     * Tâches quotidiennes
     */
    private runDailyTasks;
    /**
     * Vérifie et envoie les préfactures mensuelles (1er du mois)
     */
    private checkAndSendMonthlyPreInvoices;
    /**
     * Met à jour les décomptes de paiement
     */
    private updatePaymentCountdowns;
    /**
     * Force l'envoi des préfactures mensuelles (pour test ou rattrapage)
     */
    forceMonthlyPreInvoices(): Promise<number>;
    /**
     * Récupère les statistiques du scheduler
     */
    getStats(): {
        isRunning: boolean;
        nextMonthlyRun: Date;
        lastCountdownUpdate: Date | null;
    };
}
declare const preinvoiceScheduler: PreInvoiceScheduler;
export default preinvoiceScheduler;
//# sourceMappingURL=preinvoice-scheduler.d.ts.map
declare class AIReportScheduler {
    private intervalId;
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
     * Vérifie si c'est le moment de générer les rapports (1er du mois, 6h du matin)
     */
    private checkAndGenerateReports;
    /**
     * Génère tous les rapports mensuels
     */
    generateAllMonthlyReports(): Promise<void>;
    /**
     * Génère un rapport pour une entité spécifique
     */
    private generateReportForEntity;
    /**
     * Récupère les entités actives pour le mois donné
     */
    private getActiveEntities;
    /**
     * Envoie une notification email pour un rapport
     */
    private sendReportNotification;
    /**
     * Génère manuellement un rapport (pour tests ou demande explicite)
     */
    generateManualReport(entityType: 'industrial' | 'carrier' | 'logistician', entityId: string, entityName: string, month?: number, year?: number): Promise<any>;
}
declare const _default: AIReportScheduler;
export default _default;
//# sourceMappingURL=ai-report-scheduler.d.ts.map
import { IAIReport } from '../models/AIReport';
export declare class AIAnalyticsService {
    /**
     * Appelle l'API Claude pour générer une analyse
     */
    private static callClaudeAPI;
    /**
     * Génère des recommandations basées sur les KPIs
     */
    private static generateRecommendations;
    /**
     * Génère les tendances à partir des KPIs
     */
    private static generateTrends;
    /**
     * Génère les alertes basées sur les KPIs
     */
    private static generateAlerts;
    /**
     * Génère un rapport IA pour un industriel (analyse de ses transporteurs)
     */
    static generateIndustrialReport(industrialId: string, industrialName: string, month: number, year: number): Promise<IAIReport>;
    /**
     * Génère un rapport IA pour un transporteur (analyse de ses industriels)
     */
    static generateCarrierReport(carrierId: string, carrierName: string, month: number, year: number): Promise<IAIReport>;
    /**
     * Génère un rapport IA pour un logisticien
     */
    static generateLogisticianReport(userId: string, userName: string, month: number, year: number): Promise<IAIReport>;
    /**
     * Récupère le rapport le plus récent pour une entité
     */
    static getLatestReport(entityType: 'industrial' | 'carrier' | 'logistician', entityId: string): Promise<IAIReport | null>;
    /**
     * Liste les rapports d'une entité
     */
    static listReports(entityType: 'industrial' | 'carrier' | 'logistician', entityId: string, limit?: number): Promise<IAIReport[]>;
    /**
     * Soumet un feedback sur un rapport
     */
    static submitFeedback(reportId: string, rating: 1 | 2 | 3 | 4 | 5, helpful: boolean, comment?: string): Promise<IAIReport | null>;
    /**
     * Utilitaire: nom du mois en français
     */
    private static getMonthName;
}
export default AIAnalyticsService;
//# sourceMappingURL=ai-analytics-service.d.ts.map
import { ICarrierOrderScore, ICarrierGlobalScore } from '../models/CarrierScore';
interface ScoreInput {
    orderId: string;
    carrierId: string;
    carrierName: string;
    industrialId: string;
    pickupScheduledAt?: Date;
    pickupActualAt?: Date;
    deliveryScheduledAt?: Date;
    deliveryActualAt?: Date;
    appointmentRespected?: boolean;
    trackingResponses?: number;
    trackingExpected?: number;
    podDeliveredAt?: Date;
    deliveryCompletedAt?: Date;
    hadIncident?: boolean;
    incidentResolutionTimeMinutes?: number;
    communicationScore?: number;
}
declare class ScoringService {
    private static readonly WEIGHTS;
    /**
     * Calcule et enregistre le score pour un transport
     */
    static calculateOrderScore(input: ScoreInput): Promise<ICarrierOrderScore>;
    /**
     * Calcule le détail de chaque critère (format IScoreCriteria)
     */
    private static calculateCriteria;
    /**
     * Score de ponctualité (enlèvement ou livraison)
     */
    private static calculatePunctualityScore;
    /**
     * Score de respect des rendez-vous
     */
    private static calculateAppointmentScore;
    /**
     * Score de réactivité tracking
     */
    private static calculateTrackingScore;
    /**
     * Score délai POD (Proof of Delivery)
     */
    private static calculatePodDelayScore;
    /**
     * Score gestion des incidents
     */
    private static calculateIncidentScore;
    /**
     * Calcule le score final pondéré
     */
    private static calculateWeightedScore;
    /**
     * Met à jour le score global d'un transporteur
     */
    static updateGlobalScore(carrierId: string, carrierName: string): Promise<ICarrierGlobalScore>;
    /**
     * Calcule la tendance (amélioration/dégradation)
     */
    private static calculateTrendValue;
    /**
     * Récupère le score d'une commande
     */
    static getOrderScore(orderId: string): Promise<ICarrierOrderScore | null>;
    /**
     * Calcule le score automatiquement à partir des données de la commande
     */
    static calculateScore(orderId: string, carrierId: string): Promise<ICarrierOrderScore | null>;
    /**
     * Récupère le score global d'un transporteur
     */
    static getCarrierGlobalScore(carrierId: string): Promise<ICarrierGlobalScore | null>;
    /**
     * Récupère l'historique des scores d'un transporteur
     */
    static getCarrierScoreHistory(carrierId: string, limit?: number): Promise<ICarrierOrderScore[]>;
    /**
     * Récupère les meilleurs transporteurs pour un industriel
     */
    static getTopCarriers(industrialId: string, limit?: number): Promise<ICarrierGlobalScore[]>;
    /**
     * Récupère les statistiques de scoring pour le dashboard
     */
    static getScoringStats(industrialId: string): Promise<{
        totalCarriers: number;
        averageScore: number;
        topPerformer: ICarrierGlobalScore | null;
        lowPerformer: ICarrierGlobalScore | null;
        distribution: {
            range: string;
            count: number;
        }[];
    }>;
}
export default ScoringService;
//# sourceMappingURL=scoring-service.d.ts.map
/**
 * TrackingService - Service de suivi en temps réel SYMPHONI.A
 * Gère les mises à jour GPS, statuts, ETA et notifications multi-portails
 */
import { IOrder, OrderStatus } from '../models/Order';
interface PositionUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
}
interface MilestoneUpdate {
    status: OrderStatus;
    timestamp?: Date;
    location?: PositionUpdate;
    notes?: string;
    signature?: string;
}
interface ETAUpdate {
    eta: Date;
    reason?: string;
}
declare class TrackingService {
    /**
     * Met à jour la position GPS du transport
     */
    static updatePosition(orderId: string, carrierId: string, position: PositionUpdate): Promise<{
        success: boolean;
        order?: IOrder;
        error?: string;
    }>;
    /**
     * Met à jour le statut avec un jalon (milestone)
     */
    static updateMilestone(orderId: string, carrierId: string, milestone: MilestoneUpdate): Promise<{
        success: boolean;
        order?: IOrder;
        error?: string;
    }>;
    /**
     * Met à jour l'ETA
     */
    static updateETA(orderId: string, carrierId: string, etaUpdate: ETAUpdate): Promise<{
        success: boolean;
        order?: IOrder;
        error?: string;
    }>;
    /**
     * Récupère le statut de tracking complet
     */
    static getTrackingStatus(orderId: string, accessToken?: string): Promise<any>;
    /**
     * Récupère l'historique complet du tracking
     */
    static getTrackingHistory(orderId: string): Promise<any>;
    /**
     * Notifie tous les stakeholders d'un changement de statut
     */
    private static notifyAllStakeholders;
    /**
     * Envoie une notification de statut
     */
    private static sendStatusNotification;
    /**
     * Notifie un changement d'ETA significatif
     */
    private static notifyETAChange;
    /**
     * Convertit un statut en type d'événement
     */
    private static getEventTypeForStatus;
    /**
     * Calcule l'ETA basé sur la position actuelle (simplifié)
     */
    static calculateETA(orderId: string, currentPosition: PositionUpdate): Promise<Date | null>;
    /**
     * Calcule la distance entre deux points (Haversine)
     */
    private static calculateDistance;
    private static toRad;
    /**
     * POINTAGE - Envoie une demande de mise à jour position au transporteur
     * Appelable par n'importe quel stakeholder (industriel, expéditeur, destinataire)
     */
    static requestPositionPing(orderId: string, requestedBy: {
        id: string;
        name: string;
        role: string;
        email?: string;
    }): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    /**
     * Notifie tous les stakeholders qu'un pointage a été demandé
     */
    private static notifyPingRequested;
    /**
     * Retourne le label du rôle en français
     */
    private static getRoleLabel;
}
export default TrackingService;
//# sourceMappingURL=tracking-service.d.ts.map
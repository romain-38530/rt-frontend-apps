import { OrderEventType, IOrderEvent } from '../models/OrderEvent';
interface CreateEventParams {
    orderId: string;
    orderReference: string;
    eventType: OrderEventType;
    source: IOrderEvent['source'];
    actorId?: string;
    actorType?: IOrderEvent['actorType'];
    actorName?: string;
    data?: Record<string, any>;
    metadata?: IOrderEvent['metadata'];
    previousStatus?: string;
    newStatus?: string;
    description?: string;
}
declare class EventService {
    /**
     * Crée un nouvel événement
     */
    static createEvent(params: CreateEventParams): Promise<IOrderEvent>;
    /**
     * Événement: Commande créée
     */
    static orderCreated(order: any, createdBy: string, source?: IOrderEvent['source']): Promise<IOrderEvent>;
    /**
     * Événement: Ligne détectée
     */
    static laneDetected(orderId: string, orderReference: string, laneId: string, laneName: string): Promise<IOrderEvent>;
    /**
     * Événement: Chaîne de dispatch générée
     */
    static dispatchChainGenerated(orderId: string, orderReference: string, chainId: string, carriersCount: number): Promise<IOrderEvent>;
    /**
     * Événement: Commande envoyée au transporteur
     */
    static orderSentToCarrier(orderId: string, orderReference: string, carrierId: string, carrierName: string, position: number, expiresAt: Date): Promise<IOrderEvent>;
    /**
     * Événement: Transporteur accepte
     */
    static carrierAccepted(orderId: string, orderReference: string, carrierId: string, carrierName: string, proposedPrice?: number): Promise<IOrderEvent>;
    /**
     * Événement: Transporteur refuse
     */
    static carrierRefused(orderId: string, orderReference: string, carrierId: string, carrierName: string, reason?: string): Promise<IOrderEvent>;
    /**
     * Événement: Timeout transporteur
     */
    static carrierTimeout(orderId: string, orderReference: string, carrierId: string, carrierName: string): Promise<IOrderEvent>;
    /**
     * Événement: Escalade vers Affret.IA
     */
    static escalatedToAffretia(orderId: string, orderReference: string, reason: string): Promise<IOrderEvent>;
    /**
     * Événement: Tracking démarré
     */
    static trackingStarted(orderId: string, orderReference: string, trackingLevel: 'basic' | 'gps' | 'premium', carrierId: string): Promise<IOrderEvent>;
    /**
     * Événement: Arrivée au chargement
     */
    static arrivedPickup(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent>;
    /**
     * Événement: Chargement effectué
     */
    static loaded(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent>;
    /**
     * Événement: Arrivée à la livraison
     */
    static arrivedDelivery(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent>;
    /**
     * Événement: Livraison effectuée
     */
    static delivered(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent>;
    /**
     * Événement: Documents uploadés
     */
    static documentsUploaded(orderId: string, orderReference: string, documentType: string, documentId: string): Promise<IOrderEvent>;
    /**
     * Événement: Transporteur scoré
     */
    static carrierScored(orderId: string, orderReference: string, carrierId: string, carrierName: string, score: number): Promise<IOrderEvent>;
    /**
     * Événement: Commande archivée
     */
    static orderArchived(orderId: string, orderReference: string, archiveId: string): Promise<IOrderEvent>;
    /**
     * Événement: Commande clôturée
     */
    static orderClosed(orderId: string, orderReference: string): Promise<IOrderEvent>;
    /**
     * Récupère tous les événements d'une commande
     */
    static getOrderEvents(orderId: string): Promise<IOrderEvent[]>;
    /**
     * Récupère les événements par type
     */
    static getEventsByType(eventType: OrderEventType, limit?: number): Promise<IOrderEvent[]>;
}
export default EventService;
//# sourceMappingURL=event-service.d.ts.map
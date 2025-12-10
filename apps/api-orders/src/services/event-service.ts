/**
 * EventService - Service de gestion des événements SYMPHONI.A
 * Centralise la création et la diffusion des événements du cycle de vie
 */
import { v4 as uuidv4 } from 'uuid';
import OrderEvent, { OrderEventType, IOrderEvent } from '../models/OrderEvent';
import Order from '../models/Order';

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

// Auto-generate descriptions for event types
const eventDescriptions: Record<string, string> = {
  'document_uploaded': 'Document uploadé',
  'document_validated': 'Document validé',
  'document_rejected': 'Document rejeté',
  'document_signed': 'Document signé électroniquement',
  'delivered': 'Livraison confirmée',
  'incident_reported': 'Incident signalé',
  'incident_resolved': 'Incident résolu',
  'score_calculated': 'Score transporteur calculé',
  'tracking.ping.requested': 'Demande de pointage envoyée',
  'order.completed': 'Commande complétée'
};

class EventService {
  /**
   * Crée un nouvel événement
   */
  static async createEvent(params: CreateEventParams): Promise<IOrderEvent> {
    const description = params.description || eventDescriptions[params.eventType] || `Événement: ${params.eventType}`;
    const event = new OrderEvent({
      eventId: `evt_${uuidv4()}`,
      ...params,
      description,
      timestamp: new Date()
    });

    await event.save();

    // Mettre à jour le statut de la commande si nécessaire
    if (params.newStatus) {
      await Order.findOneAndUpdate(
        { orderId: params.orderId },
        { $set: { status: params.newStatus } }
      );
    }

    // TODO: Envoyer l'événement vers un message broker (SNS/SQS) pour découplage
    // await this.publishEvent(event);

    return event;
  }

  /**
   * Événement: Commande créée
   */
  static async orderCreated(order: any, createdBy: string, source: IOrderEvent['source'] = 'user'): Promise<IOrderEvent> {
    return this.createEvent({
      orderId: order.orderId,
      orderReference: order.reference,
      eventType: 'order.created',
      source,
      actorId: createdBy,
      actorType: 'industrial',
      data: {
        pickupCity: order.pickupAddress?.city,
        deliveryCity: order.deliveryAddress?.city,
        pickupDate: order.dates?.pickupDate,
        weight: order.goods?.weight,
        palettes: order.goods?.palettes,
        constraints: order.constraints?.map((c: any) => c.type)
      },
      newStatus: 'created',
      description: `Commande ${order.reference} créée`
    });
  }

  /**
   * Événement: Ligne détectée
   */
  static async laneDetected(orderId: string, orderReference: string, laneId: string, laneName: string): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.lane.detected',
      source: 'system',
      data: { laneId, laneName },
      description: `Ligne de transport "${laneName}" détectée`
    });
  }

  /**
   * Événement: Chaîne de dispatch générée
   */
  static async dispatchChainGenerated(orderId: string, orderReference: string, chainId: string, carriersCount: number): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'dispatch.chain.generated',
      source: 'system',
      data: { chainId, carriersCount },
      description: `Chaîne d'affectation générée avec ${carriersCount} transporteurs`
    });
  }

  /**
   * Événement: Commande envoyée au transporteur
   */
  static async orderSentToCarrier(
    orderId: string,
    orderReference: string,
    carrierId: string,
    carrierName: string,
    position: number,
    expiresAt: Date
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.sent.to.carrier',
      source: 'system',
      data: { carrierId, carrierName, position, expiresAt },
      newStatus: 'sent_to_carrier',
      description: `Commande envoyée au transporteur ${carrierName} (position ${position})`
    });
  }

  /**
   * Événement: Transporteur accepte
   */
  static async carrierAccepted(
    orderId: string,
    orderReference: string,
    carrierId: string,
    carrierName: string,
    proposedPrice?: number
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'carrier.accepted',
      source: 'carrier',
      actorId: carrierId,
      actorType: 'carrier',
      actorName: carrierName,
      data: { carrierId, carrierName, proposedPrice },
      previousStatus: 'sent_to_carrier',
      newStatus: 'carrier_accepted',
      description: `Transporteur ${carrierName} a accepté la commande`
    });
  }

  /**
   * Événement: Transporteur refuse
   */
  static async carrierRefused(
    orderId: string,
    orderReference: string,
    carrierId: string,
    carrierName: string,
    reason?: string
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'carrier.refused',
      source: 'carrier',
      actorId: carrierId,
      actorType: 'carrier',
      actorName: carrierName,
      data: { carrierId, carrierName, reason },
      description: `Transporteur ${carrierName} a refusé la commande${reason ? `: ${reason}` : ''}`
    });
  }

  /**
   * Événement: Timeout transporteur
   */
  static async carrierTimeout(
    orderId: string,
    orderReference: string,
    carrierId: string,
    carrierName: string
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'carrier.timeout',
      source: 'system',
      data: { carrierId, carrierName },
      description: `Délai de réponse dépassé pour ${carrierName}`
    });
  }

  /**
   * Événement: Escalade vers Affret.IA
   */
  static async escalatedToAffretia(orderId: string, orderReference: string, reason: string): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.escalated.to.affretia',
      source: 'system',
      data: { reason },
      newStatus: 'escalated',
      description: `Commande escaladée vers Affret.IA: ${reason}`
    });
  }

  /**
   * Événement: Tracking démarré
   */
  static async trackingStarted(
    orderId: string,
    orderReference: string,
    trackingLevel: 'basic' | 'gps' | 'premium',
    carrierId: string
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'tracking.started',
      source: 'system',
      data: { trackingLevel, carrierId },
      newStatus: 'in_transit',
      description: `Tracking ${trackingLevel} activé`
    });
  }

  /**
   * Événement: Arrivée au chargement
   */
  static async arrivedPickup(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.arrived.pickup',
      source: 'tracking',
      data: { actualTime },
      newStatus: 'arrived_pickup',
      description: 'Arrivé au point de chargement'
    });
  }

  /**
   * Événement: Chargement effectué
   */
  static async loaded(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.loaded',
      source: 'tracking',
      data: { actualTime },
      newStatus: 'loaded',
      description: 'Marchandise chargée'
    });
  }

  /**
   * Événement: Arrivée à la livraison
   */
  static async arrivedDelivery(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.arrived.delivery',
      source: 'tracking',
      data: { actualTime },
      newStatus: 'arrived_delivery',
      description: 'Arrivé au point de livraison'
    });
  }

  /**
   * Événement: Livraison effectuée
   */
  static async delivered(orderId: string, orderReference: string, actualTime: Date): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.delivered',
      source: 'tracking',
      data: { actualTime },
      newStatus: 'delivered',
      description: 'Marchandise livrée'
    });
  }

  /**
   * Événement: Documents uploadés
   */
  static async documentsUploaded(
    orderId: string,
    orderReference: string,
    documentType: string,
    documentId: string
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'documents.uploaded',
      source: 'carrier',
      data: { documentType, documentId },
      description: `Document ${documentType.toUpperCase()} uploadé`
    });
  }

  /**
   * Événement: Transporteur scoré
   */
  static async carrierScored(
    orderId: string,
    orderReference: string,
    carrierId: string,
    carrierName: string,
    score: number
  ): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'carrier.scored',
      source: 'system',
      data: { carrierId, carrierName, score },
      description: `Score transporteur calculé: ${score}/100`
    });
  }

  /**
   * Événement: Commande archivée
   */
  static async orderArchived(orderId: string, orderReference: string, archiveId: string): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.archived',
      source: 'system',
      data: { archiveId, retentionYears: 10 },
      description: 'Commande archivée (conservation 10 ans)'
    });
  }

  /**
   * Événement: Commande clôturée
   */
  static async orderClosed(orderId: string, orderReference: string): Promise<IOrderEvent> {
    return this.createEvent({
      orderId,
      orderReference,
      eventType: 'order.closed',
      source: 'system',
      newStatus: 'closed',
      description: 'Commande clôturée'
    });
  }

  /**
   * Récupère tous les événements d'une commande
   */
  static async getOrderEvents(orderId: string): Promise<IOrderEvent[]> {
    return OrderEvent.find({ orderId }).sort({ timestamp: 1 });
  }

  /**
   * Récupère les événements par type
   */
  static async getEventsByType(eventType: OrderEventType, limit = 100): Promise<IOrderEvent[]> {
    return OrderEvent.find({ eventType }).sort({ timestamp: -1 }).limit(limit);
  }
}

export default EventService;

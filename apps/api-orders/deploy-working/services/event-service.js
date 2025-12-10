"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * EventService - Service de gestion des événements SYMPHONI.A
 * Centralise la création et la diffusion des événements du cycle de vie
 */
const uuid_1 = require("uuid");
const OrderEvent_1 = __importDefault(require("../models/OrderEvent"));
const Order_1 = __importDefault(require("../models/Order"));
// Auto-generate descriptions for event types
const eventDescriptions = {
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
    static async createEvent(params) {
        const description = params.description || eventDescriptions[params.eventType] || `Événement: ${params.eventType}`;
        const event = new OrderEvent_1.default({
            eventId: `evt_${(0, uuid_1.v4)()}`,
            ...params,
            description,
            timestamp: new Date()
        });
        await event.save();
        // Mettre à jour le statut de la commande si nécessaire
        if (params.newStatus) {
            await Order_1.default.findOneAndUpdate({ orderId: params.orderId }, { $set: { status: params.newStatus } });
        }
        // TODO: Envoyer l'événement vers un message broker (SNS/SQS) pour découplage
        // await this.publishEvent(event);
        return event;
    }
    /**
     * Événement: Commande créée
     */
    static async orderCreated(order, createdBy, source = 'user') {
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
                constraints: order.constraints?.map((c) => c.type)
            },
            newStatus: 'created',
            description: `Commande ${order.reference} créée`
        });
    }
    /**
     * Événement: Ligne détectée
     */
    static async laneDetected(orderId, orderReference, laneId, laneName) {
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
    static async dispatchChainGenerated(orderId, orderReference, chainId, carriersCount) {
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
    static async orderSentToCarrier(orderId, orderReference, carrierId, carrierName, position, expiresAt) {
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
    static async carrierAccepted(orderId, orderReference, carrierId, carrierName, proposedPrice) {
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
    static async carrierRefused(orderId, orderReference, carrierId, carrierName, reason) {
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
    static async carrierTimeout(orderId, orderReference, carrierId, carrierName) {
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
    static async escalatedToAffretia(orderId, orderReference, reason) {
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
    static async trackingStarted(orderId, orderReference, trackingLevel, carrierId) {
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
    static async arrivedPickup(orderId, orderReference, actualTime) {
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
    static async loaded(orderId, orderReference, actualTime) {
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
    static async arrivedDelivery(orderId, orderReference, actualTime) {
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
    static async delivered(orderId, orderReference, actualTime) {
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
    static async documentsUploaded(orderId, orderReference, documentType, documentId) {
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
    static async carrierScored(orderId, orderReference, carrierId, carrierName, score) {
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
    static async orderArchived(orderId, orderReference, archiveId) {
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
    static async orderClosed(orderId, orderReference) {
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
    static async getOrderEvents(orderId) {
        return OrderEvent_1.default.find({ orderId }).sort({ timestamp: 1 });
    }
    /**
     * Récupère les événements par type
     */
    static async getEventsByType(eventType, limit = 100) {
        return OrderEvent_1.default.find({ eventType }).sort({ timestamp: -1 }).limit(limit);
    }
}
exports.default = EventService;
//# sourceMappingURL=event-service.js.map
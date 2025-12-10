"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * AffretiaService - Intégration avec l'API Affret.IA pour l'escalade des commandes
 * Lorsque tous les transporteurs de la cascade refusent, la commande est envoyée à Affret.IA
 */
const axios_1 = __importDefault(require("axios"));
const Order_1 = __importDefault(require("../models/Order"));
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
const event_service_1 = __importDefault(require("./event-service"));
class AffretiaService {
    constructor() {
        this.baseUrl = process.env.AFFRETIA_API_URL || 'http://rt-affret-ia-api-prod-v4.eba-quc9udpr.eu-central-1.elasticbeanstalk.com';
        this.apiKey = process.env.AFFRETIA_API_KEY || '';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'X-Source': 'symphonia-orders-api'
            }
        });
    }
    /**
     * Envoie une commande à Affret.IA pour recherche de transporteur
     */
    async escalateOrder(chain) {
        try {
            // Récupérer les détails de la commande
            const order = await Order_1.default.findOne({ orderId: chain.orderId });
            if (!order) {
                throw new Error(`Order not found: ${chain.orderId}`);
            }
            // Construire la requête Affret.IA
            const request = {
                externalOrderId: chain.orderId,
                reference: chain.orderReference,
                industrialId: chain.industrialId,
                industrialName: order.industrialName,
                pickup: {
                    address: order.pickupAddress?.street || '',
                    city: order.pickupAddress?.city || '',
                    postalCode: order.pickupAddress?.postalCode || '',
                    country: order.pickupAddress?.country || 'France',
                    date: order.dates?.pickupDate || new Date(),
                    timeSlot: order.dates?.pickupTimeSlotStart
                },
                delivery: {
                    address: order.deliveryAddress?.street || '',
                    city: order.deliveryAddress?.city || '',
                    postalCode: order.deliveryAddress?.postalCode || '',
                    country: order.deliveryAddress?.country || 'France',
                    date: order.dates?.deliveryDate || new Date(),
                    timeSlot: order.dates?.deliveryTimeSlotStart
                },
                goods: {
                    description: order.goods?.description || 'Marchandises diverses',
                    weight: order.goods?.weight || 0,
                    volume: order.goods?.volume,
                    quantity: order.goods?.quantity || 1,
                    palettes: order.goods?.palettes,
                    constraints: order.constraints?.map(c => c.type) || []
                },
                urgency: this.determineUrgency(order.dates?.pickupDate),
                maxPrice: order.estimatedPrice,
                callbackUrl: `${process.env.API_BASE_URL || 'https://rt-orders-api-prod-v2.eba-4tprbbqu.eu-central-1.elasticbeanstalk.com'}/api/v1/dispatch/affretia-callback`
            };
            console.log(`[AffretIA] Escalating order ${chain.orderReference} to Affret.IA`);
            // Appeler l'API Affret.IA
            const response = await this.client.post('/api/v1/orders/external', request);
            if (response.data.success) {
                // Mettre à jour la chaîne de dispatch
                chain.escalation = {
                    escalatedAt: new Date(),
                    affretiaOrderId: response.data.affretiaOrderId,
                    status: 'pending'
                };
                await chain.save();
                // Enregistrer l'événement
                await event_service_1.default.escalatedToAffretia(chain.orderId, chain.orderReference, `Envoyé à Affret.IA - ID: ${response.data.affretiaOrderId}`);
                console.log(`[AffretIA] Order ${chain.orderReference} escalated - Affret.IA ID: ${response.data.affretiaOrderId}`);
            }
            return response.data;
        }
        catch (error) {
            console.error(`[AffretIA] Failed to escalate order ${chain.orderId}:`, error.message);
            // En cas d'échec de l'API, simuler une réponse pour ne pas bloquer le process
            if (process.env.AFFRETIA_MOCK_MODE === 'true') {
                console.log('[AffretIA] Mock mode enabled - simulating response');
                return this.mockEscalateResponse(chain);
            }
            throw error;
        }
    }
    /**
     * Vérifie le statut d'une commande escaladée
     */
    async checkStatus(affretiaOrderId) {
        try {
            const response = await this.client.get(`/api/v1/orders/external/${affretiaOrderId}/status`);
            return response.data;
        }
        catch (error) {
            console.error(`[AffretIA] Failed to check status for ${affretiaOrderId}:`, error.message);
            if (process.env.AFFRETIA_MOCK_MODE === 'true') {
                return { success: true, status: 'searching', message: 'Mock status' };
            }
            throw error;
        }
    }
    /**
     * Annule une demande Affret.IA
     */
    async cancelRequest(affretiaOrderId, reason) {
        try {
            const response = await this.client.post(`/api/v1/orders/external/${affretiaOrderId}/cancel`, { reason });
            return response.data.success;
        }
        catch (error) {
            console.error(`[AffretIA] Failed to cancel request ${affretiaOrderId}:`, error.message);
            return false;
        }
    }
    /**
     * Traite le callback d'Affret.IA (transporteur trouvé ou échec)
     */
    async handleCallback(payload) {
        const chain = await DispatchChain_1.default.findOne({ orderId: payload.externalOrderId });
        if (!chain) {
            console.error(`[AffretIA] Chain not found for order ${payload.externalOrderId}`);
            return;
        }
        if (payload.status === 'matched' && payload.carrier) {
            // Transporteur trouvé via Affret.IA
            chain.escalation = {
                ...chain.escalation,
                status: 'assigned',
                assignedCarrierId: payload.carrier.carrierId,
                assignedCarrierName: payload.carrier.carrierName,
                assignedAt: new Date(),
                proposedPrice: payload.carrier.price
            };
            chain.status = 'completed';
            chain.assignedCarrierId = payload.carrier.carrierId;
            chain.assignedCarrierName = payload.carrier.carrierName;
            chain.assignedAt = new Date();
            chain.completedAt = new Date();
            await chain.save();
            // Mettre à jour la commande
            await Order_1.default.findOneAndUpdate({ orderId: chain.orderId }, {
                $set: {
                    status: 'carrier_assigned',
                    carrierId: payload.carrier.carrierId,
                    carrierName: payload.carrier.carrierName,
                    'pricing.agreedPrice': payload.carrier.price,
                    assignedVia: 'affretia'
                }
            });
            await event_service_1.default.carrierAccepted(chain.orderId, chain.orderReference, payload.carrier.carrierId, payload.carrier.carrierName, payload.carrier.price);
            console.log(`[AffretIA] Carrier assigned via Affret.IA: ${payload.carrier.carrierName}`);
        }
        else {
            // Aucun transporteur trouvé
            chain.escalation = {
                ...chain.escalation,
                status: 'failed'
            };
            await chain.save();
            await Order_1.default.findOneAndUpdate({ orderId: chain.orderId }, { $set: { status: 'no_carrier_found' } });
            console.log(`[AffretIA] No carrier found for order ${chain.orderReference}: ${payload.reason}`);
        }
    }
    /**
     * Détermine l'urgence en fonction de la date d'enlèvement
     */
    determineUrgency(pickupDate) {
        if (!pickupDate)
            return 'standard';
        const now = new Date();
        const hoursUntilPickup = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilPickup <= 6)
            return 'urgent';
        if (hoursUntilPickup <= 24)
            return 'express';
        return 'standard';
    }
    /**
     * Mode mock pour les tests sans connexion Affret.IA
     */
    mockEscalateResponse(chain) {
        const mockId = `affretia_mock_${Date.now()}`;
        chain.escalation = {
            escalatedAt: new Date(),
            affretiaOrderId: mockId,
            status: 'pending'
        };
        chain.save();
        return {
            success: true,
            affretiaOrderId: mockId,
            status: 'searching',
            estimatedResponseTime: 30,
            message: 'Mock escalation - recherche en cours'
        };
    }
}
exports.default = new AffretiaService();
//# sourceMappingURL=affretia-service.js.map
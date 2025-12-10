/**
 * AffretiaService - Intégration avec l'API Affret.IA pour l'escalade des commandes
 * Lorsque tous les transporteurs de la cascade refusent, la commande est envoyée à Affret.IA
 */
import axios, { AxiosInstance } from 'axios';
import Order from '../models/Order';
import DispatchChain, { IDispatchChain } from '../models/DispatchChain';
import EventService from './event-service';

interface AffretiaOrderRequest {
  externalOrderId: string;
  reference: string;
  industrialId: string;
  industrialName?: string;
  pickup: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    date: Date;
    timeSlot?: string;
  };
  delivery: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    date: Date;
    timeSlot?: string;
  };
  goods: {
    description: string;
    weight: number;
    volume?: number;
    quantity: number;
    palettes?: number;
    constraints?: string[]; // ADR, FRIGO, HAYON, etc.
  };
  urgency: 'standard' | 'express' | 'urgent';
  maxPrice?: number;
  callbackUrl?: string;
}

interface AffretiaOrderResponse {
  success: boolean;
  affretiaOrderId: string;
  status: 'received' | 'searching' | 'matched' | 'failed';
  estimatedResponseTime?: number; // En minutes
  message?: string;
}

interface AffretiaStatusResponse {
  success: boolean;
  status: 'searching' | 'matched' | 'failed' | 'cancelled';
  carrier?: {
    carrierId: string;
    carrierName: string;
    price: number;
    estimatedPickup?: Date;
    estimatedDelivery?: Date;
  };
  message?: string;
}

class AffretiaService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AFFRETIA_API_URL || 'http://rt-affret-ia-api-prod-v4.eba-quc9udpr.eu-central-1.elasticbeanstalk.com';
    this.apiKey = process.env.AFFRETIA_API_KEY || '';

    this.client = axios.create({
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
  async escalateOrder(chain: IDispatchChain): Promise<AffretiaOrderResponse> {
    try {
      // Récupérer les détails de la commande
      const order = await Order.findOne({ orderId: chain.orderId });
      if (!order) {
        throw new Error(`Order not found: ${chain.orderId}`);
      }

      // Construire la requête Affret.IA
      const request: AffretiaOrderRequest = {
        externalOrderId: chain.orderId,
        reference: chain.orderReference,
        industrialId: chain.industrialId,
        industrialName: (order as any).industrialName,
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
      const response = await this.client.post<AffretiaOrderResponse>('/api/v1/orders/external', request);

      if (response.data.success) {
        // Mettre à jour la chaîne de dispatch
        chain.escalation = {
          escalatedAt: new Date(),
          affretiaOrderId: response.data.affretiaOrderId,
          status: 'pending'
        };
        await chain.save();

        // Enregistrer l'événement
        await EventService.escalatedToAffretia(
          chain.orderId,
          chain.orderReference,
          `Envoyé à Affret.IA - ID: ${response.data.affretiaOrderId}`
        );

        console.log(`[AffretIA] Order ${chain.orderReference} escalated - Affret.IA ID: ${response.data.affretiaOrderId}`);
      }

      return response.data;
    } catch (error: any) {
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
  async checkStatus(affretiaOrderId: string): Promise<AffretiaStatusResponse> {
    try {
      const response = await this.client.get<AffretiaStatusResponse>(`/api/v1/orders/external/${affretiaOrderId}/status`);
      return response.data;
    } catch (error: any) {
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
  async cancelRequest(affretiaOrderId: string, reason: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/api/v1/orders/external/${affretiaOrderId}/cancel`, { reason });
      return response.data.success;
    } catch (error: any) {
      console.error(`[AffretIA] Failed to cancel request ${affretiaOrderId}:`, error.message);
      return false;
    }
  }

  /**
   * Traite le callback d'Affret.IA (transporteur trouvé ou échec)
   */
  async handleCallback(payload: {
    affretiaOrderId: string;
    externalOrderId: string;
    status: 'matched' | 'failed';
    carrier?: {
      carrierId: string;
      carrierName: string;
      price: number;
    };
    reason?: string;
  }): Promise<void> {
    const chain = await DispatchChain.findOne({ orderId: payload.externalOrderId });
    if (!chain) {
      console.error(`[AffretIA] Chain not found for order ${payload.externalOrderId}`);
      return;
    }

    if (payload.status === 'matched' && payload.carrier) {
      // Transporteur trouvé via Affret.IA
      chain.escalation = {
        ...chain.escalation!,
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
      await Order.findOneAndUpdate(
        { orderId: chain.orderId },
        {
          $set: {
            status: 'carrier_assigned',
            carrierId: payload.carrier.carrierId,
            carrierName: payload.carrier.carrierName,
            'pricing.agreedPrice': payload.carrier.price,
            assignedVia: 'affretia'
          }
        }
      );

      await EventService.carrierAccepted(
        chain.orderId,
        chain.orderReference,
        payload.carrier.carrierId,
        payload.carrier.carrierName,
        payload.carrier.price
      );

      console.log(`[AffretIA] Carrier assigned via Affret.IA: ${payload.carrier.carrierName}`);
    } else {
      // Aucun transporteur trouvé
      chain.escalation = {
        ...chain.escalation!,
        status: 'failed'
      };
      await chain.save();

      await Order.findOneAndUpdate(
        { orderId: chain.orderId },
        { $set: { status: 'no_carrier_found' } }
      );

      console.log(`[AffretIA] No carrier found for order ${chain.orderReference}: ${payload.reason}`);
    }
  }

  /**
   * Détermine l'urgence en fonction de la date d'enlèvement
   */
  private determineUrgency(pickupDate?: Date): 'standard' | 'express' | 'urgent' {
    if (!pickupDate) return 'standard';

    const now = new Date();
    const hoursUntilPickup = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilPickup <= 6) return 'urgent';
    if (hoursUntilPickup <= 24) return 'express';
    return 'standard';
  }

  /**
   * Mode mock pour les tests sans connexion Affret.IA
   */
  private mockEscalateResponse(chain: IDispatchChain): AffretiaOrderResponse {
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

export default new AffretiaService();

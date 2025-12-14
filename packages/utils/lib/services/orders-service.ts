/**
 * Service API pour la gestion des commandes
 * Centralise toutes les requêtes liées aux commandes
 */

import { ordersApi } from '../api-client';
import type {
  Order,
  CreateOrderInput,
  OrderFilters,
  PaginatedOrders,
  OrderEvent,
  OrderTemplate,
  PricingEstimate,
  ImportResult,
} from '@rt/contracts';

// Type for raw API response
interface ApiOrdersResponse {
  success: boolean;
  count: number;
  data: any[];
}

// Transform API order to frontend Order format
function transformOrder(apiOrder: any): Order {
  // Map orderId or _id to id field expected by frontend
  const order = { ...apiOrder };
  order.id = apiOrder.orderId || apiOrder._id;
  return order as Order;
}

export class OrdersService {
  /**
   * Récupérer toutes les commandes avec filtres et pagination
   */
  static async getOrders(filters?: OrderFilters): Promise<PaginatedOrders> {
    const response = await ordersApi.get<ApiOrdersResponse>('/orders', filters);

    // Transform API response to PaginatedOrders format
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const total = response.count || response.data?.length || 0;
    const totalPages = Math.ceil(total / limit);

    // Transform each order to have 'id' field
    const orders = (response.data || []).map(transformOrder);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Récupérer une commande par ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    return await ordersApi.get<Order>(`/orders/${orderId}`);
  }

  /**
   * Créer une nouvelle commande
   */
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    return await ordersApi.post<Order>('/orders', input);
  }

  /**
   * Mettre à jour une commande
   */
  static async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    return await ordersApi.put<Order>(`/orders/${orderId}`, updates);
  }

  /**
   * Annuler une commande
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return await ordersApi.put<Order>(`/orders/${orderId}/cancel`, { reason });
  }

  /**
   * Dupliquer une commande existante
   */
  static async duplicateOrder(orderId: string): Promise<Order> {
    return await ordersApi.post<Order>(`/orders/${orderId}/duplicate`);
  }

  /**
   * Obtenir les événements d'une commande
   */
  static async getOrderEvents(orderId: string): Promise<OrderEvent[]> {
    return await ordersApi.get<OrderEvent[]>(`/orders/${orderId}/events`);
  }

  /**
   * Estimer le prix d'une commande
   */
  static async estimatePrice(input: CreateOrderInput): Promise<PricingEstimate> {
    return await ordersApi.post<PricingEstimate>('/orders/estimate-price', input);
  }

  /**
   * Exporter les commandes en CSV
   */
  static async exportOrders(filters?: OrderFilters): Promise<Blob> {
    // Cette méthode retourne un Blob pour téléchargement
    const params = new URLSearchParams(filters as any);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ORDERS_API_URL}/orders/export?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  }

  /**
   * Importer des commandes depuis CSV/XML
   */
  static async importOrders(file: File): Promise<ImportResult> {
    return await ordersApi.uploadFile<ImportResult>('/orders/import', file);
  }

  /**
   * Obtenir l'historique des imports
   */
  static async getImportHistory(): Promise<any[]> {
    return await ordersApi.get<any[]>('/orders/import-history');
  }

  // ========== TEMPLATES / RÉCURRENCE ==========

  /**
   * Récupérer tous les templates de commandes
   */
  static async getOrderTemplates(): Promise<OrderTemplate[]> {
    return await ordersApi.get<OrderTemplate[]>('/orders/templates');
  }

  /**
   * Récupérer un template par ID
   */
  static async getOrderTemplateById(templateId: string): Promise<OrderTemplate> {
    return await ordersApi.get<OrderTemplate>(`/orders/templates/${templateId}`);
  }

  /**
   * Créer un template de commande
   */
  static async createOrderTemplate(template: Omit<OrderTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderTemplate> {
    return await ordersApi.post<OrderTemplate>('/orders/templates', template);
  }

  /**
   * Mettre à jour un template
   */
  static async updateOrderTemplate(templateId: string, updates: Partial<OrderTemplate>): Promise<OrderTemplate> {
    return await ordersApi.put<OrderTemplate>(`/orders/templates/${templateId}`, updates);
  }

  /**
   * Supprimer un template
   */
  static async deleteOrderTemplate(templateId: string): Promise<void> {
    return await ordersApi.delete<void>(`/orders/templates/${templateId}`);
  }

  /**
   * Planifier la récurrence d'un template
   */
  static async scheduleTemplateRecurrence(
    templateId: string,
    recurrence: OrderTemplate['recurrence']
  ): Promise<OrderTemplate> {
    return await ordersApi.post<OrderTemplate>(`/orders/templates/${templateId}/schedule`, recurrence);
  }

  /**
   * Créer une commande depuis un template
   */
  static async createOrderFromTemplate(templateId: string, customDates?: any): Promise<Order> {
    return await ordersApi.post<Order>(`/orders/templates/${templateId}/create-order`, customDates);
  }

  // ========== AUTOCOMPLETE & HELPERS ==========

  /**
   * Autocomplétion d'adresses (Google Maps API)
   */
  static async autocompleteAddress(query: string): Promise<any[]> {
    return await ordersApi.get<any[]>('/addresses/autocomplete', { query });
  }

  /**
   * Récupérer les contraintes disponibles
   */
  static async getAvailableConstraints(): Promise<any[]> {
    return await ordersApi.get<any[]>('/constraints');
  }
}

export default OrdersService;

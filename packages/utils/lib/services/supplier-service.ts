/**
 * Service API pour le module Fournisseurs (Supplier) SYMPHONI.A
 * Gestion onboarding, commandes, créneaux chargement, signatures, chat, notifications
 */

import { createApiClient } from '../api-client';
import type {
  Supplier,
  SupplierOrder,
  SupplierOrderFilters,
  PaginatedSupplierOrders,
  LoadingSlot,
  SupplierSignature,
  SupplierChat,
  SupplierNotification,
  SupplierStats,
  InviteSupplierRequest,
  InviteSupplierResponse,
  RegisterSupplierRequest,
  RegisterSupplierResponse,
  UpdateOrderStatusRequest,
  RespondToSlotRequest,
  RespondToSlotResponse,
  SignLoadingRequest,
  SignLoadingResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  ChatTemplate,
  ChatTemplateData,
} from '@rt/contracts';

// Client API pour Supplier
const supplierApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_SUPPLIER_API_URL || 'http://localhost:3020/api/v1',
  timeout: 30000,
  retries: 3,
});

export class SupplierService {
  // ========== ONBOARDING & AUTHENTICATION ==========

  /**
   * Inviter un nouveau fournisseur
   */
  static async inviteSupplier(request: InviteSupplierRequest): Promise<InviteSupplierResponse> {
    return await supplierApi.post<InviteSupplierResponse>('/suppliers/invite', request);
  }

  /**
   * Enregistrer un fournisseur (après invitation)
   */
  static async registerSupplier(request: RegisterSupplierRequest): Promise<RegisterSupplierResponse> {
    return await supplierApi.post<RegisterSupplierResponse>('/suppliers/register', request);
  }

  /**
   * Verifier un token d'invitation
   */
  static async verifyInvitationToken(token: string): Promise<{ valid: boolean; companyName?: string; email?: string }> {
    return await supplierApi.get(`/suppliers/invite/verify/${token}`);
  }

  /**
   * Obtenir le profil du fournisseur
   */
  static async getSupplierProfile(supplierId: string): Promise<Supplier> {
    return await supplierApi.get<Supplier>(`/suppliers/${supplierId}`);
  }

  /**
   * Mettre a jour le profil du fournisseur
   */
  static async updateSupplierProfile(supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
    return await supplierApi.patch<Supplier>(`/suppliers/${supplierId}`, updates);
  }

  // ========== ORDERS (COMMANDES) ==========

  /**
   * Lister les commandes d'un fournisseur
   */
  static async listOrders(supplierId: string, filters?: SupplierOrderFilters): Promise<PaginatedSupplierOrders> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return await supplierApi.get(`/suppliers/${supplierId}/orders?${params.toString()}`);
  }

  /**
   * Obtenir les details d'une commande
   */
  static async getOrder(supplierId: string, orderId: string): Promise<SupplierOrder> {
    return await supplierApi.get<SupplierOrder>(`/suppliers/${supplierId}/orders/${orderId}`);
  }

  /**
   * Mettre a jour le statut d'une commande
   */
  static async updateOrderStatus(
    supplierId: string,
    orderId: string,
    request: UpdateOrderStatusRequest
  ): Promise<SupplierOrder> {
    return await supplierApi.patch<SupplierOrder>(`/suppliers/${supplierId}/orders/${orderId}/status`, request);
  }

  /**
   * Marquer une commande comme prete pour chargement
   */
  static async markOrderReady(supplierId: string, orderId: string, notes?: string): Promise<SupplierOrder> {
    return await this.updateOrderStatus(supplierId, orderId, { status: 'ready', notes });
  }

  /**
   * Uploader un document pour une commande
   */
  static async uploadOrderDocument(
    supplierId: string,
    orderId: string,
    file: File,
    type: 'order' | 'packing_list' | 'delivery_note' | 'photo' | 'other'
  ): Promise<{ documentId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Use fetch directly for FormData uploads
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPPLIER_API_URL || 'http://localhost:3020/api/v1'}/suppliers/${supplierId}/orders/${orderId}/documents`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // ========== LOADING SLOTS (CRENEAUX DE CHARGEMENT) ==========

  /**
   * Obtenir les creneaux proposes pour une commande
   */
  static async getLoadingSlots(supplierId: string, orderId: string): Promise<LoadingSlot[]> {
    return await supplierApi.get<LoadingSlot[]>(`/suppliers/${supplierId}/orders/${orderId}/slots`);
  }

  /**
   * Repondre a un creneau propose (accepter/modifier/rejeter)
   */
  static async respondToSlot(
    supplierId: string,
    orderId: string,
    slotId: string,
    request: RespondToSlotRequest
  ): Promise<RespondToSlotResponse> {
    return await supplierApi.post<RespondToSlotResponse>(
      `/suppliers/${supplierId}/orders/${orderId}/slots/${slotId}/respond`,
      request
    );
  }

  /**
   * Accepter un creneau de chargement
   */
  static async acceptSlot(supplierId: string, orderId: string, slotId: string): Promise<RespondToSlotResponse> {
    return await this.respondToSlot(supplierId, orderId, slotId, { action: 'accept' });
  }

  /**
   * Rejeter un creneau de chargement
   */
  static async rejectSlot(
    supplierId: string,
    orderId: string,
    slotId: string,
    reason: string
  ): Promise<RespondToSlotResponse> {
    return await this.respondToSlot(supplierId, orderId, slotId, { action: 'reject', reason });
  }

  /**
   * Proposer un creneau alternatif
   */
  static async proposeAlternativeSlot(
    supplierId: string,
    orderId: string,
    slotId: string,
    alternativeDate: string,
    alternativeStartTime: string,
    alternativeEndTime: string,
    reason?: string
  ): Promise<RespondToSlotResponse> {
    return await this.respondToSlot(supplierId, orderId, slotId, {
      action: 'modify',
      alternativeDate,
      alternativeStartTime,
      alternativeEndTime,
      reason,
    });
  }

  // ========== SIGNATURES ==========

  /**
   * Signer le chargement d'une commande
   */
  static async signLoading(supplierId: string, request: SignLoadingRequest): Promise<SignLoadingResponse> {
    return await supplierApi.post<SignLoadingResponse>(`/suppliers/${supplierId}/signatures`, request);
  }

  /**
   * Obtenir les signatures d'une commande
   */
  static async getOrderSignatures(supplierId: string, orderId: string): Promise<SupplierSignature[]> {
    return await supplierApi.get<SupplierSignature[]>(`/suppliers/${supplierId}/orders/${orderId}/signatures`);
  }

  /**
   * Generer un QR code pour signature
   */
  static async generateSignatureQRCode(supplierId: string, orderId: string): Promise<{ qrCode: string; token: string }> {
    return await supplierApi.post(`/suppliers/${supplierId}/orders/${orderId}/qrcode`);
  }

  // ========== CHAT & MESSAGING ==========

  /**
   * Lister les conversations du fournisseur
   */
  static async listChats(supplierId: string, filters?: { orderId?: string; status?: 'active' | 'archived' }): Promise<SupplierChat[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.status) params.append('status', filters.status);

    return await supplierApi.get(`/suppliers/${supplierId}/chats?${params.toString()}`);
  }

  /**
   * Obtenir une conversation par ID
   */
  static async getChat(supplierId: string, chatId: string): Promise<SupplierChat> {
    return await supplierApi.get<SupplierChat>(`/suppliers/${supplierId}/chats/${chatId}`);
  }

  /**
   * Envoyer un message dans une conversation
   */
  static async sendMessage(supplierId: string, request: SendChatMessageRequest): Promise<SendChatMessageResponse> {
    return await supplierApi.post<SendChatMessageResponse>(`/suppliers/${supplierId}/chats/${request.chatId}/messages`, {
      content: request.content,
      attachments: request.attachments,
    });
  }

  /**
   * Utiliser un template de message predéfini
   */
  static async sendTemplateMessage(
    supplierId: string,
    chatId: string,
    templateData: ChatTemplateData
  ): Promise<SendChatMessageResponse> {
    return await supplierApi.post<SendChatMessageResponse>(`/suppliers/${supplierId}/chats/${chatId}/templates`, templateData);
  }

  /**
   * Marquer les messages comme lus
   */
  static async markMessagesAsRead(supplierId: string, chatId: string, messageIds: string[]): Promise<void> {
    await supplierApi.post(`/suppliers/${supplierId}/chats/${chatId}/read`, { messageIds });
  }

  /**
   * Archiver une conversation
   */
  static async archiveChat(supplierId: string, chatId: string): Promise<SupplierChat> {
    return await supplierApi.post<SupplierChat>(`/suppliers/${supplierId}/chats/${chatId}/archive`);
  }

  // ========== NOTIFICATIONS ==========

  /**
   * Lister les notifications du fournisseur
   */
  static async listNotifications(
    supplierId: string,
    filters?: { read?: boolean; type?: string; limit?: number }
  ): Promise<SupplierNotification[]> {
    const params = new URLSearchParams();
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return await supplierApi.get(`/suppliers/${supplierId}/notifications?${params.toString()}`);
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationAsRead(supplierId: string, notificationId: string): Promise<void> {
    await supplierApi.patch(`/suppliers/${supplierId}/notifications/${notificationId}`, { read: true });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllNotificationsAsRead(supplierId: string): Promise<void> {
    await supplierApi.post(`/suppliers/${supplierId}/notifications/read-all`);
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(supplierId: string, notificationId: string): Promise<void> {
    await supplierApi.delete(`/suppliers/${supplierId}/notifications/${notificationId}`);
  }

  // ========== STATISTICS & ANALYTICS ==========

  /**
   * Obtenir les statistiques du fournisseur
   */
  static async getStats(supplierId: string, period?: 'week' | 'month' | 'quarter' | 'year'): Promise<SupplierStats> {
    const params = period ? `?period=${period}` : '';
    return await supplierApi.get<SupplierStats>(`/suppliers/${supplierId}/stats${params}`);
  }

  /**
   * Obtenir le tableau de bord du fournisseur
   */
  static async getDashboard(supplierId: string): Promise<{
    stats: SupplierStats;
    recentOrders: SupplierOrder[];
    pendingSlots: LoadingSlot[];
    unreadNotifications: number;
    unreadMessages: number;
  }> {
    return await supplierApi.get(`/suppliers/${supplierId}/dashboard`);
  }

  // ========== SETTINGS ==========

  /**
   * Mettre a jour les parametres du fournisseur
   */
  static async updateSettings(supplierId: string, settings: Partial<Supplier['settings']>): Promise<Supplier> {
    return await supplierApi.patch<Supplier>(`/suppliers/${supplierId}/settings`, settings);
  }

  /**
   * Mettre a jour les preferences de notification
   */
  static async updateNotificationPreferences(
    supplierId: string,
    preferences: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<Supplier> {
    return await supplierApi.patch<Supplier>(`/suppliers/${supplierId}/settings/notifications`, preferences);
  }
}

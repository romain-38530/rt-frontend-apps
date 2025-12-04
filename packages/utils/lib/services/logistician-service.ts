/**
 * Service API pour le module Logisticien SYMPHONI.A
 * Gestion des logisticiens invités par les industriels
 */

import { createApiClient } from '../api-client';
import type {
  Logistician,
  LogisticianInvitation,
  OrderAccess,
  InviteLogisticianRequest,
  InviteLogisticianResponse,
  RegisterLogisticianRequest,
  RegisterLogisticianResponse,
  ValidateInvitationResponse,
  ShareOrderRequest,
  ShareOrderResponse,
  RevokeAccessRequest,
  RevokeAccessResponse,
  UpdateLogisticianRequest,
  LogisticianUserStats,
  LogisticianFilters,
  PaginatedLogisticians,
  LogisticianNotification,
} from '@rt/contracts';

// Client API pour Logisticien
const logisticianApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net/api/v1',
  timeout: 30000,
  retries: 3,
});

export class LogisticianService {
  // ========== INVITATIONS (Côté Industriel) ==========

  /**
   * Inviter un logisticien
   */
  static async inviteLogistician(request: InviteLogisticianRequest): Promise<InviteLogisticianResponse> {
    return await logisticianApi.post<InviteLogisticianResponse>('/logisticians/invite', request);
  }

  /**
   * Renvoyer une invitation
   */
  static async resendInvitation(invitationId: string): Promise<{ success: boolean; expiresAt: string }> {
    return await logisticianApi.post(`/logisticians/invitations/${invitationId}/resend`);
  }

  /**
   * Annuler une invitation
   */
  static async cancelInvitation(invitationId: string): Promise<{ success: boolean }> {
    return await logisticianApi.delete(`/logisticians/invitations/${invitationId}`);
  }

  /**
   * Lister les invitations en attente
   */
  static async getPendingInvitations(): Promise<LogisticianInvitation[]> {
    return await logisticianApi.get<LogisticianInvitation[]>('/logisticians/invitations/pending');
  }

  // ========== VALIDATION INVITATION (Côté Logisticien) ==========

  /**
   * Valider un token d'invitation
   */
  static async validateInvitation(token: string): Promise<ValidateInvitationResponse> {
    return await logisticianApi.get<ValidateInvitationResponse>(`/logisticians/validate/${token}`);
  }

  /**
   * Accepter une invitation et créer le compte
   */
  static async acceptInvitation(request: RegisterLogisticianRequest): Promise<RegisterLogisticianResponse> {
    return await logisticianApi.post<RegisterLogisticianResponse>('/logisticians/register', request);
  }

  // ========== GESTION LOGISTICIENS (Côté Industriel) ==========

  /**
   * Lister les logisticiens de l'industriel
   */
  static async getLogisticians(filters?: LogisticianFilters): Promise<PaginatedLogisticians> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.accessLevel) params.append('accessLevel', filters.accessLevel.join(','));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return await logisticianApi.get<PaginatedLogisticians>(`/logisticians?${params.toString()}`);
  }

  /**
   * Obtenir un logisticien par ID
   */
  static async getLogistician(logisticianId: string): Promise<Logistician> {
    return await logisticianApi.get<Logistician>(`/logisticians/${logisticianId}`);
  }

  /**
   * Mettre à jour un logisticien
   */
  static async updateLogistician(logisticianId: string, data: UpdateLogisticianRequest): Promise<Logistician> {
    return await logisticianApi.put<Logistician>(`/logisticians/${logisticianId}`, data);
  }

  /**
   * Suspendre un logisticien
   */
  static async suspendLogistician(logisticianId: string, reason?: string): Promise<{ success: boolean }> {
    return await logisticianApi.post(`/logisticians/${logisticianId}/suspend`, { reason });
  }

  /**
   * Réactiver un logisticien
   */
  static async reactivateLogistician(logisticianId: string): Promise<{ success: boolean }> {
    return await logisticianApi.post(`/logisticians/${logisticianId}/reactivate`);
  }

  /**
   * Supprimer un logisticien
   */
  static async deleteLogistician(logisticianId: string): Promise<{ success: boolean }> {
    return await logisticianApi.delete(`/logisticians/${logisticianId}`);
  }

  /**
   * Obtenir les statistiques d'un logisticien
   */
  static async getLogisticianStats(logisticianId: string): Promise<LogisticianUserStats> {
    return await logisticianApi.get<LogisticianUserStats>(`/logisticians/${logisticianId}/stats`);
  }

  // ========== PARTAGE DE COMMANDES ==========

  /**
   * Partager une commande avec des logisticiens
   */
  static async shareOrder(request: ShareOrderRequest): Promise<ShareOrderResponse> {
    return await logisticianApi.post<ShareOrderResponse>('/logisticians/orders/share', request);
  }

  /**
   * Obtenir les accès d'une commande
   */
  static async getOrderAccess(orderId: string): Promise<OrderAccess[]> {
    return await logisticianApi.get<OrderAccess[]>(`/logisticians/orders/${orderId}/access`);
  }

  /**
   * Révoquer l'accès d'un logisticien à une commande
   */
  static async revokeOrderAccess(request: RevokeAccessRequest): Promise<RevokeAccessResponse> {
    return await logisticianApi.post<RevokeAccessResponse>('/logisticians/orders/revoke', request);
  }

  /**
   * Obtenir les commandes partagées avec un logisticien
   */
  static async getSharedOrders(logisticianId: string): Promise<OrderAccess[]> {
    return await logisticianApi.get<OrderAccess[]>(`/logisticians/${logisticianId}/orders`);
  }

  // ========== PROFIL LOGISTICIEN (Côté Logisticien) ==========

  /**
   * Obtenir le profil du logisticien connecté
   */
  static async getMyProfile(): Promise<Logistician> {
    return await logisticianApi.get<Logistician>('/logisticians/me');
  }

  /**
   * Mettre à jour son profil
   */
  static async updateMyProfile(data: UpdateLogisticianRequest): Promise<Logistician> {
    return await logisticianApi.put<Logistician>('/logisticians/me', data);
  }

  /**
   * Obtenir mes statistiques
   */
  static async getMyStats(): Promise<LogisticianUserStats> {
    return await logisticianApi.get<LogisticianUserStats>('/logisticians/me/stats');
  }

  /**
   * Obtenir mes commandes partagées
   */
  static async getMyOrders(): Promise<OrderAccess[]> {
    return await logisticianApi.get<OrderAccess[]>('/logisticians/me/orders');
  }

  // ========== NOTIFICATIONS ==========

  /**
   * Obtenir les notifications
   */
  static async getNotifications(): Promise<LogisticianNotification[]> {
    return await logisticianApi.get<LogisticianNotification[]>('/logisticians/notifications');
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return await logisticianApi.put(`/logisticians/notifications/${notificationId}/read`);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return await logisticianApi.put('/logisticians/notifications/read-all');
  }
}

// Export par défaut
export default LogisticianService;

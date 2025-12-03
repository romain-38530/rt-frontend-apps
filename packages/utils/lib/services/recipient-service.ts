/**
 * Service API pour le module Destinataires (Recipient) SYMPHONI.A
 * Gestion onboarding, livraisons, signatures, incidents, chat, notifications
 */

import { createApiClient } from '../api-client';
import type {
  Recipient,
  DeliverySite,
  Delivery,
  DeliveryFilters,
  PaginatedDeliveries,
  DeliverySignature,
  Incident,
  IncidentFilters,
  PaginatedIncidents,
  RecipientNotification,
  RecipientStats,
  ETAInfo,
  InviteRecipientRequest,
  InviteRecipientResponse,
  RegisterRecipientRequest,
  RegisterRecipientResponse,
  ReportIncidentRequest,
  ReportIncidentResponse,
  SignDeliveryRequest,
  SignDeliveryResponse,
  UpdateETARequest,
  UpdateETAResponse,
} from '@rt/contracts';

// Client API pour Recipient
const recipientApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_RECIPIENT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1',
  timeout: 30000,
  retries: 3,
});

export class RecipientService {
  // ========== ONBOARDING & AUTHENTICATION ==========

  /**
   * Inviter un nouveau destinataire
   */
  static async inviteRecipient(request: InviteRecipientRequest): Promise<InviteRecipientResponse> {
    return await recipientApi.post<InviteRecipientResponse>('/recipients/invite', request);
  }

  /**
   * Enregistrer un destinataire (après invitation)
   */
  static async registerRecipient(request: RegisterRecipientRequest): Promise<RegisterRecipientResponse> {
    return await recipientApi.post<RegisterRecipientResponse>('/recipients/register', request);
  }

  /**
   * Verifier un token d'invitation
   */
  static async verifyInvitationToken(token: string): Promise<{ valid: boolean; companyName?: string; email?: string }> {
    return await recipientApi.get(`/recipients/invite/verify/${token}`);
  }

  /**
   * Obtenir le profil du destinataire
   */
  static async getRecipientProfile(recipientId: string): Promise<Recipient> {
    return await recipientApi.get<Recipient>(`/recipients/${recipientId}`);
  }

  /**
   * Mettre a jour le profil du destinataire
   */
  static async updateRecipientProfile(recipientId: string, updates: Partial<Recipient>): Promise<Recipient> {
    return await recipientApi.patch<Recipient>(`/recipients/${recipientId}`, updates);
  }

  // ========== DELIVERY SITES (SITES DE LIVRAISON) ==========

  /**
   * Lister les sites de livraison d'un destinataire
   */
  static async listSites(recipientId: string): Promise<DeliverySite[]> {
    return await recipientApi.get<DeliverySite[]>(`/recipients/${recipientId}/sites`);
  }

  /**
   * Obtenir un site de livraison par ID
   */
  static async getSite(recipientId: string, siteId: string): Promise<DeliverySite> {
    return await recipientApi.get<DeliverySite>(`/recipients/${recipientId}/sites/${siteId}`);
  }

  /**
   * Creer un nouveau site de livraison
   */
  static async createSite(recipientId: string, site: Omit<DeliverySite, 'siteId'>): Promise<DeliverySite> {
    return await recipientApi.post<DeliverySite>(`/recipients/${recipientId}/sites`, site);
  }

  /**
   * Mettre a jour un site de livraison
   */
  static async updateSite(recipientId: string, siteId: string, updates: Partial<DeliverySite>): Promise<DeliverySite> {
    return await recipientApi.patch<DeliverySite>(`/recipients/${recipientId}/sites/${siteId}`, updates);
  }

  /**
   * Supprimer un site de livraison
   */
  static async deleteSite(recipientId: string, siteId: string): Promise<void> {
    await recipientApi.delete(`/recipients/${recipientId}/sites/${siteId}`);
  }

  // ========== DELIVERIES (LIVRAISONS) ==========

  /**
   * Lister les livraisons d'un destinataire
   */
  static async listDeliveries(recipientId: string, filters?: DeliveryFilters): Promise<PaginatedDeliveries> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.siteId) params.append('siteId', filters.siteId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return await recipientApi.get(`/recipients/${recipientId}/deliveries?${params.toString()}`);
  }

  /**
   * Obtenir les details d'une livraison
   */
  static async getDelivery(recipientId: string, deliveryId: string): Promise<Delivery> {
    return await recipientApi.get<Delivery>(`/recipients/${recipientId}/deliveries/${deliveryId}`);
  }

  /**
   * Obtenir l'ETA en temps reel d'une livraison
   */
  static async getDeliveryETA(recipientId: string, deliveryId: string): Promise<ETAInfo> {
    return await recipientApi.get<ETAInfo>(`/recipients/${recipientId}/deliveries/${deliveryId}/eta`);
  }

  /**
   * Mettre a jour l'ETA d'une livraison manuellement
   */
  static async updateDeliveryETA(recipientId: string, request: UpdateETARequest): Promise<UpdateETAResponse> {
    return await recipientApi.patch<UpdateETAResponse>(
      `/recipients/${recipientId}/deliveries/${request.deliveryId}/eta`,
      request
    );
  }

  /**
   * Obtenir le tracking en temps reel d'une livraison
   */
  static async getDeliveryTracking(recipientId: string, deliveryId: string): Promise<{
    currentLocation?: { latitude: number; longitude: number; timestamp: string };
    eta: ETAInfo;
    status: string;
    lastUpdate: string;
  }> {
    return await recipientApi.get(`/recipients/${recipientId}/deliveries/${deliveryId}/tracking`);
  }

  // ========== SIGNATURES ==========

  /**
   * Signer une livraison (reception, reception partielle, refus)
   */
  static async signDelivery(recipientId: string, request: SignDeliveryRequest): Promise<SignDeliveryResponse> {
    return await recipientApi.post<SignDeliveryResponse>(`/recipients/${recipientId}/signatures`, request);
  }

  /**
   * Obtenir les signatures d'une livraison
   */
  static async getDeliverySignatures(recipientId: string, deliveryId: string): Promise<DeliverySignature[]> {
    return await recipientApi.get<DeliverySignature[]>(`/recipients/${recipientId}/deliveries/${deliveryId}/signatures`);
  }

  /**
   * Generer un QR code pour signature
   */
  static async generateSignatureQRCode(recipientId: string, deliveryId: string): Promise<{ qrCode: string; token: string }> {
    return await recipientApi.post(`/recipients/${recipientId}/deliveries/${deliveryId}/qrcode`);
  }

  /**
   * Uploader des photos pour une signature
   */
  static async uploadSignaturePhotos(
    recipientId: string,
    deliveryId: string,
    files: File[]
  ): Promise<{ photoIds: string[]; urls: string[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`photo_${index}`, file);
    });

    // Use fetch directly for FormData uploads
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RECIPIENT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1'}/recipients/${recipientId}/deliveries/${deliveryId}/photos`,
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

  // ========== INCIDENTS ==========

  /**
   * Signaler un incident lors d'une livraison
   */
  static async reportIncident(recipientId: string, request: ReportIncidentRequest): Promise<ReportIncidentResponse> {
    return await recipientApi.post<ReportIncidentResponse>(`/recipients/${recipientId}/incidents`, request);
  }

  /**
   * Lister les incidents d'un destinataire
   */
  static async listIncidents(recipientId: string, filters?: IncidentFilters): Promise<PaginatedIncidents> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.type) params.append('type', filters.type.join(','));
    if (filters?.severity) params.append('severity', filters.severity.join(','));
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return await recipientApi.get(`/recipients/${recipientId}/incidents?${params.toString()}`);
  }

  /**
   * Obtenir les details d'un incident
   */
  static async getIncident(recipientId: string, incidentId: string): Promise<Incident> {
    return await recipientApi.get<Incident>(`/recipients/${recipientId}/incidents/${incidentId}`);
  }

  /**
   * Uploader des photos pour un incident
   */
  static async uploadIncidentPhotos(
    recipientId: string,
    incidentId: string,
    files: File[]
  ): Promise<{ photoIds: string[]; urls: string[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`photo_${index}`, file);
    });

    // Use fetch directly for FormData uploads
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RECIPIENT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1'}/recipients/${recipientId}/incidents/${incidentId}/photos`,
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

  /**
   * Ajouter un commentaire a un incident
   */
  static async addIncidentComment(
    recipientId: string,
    incidentId: string,
    comment: string
  ): Promise<{ commentId: string; timestamp: string }> {
    return await recipientApi.post(`/recipients/${recipientId}/incidents/${incidentId}/comments`, { comment });
  }

  /**
   * Mettre a jour le statut d'un incident
   */
  static async updateIncidentStatus(
    recipientId: string,
    incidentId: string,
    status: Incident['status']
  ): Promise<Incident> {
    return await recipientApi.patch<Incident>(`/recipients/${recipientId}/incidents/${incidentId}`, { status });
  }

  // ========== NOTIFICATIONS ==========

  /**
   * Lister les notifications du destinataire
   */
  static async listNotifications(
    recipientId: string,
    filters?: { read?: boolean; type?: string; limit?: number }
  ): Promise<RecipientNotification[]> {
    const params = new URLSearchParams();
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return await recipientApi.get(`/recipients/${recipientId}/notifications?${params.toString()}`);
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationAsRead(recipientId: string, notificationId: string): Promise<void> {
    await recipientApi.patch(`/recipients/${recipientId}/notifications/${notificationId}`, { read: true });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllNotificationsAsRead(recipientId: string): Promise<void> {
    await recipientApi.post(`/recipients/${recipientId}/notifications/read-all`);
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(recipientId: string, notificationId: string): Promise<void> {
    await recipientApi.delete(`/recipients/${recipientId}/notifications/${notificationId}`);
  }

  // ========== STATISTICS & ANALYTICS ==========

  /**
   * Obtenir les statistiques du destinataire
   */
  static async getStats(recipientId: string, period?: 'week' | 'month' | 'quarter' | 'year'): Promise<RecipientStats> {
    const params = period ? `?period=${period}` : '';
    return await recipientApi.get<RecipientStats>(`/recipients/${recipientId}/stats${params}`);
  }

  /**
   * Obtenir le tableau de bord du destinataire
   */
  static async getDashboard(recipientId: string): Promise<{
    stats: RecipientStats;
    upcomingDeliveries: Delivery[];
    recentIncidents: Incident[];
    unreadNotifications: number;
    alertDeliveries: Delivery[]; // Livraisons avec ETA imminent
  }> {
    return await recipientApi.get(`/recipients/${recipientId}/dashboard`);
  }

  /**
   * Obtenir le planning des livraisons
   */
  static async getDeliverySchedule(
    recipientId: string,
    filters?: { siteId?: string; dateFrom?: string; dateTo?: string }
  ): Promise<{
    deliveries: Delivery[];
    groupedByDate: Record<string, Delivery[]>;
  }> {
    const params = new URLSearchParams();
    if (filters?.siteId) params.append('siteId', filters.siteId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    return await recipientApi.get(`/recipients/${recipientId}/schedule?${params.toString()}`);
  }

  // ========== SETTINGS ==========

  /**
   * Mettre a jour les parametres du destinataire
   */
  static async updateSettings(recipientId: string, settings: Partial<Recipient['settings']>): Promise<Recipient> {
    return await recipientApi.patch<Recipient>(`/recipients/${recipientId}/settings`, settings);
  }

  /**
   * Mettre a jour les preferences de notification
   */
  static async updateNotificationPreferences(
    recipientId: string,
    preferences: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<Recipient> {
    return await recipientApi.patch<Recipient>(`/recipients/${recipientId}/settings/notifications`, preferences);
  }

  // ========== ALERTS & WEBHOOKS ==========

  /**
   * S'abonner aux alertes ETA pour une livraison
   */
  static async subscribeToETAAlerts(
    recipientId: string,
    deliveryId: string,
    thresholdMinutes: number
  ): Promise<{ subscriptionId: string }> {
    return await recipientApi.post(`/recipients/${recipientId}/deliveries/${deliveryId}/alerts/eta`, {
      thresholdMinutes,
    });
  }

  /**
   * Configurer un webhook pour les evenements
   */
  static async configureWebhook(
    recipientId: string,
    config: {
      url: string;
      events: string[];
      secret?: string;
    }
  ): Promise<{ webhookId: string; verified: boolean }> {
    return await recipientApi.post(`/recipients/${recipientId}/webhooks`, config);
  }
}

/**
 * Service API pour le système de tracking
 * Gère les positions GPS, ETA, routes et traffic
 */

import { trackingApi } from '../api-client';
import type {
  TrackingSession,
  TrackingPosition,
  TrackingHistoryResponse,
  StartTrackingRequest,
  UpdatePositionRequest,
  GetTrackingHistoryParams,
  CalculateETARequest,
  GetRouteRequest,
  Route,
  ETA,
  TrafficInfo,
  TrackingStats,
  TrackingSettings,
  TrackingAlert,
} from '@rt/contracts';

export class TrackingService {
  /**
   * Démarrer une session de tracking
   */
  static async startTracking(request: StartTrackingRequest): Promise<TrackingSession> {
    return await trackingApi.post<TrackingSession>('/tracking/start', request);
  }

  /**
   * Récupérer une session de tracking
   */
  static async getTrackingSession(sessionId: string): Promise<TrackingSession> {
    return await trackingApi.get<TrackingSession>(`/tracking/sessions/${sessionId}`);
  }

  /**
   * Récupérer la session de tracking d'une commande
   */
  static async getTrackingByOrderId(orderId: string): Promise<TrackingSession> {
    return await trackingApi.get<TrackingSession>(`/tracking/orders/${orderId}`);
  }

  /**
   * Mettre à jour la position
   */
  static async updatePosition(request: UpdatePositionRequest): Promise<TrackingPosition> {
    return await trackingApi.post<TrackingPosition>('/tracking/position', request);
  }

  /**
   * Obtenir la dernière position
   */
  static async getCurrentPosition(orderId: string): Promise<TrackingPosition | null> {
    try {
      return await trackingApi.get<TrackingPosition>(`/tracking/orders/${orderId}/current-position`);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtenir l'historique des positions
   */
  static async getPositionHistory(params: GetTrackingHistoryParams): Promise<TrackingHistoryResponse> {
    return await trackingApi.get<TrackingHistoryResponse>('/tracking/history', params);
  }

  /**
   * Arrêter le tracking
   */
  static async stopTracking(sessionId: string): Promise<TrackingSession> {
    return await trackingApi.post<TrackingSession>(`/tracking/sessions/${sessionId}/stop`);
  }

  /**
   * Mettre en pause le tracking
   */
  static async pauseTracking(sessionId: string): Promise<TrackingSession> {
    return await trackingApi.post<TrackingSession>(`/tracking/sessions/${sessionId}/pause`);
  }

  /**
   * Reprendre le tracking
   */
  static async resumeTracking(sessionId: string): Promise<TrackingSession> {
    return await trackingApi.post<TrackingSession>(`/tracking/sessions/${sessionId}/resume`);
  }

  // ========== CALCUL D'ITINÉRAIRE ==========

  /**
   * Calculer un itinéraire
   */
  static async calculateRoute(request: GetRouteRequest): Promise<Route> {
    return await trackingApi.post<Route>('/tracking/route', request);
  }

  /**
   * Obtenir l'itinéraire d'une commande
   */
  static async getOrderRoute(orderId: string): Promise<Route> {
    return await trackingApi.get<Route>(`/tracking/orders/${orderId}/route`);
  }

  // ========== ETA ==========

  /**
   * Calculer l'ETA
   */
  static async calculateETA(request: CalculateETARequest): Promise<ETA> {
    return await trackingApi.post<ETA>('/tracking/eta', request);
  }

  /**
   * Obtenir l'ETA de livraison d'une commande
   */
  static async getDeliveryETA(orderId: string): Promise<ETA> {
    return await trackingApi.get<ETA>(`/tracking/orders/${orderId}/delivery-eta`);
  }

  /**
   * Obtenir l'ETA de collecte d'une commande
   */
  static async getPickupETA(orderId: string): Promise<ETA> {
    return await trackingApi.get<ETA>(`/tracking/orders/${orderId}/pickup-eta`);
  }

  // ========== TRAFFIC ==========

  /**
   * Obtenir les informations de trafic sur l'itinéraire
   */
  static async getTrafficInfo(orderId: string): Promise<TrafficInfo> {
    return await trackingApi.get<TrafficInfo>(`/tracking/orders/${orderId}/traffic`);
  }

  /**
   * Obtenir le trafic entre deux points
   */
  static async getTrafficBetweenPoints(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<TrafficInfo> {
    return await trackingApi.post<TrafficInfo>('/tracking/traffic', { origin, destination });
  }

  // ========== STATISTIQUES ==========

  /**
   * Obtenir les statistiques de tracking d'une commande
   */
  static async getTrackingStats(orderId: string): Promise<TrackingStats> {
    return await trackingApi.get<TrackingStats>(`/tracking/orders/${orderId}/stats`);
  }

  /**
   * Obtenir les statistiques d'un transporteur
   */
  static async getCarrierStats(carrierId: string, dateFrom?: string, dateTo?: string): Promise<TrackingStats> {
    return await trackingApi.get<TrackingStats>(`/tracking/carriers/${carrierId}/stats`, {
      dateFrom,
      dateTo,
    });
  }

  // ========== PARAMÈTRES ==========

  /**
   * Obtenir les paramètres de tracking
   */
  static async getTrackingSettings(orderId: string): Promise<TrackingSettings> {
    return await trackingApi.get<TrackingSettings>(`/tracking/orders/${orderId}/settings`);
  }

  /**
   * Mettre à jour les paramètres de tracking
   */
  static async updateTrackingSettings(
    orderId: string,
    settings: Partial<TrackingSettings>
  ): Promise<TrackingSettings> {
    return await trackingApi.put<TrackingSettings>(`/tracking/orders/${orderId}/settings`, settings);
  }

  // ========== ALERTES ==========

  /**
   * Obtenir les alertes d'une commande
   */
  static async getTrackingAlerts(orderId: string): Promise<TrackingAlert[]> {
    return await trackingApi.get<TrackingAlert[]>(`/tracking/orders/${orderId}/alerts`);
  }

  /**
   * Accuser réception d'une alerte
   */
  static async acknowledgeAlert(alertId: string): Promise<TrackingAlert> {
    return await trackingApi.put<TrackingAlert>(`/tracking/alerts/${alertId}/acknowledge`);
  }

  // ========== GEOCODING ==========

  /**
   * Géocoder une adresse (obtenir lat/lng)
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }> {
    return await trackingApi.get('/tracking/geocode', { address });
  }

  /**
   * Reverse geocoding (obtenir l'adresse depuis lat/lng)
   */
  static async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ address: string; city: string; country: string }> {
    return await trackingApi.get('/tracking/reverse-geocode', { lat, lng });
  }

  // ========== HELPERS ==========

  /**
   * Calculer la distance entre deux points (en km)
   */
  static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formater la durée en texte lisible
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  }

  /**
   * Formater la distance
   */
  static formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Obtenir la couleur du niveau de trafic
   */
  static getTrafficColor(level: TrafficInfo['level']): string {
    const colors: Record<string, string> = {
      free: '#10b981',
      light: '#84cc16',
      moderate: '#f59e0b',
      heavy: '#ef4444',
      blocked: '#dc2626',
    };
    return colors[level] || '#6b7280';
  }

  /**
   * Obtenir l'icône du type d'alerte
   */
  static getAlertIcon(type: TrackingAlert['type']): string {
    const icons: Record<string, string> = {
      delay: '⏰',
      route_deviation: '🛣️',
      speed_limit: '🚨',
      stop_duration: '⏸️',
      battery_low: '🔋',
      signal_lost: '📡',
    };
    return icons[type] || '⚠️';
  }
}

export default TrackingService;

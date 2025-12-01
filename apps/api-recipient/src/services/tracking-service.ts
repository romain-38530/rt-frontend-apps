import axios from 'axios';
import { IETA } from '../models/Delivery';

interface TrackingData {
  deliveryId: string;
  gpsPosition?: {
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  };
  distanceRemaining?: number;
  timeRemaining?: number;
  eta: {
    predicted: Date;
    confidence: number;
    source: string;
  };
  route?: any;
  lastUpdate: Date;
}

export class TrackingService {
  private trackingApiUrl: string;

  constructor() {
    this.trackingApiUrl = process.env.TRACKING_API_URL || 'http://localhost:3010';
  }

  /**
   * Récupérer les données de tracking en temps réel depuis l'API Tracking IA
   */
  async getRealtimeTracking(deliveryId: string): Promise<TrackingData> {
    try {
      const response = await axios.get(
        `${this.trackingApiUrl}/tracking/${deliveryId}/realtime`,
        {
          timeout: 5000
        }
      );

      return {
        deliveryId,
        gpsPosition: response.data.gpsPosition,
        distanceRemaining: response.data.distanceRemaining,
        timeRemaining: response.data.timeRemaining,
        eta: {
          predicted: new Date(response.data.eta.predicted),
          confidence: response.data.eta.confidence,
          source: response.data.eta.source || 'tracking_ia'
        },
        route: response.data.route,
        lastUpdate: new Date(response.data.lastUpdate || Date.now())
      };
    } catch (error: any) {
      console.error(`Error fetching realtime tracking for ${deliveryId}:`, error.message);

      // Retourner des données par défaut en cas d'erreur
      return {
        deliveryId,
        eta: {
          predicted: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 heures par défaut
          confidence: 0,
          source: 'manual'
        },
        lastUpdate: new Date()
      };
    }
  }

  /**
   * Mettre à jour l'ETA d'une livraison depuis l'API Tracking IA
   */
  async updateETA(deliveryId: string): Promise<IETA | null> {
    try {
      const response = await axios.get(
        `${this.trackingApiUrl}/tracking/${deliveryId}/eta`,
        {
          timeout: 5000
        }
      );

      if (!response.data || !response.data.eta) {
        return null;
      }

      return {
        predicted: new Date(response.data.eta.predicted),
        source: 'tracking_ia',
        confidence: response.data.eta.confidence || 80,
        lastUpdate: new Date(),
        delayMinutes: response.data.eta.delayMinutes,
        delayReason: response.data.eta.delayReason
      };
    } catch (error: any) {
      console.error(`Error updating ETA for ${deliveryId}:`, error.message);
      return null;
    }
  }

  /**
   * Récupérer la position GPS actuelle d'une livraison
   */
  async getGPSPosition(deliveryId: string): Promise<{
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  } | null> {
    try {
      const response = await axios.get(
        `${this.trackingApiUrl}/tracking/${deliveryId}/position`,
        {
          timeout: 5000
        }
      );

      if (!response.data || !response.data.position) {
        return null;
      }

      return {
        lat: response.data.position.lat,
        lng: response.data.position.lng,
        timestamp: new Date(response.data.position.timestamp || Date.now()),
        speed: response.data.position.speed,
        heading: response.data.position.heading
      };
    } catch (error: any) {
      console.error(`Error fetching GPS position for ${deliveryId}:`, error.message);
      return null;
    }
  }

  /**
   * Calculer la distance restante entre la position actuelle et la destination
   */
  calculateDistanceRemaining(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number
  ): number {
    // Formule de Haversine pour calculer la distance entre deux points GPS
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(destLat - currentLat);
    const dLng = this.toRad(destLng - currentLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(currentLat)) *
        Math.cos(this.toRad(destLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
  }

  /**
   * Convertir des degrés en radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculer le temps restant estimé en fonction de la distance et de la vitesse
   */
  calculateTimeRemaining(distanceKm: number, speedKmh: number): number {
    if (speedKmh <= 0) {
      return 0;
    }

    const timeHours = distanceKm / speedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    return timeMinutes;
  }

  /**
   * Vérifier si une livraison approche de sa destination (< 30 min)
   */
  isDeliveryArriving(eta: Date): boolean {
    const now = Date.now();
    const etaTime = eta.getTime();
    const timeRemaining = etaTime - now;

    // Moins de 30 minutes
    return timeRemaining > 0 && timeRemaining <= 30 * 60 * 1000;
  }

  /**
   * Vérifier si une livraison est en retard
   */
  isDeliveryDelayed(eta: Date, scheduledDate: Date): boolean {
    return eta.getTime() > scheduledDate.getTime();
  }

  /**
   * Calculer le retard en minutes
   */
  calculateDelayMinutes(eta: Date, scheduledDate: Date): number {
    const delayMs = eta.getTime() - scheduledDate.getTime();
    return Math.round(delayMs / 60000);
  }

  /**
   * Obtenir l'historique de tracking d'une livraison
   */
  async getTrackingHistory(deliveryId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.trackingApiUrl}/tracking/${deliveryId}/history`,
        {
          timeout: 5000
        }
      );

      return response.data.history || [];
    } catch (error: any) {
      console.error(`Error fetching tracking history for ${deliveryId}:`, error.message);
      return [];
    }
  }

  /**
   * Abonner un destinataire aux mises à jour de tracking en temps réel
   */
  async subscribeToTracking(deliveryId: string, recipientId: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.trackingApiUrl}/tracking/${deliveryId}/subscribe`,
        {
          recipientId,
          subscriptionType: 'recipient'
        },
        {
          timeout: 5000
        }
      );

      return true;
    } catch (error: any) {
      console.error(`Error subscribing to tracking for ${deliveryId}:`, error.message);
      return false;
    }
  }

  /**
   * Se désabonner des mises à jour de tracking
   */
  async unsubscribeFromTracking(deliveryId: string, recipientId: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.trackingApiUrl}/tracking/${deliveryId}/unsubscribe`,
        {
          recipientId
        },
        {
          timeout: 5000
        }
      );

      return true;
    } catch (error: any) {
      console.error(`Error unsubscribing from tracking for ${deliveryId}:`, error.message);
      return false;
    }
  }
}

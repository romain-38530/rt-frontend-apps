import axios from 'axios';
import { IDeliverySignature } from '../models/DeliverySignature';
import { IDelivery } from '../models/Delivery';

interface QRCodeInfo {
  valid: boolean;
  deliveryId?: string;
  cmrId?: string;
  orderId?: string;
  error?: string;
}

interface ECMRSignResult {
  success: boolean;
  cmrId?: string;
  ecmrUrl?: string;
  error?: string;
}

export class SignatureService {
  private ecmrApiUrl: string;
  private notificationsApiUrl: string;

  constructor() {
    this.ecmrApiUrl = process.env.ECMR_API_URL || 'http://localhost:3008';
    this.notificationsApiUrl = process.env.NOTIFICATIONS_API_URL || 'http://localhost:3013';
  }

  /**
   * Décoder les données d'un QR code CMR
   */
  async decodeQRCode(qrCodeData: string): Promise<QRCodeInfo> {
    try {
      // Le QR code contient les informations encodées en JSON
      const decoded = JSON.parse(Buffer.from(qrCodeData, 'base64').toString('utf-8'));

      if (!decoded.deliveryId || !decoded.cmrId) {
        return {
          valid: false,
          error: 'Invalid QR code format: missing required fields'
        };
      }

      // Vérifier auprès de l'API eCMR que le CMR existe
      const cmrExists = await this.verifyCMRExists(decoded.cmrId);

      if (!cmrExists) {
        return {
          valid: false,
          error: 'CMR not found in system'
        };
      }

      return {
        valid: true,
        deliveryId: decoded.deliveryId,
        cmrId: decoded.cmrId,
        orderId: decoded.orderId
      };
    } catch (error: any) {
      console.error('Error decoding QR code:', error.message);
      return {
        valid: false,
        error: 'Invalid QR code format'
      };
    }
  }

  /**
   * Vérifier qu'un CMR existe dans le système
   */
  private async verifyCMRExists(cmrId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.ecmrApiUrl}/ecmr/${cmrId}`,
        {
          timeout: 5000
        }
      );

      return response.status === 200;
    } catch (error: any) {
      console.error(`Error verifying CMR ${cmrId}:`, error.message);
      return false;
    }
  }

  /**
   * Signer un eCMR avec la signature du destinataire
   */
  async signECMR(
    deliveryId: string,
    signatureId: string,
    reservations?: string
  ): Promise<ECMRSignResult> {
    try {
      const response = await axios.post(
        `${this.ecmrApiUrl}/ecmr/sign`,
        {
          deliveryId,
          signatureId,
          signedBy: 'recipient',
          reservations,
          timestamp: new Date()
        },
        {
          timeout: 10000
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          cmrId: response.data.cmrId,
          ecmrUrl: response.data.ecmrUrl
        };
      }

      return {
        success: false,
        error: 'Failed to sign eCMR'
      };
    } catch (error: any) {
      console.error(`Error signing eCMR for delivery ${deliveryId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer un eCMR signé
   */
  async getSignedECMR(cmrId: string): Promise<{
    success: boolean;
    ecmr?: any;
    url?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.ecmrApiUrl}/ecmr/${cmrId}`,
        {
          timeout: 5000
        }
      );

      return {
        success: true,
        ecmr: response.data,
        url: response.data.documentUrl
      };
    } catch (error: any) {
      console.error(`Error fetching eCMR ${cmrId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer les notifications après signature
   */
  async sendSignatureNotifications(
    signature: IDeliverySignature,
    delivery: IDelivery
  ): Promise<void> {
    try {
      const notificationData = {
        deliveryId: delivery.deliveryId,
        signatureId: signature.signatureId,
        signatureType: signature.type,
        recipientId: signature.recipientId,
        transporterId: delivery.transport.carrierId,
        industrialId: delivery.industrialId,
        supplierId: delivery.supplierId,
        timestamp: signature.timestamp,
        reservations: signature.reservations
      };

      // Notifier le transporteur
      if (delivery.transport.carrierId) {
        await this.sendNotification(
          'transporter',
          delivery.transport.carrierId,
          'Livraison signée',
          `La livraison ${delivery.deliveryId} a été signée par le destinataire`,
          notificationData
        );
      }

      // Notifier l'industriel
      await this.sendNotification(
        'industrial',
        delivery.industrialId,
        'Livraison signée',
        `La livraison ${delivery.deliveryId} a été signée`,
        notificationData
      );

      // Notifier le fournisseur si présent
      if (delivery.supplierId) {
        await this.sendNotification(
          'supplier',
          delivery.supplierId,
          'Livraison signée',
          `La livraison ${delivery.deliveryId} a été signée par le destinataire`,
          notificationData
        );
      }

      // En cas de refus ou réception partielle, envoyer une alerte urgente
      if (signature.type === 'refusal' || signature.type === 'partial_reception') {
        await this.sendUrgentAlert(signature, delivery);
      }
    } catch (error: any) {
      console.error('Error sending signature notifications:', error.message);
      // Ne pas faire échouer la signature si les notifications échouent
    }
  }

  /**
   * Envoyer une notification à un acteur
   */
  private async sendNotification(
    recipientType: string,
    recipientId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsApiUrl}/notifications/send`,
        {
          recipientType,
          recipientId,
          title,
          message,
          data,
          priority: 'normal'
        },
        {
          timeout: 5000
        }
      );
    } catch (error: any) {
      console.error(`Error sending notification to ${recipientType} ${recipientId}:`, error.message);
    }
  }

  /**
   * Envoyer une alerte urgente en cas de refus ou problème
   */
  private async sendUrgentAlert(
    signature: IDeliverySignature,
    delivery: IDelivery
  ): Promise<void> {
    try {
      const alertData = {
        deliveryId: delivery.deliveryId,
        signatureId: signature.signatureId,
        signatureType: signature.type,
        reason: signature.refusalDetails?.reason || 'partial_reception',
        detailedReason: signature.refusalDetails?.detailedReason || signature.reservations,
        timestamp: signature.timestamp
      };

      // Alerte transporteur
      if (delivery.transport.carrierId) {
        await axios.post(
          `${this.notificationsApiUrl}/alerts/urgent`,
          {
            recipientType: 'transporter',
            recipientId: delivery.transport.carrierId,
            alertType: signature.type === 'refusal' ? 'delivery_refused' : 'partial_reception',
            title: signature.type === 'refusal' ? 'ALERTE: Livraison refusée' : 'ALERTE: Réception partielle',
            message: `La livraison ${delivery.deliveryId} nécessite votre attention immédiate`,
            data: alertData,
            priority: 'urgent',
            channels: ['email', 'sms', 'push']
          },
          {
            timeout: 5000
          }
        );
      }

      // Alerte industriel
      await axios.post(
        `${this.notificationsApiUrl}/alerts/urgent`,
        {
          recipientType: 'industrial',
          recipientId: delivery.industrialId,
          alertType: signature.type === 'refusal' ? 'delivery_refused' : 'partial_reception',
          title: signature.type === 'refusal' ? 'ALERTE: Livraison refusée' : 'ALERTE: Réception partielle',
          message: `La livraison ${delivery.deliveryId} a été ${signature.type === 'refusal' ? 'refusée' : 'partiellement acceptée'}`,
          data: alertData,
          priority: 'urgent',
          channels: ['email', 'push']
        },
        {
          timeout: 5000
        }
      );
    } catch (error: any) {
      console.error('Error sending urgent alert:', error.message);
    }
  }

  /**
   * Valider une signature (qualité, format, etc.)
   */
  validateSignatureData(signatureData: string): {
    valid: boolean;
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    errors: string[];
  } {
    const errors: string[] = [];

    // Vérifier que c'est du base64 valide
    if (!signatureData || !this.isBase64(signatureData)) {
      errors.push('Signature data must be valid base64');
      return { valid: false, errors };
    }

    // Vérifier la taille minimale (au moins 100 caractères pour une vraie signature)
    if (signatureData.length < 100) {
      errors.push('Signature data is too short');
    }

    // Évaluer la qualité (simple heuristique basée sur la longueur)
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (signatureData.length > 1000) {
      quality = 'excellent';
    } else if (signatureData.length > 500) {
      quality = 'good';
    } else if (signatureData.length > 200) {
      quality = 'fair';
    } else {
      quality = 'poor';
      errors.push('Signature quality is poor');
    }

    return {
      valid: errors.length === 0,
      quality,
      errors
    };
  }

  /**
   * Vérifier si une chaîne est du base64 valide
   */
  private isBase64(str: string): boolean {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch {
      return false;
    }
  }

  /**
   * Générer un QR code pour une livraison (côté transporteur)
   */
  generateQRCode(deliveryId: string, cmrId: string, orderId: string): string {
    const data = {
      deliveryId,
      cmrId,
      orderId,
      timestamp: new Date().toISOString()
    };

    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
}

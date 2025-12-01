import axios from 'axios';
import { createNotification } from '../routes/notifications';

interface NotificationOptions {
  title: string;
  message: string;
  type: 'delivery' | 'incident' | 'eta_update' | 'signature' | 'chat' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('email' | 'sms' | 'push')[];
  data?: any;
}

export class NotificationService {
  private notificationsApiUrl: string;

  constructor() {
    this.notificationsApiUrl = process.env.NOTIFICATIONS_API_URL || 'http://localhost:3013';
  }

  /**
   * Envoyer une notification à un destinataire
   */
  async sendNotification(
    recipientId: string,
    options: NotificationOptions
  ): Promise<boolean> {
    try {
      // Créer la notification dans le système local
      createNotification(
        recipientId,
        options.type,
        options.title,
        options.message,
        options.priority || 'normal',
        options.data
      );

      // Envoyer via l'API externe si des canaux spécifiques sont demandés
      if (options.channels && options.channels.length > 0) {
        await axios.post(
          `${this.notificationsApiUrl}/notifications/send`,
          {
            recipientType: 'recipient',
            recipientId,
            title: options.title,
            message: options.message,
            data: options.data,
            priority: options.priority || 'normal',
            channels: options.channels
          },
          {
            timeout: 5000
          }
        );
      }

      return true;
    } catch (error: any) {
      console.error(`Error sending notification to ${recipientId}:`, error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de mise à jour d'ETA
   */
  async sendETAUpdateNotification(
    recipientId: string,
    deliveryId: string,
    newETA: Date,
    delayMinutes?: number
  ): Promise<void> {
    const isDelayed = delayMinutes && delayMinutes > 0;
    const priority = delayMinutes && delayMinutes > 30 ? 'high' : 'normal';

    await this.sendNotification(recipientId, {
      title: isDelayed ? 'Retard de livraison' : 'Mise à jour ETA',
      message: isDelayed
        ? `Votre livraison ${deliveryId} est retardée de ${delayMinutes} minutes. Nouvelle ETA: ${newETA.toLocaleString('fr-FR')}`
        : `Nouvelle heure d'arrivée estimée: ${newETA.toLocaleString('fr-FR')}`,
      type: 'eta_update',
      priority,
      channels: isDelayed ? ['email', 'push'] : ['push'],
      data: {
        deliveryId,
        newETA,
        delayMinutes,
        isDelayed
      }
    });
  }

  /**
   * Envoyer une notification d'arrivée imminente
   */
  async sendArrivingNotification(
    recipientId: string,
    deliveryId: string,
    eta: Date,
    minutesRemaining: number
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: 'Livraison en approche',
      message: `Votre livraison ${deliveryId} arrivera dans environ ${minutesRemaining} minutes`,
      type: 'delivery',
      priority: 'high',
      channels: ['push', 'sms'],
      data: {
        deliveryId,
        eta,
        minutesRemaining,
        status: 'arriving'
      }
    });
  }

  /**
   * Envoyer une notification d'arrivée
   */
  async sendArrivedNotification(
    recipientId: string,
    deliveryId: string,
    driverName?: string,
    vehiclePlate?: string
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: 'Livraison arrivée',
      message: `Votre livraison ${deliveryId} est arrivée${driverName ? ` (Chauffeur: ${driverName})` : ''}`,
      type: 'delivery',
      priority: 'urgent',
      channels: ['push', 'sms'],
      data: {
        deliveryId,
        driverName,
        vehiclePlate,
        status: 'arrived'
      }
    });
  }

  /**
   * Envoyer une notification de signature complétée
   */
  async sendSignatureCompletedNotification(
    recipientId: string,
    deliveryId: string,
    signatureType: string
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: 'Livraison signée',
      message: `La livraison ${deliveryId} a été signée avec succès`,
      type: 'signature',
      priority: 'normal',
      channels: ['email', 'push'],
      data: {
        deliveryId,
        signatureType
      }
    });
  }

  /**
   * Envoyer une notification d'incident
   */
  async sendIncidentNotification(
    recipientId: string,
    incidentId: string,
    deliveryId: string,
    severity: string,
    title: string
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: `Incident ${severity.toUpperCase()}`,
      message: `Incident déclaré pour la livraison ${deliveryId}: ${title}`,
      type: 'incident',
      priority: severity === 'critical' ? 'urgent' : 'high',
      channels: severity === 'critical' ? ['email', 'sms', 'push'] : ['email', 'push'],
      data: {
        incidentId,
        deliveryId,
        severity,
        title
      }
    });
  }

  /**
   * Envoyer une notification de résolution d'incident
   */
  async sendIncidentResolvedNotification(
    recipientId: string,
    incidentId: string,
    deliveryId: string,
    resolution: string
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: 'Incident résolu',
      message: `L'incident ${incidentId} a été résolu: ${resolution}`,
      type: 'incident',
      priority: 'normal',
      channels: ['email', 'push'],
      data: {
        incidentId,
        deliveryId,
        resolution
      }
    });
  }

  /**
   * Envoyer une notification de nouveau message dans le chat
   */
  async sendChatMessageNotification(
    recipientId: string,
    chatId: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title: `Nouveau message de ${senderName}`,
      message: messagePreview,
      type: 'chat',
      priority: 'normal',
      channels: ['push'],
      data: {
        chatId,
        senderName
      }
    });
  }

  /**
   * Envoyer une notification système
   */
  async sendSystemNotification(
    recipientId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    await this.sendNotification(recipientId, {
      title,
      message,
      type: 'system',
      priority,
      channels: priority === 'urgent' ? ['email', 'push'] : ['push']
    });
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(
    email: string,
    contactName: string,
    companyName: string,
    recipientId: string
  ): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsApiUrl}/emails/send`,
        {
          to: email,
          subject: `Bienvenue sur RT Technologie - ${companyName}`,
          template: 'recipient_welcome',
          data: {
            contactName,
            companyName,
            recipientId,
            dashboardUrl: `${process.env.FRONTEND_RECIPIENT_URL}/dashboard`,
            supportEmail: 'support@rt-technologie.com'
          }
        },
        {
          timeout: 10000
        }
      );
    } catch (error: any) {
      console.error('Error sending welcome email:', error.message);
    }
  }

  /**
   * Envoyer un résumé quotidien par email
   */
  async sendDailySummaryEmail(
    recipientId: string,
    email: string,
    summary: {
      deliveriesToday: number;
      deliveriesCompleted: number;
      deliveriesPending: number;
      incidentsOpen: number;
      unreadMessages: number;
    }
  ): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsApiUrl}/emails/send`,
        {
          to: email,
          subject: 'Résumé quotidien de vos livraisons',
          template: 'recipient_daily_summary',
          data: {
            recipientId,
            summary,
            date: new Date().toLocaleDateString('fr-FR'),
            dashboardUrl: `${process.env.FRONTEND_RECIPIENT_URL}/dashboard`
          }
        },
        {
          timeout: 10000
        }
      );
    } catch (error: any) {
      console.error('Error sending daily summary email:', error.message);
    }
  }

  /**
   * Envoyer un résumé hebdomadaire par email
   */
  async sendWeeklySummaryEmail(
    recipientId: string,
    email: string,
    summary: {
      totalDeliveries: number;
      deliveriesCompleted: number;
      averageDeliveryTime: number;
      incidentsTotal: number;
      incidentsResolved: number;
      topCarriers: Array<{ name: string; deliveries: number }>;
    }
  ): Promise<void> {
    try {
      await axios.post(
        `${this.notificationsApiUrl}/emails/send`,
        {
          to: email,
          subject: 'Résumé hebdomadaire de vos livraisons',
          template: 'recipient_weekly_summary',
          data: {
            recipientId,
            summary,
            weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
            weekEnd: new Date().toLocaleDateString('fr-FR'),
            dashboardUrl: `${process.env.FRONTEND_RECIPIENT_URL}/dashboard`
          }
        },
        {
          timeout: 10000
        }
      );
    } catch (error: any) {
      console.error('Error sending weekly summary email:', error.message);
    }
  }

  /**
   * Obtenir les préférences de notification d'un destinataire
   */
  async getNotificationPreferences(recipientId: string): Promise<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    etaAlerts: boolean;
    incidentAlerts: boolean;
    deliveryConfirmations: boolean;
  }> {
    try {
      // Récupérer depuis le modèle Recipient
      const { Recipient } = await import('../models/Recipient');
      const recipient = await Recipient.findOne({ recipientId });

      if (!recipient) {
        // Préférences par défaut
        return {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          etaAlerts: true,
          incidentAlerts: true,
          deliveryConfirmations: true
        };
      }

      return recipient.settings.notifications;
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error.message);
      return {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        etaAlerts: true,
        incidentAlerts: true,
        deliveryConfirmations: true
      };
    }
  }

  /**
   * Vérifier si un type de notification est activé pour un destinataire
   */
  async isNotificationEnabled(
    recipientId: string,
    notificationType: 'eta' | 'incident' | 'delivery'
  ): Promise<boolean> {
    const prefs = await this.getNotificationPreferences(recipientId);

    switch (notificationType) {
      case 'eta':
        return prefs.etaAlerts;
      case 'incident':
        return prefs.incidentAlerts;
      case 'delivery':
        return prefs.deliveryConfirmations;
      default:
        return true;
    }
  }
}

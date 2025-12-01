import nodemailer from 'nodemailer';
import axios from 'axios';
import Supplier from '../models/Supplier';

export interface INotification {
  supplierId: string;
  type: 'order' | 'slot' | 'signature' | 'message' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
  channels: ('email' | 'push' | 'sms')[];
}

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Envoie une notification multi-canal
   */
  async sendNotification(notification: INotification) {
    const supplier = await Supplier.findOne({ supplierId: notification.supplierId });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Vérifier les préférences de notification
    if (!supplier.settings.notifications) {
      console.log(`Notifications disabled for supplier ${notification.supplierId}`);
      return;
    }

    const results = {
      email: false,
      push: false,
      sms: false
    };

    // Envoyer par email
    if (notification.channels.includes('email') && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        await this.sendEmailNotification(supplier, notification);
        results.email = true;
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
    }

    // Envoyer notification push
    if (notification.channels.includes('push')) {
      try {
        await this.sendPushNotification(supplier, notification);
        results.push = true;
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    // Envoyer SMS
    if (notification.channels.includes('sms') && process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      try {
        await this.sendSMSNotification(supplier, notification);
        results.sms = true;
      } catch (error) {
        console.error('Error sending SMS notification:', error);
      }
    }

    return results;
  }

  /**
   * Notification pour nouvelle commande
   */
  async notifyNewOrder(supplierId: string, orderId: string, orderDetails: any) {
    await this.sendNotification({
      supplierId,
      type: 'order',
      title: 'Nouvelle commande',
      message: `Vous avez reçu une nouvelle commande ${orderId}`,
      priority: 'high',
      data: orderDetails,
      channels: ['email', 'push']
    });
  }

  /**
   * Notification pour créneau proposé
   */
  async notifySlotProposed(supplierId: string, slotId: string, slotDetails: any) {
    await this.sendNotification({
      supplierId,
      type: 'slot',
      title: 'Nouveau créneau de chargement',
      message: `Un créneau de chargement vous a été proposé pour le ${slotDetails.date}`,
      priority: 'high',
      data: slotDetails,
      channels: ['email', 'push', 'sms']
    });
  }

  /**
   * Notification pour créneau accepté
   */
  async notifySlotAccepted(supplierId: string, slotId: string, slotDetails: any) {
    await this.sendNotification({
      supplierId,
      type: 'slot',
      title: 'Créneau confirmé',
      message: `Votre créneau de chargement du ${slotDetails.date} a été confirmé`,
      priority: 'medium',
      data: slotDetails,
      channels: ['email', 'push']
    });
  }

  /**
   * Notification pour rappel de chargement
   */
  async notifyLoadingReminder(supplierId: string, orderId: string, slotDetails: any) {
    await this.sendNotification({
      supplierId,
      type: 'slot',
      title: 'Rappel de chargement',
      message: `Rappel: Chargement prévu aujourd'hui à ${slotDetails.startTime}`,
      priority: 'urgent',
      data: slotDetails,
      channels: ['email', 'push', 'sms']
    });
  }

  /**
   * Notification pour nouveau message
   */
  async notifyNewMessage(supplierId: string, chatId: string, senderName: string, preview: string) {
    await this.sendNotification({
      supplierId,
      type: 'message',
      title: `Nouveau message de ${senderName}`,
      message: preview,
      priority: 'medium',
      data: { chatId },
      channels: ['push']
    });
  }

  /**
   * Notification pour signature requise
   */
  async notifySignatureRequired(supplierId: string, orderId: string, type: string) {
    await this.sendNotification({
      supplierId,
      type: 'signature',
      title: 'Signature requise',
      message: `Une signature est requise pour la commande ${orderId}`,
      priority: 'high',
      data: { orderId, type },
      channels: ['email', 'push']
    });
  }

  /**
   * Envoie un email de notification
   */
  private async sendEmailNotification(supplier: any, notification: INotification) {
    const primaryContact = supplier.contacts.find((c: any) => c.isPrimary);
    if (!primaryContact) {
      throw new Error('No primary contact found');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: primaryContact.email,
      subject: `[RT Technologie] ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${this.getPriorityColor(notification.priority)}; color: white; padding: 20px; border-radius: 4px 4px 0 0;">
            <h2 style="margin: 0;">${notification.title}</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;">
            <p style="font-size: 16px; line-height: 1.6;">${notification.message}</p>
            ${notification.data ? `
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <strong>Détails:</strong>
                <pre style="margin: 10px 0; overflow-x: auto;">${JSON.stringify(notification.data, null, 2)}</pre>
              </div>
            ` : ''}
            <p style="margin-top: 30px;">
              <a href="${process.env.SUPPLIER_PORTAL_URL}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Accéder au portail
              </a>
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            RT Technologie - Portail Fournisseur<br>
            ${supplier.companyName}
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Envoie une notification push
   */
  private async sendPushNotification(supplier: any, notification: INotification) {
    // Dans un cas réel, on utiliserait Firebase Cloud Messaging ou un service similaire
    console.log('Push notification:', {
      supplierId: supplier.supplierId,
      title: notification.title,
      message: notification.message,
      priority: notification.priority
    });
  }

  /**
   * Envoie un SMS
   */
  private async sendSMSNotification(supplier: any, notification: INotification) {
    // Dans un cas réel, on utiliserait Twilio, AWS SNS ou un service similaire
    const primaryContact = supplier.contacts.find((c: any) => c.isPrimary);
    if (!primaryContact) {
      throw new Error('No primary contact found');
    }

    console.log('SMS notification:', {
      to: primaryContact.phone,
      message: `[RT Tech] ${notification.title}: ${notification.message}`
    });
  }

  /**
   * Retourne la couleur selon la priorité
   */
  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#1976d2';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  }

  /**
   * Templates de messages prédéfinis
   */
  getMessageTemplates() {
    return {
      loading_ready: {
        title: 'Chargement prêt',
        message: 'La marchandise est prête pour le chargement'
      },
      delay_production: {
        title: 'Retard de production',
        message: 'Nous rencontrons un retard dans la préparation de votre commande'
      },
      missing_documents: {
        title: 'Documents manquants',
        message: 'Des documents sont manquants pour finaliser la commande'
      },
      quality_issue: {
        title: 'Problème qualité',
        message: 'Un problème de qualité a été détecté sur la marchandise'
      },
      early_loading: {
        title: 'Chargement anticipé possible',
        message: 'Le chargement peut être effectué plus tôt que prévu'
      }
    };
  }
}

export default new NotificationService();

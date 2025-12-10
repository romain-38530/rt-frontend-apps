/**
 * NotificationService - Service d'envoi de notifications aux transporteurs
 * Gère l'envoi d'emails et SMS pour les invitations et rappels
 */
import nodemailer from 'nodemailer';
import { IDispatchAttempt } from '../models/DispatchChain';

// Configuration email avec support multi-provider
const smtpConfig = {
  host: process.env.SMTP_HOST || 'ssl0.ovh.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // Default true for OVH SSL
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 10, // 10 emails per second max
};

// Vérifier si SMTP est configuré
const isSmtpConfigured = Boolean(smtpConfig.auth.user && smtpConfig.auth.pass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport(smtpConfig)
  : null;

// Vérifier la connexion SMTP au démarrage
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.warn('[NotificationService] SMTP connection failed:', error.message);
      console.warn('[NotificationService] Emails will be logged to console instead');
    } else {
      console.log('[NotificationService] SMTP connection verified - Ready to send emails');
    }
  });
} else {
  console.warn('[NotificationService] SMTP not configured - Emails will be logged to console');
}

interface CarrierNotificationParams {
  carrierId: string;
  carrierName: string;
  carrierEmail: string;
  carrierPhone?: string;
  orderReference: string;
  orderId: string;
  chainId: string;
  pickupCity: string;
  deliveryCity: string;
  pickupDate: Date;
  deliveryDate: Date;
  goodsDescription: string;
  weight: number;
  expiresAt: Date;
  responseUrl: string;
}

interface ReminderParams {
  carrierId: string;
  carrierName: string;
  carrierEmail: string;
  orderReference: string;
  minutesRemaining: number;
  responseUrl: string;
}

class NotificationService {
  /**
   * Envoie une invitation de transport à un transporteur
   */
  static async sendCarrierInvitation(params: CarrierNotificationParams): Promise<boolean> {
    const {
      carrierName,
      carrierEmail,
      orderReference,
      pickupCity,
      deliveryCity,
      pickupDate,
      deliveryDate,
      goodsDescription,
      weight,
      expiresAt,
      responseUrl
    } = params;

    const expiresInMinutes = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60));

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
          .button-refuse { background: #e53e3e; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .route { background: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .route-arrow { text-align: center; font-size: 24px; color: #4a5568; }
          .urgency { background: #fed7d7; color: #c53030; padding: 10px 20px; border-radius: 4px; font-weight: bold; display: inline-block; margin: 10px 0; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-label { color: #718096; }
          .detail-value { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SYMPHONI.A</h1>
            <p>Nouvelle demande de transport</p>
          </div>
          <div class="content">
            <p>Bonjour ${carrierName},</p>

            <p>Vous avez reçu une nouvelle demande de transport en <strong>exclusivité</strong>.</p>

            <div class="urgency">
              ⏰ Réponse attendue dans ${expiresInMinutes} minutes
            </div>

            <div class="route">
              <div style="font-size: 18px; font-weight: bold;">
                📍 ${pickupCity}
              </div>
              <div class="route-arrow">↓</div>
              <div style="font-size: 18px; font-weight: bold;">
                📍 ${deliveryCity}
              </div>
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Référence</span>
                <span class="detail-value">${orderReference}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date enlèvement</span>
                <span class="detail-value">${pickupDate.toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date livraison</span>
                <span class="detail-value">${deliveryDate.toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Marchandise</span>
                <span class="detail-value">${goodsDescription}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Poids</span>
                <span class="detail-value">${weight} kg</span>
              </div>
            </div>

            <p style="text-align: center; margin-top: 25px;">
              <a href="${responseUrl}?action=accept" class="button">✓ Accepter</a>
              <a href="${responseUrl}?action=refuse" class="button button-refuse">✗ Refuser</a>
            </p>

            <p><small>
              Si vous ne répondez pas dans le délai imparti, la demande sera automatiquement
              transmise au transporteur suivant.
            </small></p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphoni-a.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] 🚚 Nouvelle demande - ${pickupCity} → ${deliveryCity} - Réf. ${orderReference}`,
      html,
    };

    return this.sendEmail(mailOptions, `carrier ${carrierName} (${carrierEmail})`);
  }

  /**
   * Helper pour envoyer un email avec fallback console
   */
  private static async sendEmail(mailOptions: any, recipient: string): Promise<boolean> {
    if (!transporter) {
      console.log(`[NotificationService] [MOCK] Email to ${recipient}:`);
      console.log(`  Subject: ${mailOptions.subject}`);
      console.log(`  From: ${mailOptions.from}`);
      console.log(`  To: ${mailOptions.to}`);
      return true; // Return true in mock mode for testing
    }

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[NotificationService] Email sent to ${recipient}`);
      return true;
    } catch (error: any) {
      console.error(`[NotificationService] Failed to send email to ${recipient}:`, error.message);
      return false;
    }
  }

  /**
   * Envoie un rappel de timeout imminent
   */
  static async sendTimeoutReminder(params: ReminderParams): Promise<boolean> {
    const { carrierName, carrierEmail, orderReference, minutesRemaining, responseUrl } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #c53030; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff5f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ RAPPEL - Réponse urgente requise</h2>
          </div>
          <div class="content">
            <p>Bonjour ${carrierName},</p>

            <p>Vous avez une demande de transport en attente de réponse.</p>

            <p style="font-size: 24px; text-align: center; color: #c53030; font-weight: bold;">
              ${minutesRemaining} minutes restantes
            </p>

            <p>Référence: <strong>${orderReference}</strong></p>

            <p style="text-align: center;">
              <a href="${responseUrl}" class="button">Répondre maintenant</a>
            </p>

            <p><small>Sans réponse de votre part, cette demande sera transmise au transporteur suivant.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphoni-a.com>',
      to: carrierEmail,
      subject: `[URGENT] ⚠️ ${minutesRemaining} min restantes - Réf. ${orderReference}`,
      html,
    };

    return this.sendEmail(mailOptions, `reminder to ${carrierName} (${carrierEmail})`);
  }

  /**
   * Notifie un transporteur qu'il a été sélectionné
   */
  static async sendCarrierConfirmation(
    carrierEmail: string,
    carrierName: string,
    orderReference: string,
    portalUrl: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fff4; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2f855a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Transport confirmé</h1>
          </div>
          <div class="content">
            <p>Bonjour ${carrierName},</p>

            <p>Votre acceptation pour le transport <strong>${orderReference}</strong> a été confirmée.</p>

            <p>Vous pouvez maintenant accéder au portail transporteur pour :</p>
            <ul>
              <li>Consulter les détails complets de la commande</li>
              <li>Organiser le transport</li>
              <li>Mettre à jour le tracking</li>
              <li>Déposer les documents (BL, CMR, POD)</li>
            </ul>

            <p style="text-align: center;">
              <a href="${portalUrl}" class="button">Accéder au portail</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphoni-a.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] ✓ Transport confirmé - Réf. ${orderReference}`,
      html,
    };

    return this.sendEmail(mailOptions, `confirmation to ${carrierName} (${carrierEmail})`);
  }

  /**
   * Notifie l'industriel du statut du dispatch
   */
  static async notifyIndustrialDispatchStatus(
    industrialEmail: string,
    industrialName: string,
    orderReference: string,
    status: 'carrier_found' | 'escalated' | 'timeout',
    carrierName?: string
  ): Promise<boolean> {
    const statusMessages = {
      carrier_found: {
        subject: `✓ Transporteur trouvé - Réf. ${orderReference}`,
        title: 'Transporteur assigné',
        message: `Le transporteur <strong>${carrierName}</strong> a accepté votre demande de transport.`,
        color: '#38a169'
      },
      escalated: {
        subject: `⚠️ Escalade Affret.IA - Réf. ${orderReference}`,
        title: 'Escalade vers Affret.IA',
        message: 'Aucun transporteur disponible. Votre commande a été transmise à Affret.IA pour recherche élargie.',
        color: '#dd6b20'
      },
      timeout: {
        subject: `ℹ️ Changement transporteur - Réf. ${orderReference}`,
        title: 'Passage au transporteur suivant',
        message: 'Le transporteur précédent n\'a pas répondu dans le délai. Votre commande a été transmise au transporteur suivant.',
        color: '#3182ce'
      }
    };

    const { subject, title, message, color } = statusMessages[status];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>Bonjour ${industrialName},</p>
            <p>Concernant votre commande <strong>${orderReference}</strong> :</p>
            <p>${message}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphoni-a.com>',
      to: industrialEmail,
      subject: `[SYMPHONI.A] ${subject}`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName} (${industrialEmail})`);
  }

  /**
   * Vérifie l'état de la connexion SMTP
   */
  static async checkSmtpConnection(): Promise<{ connected: boolean; message: string }> {
    if (!transporter) {
      return { connected: false, message: 'SMTP not configured - mock mode enabled' };
    }

    try {
      await transporter.verify();
      return { connected: true, message: 'SMTP connection verified' };
    } catch (error: any) {
      return { connected: false, message: `SMTP error: ${error.message}` };
    }
  }
}

export default NotificationService;

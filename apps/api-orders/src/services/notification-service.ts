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
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
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
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
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
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
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
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
      to: industrialEmail,
      subject: `[SYMPHONI.A] ${subject}`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName} (${industrialEmail})`);
  }

  /**
   * Envoie une demande de validation de préfacture à l'industriel
   */
  static async sendPreInvoiceValidationRequest(
    industrialEmail: string,
    industrialName: string,
    preInvoiceNumber: string,
    carrierName: string,
    totalAmount: number,
    kpis: any,
    orderCount: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Préfacture à valider</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Réf: ${preInvoiceNumber}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${industrialName},</p>
            <p>La préfacture du transporteur <strong>${carrierName}</strong> est prête pour validation.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Résumé</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;">Nombre de commandes:</td><td style="text-align: right;"><strong>${orderCount}</strong></td></tr>
                <tr><td style="padding: 8px 0;">Montant total TTC:</td><td style="text-align: right;"><strong>${totalAmount.toFixed(2)} €</strong></td></tr>
              </table>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0;">KPIs Transporteur</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0;">Ponctualité enlèvement:</td><td style="text-align: right;">${kpis.onTimePickupRate}%</td></tr>
                <tr><td style="padding: 5px 0;">Ponctualité livraison:</td><td style="text-align: right;">${kpis.onTimeDeliveryRate}%</td></tr>
                <tr><td style="padding: 5px 0;">Documents complets:</td><td style="text-align: right;">${kpis.documentsCompleteRate}%</td></tr>
                <tr><td style="padding: 5px 0;">Sans incident:</td><td style="text-align: right;">${kpis.incidentFreeRate}%</td></tr>
                <tr><td style="padding: 5px 0;">Heures d'attente totales:</td><td style="text-align: right;">${kpis.totalWaitingHours}h</td></tr>
              </table>
            </div>

            <p>Merci de valider cette préfacture dans les meilleurs délais.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.PORTAL_URL || 'https://portail.symphonia-controltower.com'}/preinvoices/${preInvoiceNumber}"
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Valider la préfacture
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: industrialEmail,
      subject: `[SYMPHONI.A] Préfacture ${preInvoiceNumber} - ${carrierName} - ${totalAmount.toFixed(2)}€ à valider`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName}`);
  }

  /**
   * Notifie le transporteur que sa préfacture est validée
   */
  static async notifyCarrierPreInvoiceValidated(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    totalAmount: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Préfacture validée</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Réf: ${preInvoiceNumber}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${carrierName},</p>
            <p>Votre préfacture <strong>${preInvoiceNumber}</strong> a été validée par l'industriel.</p>
            <p>Montant validé: <strong>${totalAmount.toFixed(2)} €</strong></p>
            <p>Vous pouvez maintenant déposer votre facture sur le portail.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphonia-controltower.com'}/preinvoices/${preInvoiceNumber}"
                 style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Déposer ma facture
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] Préfacture ${preInvoiceNumber} validée - Déposez votre facture`,
      html,
    };

    return this.sendEmail(mailOptions, `carrier ${carrierName}`);
  }

  /**
   * Notifie le transporteur que sa facture est acceptée
   */
  static async notifyCarrierInvoiceAccepted(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    amount: number,
    dueDate: Date
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Facture acceptée</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${carrierName},</p>
            <p>Votre facture pour la préfacture <strong>${preInvoiceNumber}</strong> a été acceptée.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Montant:</strong> ${amount.toFixed(2)} €</p>
              <p><strong>Date de paiement prévue:</strong> ${dueDate.toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] Facture acceptée - Paiement prévu le ${dueDate.toLocaleDateString('fr-FR')}`,
      html,
    };

    return this.sendEmail(mailOptions, `carrier ${carrierName}`);
  }

  /**
   * Notifie le transporteur que sa facture est rejetée
   */
  static async notifyCarrierInvoiceRejected(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    expectedAmount: number,
    invoiceAmount: number,
    difference: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Facture rejetée - Écart de montant</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${carrierName},</p>
            <p>Votre facture pour la préfacture <strong>${preInvoiceNumber}</strong> présente un écart de montant.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Montant préfacture:</strong> ${expectedAmount.toFixed(2)} €</p>
              <p><strong>Montant facture:</strong> ${invoiceAmount.toFixed(2)} €</p>
              <p><strong>Écart:</strong> ${difference.toFixed(2)} €</p>
            </div>
            <p>Merci de corriger votre facture et de la redéposer.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] Facture rejetée - Écart de ${Math.abs(difference).toFixed(2)}€`,
      html,
    };

    return this.sendEmail(mailOptions, `carrier ${carrierName}`);
  }

  /**
   * Notifie l'industriel qu'une facture transporteur a été déposée
   */
  static async notifyIndustrialInvoiceUploaded(
    industrialEmail: string,
    industrialName: string,
    preInvoiceNumber: string,
    carrierName: string,
    invoiceNumber: string,
    invoiceAmount: number,
    preInvoiceAmount: number
  ): Promise<boolean> {
    const difference = invoiceAmount - preInvoiceAmount;
    const differencePercent = Math.abs(difference / preInvoiceAmount * 100).toFixed(1);
    const statusColor = Math.abs(difference / preInvoiceAmount) <= 0.01 ? '#10b981' : '#f59e0b';
    const statusText = Math.abs(difference / preInvoiceAmount) <= 0.01 ? 'Acceptation automatique' : 'Vérification requise';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">📄 Facture transporteur reçue</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${industrialName},</p>
            <p>Le transporteur <strong>${carrierName}</strong> a déposé sa facture pour la préfacture <strong>${preInvoiceNumber}</strong>.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColor};">
              <p style="margin: 0 0 10px 0;"><strong>N° Facture:</strong> ${invoiceNumber}</p>
              <p style="margin: 0 0 10px 0;"><strong>Montant préfacture:</strong> ${preInvoiceAmount.toFixed(2)} €</p>
              <p style="margin: 0 0 10px 0;"><strong>Montant facture:</strong> ${invoiceAmount.toFixed(2)} €</p>
              <p style="margin: 0 0 10px 0;"><strong>Écart:</strong> ${difference >= 0 ? '+' : ''}${difference.toFixed(2)} € (${differencePercent}%)</p>
              <p style="margin: 0; padding: 8px; background: ${statusColor}20; border-radius: 4px; color: ${statusColor}; font-weight: bold;">
                ${statusText}
              </p>
            </div>

            <p>Le contrôle automatique a été effectué. Si la facture est acceptée, le décompte de paiement (30 jours) démarre automatiquement.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: industrialEmail,
      subject: `[SYMPHONI.A] 📄 Facture ${carrierName} reçue - ${preInvoiceNumber}`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName}`);
  }

  /**
   * Notifie le transporteur du paiement envoyé
   */
  static async notifyCarrierPaymentSent(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    amount: number,
    paymentReference: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Paiement effectué</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${carrierName},</p>
            <p>Le paiement de votre facture pour la préfacture <strong>${preInvoiceNumber}</strong> a été effectué.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Montant:</strong> ${amount.toFixed(2)} €</p>
              <p><strong>Référence paiement:</strong> ${paymentReference}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: carrierEmail,
      subject: `[SYMPHONI.A] Paiement ${amount.toFixed(2)}€ effectué - Réf: ${paymentReference}`,
      html,
    };

    return this.sendEmail(mailOptions, `carrier ${carrierName}`);
  }

  /**
   * Rappel de paiement imminent à l'industriel
   */
  static async sendPaymentReminderToIndustrial(
    industrialEmail: string,
    industrialName: string,
    preInvoiceNumber: string,
    carrierName: string,
    amount: number,
    daysRemaining: number,
    dueDate: Date
  ): Promise<boolean> {
    const urgencyColor = daysRemaining <= 2 ? '#dc2626' : '#f59e0b';
    const urgencyText = daysRemaining <= 2 ? 'URGENT' : 'Rappel';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">⚠️ ${urgencyText} - Paiement à effectuer</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${industrialName},</p>
            <p>Le paiement de la préfacture <strong>${preInvoiceNumber}</strong> pour le transporteur <strong>${carrierName}</strong> arrive à échéance.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${urgencyColor};">
              <p style="font-size: 24px; margin: 0; color: ${urgencyColor}; font-weight: bold;">
                ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}
              </p>
              <p style="margin: 10px 0 0 0;"><strong>Montant:</strong> ${amount.toFixed(2)} €</p>
              <p style="margin: 5px 0 0 0;"><strong>Échéance:</strong> ${dueDate.toLocaleDateString('fr-FR')}</p>
            </div>

            <p>Merci de procéder au règlement dans les délais.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: industrialEmail,
      subject: `[${urgencyText}] Paiement ${preInvoiceNumber} - ${daysRemaining}j restants - ${amount.toFixed(2)}€`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName}`);
  }

  /**
   * Notification de paiement en retard
   */
  static async sendOverduePaymentAlert(
    industrialEmail: string,
    industrialName: string,
    preInvoiceNumber: string,
    carrierName: string,
    amount: number,
    daysOverdue: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #991b1b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🚨 RETARD DE PAIEMENT</h1>
          </div>
          <div style="background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${industrialName},</p>
            <p>Le paiement de la préfacture <strong>${preInvoiceNumber}</strong> pour le transporteur <strong>${carrierName}</strong> est en retard.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #991b1b;">
              <p style="font-size: 24px; margin: 0; color: #991b1b; font-weight: bold;">
                Retard: ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}
              </p>
              <p style="margin: 10px 0 0 0;"><strong>Montant dû:</strong> ${amount.toFixed(2)} €</p>
            </div>

            <p style="color: #991b1b; font-weight: bold;">Merci de régulariser cette situation dans les plus brefs délais.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SYMPHONI.A <billing@symphonia-controltower.com>',
      to: industrialEmail,
      subject: `[RETARD] Paiement ${preInvoiceNumber} - ${daysOverdue}j de retard - ${amount.toFixed(2)}€`,
      html,
    };

    return this.sendEmail(mailOptions, `industrial ${industrialName} (overdue)`);
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

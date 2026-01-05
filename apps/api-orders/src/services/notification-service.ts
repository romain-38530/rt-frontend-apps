/**
 * NotificationService - Service d'envoi de notifications via AWS SES
 * Utilise le design system SYMPHONI.A pour des emails professionnels
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { IDispatchAttempt } from '../models/DispatchChain';
import { EmailTemplates, generateEmailTemplate, COLORS, LINKS } from '../templates/email-design-system';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'SYMPHONI.A',
  replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com',
  billingFromEmail: process.env.SES_BILLING_FROM_EMAIL || 'facturation@symphonia-controltower.com'
};

// Client SES singleton
let sesClient: SESClient | null = null;

function getSESClient(): SESClient | null {
  if (sesClient) return sesClient;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    sesClient = new SESClient({
      region: SES_CONFIG.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    console.log(`[NotificationService] AWS SES configured for region: ${SES_CONFIG.region}`);
    return sesClient;
  }

  console.warn('[NotificationService] AWS SES not configured - emails will be logged only');
  return null;
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
  price?: number;
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
   * Helper pour envoyer un email via AWS SES avec fallback console
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    fromEmail?: string,
    logRecipient?: string
  ): Promise<boolean> {
    const client = getSESClient();
    const from = fromEmail || SES_CONFIG.fromEmail;
    const fromAddress = `${SES_CONFIG.fromName} <${from}>`;

    if (!client) {
      console.log(`[NotificationService] [MOCK] Email to ${logRecipient || to}:`);
      console.log(`  Subject: ${subject}`);
      console.log(`  From: ${fromAddress}`);
      console.log(`  To: ${to}`);
      return true;
    }

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
      ReplyToAddresses: [SES_CONFIG.replyTo],
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await client.send(command);
      console.log(`[NotificationService] Email sent to ${logRecipient || to}: ${response.MessageId}`);
      return true;
    } catch (error: any) {
      console.error(`[NotificationService] Failed to send email to ${logRecipient || to}:`, error.message);
      return false;
    }
  }

  /**
   * Envoie une invitation de transport a un transporteur
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
      responseUrl,
      price
    } = params;

    const expiresInMinutes = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60));
    const expiresInHours = Math.floor(expiresInMinutes / 60);
    const remainingMinutes = expiresInMinutes % 60;
    const expiresIn = expiresInHours > 0
      ? `${expiresInHours}h${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`
      : `${expiresInMinutes} minutes`;

    const html = EmailTemplates.carrierInvitation({
      carrierName,
      orderReference,
      pickupCity,
      deliveryCity,
      pickupDate: pickupDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      price: price ? `${price.toFixed(2)} EUR HT` : undefined,
      responseUrl,
      expiresIn
    });

    const subject = `Nouvelle demande de transport - ${pickupCity} vers ${deliveryCity} - Ref. ${orderReference}`;
    return this.sendEmail(carrierEmail, subject, html, undefined, `carrier ${carrierName} (${carrierEmail})`);
  }

  /**
   * Envoie un rappel de timeout imminent
   */
  static async sendTimeoutReminder(params: ReminderParams): Promise<boolean> {
    const { carrierName, carrierEmail, orderReference, minutesRemaining, responseUrl } = params;

    const html = EmailTemplates.timeoutReminder({
      carrierName,
      orderReference,
      minutesRemaining,
      responseUrl
    });

    const subject = `RAPPEL - ${minutesRemaining} min restantes pour repondre - Ref. ${orderReference}`;
    return this.sendEmail(carrierEmail, subject, html, undefined, `reminder to ${carrierName} (${carrierEmail})`);
  }

  /**
   * Notifie un transporteur qu'il a ete selectionne
   */
  static async sendCarrierConfirmation(
    carrierEmail: string,
    carrierName: string,
    orderReference: string,
    portalUrl: string,
    pickupCity?: string,
    deliveryCity?: string,
    pickupDate?: Date,
    clientName?: string
  ): Promise<boolean> {
    const html = EmailTemplates.carrierConfirmation({
      carrierName,
      orderReference,
      pickupCity: pickupCity || 'N/A',
      deliveryCity: deliveryCity || 'N/A',
      pickupDate: pickupDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) || 'A confirmer',
      clientName: clientName || 'Client'
    });

    const subject = `Transport confirme - Ref. ${orderReference}`;
    return this.sendEmail(carrierEmail, subject, html, undefined, `confirmation to ${carrierName} (${carrierEmail})`);
  }

  /**
   * Notifie l'industriel du statut du dispatch
   */
  static async notifyIndustrialDispatchStatus(
    industrialEmail: string,
    industrialName: string,
    orderReference: string,
    status: 'carrier_found' | 'escalated' | 'timeout',
    carrierName?: string,
    pickupCity?: string,
    deliveryCity?: string
  ): Promise<boolean> {
    const statusConfig = {
      carrier_found: {
        type: 'success' as const,
        title: 'Transporteur Assigne',
        subtitle: `Reference: ${orderReference}`,
        content: `
          <p>Excellente nouvelle ! Un transporteur a accepte votre demande de transport.</p>
          ${carrierName ? `
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.successLight}; border-radius: 12px; border: 1px solid ${COLORS.successBorder};">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0;"><span style="color: ${COLORS.gray500}; font-size: 13px;">Transporteur assigne</span><br>
                <span style="font-weight: 600; font-size: 16px; color: ${COLORS.gray800};">🚛 ${carrierName}</span></p>
              </td>
            </tr>
          </table>
          ` : ''}
          <p>Vous recevrez les mises a jour de tracking par email et sur le portail.</p>
        `,
        infoBox: {
          icon: '✅',
          title: 'Prochaines etapes',
          content: 'Le transporteur va organiser l\'enlevement. Vous serez notifie a chaque etape cle du transport.',
          color: 'success' as const
        }
      },
      escalated: {
        type: 'action_required' as const,
        title: 'Escalade vers Affret.IA',
        subtitle: `Reference: ${orderReference}`,
        content: `
          <p>Aucun transporteur de votre panel n'a pu prendre en charge cette demande dans les delais.</p>
          <p>Votre commande a ete automatiquement transmise a notre service <strong>Affret.IA</strong> pour une recherche elargie de transporteurs.</p>
        `,
        infoBox: {
          icon: '🔍',
          title: 'Recherche en cours',
          content: 'Notre equipe recherche activement un transporteur disponible. Vous serez notifie des que nous aurons trouve une solution.',
          color: 'warning' as const
        }
      },
      timeout: {
        type: 'notification' as const,
        title: 'Changement de Transporteur',
        subtitle: `Reference: ${orderReference}`,
        content: `
          <p>Le transporteur precedemment contacte n'a pas repondu dans le delai imparti.</p>
          <p>Votre demande a ete automatiquement transmise au transporteur suivant de votre panel.</p>
        `,
        infoBox: {
          icon: '🔄',
          title: 'Processus en cours',
          content: 'Le systeme de cascade automatique continue de rechercher un transporteur disponible.',
          color: 'info' as const
        }
      }
    };

    const config = statusConfig[status];

    const html = generateEmailTemplate({
      type: config.type,
      title: config.title,
      subtitle: config.subtitle,
      recipientName: industrialName,
      content: config.content,
      infoBox: config.infoBox,
      ctaButton: {
        text: 'Voir sur le portail',
        url: `${LINKS.portalUrl}/orders/${orderReference}`
      },
      footer: {
        reference: orderReference,
        additionalInfo: pickupCity && deliveryCity ? `Trajet: ${pickupCity} → ${deliveryCity}` : undefined
      }
    });

    const subjects = {
      carrier_found: `Transporteur assigne - Ref. ${orderReference}`,
      escalated: `Escalade Affret.IA - Ref. ${orderReference}`,
      timeout: `Changement transporteur - Ref. ${orderReference}`
    };

    return this.sendEmail(industrialEmail, subjects[status], html, undefined, `industrial ${industrialName} (${industrialEmail})`);
  }

  /**
   * Envoie une demande de validation de prefacture a l'industriel
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
    const html = generateEmailTemplate({
      type: 'action_required',
      title: 'Prefacture a Valider',
      subtitle: `Ref: ${preInvoiceNumber}`,
      preheader: `Prefacture ${preInvoiceNumber} de ${carrierName} - ${totalAmount.toFixed(2)} EUR`,
      recipientName: industrialName,
      content: `
        <p>La prefacture du transporteur <strong>${carrierName}</strong> est prete pour validation.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 16px 0; font-weight: 700; font-size: 16px; color: ${COLORS.gray800};">Resume</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500};">Nombre de commandes</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200}; text-align: right; font-weight: 600;">${orderCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500};">Montant total TTC</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${COLORS.primary};">${totalAmount.toFixed(2)} EUR</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.infoLight}; border-radius: 12px; border: 1px solid ${COLORS.infoBorder};">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 16px 0; font-weight: 700; font-size: 16px; color: ${COLORS.gray800};">📊 KPIs Transporteur</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 4px 0;"><span style="color: ${COLORS.gray600};">Ponctualite enlevement</span></td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">${kpis.onTimePickupRate || 0}%</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><span style="color: ${COLORS.gray600};">Ponctualite livraison</span></td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">${kpis.onTimeDeliveryRate || 0}%</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><span style="color: ${COLORS.gray600};">Documents complets</span></td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">${kpis.documentsCompleteRate || 0}%</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><span style="color: ${COLORS.gray600};">Sans incident</span></td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">${kpis.incidentFreeRate || 0}%</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      ctaButton: {
        text: 'Valider la prefacture',
        url: `${LINKS.portalUrl}/preinvoices/${preInvoiceNumber}`,
        color: COLORS.primary
      },
      footer: {
        reference: preInvoiceNumber,
        additionalInfo: `Transporteur: ${carrierName}`
      }
    });

    const subject = `Prefacture ${preInvoiceNumber} - ${carrierName} - ${totalAmount.toFixed(2)} EUR a valider`;
    return this.sendEmail(industrialEmail, subject, html, SES_CONFIG.billingFromEmail, `industrial ${industrialName}`);
  }

  /**
   * Notifie le transporteur que sa prefacture est validee
   */
  static async notifyCarrierPreInvoiceValidated(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    totalAmount: number
  ): Promise<boolean> {
    const html = generateEmailTemplate({
      type: 'success',
      title: 'Prefacture Validee',
      subtitle: `Ref: ${preInvoiceNumber}`,
      preheader: `Votre prefacture ${preInvoiceNumber} a ete validee`,
      recipientName: carrierName,
      content: `
        <p>Votre prefacture <strong>${preInvoiceNumber}</strong> a ete validee par l'industriel.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.successLight}; border-radius: 12px; border: 1px solid ${COLORS.successBorder};">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: ${COLORS.gray500}; font-size: 13px;">Montant valide</p>
              <p style="margin: 0; font-weight: 700; font-size: 28px; color: ${COLORS.success};">${totalAmount.toFixed(2)} EUR</p>
            </td>
          </tr>
        </table>

        <p>Vous pouvez maintenant deposer votre facture sur le portail transporteur.</p>
      `,
      ctaButton: {
        text: 'Deposer ma facture',
        url: `${LINKS.portalUrl}/carrier/preinvoices/${preInvoiceNumber}`,
        color: COLORS.success
      },
      footer: {
        reference: preInvoiceNumber
      }
    });

    const subject = `Prefacture ${preInvoiceNumber} validee - Deposez votre facture`;
    return this.sendEmail(carrierEmail, subject, html, SES_CONFIG.billingFromEmail, `carrier ${carrierName}`);
  }

  /**
   * Notifie le transporteur que sa facture est acceptee
   */
  static async notifyCarrierInvoiceAccepted(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    amount: number,
    dueDate: Date
  ): Promise<boolean> {
    const html = EmailTemplates.invoiceNotification({
      recipientName: carrierName,
      orderReference: preInvoiceNumber,
      invoiceNumber: preInvoiceNumber,
      amount: `${amount.toFixed(2)} EUR`,
      dueDate: dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'accepted',
      viewUrl: `${LINKS.portalUrl}/carrier/invoices`
    });

    const subject = `Facture acceptee - Paiement prevu le ${dueDate.toLocaleDateString('fr-FR')}`;
    return this.sendEmail(carrierEmail, subject, html, SES_CONFIG.billingFromEmail, `carrier ${carrierName}`);
  }

  /**
   * Notifie le transporteur que sa facture est rejetee
   */
  static async notifyCarrierInvoiceRejected(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    expectedAmount: number,
    invoiceAmount: number,
    difference: number
  ): Promise<boolean> {
    const html = EmailTemplates.invoiceNotification({
      recipientName: carrierName,
      orderReference: preInvoiceNumber,
      invoiceNumber: preInvoiceNumber,
      amount: `${invoiceAmount.toFixed(2)} EUR`,
      dueDate: '-',
      status: 'rejected',
      viewUrl: `${LINKS.portalUrl}/carrier/preinvoices/${preInvoiceNumber}`,
      rejectionReason: `Ecart de montant detecte: Prefacture ${expectedAmount.toFixed(2)} EUR vs Facture ${invoiceAmount.toFixed(2)} EUR (difference: ${difference >= 0 ? '+' : ''}${difference.toFixed(2)} EUR)`
    });

    const subject = `Facture rejetee - Ecart de ${Math.abs(difference).toFixed(2)} EUR`;
    return this.sendEmail(carrierEmail, subject, html, SES_CONFIG.billingFromEmail, `carrier ${carrierName}`);
  }

  /**
   * Notifie l'industriel qu'une facture transporteur a ete deposee
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
    const isAutoAccepted = Math.abs(difference / preInvoiceAmount) <= 0.01;

    const html = generateEmailTemplate({
      type: 'invoice',
      title: 'Facture Transporteur Recue',
      subtitle: `Prefacture: ${preInvoiceNumber}`,
      preheader: `Facture ${invoiceNumber} de ${carrierName} - ${invoiceAmount.toFixed(2)} EUR`,
      recipientName: industrialName,
      content: `
        <p>Le transporteur <strong>${carrierName}</strong> a depose sa facture pour la prefacture <strong>${preInvoiceNumber}</strong>.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Numero de facture</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">📄 ${invoiceNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Montant prefacture</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">${preInvoiceAmount.toFixed(2)} EUR</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Montant facture</span><br>
                    <span style="font-weight: 700; font-size: 18px; color: ${COLORS.primary};">${invoiceAmount.toFixed(2)} EUR</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Ecart</span><br>
                    <span style="font-weight: 600; color: ${Math.abs(difference) < 0.01 ? COLORS.success : COLORS.warning};">
                      ${difference >= 0 ? '+' : ''}${difference.toFixed(2)} EUR (${differencePercent}%)
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      infoBox: isAutoAccepted ? {
        icon: '✅',
        title: 'Acceptation automatique',
        content: 'L\'ecart etant inferieur a 1%, la facture a ete automatiquement acceptee. Le delai de paiement (30 jours) demarre.',
        color: 'success'
      } : {
        icon: '⚠️',
        title: 'Verification requise',
        content: 'L\'ecart de montant necessite votre verification. Veuillez valider ou rejeter la facture.',
        color: 'warning'
      },
      ctaButton: {
        text: 'Voir la facture',
        url: `${LINKS.portalUrl}/invoices/${invoiceNumber}`
      },
      footer: {
        reference: preInvoiceNumber,
        additionalInfo: `Transporteur: ${carrierName}`
      }
    });

    const subject = `Facture ${carrierName} recue - ${preInvoiceNumber} - ${invoiceAmount.toFixed(2)} EUR`;
    return this.sendEmail(industrialEmail, subject, html, SES_CONFIG.billingFromEmail, `industrial ${industrialName}`);
  }

  /**
   * Notifie le transporteur du paiement envoye
   */
  static async notifyCarrierPaymentSent(
    carrierEmail: string,
    carrierName: string,
    preInvoiceNumber: string,
    amount: number,
    paymentReference: string
  ): Promise<boolean> {
    const html = EmailTemplates.invoiceNotification({
      recipientName: carrierName,
      orderReference: preInvoiceNumber,
      invoiceNumber: preInvoiceNumber,
      amount: `${amount.toFixed(2)} EUR`,
      dueDate: new Date().toLocaleDateString('fr-FR'),
      status: 'payment_sent',
      viewUrl: `${LINKS.portalUrl}/carrier/payments`
    });

    const subject = `Paiement effectue - ${amount.toFixed(2)} EUR - Ref: ${paymentReference}`;
    return this.sendEmail(carrierEmail, subject, html, SES_CONFIG.billingFromEmail, `carrier ${carrierName}`);
  }

  /**
   * Rappel de paiement imminent a l'industriel
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
    const isUrgent = daysRemaining <= 2;

    const html = generateEmailTemplate({
      type: 'reminder',
      title: isUrgent ? 'URGENT - Paiement Imminent' : 'Rappel de Paiement',
      subtitle: `Prefacture: ${preInvoiceNumber}`,
      preheader: `${daysRemaining} jour(s) avant echeance - ${amount.toFixed(2)} EUR`,
      recipientName: industrialName,
      content: `
        <p>Le paiement de la prefacture <strong>${preInvoiceNumber}</strong> pour le transporteur <strong>${carrierName}</strong> arrive a echeance.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${isUrgent ? COLORS.errorLight : COLORS.warningLight}; border-radius: 12px; border: 1px solid ${isUrgent ? COLORS.errorBorder : COLORS.warningBorder};">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 48px; font-weight: 700; color: ${isUrgent ? COLORS.error : COLORS.warning};">${daysRemaining}</p>
              <p style="margin: 0; font-size: 14px; color: ${COLORS.gray600};">jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500};">Montant</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200}; text-align: right; font-weight: 700; font-size: 18px; color: ${COLORS.primary};">${amount.toFixed(2)} EUR</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500};">Echeance</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      ctaButton: {
        text: 'Proceder au paiement',
        url: `${LINKS.portalUrl}/payments/pending`,
        color: isUrgent ? COLORS.error : COLORS.warning
      },
      footer: {
        reference: preInvoiceNumber,
        additionalInfo: `Transporteur: ${carrierName}`
      }
    });

    const subject = isUrgent
      ? `URGENT - Paiement ${preInvoiceNumber} - ${daysRemaining}j restant - ${amount.toFixed(2)} EUR`
      : `Rappel - Paiement ${preInvoiceNumber} - ${daysRemaining}j restants - ${amount.toFixed(2)} EUR`;

    return this.sendEmail(industrialEmail, subject, html, SES_CONFIG.billingFromEmail, `industrial ${industrialName}`);
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
    const html = generateEmailTemplate({
      type: 'alert',
      title: 'RETARD DE PAIEMENT',
      subtitle: `Prefacture: ${preInvoiceNumber}`,
      preheader: `Paiement en retard de ${daysOverdue} jours - ${amount.toFixed(2)} EUR`,
      recipientName: industrialName,
      content: `
        <p>Le paiement de la prefacture <strong>${preInvoiceNumber}</strong> pour le transporteur <strong>${carrierName}</strong> est en retard.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.errorLight}; border-radius: 12px; border: 1px solid ${COLORS.errorBorder};">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 48px; font-weight: 700; color: ${COLORS.error};">${daysOverdue}</p>
              <p style="margin: 0; font-size: 14px; color: ${COLORS.gray600};">jour${daysOverdue > 1 ? 's' : ''} de retard</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500};">Montant du</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${COLORS.error};">${amount.toFixed(2)} EUR</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      infoBox: {
        icon: '⚠️',
        title: 'Action requise',
        content: 'Merci de regulariser cette situation dans les plus brefs delais pour maintenir de bonnes relations avec vos transporteurs.',
        color: 'error'
      },
      ctaButton: {
        text: 'Regulariser maintenant',
        url: `${LINKS.portalUrl}/payments/overdue`,
        color: COLORS.error
      },
      footer: {
        reference: preInvoiceNumber,
        additionalInfo: `Transporteur: ${carrierName}`
      }
    });

    const subject = `RETARD - Paiement ${preInvoiceNumber} - ${daysOverdue}j de retard - ${amount.toFixed(2)} EUR`;
    return this.sendEmail(industrialEmail, subject, html, SES_CONFIG.billingFromEmail, `industrial ${industrialName} (overdue)`);
  }

  /**
   * Verifie l'etat de la connexion AWS SES
   */
  static async checkSmtpConnection(): Promise<{ connected: boolean; message: string }> {
    const client = getSESClient();

    if (!client) {
      return { connected: false, message: 'AWS SES not configured - mock mode enabled' };
    }

    return { connected: true, message: `AWS SES configured for region: ${SES_CONFIG.region}` };
  }
}

export default NotificationService;

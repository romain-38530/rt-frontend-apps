/**
 * IssueFollowUpScheduler - Gere les relances horaires pour les incidents
 * Envoie des demandes de point de situation au transporteur
 * Notifie destinataire/expediteur des mises a jour
 */
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import IssueFollowUp, { IIssueFollowUp } from '../models/IssueFollowUp';
import Order from '../models/Order';
import EventService from './event-service';

// Configuration SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'SYMPHONI.A',
  replyTo: process.env.SES_REPLY_TO || 'reply@inbound.symphonia-controltower.com'
};

let sesClient: SESClient | null = null;
function getSESClient(): SESClient | null {
  if (sesClient) return sesClient;
  sesClient = new SESClient({ region: SES_CONFIG.region });
  return sesClient;
}

class IssueFollowUpScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs: number;

  constructor(checkIntervalMinutes: number = 5) {
    this.checkIntervalMs = checkIntervalMinutes * 60 * 1000;
  }

  /**
   * Demarre le scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('[IssueFollowUpScheduler] Already running');
      return;
    }

    console.log(`[IssueFollowUpScheduler] Starting - checking every ${this.checkIntervalMs / 1000}s`);
    this.isRunning = true;

    // Executer immediatement puis periodiquement
    this.checkPendingFollowUps();
    this.intervalId = setInterval(() => {
      this.checkPendingFollowUps();
    }, this.checkIntervalMs);
  }

  /**
   * Arrete le scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[IssueFollowUpScheduler] Stopped');
  }

  /**
   * Verifie et traite les relances en attente
   */
  async checkPendingFollowUps(): Promise<void> {
    try {
      const now = new Date();

      // Trouver les suivis actifs dont la prochaine relance est due
      const pendingFollowUps = await IssueFollowUp.find({
        status: 'active',
        nextFollowUpAt: { $lte: now }
      });

      console.log(`[IssueFollowUpScheduler] Found ${pendingFollowUps.length} pending follow-ups`);

      for (const followUp of pendingFollowUps) {
        await this.processFollowUp(followUp);
      }
    } catch (error) {
      console.error('[IssueFollowUpScheduler] Error checking follow-ups:', error);
    }
  }

  /**
   * Traite une relance individuelle
   */
  private async processFollowUp(followUp: IIssueFollowUp): Promise<void> {
    try {
      // Verifier si on a atteint le max de relances
      if (followUp.followUpCount >= followUp.maxFollowUps) {
        console.log(`[IssueFollowUpScheduler] Max follow-ups reached for ${followUp.followUpId}, escalating`);
        await this.escalateIssue(followUp);
        return;
      }

      // Recuperer la commande pour le contexte
      const order = await Order.findOne({ orderId: followUp.orderId });
      if (!order) {
        console.log(`[IssueFollowUpScheduler] Order ${followUp.orderId} not found, cancelling follow-up`);
        followUp.status = 'cancelled';
        await followUp.save();
        return;
      }

      // Verifier si l'incident est resolu (statut commande change)
      if (order.status !== 'incident') {
        console.log(`[IssueFollowUpScheduler] Order ${order.reference} no longer in incident status, resolving follow-up`);
        followUp.status = 'resolved';
        followUp.resolvedAt = new Date();
        followUp.resolution = `Statut commande change a: ${order.status}`;
        await followUp.save();
        return;
      }

      // Envoyer la relance au transporteur
      const result = await this.sendFollowUpToCarrier(followUp, order);

      // Mettre a jour le suivi
      followUp.followUpCount += 1;
      followUp.messages.push({
        type: 'carrier_followup',
        sentAt: new Date(),
        messageId: result.messageId,
        recipient: followUp.carrierEmail,
        content: `Relance #${followUp.followUpCount}: Demande de point de situation`
      });

      // Programmer la prochaine relance
      const nextFollowUp = new Date();
      nextFollowUp.setMinutes(nextFollowUp.getMinutes() + followUp.followUpIntervalMinutes);
      followUp.nextFollowUpAt = nextFollowUp;

      await followUp.save();

      // Logger l'evenement
      await EventService.createEvent({
        orderId: followUp.orderId,
        orderReference: followUp.orderReference,
        eventType: 'order.updated',
        source: 'system',
        actorId: 'claude-ai',
        actorType: 'system',
        actorName: 'SYMPHONI.A AI - Suivi Incident',
        description: `Relance #${followUp.followUpCount} envoyee au transporteur pour point de situation`,
        data: {
          followUpId: followUp.followUpId,
          followUpCount: followUp.followUpCount,
          nextFollowUpAt: nextFollowUp
        }
      });

      console.log(`[IssueFollowUpScheduler] Follow-up #${followUp.followUpCount} sent for ${followUp.orderReference}`);

    } catch (error: any) {
      console.error(`[IssueFollowUpScheduler] Error processing follow-up ${followUp.followUpId}:`, error.message);
    }
  }

  /**
   * Envoie une relance au transporteur
   */
  private async sendFollowUpToCarrier(followUp: IIssueFollowUp, order: any): Promise<{ success: boolean; messageId?: string }> {
    const client = getSESClient();
    if (!client) {
      console.log('[IssueFollowUpScheduler] SES not configured');
      return { success: false };
    }

    const hoursElapsed = Math.round((Date.now() - new Date(followUp.createdAt).getTime()) / (1000 * 60 * 60));

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🔄 SYMPHONI.A - Demande de Point de Situation</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Relance #${followUp.followUpCount + 1} - ${followUp.orderReference}</p>
          </div>

          <div style="background: #fffbeb; padding: 20px; border: 1px solid #fbbf24;">
            <p>Bonjour ${followUp.carrierName || 'Transporteur'},</p>

            <p>Suite a l'incident signale il y a <strong>${hoursElapsed} heure(s)</strong>, nous sollicitons un point de situation concernant cette livraison.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0;"><strong>Incident initial:</strong></p>
              <p style="margin: 5px 0 0 0; font-style: italic;">"${followUp.issueDescription}"</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
              <p style="margin: 0;"><strong>📋 Merci de nous informer:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Votre situation actuelle</li>
                <li>Estimation de la reprise/resolution</li>
                <li>Nouvelle ETA si applicable</li>
              </ul>
            </div>

            <p style="margin-top: 20px;"><strong>Comment repondre:</strong></p>
            <p>Repondez simplement a cet email avec votre mise a jour. Notre systeme IA analysera votre reponse et mettra a jour le suivi automatiquement.</p>
          </div>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Reference: ${followUp.orderReference}<br>
              Trajet: ${order.pickupAddress?.city || 'N/A'} → ${order.deliveryAddress?.city || 'N/A'}<br>
              <br>
              Message automatique SYMPHONI.A - Suivi Incident
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `🔄 Point de Situation Requis - ${followUp.orderReference} - Relance #${followUp.followUpCount + 1}`;

    const params: SendEmailCommandInput = {
      Source: `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`,
      Destination: { ToAddresses: [followUp.carrierEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      ReplyToAddresses: [SES_CONFIG.replyTo]
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await client.send(command);
      console.log(`[IssueFollowUpScheduler] Follow-up sent to ${followUp.carrierEmail}: ${response.MessageId}`);
      return { success: true, messageId: response.MessageId };
    } catch (error: any) {
      console.error(`[IssueFollowUpScheduler] Error sending follow-up: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Escalade un incident apres trop de relances sans reponse
   */
  private async escalateIssue(followUp: IIssueFollowUp): Promise<void> {
    const order = await Order.findOne({ orderId: followUp.orderId });

    // Passer le statut en escalade
    followUp.status = 'escalated';
    await followUp.save();

    if (order) {
      order.status = 'escalated';
      await order.save();
    }

    // Notifier l'industriel
    await this.sendEscalationNotification(followUp, order);

    // Logger l'evenement
    await EventService.createEvent({
      orderId: followUp.orderId,
      orderReference: followUp.orderReference,
      eventType: 'incident_reported',
      source: 'system',
      actorId: 'claude-ai',
      actorType: 'system',
      actorName: 'SYMPHONI.A AI',
      description: `Incident escalade apres ${followUp.followUpCount} relances sans resolution. Intervention manager requise.`,
      data: {
        followUpId: followUp.followUpId,
        followUpCount: followUp.followUpCount,
        escalated: true,
        hoursElapsed: Math.round((Date.now() - new Date(followUp.createdAt).getTime()) / (1000 * 60 * 60))
      }
    });

    console.log(`[IssueFollowUpScheduler] Issue ${followUp.followUpId} escalated after ${followUp.followUpCount} follow-ups`);
  }

  /**
   * Envoie une notification d'escalade
   */
  private async sendEscalationNotification(followUp: IIssueFollowUp, order: any): Promise<void> {
    const client = getSESClient();
    if (!client) return;

    // Notifier destinataire et expediteur de l'escalade
    const recipients = [followUp.recipientEmail];
    if (order?.pickupAddress?.contactEmail) {
      recipients.push(order.pickupAddress.contactEmail);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 SYMPHONI.A - Escalade Incident</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Reference: ${followUp.orderReference}</p>
          </div>

          <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca;">
            <p>Bonjour,</p>

            <p>L'incident concernant votre ${order?.flowType === 'inbound' ? 'livraison' : 'expedition'} n'a pas pu etre resolu malgre nos relances repetees aupres du transporteur.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <p><strong>Incident:</strong> ${followUp.issueDescription}</p>
              <p><strong>Transporteur:</strong> ${followUp.carrierName || 'N/A'}</p>
              <p><strong>Relances envoyees:</strong> ${followUp.followUpCount}</p>
              <p><strong>Duree:</strong> ${Math.round((Date.now() - new Date(followUp.createdAt).getTime()) / (1000 * 60 * 60))} heures</p>
            </div>

            <div style="background: #fee2e2; padding: 15px; border-radius: 8px;">
              <p style="margin: 0;"><strong>⚠️ Action Requise</strong></p>
              <p style="margin: 5px 0 0 0;">Notre equipe prend en charge cet incident. Vous serez contacte directement pour trouver une solution.</p>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Message automatique SYMPHONI.A<br>
              Contact urgence: support@symphonia-controltower.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const recipient of recipients.filter(r => r)) {
      try {
        const params: SendEmailCommandInput = {
          Source: `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`,
          Destination: { ToAddresses: [recipient] },
          Message: {
            Subject: { Data: `🚨 Escalade Incident - ${followUp.orderReference}`, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } }
          },
          ReplyToAddresses: [SES_CONFIG.replyTo]
        };

        const command = new SendEmailCommand(params);
        await client.send(command);
        console.log(`[IssueFollowUpScheduler] Escalation notification sent to ${recipient}`);
      } catch (error: any) {
        console.error(`[IssueFollowUpScheduler] Error sending escalation to ${recipient}: ${error.message}`);
      }
    }
  }

  /**
   * Marque un suivi comme resolu (appele depuis le service email quand le transporteur repond)
   */
  async resolveFollowUp(followUpId: string, resolution: string, resolvedBy: string): Promise<boolean> {
    const followUp = await IssueFollowUp.findOne({ followUpId });
    if (!followUp || followUp.status !== 'active') {
      return false;
    }

    followUp.status = 'resolved';
    followUp.resolvedAt = new Date();
    followUp.resolvedBy = resolvedBy;
    followUp.resolution = resolution;
    await followUp.save();

    // Mettre a jour le statut de la commande
    const order = await Order.findOne({ orderId: followUp.orderId });
    if (order && order.status === 'incident') {
      order.status = 'in_transit';  // Retour au statut en cours
      await order.save();
    }

    // Notifier destinataire et expediteur de la resolution
    await this.sendResolutionNotification(followUp, order);

    // Logger l'evenement
    await EventService.createEvent({
      orderId: followUp.orderId,
      orderReference: followUp.orderReference,
      eventType: 'order.updated',
      source: 'carrier',
      actorId: resolvedBy,
      actorType: 'carrier',
      actorName: followUp.carrierName || resolvedBy,
      description: `Incident resolu: ${resolution}`,
      data: {
        followUpId: followUp.followUpId,
        resolution,
        followUpCount: followUp.followUpCount
      }
    });

    console.log(`[IssueFollowUpScheduler] Follow-up ${followUpId} resolved`);
    return true;
  }

  /**
   * Envoie une notification de resolution
   */
  private async sendResolutionNotification(followUp: IIssueFollowUp, order: any): Promise<void> {
    const client = getSESClient();
    if (!client) return;

    const recipients = [followUp.recipientEmail];
    if (order?.pickupAddress?.contactEmail) {
      recipients.push(order.pickupAddress.contactEmail);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✅ SYMPHONI.A - Incident Resolu</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Reference: ${followUp.orderReference}</p>
          </div>

          <div style="background: #ecfdf5; padding: 20px; border: 1px solid #a7f3d0;">
            <p>Bonjour,</p>

            <p>Bonne nouvelle ! L'incident concernant votre transport a ete resolu.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p><strong>Resolution:</strong></p>
              <p style="font-style: italic;">"${followUp.resolution}"</p>
            </div>

            <p>La livraison reprend son cours normal. Vous recevrez une notification lors de la livraison.</p>
          </div>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Message automatique SYMPHONI.A<br>
              Merci de votre confiance
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const recipient of recipients.filter(r => r)) {
      try {
        const params: SendEmailCommandInput = {
          Source: `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`,
          Destination: { ToAddresses: [recipient] },
          Message: {
            Subject: { Data: `✅ Incident Resolu - ${followUp.orderReference}`, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } }
          },
          ReplyToAddresses: [SES_CONFIG.replyTo]
        };

        const command = new SendEmailCommand(params);
        await client.send(command);
      } catch (error: any) {
        console.error(`[IssueFollowUpScheduler] Error sending resolution to ${recipient}: ${error.message}`);
      }
    }
  }

  /**
   * Statistiques des suivis
   */
  async getStats(): Promise<{
    isRunning: boolean;
    activeFollowUps: number;
    pendingFollowUps: number;
    resolvedToday: number;
    escalatedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [active, pending, resolvedToday, escalatedToday] = await Promise.all([
      IssueFollowUp.countDocuments({ status: 'active' }),
      IssueFollowUp.countDocuments({ status: 'active', nextFollowUpAt: { $lte: new Date() } }),
      IssueFollowUp.countDocuments({ status: 'resolved', resolvedAt: { $gte: today } }),
      IssueFollowUp.countDocuments({ status: 'escalated', updatedAt: { $gte: today } })
    ]);

    return {
      isRunning: this.isRunning,
      activeFollowUps: active,
      pendingFollowUps: pending,
      resolvedToday,
      escalatedToday
    };
  }
}

// Singleton instance - verifie toutes les 5 minutes
const issueFollowUpScheduler = new IssueFollowUpScheduler(5);

export default issueFollowUpScheduler;

/**
 * Email Service - AWS SES
 * Service d'email pour les invitations logisticien via AWS SES
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

export type EmailProvider = 'ses' | 'mock';

export interface EmailConfig {
  provider: EmailProvider;
  region: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

export class EmailService {
  private sesClient: SESClient | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      provider: 'ses',
      region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
      fromEmail: process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@symphonia-controltower.com',
      fromName: process.env.SES_FROM_NAME || process.env.EMAIL_FROM_NAME || 'SYMPHONI.A',
      replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com',
    };

    this.initClient();
  }

  private initClient(): void {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.sesClient = new SESClient({
        region: this.config.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log(`[EmailService] AWS SES configured for region: ${this.config.region}`);
    } else {
      console.log('[EmailService] AWS SES not configured - mock mode enabled');
      this.config.provider = 'mock';
    }
  }

  // ========== MODE MOCK ==========

  private logEmail(to: string, subject: string, html: string): void {
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
    console.log(`
========================================
EMAIL (MOCK - AWS SES not configured)
========================================
To: ${to}
From: ${this.config.fromName} <${this.config.fromEmail}>
Subject: ${subject}

${textContent}...

[Full HTML content available in production]
========================================
    `);
  }

  // ========== METHODE PRINCIPALE ==========

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.sesClient) {
      this.logEmail(to, subject, html);
      return true;
    }

    const fromAddress = `${this.config.fromName} <${this.config.fromEmail}>`;

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
      ReplyToAddresses: [this.config.replyTo],
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      console.log(`[EmailService] Email sent to ${to}: ${response.MessageId}`);
      return true;
    } catch (error: any) {
      console.error('[EmailService] AWS SES send failed:', error.message);
      return false;
    }
  }

  // ========== EMAILS METIER ==========

  /**
   * Envoie un email d'invitation logisticien
   */
  async sendLogisticianInvitation(data: {
    email: string;
    industrialName: string;
    companyName?: string;
    invitationUrl: string;
    accessLevel: string;
    message?: string;
  }): Promise<boolean> {
    const subject = `Invitation au portail logisticien - ${data.industrialName}`;
    const html = this.generateInvitationHtml(data);
    return this.send(data.email, subject, html);
  }

  /**
   * Envoie une notification de partage de commande
   */
  async sendOrderSharedNotification(data: {
    email: string;
    logisticianName: string;
    industrialName: string;
    orderId: string;
    accessLevel: string;
  }): Promise<boolean> {
    const subject = `Nouvelle commande partagée - ${data.orderId}`;
    const html = this.generateOrderSharedHtml(data);
    return this.send(data.email, subject, html);
  }

  /**
   * Envoie une notification de révocation d'accès
   */
  async sendAccessRevokedNotification(data: {
    email: string;
    logisticianName: string;
    industrialName: string;
    orderId: string;
    reason?: string;
  }): Promise<boolean> {
    const subject = `Accès révoqué - Commande ${data.orderId}`;
    const html = this.generateAccessRevokedHtml(data);
    return this.send(data.email, subject, html);
  }

  /**
   * Envoie un email de bienvenue après activation
   */
  async sendWelcomeEmail(data: {
    email: string;
    companyName: string;
    industrialName: string;
    portalUrl: string;
  }): Promise<boolean> {
    const subject = `Bienvenue sur RT Technologie - Compte activé`;
    const html = this.generateWelcomeHtml(data);
    return this.send(data.email, subject, html);
  }

  // ========== HTML TEMPLATES ==========

  private generateInvitationHtml(data: {
    email: string;
    industrialName: string;
    companyName?: string;
    invitationUrl: string;
    accessLevel: string;
    message?: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://rt-technologie.com/logo.png" alt="RT Technologie" style="height: 50px;" onerror="this.style.display='none'">
          </div>
          <h1 style="color: #2563eb; margin-bottom: 20px; text-align: center;">Invitation au portail logisticien</h1>

          <p style="font-size: 16px; color: #333;">Bonjour,</p>

          <p style="font-size: 16px; color: #333;">
            <strong>${data.industrialName}</strong> vous invite à rejoindre leur espace logisticien sur la plateforme SYMPHONI.A de RT Technologie.
          </p>

          ${data.companyName ? `<p style="color: #666;">Entreprise: <strong>${data.companyName}</strong></p>` : ''}

          <p style="color: #666;">
            Niveau d'accès: <strong>${this.getAccessLevelLabel(data.accessLevel)}</strong>
          </p>

          ${data.message ? `
            <div style="background: #f0f7ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #333; font-style: italic;">"${data.message}"</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
              Activer mon compte
            </a>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              Ce lien est valable pendant <strong>7 jours</strong>. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          RT Technologie - SYMPHONI.A<br>
          Solution de gestion logistique<br>
          Cet email a été envoyé automatiquement.
        </p>
      </div>
    `;
  }

  private generateOrderSharedHtml(data: {
    email: string;
    logisticianName: string;
    industrialName: string;
    orderId: string;
    accessLevel: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #059669; margin-bottom: 20px;">Nouvelle commande partagée</h1>

          <p style="font-size: 16px; color: #333;">Bonjour ${data.logisticianName},</p>

          <p style="font-size: 16px; color: #333;">
            <strong>${data.industrialName}</strong> a partagé une commande avec vous.
          </p>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 5px 0; color: #333;">
              <strong>Commande:</strong> ${data.orderId}
            </p>
            <p style="margin: 5px 0; color: #333;">
              <strong>Niveau d'accès:</strong> ${this.getAccessLevelLabel(data.accessLevel)}
            </p>
          </div>

          <p style="color: #666;">
            Connectez-vous à votre portail logisticien pour consulter les détails de cette commande et effectuer les actions nécessaires.
          </p>
        </div>
      </div>
    `;
  }

  private generateAccessRevokedHtml(data: {
    email: string;
    logisticianName: string;
    industrialName: string;
    orderId: string;
    reason?: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin-bottom: 20px;">Accès révoqué</h1>

          <p style="font-size: 16px; color: #333;">Bonjour ${data.logisticianName},</p>

          <p style="font-size: 16px; color: #333;">
            <strong>${data.industrialName}</strong> a révoqué votre accès à la commande <strong>${data.orderId}</strong>.
          </p>

          ${data.reason ? `
            <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #fecaca;">
              <p style="margin: 0; color: #991b1b;"><strong>Raison:</strong> ${data.reason}</p>
            </div>
          ` : ''}

          <p style="color: #666;">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter directement l'industriel.
          </p>
        </div>
      </div>
    `;
  }

  private generateWelcomeHtml(data: {
    email: string;
    companyName: string;
    industrialName: string;
    portalUrl: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2563eb; margin-bottom: 20px; text-align: center;">Bienvenue sur RT Technologie!</h1>

          <p style="font-size: 16px; color: #333;">Bonjour,</p>

          <p style="font-size: 16px; color: #333;">
            Votre compte logisticien pour <strong>${data.companyName}</strong> a été activé avec succès.
          </p>

          <p style="color: #666;">
            Vous êtes maintenant connecté à <strong>${data.industrialName}</strong> et pouvez accéder aux commandes qui vous seront partagées.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
              Accéder à mon portail
            </a>
          </div>

          <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Fonctionnalités disponibles:</p>
            <ul style="color: #3b82f6; margin: 0; padding-left: 20px;">
              <li>Consulter les commandes partagées</li>
              <li>Suivre les transporteurs en temps réel</li>
              <li>Gérer les documents de transport</li>
              <li>Signer électroniquement les eCMR</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private getAccessLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      view: 'Consultation',
      edit: 'Modification',
      sign: 'Signature',
      full: 'Accès complet',
    };
    return labels[level] || level;
  }

  // ========== UTILITAIRES ==========

  getProvider(): EmailProvider {
    return this.config.provider;
  }

  isConfigured(): boolean {
    return this.sesClient !== null;
  }

  getConfig(): Record<string, unknown> {
    return {
      provider: 'AWS SES',
      region: this.config.region,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
      configured: this.isConfigured(),
    };
  }
}

// Singleton
export const emailService = new EmailService();
export default emailService;

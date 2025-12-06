/**
 * Service d'email pour les invitations logisticien
 * Utilise nodemailer avec SMTP
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

    if (this.enabled && process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      });
    }
  }

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
    if (!this.enabled || !this.transporter) {
      console.log(`
========================================
EMAIL: Invitation Logisticien
========================================
To: ${data.email}
Subject: Invitation au portail logisticien RT Technologie

Bonjour,

${data.industrialName} vous invite à rejoindre leur espace logisticien sur RT Technologie.

${data.companyName ? `Entreprise: ${data.companyName}` : ''}
Niveau d'accès: ${this.getAccessLevelLabel(data.accessLevel)}

${data.message ? `Message: ${data.message}` : ''}

Lien d'activation: ${data.invitationUrl}

Ce lien est valable pendant 7 jours.

Cordialement,
L'équipe RT Technologie
========================================
      `);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rt-technologie.com',
      to: data.email,
      subject: `Invitation au portail logisticien - ${data.industrialName}`,
      html: this.generateInvitationHtml(data),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
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
    if (!this.enabled || !this.transporter) {
      console.log(`
========================================
EMAIL: Commande Partagée
========================================
To: ${data.email}
Subject: Nouvelle commande partagée - ${data.orderId}

Bonjour ${data.logisticianName},

${data.industrialName} a partagé une commande avec vous.

Commande: ${data.orderId}
Niveau d'accès: ${this.getAccessLevelLabel(data.accessLevel)}

Connectez-vous à votre portail pour consulter les détails.

Cordialement,
L'équipe RT Technologie
========================================
      `);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rt-technologie.com',
      to: data.email,
      subject: `Nouvelle commande partagée - ${data.orderId}`,
      html: this.generateOrderSharedHtml(data),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Order shared email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending order shared email:', error);
      return false;
    }
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
    if (!this.enabled || !this.transporter) {
      console.log(`
========================================
EMAIL: Accès Révoqué
========================================
To: ${data.email}
Subject: Accès révoqué - Commande ${data.orderId}

Bonjour ${data.logisticianName},

${data.industrialName} a révoqué votre accès à la commande ${data.orderId}.

${data.reason ? `Raison: ${data.reason}` : ''}

Cordialement,
L'équipe RT Technologie
========================================
      `);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rt-technologie.com',
      to: data.email,
      subject: `Accès révoqué - Commande ${data.orderId}`,
      html: this.generateAccessRevokedHtml(data),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending access revoked email:', error);
      return false;
    }
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
    if (!this.enabled || !this.transporter) {
      console.log(`
========================================
EMAIL: Bienvenue Logisticien
========================================
To: ${data.email}
Subject: Bienvenue sur RT Technologie - Compte activé

Bonjour,

Votre compte logisticien pour ${data.companyName} a été activé avec succès.

Vous êtes maintenant connecté à ${data.industrialName}.

Accédez à votre portail: ${data.portalUrl}

Cordialement,
L'équipe RT Technologie
========================================
      `);
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rt-technologie.com',
      to: data.email,
      subject: `Bienvenue sur RT Technologie - Compte activé`,
      html: this.generateWelcomeHtml(data),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // ========== HTML Templates ==========

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
          <h1 style="color: #2563eb; margin-bottom: 20px;">Invitation au portail logisticien</h1>

          <p style="font-size: 16px; color: #333;">Bonjour,</p>

          <p style="font-size: 16px; color: #333;">
            <strong>${data.industrialName}</strong> vous invite à rejoindre leur espace logisticien sur RT Technologie.
          </p>

          ${data.companyName ? `<p style="color: #666;">Entreprise: <strong>${data.companyName}</strong></p>` : ''}

          <p style="color: #666;">
            Niveau d'accès: <strong>${this.getAccessLevelLabel(data.accessLevel)}</strong>
          </p>

          ${data.message ? `
            <div style="background: #f0f7ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">"${data.message}"</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Activer mon compte
            </a>
          </div>

          <p style="color: #999; font-size: 13px;">
            Ce lien est valable pendant 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          RT Technologie - Solution de gestion logistique<br>
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

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;">
              <strong>Commande:</strong> ${data.orderId}
            </p>
            <p style="margin: 5px 0; color: #333;">
              <strong>Niveau d'accès:</strong> ${this.getAccessLevelLabel(data.accessLevel)}
            </p>
          </div>

          <p style="color: #666;">
            Connectez-vous à votre portail pour consulter les détails de cette commande.
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
            <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #333;"><strong>Raison:</strong> ${data.reason}</p>
            </div>
          ` : ''}
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
          <h1 style="color: #2563eb; margin-bottom: 20px;">🎉 Bienvenue sur RT Technologie!</h1>

          <p style="font-size: 16px; color: #333;">Bonjour,</p>

          <p style="font-size: 16px; color: #333;">
            Votre compte logisticien pour <strong>${data.companyName}</strong> a été activé avec succès.
          </p>

          <p style="color: #666;">
            Vous êtes maintenant connecté à <strong>${data.industrialName}</strong> et pouvez accéder aux commandes qui vous seront partagées.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accéder à mon portail
            </a>
          </div>

          <p style="color: #666;">
            Fonctionnalités disponibles:
          </p>
          <ul style="color: #666;">
            <li>Consulter les commandes partagées</li>
            <li>Suivre les transporteurs en temps réel</li>
            <li>Gérer les documents de transport</li>
            <li>Signer électroniquement les eCMR</li>
          </ul>
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
}

// Singleton
export const emailService = new EmailService();
export default emailService;

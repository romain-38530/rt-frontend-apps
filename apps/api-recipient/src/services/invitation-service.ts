import axios from 'axios';

export class InvitationService {
  private notificationsApiUrl: string;

  constructor() {
    this.notificationsApiUrl = process.env.NOTIFICATIONS_API_URL || 'http://localhost:3013';
  }

  /**
   * Envoyer une invitation par email au destinataire
   */
  async sendInvitation(
    email: string,
    contactName: string,
    companyName: string,
    invitationToken: string,
    recipientId: string
  ): Promise<void> {
    try {
      const invitationUrl = `${process.env.FRONTEND_RECIPIENT_URL}/onboarding?token=${invitationToken}`;

      // Préparer les données de l'email
      const emailData = {
        to: email,
        subject: `Invitation à rejoindre RT Technologie - ${companyName}`,
        template: 'recipient_invitation',
        data: {
          contactName,
          companyName,
          invitationUrl,
          recipientId,
          expirationDays: 7
        }
      };

      // Envoyer l'email via l'API de notifications
      await axios.post(`${this.notificationsApiUrl}/emails/send`, emailData, {
        timeout: 10000
      });

      console.log(`Invitation email sent to ${email} for recipient ${recipientId}`);
    } catch (error: any) {
      console.error('Error sending invitation email:', error.message);
      // Ne pas faire échouer l'invitation si l'email n'est pas envoyé
      // On peut logger l'erreur ou la stocker pour un retry plus tard
    }
  }

  /**
   * Envoyer un email de rappel pour une invitation non acceptée
   */
  async sendInvitationReminder(
    email: string,
    contactName: string,
    companyName: string,
    invitationToken: string,
    recipientId: string,
    daysRemaining: number
  ): Promise<void> {
    try {
      const invitationUrl = `${process.env.FRONTEND_RECIPIENT_URL}/onboarding?token=${invitationToken}`;

      const emailData = {
        to: email,
        subject: `Rappel: Invitation à rejoindre RT Technologie - ${companyName}`,
        template: 'recipient_invitation_reminder',
        data: {
          contactName,
          companyName,
          invitationUrl,
          recipientId,
          daysRemaining
        }
      };

      await axios.post(`${this.notificationsApiUrl}/emails/send`, emailData, {
        timeout: 10000
      });

      console.log(`Reminder email sent to ${email} for recipient ${recipientId}`);
    } catch (error: any) {
      console.error('Error sending reminder email:', error.message);
    }
  }

  /**
   * Envoyer une notification de confirmation d'activation
   */
  async sendActivationConfirmation(
    email: string,
    contactName: string,
    companyName: string,
    recipientId: string
  ): Promise<void> {
    try {
      const dashboardUrl = `${process.env.FRONTEND_RECIPIENT_URL}/dashboard`;

      const emailData = {
        to: email,
        subject: `Bienvenue sur RT Technologie - ${companyName}`,
        template: 'recipient_activation_confirmation',
        data: {
          contactName,
          companyName,
          recipientId,
          dashboardUrl
        }
      };

      await axios.post(`${this.notificationsApiUrl}/emails/send`, emailData, {
        timeout: 10000
      });

      console.log(`Activation confirmation sent to ${email} for recipient ${recipientId}`);
    } catch (error: any) {
      console.error('Error sending activation confirmation:', error.message);
    }
  }

  /**
   * Vérifier si une invitation est expirée
   */
  isInvitationExpired(invitedAt: Date, maxDays: number = 7): boolean {
    const now = Date.now();
    const invitationAge = now - invitedAt.getTime();
    const maxAge = maxDays * 24 * 60 * 60 * 1000;

    return invitationAge > maxAge;
  }

  /**
   * Générer un nouveau token d'invitation
   */
  generateInvitationToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valider un token d'invitation
   */
  async validateInvitationToken(token: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    if (!token || token.length !== 64) {
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }

    // Token valide (format)
    return { valid: true };
  }
}

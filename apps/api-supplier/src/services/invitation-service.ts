/**
 * Invitation Service - AWS SES
 * Service d'invitation fournisseurs via AWS SES
 */

import crypto from 'crypto';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import Supplier from '../models/Supplier';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'RT Technologie',
  replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com'
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
    console.log(`[InvitationService] AWS SES configured for region: ${SES_CONFIG.region}`);
    return sesClient;
  }

  console.warn('[InvitationService] AWS SES not configured - emails will be logged only');
  return null;
}

export class InvitationService {
  /**
   * Génère un token d'invitation unique
   */
  generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crée une invitation pour un fournisseur
   */
  async createInvitation(data: {
    industrialId: string;
    companyName: string;
    siret: string;
    email: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  }) {
    const token = this.generateInvitationToken();

    // Calculer la date d'expiration de l'abonnement (1 mois gratuit)
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    const supplier = new Supplier({
      industrialId: data.industrialId,
      companyName: data.companyName,
      siret: data.siret,
      address: data.address,
      status: 'invited',
      invitationToken: token,
      invitedAt: new Date(),
      subscription: {
        tier: 'free',
        validUntil
      },
      settings: {
        notifications: true,
        language: 'fr'
      }
    });

    await supplier.save();

    // Envoyer l'email d'invitation
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      await this.sendInvitationEmail(data.email, token, data.companyName);
    }

    return {
      supplier,
      invitationUrl: `${process.env.SUPPLIER_PORTAL_URL}/onboarding?token=${token}`
    };
  }

  /**
   * Valide un token d'invitation
   */
  async validateToken(token: string) {
    const supplier = await Supplier.findOne({
      invitationToken: token,
      status: 'invited'
    });

    if (!supplier) {
      throw new Error('Invalid or expired invitation token');
    }

    // Vérifier si l'invitation n'est pas expirée (7 jours)
    const invitedAt = new Date(supplier.invitedAt);
    const expirationDate = new Date(invitedAt);
    expirationDate.setDate(expirationDate.getDate() + 7);

    if (new Date() > expirationDate) {
      throw new Error('Invitation token has expired');
    }

    return supplier;
  }

  /**
   * Active un compte fournisseur
   */
  async activateSupplier(token: string, userData: {
    contacts: Array<{
      name: string;
      role: 'logistique' | 'production' | 'planning';
      email: string;
      phone: string;
      isPrimary: boolean;
    }>;
  }) {
    const supplier = await this.validateToken(token);

    supplier.status = 'active';
    supplier.activatedAt = new Date();
    supplier.contacts = userData.contacts;
    supplier.invitationToken = undefined;

    await supplier.save();

    // Émettre événement d'activation
    await this.emitEvent('fournisseur.onboard.completed', {
      supplierId: supplier.supplierId,
      industrialId: supplier.industrialId,
      companyName: supplier.companyName,
      activatedAt: supplier.activatedAt
    });

    return supplier;
  }

  /**
   * Renvoie une invitation
   */
  async resendInvitation(supplierId: string, email: string) {
    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (supplier.status !== 'invited') {
      throw new Error('Supplier has already activated their account');
    }

    // Générer un nouveau token
    const newToken = this.generateInvitationToken();
    supplier.invitationToken = newToken;
    supplier.invitedAt = new Date();
    await supplier.save();

    // Renvoyer l'email
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      await this.sendInvitationEmail(email, newToken, supplier.companyName);
    }

    return {
      success: true,
      invitationUrl: `${process.env.SUPPLIER_PORTAL_URL}/onboarding?token=${newToken}`
    };
  }

  /**
   * Envoie l'email d'invitation via AWS SES
   */
  private async sendInvitationEmail(email: string, token: string, companyName: string) {
    const invitationUrl = `${process.env.SUPPLIER_PORTAL_URL}/onboarding?token=${token}`;
    const client = getSESClient();
    const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a73e8;">Bienvenue sur le portail fournisseur RT Technologie</h1>
        <p>Bonjour,</p>
        <p>Vous avez été invité à rejoindre le portail fournisseur de RT Technologie pour <strong>${companyName}</strong>.</p>
        <p>Ce portail vous permettra de :</p>
        <ul>
          <li>Gérer vos commandes et créneaux de chargement</li>
          <li>Communiquer en temps réel avec vos clients industriels</li>
          <li>Signer électroniquement les bons de chargement</li>
          <li>Suivre l'avancement de vos livraisons</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${invitationUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Ce lien est valable pendant 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          RT Technologie - Solution de gestion logistique<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `;

    // Mode mock si pas de client SES
    if (!client) {
      console.log(`[InvitationService] MOCK EMAIL:
        To: ${email}
        From: ${fromAddress}
        Subject: Invitation au portail fournisseur RT Technologie
        Content: ${html.substring(0, 200)}...`);
      return;
    }

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Invitation au portail fournisseur RT Technologie',
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
      console.log(`[InvitationService] Invitation email sent to ${email}: ${response.MessageId}`);
    } catch (error: any) {
      console.error('[InvitationService] AWS SES send failed:', error.message);
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Émet un événement vers l'API Events
   */
  private async emitEvent(eventType: string, data: any) {
    try {
      const axios = require('axios');
      await axios.post(`${process.env.API_EVENTS_URL}/events`, {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting event:', error);
    }
  }
}

export default new InvitationService();

/**
 * Service de gestion des invitations portail via AWS SES
 * Envoie des emails aux expéditeurs/destinataires pour leur donner accès au suivi
 */

import { v4 as uuidv4 } from 'uuid';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import PortalInvitation from '../models/PortalInvitation';
import type { IAddress } from '../models/Order';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'SYMPHONI.A',
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
    console.log(`[PortalInvitationService] AWS SES configured for region: ${SES_CONFIG.region}`);
    return sesClient;
  }

  console.warn('[PortalInvitationService] AWS SES not configured - emails will be logged only');
  return null;
}

interface CreateInvitationParams {
  orderId: string;
  orderReference: string;
  address?: IAddress;
  email: string;
  contactName: string;
  phone?: string;
  role: 'supplier' | 'recipient' | 'logistician' | 'carrier';
  invitedBy: string;
}

interface CreateInvitationFromAddressParams {
  orderId: string;
  orderReference: string;
  address: IAddress;
  role: 'supplier' | 'recipient';
  invitedBy: string;
}

export class PortalInvitationService {
  /**
   * Détermine l'URL du portail selon le rôle
   */
  private static getPortalUrl(role: string): string {
    switch (role) {
      case 'supplier':
        return process.env.SUPPLIER_PORTAL_URL || 'https://supplier.symphonia-controltower.com';
      case 'recipient':
        return process.env.RECIPIENT_PORTAL_URL || 'https://recipient.symphonia-controltower.com';
      case 'logistician':
        return process.env.LOGISTICIAN_PORTAL_URL || 'https://logistician.symphonia-controltower.com';
      case 'carrier':
        return process.env.CARRIER_PORTAL_URL || 'https://carrier.symphonia-controltower.com';
      default:
        return 'https://symphonia-controltower.com';
    }
  }

  /**
   * Crée et envoie une invitation portail (méthode générique)
   */
  static async createInvitation(params: CreateInvitationParams): Promise<string | null> {
    const { orderId, orderReference, email, contactName, phone, role, invitedBy } = params;

    if (!email) {
      return null;
    }

    // Générer un token unique
    const token = uuidv4();
    const invitationId = `inv_${uuidv4()}`;

    // Déterminer l'URL du portail selon le rôle
    const baseUrl = this.getPortalUrl(role);
    const portalUrl = `${baseUrl}/accept-invitation?token=${token}`;

    // Créer l'invitation (expire dans 7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = new PortalInvitation({
      invitationId,
      orderId,
      email,
      phone,
      contactName,
      role,
      status: 'pending',
      token,
      expiresAt,
      invitedBy,
      portalUrl,
    });

    await invitation.save();

    // Envoyer l'email d'invitation
    await this.sendInvitationEmail({
      email,
      contactName,
      orderReference,
      role,
      portalUrl,
    });

    // Mettre à jour le statut
    invitation.status = 'sent';
    await invitation.save();

    return invitationId;
  }

  /**
   * Crée et envoie une invitation portail depuis une adresse (si accès activé)
   */
  static async createAndSendInvitation(params: CreateInvitationFromAddressParams): Promise<string | null> {
    const { orderId, orderReference, address, role, invitedBy } = params;

    // Vérifier si l'accès portail est activé et que l'email est fourni
    if (!address.enablePortalAccess || !address.contactEmail) {
      return null;
    }

    // Générer un token unique
    const token = uuidv4();
    const invitationId = `inv_${uuidv4()}`;

    // Déterminer l'URL du portail selon le rôle
    const baseUrl = this.getPortalUrl(role);
    const portalUrl = `${baseUrl}/accept-invitation?token=${token}`;

    // Créer l'invitation (expire dans 7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = new PortalInvitation({
      invitationId,
      orderId,
      email: address.contactEmail,
      phone: address.contactPhone,
      contactName: address.contactName || 'Contact',
      role,
      status: 'pending',
      token,
      expiresAt,
      invitedBy,
      portalUrl,
    });

    await invitation.save();

    // Envoyer l'email d'invitation
    await this.sendInvitationEmail({
      email: address.contactEmail,
      contactName: address.contactName || 'Cher partenaire',
      orderReference,
      role,
      portalUrl,
    });

    // Mettre à jour le statut
    invitation.status = 'sent';
    await invitation.save();

    return invitationId;
  }

  /**
   * Envoie l'email d'invitation via AWS SES
   */
  private static async sendInvitationEmail(params: {
    email: string;
    contactName: string;
    orderReference: string;
    role: 'supplier' | 'recipient' | 'logistician' | 'carrier';
    portalUrl: string;
  }): Promise<void> {
    const { email, contactName, orderReference, role, portalUrl } = params;

    const roleLabels: Record<string, { label: string; portal: string; features: string[] }> = {
      supplier: {
        label: 'expéditeur',
        portal: 'Portail Expéditeur',
        features: [
          'Suivre l\'organisation du chargement',
          'Confirmer les dates de rendez-vous transporteur',
          'Consulter les documents de transport',
          'Communiquer avec le transporteur'
        ]
      },
      recipient: {
        label: 'destinataire',
        portal: 'Portail Destinataire',
        features: [
          'Suivre la livraison en temps réel',
          'Confirmer la réception',
          'Consulter les documents de transport',
          'Signer le bon de livraison'
        ]
      },
      logistician: {
        label: 'logisticien',
        portal: 'Portail Logisticien',
        features: [
          'Gérer l\'organisation des transports',
          'Planifier les rendez-vous',
          'Suivre toutes les commandes',
          'Coordonner avec les transporteurs'
        ]
      },
      carrier: {
        label: 'transporteur',
        portal: 'Portail Transporteur',
        features: [
          'Consulter les détails de la commande',
          'Organiser le transport',
          'Mettre à jour le tracking',
          'Déposer les documents (BL, CMR, POD)'
        ]
      }
    };

    const { label: roleLabel, portal: portalLabel, features } = roleLabels[role] || roleLabels.recipient;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .order-ref { background: #e0e7ff; padding: 10px 20px; border-radius: 4px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SYMPHONI.A</h1>
            <p>${portalLabel}</p>
          </div>
          <div class="content">
            <p>Bonjour ${contactName},</p>

            <p>Vous avez été désigné comme <strong>${roleLabel}</strong> pour une commande de transport.</p>

            <p>Référence de commande : <span class="order-ref">${orderReference}</span></p>

            <p>En tant que ${roleLabel}, vous pouvez accéder au ${portalLabel} SYMPHONI.A pour :</p>
            <ul>
              ${features.map(f => `<li>${f}</li>`).join('\n              ')}
            </ul>

            <p style="text-align: center;">
              <a href="${portalUrl}" class="button">Accéder au portail</a>
            </p>

            <p><small>Ce lien est valable 7 jours. Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email.</small></p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const client = getSESClient();
    const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;
    const subject = `[SYMPHONI.A] Accès ${portalLabel} - Commande ${orderReference}`;

    // Mode mock si pas de client SES
    if (!client) {
      console.log(`[PortalInvitationService] MOCK EMAIL:
        To: ${email}
        From: ${fromAddress}
        Subject: ${subject}
        Content: ${html.substring(0, 200)}...`);
      return;
    }

    const sesParams: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [email],
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
      const command = new SendEmailCommand(sesParams);
      const response = await client.send(command);
      console.log(`[PortalInvitationService] Invitation email sent to ${email}: ${response.MessageId}`);
    } catch (error: any) {
      console.error('[PortalInvitationService] AWS SES send failed:', error.message);
      throw error;
    }
  }

  /**
   * Accepte une invitation et lie l'utilisateur
   */
  static async acceptInvitation(token: string, userId: string): Promise<any> {
    const invitation = await PortalInvitation.findOne({ token, status: 'sent' });

    if (!invitation) {
      throw new Error('Invitation non trouvée ou déjà utilisée');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      throw new Error('Invitation expirée');
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.userId = userId;
    await invitation.save();

    return {
      orderId: invitation.orderId,
      role: invitation.role,
    };
  }

  /**
   * Récupère les invitations d'une commande
   */
  static async getOrderInvitations(orderId: string): Promise<any[]> {
    return await PortalInvitation.find({ orderId }).sort({ createdAt: -1 });
  }

  /**
   * Renvoie une invitation expirée
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    const invitation = await PortalInvitation.findOne({ invitationId });

    if (!invitation) {
      throw new Error('Invitation non trouvée');
    }

    // Générer un nouveau token
    invitation.token = uuidv4();
    invitation.status = 'pending';
    invitation.expiresAt = new Date();
    invitation.expiresAt.setDate(invitation.expiresAt.getDate() + 7);

    const baseUrl = invitation.role === 'supplier'
      ? process.env.SUPPLIER_PORTAL_URL || 'https://supplier.symphonia-controltower.com'
      : process.env.RECIPIENT_PORTAL_URL || 'https://recipient.symphonia-controltower.com';

    invitation.portalUrl = `${baseUrl}/accept-invitation?token=${invitation.token}`;

    await invitation.save();

    // Renvoyer l'email (récupérer la référence de commande)
    // Pour l'instant, on utilise l'orderId comme référence
    await this.sendInvitationEmail({
      email: invitation.email,
      contactName: invitation.contactName,
      orderReference: invitation.orderId,
      role: invitation.role,
      portalUrl: invitation.portalUrl,
    });

    invitation.status = 'sent';
    await invitation.save();
  }
}

export default PortalInvitationService;

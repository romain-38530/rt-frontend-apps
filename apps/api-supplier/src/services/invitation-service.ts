import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Supplier from '../models/Supplier';

export class InvitationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
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
   * Envoie l'email d'invitation
   */
  private async sendInvitationEmail(email: string, token: string, companyName: string) {
    const invitationUrl = `${process.env.SUPPLIER_PORTAL_URL}/onboarding?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Invitation au portail fournisseur RT Technologie',
      html: `
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
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${email}`);
    } catch (error) {
      console.error('Error sending invitation email:', error);
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

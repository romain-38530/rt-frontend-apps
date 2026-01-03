/**
 * Email Service - AWS SES
 * Service d'envoi d'emails pour les agents commerciaux via AWS SES
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import Agent from '../models/Agent';
import AgentContract from '../models/AgentContract';
import Commission from '../models/Commission';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'agents@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'RT Transport Solutions',
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
    console.log(`[EmailService] AWS SES configured for region: ${SES_CONFIG.region}`);
    return sesClient;
  }

  console.warn('[EmailService] AWS SES not configured - emails will be logged only');
  return null;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const client = getSESClient();
  const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;

  if (!client) {
    console.log(`[EmailService] MOCK EMAIL:
      To: ${options.to}
      Subject: ${options.subject}
      Content: ${options.html.substring(0, 200)}...`);
    return true;
  }

  const params: SendEmailCommandInput = {
    Source: fromAddress,
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: options.html,
          Charset: 'UTF-8',
        },
        ...(options.text && {
          Text: {
            Data: options.text,
            Charset: 'UTF-8',
          },
        }),
      },
    },
    ReplyToAddresses: [SES_CONFIG.replyTo],
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await client.send(command);

    console.log(`[EmailService] Email sent to ${options.to}: ${response.MessageId}`);
    return true;
  } catch (error: any) {
    console.error('[EmailService] AWS SES send failed:', error.message);
    return false;
  }
}

/**
 * Send contract email to agent for signature
 */
export async function sendContractEmail(agentId: string, contractId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);
    const contract = await AgentContract.findById(contractId);

    if (!agent || !contract) {
      throw new Error('Agent or contract not found');
    }

    const portalUrl = process.env.PORTAL_URL || 'https://agents.rt-transport.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Contrat à signer</h2>
        <p>Bonjour ${agent.firstName} ${agent.lastName},</p>
        <p>Votre contrat d'agent commercial (<strong>${contract.contractId}</strong>) est prêt à être signé.</p>
        <p>Veuillez consulter le document et le signer électroniquement via votre portail agent.</p>
        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accéder au portail
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Cordialement,<br>
          L'équipe RT Transport Solutions
        </p>
      </div>
    `;

    await sendEmail({
      to: agent.email,
      subject: 'Votre contrat d\'agent commercial à signer',
      html
    });
  } catch (error) {
    console.error('Error sending contract email:', error);
    throw error;
  }
}

/**
 * Send commission notification to agent
 */
export async function sendCommissionNotification(agentId: string, commissionId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);
    const commission = await Commission.findById(commissionId);

    if (!agent || !commission) {
      throw new Error('Agent or commission not found');
    }

    const portalUrl = process.env.PORTAL_URL || 'https://agents.rt-transport.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Commission Validée</h2>
        <p>Bonjour ${agent.firstName} ${agent.lastName},</p>
        <p>Votre commission pour la période <strong>${commission.period.month}/${commission.period.year}</strong> a été validée.</p>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Détails :</strong></p>
          <ul style="margin: 10px 0;">
            <li>Nombre de clients actifs : ${commission.totalClients}</li>
            <li>Montant total : <strong>${commission.totalAmount}€</strong></li>
            <li>Statut : ${commission.status}</li>
          </ul>
        </div>

        <p>Le paiement sera effectué prochainement.</p>
        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Voir le détail
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Cordialement,<br>
          L'équipe RT Transport Solutions
        </p>
      </div>
    `;

    await sendEmail({
      to: agent.email,
      subject: `Commission validée - ${commission.period.month}/${commission.period.year}`,
      html
    });
  } catch (error) {
    console.error('Error sending commission notification:', error);
    throw error;
  }
}

/**
 * Send welcome email to new agent
 */
export async function sendWelcomeEmail(agentId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const portalUrl = process.env.PORTAL_URL || 'https://agents.rt-transport.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue chez RT Transport Solutions !</h2>
        <p>Bonjour ${agent.firstName} ${agent.lastName},</p>
        <p>Bienvenue dans l'équipe des agents commerciaux RT Transport Solutions !</p>
        <p>Votre compte a été créé avec succès.</p>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Votre identifiant :</strong> ${agent.agentId}</p>
        </div>

        <p><strong>Prochaines étapes :</strong></p>
        <ol>
          <li>Complétez vos documents administratifs (KBIS, URSSAF, RIB)</li>
          <li>Signez votre contrat d'agent commercial</li>
          <li>Accédez à votre portail agent pour commencer</li>
        </ol>

        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accéder au portail
          </a>
        </p>

        <p>Nous sommes ravis de vous compter parmi nos agents !</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Cordialement,<br>
          L'équipe RT Transport Solutions
        </p>
      </div>
    `;

    await sendEmail({
      to: agent.email,
      subject: 'Bienvenue en tant qu\'agent commercial RT Transport',
      html
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send document verification notification
 */
export async function sendDocumentVerificationEmail(agentId: string, docType: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const docNames: { [key: string]: string } = {
      'id_card': 'Pièce d\'identité',
      'kbis': 'KBIS',
      'urssaf': 'Attestation URSSAF',
      'rib': 'RIB'
    };

    const portalUrl = process.env.PORTAL_URL || 'https://agents.rt-transport.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Document Vérifié</h2>
        <p>Bonjour ${agent.firstName} ${agent.lastName},</p>
        <p>Votre document "<strong>${docNames[docType] || docType}</strong>" a été vérifié et validé.</p>

        <p style="margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Voir mes documents
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Cordialement,<br>
          L'équipe RT Transport Solutions
        </p>
      </div>
    `;

    await sendEmail({
      to: agent.email,
      subject: `Document vérifié - ${docNames[docType] || docType}`,
      html
    });
  } catch (error) {
    console.error('Error sending document verification email:', error);
    throw error;
  }
}

/**
 * Send monthly commission summary to all agents
 */
export async function sendMonthlyCommissionSummary(month: number, year: number): Promise<void> {
  try {
    const commissions = await Commission.find({
      'period.month': month,
      'period.year': year
    }).populate('agentId');

    const portalUrl = process.env.PORTAL_URL || 'https://agents.rt-transport.com';

    for (const commission of commissions) {
      const agent = commission.agentId as any;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Récapitulatif Commission</h2>
          <p>Bonjour ${agent.firstName} ${agent.lastName},</p>
          <p>Voici votre récapitulatif de commission pour <strong>${month}/${year}</strong> :</p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px;">
              <li>Clients actifs : ${commission.totalClients}</li>
              <li>Commission totale : <strong>${commission.totalAmount}€</strong></li>
              <li>Statut : ${commission.status}</li>
            </ul>
          </div>

          <p style="margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Voir le détail
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Cordialement,<br>
            L'équipe RT Transport Solutions
          </p>
        </div>
      `;

      await sendEmail({
        to: agent.email,
        subject: `Récapitulatif commission ${month}/${year}`,
        html
      });
    }

    console.log(`[EmailService] Sent ${commissions.length} commission summary emails`);
  } catch (error) {
    console.error('Error sending monthly commission summaries:', error);
    throw error;
  }
}

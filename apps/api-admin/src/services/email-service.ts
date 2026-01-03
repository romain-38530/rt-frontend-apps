/**
 * CRM Email Service - AWS SES
 * Envoi d'emails commerciaux via AWS Simple Email Service
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  tags?: string[];
}

interface EmailSendResult {
  id: string;
  message: string;
  success: boolean;
}

class CrmEmailService {
  private sesClient: SESClient | null = null;
  private config: {
    region: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
  };

  constructor() {
    this.config = {
      region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
      fromEmail: process.env.CRM_FROM_EMAIL || process.env.SES_FROM_EMAIL || 'commerciaux@symphonia-controltower.com',
      fromName: process.env.CRM_FROM_NAME || process.env.SES_FROM_NAME || 'Equipe Commerciale SYMPHONI.A',
      replyTo: process.env.CRM_REPLY_TO || process.env.SES_REPLY_TO || 'commerce@symphonia-controltower.com'
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
      console.log(`[CrmEmailService] AWS SES configured for region: ${this.config.region} (${this.config.fromEmail})`);
    } else {
      console.warn('[CrmEmailService] AWS credentials not configured - emails will be logged only');
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult | null> {
    const fromEmail = options.from || this.config.fromEmail;
    const fromName = options.fromName || this.config.fromName;
    const fromAddress = `${fromName} <${fromEmail}>`;

    // Si pas de client SES, log seulement
    if (!this.sesClient) {
      console.log(`[CrmEmailService] MOCK EMAIL:
        To: ${options.to}
        From: ${fromAddress}
        Subject: ${options.subject}
        Content: ${options.html.substring(0, 200)}...`);

      return {
        id: `mock-${Date.now()}`,
        message: 'Email logged (AWS SES not configured)',
        success: true
      };
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
      ReplyToAddresses: [options.replyTo || this.config.replyTo],
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      console.log(`[CrmEmailService] Email sent to ${options.to}: ${response.MessageId}`);

      return {
        id: response.MessageId || `ses-${Date.now()}`,
        message: 'Email sent successfully via AWS SES',
        success: true
      };
    } catch (error: any) {
      console.error('[CrmEmailService] AWS SES send failed:', error.message);
      return null;
    }
  }

  /**
   * Envoyer un email avec un template
   */
  async sendTemplateEmail(params: {
    to: string;
    templateHtml: string;
    templateSubject: string;
    variables: Record<string, string>;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
    tags?: string[];
  }): Promise<EmailSendResult | null> {
    // Remplacer les variables dans le template
    let html = params.templateHtml;
    let subject = params.templateSubject;

    for (const [key, value] of Object.entries(params.variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(placeholder, value || '');
      subject = subject.replace(placeholder, value || '');
    }

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      from: params.fromEmail,
      fromName: params.fromName,
      replyTo: params.replyTo,
      tags: params.tags
    });
  }

  /**
   * Envoyer un email de prospection
   */
  async sendProspectionEmail(params: {
    to: string;
    contactName: string;
    companyName: string;
    subject: string;
    body: string;
    signature?: string;
  }): Promise<EmailSendResult | null> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Bonjour ${params.contactName},</p>

        ${params.body}

        <br><br>
        ${params.signature || `
          <p style="color: #666;">
            Cordialement,<br>
            <strong>L'equipe commerciale SYMPHONI.A</strong><br>
            <a href="https://symphoni-a.com">symphoni-a.com</a>
          </p>
        `}

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 11px; color: #999;">
          Cet email vous a ete envoye par SYMPHONI.A - RT Technologie.<br>
          Si vous ne souhaitez plus recevoir nos communications,
          <a href="mailto:commerce@symphonia-controltower.com?subject=Desinscription">cliquez ici</a>.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      html
    });
  }

  /**
   * Mapper un evenement vers notre statut email (pour tracking futur)
   */
  mapEventToStatus(event: string): string {
    const statusMap: Record<string, string> = {
      'delivered': 'DELIVERED',
      'opened': 'OPENED',
      'clicked': 'CLICKED',
      'bounced': 'BOUNCED',
      'complained': 'COMPLAINED',
      'unsubscribed': 'UNSUBSCRIBED',
      'failed': 'FAILED',
      'rejected': 'FAILED'
    };
    return statusMap[event?.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Verifier la configuration
   */
  isConfigured(): boolean {
    return this.sesClient !== null;
  }

  /**
   * Obtenir la configuration (sans secrets)
   */
  getConfig(): Record<string, unknown> {
    return {
      provider: 'AWS SES',
      region: this.config.region,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
      replyTo: this.config.replyTo,
      configured: this.isConfigured()
    };
  }
}

export default new CrmEmailService();
export { EmailSendOptions, EmailSendResult };

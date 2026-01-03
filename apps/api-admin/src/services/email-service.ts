/**
 * CRM Email Service - OVH SMTP
 * Envoi d'emails commerciaux via SMTP OVH
 */

import nodemailer from 'nodemailer';

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
  private transporter: nodemailer.Transporter | null = null;
  private config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };

  constructor() {
    this.config = {
      host: process.env.CRM_SMTP_HOST || process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: Number(process.env.CRM_SMTP_PORT || process.env.SMTP_PORT || 465),
      secure: process.env.CRM_SMTP_SECURE !== 'false',
      user: process.env.CRM_SMTP_USER || '',
      password: process.env.CRM_SMTP_PASSWORD || '',
      fromEmail: process.env.CRM_FROM_EMAIL || 'commerciaux@symphonia-controltower.com',
      fromName: process.env.CRM_FROM_NAME || 'Equipe Commerciale SYMPHONI.A'
    };

    this.initTransporter();
  }

  private initTransporter(): void {
    if (this.config.user && this.config.password) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password
        }
      });
      console.log(`[CrmEmailService] SMTP configure: ${this.config.host}:${this.config.port} (${this.config.fromEmail})`);
    } else {
      console.warn('[CrmEmailService] SMTP credentials not configured - emails will be logged only');
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult | null> {
    const fromEmail = options.from || this.config.fromEmail;
    const fromName = options.fromName || this.config.fromName;

    // Si pas de transporter, log seulement
    if (!this.transporter) {
      console.log(`[CrmEmailService] MOCK EMAIL:
        To: ${options.to}
        From: ${fromName} <${fromEmail}>
        Subject: ${options.subject}
        Content: ${options.html.substring(0, 200)}...`);

      return {
        id: `mock-${Date.now()}`,
        message: 'Email logged (SMTP not configured)',
        success: true
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo
      });

      console.log(`[CrmEmailService] Email sent to ${options.to}: ${info.messageId}`);

      return {
        id: info.messageId,
        message: 'Email sent successfully',
        success: true
      };
    } catch (error: any) {
      console.error('[CrmEmailService] Send failed:', error.message);
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
    return this.transporter !== null;
  }

  /**
   * Obtenir la configuration (sans password)
   */
  getConfig(): Record<string, unknown> {
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.user ? '***configured***' : 'not set',
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
      configured: this.isConfigured()
    };
  }
}

export default new CrmEmailService();
export { EmailSendOptions, EmailSendResult };

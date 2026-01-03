/**
 * AWS SES Email Service
 * Service d'envoi d'emails via AWS Simple Email Service
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// Configuration email par défaut
const EMAIL_CONFIG = {
  fromEmail: process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || process.env.EMAIL_FROM_NAME || 'SYMPHONI.A',
  replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com',
};

// Client SES singleton
let sesClient: SESClient | null = null;

function getSESClient(): SESClient | null {
  if (sesClient) return sesClient;

  if (!SES_CONFIG.credentials.accessKeyId || !SES_CONFIG.credentials.secretAccessKey) {
    console.warn('[AWS SES] Credentials not configured - emails will be logged only');
    return null;
  }

  sesClient = new SESClient(SES_CONFIG);
  console.log(`[AWS SES] Client initialized for region: ${SES_CONFIG.region}`);
  return sesClient;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie un email via AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const client = getSESClient();

  const fromAddress = options.fromName || EMAIL_CONFIG.fromName
    ? `${options.fromName || EMAIL_CONFIG.fromName} <${options.from || EMAIL_CONFIG.fromEmail}>`
    : options.from || EMAIL_CONFIG.fromEmail;

  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  // Mode mock si pas de client SES
  if (!client) {
    console.log(`[AWS SES] MOCK EMAIL:
      To: ${toAddresses.join(', ')}
      From: ${fromAddress}
      Subject: ${options.subject}
      Content: ${options.html.substring(0, 200)}...`);

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  const params: SendEmailCommandInput = {
    Source: fromAddress,
    Destination: {
      ToAddresses: toAddresses,
      CcAddresses: options.cc,
      BccAddresses: options.bcc,
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
    ReplyToAddresses: [options.replyTo || EMAIL_CONFIG.replyTo],
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await client.send(command);

    console.log(`[AWS SES] Email sent to ${toAddresses.join(', ')}: ${response.MessageId}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('[AWS SES] Send failed:', error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Envoie un email avec template (variables remplacées)
 */
export async function sendTemplateEmail(params: {
  to: string | string[];
  templateHtml: string;
  templateSubject: string;
  variables: Record<string, string>;
  from?: string;
  fromName?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  let html = params.templateHtml;
  let subject = params.templateSubject;

  // Remplacer les variables {{key}} par leurs valeurs
  for (const [key, value] of Object.entries(params.variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(placeholder, value || '');
    subject = subject.replace(placeholder, value || '');
  }

  return sendEmail({
    to: params.to,
    subject,
    html,
    from: params.from,
    fromName: params.fromName,
    replyTo: params.replyTo,
  });
}

/**
 * Vérifie si AWS SES est configuré
 */
export function isConfigured(): boolean {
  return Boolean(SES_CONFIG.credentials.accessKeyId && SES_CONFIG.credentials.secretAccessKey);
}

/**
 * Récupère la configuration (sans secrets)
 */
export function getConfig(): Record<string, unknown> {
  return {
    region: SES_CONFIG.region,
    configured: isConfigured(),
    fromEmail: EMAIL_CONFIG.fromEmail,
    fromName: EMAIL_CONFIG.fromName,
    replyTo: EMAIL_CONFIG.replyTo,
  };
}

export default {
  sendEmail,
  sendTemplateEmail,
  isConfigured,
  getConfig,
};

/**
 * Service SMS multi-provider pour SYMPHONI.A
 * Supporte: Twilio, OVH, Vonage, et mock pour dev
 */

export type SmsProvider = 'twilio' | 'ovh' | 'vonage' | 'mock';

export interface SmsConfig {
  provider: SmsProvider;
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  // OVH
  ovhApplicationKey?: string;
  ovhApplicationSecret?: string;
  ovhConsumerKey?: string;
  ovhServiceName?: string;
  ovhSender?: string;
  // Vonage
  vonageApiKey?: string;
  vonageApiSecret?: string;
  vonageFromNumber?: string;
}

export interface SmsMessage {
  to: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: SmsProvider;
  error?: string;
  cost?: number;
  segments?: number;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: 'delivery' | 'tracking' | 'alert' | 'marketing' | 'auth';
}

// Pre-defined templates for logistics
export const SMS_TEMPLATES: Record<string, SmsTemplate> = {
  DELIVERY_SCHEDULED: {
    id: 'delivery_scheduled',
    name: 'Livraison programmee',
    body: 'Votre livraison {{orderRef}} est programmee pour le {{date}} entre {{timeSlot}}. Suivez en temps reel: {{trackingUrl}}',
    variables: ['orderRef', 'date', 'timeSlot', 'trackingUrl'],
    category: 'delivery'
  },
  DELIVERY_OUT: {
    id: 'delivery_out',
    name: 'Livraison en cours',
    body: 'Votre colis {{orderRef}} est en cours de livraison. Chauffeur: {{driverName}}. ETA: {{eta}}. Suivez: {{trackingUrl}}',
    variables: ['orderRef', 'driverName', 'eta', 'trackingUrl'],
    category: 'delivery'
  },
  DELIVERY_ARRIVING: {
    id: 'delivery_arriving',
    name: 'Arrivee imminente',
    body: 'Le chauffeur arrive dans {{minutes}} minutes pour votre livraison {{orderRef}}. Preparez-vous!',
    variables: ['minutes', 'orderRef'],
    category: 'delivery'
  },
  DELIVERY_COMPLETED: {
    id: 'delivery_completed',
    name: 'Livraison effectuee',
    body: 'Livraison {{orderRef}} effectuee le {{date}} a {{time}}. Merci de votre confiance! Note de service: {{ratingUrl}}',
    variables: ['orderRef', 'date', 'time', 'ratingUrl'],
    category: 'delivery'
  },
  DELIVERY_FAILED: {
    id: 'delivery_failed',
    name: 'Echec livraison',
    body: 'Livraison {{orderRef}} non effectuee: {{reason}}. Reprogrammer: {{rescheduleUrl}} ou appelez {{phone}}',
    variables: ['orderRef', 'reason', 'rescheduleUrl', 'phone'],
    category: 'delivery'
  },
  PICKUP_REMINDER: {
    id: 'pickup_reminder',
    name: 'Rappel enlevement',
    body: 'Rappel: Enlevement prevu demain {{date}} pour {{orderRef}}. Assurez-vous que le colis est pret.',
    variables: ['date', 'orderRef'],
    category: 'delivery'
  },
  TRACKING_UPDATE: {
    id: 'tracking_update',
    name: 'Mise a jour tracking',
    body: 'Colis {{orderRef}}: {{status}}. Position: {{location}}. Details: {{trackingUrl}}',
    variables: ['orderRef', 'status', 'location', 'trackingUrl'],
    category: 'tracking'
  },
  INCIDENT_ALERT: {
    id: 'incident_alert',
    name: 'Alerte incident',
    body: 'ALERTE: Incident sur livraison {{orderRef}}. Type: {{incidentType}}. Action requise: {{actionUrl}}',
    variables: ['orderRef', 'incidentType', 'actionUrl'],
    category: 'alert'
  },
  SLOT_CONFIRMATION: {
    id: 'slot_confirmation',
    name: 'Confirmation creneau',
    body: 'RDV confirme: {{date}} de {{startTime}} a {{endTime}} au quai {{dockNumber}}. Ref: {{bookingRef}}',
    variables: ['date', 'startTime', 'endTime', 'dockNumber', 'bookingRef'],
    category: 'delivery'
  },
  DRIVER_CHECKIN: {
    id: 'driver_checkin',
    name: 'Chauffeur arrive',
    body: 'Chauffeur {{driverName}} ({{vehiclePlate}}) est arrive sur site. Quai {{dockNumber}} attribue. Temps estime: {{waitTime}}',
    variables: ['driverName', 'vehiclePlate', 'dockNumber', 'waitTime'],
    category: 'alert'
  },
  OTP_CODE: {
    id: 'otp_code',
    name: 'Code OTP',
    body: 'Votre code de verification SYMPHONI.A: {{code}}. Valide {{validity}} minutes. Ne partagez jamais ce code.',
    variables: ['code', 'validity'],
    category: 'auth'
  },
  SIGNATURE_REQUEST: {
    id: 'signature_request',
    name: 'Demande signature',
    body: 'Signature requise pour {{orderRef}}. Signez electroniquement: {{signatureUrl}} (valide {{validity}}h)',
    variables: ['orderRef', 'signatureUrl', 'validity'],
    category: 'delivery'
  },
  SLOT_REMINDER: {
    id: 'slot_reminder',
    name: 'Rappel RDV',
    body: 'Rappel: RDV demain {{date}} a {{time}} sur le site {{siteName}}. Ref: {{bookingRef}}. Arrivez 15min avant.',
    variables: ['date', 'time', 'siteName', 'bookingRef'],
    category: 'delivery'
  },
  DRIVER_CALLED: {
    id: 'driver_called',
    name: 'Appel chauffeur',
    body: 'Vous etes appele au quai {{dockNumber}}. Ref: {{bookingRef}}. Presentez-vous immediatement.',
    variables: ['dockNumber', 'bookingRef'],
    category: 'alert'
  },
  ECMR_READY: {
    id: 'ecmr_ready',
    name: 'eCMR pret',
    body: 'eCMR {{ecmrRef}} pret pour signature. Signez: {{signatureUrl}}',
    variables: ['ecmrRef', 'signatureUrl'],
    category: 'delivery'
  },
  INVOICE_READY: {
    id: 'invoice_ready',
    name: 'Facture disponible',
    body: 'Facture {{invoiceRef}} disponible ({{amount}}). Consultez: {{invoiceUrl}}',
    variables: ['invoiceRef', 'amount', 'invoiceUrl'],
    category: 'alert'
  },
  PAYMENT_RECEIVED: {
    id: 'payment_received',
    name: 'Paiement recu',
    body: 'Paiement de {{amount}} recu pour facture {{invoiceRef}}. Merci!',
    variables: ['amount', 'invoiceRef'],
    category: 'alert'
  },
  ACCOUNT_CREATED: {
    id: 'account_created',
    name: 'Compte cree',
    body: 'Bienvenue sur SYMPHONI.A! Votre compte est actif. Connectez-vous: {{loginUrl}}',
    variables: ['loginUrl'],
    category: 'auth'
  },
  PASSWORD_RESET: {
    id: 'password_reset',
    name: 'Reset mot de passe',
    body: 'Reinitialisation mot de passe demandee. Lien: {{resetUrl}} (valide 1h). Ignorez si non demande.',
    variables: ['resetUrl'],
    category: 'auth'
  }
};

export class SmsService {
  private config: SmsConfig;
  private rateLimitPerSecond: number = 10;
  private lastSendTime: number = 0;
  private sendCount: number = 0;

  constructor(config?: Partial<SmsConfig>) {
    this.config = {
      provider: config?.provider || (process.env.SMS_PROVIDER as SmsProvider) || 'mock',
      twilioAccountSid: config?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: config?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
      twilioFromNumber: config?.twilioFromNumber || process.env.TWILIO_FROM_NUMBER,
      ovhApplicationKey: config?.ovhApplicationKey || process.env.OVH_APP_KEY,
      ovhApplicationSecret: config?.ovhApplicationSecret || process.env.OVH_APP_SECRET,
      ovhConsumerKey: config?.ovhConsumerKey || process.env.OVH_CONSUMER_KEY,
      ovhServiceName: config?.ovhServiceName || process.env.OVH_SMS_SERVICE,
      ovhSender: config?.ovhSender || process.env.OVH_SMS_SENDER,
      vonageApiKey: config?.vonageApiKey || process.env.VONAGE_API_KEY,
      vonageApiSecret: config?.vonageApiSecret || process.env.VONAGE_API_SECRET,
      vonageFromNumber: config?.vonageFromNumber || process.env.VONAGE_FROM_NUMBER
    };
  }

  // Format phone number to E.164
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    // French number starting with 0
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '33' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }

  // Apply template variables
  applyTemplate(templateId: string, variables: Record<string, string>): string {
    const template = SMS_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return body;
  }

  // Send via Twilio
  private async sendViaTwilio(message: SmsMessage): Promise<SmsSendResult> {
    const { twilioAccountSid, twilioAuthToken, twilioFromNumber } = this.config;
    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      return { success: false, provider: 'twilio', error: 'Twilio configuration missing' };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: this.formatPhoneNumber(message.to),
            From: twilioFromNumber,
            Body: message.body
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          messageId: data.sid,
          provider: 'twilio',
          segments: data.num_segments,
          cost: parseFloat(data.price || '0')
        };
      }
      return { success: false, provider: 'twilio', error: data.message };
    } catch (error) {
      return { success: false, provider: 'twilio', error: String(error) };
    }
  }

  // Send via OVH
  private async sendViaOvh(message: SmsMessage): Promise<SmsSendResult> {
    const { ovhApplicationKey, ovhApplicationSecret, ovhConsumerKey, ovhServiceName, ovhSender } = this.config;
    if (!ovhApplicationKey || !ovhApplicationSecret || !ovhConsumerKey || !ovhServiceName) {
      return { success: false, provider: 'ovh', error: 'OVH configuration missing' };
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const method = 'POST';
      const url = `https://eu.api.ovh.com/1.0/sms/${ovhServiceName}/jobs`;
      const body = JSON.stringify({
        message: message.body,
        receivers: [this.formatPhoneNumber(message.to)],
        sender: ovhSender || 'SYMPHONIA',
        noStopClause: true
      });

      // OVH signature
      const crypto = await import('crypto');
      const toSign = `${ovhApplicationSecret}+${ovhConsumerKey}+${method}+${url}+${body}+${timestamp}`;
      const signature = '$1$' + crypto.createHash('sha1').update(toSign).digest('hex');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Ovh-Application': ovhApplicationKey,
          'X-Ovh-Timestamp': String(timestamp),
          'X-Ovh-Signature': signature,
          'X-Ovh-Consumer': ovhConsumerKey
        },
        body
      });

      const data = await response.json();
      if (response.ok && data.ids?.length > 0) {
        return {
          success: true,
          messageId: data.ids[0],
          provider: 'ovh',
          segments: data.totalCreditsRemoved || 1
        };
      }
      return { success: false, provider: 'ovh', error: data.message || 'Unknown error' };
    } catch (error) {
      return { success: false, provider: 'ovh', error: String(error) };
    }
  }

  // Send via Vonage (Nexmo)
  private async sendViaVonage(message: SmsMessage): Promise<SmsSendResult> {
    const { vonageApiKey, vonageApiSecret, vonageFromNumber } = this.config;
    if (!vonageApiKey || !vonageApiSecret) {
      return { success: false, provider: 'vonage', error: 'Vonage configuration missing' };
    }

    try {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: vonageApiKey,
          api_secret: vonageApiSecret,
          from: vonageFromNumber || 'SYMPHONIA',
          to: this.formatPhoneNumber(message.to).replace('+', ''),
          text: message.body
        })
      });

      const data = await response.json();
      if (data.messages?.[0]?.status === '0') {
        return {
          success: true,
          messageId: data.messages[0]['message-id'],
          provider: 'vonage',
          cost: parseFloat(data.messages[0]['message-price'] || '0')
        };
      }
      return { success: false, provider: 'vonage', error: data.messages?.[0]?.['error-text'] || 'Unknown error' };
    } catch (error) {
      return { success: false, provider: 'vonage', error: String(error) };
    }
  }

  // Mock sender for development
  private async sendViaMock(message: SmsMessage): Promise<SmsSendResult> {
    console.log(`[SMS MOCK] To: ${message.to}, Body: ${message.body}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock',
      segments: Math.ceil(message.body.length / 160)
    };
  }

  // Main send method
  async send(message: SmsMessage): Promise<SmsSendResult> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastSendTime < 1000) {
      this.sendCount++;
      if (this.sendCount > this.rateLimitPerSecond) {
        await new Promise(resolve => setTimeout(resolve, 1000 - (now - this.lastSendTime)));
      }
    } else {
      this.sendCount = 1;
      this.lastSendTime = now;
    }

    // Apply template if specified
    let body = message.body;
    if (message.templateId && message.variables) {
      body = this.applyTemplate(message.templateId, message.variables);
    }
    const finalMessage = { ...message, body };

    // Route to appropriate provider
    switch (this.config.provider) {
      case 'twilio':
        return this.sendViaTwilio(finalMessage);
      case 'ovh':
        return this.sendViaOvh(finalMessage);
      case 'vonage':
        return this.sendViaVonage(finalMessage);
      case 'mock':
      default:
        return this.sendViaMock(finalMessage);
    }
  }

  // Send using template
  async sendTemplate(
    to: string,
    templateId: keyof typeof SMS_TEMPLATES,
    variables: Record<string, string>
  ): Promise<SmsSendResult> {
    const body = this.applyTemplate(templateId as string, variables);
    return this.send({ to, body, templateId: templateId as string, variables });
  }

  // Bulk send
  async sendBulk(messages: SmsMessage[]): Promise<SmsSendResult[]> {
    const results: SmsSendResult[] = [];
    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  // Send OTP
  async sendOtp(phone: string, code: string, validity: number = 5): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'OTP_CODE', { code, validity: String(validity) });
  }

  // Delivery notifications
  async notifyDeliveryScheduled(phone: string, orderRef: string, date: string, timeSlot: string, trackingUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DELIVERY_SCHEDULED', { orderRef, date, timeSlot, trackingUrl });
  }

  async notifyDeliveryOut(phone: string, orderRef: string, driverName: string, eta: string, trackingUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DELIVERY_OUT', { orderRef, driverName, eta, trackingUrl });
  }

  async notifyDeliveryArriving(phone: string, orderRef: string, minutes: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DELIVERY_ARRIVING', { minutes, orderRef });
  }

  async notifyDeliveryCompleted(phone: string, orderRef: string, date: string, time: string, ratingUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DELIVERY_COMPLETED', { orderRef, date, time, ratingUrl });
  }

  async notifyDeliveryFailed(phone: string, orderRef: string, reason: string, rescheduleUrl: string, supportPhone: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DELIVERY_FAILED', { orderRef, reason, rescheduleUrl, phone: supportPhone });
  }

  async notifyIncident(phone: string, orderRef: string, incidentType: string, actionUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'INCIDENT_ALERT', { orderRef, incidentType, actionUrl });
  }

  async notifySlotConfirmation(phone: string, date: string, startTime: string, endTime: string, dockNumber: string, bookingRef: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'SLOT_CONFIRMATION', { date, startTime, endTime, dockNumber, bookingRef });
  }

  async notifyDriverCheckin(phone: string, driverName: string, vehiclePlate: string, dockNumber: string, waitTime: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DRIVER_CHECKIN', { driverName, vehiclePlate, dockNumber, waitTime });
  }

  async notifyDriverCalled(phone: string, dockNumber: string, bookingRef: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'DRIVER_CALLED', { dockNumber, bookingRef });
  }

  async notifyEcmrReady(phone: string, ecmrRef: string, signatureUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'ECMR_READY', { ecmrRef, signatureUrl });
  }

  async notifySignatureRequest(phone: string, orderRef: string, signatureUrl: string, validity: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'SIGNATURE_REQUEST', { orderRef, signatureUrl, validity });
  }

  async notifySlotReminder(phone: string, date: string, time: string, siteName: string, bookingRef: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'SLOT_REMINDER', { date, time, siteName, bookingRef });
  }

  async notifyInvoiceReady(phone: string, invoiceRef: string, amount: string, invoiceUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'INVOICE_READY', { invoiceRef, amount, invoiceUrl });
  }

  async notifyPaymentReceived(phone: string, amount: string, invoiceRef: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'PAYMENT_RECEIVED', { amount, invoiceRef });
  }

  async notifyAccountCreated(phone: string, loginUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'ACCOUNT_CREATED', { loginUrl });
  }

  async notifyPasswordReset(phone: string, resetUrl: string): Promise<SmsSendResult> {
    return this.sendTemplate(phone, 'PASSWORD_RESET', { resetUrl });
  }

  // Get available templates
  getTemplates(): SmsTemplate[] {
    return Object.values(SMS_TEMPLATES);
  }

  // Get templates by category
  getTemplatesByCategory(category: SmsTemplate['category']): SmsTemplate[] {
    return Object.values(SMS_TEMPLATES).filter(t => t.category === category);
  }

  // Set provider at runtime
  setProvider(provider: SmsProvider): void {
    this.config.provider = provider;
  }

  // Get current provider
  getProvider(): SmsProvider {
    return this.config.provider;
  }
}

// Singleton instance
let smsServiceInstance: SmsService | null = null;

export function getSmsService(config?: Partial<SmsConfig>): SmsService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SmsService(config);
  }
  return smsServiceInstance;
}

export function createSmsService(config?: Partial<SmsConfig>): SmsService {
  return new SmsService(config);
}

export default SmsService;

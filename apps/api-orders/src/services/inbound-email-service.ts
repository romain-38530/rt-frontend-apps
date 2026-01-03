/**
 * InboundEmailService - Traitement des emails entrants avec Claude AI
 * Recoit les emails via AWS SES, les analyse avec Claude, et execute les actions
 */
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import InboundEmail, { IInboundEmail, DetectedIntent } from '../models/InboundEmail';
import Order from '../models/Order';
import EmailAction from '../models/EmailAction';
import TrackingService from './tracking-service';
import EventService from './event-service';

// Configuration Claude API
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

// Configuration SES pour les reponses
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'SYMPHONI.A',
  replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com'
};

let sesClient: SESClient | null = null;
function getSESClient(): SESClient | null {
  if (sesClient) return sesClient;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    sesClient = new SESClient({ region: SES_CONFIG.region, credentials: { accessKeyId, secretAccessKey } });
    return sesClient;
  }
  return null;
}

// Client Anthropic
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;
  if (CLAUDE_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: CLAUDE_API_KEY });
    return anthropicClient;
  }
  console.warn('[InboundEmailService] ANTHROPIC_API_KEY not configured');
  return null;
}

// Interface pour les emails SES entrants (format SNS)
interface SESInboundMessage {
  notificationType: string;
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    sourceArn?: string;
    destination: string[];
    headers: Array<{ name: string; value: string }>;
    commonHeaders: {
      from: string[];
      to: string[];
      subject: string;
      date?: string;
    };
  };
  content?: string;  // Email brut si configuré
}

class InboundEmailService {
  /**
   * Traite un email entrant (appelé depuis le webhook SNS)
   */
  static async processInboundEmail(sesMessage: SESInboundMessage, rawContent?: string): Promise<IInboundEmail> {
    const emailId = `email_${uuidv4()}`;

    // Parser l'email
    const fromHeader = sesMessage.mail.commonHeaders.from[0] || sesMessage.mail.source;
    const fromMatch = fromHeader.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    const fromName = fromMatch?.[1] || '';
    const fromEmail = fromMatch?.[2] || sesMessage.mail.source;

    // Extraire le corps de l'email
    let bodyText = '';
    let bodyHtml = '';

    if (rawContent) {
      const parsed = this.parseEmailContent(rawContent);
      bodyText = parsed.text;
      bodyHtml = parsed.html;
    }

    // Creer l'enregistrement
    const inboundEmail = await InboundEmail.create({
      emailId,
      messageId: sesMessage.mail.messageId,
      fromEmail,
      fromName,
      toEmail: sesMessage.mail.destination[0],
      subject: sesMessage.mail.commonHeaders.subject || '(sans sujet)',
      bodyText,
      bodyHtml,
      status: 'received',
      receivedAt: new Date(sesMessage.mail.timestamp)
    });

    // Detecter le contexte (commande, action token)
    await this.detectContext(inboundEmail);

    // Analyser avec Claude
    await this.analyzeWithClaude(inboundEmail);

    // Executer les actions automatiques
    await this.executeAutoActions(inboundEmail);

    // Envoyer reponse automatique si necessaire
    await this.sendAutoReply(inboundEmail);

    return inboundEmail;
  }

  /**
   * Parse le contenu brut d'un email MIME
   */
  private static parseEmailContent(raw: string): { text: string; html: string } {
    let text = '';
    let html = '';

    // Simplification: extraire text/plain et text/html
    // En production, utiliser un parser MIME complet comme mailparser

    const textMatch = raw.match(/Content-Type: text\/plain[^]*?\r?\n\r?\n([^]*?)(?=--|\r?\n\r?\n--)/i);
    if (textMatch) {
      text = textMatch[1].trim();
    }

    const htmlMatch = raw.match(/Content-Type: text\/html[^]*?\r?\n\r?\n([^]*?)(?=--|\r?\n\r?\n--)/i);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    }

    // Si pas de multipart, prendre tout comme texte
    if (!text && !html) {
      const bodyMatch = raw.match(/\r?\n\r?\n([^]*)/);
      text = bodyMatch ? bodyMatch[1] : raw;
    }

    return { text, html };
  }

  /**
   * Detecte le contexte de l'email (commande associee, token d'action)
   */
  private static async detectContext(email: IInboundEmail): Promise<void> {
    // 1. Chercher une reference de commande dans le sujet ou corps
    const content = `${email.subject} ${email.bodyText}`;

    // Pattern pour references: ORD-2024-xxxxx, REF-xxxxx, etc
    const refMatch = content.match(/(?:ORD|REF|CMD)-\d{4}-\d{5}/gi);
    if (refMatch) {
      const order = await Order.findOne({ reference: refMatch[0].toUpperCase() });
      if (order) {
        email.relatedOrderId = order.orderId;
        email.relatedOrderReference = order.reference;
      }
    }

    // 2. Chercher un token d'action dans les headers In-Reply-To ou References
    // Ou dans le corps du message (si l'utilisateur a copie le lien)
    const tokenMatch = content.match(/actions\/([A-Za-z0-9_-]{43})/);
    if (tokenMatch) {
      const action = await EmailAction.findOne({ token: tokenMatch[1] });
      if (action) {
        email.relatedActionToken = tokenMatch[1];
        email.relatedOrderId = action.orderId;
        email.relatedOrderReference = action.orderReference;
      }
    }

    // 3. Chercher par email expediteur dans les commandes recentes
    if (!email.relatedOrderId) {
      const recentOrder = await Order.findOne({
        $or: [
          { carrierEmail: email.fromEmail },
          { 'createdBy.email': email.fromEmail },
          { 'pickupAddress.contactEmail': email.fromEmail },
          { 'deliveryAddress.contactEmail': email.fromEmail }
        ],
        status: { $nin: ['archived', 'cancelled'] }
      }).sort({ updatedAt: -1 });

      if (recentOrder) {
        email.relatedOrderId = recentOrder.orderId;
        email.relatedOrderReference = recentOrder.reference;
      }
    }

    await email.save();
  }

  /**
   * Analyse l'email avec Claude pour comprendre l'intention
   */
  private static async analyzeWithClaude(email: IInboundEmail): Promise<void> {
    const claude = getAnthropicClient();

    if (!claude) {
      console.log('[InboundEmailService] Claude not configured, skipping analysis');
      email.claudeAnalysis = {
        intent: 'unknown',
        confidence: 0,
        summary: 'Analyse non disponible (API Claude non configuree)'
      };
      email.status = 'analyzed';
      await email.save();
      return;
    }

    email.status = 'parsing';
    await email.save();

    // Contexte pour Claude
    let orderContext = '';
    if (email.relatedOrderId) {
      const order = await Order.findOne({ orderId: email.relatedOrderId });
      if (order) {
        orderContext = `
CONTEXTE COMMANDE:
- Reference: ${order.reference}
- Statut actuel: ${order.status}
- Transporteur: ${order.carrierName || 'Non assigne'}
- Trajet: ${order.pickupAddress?.city} -> ${order.deliveryAddress?.city}
- ETA: ${order.eta ? new Date(order.eta).toLocaleString('fr-FR') : 'Non definie'}
`;
      }
    }

    const systemPrompt = `Tu es un assistant specialise dans la logistique et le transport pour la plateforme SYMPHONI.A.
Tu analyses les emails entrants pour:
1. Identifier l'intention principale de l'expediteur
2. Extraire les informations cles (position, statut, ETA, problemes)
3. Suggerer une action automatique si possible
4. Rediger une reponse appropriee

INTENTIONS POSSIBLES:
- status_update: L'expediteur informe d'un changement de statut (arrive, charge, en route, livre)
- position_update: L'expediteur donne sa position ou localisation
- eta_update: L'expediteur communique un changement d'heure d'arrivee
- issue_report: L'expediteur signale un probleme (retard, panne, accident, marchandise endommagee)
- delivery_confirm: L'expediteur confirme une livraison effectuee
- question: L'expediteur pose une question necessitant une reponse humaine
- document_attached: L'expediteur envoie un document (CMR, BL, facture)
- acknowledgment: Simple accuse de reception sans action requise
- complaint: Plainte ou reclamation necessitant attention
- unknown: Intention non identifiable

Reponds UNIQUEMENT en JSON valide avec cette structure:
{
  "intent": "string (une des intentions ci-dessus)",
  "confidence": number (0-1),
  "extractedData": {
    "newStatus": "string optionnel (in_transit, arrived_pickup, loaded, arrived_delivery, delivered)",
    "position": { "city": "string", "details": "string" },
    "eta": "string ISO date si detecte",
    "issue": { "type": "string", "severity": "low|medium|high|critical", "description": "string" },
    "otherData": {}
  },
  "suggestedAction": "string decrivant l'action automatique recommandee ou null",
  "suggestedResponse": "string avec la reponse email a envoyer",
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high|critical",
  "summary": "string resume en 1-2 phrases"
}`;

    const userPrompt = `Analyse cet email:

DE: ${email.fromName} <${email.fromEmail}>
SUJET: ${email.subject}

CONTENU:
${email.bodyText || '(pas de contenu texte)'}

${orderContext}

Analyse l'intention et extrait les informations pertinentes.`;

    try {
      const response = await claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      });

      // Extraire le JSON de la reponse
      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);

          email.claudeAnalysis = {
            intent: analysis.intent as DetectedIntent,
            confidence: analysis.confidence,
            extractedData: analysis.extractedData,
            suggestedAction: analysis.suggestedAction,
            suggestedResponse: analysis.suggestedResponse,
            sentiment: analysis.sentiment,
            urgency: analysis.urgency,
            summary: analysis.summary
          };
        }
      }

      email.status = 'analyzed';
      await email.save();

      console.log(`[InboundEmailService] Email ${email.emailId} analyzed: ${email.claudeAnalysis?.intent} (${email.claudeAnalysis?.confidence})`);

    } catch (error: any) {
      console.error('[InboundEmailService] Claude analysis error:', error.message);
      email.claudeAnalysis = {
        intent: 'unknown',
        confidence: 0,
        summary: `Erreur d'analyse: ${error.message}`
      };
      email.status = 'analyzed';
      await email.save();
    }
  }

  /**
   * Execute les actions automatiques basees sur l'analyse
   */
  private static async executeAutoActions(email: IInboundEmail): Promise<void> {
    if (!email.claudeAnalysis || email.claudeAnalysis.confidence < 0.7) {
      console.log(`[InboundEmailService] Skipping auto-action: confidence too low (${email.claudeAnalysis?.confidence})`);
      return;
    }

    if (!email.relatedOrderId) {
      console.log('[InboundEmailService] Skipping auto-action: no related order');
      return;
    }

    email.status = 'processing';
    email.actionsExecuted = email.actionsExecuted || [];
    await email.save();

    const analysis = email.claudeAnalysis;
    const order = await Order.findOne({ orderId: email.relatedOrderId });

    if (!order) return;

    try {
      switch (analysis.intent) {
        case 'status_update':
          await this.handleStatusUpdate(email, order, analysis);
          break;

        case 'position_update':
          await this.handlePositionUpdate(email, order, analysis);
          break;

        case 'eta_update':
          await this.handleETAUpdate(email, order, analysis);
          break;

        case 'issue_report':
          await this.handleIssueReport(email, order, analysis);
          break;

        case 'delivery_confirm':
          await this.handleDeliveryConfirm(email, order, analysis);
          break;

        default:
          console.log(`[InboundEmailService] No auto-action for intent: ${analysis.intent}`);
      }

      email.status = 'completed';
      email.processedAt = new Date();
      await email.save();

    } catch (error: any) {
      console.error('[InboundEmailService] Auto-action error:', error.message);
      email.actionsExecuted?.push({
        action: `error_${analysis.intent}`,
        timestamp: new Date(),
        success: false,
        result: { error: error.message }
      });
      email.status = 'failed';
      email.processingError = error.message;
      await email.save();
    }
  }

  /**
   * Gere une mise a jour de statut detectee
   */
  private static async handleStatusUpdate(
    email: IInboundEmail,
    order: any,
    analysis: NonNullable<IInboundEmail['claudeAnalysis']>
  ): Promise<void> {
    const newStatus = analysis.extractedData?.newStatus;
    if (!newStatus) return;

    // Verifier que l'email vient du transporteur
    if (order.carrierEmail !== email.fromEmail) {
      console.log('[InboundEmailService] Status update rejected: email not from carrier');
      return;
    }

    const result = await TrackingService.updateMilestone(
      order.orderId,
      order.carrierId,
      { status: newStatus }
    );

    email.actionsExecuted?.push({
      action: 'status_update',
      timestamp: new Date(),
      success: result.success,
      result: result.success ? { newStatus } : { error: result.error }
    });

    // Log l'evenement
    await EventService.createEvent({
      orderId: order.orderId,
      orderReference: order.reference,
      eventType: 'tracking.started',
      source: 'carrier',
      actorId: email.fromEmail,
      actorType: 'carrier',
      actorName: email.fromName || order.carrierName,
      description: `Statut mis a jour via email: ${newStatus}`,
      data: { emailId: email.emailId, analysis: analysis.summary, viaEmail: true }
    });
  }

  /**
   * Gere une mise a jour de position
   */
  private static async handlePositionUpdate(
    email: IInboundEmail,
    order: any,
    analysis: NonNullable<IInboundEmail['claudeAnalysis']>
  ): Promise<void> {
    const position = analysis.extractedData?.position;
    if (!position) return;

    // Pour une position textuelle, on log l'info sans coordonnees GPS
    await EventService.createEvent({
      orderId: order.orderId,
      orderReference: order.reference,
      eventType: 'tracking.started',
      source: 'carrier',
      actorId: email.fromEmail,
      actorType: 'carrier',
      actorName: email.fromName || order.carrierName,
      description: `Position signalee: ${position.city || ''} ${position.details || ''}`,
      data: { emailId: email.emailId, position, viaEmail: true }
    });

    email.actionsExecuted?.push({
      action: 'position_logged',
      timestamp: new Date(),
      success: true,
      result: { position }
    });
  }

  /**
   * Gere un changement d'ETA
   */
  private static async handleETAUpdate(
    email: IInboundEmail,
    order: any,
    analysis: NonNullable<IInboundEmail['claudeAnalysis']>
  ): Promise<void> {
    const etaString = analysis.extractedData?.eta;
    if (!etaString) return;

    const newEta = new Date(etaString);
    if (isNaN(newEta.getTime())) return;

    if (order.carrierEmail !== email.fromEmail) {
      console.log('[InboundEmailService] ETA update rejected: email not from carrier');
      return;
    }

    const result = await TrackingService.updateETA(
      order.orderId,
      order.carrierId,
      { eta: newEta, reason: analysis.summary }
    );

    email.actionsExecuted?.push({
      action: 'eta_update',
      timestamp: new Date(),
      success: result.success,
      result: result.success ? { newEta } : { error: result.error }
    });
  }

  /**
   * Gere un signalement d'incident
   */
  private static async handleIssueReport(
    email: IInboundEmail,
    order: any,
    analysis: NonNullable<IInboundEmail['claudeAnalysis']>
  ): Promise<void> {
    const issue = analysis.extractedData?.issue;
    if (!issue) return;

    const DeliveryService = (await import('./delivery-service')).default;

    // Mapper les types d'incident
    const issueTypeMap: Record<string, 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other'> = {
      'damaged_goods': 'damage',
      'damage': 'damage',
      'missing_items': 'shortage',
      'shortage': 'shortage',
      'wrong_delivery': 'wrong_product',
      'wrong_product': 'wrong_product',
      'delay': 'delay',
      'other': 'other'
    };

    const result = await DeliveryService.reportDeliveryIssue({
      orderId: order.orderId,
      reportedBy: {
        id: email.fromEmail,
        name: email.fromName || email.fromEmail,
        role: order.carrierEmail === email.fromEmail ? 'carrier' : 'recipient',
        email: email.fromEmail
      },
      issueType: issueTypeMap[issue.type] || 'other',
      severity: (issue.severity as 'minor' | 'major' | 'critical') || 'major',
      description: issue.description || analysis.summary || email.bodyText?.substring(0, 500) || ''
    });

    email.actionsExecuted?.push({
      action: 'issue_report',
      timestamp: new Date(),
      success: result.success,
      result
    });
  }

  /**
   * Gere une confirmation de livraison
   */
  private static async handleDeliveryConfirm(
    email: IInboundEmail,
    order: any,
    analysis: NonNullable<IInboundEmail['claudeAnalysis']>
  ): Promise<void> {
    // Les confirmations de livraison necessitent generalement une signature
    // On log l'intention mais on ne valide pas automatiquement

    await EventService.createEvent({
      orderId: order.orderId,
      orderReference: order.reference,
      eventType: 'order.delivered',
      source: 'carrier',
      actorId: email.fromEmail,
      actorType: 'carrier',
      actorName: email.fromName || order.carrierName,
      description: `Confirmation de livraison recue par email (validation manuelle requise)`,
      data: { emailId: email.emailId, requiresValidation: true, viaEmail: true }
    });

    email.actionsExecuted?.push({
      action: 'delivery_confirm_logged',
      timestamp: new Date(),
      success: true,
      result: { requiresManualValidation: true }
    });
  }

  /**
   * Envoie une reponse automatique
   */
  private static async sendAutoReply(email: IInboundEmail): Promise<void> {
    // Ne pas repondre aux intentions inconnues ou a faible confiance
    if (!email.claudeAnalysis ||
        email.claudeAnalysis.intent === 'unknown' ||
        email.claudeAnalysis.confidence < 0.6) {
      return;
    }

    // Ne pas repondre aux accusés de reception
    if (email.claudeAnalysis.intent === 'acknowledgment') {
      return;
    }

    const suggestedResponse = email.claudeAnalysis.suggestedResponse;
    if (!suggestedResponse) return;

    const client = getSESClient();
    if (!client) {
      console.log('[InboundEmailService] SES not configured, skipping auto-reply');
      return;
    }

    // Construire le HTML de la reponse
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">SYMPHONI.A</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Reponse automatique</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            ${suggestedResponse.replace(/\n/g, '<br>')}

            ${email.relatedOrderReference ? `
            <div style="background: #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>Reference:</strong> ${email.relatedOrderReference}</p>
            </div>
            ` : ''}

            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              Ce message a ete genere automatiquement par SYMPHONI.A.<br>
              Pour toute question, contactez notre equipe support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;
    const subject = `Re: ${email.subject}`;

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: { ToAddresses: [email.fromEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      ReplyToAddresses: [SES_CONFIG.replyTo]
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await client.send(command);

      email.autoReply = {
        sent: true,
        sentAt: new Date(),
        messageId: response.MessageId,
        content: suggestedResponse
      };

      await email.save();
      console.log(`[InboundEmailService] Auto-reply sent to ${email.fromEmail}: ${response.MessageId}`);

    } catch (error: any) {
      console.error('[InboundEmailService] Auto-reply error:', error.message);
      email.autoReply = {
        sent: false,
        content: suggestedResponse
      };
      await email.save();
    }
  }

  /**
   * Recupere les emails recents pour une commande
   */
  static async getEmailsForOrder(orderId: string): Promise<IInboundEmail[]> {
    return InboundEmail.find({ relatedOrderId: orderId })
      .sort({ receivedAt: -1 })
      .limit(50);
  }

  /**
   * Recupere les emails en attente de traitement
   */
  static async getPendingEmails(): Promise<IInboundEmail[]> {
    return InboundEmail.find({ status: { $in: ['received', 'parsing'] } })
      .sort({ receivedAt: 1 });
  }

  /**
   * Statistiques des emails traites
   */
  static async getEmailStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await InboundEmail.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byIntent: [
            { $match: { 'claudeAnalysis.intent': { $exists: true } } },
            { $group: { _id: '$claudeAnalysis.intent', count: { $sum: 1 } } }
          ],
          todayCount: [
            { $match: { receivedAt: { $gte: today } } },
            { $count: 'count' }
          ],
          autoReplied: [
            { $match: { 'autoReply.sent': true } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    return {
      byStatus: Object.fromEntries((stats[0]?.byStatus || []).map((s: any) => [s._id, s.count])),
      byIntent: Object.fromEntries((stats[0]?.byIntent || []).map((s: any) => [s._id, s.count])),
      todayCount: stats[0]?.todayCount[0]?.count || 0,
      autoRepliedCount: stats[0]?.autoReplied[0]?.count || 0
    };
  }
}

export default InboundEmailService;

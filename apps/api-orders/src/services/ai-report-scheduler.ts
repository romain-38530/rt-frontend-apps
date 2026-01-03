/**
 * AI Report Scheduler - Planification des rapports IA mensuels
 * Génère automatiquement les rapports d'analyse le 1er de chaque mois
 */
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import AIAnalyticsService from './ai-analytics-service';
import Order from '../models/Order';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'reports@symphonia-controltower.com',
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
      credentials: { accessKeyId, secretAccessKey },
    });
    console.log(`[AIReportScheduler] AWS SES configured for region: ${SES_CONFIG.region}`);
    return sesClient;
  }

  console.warn('[AIReportScheduler] AWS SES not configured - emails will be logged only');
  return null;
}

interface ScheduledEntity {
  type: 'industrial' | 'carrier' | 'logistician';
  id: string;
  name: string;
  email?: string;
}

class AIReportScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Démarre le scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.log('[AI Report Scheduler] Already running');
      return;
    }

    console.log('[AI Report Scheduler] Starting monthly report scheduler');

    // Vérifier toutes les heures si c'est le moment de générer les rapports
    this.intervalId = setInterval(() => {
      this.checkAndGenerateReports();
    }, 60 * 60 * 1000); // 1 heure

    // Vérification initiale au démarrage
    this.checkAndGenerateReports();
  }

  /**
   * Arrête le scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[AI Report Scheduler] Stopped');
    }
  }

  /**
   * Vérifie si c'est le moment de générer les rapports (1er du mois, 6h du matin)
   */
  private async checkAndGenerateReports(): Promise<void> {
    const now = new Date();
    const day = now.getDate();
    const hour = now.getHours();

    // Générer les rapports le 1er du mois entre 6h et 7h
    if (day === 1 && hour === 6 && !this.isRunning) {
      console.log('[AI Report Scheduler] First of month detected - generating reports');
      await this.generateAllMonthlyReports();
    }
  }

  /**
   * Génère tous les rapports mensuels
   */
  async generateAllMonthlyReports(): Promise<void> {
    if (this.isRunning) {
      console.log('[AI Report Scheduler] Already generating reports, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Mois précédent (le rapport du 1er janvier analyse décembre)
      const now = new Date();
      const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      console.log(`[AI Report Scheduler] Generating reports for ${reportMonth}/${reportYear}`);

      // Récupérer les entités actives
      const entities = await this.getActiveEntities(reportMonth, reportYear);
      console.log(`[AI Report Scheduler] Found ${entities.length} entities to analyze`);

      let successCount = 0;
      let errorCount = 0;

      for (const entity of entities) {
        try {
          await this.generateReportForEntity(entity, reportMonth, reportYear);
          successCount++;
        } catch (error) {
          console.error(`[AI Report Scheduler] Error for ${entity.type} ${entity.id}:`, error);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[AI Report Scheduler] Completed: ${successCount} success, ${errorCount} errors in ${duration}ms`);

    } catch (error) {
      console.error('[AI Report Scheduler] Fatal error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Génère un rapport pour une entité spécifique
   */
  private async generateReportForEntity(
    entity: ScheduledEntity,
    month: number,
    year: number
  ): Promise<void> {
    console.log(`[AI Report Scheduler] Generating ${entity.type} report for ${entity.name}`);

    let report;

    switch (entity.type) {
      case 'industrial':
        report = await AIAnalyticsService.generateIndustrialReport(
          entity.id,
          entity.name,
          month,
          year
        );
        break;

      case 'carrier':
        report = await AIAnalyticsService.generateCarrierReport(
          entity.id,
          entity.name,
          month,
          year
        );
        break;

      case 'logistician':
        report = await AIAnalyticsService.generateLogisticianReport(
          entity.id,
          entity.name,
          month,
          year
        );
        break;
    }

    // Envoyer une notification par email si disponible
    if (report && entity.email) {
      await this.sendReportNotification(entity, report);
    }
  }

  /**
   * Récupère les entités actives pour le mois donné
   */
  private async getActiveEntities(month: number, year: number): Promise<ScheduledEntity[]> {
    const entities: ScheduledEntity[] = [];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Industriels actifs (ont eu des commandes)
    const industrials = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$industrialId',
          orderCount: { $sum: 1 }
        }
      },
      {
        $match: { orderCount: { $gte: 1 } }
      }
    ]);

    for (const ind of industrials) {
      entities.push({
        type: 'industrial',
        id: ind._id,
        name: `Industriel ${ind._id}` // Sera enrichi par l'API utilisateurs
      });
    }

    // Transporteurs actifs
    const carriers = await Order.aggregate([
      {
        $match: {
          carrierId: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$carrierId',
          carrierName: { $first: '$carrierName' },
          carrierEmail: { $first: '$carrierEmail' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $match: { orderCount: { $gte: 1 } }
      }
    ]);

    for (const carrier of carriers) {
      entities.push({
        type: 'carrier',
        id: carrier._id,
        name: carrier.carrierName || `Transporteur ${carrier._id}`,
        email: carrier.carrierEmail
      });
    }

    // Logisticiens actifs
    const logisticians = await Order.aggregate([
      {
        $match: {
          logisticianId: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$logisticianId',
          orderCount: { $sum: 1 }
        }
      },
      {
        $match: { orderCount: { $gte: 1 } }
      }
    ]);

    for (const log of logisticians) {
      entities.push({
        type: 'logistician',
        id: log._id,
        name: `Logisticien ${log._id}`
      });
    }

    return entities;
  }

  /**
   * Envoie une notification email pour un rapport via AWS SES
   */
  private async sendReportNotification(entity: ScheduledEntity, report: any): Promise<void> {
    const client = getSESClient();

    if (!entity.email) {
      console.log(`[AI Report Scheduler] Email not sent - no email for entity`);
      return;
    }

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const subject = `[SYMPHONI.A] Votre rapport d'analyse ${monthNames[report.period.month - 1]} ${report.period.year}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Rapport d'Analyse Mensuel</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${monthNames[report.period.month - 1]} ${report.period.year}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${entity.name},</p>
            <p>Votre rapport d'analyse mensuel est disponible sur SYMPHONI.A.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Résumé</h3>
              <p>${report.executiveSummary.overview}</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Points clés</h3>
              <ul>
                ${report.executiveSummary.keyFindings.map((f: string) => `<li>${f}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
              <strong>Recommandation principale:</strong>
              <p style="margin: 10px 0 0 0;">${report.executiveSummary.mainRecommendation}</p>
            </div>

            <p>Connectez-vous à votre espace pour consulter le rapport détaillé et le plan d'action.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;

    if (!client) {
      console.log(`[AI Report Scheduler] MOCK EMAIL to ${entity.email}: ${subject}`);
      return;
    }

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: { ToAddresses: [entity.email] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      ReplyToAddresses: [SES_CONFIG.replyTo]
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await client.send(command);
      console.log(`[AI Report Scheduler] Notification sent to ${entity.email}: ${response.MessageId}`);
    } catch (error: any) {
      console.error(`[AI Report Scheduler] Failed to send notification:`, error.message);
    }
  }

  /**
   * Génère manuellement un rapport (pour tests ou demande explicite)
   */
  async generateManualReport(
    entityType: 'industrial' | 'carrier' | 'logistician',
    entityId: string,
    entityName: string,
    month?: number,
    year?: number
  ): Promise<any> {
    const now = new Date();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear = year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

    console.log(`[AI Report Scheduler] Manual generation: ${entityType} ${entityId} for ${targetMonth}/${targetYear}`);

    switch (entityType) {
      case 'industrial':
        return AIAnalyticsService.generateIndustrialReport(entityId, entityName, targetMonth, targetYear);
      case 'carrier':
        return AIAnalyticsService.generateCarrierReport(entityId, entityName, targetMonth, targetYear);
      case 'logistician':
        return AIAnalyticsService.generateLogisticianReport(entityId, entityName, targetMonth, targetYear);
    }
  }
}

export default new AIReportScheduler();

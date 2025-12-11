/**
 * AI Report Scheduler - Planification des rapports IA mensuels
 * Génère automatiquement les rapports d'analyse le 1er de chaque mois
 */
import nodemailer from 'nodemailer';
import AIAnalyticsService from './ai-analytics-service';
import Order from '../models/Order';

// Configuration email
const smtpConfig = {
  host: process.env.SMTP_HOST || 'ssl0.ovh.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  }
};

const isSmtpConfigured = Boolean(smtpConfig.auth.user && smtpConfig.auth.pass);
const transporter = isSmtpConfigured ? nodemailer.createTransport(smtpConfig) : null;

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
   * Envoie une notification email pour un rapport
   */
  private async sendReportNotification(entity: ScheduledEntity, report: any): Promise<void> {
    if (!entity.email || !transporter) {
      console.log(`[AI Report Scheduler] Email not sent - ${!entity.email ? 'no email' : 'SMTP not configured'}`);
      return;
    }

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const subject = `[SYMPHONI.A] Votre rapport d'analyse ${monthNames[report.period.month - 1]} ${report.period.year}`;

    const text = `
Bonjour ${entity.name},

Votre rapport d'analyse mensuel est disponible sur SYMPHONI.A.

Résumé:
${report.executiveSummary.overview}

Points clés:
${report.executiveSummary.keyFindings.map((f: string) => `- ${f}`).join('\n')}

Recommandation principale:
${report.executiveSummary.mainRecommendation}

Connectez-vous à votre espace pour consulter le rapport détaillé et le plan d'action.

Cordialement,
L'équipe SYMPHONI.A
    `.trim();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@symphonia-controltower.com',
        to: entity.email,
        subject,
        text
      });
      console.log(`[AI Report Scheduler] Notification sent to ${entity.email}`);
    } catch (error) {
      console.error(`[AI Report Scheduler] Failed to send notification:`, error);
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

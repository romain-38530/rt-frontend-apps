/**
 * TimeoutScheduler - Service de gestion automatique des timeouts transporteurs
 * Vérifie périodiquement les tentatives expirées et passe au transporteur suivant
 * Envoie également des rappels à 50% du délai
 */
import DispatchChain, { IDispatchChain, IDispatchAttempt } from '../models/DispatchChain';
import DispatchService from './dispatch-service';
import EventService from './event-service';
import NotificationService from './notification-service';
import Lane from '../models/Lane';

class TimeoutScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs: number;

  constructor(checkIntervalMinutes: number = 1) {
    this.checkIntervalMs = checkIntervalMinutes * 60 * 1000;
  }

  /**
   * Démarre le scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('[TimeoutScheduler] Already running');
      return;
    }

    console.log(`[TimeoutScheduler] Starting - checking every ${this.checkIntervalMs / 1000}s`);
    this.isRunning = true;

    // Exécuter immédiatement puis périodiquement
    this.checkExpiredAttempts();
    this.intervalId = setInterval(() => {
      this.checkExpiredAttempts();
    }, this.checkIntervalMs);
  }

  /**
   * Arrête le scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[TimeoutScheduler] Stopped');
  }

  /**
   * Vérifie et traite les tentatives expirées et envoie les rappels
   */
  async checkExpiredAttempts(): Promise<void> {
    try {
      const now = new Date();

      // Trouver les chaînes en cours avec des tentatives envoyées
      const chains = await DispatchChain.find({
        status: 'in_progress',
        'attempts.status': 'sent'
      });

      for (const chain of chains) {
        // Vérifier d'abord les rappels à envoyer
        await this.checkAndSendReminder(chain, now);
        // Ensuite traiter les timeouts
        await this.processChainTimeouts(chain, now);
      }
    } catch (error) {
      console.error('[TimeoutScheduler] Error checking timeouts:', error);
    }
  }

  /**
   * Vérifie si un rappel doit être envoyé (50% du délai écoulé)
   */
  private async checkAndSendReminder(chain: IDispatchChain, now: Date): Promise<void> {
    const currentAttempt = chain.attempts[chain.currentAttemptIndex];

    if (!currentAttempt || currentAttempt.status !== 'sent') {
      return;
    }

    // Si rappel déjà envoyé, ne rien faire
    if (currentAttempt.reminderSentAt) {
      return;
    }

    // Calculer le point de 50% du délai
    if (!currentAttempt.sentAt || !currentAttempt.expiresAt) {
      return;
    }

    const totalDuration = currentAttempt.expiresAt.getTime() - currentAttempt.sentAt.getTime();
    const halfwayPoint = new Date(currentAttempt.sentAt.getTime() + totalDuration / 2);

    // Si on a dépassé 50% du délai
    if (now >= halfwayPoint) {
      const minutesRemaining = Math.round((currentAttempt.expiresAt.getTime() - now.getTime()) / (1000 * 60));

      if (minutesRemaining <= 0) {
        return; // Déjà expiré, le timeout sera géré par processChainTimeouts
      }

      try {
        // Récupérer l'email du transporteur depuis la Lane
        const carrierEmail = await this.getCarrierEmail(currentAttempt.carrierId, chain.laneId);

        if (carrierEmail) {
          const responseUrl = `${process.env.PORTAL_URL || 'https://portail.symphonia-controltower.com'}/dispatch/respond/${chain.chainId}`;

          await NotificationService.sendTimeoutReminder({
            carrierId: currentAttempt.carrierId,
            carrierName: currentAttempt.carrierName,
            carrierEmail,
            orderReference: chain.orderReference,
            minutesRemaining,
            responseUrl
          });

          // Marquer le rappel comme envoyé
          currentAttempt.reminderSentAt = now;
          await chain.save();

          console.log(`[TimeoutScheduler] Reminder sent to ${currentAttempt.carrierName} - ${minutesRemaining} min remaining`);
        }
      } catch (error: any) {
        console.error(`[TimeoutScheduler] Error sending reminder for chain ${chain.chainId}:`, error.message);
      }
    }
  }

  /**
   * Récupère l'email d'un transporteur depuis la Lane
   */
  private async getCarrierEmail(carrierId: string, laneId?: string): Promise<string | null> {
    if (!laneId) return null;

    try {
      const lane = await Lane.findOne({ laneId });
      if (!lane) return null;

      const carrierInLane = lane.carriers.find(c => c.carrierId === carrierId);
      if (!carrierInLane) return null;

      // Priorité: contact dans Lane > variable d'environnement
      return carrierInLane.contact?.email ||
             process.env[`CARRIER_EMAIL_${carrierId}`] ||
             null;
    } catch {
      return null;
    }
  }

  /**
   * Traite les timeouts pour une chaîne spécifique
   */
  private async processChainTimeouts(chain: IDispatchChain, now: Date): Promise<void> {
    const currentAttempt = chain.attempts[chain.currentAttemptIndex];

    if (!currentAttempt || currentAttempt.status !== 'sent') {
      return;
    }

    // Vérifier si la tentative a expiré
    if (currentAttempt.expiresAt && now > currentAttempt.expiresAt) {
      console.log(`[TimeoutScheduler] Timeout detected for chain ${chain.chainId}, carrier ${currentAttempt.carrierName}`);

      try {
        await DispatchService.handleCarrierTimeout(chain.chainId, chain.currentAttemptIndex);
        console.log(`[TimeoutScheduler] Timeout processed for chain ${chain.chainId}`);
      } catch (error: any) {
        console.error(`[TimeoutScheduler] Error processing timeout for chain ${chain.chainId}:`, error.message);
      }
    }
  }

  /**
   * Récupère les statistiques du scheduler
   */
  async getStats(): Promise<{
    isRunning: boolean;
    checkIntervalMs: number;
    pendingTimeouts: number;
  }> {
    const now = new Date();

    // Compter les tentatives qui vont expirer dans les prochaines minutes
    const pendingTimeouts = await DispatchChain.countDocuments({
      status: 'in_progress',
      'attempts.status': 'sent',
      'attempts.expiresAt': { $lte: new Date(now.getTime() + 5 * 60 * 1000) }
    });

    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      pendingTimeouts
    };
  }
}

// Singleton instance
const timeoutScheduler = new TimeoutScheduler(1); // Check every minute

export default timeoutScheduler;

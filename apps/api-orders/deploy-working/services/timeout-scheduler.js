"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * TimeoutScheduler - Service de gestion automatique des timeouts transporteurs
 * Vérifie périodiquement les tentatives expirées et passe au transporteur suivant
 * Envoie également des rappels à 50% du délai
 */
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
const dispatch_service_1 = __importDefault(require("./dispatch-service"));
const notification_service_1 = __importDefault(require("./notification-service"));
const Lane_1 = __importDefault(require("../models/Lane"));
class TimeoutScheduler {
    constructor(checkIntervalMinutes = 1) {
        this.intervalId = null;
        this.isRunning = false;
        this.checkIntervalMs = checkIntervalMinutes * 60 * 1000;
    }
    /**
     * Démarre le scheduler
     */
    start() {
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
    stop() {
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
    async checkExpiredAttempts() {
        try {
            const now = new Date();
            // Trouver les chaînes en cours avec des tentatives envoyées
            const chains = await DispatchChain_1.default.find({
                status: 'in_progress',
                'attempts.status': 'sent'
            });
            for (const chain of chains) {
                // Vérifier d'abord les rappels à envoyer
                await this.checkAndSendReminder(chain, now);
                // Ensuite traiter les timeouts
                await this.processChainTimeouts(chain, now);
            }
        }
        catch (error) {
            console.error('[TimeoutScheduler] Error checking timeouts:', error);
        }
    }
    /**
     * Vérifie si un rappel doit être envoyé (50% du délai écoulé)
     */
    async checkAndSendReminder(chain, now) {
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
                    await notification_service_1.default.sendTimeoutReminder({
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
            }
            catch (error) {
                console.error(`[TimeoutScheduler] Error sending reminder for chain ${chain.chainId}:`, error.message);
            }
        }
    }
    /**
     * Récupère l'email d'un transporteur depuis la Lane
     */
    async getCarrierEmail(carrierId, laneId) {
        if (!laneId)
            return null;
        try {
            const lane = await Lane_1.default.findOne({ laneId });
            if (!lane)
                return null;
            const carrierInLane = lane.carriers.find(c => c.carrierId === carrierId);
            if (!carrierInLane)
                return null;
            // Priorité: contact dans Lane > variable d'environnement
            return carrierInLane.contact?.email ||
                process.env[`CARRIER_EMAIL_${carrierId}`] ||
                null;
        }
        catch {
            return null;
        }
    }
    /**
     * Traite les timeouts pour une chaîne spécifique
     */
    async processChainTimeouts(chain, now) {
        const currentAttempt = chain.attempts[chain.currentAttemptIndex];
        if (!currentAttempt || currentAttempt.status !== 'sent') {
            return;
        }
        // Vérifier si la tentative a expiré
        if (currentAttempt.expiresAt && now > currentAttempt.expiresAt) {
            console.log(`[TimeoutScheduler] Timeout detected for chain ${chain.chainId}, carrier ${currentAttempt.carrierName}`);
            try {
                await dispatch_service_1.default.handleCarrierTimeout(chain.chainId, chain.currentAttemptIndex);
                console.log(`[TimeoutScheduler] Timeout processed for chain ${chain.chainId}`);
            }
            catch (error) {
                console.error(`[TimeoutScheduler] Error processing timeout for chain ${chain.chainId}:`, error.message);
            }
        }
    }
    /**
     * Récupère les statistiques du scheduler
     */
    async getStats() {
        const now = new Date();
        // Compter les tentatives qui vont expirer dans les prochaines minutes
        const pendingTimeouts = await DispatchChain_1.default.countDocuments({
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
exports.default = timeoutScheduler;
//# sourceMappingURL=timeout-scheduler.js.map
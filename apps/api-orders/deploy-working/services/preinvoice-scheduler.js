"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * PreInvoiceScheduler - Service de planification automatique des préfactures
 *
 * Jobs planifiés:
 * - 1er du mois 08:00: Envoi des préfactures mensuelles aux industriels
 * - Quotidien 09:00: Mise à jour des décomptes de paiement
 */
const preinvoice_service_1 = __importDefault(require("./preinvoice-service"));
class PreInvoiceScheduler {
    constructor() {
        this.monthlyIntervalId = null;
        this.dailyIntervalId = null;
        this.isRunning = false;
    }
    /**
     * Démarre le scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('[PreInvoiceScheduler] Already running');
            return;
        }
        console.log('[PreInvoiceScheduler] Starting...');
        this.isRunning = true;
        // Vérifier immédiatement si on est le 1er du mois (pour rattraper si le serveur redémarre)
        this.checkAndSendMonthlyPreInvoices();
        // Planifier la vérification quotidienne (toutes les 24h)
        // Le job quotidien vérifie si c'est le 1er du mois OU met à jour les décomptes
        this.dailyIntervalId = setInterval(() => {
            this.runDailyTasks();
        }, 24 * 60 * 60 * 1000); // 24 heures
        // Également vérifier toutes les heures pour le décompte (plus précis)
        this.monthlyIntervalId = setInterval(() => {
            this.updatePaymentCountdowns();
        }, 60 * 60 * 1000); // 1 heure
        console.log('[PreInvoiceScheduler] Started - Monthly invoices on 1st, daily countdown updates');
    }
    /**
     * Arrête le scheduler
     */
    stop() {
        if (this.monthlyIntervalId) {
            clearInterval(this.monthlyIntervalId);
            this.monthlyIntervalId = null;
        }
        if (this.dailyIntervalId) {
            clearInterval(this.dailyIntervalId);
            this.dailyIntervalId = null;
        }
        this.isRunning = false;
        console.log('[PreInvoiceScheduler] Stopped');
    }
    /**
     * Tâches quotidiennes
     */
    async runDailyTasks() {
        const now = new Date();
        const dayOfMonth = now.getDate();
        // Si c'est le 1er du mois, envoyer les préfactures mensuelles
        if (dayOfMonth === 1) {
            await this.checkAndSendMonthlyPreInvoices();
        }
        // Mettre à jour les décomptes de paiement
        await this.updatePaymentCountdowns();
    }
    /**
     * Vérifie et envoie les préfactures mensuelles (1er du mois)
     */
    async checkAndSendMonthlyPreInvoices() {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const hour = now.getHours();
        // Uniquement le 1er du mois après 8h
        if (dayOfMonth !== 1) {
            return;
        }
        // Éviter d'envoyer plusieurs fois le même jour
        const lastSentKey = `preinvoice_monthly_${now.getFullYear()}_${now.getMonth() + 1}`;
        const lastSent = global[lastSentKey];
        if (lastSent) {
            return;
        }
        try {
            console.log('[PreInvoiceScheduler] Sending monthly pre-invoices...');
            const sentCount = await preinvoice_service_1.default.sendMonthlyPreInvoicesToIndustrials();
            // Marquer comme envoyé pour ce mois
            global[lastSentKey] = true;
            console.log(`[PreInvoiceScheduler] Monthly pre-invoices sent: ${sentCount} industriels notifiés`);
        }
        catch (error) {
            console.error('[PreInvoiceScheduler] Error sending monthly pre-invoices:', error.message);
        }
    }
    /**
     * Met à jour les décomptes de paiement
     */
    async updatePaymentCountdowns() {
        try {
            const updatedCount = await preinvoice_service_1.default.updatePaymentCountdowns();
            if (updatedCount > 0) {
                console.log(`[PreInvoiceScheduler] Payment countdowns updated: ${updatedCount}`);
                global.lastCountdownUpdate = new Date();
            }
        }
        catch (error) {
            console.error('[PreInvoiceScheduler] Error updating countdowns:', error.message);
        }
    }
    /**
     * Force l'envoi des préfactures mensuelles (pour test ou rattrapage)
     */
    async forceMonthlyPreInvoices() {
        console.log('[PreInvoiceScheduler] Forcing monthly pre-invoices...');
        return preinvoice_service_1.default.sendMonthlyPreInvoicesToIndustrials();
    }
    /**
     * Récupère les statistiques du scheduler
     */
    getStats() {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
        return {
            isRunning: this.isRunning,
            nextMonthlyRun: nextMonth,
            lastCountdownUpdate: global.lastCountdownUpdate || null
        };
    }
}
// Singleton instance
const preinvoiceScheduler = new PreInvoiceScheduler();
exports.default = preinvoiceScheduler;
//# sourceMappingURL=preinvoice-scheduler.js.map
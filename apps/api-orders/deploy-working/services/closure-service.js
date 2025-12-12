"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service de clôture automatique - SYMPHONI.A
 * Gère la clôture des commandes et l'archivage après 30 jours
 */
const Order_1 = __importDefault(require("../models/Order"));
const document_service_1 = __importDefault(require("./document-service"));
const scoring_service_1 = __importDefault(require("./scoring-service"));
const archive_service_1 = __importDefault(require("./archive-service"));
const event_service_1 = __importDefault(require("./event-service"));
const preinvoice_service_1 = __importDefault(require("./preinvoice-service"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configuration email
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
class ClosureService {
    /**
     * Vérifie si une commande peut être clôturée
     */
    static async checkClosureEligibility(orderId) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order) {
            return { eligible: false, reason: 'Commande non trouvée' };
        }
        // La commande doit être livrée
        if (!['delivered', 'completed'].includes(order.status)) {
            return { eligible: false, reason: `Statut incorrect: ${order.status}` };
        }
        const missingItems = [];
        // Vérifier les documents requis
        const docCheck = await document_service_1.default.checkRequiredDocuments(orderId);
        if (!docCheck.complete) {
            if (docCheck.missing.length > 0) {
                missingItems.push(...docCheck.missing.map(d => `Document manquant: ${d.toUpperCase()}`));
            }
            if (docCheck.pending.length > 0) {
                missingItems.push(...docCheck.pending.map(d => `Document en attente: ${d.toUpperCase()}`));
            }
        }
        // Vérifier le scoring (si transporteur assigné)
        if (order.carrierId) {
            const score = await scoring_service_1.default.getOrderScore(orderId);
            if (!score) {
                missingItems.push('Score transporteur non calculé');
            }
        }
        if (missingItems.length > 0) {
            return { eligible: false, reason: 'Éléments manquants', missingItems };
        }
        return { eligible: true };
    }
    /**
     * Clôture une commande manuellement
     */
    static async closeOrder(orderId, closedBy) {
        try {
            const order = await Order_1.default.findOne({ orderId });
            if (!order) {
                return { success: false, orderId, status: 'error', message: 'Commande non trouvée' };
            }
            // Vérifier l'éligibilité
            const eligibility = await this.checkClosureEligibility(orderId);
            if (!eligibility.eligible) {
                return {
                    success: false,
                    orderId,
                    status: 'pending_documents',
                    message: eligibility.reason || 'Non éligible à la clôture'
                };
            }
            // Mettre à jour le statut
            order.status = 'completed';
            order.closedAt = new Date();
            order.closedBy = closedBy;
            await order.save();
            // Créer l'événement
            await event_service_1.default.createEvent({
                orderId,
                orderReference: order.reference,
                eventType: 'order.completed',
                source: 'user',
                actorId: closedBy.id,
                actorName: closedBy.name,
                data: { closedAt: new Date() }
            });
            // Ajouter à la préfacturation du transporteur (si transporteur assigné)
            if (order.carrierId) {
                try {
                    await preinvoice_service_1.default.addCompletedOrder(order.orderId);
                    console.log(`[ClosureService] Order ${orderId} added to carrier ${order.carrierId} pre-invoice`);
                }
                catch (preInvoiceError) {
                    console.error(`[ClosureService] Error adding to pre-invoice: ${preInvoiceError.message}`);
                    // Ne pas bloquer la clôture si la préfacturation échoue
                }
            }
            // Notifier les parties
            await this.notifyOrderClosed(order);
            return {
                success: true,
                orderId,
                status: 'completed',
                message: 'Commande clôturée avec succès'
            };
        }
        catch (error) {
            return { success: false, orderId, status: 'error', message: error.message };
        }
    }
    /**
     * Clôture automatique des commandes livrées depuis plus de X heures
     * À exécuter via un cron job
     */
    static async autoCloseDeliveredOrders(hoursAfterDelivery = 24) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursAfterDelivery);
        // Trouver les commandes livrées depuis plus de X heures
        const orders = await Order_1.default.find({
            status: 'delivered',
            'dates.actualDeliveryDate': { $lte: cutoffDate }
        });
        const results = {
            processed: orders.length,
            closed: 0,
            pending: 0,
            errors: []
        };
        for (const order of orders) {
            try {
                const eligibility = await this.checkClosureEligibility(order.orderId);
                if (eligibility.eligible) {
                    order.status = 'completed';
                    order.closedAt = new Date();
                    order.closedBy = { id: 'system', name: 'Clôture automatique' };
                    await order.save();
                    await event_service_1.default.createEvent({
                        orderId: order.orderId,
                        orderReference: order.reference,
                        eventType: 'order.completed',
                        source: 'system',
                        data: { automatic: true, closedAt: new Date() }
                    });
                    // Ajouter à la préfacturation du transporteur (si transporteur assigné)
                    if (order.carrierId) {
                        try {
                            await preinvoice_service_1.default.addCompletedOrder(order.orderId);
                            console.log(`[ClosureService] Auto-close: Order ${order.orderId} added to carrier ${order.carrierId} pre-invoice`);
                        }
                        catch (preInvoiceError) {
                            console.error(`[ClosureService] Auto-close pre-invoice error: ${preInvoiceError.message}`);
                        }
                    }
                    results.closed++;
                }
                else {
                    results.pending++;
                }
            }
            catch (error) {
                results.errors.push(`${order.orderId}: ${error.message}`);
            }
        }
        console.log(`[ClosureService] Auto-close: ${results.closed} fermées, ${results.pending} en attente, ${results.errors.length} erreurs`);
        return results;
    }
    /**
     * Archivage automatique des commandes clôturées depuis plus de X jours
     * Conservation 10 ans selon les obligations légales
     */
    static async autoArchiveCompletedOrders(daysAfterClosure = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAfterClosure);
        // Trouver les commandes complétées depuis plus de X jours
        const orders = await Order_1.default.find({
            status: 'completed',
            $or: [
                { closedAt: { $lte: cutoffDate } },
                { 'dates.actualDeliveryDate': { $lte: cutoffDate } }
            ]
        });
        const results = {
            processed: orders.length,
            archived: 0,
            errors: []
        };
        for (const order of orders) {
            try {
                // Créer l'archive (sans documents pour l'instant - ils sont déjà stockés)
                const archive = await archive_service_1.default.archiveOrder(order.orderId, [], 'system');
                // Mettre à jour le statut
                order.status = 'archived';
                await order.save();
                // Créer l'événement
                await event_service_1.default.orderArchived(order.orderId, order.reference, archive.archiveId);
                // Archiver les documents
                await document_service_1.default.archiveOrderDocuments(order.orderId);
                results.archived++;
            }
            catch (error) {
                results.errors.push(`${order.orderId}: ${error.message}`);
            }
        }
        console.log(`[ClosureService] Auto-archive: ${results.archived} archivées, ${results.errors.length} erreurs`);
        return results;
    }
    /**
     * Notifie la clôture d'une commande
     */
    static async notifyOrderClosed(order) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .summary { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Commande Clôturée</h1>
            <p>SYMPHONI.A</p>
          </div>
          <div class="content">
            <p>La commande <strong>${order.reference}</strong> a été clôturée avec succès.</p>

            <div class="summary">
              <p><strong>Référence :</strong> ${order.reference}</p>
              <p><strong>Trajet :</strong> ${order.pickupAddress?.city} → ${order.deliveryAddress?.city}</p>
              <p><strong>Livraison :</strong> ${order.dates?.actualDeliveryDate ? new Date(order.dates.actualDeliveryDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
              <p><strong>Transporteur :</strong> ${order.carrierName || order.carrierId || 'N/A'}</p>
            </div>

            <p>📁 Cette commande sera automatiquement archivée dans 30 jours et conservée 10 ans conformément aux obligations légales.</p>

            <p>Tous les documents (CMR, POD, factures) sont disponibles dans votre espace.</p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
        if (order.createdBy?.email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
                    to: order.createdBy.email,
                    subject: `[SYMPHONI.A] ✅ Commande clôturée - ${order.reference}`,
                    html
                });
            }
            catch (error) {
                console.error('[ClosureService] Email error:', error);
            }
        }
    }
    /**
     * Statistiques de clôture
     */
    static async getClosureStats(industrialId) {
        const matchStage = {};
        if (industrialId) {
            matchStage.industrialId = industrialId;
        }
        const [completed, archived, pending] = await Promise.all([
            Order_1.default.countDocuments({ ...matchStage, status: 'completed' }),
            Order_1.default.countDocuments({ ...matchStage, status: 'archived' }),
            Order_1.default.countDocuments({ ...matchStage, status: 'delivered' })
        ]);
        // Calculer le temps moyen de clôture
        const completedOrders = await Order_1.default.find({
            ...matchStage,
            status: { $in: ['completed', 'archived'] },
            'dates.actualDeliveryDate': { $exists: true },
            closedAt: { $exists: true }
        }).select('dates.actualDeliveryDate closedAt').limit(100);
        let totalTime = 0;
        let count = 0;
        for (const order of completedOrders) {
            if (order.dates?.actualDeliveryDate && order.closedAt) {
                const delivery = new Date(order.dates.actualDeliveryDate).getTime();
                const closed = new Date(order.closedAt).getTime();
                totalTime += closed - delivery;
                count++;
            }
        }
        return {
            totalCompleted: completed,
            totalArchived: archived,
            pendingClosure: pending,
            averageClosureTime: count > 0 ? Math.round(totalTime / count / (1000 * 60 * 60)) : 0 // en heures
        };
    }
}
exports.default = ClosureService;
//# sourceMappingURL=closure-service.js.map
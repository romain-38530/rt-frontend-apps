"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service de confirmation de livraison - SYMPHONI.A
 * Gère la confirmation avec signature électronique du destinataire
 */
const nodemailer_1 = __importDefault(require("nodemailer"));
const Order_1 = __importDefault(require("../models/Order"));
const document_service_1 = __importDefault(require("./document-service"));
const event_service_1 = __importDefault(require("./event-service"));
const scoring_service_1 = __importDefault(require("./scoring-service"));
const uuid_1 = require("uuid");
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
class DeliveryService {
    /**
     * Confirme la livraison avec signature électronique
     */
    static async confirmDelivery(params) {
        try {
            const order = await Order_1.default.findOne({ orderId: params.orderId });
            if (!order) {
                return { success: false, error: 'Commande non trouvée' };
            }
            // Vérifier le statut
            if (!['in_transit', 'arrived_delivery', 'carrier_accepted'].includes(order.status)) {
                return { success: false, error: `Statut invalide pour confirmation: ${order.status}` };
            }
            // Mettre à jour la commande
            order.status = 'delivered';
            order.dates = order.dates || {};
            order.dates.actualDeliveryDate = params.receivedAt || new Date();
            // Stocker les informations de confirmation
            order.deliveryConfirmation = {
                confirmedBy: params.confirmedBy,
                receivedBy: params.receivedBy || params.confirmedBy.name,
                receivedAt: params.receivedAt || new Date(),
                signature: {
                    data: params.signature.data,
                    timestamp: params.signature.timestamp,
                    ipAddress: params.signature.ipAddress,
                    deviceInfo: params.signature.deviceInfo
                },
                condition: params.condition || 'good',
                damageNotes: params.damageNotes,
                notes: params.notes,
                location: params.location
            };
            await order.save();
            // Créer un événement
            await event_service_1.default.createEvent({
                orderId: params.orderId,
                orderReference: order.reference,
                eventType: 'delivered',
                source: 'recipient',
                data: {
                    confirmedBy: params.confirmedBy.name,
                    receivedBy: params.receivedBy || params.confirmedBy.name,
                    condition: params.condition || 'good',
                    hasSignature: true
                }
            });
            // Créer automatiquement un POD
            await document_service_1.default.uploadDocument({
                orderId: params.orderId,
                type: 'pod',
                fileName: `POD_${order.reference}_${Date.now()}.json`,
                originalName: `Preuve de livraison - ${order.reference}`,
                mimeType: 'application/json',
                fileSize: params.signature.data.length,
                uploadedBy: {
                    id: params.confirmedBy.id,
                    name: params.confirmedBy.name,
                    role: params.confirmedBy.role
                }
            });
            // Notifier toutes les parties
            await this.notifyDeliveryConfirmed(order, params);
            // Déclencher le scoring automatique si conditions remplies
            await this.triggerPostDeliveryActions(order);
            return {
                success: true,
                order: {
                    orderId: order.orderId,
                    reference: order.reference,
                    status: order.status,
                    deliveredAt: order.dates.actualDeliveryDate
                }
            };
        }
        catch (error) {
            console.error('[DeliveryService] Confirm error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Signale un problème de livraison
     */
    static async reportDeliveryIssue(params) {
        try {
            const order = await Order_1.default.findOne({ orderId: params.orderId });
            if (!order) {
                return { success: false, error: 'Commande non trouvée' };
            }
            const issueId = `issue_${(0, uuid_1.v4)()}`;
            // Ajouter le problème à la commande
            if (!order.deliveryIssues) {
                order.deliveryIssues = [];
            }
            order.deliveryIssues.push({
                issueId,
                reportedBy: params.reportedBy,
                reportedAt: new Date(),
                issueType: params.issueType,
                description: params.description,
                severity: params.severity,
                photos: params.photos,
                status: 'open'
            });
            // Si problème critique, changer le statut
            if (params.severity === 'critical') {
                order.status = 'incident';
            }
            await order.save();
            // Créer un événement
            await event_service_1.default.createEvent({
                orderId: params.orderId,
                orderReference: order.reference,
                eventType: 'incident_reported',
                source: params.reportedBy.role,
                data: {
                    issueId,
                    issueType: params.issueType,
                    severity: params.severity,
                    description: params.description
                }
            });
            // Notifier les parties concernées
            await this.notifyDeliveryIssue(order, params, issueId);
            return { success: true, issueId };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Déclenche les actions post-livraison (scoring, archivage)
     */
    static async triggerPostDeliveryActions(order) {
        try {
            // Vérifier les documents
            const docCheck = await document_service_1.default.checkRequiredDocuments(order.orderId);
            if (docCheck.complete && order.carrierId) {
                // Calculer le score
                await scoring_service_1.default.calculateScore(order.orderId, order.carrierId);
                // Créer un événement
                await event_service_1.default.createEvent({
                    orderId: order.orderId,
                    orderReference: order.reference,
                    eventType: 'score_calculated',
                    source: 'system',
                    data: {
                        carrierId: order.carrierId,
                        automatic: true
                    }
                });
                // Mettre le statut à "completed" si tout est OK
                order.status = 'completed';
                await order.save();
                // Planifier l'archivage (après 30 jours)
                // Note: En production, utiliser un job scheduler (Bull, Agenda, etc.)
                console.log(`[DeliveryService] Order ${order.orderId} ready for archiving in 30 days`);
            }
        }
        catch (error) {
            console.error('[DeliveryService] Post-delivery actions error:', error);
        }
    }
    /**
     * Notifie la confirmation de livraison
     */
    static async notifyDeliveryConfirmed(order, params) {
        const condition = params.condition === 'good' ? '✅ Parfait état' :
            params.condition === 'damaged' ? '⚠️ Endommagé' : '📦 Livraison partielle';
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
          .info-box { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Livraison Confirmée</h1>
            <p>SYMPHONI.A</p>
          </div>
          <div class="content">
            <p>La commande <strong>${order.reference}</strong> a été livrée avec succès.</p>

            <div class="info-box">
              <p><strong>Réceptionné par :</strong> ${params.receivedBy || params.confirmedBy.name}</p>
              <p><strong>Date/Heure :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              <p><strong>État :</strong> ${condition}</p>
              ${params.notes ? `<p><strong>Notes :</strong> ${params.notes}</p>` : ''}
            </div>

            <p>📝 La preuve de livraison (POD) a été générée avec signature électronique.</p>

            <p style="text-align: center; margin-top: 20px;">
              <a href="https://app.symphonia-controltower.com/orders/${order.orderId}" class="button">
                Voir les détails
              </a>
            </p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
        const recipients = [];
        // Industriel
        if (order.createdBy?.email) {
            recipients.push(order.createdBy.email);
        }
        // Transporteur
        if (order.carrierEmail) {
            recipients.push(order.carrierEmail);
        }
        // Expéditeur
        if (order.pickupAddress?.contactEmail) {
            recipients.push(order.pickupAddress.contactEmail);
        }
        for (const email of recipients) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <delivery@symphonia-controltower.com>',
                    to: email,
                    subject: `[SYMPHONI.A] ✅ Livraison confirmée - ${order.reference}`,
                    html
                });
            }
            catch (error) {
                console.error(`[DeliveryService] Email error to ${email}:`, error);
            }
        }
    }
    /**
     * Notifie un problème de livraison
     */
    static async notifyDeliveryIssue(order, params, issueId) {
        const severityColors = {
            minor: '#f59e0b',
            major: '#ef4444',
            critical: '#dc2626'
        };
        const severityLabels = {
            minor: 'Mineur',
            major: 'Majeur',
            critical: 'Critique'
        };
        const issueLabels = {
            damage: 'Marchandise endommagée',
            shortage: 'Manquant',
            wrong_product: 'Mauvais produit',
            delay: 'Retard important',
            other: 'Autre problème'
        };
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColors[params.severity]}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .issue-box { background: #fee2e2; border-left: 4px solid ${severityColors[params.severity]}; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Incident Livraison</h1>
            <p>Sévérité: ${severityLabels[params.severity]}</p>
          </div>
          <div class="content">
            <p>Un incident a été signalé pour la commande <strong>${order.reference}</strong>.</p>

            <div class="issue-box">
              <p><strong>Type :</strong> ${issueLabels[params.issueType]}</p>
              <p><strong>Signalé par :</strong> ${params.reportedBy.name}</p>
              <p><strong>Description :</strong></p>
              <p>${params.description}</p>
            </div>

            <p>Référence incident : <code>${issueId}</code></p>

            <p style="text-align: center; margin-top: 20px;">
              <a href="https://app.symphonia-controltower.com/orders/${order.orderId}/incidents" class="button">
                Gérer l'incident
              </a>
            </p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
        // Notifier industriel + transporteur
        const recipients = [];
        if (order.createdBy?.email)
            recipients.push(order.createdBy.email);
        if (order.carrierEmail)
            recipients.push(order.carrierEmail);
        for (const email of recipients) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <incidents@symphonia-controltower.com>',
                    to: email,
                    subject: `[SYMPHONI.A] ⚠️ Incident livraison - ${order.reference}`,
                    html
                });
            }
            catch (error) {
                console.error(`[DeliveryService] Email error to ${email}:`, error);
            }
        }
    }
    /**
     * Récupère les statistiques de livraison
     */
    static async getDeliveryStats(industrialId) {
        const matchStage = { status: { $in: ['delivered', 'completed', 'archived'] } };
        if (industrialId) {
            matchStage.industrialId = industrialId;
        }
        const orders = await Order_1.default.find(matchStage);
        let onTime = 0;
        let delayed = 0;
        let withIssues = 0;
        let totalDeliveryTime = 0;
        let deliveryCount = 0;
        for (const order of orders) {
            const planned = order.dates?.deliveryDate;
            const actual = order.dates?.actualDeliveryDate;
            if (planned && actual) {
                const plannedDate = new Date(planned);
                const actualDate = new Date(actual);
                if (actualDate <= plannedDate) {
                    onTime++;
                }
                else {
                    delayed++;
                }
                // Temps de livraison (depuis pickup)
                if (order.dates?.actualPickupDate) {
                    const pickupDate = new Date(order.dates.actualPickupDate);
                    totalDeliveryTime += actualDate.getTime() - pickupDate.getTime();
                    deliveryCount++;
                }
            }
            if (order.deliveryIssues?.length > 0) {
                withIssues++;
            }
        }
        return {
            totalDelivered: orders.length,
            onTime,
            delayed,
            withIssues,
            averageDeliveryTime: deliveryCount > 0
                ? Math.round(totalDeliveryTime / deliveryCount / (1000 * 60 * 60)) // en heures
                : 0
        };
    }
}
exports.default = DeliveryService;
//# sourceMappingURL=delivery-service.js.map
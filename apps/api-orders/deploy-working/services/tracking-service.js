"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * TrackingService - Service de suivi en temps réel SYMPHONI.A
 * Gère les mises à jour GPS, statuts, ETA et notifications multi-portails
 */
const Order_1 = __importDefault(require("../models/Order"));
const event_service_1 = __importDefault(require("./event-service"));
const PortalInvitation_1 = __importDefault(require("../models/PortalInvitation"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configuration email
const smtpConfig = {
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
};
const transporter = smtpConfig.auth.user ? nodemailer_1.default.createTransport(smtpConfig) : null;
// Transitions de statut autorisées pour le tracking
const TRACKING_TRANSITIONS = {
    'draft': [],
    'created': [],
    'sent_to_carrier': [],
    'carrier_accepted': ['in_transit'],
    'carrier_refused': [],
    'in_transit': ['arrived_pickup'],
    'arrived_pickup': ['loaded'],
    'loaded': ['arrived_delivery'],
    'arrived_delivery': ['delivered'],
    'delivered': ['closed'],
    'closed': [],
    'cancelled': [],
    'escalated': []
};
// Labels des statuts pour les notifications
const STATUS_LABELS = {
    'in_transit': { fr: 'En route vers le chargement', emoji: '🚚', color: '#3182ce' },
    'arrived_pickup': { fr: 'Arrivé au chargement', emoji: '📍', color: '#805ad5' },
    'loaded': { fr: 'Chargement effectué', emoji: '📦', color: '#38a169' },
    'arrived_delivery': { fr: 'Arrivé à destination', emoji: '🎯', color: '#dd6b20' },
    'delivered': { fr: 'Livré', emoji: '✅', color: '#38a169' },
    'closed': { fr: 'Clôturé', emoji: '🏁', color: '#718096' }
};
class TrackingService {
    /**
     * Met à jour la position GPS du transport
     */
    static async updatePosition(orderId, carrierId, position) {
        const order = await Order_1.default.findOne({ orderId, carrierId });
        if (!order) {
            return { success: false, error: 'Commande non trouvée ou non autorisée' };
        }
        // Vérifier que le transport est en cours
        const trackingStatuses = ['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'];
        if (!trackingStatuses.includes(order.status)) {
            return { success: false, error: `Tracking non actif pour le statut ${order.status}` };
        }
        // Mettre à jour la position
        order.currentLocation = {
            latitude: position.latitude,
            longitude: position.longitude,
            timestamp: new Date()
        };
        await order.save();
        // Log l'événement (sans notification pour les positions fréquentes)
        await event_service_1.default.createEvent({
            orderId,
            orderReference: order.reference,
            eventType: 'tracking.started', // Utiliser un type existant
            source: 'tracking',
            actorId: carrierId,
            actorType: 'carrier',
            description: `Position mise à jour: ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`,
            data: { position, speed: position.speed, heading: position.heading }
        });
        return { success: true, order };
    }
    /**
     * Met à jour le statut avec un jalon (milestone)
     */
    static async updateMilestone(orderId, carrierId, milestone) {
        const order = await Order_1.default.findOne({ orderId, carrierId });
        if (!order) {
            return { success: false, error: 'Commande non trouvée ou non autorisée' };
        }
        // Vérifier la transition de statut
        const allowedTransitions = TRACKING_TRANSITIONS[order.status] || [];
        if (!allowedTransitions.includes(milestone.status)) {
            return {
                success: false,
                error: `Transition non autorisée: ${order.status} → ${milestone.status}. Transitions possibles: ${allowedTransitions.join(', ') || 'aucune'}`
            };
        }
        const previousStatus = order.status;
        order.status = milestone.status;
        // Mettre à jour la position si fournie
        if (milestone.location) {
            order.currentLocation = {
                latitude: milestone.location.latitude,
                longitude: milestone.location.longitude,
                timestamp: new Date()
            };
        }
        // Ajouter les notes transporteur si fournies
        if (milestone.notes) {
            order.carrierNotes = milestone.notes;
        }
        await order.save();
        // Créer l'événement
        const statusInfo = STATUS_LABELS[milestone.status] || { fr: milestone.status, emoji: '📌', color: '#718096' };
        await event_service_1.default.createEvent({
            orderId,
            orderReference: order.reference,
            eventType: this.getEventTypeForStatus(milestone.status),
            source: 'carrier',
            actorId: carrierId,
            actorType: 'carrier',
            actorName: order.carrierName,
            previousStatus,
            newStatus: milestone.status,
            description: `${statusInfo.emoji} ${statusInfo.fr}`,
            data: {
                milestone: milestone.status,
                location: milestone.location,
                notes: milestone.notes,
                timestamp: milestone.timestamp || new Date()
            }
        });
        // Notifier tous les stakeholders
        await this.notifyAllStakeholders(order, previousStatus, milestone.status);
        return { success: true, order };
    }
    /**
     * Met à jour l'ETA
     */
    static async updateETA(orderId, carrierId, etaUpdate) {
        const order = await Order_1.default.findOne({ orderId, carrierId });
        if (!order) {
            return { success: false, error: 'Commande non trouvée ou non autorisée' };
        }
        const previousEta = order.eta;
        order.eta = etaUpdate.eta;
        await order.save();
        await event_service_1.default.createEvent({
            orderId,
            orderReference: order.reference,
            eventType: 'tracking.started',
            source: 'carrier',
            actorId: carrierId,
            actorType: 'carrier',
            description: `ETA mis à jour: ${etaUpdate.eta.toLocaleString('fr-FR')}${etaUpdate.reason ? ` - ${etaUpdate.reason}` : ''}`,
            data: { previousEta, newEta: etaUpdate.eta, reason: etaUpdate.reason }
        });
        // Notifier si changement significatif (> 30 min)
        if (previousEta) {
            const diffMinutes = Math.abs(etaUpdate.eta.getTime() - previousEta.getTime()) / (1000 * 60);
            if (diffMinutes > 30) {
                await this.notifyETAChange(order, previousEta, etaUpdate.eta, etaUpdate.reason);
            }
        }
        return { success: true, order };
    }
    /**
     * Récupère le statut de tracking complet
     */
    static async getTrackingStatus(orderId, accessToken) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order) {
            return { success: false, error: 'Commande non trouvée' };
        }
        // Si un token est fourni, vérifier l'accès
        if (accessToken) {
            const invitation = await PortalInvitation_1.default.findOne({
                orderId,
                token: accessToken,
                status: { $in: ['sent', 'accepted'] }
            });
            if (!invitation) {
                return { success: false, error: 'Accès non autorisé' };
            }
        }
        const statusInfo = STATUS_LABELS[order.status] || { fr: order.status, emoji: '📌', color: '#718096' };
        return {
            success: true,
            tracking: {
                orderId: order.orderId,
                reference: order.reference,
                status: order.status,
                statusLabel: statusInfo.fr,
                statusEmoji: statusInfo.emoji,
                statusColor: statusInfo.color,
                carrier: {
                    name: order.carrierName,
                    vehicleInfo: order.vehicleInfo
                },
                currentLocation: order.currentLocation,
                eta: order.eta,
                appointments: order.appointments,
                pickup: {
                    city: order.pickupAddress?.city,
                    address: order.pickupAddress?.street,
                    requestedDate: order.dates?.pickupDate,
                    appointment: order.appointments?.pickupAppointment
                },
                delivery: {
                    city: order.deliveryAddress?.city,
                    address: order.deliveryAddress?.street,
                    requestedDate: order.dates?.deliveryDate,
                    appointment: order.appointments?.deliveryAppointment
                },
                goods: {
                    description: order.goods?.description,
                    weight: order.goods?.weight,
                    palettes: order.goods?.palettes
                },
                lastUpdate: order.currentLocation?.timestamp || order.updatedAt
            }
        };
    }
    /**
     * Récupère l'historique complet du tracking
     */
    static async getTrackingHistory(orderId) {
        const events = await event_service_1.default.getOrderEvents(orderId);
        // Filtrer les événements de tracking
        const trackingEvents = events.filter(e => e.source === 'tracking' ||
            e.source === 'carrier' ||
            ['order.arrived.pickup', 'order.loaded', 'order.arrived.delivery', 'order.delivered'].includes(e.eventType));
        return {
            success: true,
            history: trackingEvents.map(e => ({
                eventId: e.eventId,
                timestamp: e.timestamp,
                type: e.eventType,
                description: e.description,
                status: e.newStatus,
                location: e.data?.position || e.data?.location,
                actor: e.actorName
            }))
        };
    }
    /**
     * Notifie tous les stakeholders d'un changement de statut
     */
    static async notifyAllStakeholders(order, previousStatus, newStatus) {
        const statusInfo = STATUS_LABELS[newStatus] || { fr: newStatus, emoji: '📌', color: '#718096' };
        // Récupérer toutes les invitations acceptées pour cette commande
        const invitations = await PortalInvitation_1.default.find({
            orderId: order.orderId,
            status: { $in: ['sent', 'accepted'] }
        });
        // Grouper par rôle pour des notifications personnalisées
        const stakeholders = {
            supplier: invitations.filter(i => i.role === 'supplier'),
            recipient: invitations.filter(i => i.role === 'recipient'),
            logistician: invitations.filter(i => i.role === 'logistician')
        };
        // Notifier chaque groupe
        for (const [role, contacts] of Object.entries(stakeholders)) {
            for (const contact of contacts) {
                await this.sendStatusNotification(contact.email, contact.contactName, order, statusInfo, role);
            }
        }
        // Notifier aussi l'industriel via son email (si disponible)
        // Note: nécessiterait un lookup vers le service utilisateur
        console.log(`[TrackingService] Notified ${invitations.length} stakeholders for ${order.reference}: ${newStatus}`);
    }
    /**
     * Envoie une notification de statut
     */
    static async sendStatusNotification(email, contactName, order, statusInfo, role) {
        const roleMessages = {
            'supplier': 'Mise à jour de votre expédition',
            'recipient': 'Mise à jour de votre livraison',
            'logistician': 'Mise à jour transport'
        };
        const portalUrls = {
            'supplier': process.env.SUPPLIER_PORTAL_URL || 'https://supplier.symphonia-controltower.com',
            'recipient': process.env.RECIPIENT_PORTAL_URL || 'https://recipient.symphonia-controltower.com',
            'logistician': process.env.LOGISTICIAN_PORTAL_URL || 'https://logistician.symphonia-controltower.com'
        };
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { background: ${statusInfo.color}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 15px 0; }
          .route { background: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${statusInfo.emoji} ${roleMessages[role]}</h2>
          </div>
          <div class="content">
            <p>Bonjour ${contactName},</p>

            <p>Votre commande <strong>${order.reference}</strong> a un nouveau statut :</p>

            <div style="text-align: center;">
              <span class="status-badge">${statusInfo.emoji} ${statusInfo.fr}</span>
            </div>

            <div class="route">
              <p><strong>📍 Enlèvement:</strong> ${order.pickupAddress?.city}</p>
              <p><strong>🎯 Livraison:</strong> ${order.deliveryAddress?.city}</p>
              ${order.eta ? `<p><strong>⏰ ETA:</strong> ${new Date(order.eta).toLocaleString('fr-FR')}</p>` : ''}
              ${order.carrierName ? `<p><strong>🚚 Transporteur:</strong> ${order.carrierName}</p>` : ''}
            </div>

            <p style="text-align: center;">
              <a href="${portalUrls[role]}/tracking/${order.orderId}" class="button">Suivre en temps réel</a>
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
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <tracking@symphonia-controltower.com>',
                    to: email,
                    subject: `[SYMPHONI.A] ${statusInfo.emoji} ${statusInfo.fr} - ${order.reference}`,
                    html
                });
                console.log(`[TrackingService] Status notification sent to ${email}`);
            }
            catch (error) {
                console.error(`[TrackingService] Failed to send notification to ${email}:`, error.message);
            }
        }
        else {
            console.log(`[TrackingService] [MOCK] Status notification to ${email}: ${statusInfo.fr}`);
        }
    }
    /**
     * Notifie un changement d'ETA significatif
     */
    static async notifyETAChange(order, previousEta, newEta, reason) {
        const diffMinutes = Math.round((newEta.getTime() - previousEta.getTime()) / (1000 * 60));
        const direction = diffMinutes > 0 ? 'retardée' : 'avancée';
        const absDiff = Math.abs(diffMinutes);
        const invitations = await PortalInvitation_1.default.find({
            orderId: order.orderId,
            status: { $in: ['sent', 'accepted'] }
        });
        for (const invitation of invitations) {
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dd6b20; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { background: #fffaf0; padding: 30px; border-radius: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⏰ Mise à jour ETA</h2>
            </div>
            <div class="content">
              <p>Bonjour ${invitation.contactName},</p>
              <p>L'heure d'arrivée estimée pour votre commande <strong>${order.reference}</strong> a été ${direction} de ${absDiff} minutes.</p>
              <p><strong>Nouvelle ETA:</strong> ${newEta.toLocaleString('fr-FR')}</p>
              ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            </div>
          </div>
        </body>
        </html>
      `;
            if (transporter) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_FROM || 'SYMPHONI.A <tracking@symphonia-controltower.com>',
                        to: invitation.email,
                        subject: `[SYMPHONI.A] ⏰ ETA ${direction} - ${order.reference}`,
                        html
                    });
                }
                catch (error) {
                    console.error(`[TrackingService] Failed to send ETA notification:`, error.message);
                }
            }
        }
    }
    /**
     * Convertit un statut en type d'événement
     */
    static getEventTypeForStatus(status) {
        const mapping = {
            'in_transit': 'tracking.started',
            'arrived_pickup': 'order.arrived.pickup',
            'loaded': 'order.loaded',
            'arrived_delivery': 'order.arrived.delivery',
            'delivered': 'order.delivered',
            'closed': 'order.closed'
        };
        return mapping[status] || 'order.delivered';
    }
    /**
     * Calcule l'ETA basé sur la position actuelle (simplifié)
     */
    static async calculateETA(orderId, currentPosition) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order || !order.deliveryAddress?.latitude || !order.deliveryAddress?.longitude) {
            return null;
        }
        // Calcul simplifié: distance en ligne droite / vitesse moyenne (60 km/h)
        const destLat = order.deliveryAddress.latitude;
        const destLng = order.deliveryAddress.longitude;
        const distance = this.calculateDistance(currentPosition.latitude, currentPosition.longitude, destLat, destLng);
        const averageSpeedKmh = currentPosition.speed ? currentPosition.speed * 3.6 : 60;
        const hoursRemaining = distance / averageSpeedKmh;
        const eta = new Date();
        eta.setTime(eta.getTime() + hoursRemaining * 60 * 60 * 1000);
        return eta;
    }
    /**
     * Calcule la distance entre deux points (Haversine)
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    static toRad(deg) {
        return deg * (Math.PI / 180);
    }
    /**
     * POINTAGE - Envoie une demande de mise à jour position au transporteur
     * Appelable par n'importe quel stakeholder (industriel, expéditeur, destinataire)
     */
    static async requestPositionPing(orderId, requestedBy) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order) {
            return { success: false, error: 'Commande non trouvée' };
        }
        if (!order.carrierId) {
            return { success: false, error: 'Aucun transporteur assigné' };
        }
        // Vérifier que le transport est en cours
        const trackingStatuses = ['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'];
        if (!trackingStatuses.includes(order.status)) {
            return { success: false, error: `Pointage non disponible pour le statut: ${order.status}` };
        }
        // Récupérer l'email du transporteur via DispatchChain
        const DispatchChain = (await Promise.resolve().then(() => __importStar(require('../models/DispatchChain')))).default;
        const chain = await DispatchChain.findOne({ orderId, status: 'completed' });
        let carrierEmail = '';
        let carrierName = order.carrierName || 'Transporteur';
        if (chain) {
            const acceptedAttempt = chain.attempts.find(a => a.status === 'accepted');
            if (acceptedAttempt) {
                // Email via notificationsSent ou API externe
                carrierName = acceptedAttempt.carrierName;
            }
        }
        // URL de mise à jour rapide
        const carrierPortalUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphonia-controltower.com';
        const updateUrl = `${carrierPortalUrl}/orders/${order.orderId}/update-position?ping=true`;
        // Envoyer notification au transporteur
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fffaf0; padding: 30px; border-radius: 0 0 8px 8px; }
          .ping-icon { font-size: 48px; margin-bottom: 10px; }
          .button { display: inline-block; background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 15px 0; }
          .info-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ed8936; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="ping-icon">📍</div>
            <h2>Demande de pointage</h2>
          </div>
          <div class="content">
            <p>Bonjour ${carrierName},</p>

            <p><strong>${requestedBy.name}</strong> (${this.getRoleLabel(requestedBy.role)}) demande une mise à jour de position pour le transport en cours.</p>

            <div class="info-box">
              <p><strong>Commande:</strong> ${order.reference}</p>
              <p><strong>Trajet:</strong> ${order.pickupAddress?.city} → ${order.deliveryAddress?.city}</p>
              <p><strong>Statut actuel:</strong> ${STATUS_LABELS[order.status]?.fr || order.status}</p>
            </div>

            <p>Merci de mettre à jour votre position pour permettre un suivi en temps réel.</p>

            <p style="text-align: center;">
              <a href="${updateUrl}" class="button">📍 Mettre à jour ma position</a>
            </p>

            <p><small>Cette demande a été envoyée le ${new Date().toLocaleString('fr-FR')}.</small></p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
        // Envoyer l'email
        if (carrierEmail && transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <tracking@symphonia-controltower.com>',
                    to: carrierEmail,
                    subject: `[SYMPHONI.A] 📍 Demande de pointage - ${order.reference}`,
                    html
                });
                console.log(`[TrackingService] Ping request sent to carrier ${carrierEmail}`);
            }
            catch (error) {
                console.error(`[TrackingService] Failed to send ping request:`, error.message);
            }
        }
        else {
            console.log(`[TrackingService] [MOCK] Ping request to carrier for ${order.reference}`);
        }
        // Logger l'événement
        await event_service_1.default.createEvent({
            orderId,
            orderReference: order.reference,
            eventType: 'tracking.started',
            source: 'user',
            actorId: requestedBy.id,
            actorType: requestedBy.role,
            actorName: requestedBy.name,
            description: `Demande de pointage par ${requestedBy.name} (${this.getRoleLabel(requestedBy.role)})`,
            data: { requestedBy, timestamp: new Date() }
        });
        // Notifier tous les stakeholders qu'un pointage a été demandé
        await this.notifyPingRequested(order, requestedBy);
        return {
            success: true,
            message: `Demande de pointage envoyée au transporteur ${carrierName}`
        };
    }
    /**
     * Notifie tous les stakeholders qu'un pointage a été demandé
     */
    static async notifyPingRequested(order, requestedBy) {
        const invitations = await PortalInvitation_1.default.find({
            orderId: order.orderId,
            status: { $in: ['sent', 'accepted'] }
        });
        // Exclure celui qui a fait la demande
        const othersToNotify = invitations.filter(i => i.email !== requestedBy.id);
        for (const invitation of othersToNotify) {
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4299e1; color: white; padding: 15px; text-align: center; border-radius: 8px; }
            .content { background: #ebf8ff; padding: 20px; border-radius: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h3>📍 Pointage demandé</h3>
            </div>
            <div class="content">
              <p>Bonjour ${invitation.contactName},</p>
              <p><strong>${requestedBy.name}</strong> a demandé une mise à jour de position au transporteur pour la commande <strong>${order.reference}</strong>.</p>
              <p>Vous recevrez une notification dès que le transporteur aura mis à jour sa position.</p>
            </div>
          </div>
        </body>
        </html>
      `;
            if (transporter) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_FROM || 'SYMPHONI.A <tracking@symphonia-controltower.com>',
                        to: invitation.email,
                        subject: `[SYMPHONI.A] 📍 Pointage demandé - ${order.reference}`,
                        html
                    });
                }
                catch (error) {
                    // Silently fail for notifications
                }
            }
        }
    }
    /**
     * Retourne le label du rôle en français
     */
    static getRoleLabel(role) {
        const labels = {
            'industrial': 'Donneur d\'ordre',
            'supplier': 'Expéditeur',
            'recipient': 'Destinataire',
            'logistician': 'Logisticien',
            'carrier': 'Transporteur'
        };
        return labels[role] || role;
    }
}
exports.default = TrackingService;
//# sourceMappingURL=tracking-service.js.map
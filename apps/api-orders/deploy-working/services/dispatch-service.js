"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * DispatchService - Service de gestion du dispatch automatique SYMPHONI.A
 * Gère le Lane Matching, la chaîne d'affectation et l'escalade vers Affret.IA
 */
const uuid_1 = require("uuid");
const Lane_1 = __importDefault(require("../models/Lane"));
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
const CarrierScore_1 = require("../models/CarrierScore");
const Order_1 = __importDefault(require("../models/Order"));
const event_service_1 = __importDefault(require("./event-service"));
const portal_invitation_service_1 = __importDefault(require("./portal-invitation-service"));
const notification_service_1 = __importDefault(require("./notification-service"));
const affretia_service_1 = __importDefault(require("./affretia-service"));
// Configuration: Poids pour le tri des transporteurs
const LANE_POSITION_WEIGHT = 0.6; // 60% position dans la lane
const SCORING_WEIGHT = 0.4; // 40% score global
class DispatchService {
    /**
     * Détecte la ligne de transport correspondant à une commande
     * Lane Matching basé sur origine/destination et type de marchandise
     */
    static async detectLane(orderId) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order)
            throw new Error('Commande non trouvée');
        // Recherche des lanes correspondantes
        const matchedLanes = await this.findMatchingLanes(order);
        if (matchedLanes.length === 0) {
            // Aucune lane trouvée - escalade directe vers Affret.IA
            await event_service_1.default.escalatedToAffretia(orderId, order.reference, 'Aucune ligne de transport configurée pour ce trajet');
            return null;
        }
        // Prendre la meilleure lane (score le plus élevé)
        const bestMatch = matchedLanes[0];
        // Enregistrer l'événement
        await event_service_1.default.laneDetected(orderId, order.reference, bestMatch.lane.laneId, bestMatch.lane.name);
        return bestMatch.lane;
    }
    /**
     * Trouve les lanes correspondantes pour une commande
     */
    static async findMatchingLanes(order) {
        const lanes = await Lane_1.default.find({ isActive: true });
        const matches = [];
        for (const lane of lanes) {
            const matchResult = this.evaluateLaneMatch(lane, order);
            if (matchResult.isMatch) {
                matches.push({
                    lane,
                    matchScore: matchResult.score,
                    matchedCriteria: matchResult.criteria
                });
            }
        }
        // Trier par score décroissant
        return matches.sort((a, b) => b.matchScore - a.matchScore);
    }
    /**
     * Évalue si une lane correspond à une commande
     */
    static evaluateLaneMatch(lane, order) {
        let score = 0;
        const criteria = [];
        // Vérifier l'origine
        const originMatch = this.checkLocationMatch(lane.origin, order.pickupAddress);
        if (originMatch.matches) {
            score += originMatch.score;
            criteria.push(`Origine: ${originMatch.matchType}`);
        }
        else if (lane.origin.city || lane.origin.postalCodePrefix) {
            // Critère d'origine défini mais non satisfait
            return { isMatch: false, score: 0, criteria: [] };
        }
        // Vérifier la destination
        const destMatch = this.checkLocationMatch(lane.destination, order.deliveryAddress);
        if (destMatch.matches) {
            score += destMatch.score;
            criteria.push(`Destination: ${destMatch.matchType}`);
        }
        else if (lane.destination.city || lane.destination.postalCodePrefix) {
            return { isMatch: false, score: 0, criteria: [] };
        }
        // Vérifier le type de marchandise
        if (lane.merchandiseTypes && lane.merchandiseTypes.length > 0) {
            const goodsType = order.goods?.type || order.goods?.nature;
            if (goodsType && lane.merchandiseTypes.includes(goodsType)) {
                score += 20;
                criteria.push(`Type marchandise: ${goodsType}`);
            }
        }
        // Vérifier les contraintes
        if (order.constraints && order.constraints.length > 0 && lane.requiredConstraints) {
            const orderConstraints = order.constraints.map((c) => c.type);
            const matchedConstraints = orderConstraints.filter((c) => lane.requiredConstraints.includes(c));
            if (matchedConstraints.length > 0) {
                score += matchedConstraints.length * 5;
                criteria.push(`Contraintes: ${matchedConstraints.join(', ')}`);
            }
        }
        return {
            isMatch: score > 0,
            score,
            criteria
        };
    }
    /**
     * Vérifie la correspondance d'un critère de localisation
     */
    static checkLocationMatch(laneLoc, address) {
        if (!address)
            return { matches: false, score: 0, matchType: '' };
        // Code postal prefix (plus précis = plus de points)
        if (laneLoc.postalCodePrefix && address.postalCode) {
            if (address.postalCode.startsWith(laneLoc.postalCodePrefix)) {
                return { matches: true, score: 50, matchType: 'Code postal' };
            }
        }
        // Ville
        if (laneLoc.city && address.city) {
            const normalizedCity = address.city.toLowerCase().trim();
            if (laneLoc.city.toLowerCase().trim() === normalizedCity) {
                return { matches: true, score: 40, matchType: 'Ville' };
            }
        }
        // Région
        if (laneLoc.region && address.region) {
            if (laneLoc.region === address.region) {
                return { matches: true, score: 20, matchType: 'Région' };
            }
        }
        // Pays
        if (laneLoc.country) {
            const country = address.country || 'France';
            if (laneLoc.country === country) {
                return { matches: true, score: 10, matchType: 'Pays' };
            }
        }
        return { matches: false, score: 0, matchType: '' };
    }
    /**
     * Génère la chaîne d'affectation à partir d'une lane
     * Tri des transporteurs: 60% position lane + 40% score global
     */
    static async generateDispatchChain(orderId, lane) {
        const order = await Order_1.default.findOne({ orderId });
        if (!order)
            throw new Error('Commande non trouvée');
        const chainId = `chain_${(0, uuid_1.v4)()}`;
        // Récupérer les transporteurs actifs
        const activeCarriers = lane.carriers.filter((c) => c.isActive);
        // Récupérer les scores globaux pour tous les transporteurs
        const carrierIds = activeCarriers.map(c => c.carrierId);
        const globalScores = await CarrierScore_1.CarrierGlobalScore.find({ carrierId: { $in: carrierIds } });
        const scoreMap = new Map(globalScores.map(s => [s.carrierId, s.globalScore]));
        // Calculer le score combiné pour chaque transporteur
        // Score combiné = (60% position inversée) + (40% score global)
        const maxPosition = Math.max(...activeCarriers.map(c => c.position));
        const carriersWithCombinedScore = activeCarriers
            .map((carrier) => {
            const globalScore = scoreMap.get(carrier.carrierId) || 70; // Score par défaut: 70
            const minScore = carrier.minScore || 70;
            // Position inversée normalisée (position 1 = score max)
            const positionScore = 100 - ((carrier.position - 1) / Math.max(maxPosition - 1, 1)) * 100;
            // Score combiné pondéré
            const combinedScore = (positionScore * LANE_POSITION_WEIGHT) + (globalScore * SCORING_WEIGHT);
            return {
                carrier,
                globalScore,
                combinedScore,
                isEligible: globalScore >= minScore
            };
        })
            // Filtrer les transporteurs sous le score minimum
            .filter(c => c.isEligible)
            // Trier par score combiné décroissant
            .sort((a, b) => b.combinedScore - a.combinedScore);
        console.log(`[Dispatch] Tri transporteurs pour ${lane.name}:`);
        carriersWithCombinedScore.forEach((c, idx) => {
            console.log(`  ${idx + 1}. ${c.carrier.carrierName}: position=${c.carrier.position}, score=${c.globalScore}, combiné=${c.combinedScore.toFixed(1)}`);
        });
        // Créer les tentatives avec le nouvel ordre
        const attempts = carriersWithCombinedScore
            .map((item, index) => ({
            carrierId: item.carrier.carrierId,
            carrierName: item.carrier.carrierName,
            position: index + 1, // Nouvelle position basée sur le score combiné
            status: 'pending',
            responseDelayMinutes: item.carrier.responseDelayMinutes || lane.dispatchConfig.defaultResponseDelayMinutes,
            notificationChannels: lane.dispatchConfig.notificationChannels,
            notificationsSent: []
        }));
        const chain = new DispatchChain_1.default({
            chainId,
            orderId,
            orderReference: order.reference,
            industrialId: order.industrialId,
            laneId: lane.laneId,
            laneName: lane.name,
            attempts,
            currentAttemptIndex: 0,
            maxAttempts: lane.dispatchConfig.maxAttempts,
            status: 'pending',
            config: {
                autoEscalate: lane.dispatchConfig.escalateToAffretia,
                notifyIndustrial: true,
                requirePriceConfirmation: false
            }
        });
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.dispatchChainGenerated(orderId, order.reference, chainId, attempts.length);
        return chain;
    }
    /**
     * Démarre le processus de dispatch - envoie au premier transporteur
     */
    static async startDispatch(chainId) {
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain)
            throw new Error('Chaîne de dispatch non trouvée');
        if (chain.status !== 'pending') {
            throw new Error(`Dispatch déjà démarré (status: ${chain.status})`);
        }
        chain.status = 'in_progress';
        chain.startedAt = new Date();
        await chain.save();
        return this.sendToNextCarrier(chain);
    }
    /**
     * Envoie la commande au prochain transporteur dans la chaîne
     */
    static async sendToNextCarrier(chain) {
        const attempt = chain.attempts[chain.currentAttemptIndex];
        if (!attempt) {
            // Plus de transporteurs disponibles - escalade vers Affret.IA
            await this.escalateToAffretia(chain, 'Tous les transporteurs ont refusé ou n\'ont pas répondu');
            throw new Error('Aucun transporteur disponible - escalade vers Affret.IA');
        }
        // Calculer l'expiration
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + attempt.responseDelayMinutes);
        // Mettre à jour la tentative
        attempt.status = 'sent';
        attempt.sentAt = new Date();
        attempt.expiresAt = expiresAt;
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.orderSentToCarrier(chain.orderId, chain.orderReference, attempt.carrierId, attempt.carrierName, attempt.position, expiresAt);
        // Envoyer notification email au transporteur
        await this.sendCarrierNotification(chain, attempt, expiresAt);
        return attempt;
    }
    /**
     * Envoie la notification email/SMS au transporteur
     */
    static async sendCarrierNotification(chain, attempt, expiresAt) {
        try {
            // Récupérer les détails de la commande
            const order = await Order_1.default.findOne({ orderId: chain.orderId });
            if (!order) {
                console.error(`[Dispatch] Order not found for notification: ${chain.orderId}`);
                return;
            }
            // Récupérer les infos du transporteur (email depuis la Lane)
            const carrierInfo = await this.getCarrierInfo(attempt.carrierId, chain.laneId || '');
            if (!carrierInfo?.email) {
                console.warn(`[Dispatch] No email found for carrier ${attempt.carrierName}, skipping notification`);
                return;
            }
            // Construire l'URL de réponse
            const baseUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com';
            const responseUrl = `${baseUrl}/dispatch/respond/${chain.chainId}?carrier=${attempt.carrierId}`;
            // Envoyer la notification
            const sent = await notification_service_1.default.sendCarrierInvitation({
                carrierId: attempt.carrierId,
                carrierName: attempt.carrierName,
                carrierEmail: carrierInfo.email,
                carrierPhone: carrierInfo.phone,
                orderReference: chain.orderReference,
                orderId: chain.orderId,
                chainId: chain.chainId,
                pickupCity: order.pickupAddress?.city || 'Non spécifié',
                deliveryCity: order.deliveryAddress?.city || 'Non spécifié',
                pickupDate: order.dates?.pickupDate || new Date(),
                deliveryDate: order.dates?.deliveryDate || new Date(),
                goodsDescription: order.goods?.description || 'Marchandises diverses',
                weight: order.goods?.weight || 0,
                expiresAt,
                responseUrl
            });
            if (sent) {
                // Enregistrer la notification envoyée
                attempt.notificationsSent.push({
                    channel: 'email',
                    sentAt: new Date(),
                    status: 'sent'
                });
                await chain.save();
                console.log(`[Dispatch] Notification sent to ${attempt.carrierName} (${carrierInfo.email})`);
            }
        }
        catch (error) {
            console.error(`[Dispatch] Failed to send notification to ${attempt.carrierName}:`, error);
        }
    }
    /**
     * Récupère les informations du transporteur (email, téléphone)
     * Priorité: 1) Contact stocké dans Lane, 2) Variable d'env, 3) Email générique
     */
    static async getCarrierInfo(carrierId, laneId) {
        try {
            // Chercher dans la Lane si des infos de contact sont stockées
            const lane = await Lane_1.default.findOne({ laneId });
            if (!lane)
                return null;
            const carrierInLane = lane.carriers.find(c => c.carrierId === carrierId);
            if (!carrierInLane)
                return null;
            // Priorité: contact stocké dans Lane > variable d'env > email générique
            const email = carrierInLane.contact?.email ||
                process.env[`CARRIER_EMAIL_${carrierId}`] ||
                `${carrierId.replace('carrier_', '')}@transporteur.test`;
            const phone = carrierInLane.contact?.phone ||
                process.env[`CARRIER_PHONE_${carrierId}`];
            return {
                carrierId,
                carrierName: carrierInLane.contact?.contactName || carrierInLane.carrierName,
                email,
                phone
            };
        }
        catch (error) {
            console.error(`[Dispatch] Error getting carrier info for ${carrierId}:`, error);
            return null;
        }
    }
    /**
     * Traite l'acceptation par un transporteur
     */
    static async handleCarrierAccept(chainId, carrierId, proposedPrice) {
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain)
            throw new Error('Chaîne de dispatch non trouvée');
        const attempt = chain.attempts.find((a) => a.carrierId === carrierId && a.status === 'sent');
        if (!attempt)
            throw new Error('Tentative non trouvée ou déjà traitée');
        // Mettre à jour la tentative
        attempt.status = 'accepted';
        attempt.respondedAt = new Date();
        if (proposedPrice) {
            attempt.proposedPrice = proposedPrice;
        }
        // Mettre à jour la chaîne
        chain.status = 'completed';
        chain.completedAt = new Date();
        chain.assignedCarrierId = carrierId;
        chain.assignedCarrierName = attempt.carrierName;
        chain.assignedAt = new Date();
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.carrierAccepted(chain.orderId, chain.orderReference, carrierId, attempt.carrierName, proposedPrice);
        // Mettre à jour la commande avec le transporteur assigné
        const updatedOrder = await Order_1.default.findOneAndUpdate({ orderId: chain.orderId }, {
            $set: {
                assignedCarrier: {
                    carrierId,
                    carrierName: attempt.carrierName,
                    assignedAt: new Date(),
                    proposedPrice
                },
                status: 'carrier_assigned'
            }
        }, { new: true });
        // Envoyer les invitations portail automatiquement
        if (updatedOrder) {
            const invitationIds = [];
            // 1. Invitation transporteur (toujours)
            // Note: Le transporteur a déjà accès via l'acceptation, mais on peut créer une invitation formelle
            // Pour l'instant, on ne crée pas d'invitation carrier car il a déjà accès
            // 2. Invitation logisticien (si logistique externalisée)
            if (updatedOrder.logisticianManaged && updatedOrder.logisticianId) {
                // TODO: Récupérer email du logisticien depuis un service externe
                // Pour l'instant, on suppose que l'info est dans une base logisticiens
                console.log(`[Dispatch] Logistique externalisée - Invitation logisticien à envoyer pour ${updatedOrder.logisticianId}`);
            }
            // 3. Invitation expéditeur (flux entrant - fournisseur -> industriel)
            if (updatedOrder.flowType === 'inbound' && updatedOrder.pickupAddress?.enablePortalAccess) {
                const supplierId = await portal_invitation_service_1.default.createAndSendInvitation({
                    orderId: chain.orderId,
                    orderReference: chain.orderReference,
                    address: updatedOrder.pickupAddress,
                    role: 'supplier',
                    invitedBy: 'system_dispatch'
                });
                if (supplierId) {
                    invitationIds.push(supplierId);
                    console.log(`[Dispatch] Invitation expéditeur envoyée: ${supplierId}`);
                }
            }
            // 4. Invitation destinataire (flux sortant - industriel -> destinataire)
            if (updatedOrder.flowType === 'outbound' && updatedOrder.deliveryAddress?.enablePortalAccess) {
                const recipientId = await portal_invitation_service_1.default.createAndSendInvitation({
                    orderId: chain.orderId,
                    orderReference: chain.orderReference,
                    address: updatedOrder.deliveryAddress,
                    role: 'recipient',
                    invitedBy: 'system_dispatch'
                });
                if (recipientId) {
                    invitationIds.push(recipientId);
                    console.log(`[Dispatch] Invitation destinataire envoyée: ${recipientId}`);
                }
            }
            // Mettre à jour la commande avec les IDs d'invitation
            if (invitationIds.length > 0) {
                await Order_1.default.findOneAndUpdate({ orderId: chain.orderId }, { $push: { portalInvitations: { $each: invitationIds } } });
            }
            // Envoyer notification de confirmation au transporteur
            const carrierInfo = await this.getCarrierInfo(carrierId, chain.laneId || '');
            if (carrierInfo?.email) {
                const portalUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com';
                await notification_service_1.default.sendCarrierConfirmation(carrierInfo.email, attempt.carrierName, chain.orderReference, `${portalUrl}/orders/${chain.orderId}`);
                console.log(`[Dispatch] Confirmation sent to carrier ${attempt.carrierName}`);
            }
            // Notifier l'industriel que le transporteur est trouvé
            await this.notifyIndustrialStatus(chain, 'carrier_found', attempt.carrierName);
        }
        return chain;
    }
    /**
     * Notifie l'industriel d'un changement de statut dispatch
     */
    static async notifyIndustrialStatus(chain, status, carrierName) {
        try {
            // Récupérer les infos de l'industriel depuis la commande
            const order = await Order_1.default.findOne({ orderId: chain.orderId });
            if (!order)
                return;
            // Pour l'instant, on utilise un email générique basé sur industrialId
            // À terme, récupérer depuis un service de gestion des industriels
            const industrialEmail = process.env[`INDUSTRIAL_EMAIL_${chain.industrialId}`] ||
                `contact@${chain.industrialId.replace('ind_', '')}.test`;
            const industrialName = order.industrialName || chain.industrialId;
            await notification_service_1.default.notifyIndustrialDispatchStatus(industrialEmail, industrialName, chain.orderReference, status, carrierName);
            console.log(`[Dispatch] Industrial notified: ${status} for order ${chain.orderReference}`);
        }
        catch (error) {
            console.error(`[Dispatch] Failed to notify industrial:`, error);
        }
    }
    /**
     * Traite le refus par un transporteur
     */
    static async handleCarrierRefuse(chainId, carrierId, reason) {
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain)
            throw new Error('Chaîne de dispatch non trouvée');
        const attempt = chain.attempts.find((a) => a.carrierId === carrierId && a.status === 'sent');
        if (!attempt)
            throw new Error('Tentative non trouvée ou déjà traitée');
        // Mettre à jour la tentative
        attempt.status = 'refused';
        attempt.respondedAt = new Date();
        if (reason) {
            attempt.refusalReason = reason;
        }
        // Passer au transporteur suivant
        chain.currentAttemptIndex = chain.currentAttemptIndex + 1;
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.carrierRefused(chain.orderId, chain.orderReference, carrierId, attempt.carrierName, reason);
        // Essayer le transporteur suivant
        try {
            await this.sendToNextCarrier(chain);
        }
        catch (error) {
            // Plus de transporteurs - déjà escaladé
        }
        return chain;
    }
    /**
     * Traite le timeout d'un transporteur
     */
    static async handleCarrierTimeout(chainId, attemptIndex) {
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain)
            throw new Error('Chaîne de dispatch non trouvée');
        const attempt = chain.attempts[attemptIndex];
        if (!attempt || attempt.status !== 'sent') {
            throw new Error('Tentative non trouvée ou déjà traitée');
        }
        // Vérifier si vraiment en timeout
        if (attempt.expiresAt && new Date() < attempt.expiresAt) {
            throw new Error('Délai non encore expiré');
        }
        // Mettre à jour la tentative
        attempt.status = 'timeout';
        attempt.respondedAt = new Date();
        // Passer au transporteur suivant
        chain.currentAttemptIndex = chain.currentAttemptIndex + 1;
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.carrierTimeout(chain.orderId, chain.orderReference, attempt.carrierId, attempt.carrierName);
        // Essayer le transporteur suivant
        try {
            await this.sendToNextCarrier(chain);
        }
        catch (error) {
            // Plus de transporteurs - déjà escaladé
        }
        return chain;
    }
    /**
     * Escalade vers Affret.IA
     */
    static async escalateToAffretia(chain, reason) {
        chain.status = 'escalated';
        chain.escalation = {
            escalatedAt: new Date(),
            status: 'pending'
        };
        await chain.save();
        // Enregistrer l'événement
        await event_service_1.default.escalatedToAffretia(chain.orderId, chain.orderReference, reason);
        // Notifier l'industriel de l'escalade
        await this.notifyIndustrialStatus(chain, 'escalated');
        // Appel API Affret.IA pour recherche de transporteur
        try {
            const response = await affretia_service_1.default.escalateOrder(chain);
            console.log(`[Dispatch] Order ${chain.orderReference} sent to Affret.IA: ${response.affretiaOrderId}`);
        }
        catch (error) {
            console.error(`[Dispatch] Failed to escalate to Affret.IA: ${error.message}`);
            // L'escalade est enregistrée, même si l'appel API échoue
            // Le mode mock d'AffretiaService gère les cas de test
        }
    }
    /**
     * Récupère le statut de dispatch d'une commande
     */
    static async getDispatchStatus(orderId) {
        return DispatchChain_1.default.findOne({ orderId }).sort({ createdAt: -1 });
    }
    /**
     * Récupère toutes les lanes actives
     */
    static async getActiveLanes() {
        return Lane_1.default.find({ isActive: true }).sort({ name: 1 });
    }
    /**
     * Crée une nouvelle lane
     */
    static async createLane(laneData) {
        const lane = new Lane_1.default({
            laneId: `lane_${(0, uuid_1.v4)()}`,
            ...laneData
        });
        return lane.save();
    }
    /**
     * Met à jour une lane
     */
    static async updateLane(laneId, updates) {
        return Lane_1.default.findOneAndUpdate({ laneId }, { $set: updates }, { new: true });
    }
}
exports.default = DispatchService;
//# sourceMappingURL=dispatch-service.js.map
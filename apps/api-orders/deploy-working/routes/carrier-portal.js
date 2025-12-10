"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Carrier Portal - Endpoints publics pour les transporteurs
 * Permet aux transporteurs de répondre aux demandes via email link ou portail
 */
const express_1 = require("express");
const dispatch_service_1 = __importDefault(require("../services/dispatch-service"));
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
const Order_1 = __importDefault(require("../models/Order"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/carrier-portal/order/:chainId
 * Récupère les détails d'une commande pour le portail transporteur
 */
router.get('/order/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { carrierId } = req.query;
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Demande non trouvée'
            });
        }
        // Vérifier que le transporteur est bien dans la chaîne
        const attempt = chain.attempts.find(a => a.carrierId === carrierId);
        if (!attempt) {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }
        // Récupérer les détails de la commande
        const order = await Order_1.default.findOne({ orderId: chain.orderId });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }
        // Vérifier le statut de la tentative
        const canRespond = attempt.status === 'sent' &&
            attempt.expiresAt &&
            new Date() < attempt.expiresAt;
        res.json({
            success: true,
            order: {
                reference: chain.orderReference,
                pickup: {
                    address: order.pickupAddress?.street,
                    city: order.pickupAddress?.city,
                    postalCode: order.pickupAddress?.postalCode,
                    country: order.pickupAddress?.country || 'France',
                    date: order.dates?.pickupDate,
                    timeSlotStart: order.dates?.pickupTimeSlotStart,
                    timeSlotEnd: order.dates?.pickupTimeSlotEnd
                },
                delivery: {
                    address: order.deliveryAddress?.street,
                    city: order.deliveryAddress?.city,
                    postalCode: order.deliveryAddress?.postalCode,
                    country: order.deliveryAddress?.country || 'France',
                    date: order.dates?.deliveryDate,
                    timeSlotStart: order.dates?.deliveryTimeSlotStart,
                    timeSlotEnd: order.dates?.deliveryTimeSlotEnd
                },
                goods: {
                    description: order.goods?.description,
                    weight: order.goods?.weight,
                    volume: order.goods?.volume,
                    quantity: order.goods?.quantity,
                    palettes: order.goods?.palettes,
                    constraints: order.constraints?.map(c => c.type) || []
                },
                notes: order.notes
            },
            attempt: {
                status: attempt.status,
                sentAt: attempt.sentAt,
                expiresAt: attempt.expiresAt,
                responseDelayMinutes: attempt.responseDelayMinutes,
                canRespond
            },
            chain: {
                status: chain.status,
                carrierPosition: attempt.position,
                totalCarriers: chain.attempts.length
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/carrier-portal/accept/:chainId
 * Acceptation par un transporteur (depuis lien email ou portail)
 */
router.post('/accept/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { carrierId, proposedPrice, comment } = req.body;
        if (!carrierId) {
            return res.status(400).json({
                success: false,
                error: 'carrierId est requis'
            });
        }
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Demande non trouvée'
            });
        }
        // Vérifier que le transporteur peut répondre
        const attempt = chain.attempts.find(a => a.carrierId === carrierId && a.status === 'sent');
        if (!attempt) {
            return res.status(400).json({
                success: false,
                error: 'Vous ne pouvez plus répondre à cette demande'
            });
        }
        // Vérifier le délai
        if (attempt.expiresAt && new Date() > attempt.expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'Le délai de réponse est expiré'
            });
        }
        // Traiter l'acceptation
        const updatedChain = await dispatch_service_1.default.handleCarrierAccept(chainId, carrierId, proposedPrice);
        res.json({
            success: true,
            message: 'Transport accepté avec succès',
            result: {
                orderReference: updatedChain.orderReference,
                status: updatedChain.status,
                assignedCarrier: updatedChain.assignedCarrierName,
                portalUrl: `${process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com'}/orders/${chain.orderId}`
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/carrier-portal/refuse/:chainId
 * Refus par un transporteur
 */
router.post('/refuse/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { carrierId, reason } = req.body;
        if (!carrierId) {
            return res.status(400).json({
                success: false,
                error: 'carrierId est requis'
            });
        }
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Demande non trouvée'
            });
        }
        // Vérifier que le transporteur peut répondre
        const attempt = chain.attempts.find(a => a.carrierId === carrierId && a.status === 'sent');
        if (!attempt) {
            return res.status(400).json({
                success: false,
                error: 'Vous ne pouvez plus répondre à cette demande'
            });
        }
        // Traiter le refus
        const updatedChain = await dispatch_service_1.default.handleCarrierRefuse(chainId, carrierId, reason);
        // Message selon le status
        let message = 'Refus enregistré';
        if (updatedChain.status === 'escalated') {
            message = 'Refus enregistré - commande transmise à Affret.IA';
        }
        else if (updatedChain.status === 'in_progress') {
            const nextAttempt = updatedChain.attempts[updatedChain.currentAttemptIndex];
            if (nextAttempt) {
                message = `Refus enregistré - commande transmise au transporteur suivant`;
            }
        }
        res.json({
            success: true,
            message,
            result: {
                orderReference: updatedChain.orderReference,
                status: updatedChain.status
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/carrier-portal/my-orders
 * Liste les commandes assignées à un transporteur
 */
router.get('/my-orders', async (req, res) => {
    try {
        const { carrierId, status } = req.query;
        if (!carrierId) {
            return res.status(400).json({
                success: false,
                error: 'carrierId est requis'
            });
        }
        // Requêtes pour différents statuts
        const query = { assignedCarrierId: carrierId };
        if (status) {
            query.status = status;
        }
        // Commandes où ce transporteur est assigné
        const assignedChains = await DispatchChain_1.default.find(query)
            .sort({ assignedAt: -1 })
            .limit(50)
            .lean();
        // Récupérer les détails des commandes
        const orderIds = assignedChains.map(c => c.orderId);
        const orders = await Order_1.default.find({ orderId: { $in: orderIds } }).lean();
        const orderMap = new Map(orders.map(o => [o.orderId, o]));
        const results = assignedChains.map(chain => {
            const order = orderMap.get(chain.orderId);
            return {
                chainId: chain.chainId,
                orderId: chain.orderId,
                orderReference: chain.orderReference,
                status: chain.status,
                assignedAt: chain.assignedAt,
                pickup: order?.pickupAddress ? {
                    city: order.pickupAddress.city,
                    postalCode: order.pickupAddress.postalCode,
                    date: order.dates?.pickupDate
                } : null,
                delivery: order?.deliveryAddress ? {
                    city: order.deliveryAddress.city,
                    postalCode: order.deliveryAddress.postalCode,
                    date: order.dates?.deliveryDate
                } : null
            };
        });
        res.json({
            success: true,
            count: results.length,
            orders: results
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/carrier-portal/pending
 * Liste les demandes en attente pour un transporteur
 */
router.get('/pending', async (req, res) => {
    try {
        const { carrierId } = req.query;
        if (!carrierId) {
            return res.status(400).json({
                success: false,
                error: 'carrierId est requis'
            });
        }
        // Trouver les chaînes où ce transporteur a une tentative en cours
        const chains = await DispatchChain_1.default.find({
            status: 'in_progress',
            'attempts.carrierId': carrierId,
            'attempts.status': 'sent'
        }).lean();
        const pendingRequests = [];
        for (const chain of chains) {
            const attempt = chain.attempts.find((a) => a.carrierId === carrierId && a.status === 'sent');
            if (attempt && attempt.expiresAt && new Date() < new Date(attempt.expiresAt)) {
                const order = await Order_1.default.findOne({ orderId: chain.orderId }).lean();
                pendingRequests.push({
                    chainId: chain.chainId,
                    orderReference: chain.orderReference,
                    sentAt: attempt.sentAt,
                    expiresAt: attempt.expiresAt,
                    minutesRemaining: Math.round((new Date(attempt.expiresAt).getTime() - Date.now()) / (1000 * 60)),
                    pickup: order?.pickupAddress ? {
                        city: order.pickupAddress.city,
                        date: order.dates?.pickupDate
                    } : null,
                    delivery: order?.deliveryAddress ? {
                        city: order.deliveryAddress.city,
                        date: order.dates?.deliveryDate
                    } : null
                });
            }
        }
        // Trier par urgence (moins de temps restant en premier)
        pendingRequests.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
        res.json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/carrier-portal/quick-respond/:chainId
 * Endpoint pour réponse rapide depuis lien email (GET avec action query param)
 */
router.get('/quick-respond/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { carrier: carrierId, action } = req.query;
        if (!carrierId || !action) {
            // Rediriger vers le portail pour compléter la réponse
            const portalUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com';
            return res.redirect(`${portalUrl}/dispatch/respond/${chainId}?carrier=${carrierId}`);
        }
        const chain = await DispatchChain_1.default.findOne({ chainId });
        if (!chain) {
            return res.status(404).send(`
        <html>
          <head><title>Demande non trouvée</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>❌ Demande non trouvée</h2>
            <p>Cette demande de transport n'existe pas ou a été supprimée.</p>
          </body>
        </html>
      `);
        }
        // Vérifier la tentative
        const attempt = chain.attempts.find(a => a.carrierId === carrierId && a.status === 'sent');
        if (!attempt) {
            return res.status(400).send(`
        <html>
          <head><title>Réponse impossible</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>⚠️ Réponse impossible</h2>
            <p>Vous avez déjà répondu à cette demande ou elle a été transmise à un autre transporteur.</p>
          </body>
        </html>
      `);
        }
        // Vérifier délai
        if (attempt.expiresAt && new Date() > attempt.expiresAt) {
            return res.status(400).send(`
        <html>
          <head><title>Délai expiré</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>⏰ Délai expiré</h2>
            <p>Le délai de réponse pour cette demande est expiré.</p>
            <p>La demande a été transmise au transporteur suivant.</p>
          </body>
        </html>
      `);
        }
        // Traiter l'action
        if (action === 'accept') {
            await dispatch_service_1.default.handleCarrierAccept(chainId, carrierId);
            const portalUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com';
            return res.send(`
        <html>
          <head>
            <title>Transport accepté</title>
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #f0fff4; }
              .success { color: #38a169; font-size: 48px; }
              .button { display: inline-block; background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="success">✓</div>
            <h2>Transport accepté</h2>
            <p>Vous avez accepté le transport de la commande <strong>${chain.orderReference}</strong></p>
            <a href="${portalUrl}/orders/${chain.orderId}" class="button">Accéder au portail</a>
          </body>
        </html>
      `);
        }
        else if (action === 'refuse') {
            await dispatch_service_1.default.handleCarrierRefuse(chainId, carrierId, 'Refus via lien email');
            return res.send(`
        <html>
          <head>
            <title>Transport refusé</title>
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #fff5f5; }
              .refused { color: #e53e3e; font-size: 48px; }
            </style>
          </head>
          <body>
            <div class="refused">✗</div>
            <h2>Refus enregistré</h2>
            <p>Vous avez refusé le transport de la commande <strong>${chain.orderReference}</strong></p>
            <p>La demande sera transmise au transporteur suivant.</p>
          </body>
        </html>
      `);
        }
        // Action inconnue - rediriger vers portail
        const portalUrl = process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphoni-a.com';
        res.redirect(`${portalUrl}/dispatch/respond/${chainId}?carrier=${carrierId}`);
    }
    catch (error) {
        res.status(500).send(`
      <html>
        <head><title>Erreur</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>❌ Erreur</h2>
          <p>${error.message}</p>
        </body>
      </html>
    `);
    }
});
exports.default = router;
//# sourceMappingURL=carrier-portal.js.map
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
 * Routes Tracking - API de suivi temps réel SYMPHONI.A
 * Endpoints pour GPS, milestones, ETA et pointage multi-portails
 */
const express_1 = require("express");
const tracking_service_1 = __importDefault(require("../services/tracking-service"));
const router = (0, express_1.Router)();
/**
 * POST /api/v1/tracking/:orderId/position
 * Met à jour la position GPS (appelé par le transporteur)
 */
router.post('/:orderId/position', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { carrierId, latitude, longitude, accuracy, speed, heading } = req.body;
        if (!carrierId) {
            return res.status(400).json({ success: false, error: 'carrierId est requis' });
        }
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ success: false, error: 'latitude et longitude sont requis (number)' });
        }
        const result = await tracking_service_1.default.updatePosition(orderId, carrierId, {
            latitude,
            longitude,
            accuracy,
            speed,
            heading
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json({
            success: true,
            message: 'Position mise à jour',
            position: {
                latitude,
                longitude,
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/tracking/:orderId/milestone
 * Enregistre un jalon de statut (appelé par le transporteur)
 */
router.post('/:orderId/milestone', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { carrierId, status, location, notes, signature } = req.body;
        if (!carrierId) {
            return res.status(400).json({ success: false, error: 'carrierId est requis' });
        }
        if (!status) {
            return res.status(400).json({ success: false, error: 'status est requis' });
        }
        const result = await tracking_service_1.default.updateMilestone(orderId, carrierId, {
            status,
            location,
            notes,
            signature,
            timestamp: new Date()
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json({
            success: true,
            message: `Statut mis à jour: ${status}`,
            order: {
                orderId: result.order?.orderId,
                reference: result.order?.reference,
                status: result.order?.status
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/tracking/:orderId/eta
 * Met à jour l'ETA (appelé par le transporteur)
 */
router.post('/:orderId/eta', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { carrierId, eta, reason } = req.body;
        if (!carrierId) {
            return res.status(400).json({ success: false, error: 'carrierId est requis' });
        }
        if (!eta) {
            return res.status(400).json({ success: false, error: 'eta est requis (ISO date string)' });
        }
        const result = await tracking_service_1.default.updateETA(orderId, carrierId, {
            eta: new Date(eta),
            reason
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json({
            success: true,
            message: 'ETA mise à jour',
            eta: result.order?.eta
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/tracking/:orderId
 * Récupère le statut de tracking (accessible à tous les stakeholders)
 */
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { token } = req.query;
        const result = await tracking_service_1.default.getTrackingStatus(orderId, token);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/tracking/:orderId/history
 * Récupère l'historique complet du tracking
 */
router.get('/:orderId/history', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await tracking_service_1.default.getTrackingHistory(orderId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/tracking/:orderId/ping
 * Demande de pointage - envoie une notification au transporteur
 * Appelable par n'importe quel stakeholder (industriel, expéditeur, destinataire)
 */
router.post('/:orderId/ping', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { requesterId, requesterName, requesterRole, requesterEmail } = req.body;
        if (!requesterId || !requesterName || !requesterRole) {
            return res.status(400).json({
                success: false,
                error: 'requesterId, requesterName et requesterRole sont requis'
            });
        }
        const result = await tracking_service_1.default.requestPositionPing(orderId, {
            id: requesterId,
            name: requesterName,
            role: requesterRole,
            email: requesterEmail
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/tracking/:orderId/batch
 * Mise à jour groupée (position + milestone + ETA en une seule requête)
 * Optimisé pour les mises à jour mobiles
 */
router.post('/:orderId/batch', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { carrierId, position, milestone, eta } = req.body;
        if (!carrierId) {
            return res.status(400).json({ success: false, error: 'carrierId est requis' });
        }
        const results = { success: true };
        // Mettre à jour la position si fournie
        if (position && position.latitude && position.longitude) {
            const posResult = await tracking_service_1.default.updatePosition(orderId, carrierId, position);
            results.position = posResult.success ? 'updated' : posResult.error;
        }
        // Mettre à jour le milestone si fourni
        if (milestone && milestone.status) {
            const msResult = await tracking_service_1.default.updateMilestone(orderId, carrierId, milestone);
            results.milestone = msResult.success ? milestone.status : msResult.error;
        }
        // Mettre à jour l'ETA si fournie
        if (eta) {
            const etaResult = await tracking_service_1.default.updateETA(orderId, carrierId, {
                eta: new Date(eta.date || eta),
                reason: eta.reason
            });
            results.eta = etaResult.success ? 'updated' : etaResult.error;
        }
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/tracking/carrier/:carrierId/active
 * Liste tous les transports actifs pour un transporteur
 */
router.get('/carrier/:carrierId/active', async (req, res) => {
    try {
        const { carrierId } = req.params;
        // Import Order model
        const Order = (await Promise.resolve().then(() => __importStar(require('../models/Order')))).default;
        const activeOrders = await Order.find({
            carrierId,
            status: { $in: ['carrier_accepted', 'in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'] }
        }).select('orderId reference status pickupAddress.city deliveryAddress.city dates eta currentLocation').sort({ 'dates.pickupDate': 1 });
        res.json({
            success: true,
            count: activeOrders.length,
            orders: activeOrders.map(o => ({
                orderId: o.orderId,
                reference: o.reference,
                status: o.status,
                pickup: o.pickupAddress?.city,
                delivery: o.deliveryAddress?.city,
                pickupDate: o.dates?.pickupDate,
                deliveryDate: o.dates?.deliveryDate,
                eta: o.eta,
                lastPosition: o.currentLocation
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=tracking.js.map
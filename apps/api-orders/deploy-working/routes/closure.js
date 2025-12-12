"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Closure - API de clôture et archivage SYMPHONI.A
 * Clôture manuelle/automatique et archivage légal (10 ans)
 */
const express_1 = require("express");
const closure_service_1 = __importDefault(require("../services/closure-service"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/closure/:orderId/check
 * Vérifie si une commande peut être clôturée
 */
router.get('/:orderId/check', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await closure_service_1.default.checkClosureEligibility(orderId);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/closure/:orderId/close
 * Clôture manuellement une commande
 */
router.post('/:orderId/close', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { closedBy } = req.body;
        if (!closedBy || !closedBy.id || !closedBy.name) {
            return res.status(400).json({
                success: false,
                error: 'closedBy (id, name) est requis'
            });
        }
        const result = await closure_service_1.default.closeOrder(orderId, closedBy);
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
 * POST /api/v1/closure/auto-close
 * Déclenche la clôture automatique (pour cron job)
 */
router.post('/auto-close', async (req, res) => {
    try {
        const { hoursAfterDelivery } = req.body;
        const result = await closure_service_1.default.autoCloseDeliveredOrders(hoursAfterDelivery || 24);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/closure/auto-archive
 * Déclenche l'archivage automatique (pour cron job)
 */
router.post('/auto-archive', async (req, res) => {
    try {
        const { daysAfterClosure } = req.body;
        const result = await closure_service_1.default.autoArchiveCompletedOrders(daysAfterClosure || 30);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/closure/stats
 * Statistiques de clôture
 */
router.get('/stats', async (req, res) => {
    try {
        const industrialId = req.headers['x-industrial-id'];
        const stats = await closure_service_1.default.getClosureStats(industrialId);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=closure.js.map
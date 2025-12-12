"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Delivery - API de confirmation de livraison SYMPHONI.A
 * Confirmation avec signature électronique, gestion des incidents
 */
const express_1 = require("express");
const delivery_service_1 = __importDefault(require("../services/delivery-service"));
const router = (0, express_1.Router)();
/**
 * POST /api/v1/delivery/:orderId/confirm
 * Confirme la livraison avec signature électronique
 */
router.post('/:orderId/confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { confirmedBy, signature, receivedBy, receivedAt, notes, condition, damageNotes, photos, location } = req.body;
        if (!confirmedBy || !confirmedBy.id || !confirmedBy.name) {
            return res.status(400).json({
                success: false,
                error: 'confirmedBy (id, name, role) est requis'
            });
        }
        if (!signature || !signature.data) {
            return res.status(400).json({
                success: false,
                error: 'signature.data (base64) est requis'
            });
        }
        const result = await delivery_service_1.default.confirmDelivery({
            orderId,
            confirmedBy,
            signature: {
                data: signature.data,
                timestamp: new Date(),
                ipAddress: signature.ipAddress || req.ip,
                deviceInfo: signature.deviceInfo
            },
            receivedBy,
            receivedAt: receivedAt ? new Date(receivedAt) : undefined,
            notes,
            condition,
            damageNotes,
            photos,
            location
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
 * POST /api/v1/delivery/:orderId/issue
 * Signale un problème de livraison
 */
router.post('/:orderId/issue', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reportedBy, issueType, description, severity, photos } = req.body;
        if (!reportedBy || !issueType || !description || !severity) {
            return res.status(400).json({
                success: false,
                error: 'reportedBy, issueType, description et severity sont requis'
            });
        }
        const validTypes = ['damage', 'shortage', 'wrong_product', 'delay', 'other'];
        if (!validTypes.includes(issueType)) {
            return res.status(400).json({
                success: false,
                error: `issueType doit être: ${validTypes.join(', ')}`
            });
        }
        const validSeverities = ['minor', 'major', 'critical'];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                error: `severity doit être: ${validSeverities.join(', ')}`
            });
        }
        const result = await delivery_service_1.default.reportDeliveryIssue({
            orderId,
            reportedBy,
            issueType,
            description,
            severity,
            photos
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/delivery/stats
 * Statistiques de livraison
 */
router.get('/stats', async (req, res) => {
    try {
        const industrialId = req.headers['x-industrial-id'];
        const stats = await delivery_service_1.default.getDeliveryStats(industrialId);
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
//# sourceMappingURL=delivery.js.map
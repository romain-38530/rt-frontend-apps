"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Palettes - API de gestion des palettes Europe
 */
const express_1 = require("express");
const palette_service_1 = __importDefault(require("../services/palette-service"));
const router = (0, express_1.Router)();
router.get('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await palette_service_1.default.getPalletStatus(orderId);
        if (!result.success)
            return res.status(404).json(result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/:orderId/pickup', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { quantity, palletType, givenBySender, takenByCarrier, senderId, senderName, senderType, carrierId, carrierName, confirmedBy, vehiclePlate, driverName, photos, signature, notes } = req.body;
        if (!quantity || !palletType || givenBySender === undefined || takenByCarrier === undefined) {
            return res.status(400).json({ success: false, error: 'quantity, palletType, givenBySender et takenByCarrier sont requis' });
        }
        if (!senderId || !senderName || !carrierId || !carrierName || !confirmedBy) {
            return res.status(400).json({ success: false, error: 'senderId, senderName, carrierId, carrierName et confirmedBy sont requis' });
        }
        const result = await palette_service_1.default.confirmPickupExchange(orderId, {
            quantity, palletType, givenBySender, takenByCarrier, senderId, senderName, senderType: senderType || 'industriel', carrierId, carrierName, confirmedBy, vehiclePlate, driverName, photos, signature, notes
        });
        if (!result.success)
            return res.status(400).json(result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/:orderId/delivery', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { quantity, palletType, givenByCarrier, receivedByRecipient, carrierId, carrierName, recipientId, recipientName, recipientType, confirmedBy, photos, signature, notes } = req.body;
        if (!quantity || !palletType || givenByCarrier === undefined || receivedByRecipient === undefined) {
            return res.status(400).json({ success: false, error: 'quantity, palletType, givenByCarrier et receivedByRecipient sont requis' });
        }
        if (!carrierId || !carrierName || !recipientId || !recipientName || !confirmedBy) {
            return res.status(400).json({ success: false, error: 'carrierId, carrierName, recipientId, recipientName et confirmedBy sont requis' });
        }
        const result = await palette_service_1.default.confirmDeliveryExchange(orderId, {
            quantity, palletType, givenByCarrier, receivedByRecipient, carrierId, carrierName, recipientId, recipientName, recipientType: recipientType || 'industriel', confirmedBy, photos, signature, notes
        });
        if (!result.success)
            return res.status(400).json(result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/company/:companyId/balance', async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await palette_service_1.default.getCompanyBalance(companyId);
        if (!result.success)
            return res.status(404).json(result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=palettes.js.map
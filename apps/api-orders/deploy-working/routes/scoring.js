"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Scoring - Gestion du scoring transporteurs SYMPHONI.A
 */
const express_1 = require("express");
const scoring_service_1 = __importDefault(require("../services/scoring-service"));
const router = (0, express_1.Router)();
/**
 * POST /api/v1/scoring/calculate
 * Calcule le score d'un transport
 */
router.post('/calculate', async (req, res) => {
    try {
        const scoreInput = req.body;
        // Validation
        if (!scoreInput.orderId || !scoreInput.carrierId || !scoreInput.industrialId) {
            return res.status(400).json({
                success: false,
                error: 'orderId, carrierId et industrialId sont requis'
            });
        }
        // Convertir les dates si présentes
        if (scoreInput.pickupScheduledAt)
            scoreInput.pickupScheduledAt = new Date(scoreInput.pickupScheduledAt);
        if (scoreInput.pickupActualAt)
            scoreInput.pickupActualAt = new Date(scoreInput.pickupActualAt);
        if (scoreInput.deliveryScheduledAt)
            scoreInput.deliveryScheduledAt = new Date(scoreInput.deliveryScheduledAt);
        if (scoreInput.deliveryActualAt)
            scoreInput.deliveryActualAt = new Date(scoreInput.deliveryActualAt);
        if (scoreInput.podDeliveredAt)
            scoreInput.podDeliveredAt = new Date(scoreInput.podDeliveredAt);
        if (scoreInput.deliveryCompletedAt)
            scoreInput.deliveryCompletedAt = new Date(scoreInput.deliveryCompletedAt);
        const score = await scoring_service_1.default.calculateOrderScore(scoreInput);
        res.json({
            success: true,
            message: `Score calculé: ${score.finalScore}/100`,
            score: {
                scoreId: score.scoreId,
                orderId: score.orderId,
                carrierId: score.carrierId,
                carrierName: score.carrierName,
                finalScore: score.finalScore,
                criteria: score.criteria,
                calculatedAt: score.createdAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/scoring/carrier/:carrierId
 * Récupère le score global d'un transporteur
 */
router.get('/carrier/:carrierId', async (req, res) => {
    try {
        const { carrierId } = req.params;
        const globalScore = await scoring_service_1.default.getCarrierGlobalScore(carrierId);
        if (!globalScore) {
            return res.status(404).json({
                success: false,
                error: 'Aucun score trouvé pour ce transporteur'
            });
        }
        res.json({
            success: true,
            globalScore
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/scoring/carrier/:carrierId/history
 * Récupère l'historique des scores d'un transporteur
 */
router.get('/carrier/:carrierId/history', async (req, res) => {
    try {
        const { carrierId } = req.params;
        const { limit } = req.query;
        const history = await scoring_service_1.default.getCarrierScoreHistory(carrierId, limit ? parseInt(limit) : 50);
        res.json({
            success: true,
            count: history.length,
            history
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/scoring/top
 * Récupère les meilleurs transporteurs pour un industriel
 */
router.get('/top', async (req, res) => {
    try {
        const { industrialId, limit } = req.query;
        if (!industrialId) {
            return res.status(400).json({
                success: false,
                error: 'industrialId est requis'
            });
        }
        const topCarriers = await scoring_service_1.default.getTopCarriers(industrialId, limit ? parseInt(limit) : 10);
        res.json({
            success: true,
            count: topCarriers.length,
            carriers: topCarriers.map(c => ({
                carrierId: c.carrierId,
                carrierName: c.carrierName,
                globalScore: c.globalScore,
                totalTransports: c.stats.totalTransports,
                trend: c.stats.trendLastMonth
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/scoring/stats
 * Statistiques de scoring pour le dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const { industrialId } = req.query;
        if (!industrialId) {
            return res.status(400).json({
                success: false,
                error: 'industrialId est requis'
            });
        }
        const stats = await scoring_service_1.default.getScoringStats(industrialId);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/scoring/recalculate/:carrierId
 * Force le recalcul du score global d'un transporteur
 */
router.post('/recalculate/:carrierId', async (req, res) => {
    try {
        const { carrierId } = req.params;
        const { carrierName } = req.body;
        if (!carrierName) {
            return res.status(400).json({
                success: false,
                error: 'carrierName est requis'
            });
        }
        const globalScore = await scoring_service_1.default.updateGlobalScore(carrierId, carrierName);
        res.json({
            success: true,
            message: 'Score global recalculé',
            globalScore
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/scoring/order/:orderId
 * Récupère le score d'un transport spécifique
 */
router.get('/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const CarrierOrderScore = require('../models/CarrierScore').default;
        const score = await CarrierOrderScore.findOne({ orderId });
        if (!score) {
            return res.status(404).json({
                success: false,
                error: 'Score non trouvé pour cette commande'
            });
        }
        res.json({
            success: true,
            score
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=scoring.js.map
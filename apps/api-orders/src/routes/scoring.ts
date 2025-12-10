/**
 * Routes Scoring - Gestion du scoring transporteurs SYMPHONI.A
 */
import { Router, Request, Response } from 'express';
import ScoringService from '../services/scoring-service';

const router = Router();

/**
 * POST /api/v1/scoring/calculate
 * Calcule le score d'un transport
 */
router.post('/calculate', async (req: Request, res: Response) => {
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
    if (scoreInput.pickupScheduledAt) scoreInput.pickupScheduledAt = new Date(scoreInput.pickupScheduledAt);
    if (scoreInput.pickupActualAt) scoreInput.pickupActualAt = new Date(scoreInput.pickupActualAt);
    if (scoreInput.deliveryScheduledAt) scoreInput.deliveryScheduledAt = new Date(scoreInput.deliveryScheduledAt);
    if (scoreInput.deliveryActualAt) scoreInput.deliveryActualAt = new Date(scoreInput.deliveryActualAt);
    if (scoreInput.podDeliveredAt) scoreInput.podDeliveredAt = new Date(scoreInput.podDeliveredAt);
    if (scoreInput.deliveryCompletedAt) scoreInput.deliveryCompletedAt = new Date(scoreInput.deliveryCompletedAt);

    const score = await ScoringService.calculateOrderScore(scoreInput);

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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/scoring/carrier/:carrierId
 * Récupère le score global d'un transporteur
 */
router.get('/carrier/:carrierId', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const globalScore = await ScoringService.getCarrierGlobalScore(carrierId);

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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/scoring/carrier/:carrierId/history
 * Récupère l'historique des scores d'un transporteur
 */
router.get('/carrier/:carrierId/history', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const { limit } = req.query;

    const history = await ScoringService.getCarrierScoreHistory(
      carrierId,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/scoring/top
 * Récupère les meilleurs transporteurs pour un industriel
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const { industrialId, limit } = req.query;

    if (!industrialId) {
      return res.status(400).json({
        success: false,
        error: 'industrialId est requis'
      });
    }

    const topCarriers = await ScoringService.getTopCarriers(
      industrialId as string,
      limit ? parseInt(limit as string) : 10
    );

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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/scoring/stats
 * Statistiques de scoring pour le dashboard
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.query;

    if (!industrialId) {
      return res.status(400).json({
        success: false,
        error: 'industrialId est requis'
      });
    }

    const stats = await ScoringService.getScoringStats(industrialId as string);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/scoring/recalculate/:carrierId
 * Force le recalcul du score global d'un transporteur
 */
router.post('/recalculate/:carrierId', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const { carrierName } = req.body;

    if (!carrierName) {
      return res.status(400).json({
        success: false,
        error: 'carrierName est requis'
      });
    }

    const globalScore = await ScoringService.updateGlobalScore(carrierId, carrierName);

    res.json({
      success: true,
      message: 'Score global recalculé',
      globalScore
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/scoring/order/:orderId
 * Récupère le score d'un transport spécifique
 */
router.get('/order/:orderId', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

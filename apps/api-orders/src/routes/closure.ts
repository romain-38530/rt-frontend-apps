/**
 * Routes Closure - API de clôture et archivage SYMPHONI.A
 * Clôture manuelle/automatique et archivage légal (10 ans)
 */
import { Router, Request, Response } from 'express';
import ClosureService from '../services/closure-service';

const router = Router();

/**
 * GET /api/v1/closure/:orderId/check
 * Vérifie si une commande peut être clôturée
 */
router.get('/:orderId/check', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await ClosureService.checkClosureEligibility(orderId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/closure/:orderId/close
 * Clôture manuellement une commande
 */
router.post('/:orderId/close', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { closedBy } = req.body;

    if (!closedBy || !closedBy.id || !closedBy.name) {
      return res.status(400).json({
        success: false,
        error: 'closedBy (id, name) est requis'
      });
    }

    const result = await ClosureService.closeOrder(orderId, closedBy);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/closure/auto-close
 * Déclenche la clôture automatique (pour cron job)
 */
router.post('/auto-close', async (req: Request, res: Response) => {
  try {
    const { hoursAfterDelivery } = req.body;

    const result = await ClosureService.autoCloseDeliveredOrders(hoursAfterDelivery || 24);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/closure/auto-archive
 * Déclenche l'archivage automatique (pour cron job)
 */
router.post('/auto-archive', async (req: Request, res: Response) => {
  try {
    const { daysAfterClosure } = req.body;

    const result = await ClosureService.autoArchiveCompletedOrders(daysAfterClosure || 30);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/closure/stats
 * Statistiques de clôture
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const industrialId = req.headers['x-industrial-id'] as string;

    const stats = await ClosureService.getClosureStats(industrialId);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

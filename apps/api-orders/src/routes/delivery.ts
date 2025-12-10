/**
 * Routes Delivery - API de confirmation de livraison SYMPHONI.A
 * Confirmation avec signature électronique, gestion des incidents
 */
import { Router, Request, Response } from 'express';
import DeliveryService from '../services/delivery-service';

const router = Router();

/**
 * POST /api/v1/delivery/:orderId/confirm
 * Confirme la livraison avec signature électronique
 */
router.post('/:orderId/confirm', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const {
      confirmedBy,
      signature,
      receivedBy,
      receivedAt,
      notes,
      condition,
      damageNotes,
      photos,
      location
    } = req.body;

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

    const result = await DeliveryService.confirmDelivery({
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/delivery/:orderId/issue
 * Signale un problème de livraison
 */
router.post('/:orderId/issue', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const {
      reportedBy,
      issueType,
      description,
      severity,
      photos
    } = req.body;

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

    const result = await DeliveryService.reportDeliveryIssue({
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/delivery/stats
 * Statistiques de livraison
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const industrialId = req.headers['x-industrial-id'] as string;

    const stats = await DeliveryService.getDeliveryStats(industrialId);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

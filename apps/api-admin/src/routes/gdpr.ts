/**
 * Routes GDPR
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateAdmin, requireRole } from '../middleware/auth';
import { gdprService } from '../services/gdpr-service';

const router = Router();

/**
 * @route GET /api/v1/admin/gdpr/my-data
 * @desc Exporter mes propres données (droit d'accès)
 */
router.get('/my-data', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = await gdprService.exportUserData(req.user!.id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="my-data-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/admin/gdpr/requests
 * @desc Créer une demande GDPR
 */
router.post('/requests', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type, targetUserId, reason } = req.body;
    const requestedBy = req.user!.id;

    if (!type || !['access', 'deletion', 'portability', 'rectification'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request type. Must be: access, deletion, portability, or rectification'
      });
    }

    // L'utilisateur peut seulement demander pour lui-même sauf admin
    const targetId = targetUserId || requestedBy;
    if (targetId !== requestedBy && !req.user!.roles.includes('super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'You can only create GDPR requests for yourself'
      });
    }

    const request = await gdprService.createRequest(type, requestedBy, targetId, reason);

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/admin/gdpr/requests
 * @desc Lister les demandes GDPR (admin)
 */
router.get('/requests', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit, offset } = req.query;

    const result = await gdprService.listRequests({
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.requests,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/admin/gdpr/requests/:id
 * @desc Obtenir une demande GDPR
 */
router.get('/requests/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const request = await gdprService.getRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Vérifier les permissions
    const isOwner = request.requestedBy.toString() === req.user!.id ||
                    request.targetUser.toString() === req.user!.id;
    const isAdmin = req.user!.roles.includes('super_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/admin/gdpr/requests/:id/process
 * @desc Traiter une demande GDPR (admin)
 */
router.post('/requests/:id/process', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { action, notes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: approve or reject'
      });
    }

    const request = await gdprService.processRequest(
      req.params.id,
      action,
      req.user!.id,
      notes
    );

    res.json({
      success: true,
      data: request,
      message: `Request ${action === 'approve' ? 'approved and processed' : 'rejected'}`
    });
  } catch (error: any) {
    if (error.message === 'Request not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/admin/gdpr/requests/:id/download
 * @desc Télécharger le résultat d'une demande d'export
 */
router.get('/requests/:id/download', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const request = await gdprService.getRequest(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Vérifier les permissions
    const isOwner = request.requestedBy.toString() === req.user!.id ||
                    request.targetUser.toString() === req.user!.id;
    const isAdmin = req.user!.roles.includes('super_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Request has not been processed yet'
      });
    }

    if (!['access', 'portability'].includes(request.type)) {
      return res.status(400).json({
        success: false,
        error: 'This request type does not produce downloadable data'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${request._id}.json"`);
    res.json(request.result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

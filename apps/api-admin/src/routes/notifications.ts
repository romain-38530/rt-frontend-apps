/**
 * Routes Notifications
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateAdmin, requireRole } from '../middleware/auth';
import { notificationService } from '../services/notification-service';
import { NotificationType } from '../models/Notification';

const router = Router();

/**
 * @route GET /api/v1/admin/notifications
 * @desc Récupérer mes notifications
 */
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { unreadOnly, limit, offset } = req.query;

    const notifications = await notificationService.getForUser(req.user!.id, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/admin/notifications/unread-count
 * @desc Compter les notifications non lues
 */
router.get('/unread-count', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/admin/notifications/:id/read
 * @desc Marquer une notification comme lue
 */
router.post('/:id/read', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAsRead(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/admin/notifications/read-all
 * @desc Marquer toutes les notifications comme lues
 */
router.post('/read-all', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/admin/notifications/all
 * @desc Lister toutes les notifications (admin)
 */
router.get('/all', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, type } = req.query;

    const result = await notificationService.list({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      type: type as NotificationType | undefined
    });

    res.json({
      success: true,
      data: result.notifications,
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
 * @route POST /api/v1/admin/notifications
 * @desc Créer une notification (admin)
 */
router.post('/', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, message, target, link, expiresAt } = req.body;

    if (!title || !message || !target?.type) {
      return res.status(400).json({
        success: false,
        error: 'title, message, and target.type are required'
      });
    }

    const notification = await notificationService.create({
      type: type || 'info',
      title,
      message,
      target,
      link,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/admin/notifications/broadcast
 * @desc Envoyer une notification à tous les utilisateurs
 */
router.post('/broadcast', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, message, link, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'title and message are required'
      });
    }

    const notification = await notificationService.createSystemNotification(
      title,
      message,
      type || 'announcement'
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Broadcast notification created'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/admin/notifications/:id
 * @desc Supprimer une notification (admin)
 */
router.delete('/:id', authenticateAdmin, requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await notificationService.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

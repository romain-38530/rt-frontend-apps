import { Router, Request, Response } from 'express';
import Notification from '../models/Notification';
import {
  saveNotificationSettings,
  getNotificationSettings,
  getAllNotificationSettings,
  NotificationSettings,
} from '../services/notifications';

const router = Router();

/**
 * GET /notifications
 * Liste toutes les notifications avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      type,
      status,
      companyId,
      chequeId,
      disputeId,
      limit = 50,
      offset = 0,
    } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (companyId) filter['metadata.companyId'] = companyId;
    if (chequeId) filter['metadata.chequeId'] = chequeId;
    if (disputeId) filter['metadata.disputeId'] = disputeId;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);

    // Stats par statut
    const statsByStatus = await Notification.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Stats par type
    const statsByType = await Notification.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      data: notifications,
      total,
      statsByStatus: statsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      statsByType: statsByType.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/:notificationId
 * Détails d'une notification
 */
router.get('/:notificationId', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications/settings
 * Configurer les préférences de notifications pour une entreprise
 */
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const settings: NotificationSettings = req.body;

    if (!settings.companyId) {
      return res.status(400).json({ error: 'companyId requis' });
    }

    // Validation des canaux
    if (!settings.channels) {
      return res.status(400).json({ error: 'channels requis' });
    }

    // Validation des événements
    if (!settings.events) {
      return res.status(400).json({ error: 'events requis' });
    }

    // Valeurs par défaut pour les seuils
    if (!settings.quotaAlertThresholds) {
      settings.quotaAlertThresholds = {
        daily: 80,
        weekly: 80,
      };
    }

    saveNotificationSettings(settings);

    res.status(201).json({
      message: 'Paramètres de notifications enregistrés',
      settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/settings/:companyId
 * Récupérer les préférences de notifications d'une entreprise
 */
router.get('/settings/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const settings = getNotificationSettings(companyId);

    if (!settings) {
      // Retourner des paramètres par défaut
      const defaultSettings: NotificationSettings = {
        companyId,
        channels: {
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: false },
          webhook: { enabled: false },
        },
        events: {
          chequeStatusChange: true,
          disputeCreated: true,
          disputeResolved: true,
          disputeEscalated: true,
          quotaAlert: true,
        },
        quotaAlertThresholds: {
          daily: 80,
          weekly: 80,
        },
      };
      return res.json({
        message: 'Aucun paramètre trouvé, valeurs par défaut retournées',
        settings: defaultSettings,
        isDefault: true,
      });
    }

    res.json({
      settings,
      isDefault: false,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/settings
 * Liste tous les paramètres de notifications
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const allSettings = getAllNotificationSettings();
    res.json({
      total: allSettings.length,
      settings: allSettings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /notifications/:notificationId
 * Supprimer une notification
 */
router.delete('/:notificationId', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOneAndDelete({ notificationId: req.params.notificationId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.json({ message: 'Notification supprimée', notificationId: req.params.notificationId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications/:notificationId/retry
 * Réessayer l'envoi d'une notification échouée
 */
router.post('/:notificationId/retry', async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOne({ notificationId: req.params.notificationId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.status !== 'failed') {
      return res.status(400).json({ error: 'Seules les notifications échouées peuvent être réessayées' });
    }

    if (notification.retryCount >= notification.maxRetries) {
      return res.status(400).json({ error: 'Nombre maximum de tentatives atteint' });
    }

    notification.status = 'pending';
    notification.retryCount += 1;
    notification.error = undefined;
    await notification.save();

    res.json({
      message: 'Notification remise en file d\'envoi',
      notification,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/stats/global
 * Statistiques globales des notifications
 */
router.get('/stats/global', async (req: Request, res: Response) => {
  try {
    const total = await Notification.countDocuments();
    const byStatus = await Notification.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await Notification.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const successRate = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: {
            $sum: {
              $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0],
            },
          },
        },
      },
    ]);

    const rate = successRate.length > 0
      ? Math.round((successRate[0].success / successRate[0].total) * 100)
      : 0;

    res.json({
      total,
      recentCount,
      successRate: rate,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byType: byType.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

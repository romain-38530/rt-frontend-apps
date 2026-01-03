import { Router, Request, Response } from 'express';
import Supplier from '../models/Supplier';
import { authenticateSupplier, AuthRequest } from '../middleware/auth';

const router = Router();

// Interface pour les notifications (en mémoire ou Redis dans un cas réel)
interface Notification {
  id: string;
  supplierId: string;
  type: 'order' | 'slot' | 'signature' | 'message' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  data?: any;
  createdAt: Date;
}

// Stockage temporaire en mémoire (devrait être dans Redis ou MongoDB dans un cas réel)
const notificationsStore: Notification[] = [];

/**
 * GET /notifications
 * Liste des notifications pour le fournisseur
 */
router.get('/', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      read,
      type,
      priority,
      page = '1',
      limit = '20'
    } = req.query;

    let notifications = notificationsStore.filter((n) => n.supplierId === supplierId);

    // Filtrer par statut de lecture
    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter((n) => n.read === isRead);
    }

    // Filtrer par type
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    // Filtrer par priorité
    if (priority) {
      notifications = notifications.filter((n) => n.priority === priority);
    }

    // Trier par date (plus récentes en premier)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    const paginatedNotifications = notifications.slice(start, end);

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / limitNum)
      },
      unreadCount: notifications.filter((n) => !n.read).length
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/:id/read', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notification = notificationsStore.find(
      (n) => n.id === id && n.supplierId === supplierId
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/read-all', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let count = 0;
    notificationsStore.forEach((notification) => {
      if (notification.supplierId === supplierId && !notification.read) {
        notification.read = true;
        count++;
      }
    });

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      count
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /notifications/:id
 * Supprimer une notification
 */
router.delete('/:id', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const index = notificationsStore.findIndex(
      (n) => n.id === id && n.supplierId === supplierId
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notificationsStore.splice(index, 1);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/settings
 * Récupérer les paramètres de notification
 */
router.get('/settings', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Dans un cas réel, on aurait des paramètres plus détaillés
    res.json({
      notificationsEnabled: supplier.settings.notifications,
      channels: {
        email: true,
        push: true,
        sms: false
      },
      preferences: {
        newOrder: { email: true, push: true, sms: false },
        slotProposed: { email: true, push: true, sms: true },
        slotConfirmed: { email: true, push: true, sms: false },
        newMessage: { email: false, push: true, sms: false },
        signatureRequired: { email: true, push: true, sms: false },
        loadingReminder: { email: true, push: true, sms: true }
      }
    });
  } catch (error: any) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications/settings
 * Mettre à jour les paramètres de notification
 */
router.post('/settings', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { notificationsEnabled, channels, preferences } = req.body;

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Mettre à jour le paramètre global
    if (typeof notificationsEnabled === 'boolean') {
      supplier.settings.notifications = notificationsEnabled;
      await supplier.save();
    }

    // Dans un cas réel, on stockerait les préférences détaillées dans une collection séparée
    console.log('Notification settings updated:', { channels, preferences });

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: {
        notificationsEnabled: supplier.settings.notifications,
        channels,
        preferences
      }
    });
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications/test
 * Envoyer une notification de test
 */
router.post('/test', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const testNotification: Notification = {
      id: `TEST-${Date.now()}`,
      supplierId,
      type: 'system',
      title: 'Notification de test',
      message: 'Ceci est une notification de test. Si vous la voyez, vos notifications fonctionnent correctement.',
      priority: 'low',
      read: false,
      createdAt: new Date()
    };

    notificationsStore.push(testNotification);

    res.json({
      success: true,
      message: 'Test notification sent',
      notification: testNotification
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications (Endpoint interne pour créer des notifications)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { supplierId, type, title, message, priority, data } = req.body;

    if (!supplierId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['supplierId', 'type', 'title', 'message']
      });
    }

    const notification: Notification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      supplierId,
      type,
      title,
      message,
      priority: priority || 'medium',
      read: false,
      data,
      createdAt: new Date()
    };

    notificationsStore.push(notification);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express, { Response } from 'express';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';

const router = express.Router();

// Interface pour une notification
interface INotification {
  notificationId: string;
  recipientId: string;
  type: 'delivery' | 'incident' | 'eta_update' | 'signature' | 'chat' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
}

// Stockage temporaire des notifications (à remplacer par une base de données)
const notificationsStore = new Map<string, INotification[]>();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(requireActiveRecipient);

// GET /notifications - Liste des notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type,
      read,
      priority,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const recipientId = req.user!.recipientId;

    // Récupérer les notifications du stockage
    let notifications = notificationsStore.get(recipientId) || [];

    // Filtrer
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter(n => n.read === isRead);
    }

    if (priority) {
      notifications = notifications.filter(n => n.priority === priority);
    }

    // Trier
    notifications.sort((a, b) => {
      const aValue = a[sortBy as keyof INotification] as any;
      const bValue = b[sortBy as keyof INotification] as any;

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = notifications.length;
    const paginatedNotifications = notifications.slice(skip, skip + limitNum);

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications', details: error.message });
  }
});

// GET /notifications/unread/count - Nombre de notifications non lues
router.get('/unread/count', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;

    const notifications = notificationsStore.get(recipientId) || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const byType = notifications
      .filter(n => !n.read)
      .reduce((acc: any, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {});

    res.json({
      unreadCount,
      byType
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Error fetching unread count', details: error.message });
  }
});

// PUT /notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const notifications = notificationsStore.get(recipientId) || [];
    const notification = notifications.find(n => n.notificationId === id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    notification.read = true;
    notification.readAt = new Date();

    notificationsStore.set(recipientId, notifications);

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error marking notification as read', details: error.message });
  }
});

// PUT /notifications/read-all - Marquer toutes les notifications comme lues
router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;

    const notifications = notificationsStore.get(recipientId) || [];
    const now = new Date();

    notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = now;
      }
    });

    notificationsStore.set(recipientId, notifications);

    res.json({
      message: 'All notifications marked as read',
      count: notifications.length
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error marking all notifications as read', details: error.message });
  }
});

// DELETE /notifications/:id - Supprimer une notification
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const notifications = notificationsStore.get(recipientId) || [];
    const index = notifications.findIndex(n => n.notificationId === id);

    if (index === -1) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    notifications.splice(index, 1);
    notificationsStore.set(recipientId, notifications);

    res.json({
      message: 'Notification deleted successfully',
      notificationId: id
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Error deleting notification', details: error.message });
  }
});

// DELETE /notifications/clear-all - Supprimer toutes les notifications lues
router.delete('/clear-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;

    const notifications = notificationsStore.get(recipientId) || [];
    const unreadNotifications = notifications.filter(n => !n.read);
    const deletedCount = notifications.length - unreadNotifications.length;

    notificationsStore.set(recipientId, unreadNotifications);

    res.json({
      message: 'All read notifications cleared',
      deletedCount,
      remainingCount: unreadNotifications.length
    });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Error clearing notifications', details: error.message });
  }
});

// POST /notifications/test - Créer une notification de test (dev uniquement)
router.post('/test', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, title, message, priority = 'normal', data } = req.body;
    const recipientId = req.user!.recipientId;

    if (!type || !title || !message) {
      res.status(400).json({ error: 'Missing required fields: type, title, message' });
      return;
    }

    const notification: INotification = {
      notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipientId,
      type,
      title,
      message,
      data,
      read: false,
      priority,
      createdAt: new Date()
    };

    const notifications = notificationsStore.get(recipientId) || [];
    notifications.unshift(notification);
    notificationsStore.set(recipientId, notifications);

    res.status(201).json({
      message: 'Test notification created',
      notification
    });
  } catch (error: any) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Error creating test notification', details: error.message });
  }
});

// Fonction helper pour créer une notification (utilisée par d'autres services)
export const createNotification = (
  recipientId: string,
  type: INotification['type'],
  title: string,
  message: string,
  priority: INotification['priority'] = 'normal',
  data?: any
): void => {
  const notification: INotification = {
    notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recipientId,
    type,
    title,
    message,
    data,
    read: false,
    priority,
    createdAt: new Date()
  };

  const notifications = notificationsStore.get(recipientId) || [];
  notifications.unshift(notification);

  // Limiter à 1000 notifications maximum
  if (notifications.length > 1000) {
    notifications.splice(1000);
  }

  notificationsStore.set(recipientId, notifications);
};

export default router;

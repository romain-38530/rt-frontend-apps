/**
 * Service de gestion des notifications
 */

import { Notification, NotificationRead, INotification, NotificationType, NotificationTargetType } from '../models/Notification';
import User from '../models/User';
import mongoose from 'mongoose';

export interface CreateNotificationDTO {
  type: NotificationType;
  title: string;
  message: string;
  target: {
    type: NotificationTargetType;
    value?: string;
  };
  link?: string;
  expiresAt?: Date;
  createdBy?: string;
}

export interface NotificationWithReadStatus extends INotification {
  isRead: boolean;
}

class NotificationService {
  /**
   * Créer une nouvelle notification
   */
  async create(data: CreateNotificationDTO): Promise<INotification> {
    const notification = await Notification.create({
      ...data,
      createdBy: data.createdBy ? new mongoose.Types.ObjectId(data.createdBy) : undefined
    });

    // TODO: Envoyer via WebSocket aux utilisateurs concernés
    // await this.broadcastToTargets(notification);

    return notification;
  }

  /**
   * Récupérer les notifications pour un utilisateur
   */
  async getForUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Construire la query pour les notifications ciblant cet utilisateur
    const query: any = {
      $or: [
        { 'target.type': 'all' },
        { 'target.type': 'user', 'target.value': userId }
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    };

    // Ajouter filtre par companyId si présent
    if (user.companyId) {
      query.$or.push({
        'target.type': 'company',
        'target.value': user.companyId.toString()
      });
    }

    // Ajouter filtre par rôle si l'utilisateur a des rôles
    if (user.roles && user.roles.length > 0) {
      query.$or.push({
        'target.type': 'role',
        'target.value': { $in: user.roles }
      });
    }

    let notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 50)
      .lean();

    // Ajouter le statut de lecture
    const readNotifications = await NotificationRead.find({
      userId: new mongoose.Types.ObjectId(userId),
      notificationId: { $in: notifications.map(n => n._id) }
    }).lean();

    const readSet = new Set(readNotifications.map(r => r.notificationId.toString()));

    let result: any[] = notifications.map(n => ({
      ...n,
      isRead: readSet.has(n._id.toString())
    }));

    if (options.unreadOnly) {
      result = result.filter(n => !n.isRead);
    }

    return result;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await NotificationRead.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        notificationId: new mongoose.Types.ObjectId(notificationId)
      },
      {
        userId: new mongoose.Types.ObjectId(userId),
        notificationId: new mongoose.Types.ObjectId(notificationId),
        readAt: new Date()
      },
      { upsert: true }
    );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<number> {
    const notifications = await this.getForUser(userId, { unreadOnly: true });

    if (notifications.length === 0) return 0;

    const operations = notifications.map(n => ({
      updateOne: {
        filter: {
          userId: new mongoose.Types.ObjectId(userId),
          notificationId: n._id
        },
        update: {
          userId: new mongoose.Types.ObjectId(userId),
          notificationId: n._id,
          readAt: new Date()
        },
        upsert: true
      }
    }));

    await NotificationRead.bulkWrite(operations);
    return notifications.length;
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getForUser(userId, { unreadOnly: true });
    return notifications.length;
  }

  /**
   * Supprimer une notification (admin)
   */
  async delete(notificationId: string): Promise<boolean> {
    const result = await Notification.findByIdAndDelete(notificationId);
    if (result) {
      // Supprimer aussi les statuts de lecture
      await NotificationRead.deleteMany({ notificationId: new mongoose.Types.ObjectId(notificationId) });
      return true;
    }
    return false;
  }

  /**
   * Lister toutes les notifications (admin)
   */
  async list(options: { limit?: number; offset?: number; type?: NotificationType } = {}): Promise<{ notifications: any[]; total: number }> {
    const query: any = {};
    if (options.type) {
      query.type = options.type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(options.offset || 0)
        .limit(options.limit || 50)
        .populate('createdBy', 'email firstName lastName')
        .lean(),
      Notification.countDocuments(query)
    ]);

    return { notifications, total };
  }

  /**
   * Créer une notification système
   */
  async createSystemNotification(
    title: string,
    message: string,
    type: NotificationType = 'info'
  ): Promise<INotification> {
    return this.create({
      type,
      title,
      message,
      target: { type: 'all' }
    });
  }

  /**
   * Notifier un utilisateur spécifique
   */
  async notifyUser(
    userId: string,
    title: string,
    message: string,
    options: { type?: NotificationType; link?: string } = {}
  ): Promise<INotification> {
    return this.create({
      type: options.type || 'info',
      title,
      message,
      target: { type: 'user', value: userId },
      link: options.link
    });
  }

  /**
   * Notifier tous les utilisateurs avec un rôle
   */
  async notifyRole(
    role: string,
    title: string,
    message: string,
    options: { type?: NotificationType; link?: string } = {}
  ): Promise<INotification> {
    return this.create({
      type: options.type || 'info',
      title,
      message,
      target: { type: 'role', value: role },
      link: options.link
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

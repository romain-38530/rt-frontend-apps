/**
 * Hook React pour gérer les notifications
 * S'intègre avec le WebSocket pour les notifications temps réel
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsApi } from '../api-client';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  orderId?: string;
  actionUrl?: string;
}

export interface UseNotificationsOptions {
  autoFetch?: boolean;
  enableWebSocket?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoFetch = true, enableWebSocket = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subscribe, isConnected } = useWebSocket();

  // Charger les notifications depuis l'API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await notificationsApi.get<Notification[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsApi.put(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.put('/notifications/read-all');

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsApi.delete(`/notifications/${notificationId}`);

      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Ajouter une notification localement (pour WebSocket)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Auto-fetch au montage
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  // WebSocket subscription pour les nouvelles notifications
  useEffect(() => {
    if (!enableWebSocket || !isConnected) return;

    const unsubscribe = subscribe('notification', (data) => {
      const newNotification: Notification = {
        id: data.data?.id || `notif-${Date.now()}`,
        type: data.type as any,
        title: data.type.charAt(0).toUpperCase() + data.type.slice(1),
        message: data.message,
        timestamp: new Date().toISOString(),
        read: false,
        data: data.data,
      };

      addNotification(newNotification);
    });

    // Écouter les événements de commandes pour créer des notifications
    const unsubscribeOrderCreated = subscribe('order.created', (data) => {
      addNotification({
        id: `order-created-${data.orderId}`,
        type: 'success',
        title: 'Nouvelle commande',
        message: `La commande #${data.orderId} a été créée`,
        timestamp: new Date().toISOString(),
        read: false,
        orderId: data.orderId,
        actionUrl: `/orders/${data.orderId}`,
      });
    });

    const unsubscribeCarrierAccepted = subscribe('carrier.accepted', (data) => {
      addNotification({
        id: `carrier-accepted-${data.orderId}`,
        type: 'success',
        title: 'Transporteur accepté',
        message: `Le transporteur a accepté la commande #${data.orderId}`,
        timestamp: new Date().toISOString(),
        read: false,
        orderId: data.orderId,
        actionUrl: `/orders/${data.orderId}`,
      });
    });

    const unsubscribeCarrierRefused = subscribe('carrier.refused', (data) => {
      addNotification({
        id: `carrier-refused-${data.orderId}`,
        type: 'warning',
        title: 'Transporteur refusé',
        message: `Le transporteur a refusé la commande #${data.orderId}${
          data.reason ? `: ${data.reason}` : ''
        }`,
        timestamp: new Date().toISOString(),
        read: false,
        orderId: data.orderId,
        actionUrl: `/orders/${data.orderId}`,
      });
    });

    const unsubscribeOrderDelivered = subscribe('order.delivered', (data) => {
      addNotification({
        id: `order-delivered-${data.orderId}`,
        type: 'success',
        title: 'Commande livrée',
        message: `La commande #${data.orderId} a été livrée`,
        timestamp: new Date().toISOString(),
        read: false,
        orderId: data.orderId,
        actionUrl: `/orders/${data.orderId}`,
      });
    });

    return () => {
      unsubscribe();
      unsubscribeOrderCreated();
      unsubscribeCarrierAccepted();
      unsubscribeCarrierRefused();
      unsubscribeOrderDelivered();
    };
  }, [enableWebSocket, isConnected, subscribe, addNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}

export default useNotifications;

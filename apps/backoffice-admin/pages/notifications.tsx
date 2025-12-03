import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, CheckCheck } from 'lucide-react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://d2i50a1vlg138w.cloudfront.net';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Nouvelle organisation', message: 'Acme Corp a cree un compte et attend validation', type: 'info', read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: '2', title: 'Mise a jour deployee', message: 'Nouvelle version v2.3.1 deployee avec succes sur tous les environnements', type: 'success', read: false, createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: '3', title: 'Alerte service', message: 'Le service api-orders presente des latences elevees', type: 'warning', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
    { id: '4', title: 'Erreur de paiement', message: 'Echec du paiement pour l\'organisation XYZ Transport', type: 'error', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString() },
    { id: '5', title: 'Nouvelle demande de support', message: 'Un utilisateur a soumis une demande de support technique', type: 'info', read: true, createdAt: new Date(Date.now() - 48 * 60 * 60000).toISOString() },
  ]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'A l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="text-primary-500" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              filter === 'unread' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            {filter === 'all' ? 'Toutes' : 'Non lues'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <CheckCheck size={16} />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Aucune notification {filter === 'unread' ? 'non lue' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all ${
                notification.read ? 'bg-white border-gray-200' : 'bg-primary-50 border-primary-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getTypeStyles(notification.type)}`}>
                  {notification.type === 'info' && 'Info'}
                  {notification.type === 'success' && 'Succes'}
                  {notification.type === 'warning' && 'Alerte'}
                  {notification.type === 'error' && 'Erreur'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

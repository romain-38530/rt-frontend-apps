import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { notificationsApi } from '../lib/api';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getNotifColor = (type: 'info' | 'warning' | 'success' | 'error' | string): string => {
    switch(type) {
      case 'info': return '#667eea';
      case 'warning': return '#FFA500';
      case 'success': return '#00D084';
      case 'error': return '#FF4444';
      default: return '#666';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.list();
      // Backend returns { success: true, data: [...], pagination: {...}, unreadCount: N }
      if (response.success && response.data) {
        // Map backend notification format to frontend format
        const mapped = response.data.map((n: any) => ({
          id: n._id || n.id,
          type: mapNotificationType(n.type),
          message: n.message || n.title,
          createdAt: n.createdAt,
          read: n.read
        }));
        setNotifications(mapped);
      } else if (response.notifications) {
        setNotifications(response.notifications);
      } else if (Array.isArray(response)) {
        setNotifications(response);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Impossible de charger les notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Map backend notification types to frontend display types
  const mapNotificationType = (type: string): 'info' | 'warning' | 'success' | 'error' => {
    const typeMap: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
      'order_created': 'info',
      'order_updated': 'info',
      'order_cancelled': 'error',
      'carrier_accepted': 'success',
      'carrier_refused': 'error',
      'carrier_timeout': 'warning',
      'tracking_update': 'info',
      'eta_update': 'info',
      'geofence_alert': 'warning',
      'rdv_proposed': 'info',
      'rdv_confirmed': 'success',
      'rdv_cancelled': 'warning',
      'document_uploaded': 'info',
      'document_validated': 'success',
      'incident_reported': 'error',
      'delay_reported': 'warning',
      'score_updated': 'info',
      'system': 'info',
      'other': 'info'
    };
    return typeMap[type] || 'info';
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    fetchNotifications();
  }, [mounted]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Head>
        <title>Notifications - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}>
              &#8592; Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>&#128276;</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '12px',
                    background: '#FF4444',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '14px'
                  }}>
                    {unreadCount} non lues
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'rgba(0,208,132,0.2)',
                  border: '1px solid rgba(0,208,132,0.5)',
                  color: '#00D084',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Tout marquer comme lu
              </button>
            )}
            <div style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              &#127981; Industry
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#8987;</div>
              <p>Chargement des notifications...</p>
            </div>
          ) : error && notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
              <p>{error}</p>
              <button
                onClick={fetchNotifications}
                style={{
                  marginTop: '16px',
                  background: '#667eea',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reessayer
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128173;</div>
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    style={{
                      background: notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      cursor: notif.read ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: notif.read ? 'transparent' : getNotifColor(notif.type),
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{notif.message}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>{formatTime(notif.createdAt)}</div>
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      background: `${getNotifColor(notif.type)}30`,
                      color: getNotifColor(notif.type),
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {notif.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

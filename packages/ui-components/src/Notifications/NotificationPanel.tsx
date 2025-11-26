/**
 * Panneau de notifications avec dropdown
 * Affiche la liste des notifications avec actions
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  actionUrl?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const TYPE_ICONS: Record<Notification['type'], { icon: string; color: string }> = {
  info: { icon: 'ℹ️', color: '#3b82f6' },
  success: { icon: '✅', color: '#10b981' },
  warning: { icon: '⚠️', color: '#f59e0b' },
  error: { icon: '❌', color: '#ef4444' },
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(unreadCount);

  // Animer la cloche quand le count augmente
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Fermer le panel en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Il y a quelques secondes';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'white',
          transition: 'all 0.2s',
          transform: isRinging ? 'rotate(10deg)' : 'rotate(0deg)',
        }}
        aria-label={`Notifications (${unreadCount} non lues)`}
      >
        <svg
          style={{ width: '24px', height: '24px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '10px',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '400px',
            maxHeight: '600px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Notifications</h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
                title="Actualiser"
              >
                🔄
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Aucune notification
                </div>
                <div style={{ fontSize: '14px' }}>Vous êtes à jour !</div>
              </div>
            ) : (
              notifications.map((notification) => {
                const typeInfo = TYPE_ICONS[notification.type];
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: notification.actionUrl ? 'pointer' : 'default',
                      background: notification.read ? 'white' : '#f0f9ff',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (notification.actionUrl) {
                        e.currentTarget.style.background = notification.read ? '#f9fafb' : '#e0f2fe';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.read ? 'white' : '#f0f9ff';
                    }}
                  >
                    {!notification.read && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: typeInfo.color,
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginLeft: !notification.read ? '12px' : '0' }}>
                      <div style={{ fontSize: '20px', flexShrink: 0 }}>{typeInfo.icon}</div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '4px',
                          }}
                        >
                          {notification.title}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            marginBottom: '8px',
                            lineHeight: '1.4',
                          }}
                        >
                          {notification.message}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {formatTimeAgo(notification.timestamp)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                        style={{
                          padding: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '18px',
                          lineHeight: '1',
                          flexShrink: 0,
                        }}
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

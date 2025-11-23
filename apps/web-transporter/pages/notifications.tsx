import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL;

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', message: 'Nouvelle commande CMD-004 reçue', time: 'Il y a 5 min', read: false },
    { id: 2, type: 'warning', message: 'Retard prévu sur livraison TRK-002', time: 'Il y a 15 min', read: false },
    { id: 3, type: 'success', message: 'Livraison TRK-003 complétée', time: 'Il y a 1h', read: true },
  ]);

  const getNotifColor = (type) => {
    switch(type) {
      case 'info': return '#667eea';
      case 'warning': return '#FFA500';
      case 'success': return '#00D084';
      case 'error': return '#FF4444';
      default: return '#666';
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Notifications - Transporter | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80) center/cover',
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🔔</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Notifications</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            🚚 Transporter
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

            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{
                  background: notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: notif.read ? 'transparent' : getNotifColor(notif.type)
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{notif.message}</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}

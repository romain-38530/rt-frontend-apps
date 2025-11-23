import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function PlanningPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_PLANNING_API_URL;

  const [events, setEvents] = useState([
    { time: '08:00', title: 'Livraison Paris Nord', type: 'delivery' },
    { time: '10:30', title: 'Collecte Ent

repôt A', type: 'pickup' },
    { time: '14:00', title: 'Maintenance véhicule', type: 'maintenance' },
  ]);

  const getEventColor = (type) => {
    switch(type) {
      case 'delivery': return '#00D084';
      case 'pickup': return '#667eea';
      case 'maintenance': return '#FFA500';
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
        <title>Planning & Itinéraires - Logistician | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80) center/cover',
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
              <span style={{ fontSize: '32px' }}>📅</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Planning & Itinéraires</h1>
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
            📊 Logistician
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

            <div style={{ display: 'grid', gap: '16px' }}>
              {events.map((event, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    width: '80px',
                    textAlign: 'center'
                  }}>{event.time}</div>
                  <div style={{
                    width: '4px',
                    height: '60px',
                    background: getEventColor(event.type),
                    borderRadius: '2px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{
                      fontSize: '12px',
                      opacity: 0.7,
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>{event.type}</div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}

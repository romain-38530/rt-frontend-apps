import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function OrdersPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_ORDERS_API_URL;

  const [orders, setOrders] = useState([
    { id: 'CMD-001', client: 'Client A', statut: 'En cours', date: '2025-11-20', montant: '1 250 €' },
    { id: 'CMD-002', client: 'Client B', statut: 'Livrée', date: '2025-11-19', montant: '3 400 €' },
    { id: 'CMD-003', client: 'Client C', statut: 'En préparation', date: '2025-11-18', montant: '750 €' },
  ]);
  const [filter, setFilter] = useState('all');

  const getStatusColor = (status) => {
    switch(status) {
      case 'En cours': return '#FFA500';
      case 'Livrée': return '#00D084';
      case 'En préparation': return '#667eea';
      default: return '#666';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.statut === filter);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Gestion des commandes - Industry | SYMPHONI.A</title>
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📦</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Gestion des commandes</h1>
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
            🏭 Industry
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

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {['all', 'En cours', 'Livrée', 'En préparation'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    background: filter === f ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: filter === f ? '700' : '600'
                  }}
                >
                  {f === 'all' ? 'Toutes' : f}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredOrders.map(order => (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Référence</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{order.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7', marginBottom: '4px' }}>Client</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{order.client}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7', marginBottom: '4px' }}>Statut</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: getStatusColor(order.statut),
                      padding: '4px 12px',
                      background: `${getStatusColor(order.statut)}22`,
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>{order.statut}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7', marginBottom: '4px' }}>Montant</div>
                    <div style={{ fontSize: '18px', fontWeight: '800' }}>{order.montant}</div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}

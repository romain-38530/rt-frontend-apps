import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_ORDERS_API_URL;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleAction = async () => {
    setLoading(true);
    try {
      alert(`Service Gestion des commandes en cours d'implémentation...\n\nAPI: ${apiUrl}`);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Gestion des commandes - Logistician | SYMPHONI.A</title>
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
                fontWeight: '600'
              }}
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
            background: 'rgba(A8E6CF, 0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            📊 Logistician
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '60px 40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>📦</div>
            <h2 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: '800' }}>
              Gestion des commandes
            </h2>
            <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>
              Service connecté à l'API backend
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '32px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              API: {apiUrl || 'Non configurée'}
            </div>

            <button
              onClick={handleAction}
              disabled={loading}
              style={{
                padding: '16px 48px',
                background: loading ? '#666' : 'linear-gradient(135deg, #A8E6CF 0%, #667eea 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {loading ? 'Chargement...' : 'Lancer le service'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

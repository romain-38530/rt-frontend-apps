import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { palettesApi } from '../lib/api';

interface Palette {
  id: string;
  type: string;
  qty: number;
  location: string;
  status: string;
}

export default function PalettesPage() {
  const router = useRouter();
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPalettes = async () => {
    try {
      setLoading(true);
      const data = await palettesApi.getTransactions();
      if (data.palettes) {
        setPalettes(data.palettes);
      } else if (Array.isArray(data)) {
        setPalettes(data);
      }
    } catch (err) {
      console.error('Error fetching palettes:', err);
      // Fallback mock data
      setPalettes([
        { id: 'PAL-EUR-001', type: 'Europe', qty: 150, location: 'Entrepôt A', status: 'Disponible' },
        { id: 'PAL-EUR-002', type: 'Europe', qty: 75, location: 'En transit', status: 'En mouvement' },
        { id: 'PAL-US-001', type: 'Américaine', qty: 50, location: 'Entrepôt B', status: 'Disponible' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchPalettes();
  }, []);

  return (
    <>
      <Head>
        <title>Gestion Palettes - Supplier | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80) center/cover',
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
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🏗️</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Gestion Palettes</h1>
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
            🏢 Supplier
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
              {palettes.map(pal => (
                <div key={pal.id} style={{
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
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{pal.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Type</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{pal.type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Quantité</div>
                    <div style={{ fontSize: '20px', fontWeight: '800' }}>{pal.qty}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Statut</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: pal.status === 'Disponible' ? '#00D084' : '#FFA500'
                    }}>{pal.status}</div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}

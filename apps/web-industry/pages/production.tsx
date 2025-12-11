import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { kpiApi } from '../lib/api';

interface ProductionLine {
  id: string;
  ligne: string;
  produit: string;
  objectif: number;
  realise: number;
  taux: number;
}

export default function ProductionPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [production, setProduction] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const data = await kpiApi.getMetrics('production');
      if (data.lines) {
        setProduction(data.lines);
      } else if (Array.isArray(data)) {
        setProduction(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching production data:', err);
      setError('Impossible de charger les donnees de production');
      // Fallback data
      setProduction([
        { id: '1', ligne: 'Ligne A', produit: 'Produit X', objectif: 1000, realise: 850, taux: 85 },
        { id: '2', ligne: 'Ligne B', produit: 'Produit Y', objectif: 500, realise: 520, taux: 104 },
        { id: '3', ligne: 'Ligne C', produit: 'Produit Z', objectif: 750, realise: 680, taux: 91 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    // Load data
  }, [mounted]);

  const getTauxColor = (taux: number): string => {
    if (taux >= 100) return '#00D084';
    if (taux >= 80) return '#FFA500';
    return '#FF4444';
  };

  return (
    <>
      <Head>
        <title>Production & Planning - Industry | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>&#127981;</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Production & Planning</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={fetchProduction}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              &#8635; Actualiser
            </button>
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
              <p>Chargement des donnees...</p>
            </div>
          ) : error && production.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
              <p>{error}</p>
              <button
                onClick={fetchProduction}
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
            <div style={{ display: 'grid', gap: '16px' }}>
              {production.map((ligne) => (
                <div key={ligne.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{ligne.ligne}</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>{ligne.produit}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{ligne.objectif.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Objectif</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: getTauxColor(ligne.taux) }}>{ligne.realise.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Realise</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: getTauxColor(ligne.taux) }}>{ligne.taux}%</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Taux</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

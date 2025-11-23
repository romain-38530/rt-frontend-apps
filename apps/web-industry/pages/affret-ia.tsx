import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function AffretiaPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_AFFRET_IA_API_URL;

  const [optimization, setOptimization] = useState({
    routes: 45,
    savings: '€ 12 500',
    co2Reduction: '2.3 tonnes',
    efficiency: '+18%'
  });
  const [suggestions, setSuggestions] = useState([
    'Regrouper les livraisons Paris Nord et Paris Sud',
    'Optimiser le chargement du véhicule V-042',
    'Utiliser un itinéraire alternatif pour éviter les embouteillages'
  ]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Affret.IA - Industry | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>🧠</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Affret.IA</h1>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{optimization.routes}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Routes optimisées</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#00D084' }}>{optimization.savings}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Économies réalisées</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#00D084' }}>{optimization.co2Reduction}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>CO₂ évité</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#667eea' }}>{optimization.efficiency}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Efficacité améliorée</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>💡 Suggestions d'optimisation</div>
              {suggestions.map((sug, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '15px'
                }}>
                  {sug}
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}

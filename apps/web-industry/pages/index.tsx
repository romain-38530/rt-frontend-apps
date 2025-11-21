import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, logout } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    setUser(getUser());
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Industry Portal - RT Technologie</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header avec bouton de déconnexion */}
        <div style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Connecté en tant que: <strong>{user?.email}</strong>
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Se déconnecter
          </button>
        </div>

        {/* Contenu principal */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          padding: '20px'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
            🏭 Industry Portal
          </h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.9, textAlign: 'center' }}>
            RT Technologie - Portail Industrie
          </p>
          <p style={{ marginTop: '2rem', opacity: 0.7, textAlign: 'center', maxWidth: '600px' }}>
            Vigilance, planification, suivi, e-CMR et Affret.IA
          </p>

          {/* Section de fonctionnalités */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '60px',
            maxWidth: '900px',
            width: '100%'
          }}>
            {[
              { icon: '📊', title: 'Tableau de bord', desc: 'Vue d\'ensemble des opérations' },
              { icon: '🚚', title: 'Transports', desc: 'Gestion des livraisons' },
              { icon: '📦', title: 'Palettes', desc: 'Suivi des palettes' },
              { icon: '⚠️', title: 'Vigilance', desc: 'Alertes et notifications' }
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

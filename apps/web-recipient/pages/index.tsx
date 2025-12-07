import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, logout } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());

    // Charger l'abonnement
    const sub = localStorage.getItem('userSubscription');
    if (sub) {
      setSubscription(JSON.parse(sub));
    } else {
      // Abonnement gratuit par défaut
      const defaultSub = { tier: 'free', status: 'active' };
      setSubscription(defaultSub);
      localStorage.setItem('userSubscription', JSON.stringify(defaultSub));
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'url(https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white'
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
        <p style={{ position: 'relative', zIndex: 1 }}>Chargement...</p>
      </div>
    );
  }

  const features = [
    {
      icon: '📦',
      title: 'Mes commandes',
      desc: 'Suivez toutes vos commandes en temps réel',
      locked: false,
      route: '/orders'
    },
    {
      icon: '📍',
      title: 'Suivi livraisons',
      desc: 'Traçabilité GPS de vos livraisons en cours',
      locked: false,
      route: '/tracking'
    },
    {
      icon: '📄',
      title: 'e-CMR Digital',
      desc: 'Consultez vos lettres de voiture électroniques',
      locked: false,
      route: '/ecmr'
    },
    {
      icon: '🔔',
      title: 'Notifications',
      desc: 'Alertes en temps réel sur vos livraisons',
      locked: false,
      route: '/notifications'
    },
    {
      icon: '🤖',
      title: 'Assistant Chatbot',
      desc: 'Support IA 24/7 pour vos questions',
      locked: false,
      route: '/chatbot'
    }
  ];

  return (
    <>
      <Head>
        <title>SYMPHONI.A - Recipient Portal</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Dark overlay */}
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
          position: 'relative',
          zIndex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>SYMPHONI.A</h1>
              <p style={{ fontSize: '12px', fontStyle: 'italic', margin: 0, opacity: 0.9 }}>L'IA qui orchestre vos flux transport.</p>
            </div>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              📦 Recipient
            </div>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              {subscription?.tier === 'free' ? 'Gratuit' :
               subscription?.tier === 'pro' ? 'Pro' : 'Enterprise'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              {user?.email}
            </p>
            <button
              onClick={() => router.push('/subscription')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.9)',
                color: '#667eea',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}>
              Abonnement
            </button>
            <button
              onClick={logout}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '60px 40px',
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Welcome Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <h2 style={{
              fontSize: '48px',
              marginBottom: '16px',
              fontWeight: '800',
              letterSpacing: '-1px'
            }}>
              Bienvenue sur votre portail
            </h2>
            <p style={{
              fontSize: '20px',
              opacity: 0.9,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Suivez et gérez vos réceptions en toute simplicité
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {features.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                opacity: item.locked ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!item.locked) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.locked) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              >
                {item.locked && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    fontSize: '24px'
                  }}>
                    🔒
                  </div>
                )}
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '700' }}>
                  {item.title}
                </h3>
                <p style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                  {item.desc}
                </p>
                {item.locked ? (
                  <button
                    onClick={() => router.push('/subscription')}
                    style={{
                      marginTop: '8px',
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#4A90E2',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      width: '100%',
                      transition: 'all 0.2s ease'
                    }}>
                    🔓 Débloquer
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(item.route)}
                    style={{
                      marginTop: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      width: '100%',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}>
                    ▶ Accéder
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '40px'
          }}>
            {[
              { label: 'Livraisons ce mois', value: subscription?.tier === 'free' ? '4/10' : '67' },
              { label: 'En attente', value: '8' },
              { label: 'Réceptionnées', value: '234' },
              { label: 'Taux de conformité', value: '99%' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

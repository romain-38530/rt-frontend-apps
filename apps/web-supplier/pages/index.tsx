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
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  const features = [
    {
      icon: '📦',
      title: 'Gestion des commandes',
      desc: 'Suivez et gérez toutes vos commandes en temps réel',
      locked: subscription?.tier === 'free'
    },
    {
      icon: '🚚',
      title: 'Suivi des livraisons',
      desc: 'Traçabilité complète de vos expéditions',
      locked: false
    },
    {
      icon: '📊',
      title: 'Catalogue produits',
      desc: 'Gérez votre inventaire et vos prix',
      locked: subscription?.tier === 'free'
    },
    {
      icon: '💰',
      title: 'Facturation automatique',
      desc: 'Automatisez vos processus de facturation',
      locked: subscription?.tier !== 'enterprise'
    }
  ];

  return (
    <>
      <Head>
        <title>Supplier Portal - RT Technologie</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              margin: 0
            }}>
              🏪 Supplier Portal
            </h1>
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
                color: '#f093fb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            >
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
          margin: '0 auto'
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
              Gérez vos approvisionnements et optimisez votre chaîne logistique
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
                transition: 'all 0.3s',
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
                <p style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
                  {item.desc}
                </p>
                {item.locked && (
                  <button
                    onClick={() => router.push('/subscription')}
                    style={{
                      marginTop: '16px',
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#f093fb',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    Débloquer
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
              { label: 'Commandes ce mois', value: subscription?.tier === 'free' ? '3/10' : '47' },
              { label: 'En cours', value: '12' },
              { label: 'Livrées', value: '156' },
              { label: 'Taux de satisfaction', value: '98%' }
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

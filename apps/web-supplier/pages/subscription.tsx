import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, logout } from '../lib/auth';

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    features: [
      'Accès limité',
      '10 commandes/mois',
      'Support email',
      '1 utilisateur'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    features: [
      'Fonctionnalités complètes',
      'Commandes illimitées',
      'Support prioritaire',
      '10 utilisateurs',
      'Intégrations API',
      'Rapports personnalisés'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    features: [
      'Tout Pro inclus',
      'Utilisateurs illimités',
      'Support 24/7',
      'Gestionnaire dédié',
      'SLA garanti',
      'Formation sur site'
    ]
  }
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());

    // Charger l'abonnement actuel
    const subscription = localStorage.getItem('userSubscription');
    if (subscription) {
      const { tier } = JSON.parse(subscription);
      setCurrentTier(tier);
    }
    setLoading(false);
  }, [router]);

  const handleSelectPlan = (planId: string) => {
    const subscription = {
      tier: planId,
      startDate: new Date().toISOString(),
      status: 'active',
      autoRenew: true
    };
    localStorage.setItem('userSubscription', JSON.stringify(subscription));
    setCurrentTier(planId);
    alert(`Abonnement ${planId} activé avec succès !`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80) center/cover',
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

  return (
    <>
      <Head>
        <title>Abonnements - Supplier Portal</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80) center/cover',
        position: 'relative',
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
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Supplier Portal
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Retour au portail
            </button>
            <button onClick={logout} style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '60px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Choisissez votre abonnement
              </h2>
              <p style={{ fontSize: '20px', color: '#6b7280' }}>
                Des plans flexibles pour tous vos besoins
              </p>
              <div style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'white',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}>
                <strong>Plan actuel :</strong>{' '}
                <span style={{
                  background: currentTier === 'pro' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                             currentTier === 'enterprise' ? 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' :
                             'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700',
                  fontSize: '18px'
                }}>
                  {plans.find(p => p.id === currentTier)?.name}
                </span>
              </div>
            </div>

            {/* Plans Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              marginBottom: '40px'
            }}>
              {plans.map((plan) => {
                const isCurrentPlan = currentTier === plan.id;

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: 'white',
                      borderRadius: '24px',
                      padding: '40px',
                      boxShadow: plan.popular ? '0 20px 60px rgba(240, 147, 251, 0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                      border: plan.popular ? '3px solid #f093fb' : '1px solid #e5e7eb',
                      position: 'relative',
                      transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: plan.gradient,
                        color: 'white',
                        padding: '6px 20px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        Populaire
                      </div>
                    )}

                    <h3 style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '12px'
                    }}>
                      {plan.name}
                    </h3>

                    <div style={{
                      fontSize: '48px',
                      fontWeight: '800',
                      background: plan.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '24px'
                    }}>
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                      {plan.price > 0 && (
                        <span style={{ fontSize: '18px', color: '#6b7280', marginLeft: '8px' }}>
                          /mois
                        </span>
                      )}
                    </div>

                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 32px 0'
                    }}>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '12px',
                          color: '#374151',
                          fontSize: '15px'
                        }}>
                          <span style={{ fontSize: '20px', color: '#10b981' }}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: isCurrentPlan ? '#e5e7eb' : plan.gradient,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentPlan) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentPlan) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, logout, getAuthToken } from '../lib/auth';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rt-api.symphonia-controltower.com';
const STRIPE_API_URL = process.env.NEXT_PUBLIC_STRIPE_API_URL || 'http://rt-subscriptions-api-prod-v2.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe';

// Plans disponibles pour les transporteurs
const transporterPlans = [
  {
    id: 'transporteur_free',
    name: 'Gratuit',
    price: 0,
    priceId: null,
    description: 'Pour demarrer',
    features: [
      '10 transports/mois',
      'Acces bourse de fret limite',
      'Support email',
      '1 utilisateur'
    ],
    limitations: [
      'Pas d\'AFFRET.IA',
      'Pas de KPI avances',
      'Pas de priorite matching'
    ]
  },
  {
    id: 'transporteur_premium',
    name: 'Premium',
    price: 299,
    priceId: 'price_transporteur_premium_monthly',
    description: 'Pour les flottes en croissance',
    popular: true,
    features: [
      'Transports illimites',
      'Acces complet bourse de fret',
      'AFFRET.IA inclus',
      'KPI et analytics',
      'Support prioritaire',
      '5 utilisateurs',
      'Matching prioritaire',
      'Notifications temps reel'
    ]
  },
  {
    id: 'transporteur_pro',
    name: 'Pro',
    price: 499,
    priceId: 'price_transporteur_pro_monthly',
    description: 'Pour les grandes flottes',
    features: [
      'Tout Premium inclus',
      'Utilisateurs illimites',
      'API et integrations TMS',
      'e-CMR inclus',
      'Geofencing avance',
      'Support 24/7',
      'Gestionnaire dedie',
      'Formation personnalisee'
    ]
  }
];

// Options additionnelles
const additionalOptions = [
  { id: 'eCmr', name: 'e-CMR', price: 49, description: 'Lettre de voiture electronique' },
  { id: 'geofencing', name: 'Geofencing', price: 29, description: 'Alertes zones geographiques' },
  { id: 'ocrDocuments', name: 'OCR Documents', price: 39, description: 'Scan et extraction automatique' },
  { id: 'trackingPremium', name: 'Tracking Premium', price: 4, unit: 'vehicule', description: 'GPS haute precision' },
  { id: 'webhooks', name: 'Webhooks', price: 59, description: 'Notifications temps reel API' }
];

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('transporteur_free');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = getUser();
    setUser(userData);

    // Charger l'abonnement actuel
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${STRIPE_API_URL}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.subscriptions?.length > 0) {
          const activeSubscription = data.data.subscriptions.find(
            (s: any) => s.status === 'active' || s.status === 'trialing'
          );
          if (activeSubscription) {
            setCurrentSubscription(activeSubscription);
            // Determiner le plan actuel depuis les metadata
            const planType = activeSubscription.metadata?.subscriptionType || 'transporteur_premium';
            setCurrentPlan(planType);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setError(null);
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const calculateTotal = () => {
    const plan = transporterPlans.find(p => p.id === selectedPlan);
    let total = plan?.price || 0;

    // Ajouter les options selectionnees
    Object.entries(selectedOptions).forEach(([optionId, isSelected]) => {
      if (isSelected) {
        const option = additionalOptions.find(o => o.id === optionId);
        if (option) {
          total += option.price;
        }
      }
    });

    return total;
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      setError('Veuillez selectionner un plan');
      return;
    }

    const plan = transporterPlans.find(p => p.id === selectedPlan);
    if (!plan || !plan.priceId) {
      setError('Plan invalide');
      return;
    }

    setUpgrading(true);
    setError(null);

    try {
      const token = getAuthToken();

      // Creer une session de checkout Stripe
      const response = await fetch(`${STRIPE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          successUrl: '/upgrade/success',
          cancelUrl: '/upgrade?cancelled=true',
          metadata: {
            planId: plan.id,
            planName: plan.name,
            selectedOptions: Object.keys(selectedOptions).filter(k => selectedOptions[k]).join(',')
          }
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.data.url;
      } else {
        setError(data.error?.message || 'Erreur lors de la creation de la session de paiement');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>Chargement...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Upgrade - SYMPHONI.A Transporteur</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px'
              }}
            >
              &#8592;
            </button>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SYMPHONI.A
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>
              {user?.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Deconnexion
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '40px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Passez au niveau superieur
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              Debloquez toutes les fonctionnalites de SYMPHONI.A et developpez votre activite de transport
            </p>

            {/* Current Plan Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '12px 24px',
              borderRadius: '50px',
              marginTop: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <span style={{ color: '#64748b' }}>Plan actuel:</span>
              <span style={{
                fontWeight: '700',
                color: currentPlan === 'transporteur_free' ? '#64748b' : '#f97316'
              }}>
                {transporterPlans.find(p => p.id === currentPlan)?.name || 'Gratuit'}
              </span>
              {currentSubscription && (
                <span style={{
                  background: '#dcfce7',
                  color: '#16a34a',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Actif
                </span>
              )}
            </div>
          </div>

          {/* Cancelled Message */}
          {router.query.cancelled && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>&#9888;</span>
              <p style={{ margin: 0, color: '#dc2626' }}>
                Le paiement a ete annule. Vous pouvez reessayer quand vous le souhaitez.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '32px',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            {transporterPlans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const isSelected = plan.id === selectedPlan;
              const isDowngrade = plan.price < (transporterPlans.find(p => p.id === currentPlan)?.price || 0);

              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && !isDowngrade && handleSelectPlan(plan.id)}
                  style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: isSelected
                      ? '0 20px 40px rgba(249, 115, 22, 0.25)'
                      : plan.popular
                        ? '0 10px 30px rgba(0,0,0,0.1)'
                        : '0 4px 12px rgba(0,0,0,0.05)',
                    border: isSelected
                      ? '3px solid #f97316'
                      : plan.popular
                        ? '2px solid #fed7aa'
                        : '1px solid #e2e8f0',
                    position: 'relative',
                    cursor: isCurrentPlan || isDowngrade ? 'not-allowed' : 'pointer',
                    opacity: isDowngrade ? 0.6 : 1,
                    transform: isSelected ? 'scale(1.02)' : plan.popular ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '6px 20px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      Recommande
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#dcfce7',
                      color: '#16a34a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      Plan actuel
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px'
                  }}>
                    {plan.name}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '20px'
                  }}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: '24px' }}>
                    <span style={{
                      fontSize: '48px',
                      fontWeight: '800',
                      background: plan.price > 0
                        ? 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
                        : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ color: '#64748b', fontSize: '16px' }}>/mois HT</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        <span style={{ color: '#10b981', fontSize: '18px', lineHeight: '1' }}>&#10003;</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, idx) => (
                      <li key={`lim-${idx}`} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: '#9ca3af'
                      }}>
                        <span style={{ color: '#ef4444', fontSize: '18px', lineHeight: '1' }}>&#10007;</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  {!isCurrentPlan && !isDowngrade && (
                    <button
                      style={{
                        width: '100%',
                        marginTop: '24px',
                        padding: '14px',
                        background: isSelected
                          ? 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
                          : '#f1f5f9',
                        color: isSelected ? 'white' : '#475569',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSelected ? 'Selectionne' : 'Choisir ce plan'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Options Section */}
          {selectedPlan && selectedPlan !== 'transporteur_free' && (
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '24px'
              }}>
                Options supplementaires
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                {additionalOptions.map((option) => {
                  const isSelected = selectedOptions[option.id];
                  return (
                    <div
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #f97316' : '1px solid #e2e8f0',
                        background: isSelected ? '#fff7ed' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                            {option.name}
                          </h4>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                            {option.description}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#f97316' }}>
                            +{option.price}€
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                            /{option.unit || 'mois'}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        marginTop: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: isSelected ? 'none' : '2px solid #d1d5db',
                        background: isSelected ? '#f97316' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary & CTA */}
          {selectedPlan && selectedPlan !== 'transporteur_free' && (
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px'
            }}>
              <div>
                <p style={{ color: '#64748b', margin: '0 0 8px 0' }}>Total mensuel HT</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {calculateTotal()}€
                  </span>
                  <span style={{ color: '#64748b' }}>/mois HT</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                  soit {(calculateTotal() * 1.2).toFixed(2)}€ TTC
                </p>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                style={{
                  padding: '16px 48px',
                  background: upgrading
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  boxShadow: upgrading ? 'none' : '0 10px 30px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {upgrading ? 'Redirection vers Stripe...' : 'Passer a ce plan'}
              </button>
            </div>
          )}

          {/* Security Badge */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '14px'
          }}>
            <span>&#128274;</span>
            <span>Paiement securise par Stripe - Annulation possible a tout moment</span>
          </div>
        </main>
      </div>
    </>
  );
}

/**
 * Page Bourse Fret - Portail Transporter
 * Place de marché pour consulter et répondre aux offres de transport
 *
 * Gestion de l'anonymisation des noms de déposants selon l'abonnement:
 * - Utilisateurs gratuits/trial: noms anonymisés (ex: "Industriel #1234")
 * - Utilisateurs payants: noms complets visibles
 * - Après acceptation: nom visible pour tous
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser } from '../lib/auth';
import { affretIaApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

// Types d'abonnement
type SubscriptionPlan = 'trial' | 'free' | 'transporteur' | 'premium' | 'enterprise';

interface UserSubscription {
  plan: SubscriptionPlan;
  trialTransports?: number;
  trialExpiry?: string;
  status?: string;
}

interface BourseOffer {
  id: string;
  sessionId: string;
  orderId: string;
  industrialId?: string;
  industrialName?: string;
  isAccepted?: boolean; // Pour afficher le nom après acceptation
  pickup: {
    city: string;
    postalCode: string;
    country: string;
    date: string;
    window: { start: string; end: string };
  };
  delivery: {
    city: string;
    postalCode: string;
    country: string;
    date: string;
    window: { start: string; end: string };
  };
  goods: {
    type: string;
    weight: number;
    volume: number;
    pallets: number;
    dangerous: boolean;
    temperature: string;
  };
  estimatedPrice: number;
  currency: string;
  priceNegotiable: boolean;
  distance?: number;
  viewCount: number;
  responseCount: number;
  expiresAt: string;
  status: string;
}

// Fonction pour anonymiser le nom du déposant
const getDisplayName = (
  industrialName: string | undefined,
  industrialId: string | undefined,
  subscription: UserSubscription | null,
  isAccepted: boolean = false
): { name: string; isAnonymous: boolean } => {
  // Si pas de nom, retourner un placeholder
  if (!industrialName) {
    return { name: 'Expéditeur', isAnonymous: true };
  }

  // Si la commande est acceptée, toujours montrer le vrai nom
  if (isAccepted) {
    return { name: industrialName, isAnonymous: false };
  }

  // Si utilisateur a un abonnement payant, montrer le vrai nom
  const paidPlans: SubscriptionPlan[] = ['transporteur', 'premium', 'enterprise'];
  if (subscription && paidPlans.includes(subscription.plan)) {
    return { name: industrialName, isAnonymous: false };
  }

  // Pour utilisateurs gratuits/trial, anonymiser
  // Générer un ID anonyme basé sur l'industrialId pour consistance
  const anonymousId = industrialId
    ? industrialId.slice(-4).toUpperCase()
    : Math.random().toString(36).substring(2, 6).toUpperCase();

  return {
    name: `Industriel #${anonymousId}`,
    isAnonymous: true
  };
};

export default function BoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [offers, setOffers] = useState<BourseOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<BourseOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [filters, setFilters] = useState({
    pickupCity: '',
    deliveryCity: '',
    maxPrice: '',
    minWeight: '',
    maxWeight: '',
  });
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [proposalData, setProposalData] = useState({
    proposedPrice: '',
    message: '',
    pickupDate: '',
    deliveryDate: '',
  });

  // Charger les informations d'abonnement
  const loadSubscription = () => {
    try {
      const stored = localStorage.getItem('userSubscription');
      if (stored) {
        setUserSubscription(JSON.parse(stored));
      } else {
        // Par défaut, utilisateur en trial
        const user = getUser();
        if (user?.subscription) {
          setUserSubscription(user.subscription);
        } else {
          setUserSubscription({ plan: 'trial', trialTransports: 10 });
        }
      }
    } catch {
      setUserSubscription({ plan: 'trial', trialTransports: 10 });
    }
  };

  // Vérifier si l'utilisateur peut voir les vrais noms
  const canSeeRealNames = (): boolean => {
    if (!userSubscription) return false;
    const paidPlans: SubscriptionPlan[] = ['transporteur', 'premium', 'enterprise'];
    return paidPlans.includes(userSubscription.plan);
  };

  // Charger les offres
  const loadOffers = async () => {
    setIsLoading(true);
    try {
      // Appel API
      const data = await affretIaApi.getOffers({
        origin: filters.pickupCity || undefined,
        destination: filters.deliveryCity || undefined,
      });

      if (data.offers && Array.isArray(data.offers)) {
        let filtered = data.offers;
        if (filters.maxPrice) {
          filtered = filtered.filter((o: BourseOffer) => o.estimatedPrice <= Number(filters.maxPrice));
        }
        setOffers(filtered);
      } else if (Array.isArray(data)) {
        let filtered = data;
        if (filters.maxPrice) {
          filtered = filtered.filter((o: BourseOffer) => o.estimatedPrice <= Number(filters.maxPrice));
        }
        setOffers(filtered);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error loading offers from API:', err);
      // Fallback mock data
      const industrialNames = [
        'TOTAL Énergies Logistique',
        'Carrefour Supply Chain',
        'Danone Transport',
        'Saint-Gobain Distribution',
        'Michelin Logistics',
        'L\'Oréal Fret',
        'Peugeot Stellantis',
        'Airbus Freight',
        'Sanofi Pharma Transport',
        'Renault Distribution',
        'EDF Énergie',
        'Bouygues Materials'
      ];
      const mockOffers: BourseOffer[] = Array.from({ length: 12 }, (_, i) => ({
        id: `offer-${i + 1}`,
        sessionId: `session-${i + 1}`,
        orderId: `ORD-${Date.now()}-${i}`,
        industrialId: `IND-${String(i + 1).padStart(3, '0')}`,
        industrialName: industrialNames[i % industrialNames.length],
        pickup: {
          city: ['Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Toulouse', 'Nantes'][i % 6],
          postalCode: ['69000', '13000', '33000', '59000', '31000', '44000'][i % 6],
          country: 'FR',
          date: new Date(Date.now() + (2 + i) * 24 * 60 * 60 * 1000).toISOString(),
          window: { start: '08:00', end: '12:00' },
        },
        delivery: {
          city: ['Paris', 'Nice', 'Strasbourg', 'Rennes', 'Montpellier', 'Grenoble'][i % 6],
          postalCode: ['75001', '06000', '67000', '35000', '34000', '38000'][i % 6],
          country: 'FR',
          date: new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000).toISOString(),
          window: { start: '14:00', end: '18:00' },
        },
        goods: {
          type: ['pallet', 'bulk', 'container'][i % 3],
          weight: Math.floor(Math.random() * 20000) + 1000,
          volume: Math.floor(Math.random() * 80) + 5,
          pallets: Math.floor(Math.random() * 33) + 1,
          dangerous: i % 10 === 0,
          temperature: i % 5 === 0 ? 'refrigerated' : 'ambient',
        },
        estimatedPrice: Math.floor(Math.random() * 2000) + 400,
        currency: 'EUR',
        priceNegotiable: i % 3 !== 0,
        distance: Math.floor(Math.random() * 800) + 100,
        viewCount: Math.floor(Math.random() * 150),
        responseCount: Math.floor(Math.random() * 12),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      }));

      // Appliquer les filtres
      let filtered = mockOffers;
      if (filters.pickupCity) {
        filtered = filtered.filter(o =>
          o.pickup.city.toLowerCase().includes(filters.pickupCity.toLowerCase())
        );
      }
      if (filters.deliveryCity) {
        filtered = filtered.filter(o =>
          o.delivery.city.toLowerCase().includes(filters.deliveryCity.toLowerCase())
        );
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(o => o.estimatedPrice <= Number(filters.maxPrice));
      }

      setOffers(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Soumettre une proposition
  const handleSubmitProposal = async () => {
    if (!selectedOffer || !proposalData.proposedPrice) return;

    try {
      await affretIaApi.submitProposal(selectedOffer.id, {
        price: Number(proposalData.proposedPrice),
        availableDate: proposalData.pickupDate || new Date().toISOString(),
        message: proposalData.message,
      });

      toast.success('Proposition envoyée avec succès !');
      setShowProposalModal(false);
      setSelectedOffer(null);
      setProposalData({ proposedPrice: '', message: '', pickupDate: '', deliveryDate: '' });
    } catch (err) {
      console.error('Error submitting proposal:', err);
      toast.error('Erreur lors de l\'envoi de la proposition');
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadSubscription();
    loadOffers();
  }, []);

  useEffect(() => {
    loadOffers();
  }, [filters]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatWeight = (kg: number) => {
    return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;
  };

  return (
    <>
      <Head>
        <title>Bourse Fret - Transporter | SYMPHONI.A</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
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
              }}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🏪</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Bourse Fret AFFRET.IA
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              background: 'rgba(16,185,129,0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#10b981',
            }}>
              {offers.length} offres disponibles
            </span>
          </div>
        </div>

        {/* Filtres */}
        <div
          style={{
            padding: '20px 40px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ville départ"
              value={filters.pickupCity}
              onChange={(e) => setFilters({ ...filters, pickupCity: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px',
                width: '160px',
              }}
            />
            <input
              type="text"
              placeholder="Ville arrivée"
              value={filters.deliveryCity}
              onChange={(e) => setFilters({ ...filters, deliveryCity: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px',
                width: '160px',
              }}
            />
            <input
              type="number"
              placeholder="Prix max (€)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px',
                width: '140px',
              }}
            />
            <button
              onClick={() => setFilters({ pickupCity: '', deliveryCity: '', maxPrice: '', minWeight: '', maxWeight: '' })}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Liste des offres */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement des offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Aucune offre disponible</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '24px',
              }}
            >
              {offers.map((offer) => {
                const displayInfo = getDisplayName(
                  offer.industrialName,
                  offer.industrialId,
                  userSubscription,
                  offer.isAccepted
                );
                return (
                <div
                  key={offer.id}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedOffer(offer)}>
                  {/* Industriel (expéditeur) - Anonymisé pour utilisateurs gratuits */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🏭</span>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: displayInfo.isAnonymous ? 'rgba(255,255,255,0.7)' : '#667eea'
                        }}>
                          {displayInfo.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          Expéditeur
                        </div>
                      </div>
                    </div>
                    {displayInfo.isAnonymous && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUpgradeModal(true);
                        }}
                        style={{
                          background: 'rgba(102,126,234,0.2)',
                          border: '1px solid rgba(102,126,234,0.4)',
                          color: '#667eea',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        🔒 Voir le nom
                      </button>
                    )}
                  </div>

                  {/* Route */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{offer.pickup.city}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        {formatDate(offer.pickup.date)} • {offer.pickup.window.start}-{offer.pickup.window.end}
                      </div>
                    </div>
                    <div style={{ color: '#667eea', fontSize: '24px' }}>→</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{offer.delivery.city}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        {formatDate(offer.delivery.date)} • {offer.delivery.window.start}-{offer.delivery.window.end}
                      </div>
                    </div>
                  </div>

                  {/* Marchandise */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{
                      background: 'rgba(102,126,234,0.2)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {formatWeight(offer.goods.weight)}
                    </span>
                    <span style={{
                      background: 'rgba(102,126,234,0.2)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {offer.goods.pallets} palettes
                    </span>
                    <span style={{
                      background: 'rgba(102,126,234,0.2)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {offer.goods.volume} m³
                    </span>
                    {offer.goods.dangerous && (
                      <span style={{
                        background: 'rgba(239,68,68,0.2)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#ef4444',
                      }}>
                        ⚠️ ADR
                      </span>
                    )}
                    {offer.goods.temperature === 'refrigerated' && (
                      <span style={{
                        background: 'rgba(59,130,246,0.2)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#3b82f6',
                      }}>
                        ❄️ Frigo
                      </span>
                    )}
                  </div>

                  {/* Prix et actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
                        {offer.estimatedPrice} €
                      </div>
                      {offer.priceNegotiable && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          Prix négociable
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        👁 {offer.viewCount} • 💬 {offer.responseCount}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        {offer.distance} km
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Modal détail offre */}
        {selectedOffer && !showProposalModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setSelectedOffer(null)}
          >
            <div
              style={{
                background: '#1e293b',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
                {selectedOffer.pickup.city} → {selectedOffer.delivery.city}
              </h2>

              {/* Expéditeur - Anonymisé pour utilisateurs gratuits */}
              {(() => {
                const modalDisplayInfo = getDisplayName(
                  selectedOffer.industrialName,
                  selectedOffer.industrialId,
                  userSubscription,
                  selectedOffer.isAccepted
                );
                return (
                  <div style={{
                    background: modalDisplayInfo.isAnonymous ? 'rgba(255,255,255,0.08)' : 'rgba(102,126,234,0.15)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px' }}>🏭</span>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                          Expéditeur
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: modalDisplayInfo.isAnonymous ? 'rgba(255,255,255,0.7)' : '#667eea'
                        }}>
                          {modalDisplayInfo.name}
                        </div>
                      </div>
                    </div>
                    {modalDisplayInfo.isAnonymous && (
                      <div style={{
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.4)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>
                          🔒 Nom masqué
                        </div>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Passer en Premium
                        </button>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                          Visible après acceptation
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  Enlèvement
                </h3>
                <p style={{ fontSize: '16px' }}>
                  {selectedOffer.pickup.city} ({selectedOffer.pickup.postalCode})
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  {formatDate(selectedOffer.pickup.date)} • {selectedOffer.pickup.window.start} - {selectedOffer.pickup.window.end}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  Livraison
                </h3>
                <p style={{ fontSize: '16px' }}>
                  {selectedOffer.delivery.city} ({selectedOffer.delivery.postalCode})
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  {formatDate(selectedOffer.delivery.date)} • {selectedOffer.delivery.window.start} - {selectedOffer.delivery.window.end}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  Marchandise
                </h3>
                <p style={{ fontSize: '16px' }}>
                  {selectedOffer.goods.pallets} palettes • {formatWeight(selectedOffer.goods.weight)} • {selectedOffer.goods.volume} m³
                </p>
                {selectedOffer.goods.dangerous && (
                  <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
                    ⚠️ Transport ADR requis
                  </p>
                )}
                {selectedOffer.goods.temperature === 'refrigerated' && (
                  <p style={{ fontSize: '14px', color: '#3b82f6', marginTop: '4px' }}>
                    ❄️ Transport frigorifique
                  </p>
                )}
              </div>

              <div
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  Prix estimé
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>
                  {selectedOffer.estimatedPrice} €
                </div>
                {selectedOffer.priceNegotiable && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    Ce prix est négociable
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedOffer(null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
                <button
                  onClick={() => setShowProposalModal(true)}
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Faire une proposition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal proposition */}
        {showProposalModal && selectedOffer && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowProposalModal(false)}
          >
            <div
              style={{
                background: '#1e293b',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
                Votre proposition
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  Prix proposé (€) *
                </label>
                <input
                  type="number"
                  value={proposalData.proposedPrice}
                  onChange={(e) => setProposalData({ ...proposalData, proposedPrice: e.target.value })}
                  placeholder={`Prix estimé: ${selectedOffer.estimatedPrice} €`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  Message (optionnel)
                </label>
                <textarea
                  value={proposalData.message}
                  onChange={(e) => setProposalData({ ...proposalData, message: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowProposalModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitProposal}
                  disabled={!proposalData.proposedPrice}
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: proposalData.proposedPrice
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: proposalData.proposedPrice ? 'pointer' : 'not-allowed',
                  }}
                >
                  Envoyer la proposition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upgrade - Pour voir les vrais noms des déposants */}
        {showUpgradeModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
            }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '600px',
                width: '90%',
                border: '1px solid rgba(102,126,234,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '36px'
                }}>
                  🔓
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>
                  Débloquez les noms des expéditeurs
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
                  Avec un abonnement payant, accédez aux noms complets des industriels et établissez des relations commerciales directes.
                </p>
              </div>

              {/* Plans */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Transporteur</h3>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px',
                  }}>
                    200€<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>/mois</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', fontSize: '13px' }}>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ Noms expéditeurs visibles</li>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ Transports illimités</li>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ Aucune commission</li>
                    <li style={{ color: 'rgba(255,255,255,0.8)' }}>✓ Support dédié</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#f59e0b',
                    color: '#000',
                    padding: '4px 12px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700',
                  }}>
                    RECOMMANDÉ
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Premium</h3>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px',
                  }}>
                    699€<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>/mois</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', fontSize: '13px' }}>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ Tout Transporteur inclus</li>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ Planification avancée</li>
                    <li style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>✓ KPI & Analytics</li>
                    <li style={{ color: 'rgba(255,255,255,0.8)' }}>✓ Intégrations TMS</li>
                  </ul>
                </div>
              </div>

              {/* Info gratuit */}
              <div style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <strong style={{ color: '#10b981' }}>Alternative gratuite :</strong> Le nom de l'expéditeur sera révélé automatiquement lorsque votre proposition sera acceptée et que la commande apparaîtra dans vos affectations.
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Plus tard
                </button>
                <button
                  onClick={() => router.push('/subscription')}
                  style={{
                    flex: 2,
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Voir les abonnements
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

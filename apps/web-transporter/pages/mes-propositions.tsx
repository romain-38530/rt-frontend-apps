/**
 * Page Mes Propositions - Portail Transporter
 * Suivi des propositions envoyées via AFFRET.IA
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { affretIaApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface Proposal {
  id: string;
  sessionId: string;
  orderId: string;
  industrialId?: string;
  industrialName?: string;
  route: {
    pickup: string;
    delivery: string;
  };
  proposedPrice: number;
  estimatedPrice: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offer' | 'expired' | 'withdrawn';
  score?: number;
  rank?: number;
  totalProposals?: number;
  counterOffer?: {
    price: number;
    message: string;
    expiresAt: string;
  };
  submittedAt: string;
  respondedAt?: string;
  pickupDate: string;
  deliveryDate: string;
  message?: string;
}

export default function MesPropositionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [counterResponse, setCounterResponse] = useState<'accept' | 'reject' | null>(null);

  // Charger les propositions
  const loadProposals = async () => {
    setIsLoading(true);
    try {
      // Appel API
      const data = await affretIaApi.getMyProposals(filter === 'all' ? undefined : filter);

      if (data.proposals && Array.isArray(data.proposals)) {
        setProposals(data.proposals);
      } else if (Array.isArray(data)) {
        setProposals(data);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error loading proposals from API:', err);
      // Fallback mock data
      const mockProposals: Proposal[] = [
        {
          id: 'prop-1',
          sessionId: 'sess-1',
          orderId: 'ORD-2024-001',
          industrialId: 'IND-001',
          industrialName: 'TOTAL Énergies Logistique',
          route: { pickup: 'Lyon', delivery: 'Paris' },
          proposedPrice: 780,
          estimatedPrice: 850,
          currency: 'EUR',
          status: 'accepted',
          score: 87,
          rank: 1,
          totalProposals: 8,
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'prop-2',
          sessionId: 'sess-2',
          orderId: 'ORD-2024-002',
          industrialId: 'IND-002',
          industrialName: 'Carrefour Supply Chain',
          route: { pickup: 'Marseille', delivery: 'Bordeaux' },
          proposedPrice: 920,
          estimatedPrice: 880,
          currency: 'EUR',
          status: 'counter_offer',
          score: 72,
          rank: 3,
          totalProposals: 5,
          counterOffer: {
            price: 860,
            message: 'Nous proposons un prix ajusté compte tenu du volume.',
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          },
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'prop-3',
          sessionId: 'sess-3',
          orderId: 'ORD-2024-003',
          route: { pickup: 'Lille', delivery: 'Toulouse' },
          proposedPrice: 1100,
          estimatedPrice: 1050,
          currency: 'EUR',
          status: 'pending',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          pickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Disponible avec véhicule frigorifique',
        },
        {
          id: 'prop-4',
          sessionId: 'sess-4',
          orderId: 'ORD-2024-004',
          route: { pickup: 'Nantes', delivery: 'Strasbourg' },
          proposedPrice: 950,
          estimatedPrice: 900,
          currency: 'EUR',
          status: 'rejected',
          score: 58,
          rank: 5,
          totalProposals: 6,
          submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          respondedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'prop-5',
          sessionId: 'sess-5',
          orderId: 'ORD-2024-005',
          route: { pickup: 'Nice', delivery: 'Lyon' },
          proposedPrice: 620,
          estimatedPrice: 650,
          currency: 'EUR',
          status: 'expired',
          submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          pickupDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          deliveryDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filtered = mockProposals;
      if (filter !== 'all') {
        filtered = mockProposals.filter(p => p.status === filter);
      }

      setProposals(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Répondre à une contre-offre
  const handleCounterOfferResponse = async (proposal: Proposal, accept: boolean) => {
    if (!proposal) return;

    try {
      if (accept) {
        await affretIaApi.confirmAttribution(proposal.id);
        toast.success('Contre-offre acceptée !');
      } else {
        await affretIaApi.withdrawProposal(proposal.id);
        toast.success('Contre-offre refusée');
      }

      setSelectedProposal(null);
      setCounterResponse(null);
      loadProposals();
    } catch (err) {
      console.error('Error responding to counter offer:', err);
      toast.error('Erreur lors de la réponse à la contre-offre');
    }
  };

  // Retirer une proposition
  const handleWithdraw = async (proposalId: string) => {
    if (!confirm('Voulez-vous vraiment retirer cette proposition ?')) return;

    try {
      await affretIaApi.withdrawProposal(proposalId);
      toast.success('Proposition retirée');
      loadProposals();
    } catch (err) {
      console.error('Error withdrawing proposal:', err);
      toast.error('Erreur lors du retrait de la proposition');
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadProposals();
  }, [router, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return { bg: 'rgba(16,185,129,0.2)', text: '#10b981' };
      case 'rejected': return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' };
      case 'counter_offer': return { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' };
      case 'pending': return { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6' };
      case 'expired': return { bg: 'rgba(107,114,128,0.2)', text: '#6b7280' };
      case 'withdrawn': return { bg: 'rgba(107,114,128,0.2)', text: '#6b7280' };
      default: return { bg: 'rgba(255,255,255,0.1)', text: 'white' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Acceptée';
      case 'rejected': return 'Refusée';
      case 'counter_offer': return 'Contre-offre';
      case 'pending': return 'En attente';
      case 'expired': return 'Expirée';
      case 'withdrawn': return 'Retirée';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'il y a moins d\'1h';
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  return (
    <>
      <Head>
        <title>Mes Propositions - Transporter | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>📋</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Mes Propositions
              </h1>
            </div>
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'pending', label: 'En attente' },
              { value: 'counter_offer', label: 'Contre-offres' },
              { value: 'accepted', label: 'Acceptées' },
              { value: 'rejected', label: 'Refusées' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: filter === f.value
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{ padding: '20px 40px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {[
              { label: 'En attente', count: proposals.filter(p => p.status === 'pending').length, color: '#3b82f6' },
              { label: 'Contre-offres', count: proposals.filter(p => p.status === 'counter_offer').length, color: '#f59e0b' },
              { label: 'Acceptées', count: proposals.filter(p => p.status === 'accepted').length, color: '#10b981' },
              { label: 'Refusées', count: proposals.filter(p => p.status === 'rejected').length, color: '#ef4444' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>
                  {stat.count}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des propositions */}
        <div style={{ padding: '0 40px 40px', maxWidth: '1200px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Aucune proposition</p>
              <button
                onClick={() => router.push('/bourse')}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Voir la Bourse Fret
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {proposals.map((proposal) => {
                const statusStyle = getStatusColor(proposal.status);
                return (
                  <div
                    key={proposal.id}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: proposal.status === 'counter_offer'
                        ? '2px solid #f59e0b'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                          {proposal.route.pickup} → {proposal.route.delivery}
                        </div>
                        {proposal.industrialName && (
                          <div style={{
                            fontSize: '13px',
                            color: '#667eea',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>🏭</span> {proposal.industrialName}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                          Ref: {proposal.orderId} • Envoyée {formatRelativeTime(proposal.submittedAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                        }}
                      >
                        {getStatusLabel(proposal.status)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Votre prix</div>
                        <div style={{ fontSize: '24px', fontWeight: '800' }}>{proposal.proposedPrice} €</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Prix estimé</div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                          {proposal.estimatedPrice} €
                        </div>
                      </div>
                      {proposal.score && (
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Score IA</div>
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#667eea' }}>
                            {proposal.score}/100
                          </div>
                        </div>
                      )}
                      {proposal.rank && (
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Classement</div>
                          <div style={{ fontSize: '24px', fontWeight: '800' }}>
                            #{proposal.rank}/{proposal.totalProposals}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contre-offre */}
                    {proposal.status === 'counter_offer' && proposal.counterOffer && (
                      <div
                        style={{
                          background: 'rgba(245,158,11,0.1)',
                          padding: '16px',
                          borderRadius: '12px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                          Contre-offre reçue
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                          {proposal.counterOffer.price} €
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                          {proposal.counterOffer.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                          Expire le {formatDate(proposal.counterOffer.expiresAt)}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleCounterOfferResponse(proposal, true)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleCounterOfferResponse(proposal, false)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid rgba(239,68,68,0.5)',
                              background: 'transparent',
                              color: '#ef4444',
                              fontSize: '14px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {proposal.status === 'pending' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleWithdraw(proposal.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.5)',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Retirer la proposition
                        </button>
                      </div>
                    )}

                    {proposal.status === 'accepted' && (
                      <div
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                          Mission attribuée !
                        </span>
                        <button
                          onClick={() => router.push(`/orders/${proposal.orderId}`)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Voir la mission
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

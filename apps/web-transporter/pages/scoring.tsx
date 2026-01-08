/**
 * Page Scoring Transporteurs - Portail Transporteur
 * Integration complete Scoring API (5 endpoints)
 *
 * Endpoints:
 * - POST /scoring/calculate - Calculer un score
 * - GET /carriers/:id/score - Score d'un transporteur
 * - GET /carriers/:id/score-history - Historique des scores
 * - GET /scoring/leaderboard - Classement des transporteurs
 * - GET /scoring/order/:orderId - Score d'une commande
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { carriersApi, API_CONFIG } from '../lib/api';

// Types
interface IndustrialPartner {
  industrialId: string;
  industrialName: string;
  status: string;
}
interface TransportScore {
  _id: string;
  orderId: string;
  carrierId: string;
  carrierName: string;
  punctualityPickup: number;
  punctualityDelivery: number;
  appointmentRespect: number;
  trackingReactivity: number;
  podDelay: number;
  incidentsManaged: number;
  delaysJustified: number;
  finalScore: number;
  pickupScheduled: string;
  pickupActual: string;
  deliveryScheduled: string;
  deliveryActual: string;
  scoredAt: string;
}

interface CarrierAggregateScore {
  _id: string;
  carrierId: string;
  carrierName: string;
  averageScores: {
    punctualityPickup: number;
    punctualityDelivery: number;
    appointmentRespect: number;
    trackingReactivity: number;
    podDelay: number;
    incidentsManaged: number;
    delaysJustified: number;
    overall: number;
  };
  stats: {
    totalScored: number;
    lastScoreDate: string;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number;
  };
  rank?: number;
}

interface ScoreCriteria {
  punctualityPickup: number;
  punctualityDelivery: number;
  appointmentRespect: number;
  trackingReactivity: number;
  podDelay: number;
  incidentsManaged: number;
  delaysJustified: number;
}

// Helper pour obtenir le carrierId
const getCarrierId = (): string => {
  if (typeof window === 'undefined') return '';
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user).carrierId || JSON.parse(user).id || '';
    } catch {
      return '';
    }
  }
  return '';
};

export default function ScoringPage() {
  const router = useRouter();
  // Utiliser API_CONFIG.SCORING_API au lieu de l'URL hardcodee
  const scoringApiUrl = API_CONFIG.SCORING_API + '/api/v1';

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'calculate' | 'history' | 'search' | 'by-industrial'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<CarrierAggregateScore[]>([]);
  const [scoreHistory, setScoreHistory] = useState<TransportScore[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierAggregateScore | null>(null);
  const [orderScore, setOrderScore] = useState<TransportScore | null>(null);

  // KPI par industriel
  const [industrialPartners, setIndustrialPartners] = useState<IndustrialPartner[]>([]);
  const [selectedIndustrial, setSelectedIndustrial] = useState<string>('');
  const [industrialScores, setIndustrialScores] = useState<CarrierAggregateScore | null>(null);

  const [searchCarrierId, setSearchCarrierId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');

  // Formulaire de calcul de score
  const [calculateForm, setCalculateForm] = useState({
    orderId: '',
    carrierId: '',
    carrierName: '',
    pickupScheduled: '',
    pickupActual: '',
    deliveryScheduled: '',
    deliveryActual: '',
    criteria: {
      punctualityPickup: 80,
      punctualityDelivery: 80,
      appointmentRespect: 80,
      trackingReactivity: 80,
      podDelay: 80,
      incidentsManaged: 80,
      delaysJustified: 80
    } as ScoreCriteria
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper API call
  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = getAuthToken();
    const url = `${scoringApiUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    return data;
  };

  // Charger le leaderboard - API ONLY
  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/scoring/leaderboard?limit=50&minTransports=1');
      setLeaderboard(result.data || []);
    } catch (err: any) {
      console.error('Erreur API leaderboard:', err);
      setError('Impossible de charger le classement. Verifiez que le service Scoring est operationnel.');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les industriels partenaires (inter-module avec carriersApi) - API ONLY
  const loadIndustrialPartners = async () => {
    try {
      const result = await carriersApi.getMyReferencings();
      if (result.data || result.referencings) {
        setIndustrialPartners(result.data || result.referencings || []);
      }
    } catch (err: any) {
      console.error('Erreur chargement industriels:', err);
      setIndustrialPartners([]);
    }
  };

  // Charger les KPI par industriel - API ONLY
  const loadScoresByIndustrial = async (industrialId: string) => {
    if (!industrialId) return;
    setIsLoading(true);
    setError(null);
    try {
      const carrierId = getCarrierId();
      // Endpoint pour obtenir le score du transporteur filtre par industriel
      const result = await apiCall(`/scoring/carrier/${carrierId}?industrialId=${industrialId}`);
      setIndustrialScores(result.data);
    } catch (err: any) {
      console.error('Erreur KPI par industriel:', err);
      setError('Impossible de charger les KPI pour cet industriel.');
      setIndustrialScores(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir le score d'un transporteur
  const getCarrierScore = async (carrierId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/carriers/${carrierId}/score`);
      setSelectedCarrier(result.data);
      await loadCarrierHistory(carrierId);
    } catch (err: any) {
      setError(err.message);
      setSelectedCarrier(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'historique d'un transporteur
  const loadCarrierHistory = async (carrierId: string) => {
    try {
      const result = await apiCall(`/carriers/${carrierId}/score-history?limit=20`);
      setScoreHistory(result.data || []);
    } catch (err: any) {
      console.error('Erreur historique:', err);
    }
  };

  // Obtenir le score d'une commande
  const getOrderScore = async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/scoring/order/${orderId}`);
      setOrderScore(result.data);
      setSuccess(`Score trouve pour la commande ${orderId}`);
    } catch (err: any) {
      setError(err.message);
      setOrderScore(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer et enregistrer un score
  const calculateScore = async () => {
    if (!calculateForm.orderId || !calculateForm.carrierId) {
      setError('orderId et carrierId sont requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        orderId: calculateForm.orderId,
        carrierId: calculateForm.carrierId,
        carrierName: calculateForm.carrierName,
        criteria: calculateForm.criteria,
        ...(calculateForm.pickupScheduled && { pickupScheduled: calculateForm.pickupScheduled }),
        ...(calculateForm.pickupActual && { pickupActual: calculateForm.pickupActual }),
        ...(calculateForm.deliveryScheduled && { deliveryScheduled: calculateForm.deliveryScheduled }),
        ...(calculateForm.deliveryActual && { deliveryActual: calculateForm.deliveryActual })
      };

      const result = await apiCall('/scoring/calculate', 'POST', payload);
      setSuccess(`Score calcule: ${result.data.finalScore}/100`);

      // Reset form
      setCalculateForm({
        orderId: '',
        carrierId: '',
        carrierName: '',
        pickupScheduled: '',
        pickupActual: '',
        deliveryScheduled: '',
        deliveryActual: '',
        criteria: {
          punctualityPickup: 80,
          punctualityDelivery: 80,
          appointmentRespect: 80,
          trackingReactivity: 80,
          podDelay: 80,
          incidentsManaged: 80,
          delaysJustified: 80
        }
      });

      // Reload leaderboard
      loadLeaderboard();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadLeaderboard();
    loadIndustrialPartners();
  }, []);

  // Charger KPI quand un industriel est selectionne
  useEffect(() => {
    if (selectedIndustrial) {
      loadScoresByIndustrial(selectedIndustrial);
    }
  }, [selectedIndustrial]);

  // Helper pour couleur de score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#84cc16';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  // Helper pour badge de rang
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '1', color: '#fbbf24' };
    if (rank === 2) return { emoji: '2', color: '#9ca3af' };
    if (rank === 3) return { emoji: '3', color: '#d97706' };
    return { emoji: String(rank), color: '#6b7280' };
  };

  // Helper pour tendance
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return { icon: 'haut', color: '#10b981' };
    if (trend === 'down') return { icon: 'bas', color: '#ef4444' };
    return { icon: '-', color: '#6b7280' };
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'system-ui, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#667eea' : 'white',
    color: isActive ? 'white' : '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  return (
    <>
      <Head>
        <title>Scoring Transporteurs - Transporteur | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>T</span> Scoring Transporteurs IA
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button style={tabStyle(activeTab === 'leaderboard')} onClick={() => setActiveTab('leaderboard')}>
              Classement
            </button>
            <button style={tabStyle(activeTab === 'by-industrial')} onClick={() => setActiveTab('by-industrial')}>
              KPI par Industriel
            </button>
            <button style={tabStyle(activeTab === 'calculate')} onClick={() => setActiveTab('calculate')}>
              Calculer Score
            </button>
            <button style={tabStyle(activeTab === 'search')} onClick={() => setActiveTab('search')}>
              Rechercher
            </button>
            <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
              Historique
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontWeight: '600' }}>
            Erreur: {error}
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '8px', fontWeight: '600' }}>
            {success}
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

          {/* Tab: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Classement des Transporteurs</h2>
                <button onClick={loadLeaderboard} style={buttonStyle} disabled={isLoading}>
                  {isLoading ? 'Chargement...' : 'Rafraichir'}
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>T</div>
                  <div>Aucun transporteur dans le classement</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Rang</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Transporteur</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Score Global</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Ponctualite Enl.</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Ponctualite Liv.</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Transports</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Tendance</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((carrier, index) => {
                        const rank = carrier.rank || index + 1;
                        const badge = getRankBadge(rank);
                        const trendInfo = getTrendIcon(carrier.trend?.direction || 'stable');
                        return (
                          <tr key={carrier._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: badge.color,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700'
                              }}>
                                {badge.emoji}
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: '600' }}>{carrier.carrierName || carrier.carrierId}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{carrier.carrierId}</div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                backgroundColor: getScoreColor(carrier.averageScores?.overall || 0),
                                color: 'white',
                                borderRadius: '20px',
                                fontWeight: '700'
                              }}>
                                {carrier.averageScores?.overall || 0}/100
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(carrier.averageScores?.punctualityPickup || 0) }}>
                              {carrier.averageScores?.punctualityPickup || 0}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(carrier.averageScores?.punctualityDelivery || 0) }}>
                              {carrier.averageScores?.punctualityDelivery || 0}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                              {carrier.stats?.totalScored || 0}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{ color: trendInfo.color, fontWeight: '600' }}>
                                {trendInfo.icon} {carrier.trend?.change ? `(${carrier.trend.change > 0 ? '+' : ''}${carrier.trend.change})` : ''}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                onClick={() => getCarrierScore(carrier.carrierId)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#667eea',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Calculate Score */}
          {activeTab === 'calculate' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Calculer un Score de Transport</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>Informations Transport</h3>
                  <input
                    style={inputStyle}
                    placeholder="ID Commande *"
                    value={calculateForm.orderId}
                    onChange={(e) => setCalculateForm({ ...calculateForm, orderId: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="ID Transporteur *"
                    value={calculateForm.carrierId}
                    onChange={(e) => setCalculateForm({ ...calculateForm, carrierId: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Nom Transporteur"
                    value={calculateForm.carrierName}
                    onChange={(e) => setCalculateForm({ ...calculateForm, carrierName: e.target.value })}
                  />

                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginTop: '16px', marginBottom: '8px', color: '#6b7280' }}>Dates (optionnel)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280' }}>Enlevement prevu</label>
                      <input
                        type="datetime-local"
                        style={inputStyle}
                        value={calculateForm.pickupScheduled}
                        onChange={(e) => setCalculateForm({ ...calculateForm, pickupScheduled: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280' }}>Enlevement reel</label>
                      <input
                        type="datetime-local"
                        style={inputStyle}
                        value={calculateForm.pickupActual}
                        onChange={(e) => setCalculateForm({ ...calculateForm, pickupActual: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280' }}>Livraison prevue</label>
                      <input
                        type="datetime-local"
                        style={inputStyle}
                        value={calculateForm.deliveryScheduled}
                        onChange={(e) => setCalculateForm({ ...calculateForm, deliveryScheduled: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280' }}>Livraison reelle</label>
                      <input
                        type="datetime-local"
                        style={inputStyle}
                        value={calculateForm.deliveryActual}
                        onChange={(e) => setCalculateForm({ ...calculateForm, deliveryActual: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>Criteres de Notation (0-100)</h3>
                  {Object.entries(calculateForm.criteria).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      punctualityPickup: 'Ponctualite Enlevement',
                      punctualityDelivery: 'Ponctualite Livraison',
                      appointmentRespect: 'Respect RDV',
                      trackingReactivity: 'Reactivite Tracking',
                      podDelay: 'Delai POD',
                      incidentsManaged: 'Gestion Incidents',
                      delaysJustified: 'Retards Justifies'
                    };
                    return (
                      <div key={key} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>{labels[key]}</label>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: getScoreColor(value) }}>{value}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => setCalculateForm({
                            ...calculateForm,
                            criteria: { ...calculateForm.criteria, [key]: parseInt(e.target.value) }
                          })}
                          style={{ width: '100%' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button onClick={calculateScore} style={{ ...buttonStyle, padding: '14px 48px' }} disabled={isLoading}>
                  {isLoading ? 'Calcul en cours...' : 'Calculer et Enregistrer le Score'}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Search */}
          {activeTab === 'search' && (
            <div>
              <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Rechercher un Transporteur</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    placeholder="ID du Transporteur"
                    value={searchCarrierId}
                    onChange={(e) => setSearchCarrierId(e.target.value)}
                  />
                  <button onClick={() => searchCarrierId && getCarrierScore(searchCarrierId)} style={buttonStyle} disabled={isLoading}>
                    Rechercher
                  </button>
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Rechercher par Commande</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    placeholder="ID de la Commande"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                  />
                  <button onClick={() => searchOrderId && getOrderScore(searchOrderId)} style={buttonStyle} disabled={isLoading}>
                    Rechercher
                  </button>
                </div>

                {orderScore && (
                  <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Score de la Commande</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Commande</div>
                        <div style={{ fontWeight: '600' }}>{orderScore.orderId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Transporteur</div>
                        <div style={{ fontWeight: '600' }}>{orderScore.carrierName || orderScore.carrierId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Score Final</div>
                        <div style={{ fontWeight: '700', fontSize: '24px', color: getScoreColor(orderScore.finalScore) }}>
                          {orderScore.finalScore}/100
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Date</div>
                        <div style={{ fontWeight: '600' }}>{new Date(orderScore.scoredAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedCarrier && (
                <div style={cardStyle}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    Details: {selectedCarrier.carrierName || selectedCarrier.carrierId}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(selectedCarrier.averageScores?.overall || 0) }}>
                        {selectedCarrier.averageScores?.overall || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Score Global</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '800' }}>{selectedCarrier.stats?.totalScored || 0}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Transports Notes</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(selectedCarrier.averageScores?.punctualityDelivery || 0) }}>
                        {selectedCarrier.averageScores?.punctualityDelivery || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Ponctualite Livraison</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: getTrendIcon(selectedCarrier.trend?.direction || 'stable').color }}>
                        {getTrendIcon(selectedCarrier.trend?.direction || 'stable').icon}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Tendance</div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Detail des Criteres</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {selectedCarrier.averageScores && Object.entries(selectedCarrier.averageScores).filter(([k]) => k !== 'overall').map(([key, value]) => {
                      const labels: Record<string, string> = {
                        punctualityPickup: 'Ponct. Enl.',
                        punctualityDelivery: 'Ponct. Liv.',
                        appointmentRespect: 'RDV',
                        trackingReactivity: 'Tracking',
                        podDelay: 'POD',
                        incidentsManaged: 'Incidents',
                        delaysJustified: 'Retards'
                      };
                      return (
                        <div key={key} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: getScoreColor(value as number) }}>{value as number}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>{labels[key] || key}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Historique des Scores</h2>

              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  placeholder="Entrez l'ID du transporteur pour voir son historique"
                  value={searchCarrierId}
                  onChange={(e) => setSearchCarrierId(e.target.value)}
                />
                <button onClick={() => searchCarrierId && loadCarrierHistory(searchCarrierId)} style={buttonStyle} disabled={isLoading}>
                  Charger Historique
                </button>
              </div>

              {scoreHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>H</div>
                  <div>Recherchez un transporteur pour voir son historique</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Commande</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Score Final</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Ponct. Enl.</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Ponct. Liv.</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>RDV</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Tracking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreHistory.map((score) => (
                        <tr key={score._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(score.scoredAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{score.orderId}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: getScoreColor(score.finalScore),
                              color: 'white',
                              borderRadius: '12px',
                              fontWeight: '700',
                              fontSize: '13px'
                            }}>
                              {score.finalScore}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(score.punctualityPickup) }}>
                            {score.punctualityPickup || '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(score.punctualityDelivery) }}>
                            {score.punctualityDelivery || '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(score.appointmentRespect) }}>
                            {score.appointmentRespect || '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getScoreColor(score.trackingReactivity) }}>
                            {score.trackingReactivity || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: KPI par Industriel */}
          {activeTab === 'by-industrial' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>KPI par Industriel Partenaire</h2>

              {/* Selection industriel */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Selectionnez un industriel partenaire
                </label>
                <select
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  value={selectedIndustrial}
                  onChange={(e) => setSelectedIndustrial(e.target.value)}
                >
                  <option value="">-- Choisir un industriel --</option>
                  {industrialPartners.map((partner) => (
                    <option key={partner.industrialId} value={partner.industrialId}>
                      {partner.industrialName}
                    </option>
                  ))}
                </select>
                {industrialPartners.length === 0 && (
                  <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                    Aucun industriel partenaire trouve. Verifiez vos referencements.
                  </div>
                )}
              </div>

              {/* Affichage des KPI */}
              {selectedIndustrial && industrialScores && (
                <div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Industriel selectionne</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                      {industrialPartners.find(p => p.industrialId === selectedIndustrial)?.industrialName}
                    </div>
                  </div>

                  {/* Score global */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                      <div style={{ fontSize: '48px', fontWeight: '800', color: getScoreColor(industrialScores.averageScores?.overall || 0) }}>
                        {industrialScores.averageScores?.overall || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Score Global</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                      <div style={{ fontSize: '48px', fontWeight: '800', color: '#374151' }}>
                        {industrialScores.stats?.totalScored || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Transports Notes</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: getTrendIcon(industrialScores.trend?.direction || 'stable').color }}>
                        {getTrendIcon(industrialScores.trend?.direction || 'stable').icon}
                        {industrialScores.trend?.change ? ` (${industrialScores.trend.change > 0 ? '+' : ''}${industrialScores.trend.change})` : ''}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Tendance</div>
                    </div>
                  </div>

                  {/* Details des criteres */}
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Detail des Criteres de Performance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                    {industrialScores.averageScores && Object.entries(industrialScores.averageScores).filter(([k]) => k !== 'overall').map(([key, value]) => {
                      const labels: Record<string, string> = {
                        punctualityPickup: 'Ponctualite Enlevement',
                        punctualityDelivery: 'Ponctualite Livraison',
                        appointmentRespect: 'Respect RDV',
                        trackingReactivity: 'Reactivite Tracking',
                        podDelay: 'Delai POD',
                        incidentsManaged: 'Gestion Incidents',
                        delaysJustified: 'Retards Justifies'
                      };
                      return (
                        <div key={key} style={{
                          textAlign: 'center',
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: `2px solid ${getScoreColor(value as number)}20`
                        }}>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: getScoreColor(value as number) }}>
                            {value as number}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{labels[key] || key}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedIndustrial && !industrialScores && !isLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>?</div>
                  <div>Aucun score disponible pour cet industriel</div>
                </div>
              )}

              {!selectedIndustrial && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>I</div>
                  <div>Selectionnez un industriel pour voir vos KPI specifiques</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

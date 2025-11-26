/**
 * Page d'analytics des transporteurs - Portail Industry
 * Dashboard de scoring et classement
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../../lib/auth';
import { CarrierRanking, AnalyticsDashboard, ScoreCard } from '@rt/ui-components';
import ScoringService from '@rt/utils/lib/services/scoring-service';
import type {
  CarrierAnalytics,
  RankingList,
  CarrierScore,
  ScorePeriod,
} from '@rt/contracts/src/types/scoring';

export default function CarriersAnalyticsPage() {
  const router = useRouter();
  const { carrierId } = router.query;

  const [view, setView] = useState<'ranking' | 'details'>('ranking');
  const [ranking, setRanking] = useState<RankingList | null>(null);
  const [analytics, setAnalytics] = useState<CarrierAnalytics | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [period, setPeriod] = useState<ScorePeriod>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le classement
  const loadRanking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rankingData = await ScoringService.getRanking(period, 50);
      setRanking(rankingData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du classement');
      console.error('Error loading ranking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les analytics d'un transporteur
  const loadAnalytics = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await ScoringService.getCarrierAnalytics(id, period);
      setAnalytics(analyticsData);
      setView('details');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des analytics');
      console.error('Error loading analytics:', err);
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

    if (carrierId && typeof carrierId === 'string') {
      setSelectedCarrierId(carrierId);
      loadAnalytics(carrierId);
    } else {
      loadRanking();
    }
  }, [router, carrierId]);

  // Rechargement lors du changement de période
  useEffect(() => {
    if (view === 'ranking') {
      loadRanking();
    } else if (selectedCarrierId) {
      loadAnalytics(selectedCarrierId);
    }
  }, [period]);

  const handleCarrierClick = (id: string) => {
    setSelectedCarrierId(id);
    loadAnalytics(id);
  };

  const handleBackToRanking = () => {
    setView('ranking');
    setAnalytics(null);
    setSelectedCarrierId(null);
    router.push('/carriers/analytics', undefined, { shallow: true });
  };

  if (isLoading && !analytics && !ranking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error}</div>
        <button
          onClick={handleBackToRanking}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Retour au classement
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics Transporteurs - Industry | SYMPHONI.A</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {view === 'details' && (
                  <button
                    onClick={handleBackToRanking}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    ← Retour au classement
                  </button>
                )}

                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
                    {view === 'ranking' ? '🏆 Classement des transporteurs' : '📊 Analytics détaillées'}
                  </h1>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Sélecteur de période */}
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as ScorePeriod)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <option value="7d">7 derniers jours</option>
                  <option value="30d">30 derniers jours</option>
                  <option value="90d">3 derniers mois</option>
                  <option value="1y">12 derniers mois</option>
                  <option value="all">Depuis le début</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          {view === 'ranking' && ranking ? (
            <CarrierRanking
              ranking={ranking}
              onCarrierClick={handleCarrierClick}
              showTop={50}
            />
          ) : analytics ? (
            <AnalyticsDashboard
              analytics={analytics}
              onPeriodChange={setPeriod}
              onRefresh={() => selectedCarrierId && loadAnalytics(selectedCarrierId)}
              isLoading={isLoading}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'white',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                Aucune donnée
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Sélectionnez un transporteur pour voir ses analytics
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

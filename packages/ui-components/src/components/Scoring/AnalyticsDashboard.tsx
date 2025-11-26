/**
 * Dashboard analytics complet pour un transporteur
 * Vue d'ensemble des scores, métriques et évolution
 */

import React, { useState } from 'react';
import type { CarrierAnalytics, ScorePeriod } from '@rt/contracts/src/types/scoring';
import ScoringService from '@rt/utils/lib/services/scoring-service';
import { ScoreCard } from './ScoreCard';
import { PerformanceChart } from './PerformanceChart';

interface AnalyticsDashboardProps {
  analytics: CarrierAnalytics;
  onPeriodChange?: (period: ScorePeriod) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  onPeriodChange,
  onRefresh,
  isLoading = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<
    'overallScore' | 'onTimeDelivery' | 'communication' | 'damageRate' | 'documentation' | 'responsiveness' | 'pricing' | 'compliance'
  >('overallScore');

  const metrics = analytics.metrics;
  const scores = analytics.scores;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
            📊 Analytics - {analytics.carrierName}
          </h1>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {ScoringService.getPeriodLabel(analytics.period)} •{' '}
            {new Date(analytics.dateFrom).toLocaleDateString('fr-FR')} -{' '}
            {new Date(analytics.dateTo).toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Sélecteur de période */}
          {onPeriodChange && (
            <select
              value={analytics.period}
              onChange={(e) => onPeriodChange(e.target.value as ScorePeriod)}
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
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              🔄 Actualiser
            </button>
          )}
        </div>
      </div>

      {/* Score Card */}
      <div style={{ marginBottom: '24px' }}>
        <ScoreCard score={scores} showDetails={true} />
      </div>

      {/* KPIs rapides */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <MetricCard
          icon="📦"
          label="Commandes totales"
          value={ScoringService.formatNumber(metrics.totalOrders)}
          color="#667eea"
        />
        <MetricCard
          icon="✅"
          label="Taux de ponctualité"
          value={ScoringService.formatPercentage(metrics.onTimePercentage)}
          subtitle={`${metrics.onTimeDeliveries}/${metrics.completedOrders} à l'heure`}
          color="#10b981"
        />
        <MetricCard
          icon="💰"
          label="Chiffre d'affaires"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            notation: 'compact',
          }).format(metrics.totalRevenue)}
          subtitle={`Moy: ${new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(metrics.averageOrderValue)}`}
          color="#f59e0b"
        />
        <MetricCard
          icon="⭐"
          label="Satisfaction client"
          value={`${metrics.customerSatisfaction.toFixed(1)}/5`}
          subtitle={`${metrics.complaintRate.toFixed(1)}% de réclamations`}
          color="#8b5cf6"
        />
      </div>

      {/* Graphique d'évolution */}
      <div
        style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            📈 Évolution des performances
          </h3>

          {/* Sélecteur de métrique */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { value: 'overallScore', label: 'Score global' },
              { value: 'onTimeDelivery', label: 'Ponctualité' },
              { value: 'communication', label: 'Communication' },
              { value: 'damageRate', label: 'Avaries' },
            ].map((metric) => (
              <button
                key={metric.value}
                onClick={() => setSelectedMetric(metric.value as any)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: selectedMetric === metric.value ? '#667eea' : 'white',
                  color: selectedMetric === metric.value ? 'white' : '#374151',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        <PerformanceChart
          data={analytics.timeline}
          metric={selectedMetric}
          height={300}
          showGrid={true}
          showTooltip={true}
        />
      </div>

      {/* Forces & Faiblesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Forces */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
            💪 Points forts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.strengths.slice(0, 3).map((criterion) => {
              const score = scores.scores[criterion];
              return (
                <div
                  key={criterion}
                  style={{
                    padding: '12px',
                    backgroundColor: '#d1fae5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{ScoringService.getCriterionIcon(criterion)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                      {ScoringService.getCriterionLabel(criterion)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857' }}>
                      {ScoringService.getCriterionDescription(criterion)}
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {Math.round(score.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Faiblesses */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
            ⚠️ Points d'amélioration
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.weaknesses.slice(0, 3).map((criterion) => {
              const score = scores.scores[criterion];
              return (
                <div
                  key={criterion}
                  style={{
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{ScoringService.getCriterionIcon(criterion)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
                      {ScoringService.getCriterionLabel(criterion)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                      {ScoringService.getCriterionDescription(criterion)}
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                    {Math.round(score.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparaison marché */}
      {analytics.comparison && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
            📊 Comparaison avec le marché
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <ComparisonCard
              label="Votre score"
              value={Math.round(scores.overallScore)}
              color={ScoringService.getScoreColor(scores.overallScore)}
            />
            <ComparisonCard
              label="Moyenne du marché"
              value={Math.round(analytics.comparison.marketAverage)}
              color="#6b7280"
            />
            <ComparisonCard
              label="Meilleur score"
              value={Math.round(analytics.comparison.topPerformer)}
              color="#10b981"
            />
          </div>
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#374151',
            }}
          >
            Vous êtes classé <strong>#{analytics.comparison.rank}</strong> sur{' '}
            <strong>{analytics.comparison.totalCarriers}</strong> transporteurs
          </div>
        </div>
      )}

      {/* Recommandations */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fbbf24',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#78350f' }}>
            💡 Recommandations
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            {analytics.recommendations.map((recommendation, index) => (
              <li key={index} style={{ marginBottom: '8px', fontSize: '14px' }}>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Composant carte de métrique
const MetricCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}> = ({ icon, label, value, subtitle, color }) => (
  <div
    style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{label}</div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
      {value}
    </div>
    {subtitle && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{subtitle}</div>}
  </div>
);

// Composant carte de comparaison
const ComparisonCard: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div
    style={{
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '32px', fontWeight: '800', color, marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{label}</div>
  </div>
);

export default AnalyticsDashboard;

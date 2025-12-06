/**
 * Carte de score d'un transporteur
 * Affiche le score global et les scores par critère
 */

import React from 'react';
import type { CarrierScore, ScoringCriterion } from '@rt/contracts';
import { ScoringService } from '@rt/utils';

interface ScoreCardProps {
  score: CarrierScore;
  showDetails?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  showDetails = true,
  compact = false,
  onClick,
}) => {
  const cardStyle: React.CSSProperties = {
    padding: compact ? '16px' : '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
  };

  const scoreCircleStyle: React.CSSProperties = {
    width: compact ? '80px' : '120px',
    height: compact ? '80px' : '120px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `conic-gradient(${ScoringService.getScoreColor(score.overallScore)} ${score.overallScore}%, #e5e7eb ${score.overallScore}%)`,
    padding: '4px',
    flexShrink: 0,
  };

  const innerCircleStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const criteriaGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: compact ? '1fr' : 'repeat(2, 1fr)',
    gap: compact ? '8px' : '12px',
    marginTop: '16px',
  };

  return (
    <div
      style={{
        ...cardStyle,
        ...(onClick && {
          ':hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        }),
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: showDetails ? '20px' : '0' }}>
        {/* Score circulaire */}
        <div style={scoreCircleStyle}>
          <div style={innerCircleStyle}>
            <div
              style={{
                fontSize: compact ? '24px' : '36px',
                fontWeight: '800',
                color: ScoringService.getScoreColor(score.overallScore),
              }}
            >
              {Math.round(score.overallScore)}
            </div>
            <div style={{ fontSize: compact ? '10px' : '12px', color: '#6b7280', fontWeight: '600' }}>
              / 100
            </div>
          </div>
        </div>

        {/* Infos transporteur */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: compact ? '16px' : '20px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {score.carrierName}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Label score */}
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: `${ScoringService.getScoreColor(score.overallScore)}15`,
                color: ScoringService.getScoreColor(score.overallScore),
              }}
            >
              {ScoringService.getScoreLabel(score.overallScore)}
            </span>

            {/* Tendance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: ScoringService.getTrendColor(score.trend),
                fontWeight: '600',
              }}
            >
              <span>{ScoringService.getTrendIcon(score.trend)}</span>
              <span>
                {score.trendValue > 0 ? '+' : ''}
                {score.trendValue.toFixed(1)}
              </span>
            </div>

            {/* Rank */}
            {score.rank && (
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                #{score.rank}
              </div>
            )}
          </div>

          {/* Nombre de commandes */}
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            {ScoringService.formatNumber(score.totalOrders)} commande
            {score.totalOrders > 1 ? 's' : ''} • {ScoringService.getPeriodLabel(score.period)}
          </div>
        </div>
      </div>

      {/* Détails des critères */}
      {showDetails && (
        <div style={criteriaGridStyle}>
          {(Object.entries(score.scores) as [ScoringCriterion, any][]).map(([criterion, criterionScore]) => (
            <div
              key={criterion}
              style={{
                padding: compact ? '8px' : '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {/* Icône */}
              <div
                style={{
                  fontSize: compact ? '20px' : '24px',
                  flexShrink: 0,
                }}
              >
                {ScoringService.getCriterionIcon(criterion)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ScoringService.getCriterionLabel(criterion)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: compact ? '13px' : '14px',
                      fontWeight: '700',
                      color: ScoringService.getScoreColor(criterionScore.score),
                    }}
                  >
                    {Math.round(criterionScore.score)}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: ScoringService.getTrendColor(criterionScore.trend),
                    }}
                  >
                    {ScoringService.getTrendIcon(criterionScore.trend)}
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div
                style={{
                  width: compact ? '40px' : '60px',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${criterionScore.score}%`,
                    height: '100%',
                    backgroundColor: ScoringService.getScoreColor(criterionScore.score),
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer - Dernière maj */}
      {!compact && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Dernière mise à jour:{' '}
          {new Date(score.lastUpdated).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};

export default ScoreCard;

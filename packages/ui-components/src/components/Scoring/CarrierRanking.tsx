/**
 * Classement des transporteurs par score
 * Affiche le top performers avec podium
 */

import React from 'react';
import type { CarrierRanking as RankingType, RankingList } from '@rt/contracts';
import ScoringService from '@rt/utils/lib/services/scoring-service';

interface CarrierRankingProps {
  ranking: RankingList;
  onCarrierClick?: (carrierId: string) => void;
  showTop?: number; // Nombre à afficher (défaut: tous)
  highlightCarrierId?: string; // Carrier à mettre en avant
}

export const CarrierRanking: React.FC<CarrierRankingProps> = ({
  ranking,
  onCarrierClick,
  showTop,
  highlightCarrierId,
}) => {
  const displayedCarriers = showTop ? ranking.carriers.slice(0, showTop) : ranking.carriers;

  // Top 3 pour le podium
  const topThree = ranking.carriers.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          🏆 Classement des transporteurs
        </h2>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {ScoringService.getPeriodLabel(ranking.period)} • {ranking.total} transporteur
          {ranking.total > 1 ? 's' : ''}
        </div>
      </div>

      {/* Podium (Top 3) */}
      {topThree.length >= 3 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
          }}
        >
          {/* 2ème place */}
          <PodiumCard carrier={topThree[1]} onClick={onCarrierClick} />

          {/* 1ère place */}
          <PodiumCard carrier={topThree[0]} onClick={onCarrierClick} first />

          {/* 3ème place */}
          <PodiumCard carrier={topThree[2]} onClick={onCarrierClick} />
        </div>
      )}

      {/* Liste complète */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayedCarriers.map((carrier: RankingType) => (
          <RankingRow
            key={carrier.carrierId}
            carrier={carrier}
            isHighlighted={carrier.carrierId === highlightCarrierId}
            onClick={() => onCarrierClick?.(carrier.carrierId)}
          />
        ))}
      </div>

      {/* Carrier de l'utilisateur (si hors top) */}
      {ranking.userCarrier && !displayedCarriers.find((c: RankingType) => c.carrierId === ranking.userCarrier!.carrierId) && (
        <>
          <div
            style={{
              margin: '16px 0',
              height: '1px',
              backgroundColor: '#e5e7eb',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '0 12px',
                backgroundColor: 'white',
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: '600',
              }}
            >
              VOTRE CLASSEMENT
            </span>
          </div>
          <RankingRow
            carrier={ranking.userCarrier}
            isHighlighted
            onClick={() => onCarrierClick?.(ranking.userCarrier!.carrierId)}
          />
        </>
      )}
    </div>
  );
};

// Composant carte de podium
const PodiumCard: React.FC<{
  carrier: RankingType;
  first?: boolean;
  onClick?: (carrierId: string) => void;
}> = ({ carrier, first = false, onClick }) => {
  const badge = ScoringService.getRankBadge(carrier.rank);

  return (
    <div
      onClick={() => onClick?.(carrier.carrierId)}
      style={{
        flex: 1,
        maxWidth: '200px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: `2px solid ${badge?.color || '#e5e7eb'}`,
        boxShadow: first ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        height: first ? '180px' : '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {/* Badge */}
      <div style={{ fontSize: first ? '48px' : '36px', marginBottom: '8px' }}>
        {badge?.emoji}
      </div>

      {/* Nom */}
      <div
        style={{
          fontSize: first ? '16px' : '14px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          padding: '0 8px',
        }}
      >
        {carrier.carrierName}
      </div>

      {/* Score */}
      <div
        style={{
          fontSize: first ? '28px' : '24px',
          fontWeight: '800',
          color: ScoringService.getScoreColor(carrier.overallScore),
          marginBottom: '4px',
        }}
      >
        {Math.round(carrier.overallScore)}
      </div>

      {/* Ponctualité */}
      <div style={{ fontSize: '11px', color: '#6b7280' }}>
        {ScoringService.formatPercentage(carrier.onTimePercentage)} à l'heure
      </div>
    </div>
  );
};

// Composant ligne de classement
const RankingRow: React.FC<{
  carrier: RankingType;
  isHighlighted?: boolean;
  onClick?: () => void;
}> = ({ carrier, isHighlighted = false, onClick }) => {
  const badge = ScoringService.getRankBadge(carrier.rank);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        backgroundColor: isHighlighted ? '#eef2ff' : 'white',
        border: isHighlighted ? '2px solid #667eea' : '1px solid #e5e7eb',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Rang */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: badge ? `${badge.color}15` : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '800',
          color: badge ? badge.color : '#6b7280',
          flexShrink: 0,
        }}
      >
        {badge ? badge.emoji : `#${carrier.rank}`}
      </div>

      {/* Logo/Avatar */}
      {carrier.carrierLogo ? (
        <img
          src={carrier.carrierLogo}
          alt={carrier.carrierName}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          🚛
        </div>
      )}

      {/* Nom et infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {carrier.carrierName}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {ScoringService.formatNumber(carrier.totalOrders)} commande{carrier.totalOrders > 1 ? 's' : ''} •{' '}
          {ScoringService.formatPercentage(carrier.onTimePercentage)} à l'heure
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: '24px',
            fontWeight: '800',
            color: ScoringService.getScoreColor(carrier.overallScore),
            marginBottom: '4px',
          }}
        >
          {Math.round(carrier.overallScore)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            fontSize: '12px',
            color: ScoringService.getTrendColor(carrier.trend),
            fontWeight: '600',
          }}
        >
          <span>{ScoringService.getTrendIcon(carrier.trend)}</span>
          <span>
            {carrier.trendValue > 0 ? '+' : ''}
            {carrier.trendValue.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CarrierRanking;

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Star, AlertTriangle } from 'lucide-react';
import type { CarrierScore } from '../../services/kpi-api';

export interface CarrierScoreCardProps {
  carrier: CarrierScore;
  showDetails?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500' };
  if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-500' };
  if (score >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-500' };
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Tres bon';
  if (score >= 70) return 'Bon';
  if (score >= 60) return 'Correct';
  if (score >= 50) return 'Moyen';
  return 'A ameliorer';
};

export const CarrierScoreCard: React.FC<CarrierScoreCardProps> = ({
  carrier,
  showDetails = false,
  compact = false,
  onClick,
}) => {
  const colors = getScoreColor(carrier.score);
  const trendValue = parseFloat(carrier.trends?.lastMonth || '0');

  const criteriaLabels: Record<string, string> = {
    slotRespect: 'Respect creneaux',
    documentDelay: 'Delai documents',
    unjustifiedDelays: 'Retards non justifies',
    responseTime: 'Temps de reponse',
    vigilanceCompliance: 'Conformite vigilance',
    cancellationRate: 'Taux annulation',
    trackingQuality: 'Qualite tracking',
    premiumAdoption: 'Adoption Premium',
    overallReliability: 'Fiabilite globale',
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow border ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
        onClick={onClick}
      >
        <div className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center ring-2 ${colors.ring}`}>
          <span className={`text-xl font-bold ${colors.text}`}>{carrier.score}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{carrier.carrierName || carrier.carrierId}</p>
          <p className="text-sm text-gray-500">Rang #{carrier.ranking?.global || '-'}</p>
        </div>
        <div className="flex items-center">
          {carrier.trends?.evolution === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
          {carrier.trends?.evolution === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
          {carrier.trends?.evolution === 'stable' && <Minus className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border p-6 ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{carrier.carrierName || carrier.carrierId}</h3>
          <p className="text-sm text-gray-500">ID: {carrier.carrierId}</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
            <Award className="w-4 h-4 mr-1" />
            <span className="font-medium">Rang #{carrier.ranking?.global || '-'}</span>
          </div>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-6">
        <div className={`w-32 h-32 rounded-full ${colors.bg} flex flex-col items-center justify-center ring-4 ${colors.ring}`}>
          <span className={`text-4xl font-bold ${colors.text}`}>{carrier.score}</span>
          <span className={`text-sm ${colors.text}`}>/100</span>
        </div>
      </div>

      <p className="text-center text-lg font-medium text-gray-700 mb-4">{getScoreLabel(carrier.score)}</p>

      {/* Trends */}
      <div className="flex justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center">
          {trendValue >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={trendValue >= 0 ? 'text-green-600' : 'text-red-600'}>
            {trendValue >= 0 ? '+' : ''}{carrier.trends?.lastMonth}%
          </span>
          <span className="text-gray-400 ml-1">ce mois</span>
        </div>
        <div className="text-gray-500">
          Top {carrier.ranking?.percentile || '-'}%
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-gray-900">{carrier.metrics?.totalTransports || 0}</p>
          <p className="text-xs text-gray-500">Transports</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-gray-900">{carrier.metrics?.onTimeDeliveries || 0}</p>
          <p className="text-xs text-gray-500">A l'heure</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-gray-900">{carrier.metrics?.averageDelay || 0}</p>
          <p className="text-xs text-gray-500">Retard moy. (min)</p>
        </div>
      </div>

      {/* Comparisons */}
      <div className="border-t pt-4 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Comparaisons</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">vs Moyenne lane</span>
            <span className={parseFloat(carrier.comparisons?.vsLaneAverage || '0') >= 0 ? 'text-green-600' : 'text-red-600'}>
              {parseFloat(carrier.comparisons?.vsLaneAverage || '0') >= 0 ? '+' : ''}{carrier.comparisons?.vsLaneAverage}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">vs Moyenne reseau</span>
            <span className={parseFloat(carrier.comparisons?.vsNetworkAverage || '0') >= 0 ? 'text-green-600' : 'text-red-600'}>
              {parseFloat(carrier.comparisons?.vsNetworkAverage || '0') >= 0 ? '+' : ''}{carrier.comparisons?.vsNetworkAverage}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">vs Top 20</span>
            <span className={parseFloat(carrier.comparisons?.vsTop20 || '0') >= 0 ? 'text-green-600' : 'text-red-600'}>
              {parseFloat(carrier.comparisons?.vsTop20 || '0') >= 0 ? '+' : ''}{carrier.comparisons?.vsTop20}%
            </span>
          </div>
        </div>
      </div>

      {/* Score Details */}
      {showDetails && carrier.scoreDetails && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detail des criteres</h4>
          <div className="space-y-2">
            {Object.entries(carrier.scoreDetails).map(([key, detail]) => (
              <div key={key} className="flex items-center">
                <span className="text-xs text-gray-500 w-32 truncate">{criteriaLabels[key] || key}</span>
                <div className="flex-1 mx-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        parseFloat(detail.value) >= 80 ? 'bg-green-500' :
                        parseFloat(detail.value) >= 60 ? 'bg-yellow-500' :
                        parseFloat(detail.value) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${detail.value}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 w-12 text-right">{parseFloat(detail.score).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierScoreCard;

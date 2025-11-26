/**
 * Graphique d'évolution des performances
 * Affiche l'évolution du score dans le temps
 */

import React from 'react';
import type { TimelineDataPoint } from '@rt/contracts';
import ScoringService from '@rt/utils/lib/services/scoring-service';

interface PerformanceChartProps {
  data: TimelineDataPoint[];
  metric?: 'overallScore' | 'onTimeDelivery' | 'communication' | 'damageRate' | 'documentation' | 'responsiveness' | 'pricing' | 'compliance';
  title?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  metric = 'overallScore',
  title,
  height = 300,
  showGrid = true,
  showTooltip = true,
}) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          color: '#6b7280',
        }}
      >
        Aucune donnée disponible
      </div>
    );
  }

  // Extraire les valeurs
  const values = data.map((d) => d[metric]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  // Dimensions du graphique
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculer les points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + chartHeight - ((d[metric] - minValue) / (range || 1)) * chartHeight;
    return { x, y, value: d[metric], date: d.date };
  });

  // Créer le path pour la ligne
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Créer le path pour l'aire
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Lignes de grille
  const gridLines = [0, 25, 50, 75, 100].map((value) => {
    const y = padding.top + chartHeight - ((value - minValue) / (range || 1)) * chartHeight;
    return { value, y };
  });

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#111827',
          }}
        >
          {title}
        </h3>
      )}

      <div style={{ position: 'relative' }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          style={{ overflow: 'visible' }}
        >
          {/* Grille */}
          {showGrid && (
            <g>
              {gridLines.map((line, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={line.y}
                    x2={chartWidth - padding.right}
                    y2={line.y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={line.y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {line.value}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Aire sous la courbe */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Dégradé */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={ScoringService.getScoreColor(maxValue)} stopOpacity="0.5" />
              <stop offset="100%" stopColor={ScoringService.getScoreColor(maxValue)} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ligne */}
          <path
            d={linePath}
            fill="none"
            stroke={ScoringService.getScoreColor(values[values.length - 1])}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 6 : 4}
                fill="white"
                stroke={ScoringService.getScoreColor(point.value)}
                strokeWidth={hoveredPoint === i ? 3 : 2}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}

          {/* Axes X (dates) */}
          {data.length <= 30 && data.map((d, i) => {
            if (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) {
              const point = points[i];
              return (
                <text
                  key={i}
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {new Date(d.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Tooltip */}
        {showTooltip && hoveredPoint !== null && (
          <div
            style={{
              position: 'absolute',
              left: points[hoveredPoint].x,
              top: points[hoveredPoint].y - 60,
              transform: 'translateX(-50%)',
              padding: '8px 12px',
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
              {new Date(data[hoveredPoint].date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: ScoringService.getScoreColor(points[hoveredPoint].value),
              }}
            >
              {Math.round(points[hoveredPoint].value)}
            </div>
            <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '2px' }}>
              {data[hoveredPoint].ordersCount} commande(s)
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '12px',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: ScoringService.getScoreColor(values[values.length - 1]),
            }}
          />
          <span>Score actuel: {Math.round(values[values.length - 1])}</span>
        </div>
        <div>
          Min: {Math.round(minValue)} • Max: {Math.round(maxValue)} • Moy:{' '}
          {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;

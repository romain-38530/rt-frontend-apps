import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  trend?: number | string;
  trendLabel?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
  compact?: boolean;
}

const statusColors = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  neutral: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  trend,
  trendLabel,
  status = 'neutral',
  subtitle,
  onClick,
  loading = false,
  compact = false,
}) => {
  const colors = statusColors[status];
  const trendValue = typeof trend === 'string' ? parseFloat(trend) : trend;
  const isPositiveTrend = trendValue !== undefined && trendValue > 0;
  const isNegativeTrend = trendValue !== undefined && trendValue < 0;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-${compact ? '4' : '6'} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow ${colors.border} border p-${compact ? '4' : '6'} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
              {value}
            </p>
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : isNegativeTrend ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositiveTrend ? 'text-green-600' : isNegativeTrend ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {isPositiveTrend ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;

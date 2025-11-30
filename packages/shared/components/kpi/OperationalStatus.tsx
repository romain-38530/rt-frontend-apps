import React from 'react';
import {
  Truck,
  Clock,
  Target,
  Users,
  Calendar,
  Brain,
  Shield,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import type { OperationalKPIs } from '../../services/kpi-api';

export interface OperationalStatusProps {
  data: OperationalKPIs;
  loading?: boolean;
}

const StatusIndicator: React.FC<{ value: number; thresholds: { warning: number; danger: number }; inverse?: boolean }> = ({
  value,
  thresholds,
  inverse = false,
}) => {
  let color = 'bg-green-500';
  if (inverse) {
    if (value >= thresholds.danger) color = 'bg-red-500';
    else if (value >= thresholds.warning) color = 'bg-yellow-500';
  } else {
    if (value <= thresholds.danger) color = 'bg-red-500';
    else if (value <= thresholds.warning) color = 'bg-yellow-500';
  }
  return <div className={`w-3 h-3 rounded-full ${color}`} />;
};

export const OperationalStatus: React.FC<OperationalStatusProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      icon: Truck,
      label: 'Transports en cours',
      value: data.transportsInProgress?.total || 0,
      subtitle: `${data.transportsInProgress?.byStatus?.delayed || 0} en retard`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Clock,
      label: 'Taux de retard',
      value: `${data.delays?.percentage || 0}%`,
      subtitle: `Moy. ${data.delays?.averageMinutes || 0} min`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      indicator: { value: parseFloat(data.delays?.percentage || '0'), thresholds: { warning: 8, danger: 15 }, inverse: true },
    },
    {
      icon: Target,
      label: 'Precision ETA',
      value: `${data.eta?.accuracy || 0}%`,
      subtitle: `Ecart moy. ${data.eta?.averageDeviation || 0} min`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      indicator: { value: parseFloat(data.eta?.accuracy || '0'), thresholds: { warning: 90, danger: 80 } },
    },
    {
      icon: Users,
      label: 'Temps acceptation',
      value: `${data.orderAcceptance?.averageTimeMinutes || 0} min`,
      subtitle: `${data.orderAcceptance?.pendingOrders || 0} en attente`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Calendar,
      label: 'Saturation planning',
      value: `${data.planning?.saturationLevel || 0}%`,
      subtitle: `${data.planning?.availableSlots || 0} creneaux libres`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      indicator: { value: parseFloat(data.planning?.saturationLevel || '0'), thresholds: { warning: 75, danger: 90 }, inverse: true },
    },
    {
      icon: Brain,
      label: 'Affret.IA actif',
      value: data.affretIA?.activeOrders || 0,
      subtitle: `Match ${data.affretIA?.matchRate || 0}%`,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: Shield,
      label: 'Vigilance',
      value: `${data.vigilance?.blockedCarriers || 0} bloques`,
      subtitle: `${data.vigilance?.pendingValidations || 0} validations`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: MessageSquare,
      label: 'Reponse transporteurs',
      value: `${data.carrierResponse?.averageRate || 0}%`,
      subtitle: `${data.carrierResponse?.belowThreshold || 0} sous seuil`,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      indicator: { value: parseFloat(data.carrierResponse?.averageRate || '0'), thresholds: { warning: 85, danger: 70 } },
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Statut Operationnel Temps Reel</h3>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
          Actualise: {new Date(data.timestamp).toLocaleTimeString('fr-FR')}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className={`${metric.bgColor} rounded-lg p-4`}>
            <div className="flex items-start justify-between">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              {metric.indicator && (
                <StatusIndicator
                  value={metric.indicator.value}
                  thresholds={metric.indicator.thresholds}
                  inverse={metric.indicator.inverse}
                />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Transport Status Breakdown */}
      <div className="p-4 border-t bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Repartition des transports</h4>
        <div className="flex items-center gap-2">
          {[
            { label: 'En route', value: data.transportsInProgress?.byStatus?.enRoute || 0, color: 'bg-blue-500' },
            { label: 'Chargement', value: data.transportsInProgress?.byStatus?.loading || 0, color: 'bg-green-500' },
            { label: 'Dechargement', value: data.transportsInProgress?.byStatus?.unloading || 0, color: 'bg-purple-500' },
            { label: 'En attente', value: data.transportsInProgress?.byStatus?.waiting || 0, color: 'bg-yellow-500' },
            { label: 'En retard', value: data.transportsInProgress?.byStatus?.delayed || 0, color: 'bg-red-500' },
          ].map((status) => {
            const total = data.transportsInProgress?.total || 1;
            const percentage = ((status.value / total) * 100).toFixed(0);
            return (
              <div key={status.label} className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{status.label}</span>
                  <span className="font-medium">{status.value}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${status.color}`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OperationalStatus;

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  FileX,
  Truck,
  MapPin,
  Ban,
  CheckCircle,
  Bell,
  XCircle,
} from 'lucide-react';
import type { Alert } from '../../services/kpi-api';

export interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  compact?: boolean;
}

const alertConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  delay_detected: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  driver_inactive: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  dock_blocked: { icon: MapPin, color: 'text-red-600', bgColor: 'bg-red-50' },
  missing_documents: { icon: FileX, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  assignment_refused_chain: { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-50' },
  eta_anomaly: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  vigilance_issue: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  no_show: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  capacity_warning: { icon: AlertTriangle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  cost_anomaly: { icon: AlertCircle, color: 'text-pink-600', bgColor: 'bg-pink-50' },
};

const severityConfig = {
  critical: { border: 'border-red-500', badge: 'bg-red-100 text-red-800' },
  high: { border: 'border-orange-500', badge: 'bg-orange-100 text-orange-800' },
  medium: { border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
  low: { border: 'border-blue-500', badge: 'bg-blue-100 text-blue-800' },
};

const severityLabels = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  compact = false,
}) => {
  const config = alertConfig[alert.type] || { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  const Icon = config.icon;
  const severity = severityConfig[alert.severity];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} border-l-4 ${severity.border}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
          <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severity.badge}`}>
          {severityLabels[alert.severity]}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${severity.border} p-4`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{alert.title}</h4>
              {alert.message && (
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              )}
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${severity.badge}`}>
              {severityLabels[alert.severity]}
            </span>
          </div>

          {alert.entityType && alert.entityId && (
            <p className="text-xs text-gray-500 mt-2">
              {alert.entityType}: {alert.entityId}
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">{formatDate(alert.createdAt)}</span>
            <div className="flex gap-2">
              {!alert.acknowledged && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert.alertId)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Acquitter
                </button>
              )}
              {alert.acknowledged && !alert.resolved && onResolve && (
                <button
                  onClick={() => onResolve(alert.alertId)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Resoudre
                </button>
              )}
              {alert.acknowledged && (
                <span className="flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Acquitte
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;

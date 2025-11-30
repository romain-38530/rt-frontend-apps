import React from 'react';
import { AlertTriangle, CheckCircle, MessageSquare, XCircle } from 'lucide-react';

export interface Discrepancy {
  _id?: string;
  type: 'price_global' | 'distance' | 'options' | 'palettes' | 'waiting_time' | 'volume' | 'other';
  description: string;
  expectedValue: any;
  actualValue: any;
  difference: number;
  differencePercent: number;
  status: 'detected' | 'justified' | 'contested' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface DiscrepancyCardProps {
  discrepancy: Discrepancy;
  index: number;
  onAccept?: (index: number) => void;
  onContest?: (index: number) => void;
  onResolve?: (index: number, resolution: string) => void;
  showActions?: boolean;
  userRole?: 'industry' | 'transporter' | 'admin';
}

const typeLabels: Record<string, string> = {
  price_global: 'Écart de prix global',
  distance: 'Écart kilométrique',
  options: 'Options non conformes',
  palettes: 'Écart palettes',
  waiting_time: "Temps d'attente",
  volume: 'Écart de volume',
  other: 'Autre écart',
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  detected: { icon: AlertTriangle, color: 'text-yellow-600', label: 'Détecté' },
  justified: { icon: CheckCircle, color: 'text-blue-600', label: 'Justifié' },
  contested: { icon: MessageSquare, color: 'text-orange-600', label: 'Contesté' },
  resolved: { icon: CheckCircle, color: 'text-green-600', label: 'Résolu' },
};

export const DiscrepancyCard: React.FC<DiscrepancyCardProps> = ({
  discrepancy,
  index,
  onAccept,
  onContest,
  onResolve,
  showActions = true,
  userRole = 'industry',
}) => {
  const StatusIcon = statusConfig[discrepancy.status]?.icon || AlertTriangle;
  const statusColor = statusConfig[discrepancy.status]?.color || 'text-gray-600';
  const statusLabel = statusConfig[discrepancy.status]?.label || discrepancy.status;

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    return String(value ?? '-');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${discrepancy.status === 'resolved' ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{typeLabels[discrepancy.type] || discrepancy.type}</h4>
            <p className="text-sm text-gray-600 mt-1">{discrepancy.description}</p>

            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Attendu:</span>
                <span className="ml-2 font-medium">{formatValue(discrepancy.expectedValue)}</span>
              </div>
              <div>
                <span className="text-gray-500">Déclaré:</span>
                <span className="ml-2 font-medium">{formatValue(discrepancy.actualValue)}</span>
              </div>
              <div>
                <span className="text-gray-500">Écart:</span>
                <span className={`ml-2 font-medium ${discrepancy.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {discrepancy.difference > 0 ? '+' : ''}
                  {typeof discrepancy.expectedValue === 'number'
                    ? formatCurrency(discrepancy.difference)
                    : formatValue(discrepancy.difference)}
                  {discrepancy.differencePercent !== undefined && (
                    <span className="text-gray-500 ml-1">({discrepancy.differencePercent.toFixed(1)}%)</span>
                  )}
                </span>
              </div>
            </div>

            {discrepancy.resolution && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Résolution:</span>
                <span className="ml-2">{discrepancy.resolution}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            discrepancy.status === 'resolved' ? 'bg-green-100 text-green-800' :
            discrepancy.status === 'contested' ? 'bg-orange-100 text-orange-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {showActions && discrepancy.status === 'detected' && (
        <div className="mt-4 pt-3 border-t flex justify-end gap-2">
          {userRole === 'transporter' && (
            <>
              <button
                onClick={() => onAccept?.(index)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Accepter
              </button>
              <button
                onClick={() => onContest?.(index)}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Contester
              </button>
            </>
          )}
          {(userRole === 'industry' || userRole === 'admin') && (
            <button
              onClick={() => onResolve?.(index, '')}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Résoudre
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscrepancyCard;

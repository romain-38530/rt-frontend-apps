import React from 'react';
import { FileText, Euro, AlertTriangle, AlertCircle, CheckCircle, Clock, TrendingUp, Archive } from 'lucide-react';

export interface BillingKPIs {
  totalPrefacturations: number;
  montantTotalHT: number;
  montantTotalTTC?: number;
  enAttente: number;
  ecarts: number;
  blocages: number;
  tauxValidation: number;
  finalisees?: number;
  exportees?: number;
  archivees?: number;
}

interface BillingKPICardsProps {
  kpis: BillingKPIs;
  loading?: boolean;
  showExtended?: boolean;
  onKPIClick?: (kpi: string) => void;
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  trend?: number;
  onClick?: () => void;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  onClick,
  loading,
}) => (
  <div
    className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    {loading ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    )}
  </div>
);

export const BillingKPICards: React.FC<BillingKPICardsProps> = ({
  kpis,
  loading = false,
  showExtended = false,
  onKPIClick,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const mainKPIs = [
    {
      key: 'total',
      title: 'Préfacturations',
      value: kpis.totalPrefacturations,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      key: 'montant',
      title: 'Montant total HT',
      value: formatCurrency(kpis.montantTotalHT),
      icon: Euro,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
    },
    {
      key: 'ecarts',
      title: 'Avec écarts',
      value: kpis.ecarts,
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
    },
    {
      key: 'blocages',
      title: 'Blocages actifs',
      value: kpis.blocages,
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-red-100',
    },
  ];

  const extendedKPIs = [
    {
      key: 'attente',
      title: 'En attente',
      value: kpis.enAttente,
      icon: Clock,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
    {
      key: 'validation',
      title: 'Taux validation',
      value: `${kpis.tauxValidation.toFixed(1)}%`,
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-100',
    },
    ...(kpis.finalisees !== undefined
      ? [
          {
            key: 'finalisees',
            title: 'Finalisées',
            value: kpis.finalisees,
            icon: CheckCircle,
            iconColor: 'text-indigo-600',
            iconBgColor: 'bg-indigo-100',
          },
        ]
      : []),
    ...(kpis.archivees !== undefined
      ? [
          {
            key: 'archivees',
            title: 'Archivées',
            value: kpis.archivees,
            icon: Archive,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-100',
          },
        ]
      : []),
  ];

  const displayKPIs = showExtended ? [...mainKPIs, ...extendedKPIs] : mainKPIs;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(displayKPIs.length, 4)} gap-4`}>
      {displayKPIs.map((kpi) => (
        <KPICard
          key={kpi.key}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          iconColor={kpi.iconColor}
          iconBgColor={kpi.iconBgColor}
          onClick={onKPIClick ? () => onKPIClick(kpi.key) : undefined}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default BillingKPICards;

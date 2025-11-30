import React from 'react';

export type BillingStatus =
  | 'draft'
  | 'generated'
  | 'discrepancy_detected'
  | 'pending_validation'
  | 'validated'
  | 'contested'
  | 'conflict_closed'
  | 'blocked'
  | 'finalized'
  | 'exported'
  | 'archived';

interface BillingStatusBadgeProps {
  status: BillingStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<BillingStatus, { label: string; bgColor: string; textColor: string }> = {
  draft: { label: 'Brouillon', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  generated: { label: 'Générée', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  discrepancy_detected: { label: 'Écarts détectés', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  pending_validation: { label: 'En attente', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  validated: { label: 'Validée', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  contested: { label: 'Contestée', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  conflict_closed: { label: 'Conflit clos', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  blocked: { label: 'Bloquée', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  finalized: { label: 'Finalisée', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  exported: { label: 'Exportée', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  archived: { label: 'Archivée', bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const BillingStatusBadge: React.FC<BillingStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

export default BillingStatusBadge;

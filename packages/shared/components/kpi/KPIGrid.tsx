import React from 'react';
import { KPICard, KPICardProps } from './KPICard';

export interface KPIGridProps {
  kpis: KPICardProps[];
  columns?: 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  columns = 4,
  loading = false,
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
};

export default KPIGrid;

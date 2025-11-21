import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
}

const colorClasses = {
  primary: 'from-blue-500 to-blue-700',
  success: 'from-green-500 to-green-700',
  warning: 'from-yellow-500 to-yellow-700',
  danger: 'from-red-500 to-red-700',
  purple: 'from-purple-500 to-purple-700',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <Icon size={24} />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <span className={`font-semibold ${trend.isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="opacity-80">vs. dernier mois</span>
        </div>
      )}
    </div>
  );
}

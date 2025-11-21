import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, subtitle, icon: Icon, action, children, className = '' }: DashboardCardProps) {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="card-header-modern">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

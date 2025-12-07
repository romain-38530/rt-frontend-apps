import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'large';
  illustration?: 'empty' | 'search' | 'error' | 'success' | 'custom';
}

const illustrations: Record<string, string> = {
  empty: '📭',
  search: '🔍',
  error: '⚠️',
  success: '✅',
  custom: '',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  illustration = 'empty',
}) => {
  const sizeStyles = {
    compact: { padding: '24px', iconSize: '32px', titleSize: '16px', descSize: '13px' },
    default: { padding: '40px', iconSize: '48px', titleSize: '18px', descSize: '14px' },
    large: { padding: '60px', iconSize: '64px', titleSize: '22px', descSize: '16px' },
  };

  const sizes = sizeStyles[variant];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sizes.padding,
        textAlign: 'center',
      }}
      role="status"
      aria-label={title}
    >
      {/* Icon/Illustration */}
      <div
        style={{
          width: sizes.iconSize,
          height: sizes.iconSize,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: sizes.iconSize,
          opacity: 0.8,
        }}
      >
        {icon || illustrations[illustration]}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: sizes.titleSize,
          fontWeight: 600,
          color: '#1e293b',
          margin: '0 0 8px 0',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: sizes.descSize,
            color: '#64748b',
            margin: '0 0 20px 0',
            maxWidth: '400px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-built empty states for common scenarios
export const EmptyStateNoData: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    illustration="empty"
    title="Aucune donnée disponible"
    description="Il n'y a pas encore de données à afficher ici."
    action={onRefresh ? { label: 'Actualiser', onClick: onRefresh } : undefined}
  />
);

export const EmptyStateNoResults: React.FC<{ searchTerm?: string; onClear?: () => void }> = ({
  searchTerm,
  onClear,
}) => (
  <EmptyState
    illustration="search"
    title="Aucun résultat trouvé"
    description={
      searchTerm
        ? `Aucun résultat pour "${searchTerm}". Essayez avec d'autres termes.`
        : "Votre recherche n'a retourné aucun résultat."
    }
    action={onClear ? { label: 'Effacer la recherche', onClick: onClear } : undefined}
  />
);

export const EmptyStateError: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <EmptyState
    illustration="error"
    title="Une erreur est survenue"
    description={message || "Impossible de charger les données. Veuillez réessayer."}
    action={onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined}
  />
);

export default EmptyState;

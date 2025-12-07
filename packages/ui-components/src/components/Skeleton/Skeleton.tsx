import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  variant = 'text',
  animation = 'pulse',
  className,
  style,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: '#e2e8f0',
    display: 'block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    text: { borderRadius: '4px' },
    circular: { borderRadius: '50%' },
    rectangular: { borderRadius: '0' },
    rounded: { borderRadius: '8px' },
  };

  const animationStyles: Record<string, string> = {
    pulse: 'skeleton-pulse 1.5s ease-in-out infinite',
    wave: 'skeleton-wave 1.5s ease-in-out infinite',
    none: 'none',
  };

  return (
    <>
      <style>
        {`
          @keyframes skeleton-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          @keyframes skeleton-wave {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
        `}
      </style>
      <span
        className={className}
        style={{
          ...baseStyles,
          ...variantStyles[variant],
          animation: animationStyles[animation],
          ...(animation === 'wave' && {
            backgroundImage: 'linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px)',
            backgroundSize: '200px 100%',
          }),
          ...style,
        }}
        aria-hidden="true"
      />
    </>
  );
};

// Pre-built skeleton patterns
export interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showAvatar = false,
  showImage = false,
}) => {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement en cours"
      style={{
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {showImage && (
        <Skeleton variant="rounded" height={160} style={{ marginBottom: '16px' }} />
      )}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {showAvatar && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        <div style={{ flex: 1 }}>
          <Skeleton height={20} width="60%" style={{ marginBottom: '12px' }} />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              height={14}
              width={i === lines - 1 ? '40%' : '100%'}
              style={{ marginBottom: i < lines - 1 ? '8px' : '0' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div aria-busy="true" aria-label="Chargement du tableau" style={{ overflow: 'hidden', borderRadius: '12px', background: 'white' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
          padding: '16px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} width="70%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            padding: '16px 20px',
            borderBottom: rowIndex < rows - 1 ? '1px solid #f1f5f9' : 'none',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height={14}
              width={colIndex === 0 ? '80%' : '60%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonGridProps {
  items?: number;
  columns?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  items = 4,
  columns = 4,
}) => {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement de la grille"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
        gap: '20px',
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
};

export default Skeleton;

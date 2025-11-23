import React, { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  gradient?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  gradient,
  hover = false,
  padding = 'md',
  onClick,
  className = ''
}) => {
  const getPaddingStyles = (): CSSProperties => {
    const paddings: Record<string, string> = {
      sm: '16px',
      md: '24px',
      lg: '32px'
    };
    return { padding: paddings[padding] };
  };

  const baseStyles: CSSProperties = {
    background: gradient || 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...getPaddingStyles()
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {children}
    </div>
  );
};

export interface GlassCardProps {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hover = false,
  padding = 'md',
  onClick,
  className = ''
}) => {
  const getPaddingStyles = (): CSSProperties => {
    const paddings: Record<string, string> = {
      sm: '16px',
      md: '24px',
      lg: '32px'
    };
    return { padding: paddings[padding] };
  };

  const baseStyles: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...getPaddingStyles()
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {children}
    </div>
  );
};

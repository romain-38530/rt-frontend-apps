import React, { CSSProperties, ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  gradient?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  gradient,
  className = ''
}) => {
  const getVariantStyles = (): CSSProperties => {
    if (gradient) {
      return {
        background: gradient,
        color: 'white',
        border: 'none'
      };
    }

    const variants: Record<string, CSSProperties> = {
      primary: {
        background: '#6366F1',
        color: 'white',
        border: 'none'
      },
      secondary: {
        background: '#8B5CF6',
        color: 'white',
        border: 'none'
      },
      outline: {
        background: 'transparent',
        color: '#6366F1',
        border: '2px solid #6366F1'
      },
      ghost: {
        background: 'rgba(99, 102, 241, 0.1)',
        color: '#6366F1',
        border: 'none'
      },
      danger: {
        background: '#EF4444',
        color: 'white',
        border: 'none'
      }
    };

    return variants[variant];
  };

  const getSizeStyles = (): CSSProperties => {
    const sizes: Record<string, CSSProperties> = {
      sm: {
        padding: '8px 16px',
        fontSize: '14px'
      },
      md: {
        padding: '12px 24px',
        fontSize: '16px'
      },
      lg: {
        padding: '16px 32px',
        fontSize: '18px'
      }
    };

    return sizes[size];
  };

  const baseStyles: CSSProperties = {
    fontWeight: '600',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...getVariantStyles(),
    ...getSizeStyles()
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </button>
  );
};

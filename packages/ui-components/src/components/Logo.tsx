import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  variant = 'light',
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 32,
      fontSize: '18px',
      taglineSize: '9px',
      gap: '8px'
    },
    md: {
      iconSize: 40,
      fontSize: '24px',
      taglineSize: '11px',
      gap: '12px'
    },
    lg: {
      iconSize: 56,
      fontSize: '32px',
      taglineSize: '13px',
      gap: '16px'
    }
  };

  const config = sizeConfig[size];
  const colors = variant === 'light' ? {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    gradient1: '#ffffff',
    gradient2: 'rgba(255, 255, 255, 0.8)'
  } : {
    primary: '#1a202c',
    secondary: '#4a5568',
    gradient1: '#f093fb',
    gradient2: '#f5576c'
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: config.gap,
        cursor: 'pointer'
      }}
    >
      {/* SVG Icon - Abstract orchestration symbol */}
      <svg
        width={config.iconSize}
        height={config.iconSize}
        viewBox="0 0 100 100"
        style={{
          transition: 'transform 0.3s ease',
        }}>
        <defs>
          {/* Gradient for the icon */}
          <linearGradient id={`logoGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.gradient1, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.gradient2, stopOpacity: 1 }} />
          </linearGradient>

          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main orchestration symbol - flowing waves representing transport routes and sound waves */}
        <g transform="translate(50, 50)">
          {/* Central AI node */}
          <circle
            cx="0"
            cy="0"
            r="8"
            fill={variant === 'light' ? colors.primary : `url(#logoGradient-${variant})`}
            filter="url(#glow)"
          />

          {/* Flowing wave paths - representing orchestration */}
          {/* Top wave */}
          <path
            d="M -30,-20 Q -15,-25 0,-20 Q 15,-15 30,-20"
            stroke={variant === 'light' ? colors.primary : `url(#logoGradient-${variant})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            style={{
              animation: 'wave1 2s ease-in-out infinite'
            }}
          />

          {/* Middle wave */}
          <path
            d="M -35,0 Q -17.5,-5 0,0 Q 17.5,5 35,0"
            stroke={variant === 'light' ? colors.primary : `url(#logoGradient-${variant})`}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
            style={{
              animation: 'wave2 2.5s ease-in-out infinite'
            }}
          />

          {/* Bottom wave */}
          <path
            d="M -30,20 Q -15,15 0,20 Q 15,25 30,20"
            stroke={variant === 'light' ? colors.primary : `url(#logoGradient-${variant})`}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            style={{
              animation: 'wave3 3s ease-in-out infinite'
            }}
          />

          {/* Connection nodes - representing network */}
          <circle cx="-30" cy="-20" r="3" fill={colors.primary} opacity="0.8" />
          <circle cx="30" cy="-20" r="3" fill={colors.primary} opacity="0.8" />
          <circle cx="-35" cy="0" r="4" fill={colors.primary} opacity="0.9" />
          <circle cx="35" cy="0" r="4" fill={colors.primary} opacity="0.9" />
          <circle cx="-30" cy="20" r="3" fill={colors.primary} opacity="0.8" />
          <circle cx="30" cy="20" r="3" fill={colors.primary} opacity="0.8" />
        </g>

        {/* CSS animations for the waves */}
        <style>{`
          @keyframes wave1 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes wave2 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(2px); }
          }
          @keyframes wave3 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
        `}</style>
      </svg>

      {/* Text content */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{
          fontSize: config.fontSize,
          fontWeight: '800',
          margin: 0,
          letterSpacing: '0.5px',
          color: colors.primary,
          background: variant === 'dark' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'none',
          WebkitBackgroundClip: variant === 'dark' ? 'text' : 'none',
          WebkitTextFillColor: variant === 'dark' ? 'transparent' : colors.primary,
          backgroundClip: variant === 'dark' ? 'text' : 'none',
        }}>
          SYMPHONI.A
        </h1>
        {showTagline && (
          <p style={{
            fontSize: config.taglineSize,
            margin: 0,
            opacity: 0.9,
            fontStyle: 'italic',
            marginTop: '2px',
            color: colors.secondary
          }}>
            L'IA qui orchestre vos flux transport.
          </p>
        )}
      </div>
    </div>
  );
};

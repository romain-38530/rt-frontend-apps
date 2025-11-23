import React from 'react';

export interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
  gradient?: string;
  logoText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onLogout,
  gradient,
  logoText = 'RT Technologie'
}) => {
  return (
    <header
      style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: gradient ? 'rgba(0,0,0,0.1)' : 'white',
        backdropFilter: gradient ? 'blur(10px)' : 'none',
        boxShadow: gradient ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.05)',
        color: gradient ? 'white' : '#111827'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            fontSize: '24px',
            fontWeight: '800',
            background: gradient || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: gradient ? 'unset' : 'text',
            WebkitTextFillColor: gradient ? 'white' : 'transparent',
            backgroundClip: gradient ? 'unset' : 'text',
            letterSpacing: '-0.5px'
          }}
        >
          {logoText}
        </div>
      </div>

      {userEmail && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              fontSize: '14px',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ opacity: 0.7 }}>Connecté :</span>
            <strong>{userEmail}</strong>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                padding: '10px 20px',
                background: gradient ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                color: gradient ? 'white' : '#111827',
                border: gradient ? '1px solid rgba(255,255,255,0.3)' : '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = gradient
                  ? 'rgba(255,255,255,0.3)'
                  : '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = gradient
                  ? 'rgba(255,255,255,0.2)'
                  : '#F3F4F6';
              }}
            >
              Se déconnecter
            </button>
          )}
        </div>
      )}
    </header>
  );
};

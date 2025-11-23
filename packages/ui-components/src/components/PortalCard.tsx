import React from 'react';
import { PortalConfig } from '../types/portal';

export interface PortalCardProps {
  portal: PortalConfig;
  onClick?: () => void;
}

export const PortalCard: React.FC<PortalCardProps> = ({ portal, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = portal.gradient.match(/#[0-9a-f]{6}/i)?.[0] || '#6366F1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: portal.gradient
        }}
      />

      {/* Icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {portal.icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '12px',
          textAlign: 'center'
        }}
      >
        {portal.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '20px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}
      >
        {portal.description}
      </p>

      {/* Features */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {portal.features.slice(0, 3).map((feature, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#4B5563'
            }}
          >
            <span style={{ fontSize: '16px' }}>•</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div
        style={{
          marginTop: '24px',
          padding: '12px',
          background: portal.gradient,
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px'
        }}
      >
        Accéder au portail
      </div>
    </div>
  );
};

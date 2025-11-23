import React from 'react';
import { SubscriptionPlan } from '../types/subscription';
import { Button } from './Button';
import { subscriptionColors } from '../styles/colors';

export interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentTier?: string;
  onSelect?: (planId: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  currentTier,
  onSelect
}) => {
  const isCurrentPlan = currentTier === plan.id;
  const gradient = subscriptionColors[plan.id]?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: plan.highlighted
          ? '0 20px 60px rgba(99, 102, 241, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: plan.highlighted
          ? '3px solid #6366F1'
          : '1px solid #E5E7EB',
        position: 'relative',
        transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {plan.highlighted && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: gradient,
            color: 'white',
            padding: '6px 20px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Populaire
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}
        >
          {plan.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span
            style={{
              fontSize: '48px',
              fontWeight: '800',
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
          </span>
          {plan.price > 0 && (
            <span style={{ fontSize: '16px', color: '#6B7280' }}>
              /mois
            </span>
          )}
        </div>
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          marginBottom: '32px',
          flex: 1
        }}
      >
        {plan.features.map((feature, index) => (
          <li
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '12px',
              color: '#374151',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrentPlan ? 'outline' : 'primary'}
        gradient={!isCurrentPlan ? gradient : undefined}
        fullWidth
        onClick={() => onSelect?.(plan.id)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
      </Button>
    </div>
  );
};

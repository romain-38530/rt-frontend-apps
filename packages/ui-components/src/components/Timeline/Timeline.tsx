/**
 * Timeline événementielle
 * Affiche la chronologie des événements d'une commande
 */

import React from 'react';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  compact?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  onEventClick,
  compact = false,
}) => {
  const getEventColor = (type: string): string => {
    const colors: Record<string, string> = {
      created: '#3b82f6',
      sent: '#8b5cf6',
      accepted: '#10b981',
      rejected: '#ef4444',
      in_transit: '#f59e0b',
      delivered: '#22c55e',
      cancelled: '#dc2626',
      default: '#6b7280',
    };
    return colors[type] || colors.default;
  };

  const getEventIcon = (type: string): string => {
    const icons: Record<string, string> = {
      created: '✅',
      sent: '📨',
      accepted: '👍',
      rejected: '👎',
      in_transit: '🚛',
      delivered: '✨',
      cancelled: '❌',
      document: '📄',
      tracking: '📍',
      default: '📌',
    };
    return icons[type] || icons.default;
  };

  return (
    <div style={{ position: 'relative', paddingLeft: compact ? '30px' : '40px' }}>
      {/* Ligne verticale */}
      <div
        style={{
          position: 'absolute',
          left: compact ? '12px' : '16px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          backgroundColor: '#e5e7eb',
        }}
      />

      {/* Événements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '16px' }}>
        {events.map((event, index) => (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            style={{
              position: 'relative',
              cursor: onEventClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Point */}
            <div
              style={{
                position: 'absolute',
                left: compact ? '-26px' : '-34px',
                top: compact ? '4px' : '8px',
                width: compact ? '24px' : '32px',
                height: compact ? '24px' : '32px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: `3px solid ${event.color || getEventColor(event.type)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '12px' : '16px',
                zIndex: 1,
              }}
            >
              {event.icon || getEventIcon(event.type)}
            </div>

            {/* Contenu */}
            <div
              style={{
                padding: compact ? '12px 16px' : '16px 20px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: `1px solid #e5e7eb`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? '4px' : '8px' }}>
                <h4
                  style={{
                    fontSize: compact ? '14px' : '16px',
                    fontWeight: '700',
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  {event.title}
                </h4>
                <div
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    color: '#6b7280',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                >
                  {new Date(event.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {event.description && (
                <p
                  style={{
                    fontSize: compact ? '12px' : '14px',
                    color: '#6b7280',
                    margin: 0,
                    marginBottom: compact ? '4px' : '8px',
                  }}
                >
                  {event.description}
                </p>
              )}

              {event.actor && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                  }}
                >
                  Par {event.actor}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;

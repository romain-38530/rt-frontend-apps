import React, { useState, useEffect, useCallback } from 'react';

export interface TrackingEvent {
  id: string;
  type: 'gps' | 'status' | 'eta' | 'alert' | 'ai_insight';
  timestamp: string;
  title: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
  metadata?: {
    confidence?: number;
    source?: string;
    aiGenerated?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AIInsight {
  id: string;
  type: 'delay_risk' | 'route_optimization' | 'delivery_prediction' | 'anomaly_detection' | 'performance';
  title: string;
  description: string;
  confidence: number;
  recommendation?: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrackingFeedProps {
  orderId: string;
  events?: TrackingEvent[];
  insights?: AIInsight[];
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
  apiUrl?: string;
}

const EVENT_ICONS: Record<string, string> = {
  gps: '📍',
  status: '📋',
  eta: '⏰',
  alert: '⚠️',
  ai_insight: '🤖',
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  medium: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  high: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  critical: { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' },
};

// Default API URL - can be overridden via props
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://orders.rt-api.com';

export const TrackingFeed: React.FC<TrackingFeedProps> = ({
  orderId,
  events: initialEvents = [],
  insights: initialInsights = [],
  onRefresh,
  autoRefresh = false,
  refreshInterval = 30000,
  compact = false,
  apiUrl = DEFAULT_API_URL,
}) => {
  const [events, setEvents] = useState<TrackingEvent[]>(initialEvents);
  const [insights, setInsights] = useState<AIInsight[]>(initialInsights);
  const [activeTab, setActiveTab] = useState<'events' | 'ai'>('events');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch tracking data from API
  const fetchTrackingData = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/tracking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Update events
        if (result.data.events && result.data.events.length > 0) {
          setEvents(result.data.events);
        }

        // Update insights
        if (result.data.insights && result.data.insights.length > 0) {
          setInsights(result.data.insights);
        }

        setLastUpdate(new Date(result.data.lastUpdate || new Date()));
      }

      setHasLoaded(true);
    } catch (err) {
      console.error('Erreur lors du chargement du tracking:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');

      // Use initial events/insights if API fails and we have them
      if (initialEvents.length > 0) {
        setEvents(initialEvents);
      }
      if (initialInsights.length > 0) {
        setInsights(initialInsights);
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId, apiUrl, initialEvents, initialInsights]);

  // Initial load
  useEffect(() => {
    if (!hasLoaded && orderId) {
      fetchTrackingData();
    }
  }, [orderId, hasLoaded, fetchTrackingData]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && orderId) {
      const interval = setInterval(() => {
        fetchTrackingData();
        if (onRefresh) {
          onRefresh();
        }
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, orderId, refreshInterval, fetchTrackingData, onRefresh]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchTrackingData();
    if (onRefresh) {
      onRefresh();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: compact ? '8px' : '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: compact ? '12px 16px' : '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📡</span>
          <div>
            <h3 style={{ margin: 0, fontSize: compact ? '14px' : '16px', fontWeight: '700', color: '#111827' }}>
              Tracking en temps réel
            </h3>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Dernière mise à jour: {formatTime(lastUpdate.toISOString())}
              {autoRefresh && <span> (auto)</span>}
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isLoading ? '⏳' : '🔄'} Actualiser
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#991b1b',
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'events' ? '#667eea' : 'transparent',
            color: activeTab === 'events' ? 'white' : '#6b7280',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📍 Événements ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'ai' ? '#667eea' : 'transparent',
            color: activeTab === 'ai' ? 'white' : '#6b7280',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🤖 Insights IA ({insights.length})
        </button>
      </div>

      {/* Loading state */}
      {isLoading && !hasLoaded && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div>Chargement du tracking...</div>
        </div>
      )}

      {/* Content */}
      {(!isLoading || hasLoaded) && (
        <div style={{ padding: compact ? '12px' : '16px', maxHeight: '400px', overflow: 'auto' }}>
          {activeTab === 'events' && (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Timeline line */}
              {events.length > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '7px',
                  top: '8px',
                  bottom: '8px',
                  width: '2px',
                  backgroundColor: '#e5e7eb',
                }} />
              )}

              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', paddingLeft: 0 }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📡</div>
                  <div>Aucun événement de tracking</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Les événements apparaîtront ici en temps réel
                  </div>
                </div>
              ) : (
                events.map((event, idx) => (
                  <div
                    key={event.id}
                    style={{
                      position: 'relative',
                      paddingBottom: idx < events.length - 1 ? '16px' : '0',
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '4px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: event.type === 'ai_insight' ? '#f59e0b' : '#667eea',
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                    }} />

                    <div style={{
                      padding: '12px',
                      backgroundColor: event.type === 'ai_insight' ? '#fef3c7' : '#f9fafb',
                      borderRadius: '8px',
                      border: event.type === 'ai_insight' ? '1px solid #fcd34d' : '1px solid #e5e7eb',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span>{EVENT_ICONS[event.type] || '📌'}</span>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>
                          {event.title}
                        </span>
                        {event.metadata?.aiGenerated && (
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: '700',
                          }}>
                            IA
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        {event.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#9ca3af' }}>
                        <span>{formatDate(event.timestamp)}</span>
                        {event.location?.city && <span>📍 {event.location.city}</span>}
                        {event.metadata?.confidence && (
                          <span>Confiance: {event.metadata.confidence}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                  <div>Aucune analyse IA disponible</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Les insights IA apparaîtront au fur et à mesure
                  </div>
                </div>
              ) : (
                insights.map((insight) => {
                  const colors = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.low;
                  return (
                    <div
                      key={insight.id}
                      style={{
                        padding: '16px',
                        backgroundColor: colors.bg,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🤖</span>
                        <span style={{ fontWeight: '700', color: colors.text, fontSize: '14px' }}>
                          {insight.title}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          padding: '2px 8px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: colors.text,
                        }}>
                          {insight.confidence}% confiance
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                        {insight.description}
                      </div>
                      {insight.recommendation && (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255,255,255,0.5)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.text,
                        }}>
                          💡 {insight.recommendation}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '8px' }}>
                        {formatDate(insight.timestamp)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingFeed;

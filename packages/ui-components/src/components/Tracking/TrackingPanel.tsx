/**
 * Panneau d'informations de tracking temps réel
 * Affiche ETA, distance, vitesse, alertes, etc.
 */

import React from 'react';
import type {
  TrackingSession,
  TrackingPosition,
  ETA,
  TrafficInfo,
  TrackingAlert,
  TrackingLevel,
} from '@rt/contracts';

interface TrackingPanelProps {
  session: TrackingSession;
  onRefresh?: () => void;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  onPauseTracking?: () => void;
  onResumeTracking?: () => void;
  isLoading?: boolean;
}

const TRACKING_LEVEL_LABELS: Record<TrackingLevel, { label: string; icon: string; color: string }> = {
  basic: { label: 'Email de base', icon: '📧', color: '#6b7280' },
  gps: { label: 'GPS Smartphone', icon: '📱', color: '#3b82f6' },
  premium: { label: 'TomTom Premium', icon: '🛰️', color: '#8b5cf6' },
};

const TRAFFIC_LABELS: Record<TrafficInfo['level'], { label: string; icon: string; color: string }> = {
  free: { label: 'Fluide', icon: '🟢', color: '#10b981' },
  light: { label: 'Léger', icon: '🟡', color: '#84cc16' },
  moderate: { label: 'Modéré', icon: '🟠', color: '#f59e0b' },
  heavy: { label: 'Dense', icon: '🔴', color: '#ef4444' },
  blocked: { label: 'Bloqué', icon: '⛔', color: '#dc2626' },
};

export const TrackingPanel: React.FC<TrackingPanelProps> = ({
  session,
  onRefresh,
  onStartTracking,
  onStopTracking,
  onPauseTracking,
  onResumeTracking,
  isLoading = false,
}) => {
  const trackingInfo = TRACKING_LEVEL_LABELS[session.trackingLevel];
  const trafficInfo = session.traffic && TRAFFIC_LABELS[session.traffic.level];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDistance = (km?: number) => {
    if (!km) return '-';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'active':
        return '#10b981';
      case 'paused':
        return '#f59e0b';
      case 'completed':
        return '#6b7280';
      case 'failed':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = () => {
    switch (session.status) {
      case 'active':
        return 'En cours';
      case 'paused':
        return 'En pause';
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échec';
      default:
        return 'En attente';
    }
  };

  const cardStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  };

  return (
    <div>
      {/* En-tête avec statut */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{trackingInfo.icon}</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{trackingInfo.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Mise à jour toutes les {session.updateInterval}s
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: `${getStatusColor()}15`,
                color: getStatusColor(),
              }}
            >
              {getStatusLabel()}
            </span>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
                title="Actualiser"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {session.status === 'pending' && onStartTracking && (
            <button
              onClick={onStartTracking}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ▶️ Démarrer le tracking
            </button>
          )}

          {session.status === 'active' && onPauseTracking && (
            <button
              onClick={onPauseTracking}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ⏸️ Mettre en pause
            </button>
          )}

          {session.status === 'paused' && onResumeTracking && (
            <button
              onClick={onResumeTracking}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ▶️ Reprendre
            </button>
          )}

          {session.status === 'active' && onStopTracking && (
            <button
              onClick={onStopTracking}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ⏹️ Arrêter
            </button>
          )}
        </div>
      </div>

      {/* Position actuelle */}
      {session.currentPosition && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            📍 Position actuelle
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Dernière mise à jour</span>
            <span style={valueStyle}>{formatDate(session.lastUpdate)}</span>
          </div>

          {session.currentPosition.speed !== undefined && (
            <div style={statItemStyle}>
              <span style={labelStyle}>Vitesse</span>
              <span style={valueStyle}>{Math.round(session.currentPosition.speed)} km/h</span>
            </div>
          )}

          {session.currentPosition.address && (
            <div style={{ ...statItemStyle, borderBottom: 'none' }}>
              <span style={labelStyle}>Adresse</span>
              <span style={{ ...valueStyle, textAlign: 'right', maxWidth: '60%' }}>
                {session.currentPosition.address}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ETA Collecte */}
      {session.pickupETA && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            📍 ETA Collecte
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Arrivée prévue</span>
            <span style={{ ...valueStyle, color: '#10b981' }}>
              {formatDate(session.pickupETA.estimatedArrival)}
            </span>
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Distance restante</span>
            <span style={valueStyle}>{formatDistance(session.pickupETA.distanceRemaining)}</span>
          </div>

          <div style={{ ...statItemStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Durée restante</span>
            <span style={valueStyle}>{formatDuration(session.pickupETA.durationRemaining)}</span>
          </div>

          {session.pickupETA.trafficDelay && session.pickupETA.trafficDelay > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400e',
              }}
            >
              ⚠️ Retard de {session.pickupETA.trafficDelay} min dû au trafic
            </div>
          )}
        </div>
      )}

      {/* ETA Livraison */}
      {session.deliveryETA && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            🎯 ETA Livraison
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Arrivée prévue</span>
            <span style={{ ...valueStyle, color: '#ef4444' }}>
              {formatDate(session.deliveryETA.estimatedArrival)}
            </span>
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Distance restante</span>
            <span style={valueStyle}>{formatDistance(session.deliveryETA.distanceRemaining)}</span>
          </div>

          <div style={{ ...statItemStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Durée restante</span>
            <span style={valueStyle}>{formatDuration(session.deliveryETA.durationRemaining)}</span>
          </div>

          {session.deliveryETA.trafficDelay && session.deliveryETA.trafficDelay > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400e',
              }}
            >
              ⚠️ Retard de {session.deliveryETA.trafficDelay} min dû au trafic
            </div>
          )}
        </div>
      )}

      {/* Trafic */}
      {session.traffic && trafficInfo && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            🚦 État du trafic
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{trafficInfo.icon}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: trafficInfo.color }}>
                {trafficInfo.label}
              </div>
              {session.traffic.delayMinutes > 0 && (
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  +{session.traffic.delayMinutes} min de retard
                </div>
              )}
            </div>
          </div>

          {session.traffic.incidents && session.traffic.incidents.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
                Incidents signalés :
              </div>
              {session.traffic.incidents.map((incident, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{incident.type}</div>
                  <div style={{ color: '#6b7280' }}>{incident.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alertes */}
      {session.alerts && session.alerts.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            ⚠️ Alertes ({session.alerts.filter((a) => !a.acknowledged).length} non lues)
          </div>

          {session.alerts
            .filter((a) => !a.acknowledged)
            .map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '12px',
                  backgroundColor:
                    alert.severity === 'critical'
                      ? '#fee2e2'
                      : alert.severity === 'warning'
                      ? '#fef3c7'
                      : '#e0f2fe',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{alert.message}</span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    {formatDate(alert.timestamp)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Type: {alert.type}</div>
              </div>
            ))}
        </div>
      )}

      {/* Statistiques */}
      {session.totalDistance !== undefined && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            📊 Statistiques
          </div>

          <div style={statItemStyle}>
            <span style={labelStyle}>Distance parcourue</span>
            <span style={valueStyle}>{formatDistance(session.totalDistance)}</span>
          </div>

          {session.totalDuration !== undefined && (
            <div style={{ ...statItemStyle, borderBottom: 'none' }}>
              <span style={labelStyle}>Durée du trajet</span>
              <span style={valueStyle}>{formatDuration(session.totalDuration)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingPanel;

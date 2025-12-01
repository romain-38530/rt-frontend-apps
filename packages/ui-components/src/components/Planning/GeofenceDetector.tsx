/**
 * GeofenceDetector - Détection automatique d'arrivée par geofencing
 *
 * Composant qui surveille la position GPS et déclenche des callbacks
 * quand l'utilisateur entre/sort d'une zone définie
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface GeofenceZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  type: 'site' | 'dock' | 'parking' | 'custom';
}

export interface GeofenceEvent {
  zoneId: string;
  zoneName: string;
  type: 'enter' | 'exit' | 'dwell';
  timestamp: Date;
  position: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  distance: number;
}

export interface GeofenceDetectorProps {
  zones: GeofenceZone[];
  onEnter?: (event: GeofenceEvent) => void;
  onExit?: (event: GeofenceEvent) => void;
  onDwell?: (event: GeofenceEvent, dwellTime: number) => void;
  dwellThreshold?: number; // milliseconds before triggering dwell
  updateInterval?: number; // milliseconds between position updates
  accuracyThreshold?: number; // ignore positions with accuracy worse than this (meters)
  enabled?: boolean;
  showUI?: boolean;
  style?: React.CSSProperties;
}

export interface GeofenceStatus {
  isTracking: boolean;
  lastPosition: GeolocationPosition | null;
  currentZones: string[]; // IDs of zones currently inside
  error: string | null;
}

// Haversine formula for distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const GeofenceDetector: React.FC<GeofenceDetectorProps> = ({
  zones,
  onEnter,
  onExit,
  onDwell,
  dwellThreshold = 60000, // 1 minute default
  updateInterval = 5000, // 5 seconds default
  accuracyThreshold = 100, // 100 meters default
  enabled = true,
  showUI = true,
  style,
}) => {
  const [status, setStatus] = useState<GeofenceStatus>({
    isTracking: false,
    lastPosition: null,
    currentZones: [],
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const dwellTimersRef = useRef<Record<string, { enteredAt: number; timer: NodeJS.Timeout | null }>>({});
  const previousZonesRef = useRef<Set<string>>(new Set());

  const checkZones = useCallback((position: GeolocationPosition) => {
    // Skip if accuracy is too low
    if (position.coords.accuracy > accuracyThreshold) {
      return;
    }

    const currentZoneIds = new Set<string>();
    const now = Date.now();

    zones.forEach(zone => {
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        zone.lat,
        zone.lng
      );

      const isInside = distance <= zone.radius;

      if (isInside) {
        currentZoneIds.add(zone.id);

        // Check if just entered
        if (!previousZonesRef.current.has(zone.id)) {
          const event: GeofenceEvent = {
            zoneId: zone.id,
            zoneName: zone.name,
            type: 'enter',
            timestamp: new Date(),
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            distance,
          };

          onEnter?.(event);

          // Start dwell timer
          if (onDwell) {
            dwellTimersRef.current[zone.id] = {
              enteredAt: now,
              timer: setTimeout(() => {
                const dwellEvent: GeofenceEvent = {
                  ...event,
                  type: 'dwell',
                  timestamp: new Date(),
                };
                onDwell(dwellEvent, dwellThreshold);
              }, dwellThreshold),
            };
          }
        }
      } else {
        // Check if just exited
        if (previousZonesRef.current.has(zone.id)) {
          const event: GeofenceEvent = {
            zoneId: zone.id,
            zoneName: zone.name,
            type: 'exit',
            timestamp: new Date(),
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            distance,
          };

          onExit?.(event);

          // Clear dwell timer
          if (dwellTimersRef.current[zone.id]?.timer) {
            clearTimeout(dwellTimersRef.current[zone.id].timer!);
            delete dwellTimersRef.current[zone.id];
          }
        }
      }
    });

    previousZonesRef.current = currentZoneIds;
    setStatus(prev => ({
      ...prev,
      currentZones: Array.from(currentZoneIds),
      lastPosition: position,
    }));
  }, [zones, onEnter, onExit, onDwell, dwellThreshold, accuracyThreshold]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus(prev => ({
        ...prev,
        error: 'Géolocalisation non supportée par ce navigateur',
      }));
      return;
    }

    setStatus(prev => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        checkZones(position);
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la géolocalisation refusé';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai de géolocalisation dépassé';
            break;
        }
        setStatus(prev => ({
          ...prev,
          error: errorMessage,
          isTracking: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: updateInterval * 2,
        maximumAge: updateInterval,
      }
    );
  }, [checkZones, updateInterval]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear all dwell timers
    Object.values(dwellTimersRef.current).forEach(({ timer }) => {
      if (timer) clearTimeout(timer);
    });
    dwellTimersRef.current = {};
    previousZonesRef.current = new Set();

    setStatus(prev => ({
      ...prev,
      isTracking: false,
      currentZones: [],
    }));
  }, []);

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  if (!showUI) {
    return null;
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '16px',
      ...style
    }}>
      {/* Status header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: status.isTracking ? '#4caf50' : '#999',
            animation: status.isTracking ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontWeight: 600 }}>
            {status.isTracking ? 'Suivi GPS actif' : 'Suivi GPS inactif'}
          </span>
        </div>
        <button
          onClick={() => enabled ? stopTracking() : startTracking()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: status.isTracking ? '#ffebee' : '#e8f5e9',
            color: status.isTracking ? '#c62828' : '#2e7d32',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {status.isTracking ? 'Arrêter' : 'Démarrer'}
        </button>
      </div>

      {/* Error message */}
      {status.error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          color: '#c62828',
          marginBottom: '16px',
          fontSize: '14px',
        }}>
          ⚠️ {status.error}
        </div>
      )}

      {/* Position info */}
      {status.lastPosition && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Position:</span>
            <span>
              {status.lastPosition.coords.latitude.toFixed(6)}, {status.lastPosition.coords.longitude.toFixed(6)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Précision:</span>
            <span style={{
              color: status.lastPosition.coords.accuracy <= 20 ? '#4caf50' :
                     status.lastPosition.coords.accuracy <= 50 ? '#ff9800' : '#f44336'
            }}>
              ±{Math.round(status.lastPosition.coords.accuracy)}m
            </span>
          </div>
        </div>
      )}

      {/* Zones list */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
          Zones surveillées ({zones.length})
        </div>
        {zones.length === 0 ? (
          <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            Aucune zone configurée
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {zones.map(zone => {
              const isInside = status.currentZones.includes(zone.id);
              const distance = status.lastPosition
                ? calculateDistance(
                    status.lastPosition.coords.latitude,
                    status.lastPosition.coords.longitude,
                    zone.lat,
                    zone.lng
                  )
                : null;

              return (
                <div
                  key={zone.id}
                  style={{
                    padding: '12px',
                    backgroundColor: isInside ? '#e8f5e9' : '#fff',
                    border: `1px solid ${isInside ? '#4caf50' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {zone.type === 'site' ? '🏭' :
                       zone.type === 'dock' ? '🚛' :
                       zone.type === 'parking' ? '🅿️' : '📍'} {zone.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Rayon: {zone.radius}m
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isInside ? (
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        À l'intérieur
                      </span>
                    ) : distance !== null ? (
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        {formatDistance(distance)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GeofenceDetector;

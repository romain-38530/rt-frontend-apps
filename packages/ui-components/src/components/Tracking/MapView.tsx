/**
 * Composant MapView pour afficher le tracking sur une carte
 * Version simple avec Google Maps Static API ou carte interactive
 */

import React, { useEffect, useRef, useState } from 'react';
import type {
  GeoLocation,
  MapMarker,
  TrackingPosition,
  Route,
} from '@rt/contracts';

interface MapViewProps {
  // Position actuelle du véhicule
  currentPosition?: TrackingPosition;

  // Points de passage (collecte, livraison, waypoints)
  markers?: MapMarker[];

  // Itinéraire à afficher
  route?: Route;

  // Historique des positions (trajet parcouru)
  positionHistory?: TrackingPosition[];

  // Centrage automatique sur la position actuelle
  autoCenter?: boolean;

  // Zoom
  zoom?: number;

  // Hauteur de la carte
  height?: string | number;

  // Largeur de la carte
  width?: string | number;

  // Afficher les contrôles
  showControls?: boolean;

  // Afficher la légende
  showLegend?: boolean;

  // Callback quand on clique sur la carte
  onClick?: (location: GeoLocation) => void;

  // Mode (statique ou interactif)
  mode?: 'static' | 'interactive';

  // Provider de carte (openstreetmap par défaut)
  provider?: 'openstreetmap' | 'google';

  // Clé API Google Maps (optionnel, utilisé seulement si provider='google')
  apiKey?: string;
}

const MARKER_COLORS: Record<MapMarker['type'], string> = {
  current: '#3b82f6',
  pickup: '#10b981',
  delivery: '#ef4444',
  waypoint: '#f59e0b',
  stop: '#6b7280',
};

const MARKER_ICONS: Record<MapMarker['type'], string> = {
  current: '🚛',
  pickup: '📍',
  delivery: '🎯',
  waypoint: '📌',
  stop: '⏸️',
};

export const MapView: React.FC<MapViewProps> = ({
  currentPosition,
  markers = [],
  route,
  positionHistory = [],
  autoCenter = true,
  zoom = 13,
  height = '500px',
  width = '100%',
  showControls: _showControls = true,
  showLegend = true,
  onClick: _onClick,
  mode = 'interactive',
  provider = 'openstreetmap',
  apiKey,
}) => {
  // Reserved for future use
  void _showControls;
  void _onClick;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<GeoLocation | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Calculer le centre de la carte
  useEffect(() => {
    if (autoCenter && currentPosition) {
      setCenter({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        timestamp: currentPosition.timestamp,
      });
    } else if (markers.length > 0) {
      // Centrer sur le premier marqueur
      setCenter(markers[0].position);
    }
  }, [currentPosition, markers, autoCenter]);

  // Générer l'URL pour la carte statique (OpenStreetMap ou Google Maps)
  const getStaticMapUrl = () => {
    if (!center) return '';

    // OpenStreetMap Static Map via StaticMap.io (service gratuit)
    if (provider === 'openstreetmap') {
      // Utiliser OpenStreetMap Static Maps API
      const baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php';
      const markerParams = markers.map((marker) => {
        return `${marker.position.longitude},${marker.position.latitude},red`;
      });

      if (currentPosition) {
        markerParams.push(`${currentPosition.longitude},${currentPosition.latitude},blue`);
      }

      const params = new URLSearchParams({
        center: `${center.longitude},${center.latitude}`,
        zoom: zoom.toString(),
        size: '800x600',
        maptype: 'mapnik',
      });

      if (markerParams.length > 0) {
        params.append('markers', markerParams.join('|'));
      }

      return `${baseUrl}?${params.toString()}`;
    }

    // Google Maps Static API (fallback)
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${center.latitude},${center.longitude}`,
      zoom: zoom.toString(),
      size: '800x600',
      maptype: 'roadmap',
      key: apiKey || 'YOUR_API_KEY',
    });

    // Ajouter les marqueurs
    markers.forEach((marker) => {
      const color = MARKER_COLORS[marker.type].replace('#', '');
      params.append(
        'markers',
        `color:0x${color}|label:${marker.label || ''}|${marker.position.latitude},${marker.position.longitude}`
      );
    });

    // Ajouter la position actuelle
    if (currentPosition) {
      params.append(
        'markers',
        `color:0x3b82f6|icon:https://maps.google.com/mapfiles/ms/icons/blue-dot.png|${currentPosition.latitude},${currentPosition.longitude}`
      );
    }

    // Ajouter le polyline de l'itinéraire
    if (route?.polyline) {
      params.append('path', `enc:${route.polyline}`);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // Carte statique
  if (mode === 'static') {
    return (
      <div
        ref={mapContainerRef}
        style={{
          width,
          height,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {center ? (
          <img
            src={getStaticMapUrl()}
            alt="Carte de suivi"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
            }}
          >
            Chargement de la carte...
          </div>
        )}

        {showLegend && markers.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: '700', marginBottom: '8px' }}>Légende</div>
            {markers.map((marker, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{MARKER_ICONS[marker.type]}</span>
                <span>{marker.label || marker.type}</span>
              </div>
            ))}
            {currentPosition && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '16px' }}>🚛</span>
                <span>Position actuelle</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Carte interactive (version simplifiée)
  return (
    <div
      ref={mapContainerRef}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#e5e7eb',
      }}
    >
      {/* Carte interactive simplifiée avec SVG */}
      <svg width="100%" height="100%" style={{ background: '#f0f9ff' }}>
        {/* Grille */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Trajet parcouru */}
        {positionHistory.length > 1 && (
          <polyline
            points={positionHistory
              .map((pos) => {
                // Convertir lat/lng en coordonnées SVG (simplifié)
                const x = ((pos.longitude + 180) / 360) * 800;
                const y = ((90 - pos.latitude) / 180) * 600;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.6"
          />
        )}

        {/* Itinéraire prévu */}
        {route && route.points.length > 1 && (
          <polyline
            points={route.points
              .map((point: GeoLocation) => {
                const x = ((point.longitude + 180) / 360) * 800;
                const y = ((90 - point.latitude) / 180) * 600;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            opacity="0.4"
          />
        )}

        {/* Marqueurs */}
        {markers.map((marker, index) => {
          const x = ((marker.position.longitude + 180) / 360) * 800;
          const y = ((90 - marker.position.latitude) / 180) * 600;

          return (
            <g
              key={marker.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => {
                setSelectedMarker(marker);
                marker.onClick?.();
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r="12"
                fill={marker.color || MARKER_COLORS[marker.type]}
                stroke="white"
                strokeWidth="2"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill="white"
                fontSize="10"
                fontWeight="700"
              >
                {index + 1}
              </text>
            </g>
          );
        })}

        {/* Position actuelle */}
        {currentPosition && (
          <g
            transform={`translate(${((currentPosition.longitude + 180) / 360) * 800}, ${
              ((90 - currentPosition.latitude) / 180) * 600
            })`}
          >
            <circle r="16" fill="#3b82f6" opacity="0.3">
              <animate attributeName="r" from="16" to="24" dur="2s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                from="0.3"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Légende */}
      {showLegend && markers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '12px',
            maxWidth: '200px',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Légende</div>
          {markers.map((marker, index) => (
            <div
              key={marker.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedMarker(marker)}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: marker.color || MARKER_COLORS[marker.type],
                }}
              />
              <span>{marker.label || `Point ${index + 1}`}</span>
            </div>
          ))}
          {currentPosition && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
              />
              <span style={{ fontWeight: '600' }}>Position actuelle</span>
            </div>
          )}
        </div>
      )}

      {/* Info bulle du marqueur sélectionné */}
      {selectedMarker && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontSize: '13px',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>{selectedMarker.label}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {selectedMarker.position.latitude.toFixed(6)},{' '}
            {selectedMarker.position.longitude.toFixed(6)}
          </div>
          <button
            onClick={() => setSelectedMarker(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Attribution OpenStreetMap */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#6b7280',
        }}
      >
        🗺️ Données © OpenStreetMap contributors
      </div>
    </div>
  );
};

export default MapView;

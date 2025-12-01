/**
 * SitesMap - Carte interactive des sites de restitution de palettes
 * Affiche les sites avec scoring, filtres et sélection
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface PaletteSite {
  siteId: string;
  siteName: string;
  companyName?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  priority: 'INTERNAL' | 'NETWORK' | 'EXTERNAL';
  distance?: number;
  matchingScore?: number;
  quotaRemaining?: number;
  isOpen?: boolean;
  openingHours?: string;
}

export interface SitesMapProps {
  // Liste des sites à afficher
  sites: PaletteSite[];

  // Position de l'utilisateur (optionnel)
  userLocation?: { latitude: number; longitude: number };

  // Site sélectionné
  selectedSiteId?: string;

  // Callback de sélection
  onSelectSite?: (site: PaletteSite) => void;

  // Largeur
  width?: number | string;

  // Hauteur
  height?: number | string;

  // Zoom initial
  zoom?: number;

  // Style
  style?: React.CSSProperties;

  // Afficher les contrôles de filtre
  showFilters?: boolean;

  // Afficher la légende
  showLegend?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  INTERNAL: '#667eea',
  NETWORK: '#00D084',
  EXTERNAL: '#f59e0b',
};

const PRIORITY_LABELS: Record<string, string> = {
  INTERNAL: 'Interne',
  NETWORK: 'Réseau',
  EXTERNAL: 'Externe',
};

export const SitesMap: React.FC<SitesMapProps> = ({
  sites,
  userLocation,
  selectedSiteId,
  onSelectSite,
  width = '100%',
  height = 500,
  zoom = 10,
  style,
  showFilters = true,
  showLegend = true,
}) => {
  const [hoveredSite, setHoveredSite] = useState<PaletteSite | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [openOnlyFilter, setOpenOnlyFilter] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Filtrer les sites
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      if (priorityFilter !== 'ALL' && site.priority !== priorityFilter) return false;
      if (openOnlyFilter && site.isOpen === false) return false;
      return true;
    });
  }, [sites, priorityFilter, openOnlyFilter]);

  // Calculer le centre et les bounds
  const mapBounds = useMemo(() => {
    if (filteredSites.length === 0) return null;

    const lats = filteredSites.map(s => s.address.coordinates.latitude);
    const lngs = filteredSites.map(s => s.address.coordinates.longitude);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
      centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [filteredSites]);

  // Convertir lat/lng en coordonnées SVG
  const latLngToSvg = useCallback((lat: number, lng: number, svgWidth: number, svgHeight: number) => {
    if (!mapBounds) return { x: svgWidth / 2, y: svgHeight / 2 };

    const padding = 40;
    const latRange = Math.max(mapBounds.maxLat - mapBounds.minLat, 0.01);
    const lngRange = Math.max(mapBounds.maxLng - mapBounds.minLng, 0.01);

    const x = padding + ((lng - mapBounds.minLng) / lngRange) * (svgWidth - padding * 2);
    const y = padding + ((mapBounds.maxLat - lat) / latRange) * (svgHeight - padding * 2);

    return { x, y };
  }, [mapBounds]);

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#f0f9ff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    ...style,
  };

  const filtersStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    gap: '8px',
    zIndex: 10,
  };

  const filterButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    background: isActive ? '#667eea' : 'white',
    color: isActive ? 'white' : '#333',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  });

  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontSize: '12px',
    zIndex: 10,
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'white',
    padding: '12px 16px',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    fontSize: '13px',
    zIndex: 20,
    minWidth: '200px',
    pointerEvents: 'none',
  };

  const svgWidth = typeof width === 'number' ? width : 800;
  const svgHeight = typeof height === 'number' ? height : 500;

  return (
    <div style={containerStyle}>
      {/* Filtres */}
      {showFilters && (
        <div style={filtersStyle}>
          <button
            onClick={() => setPriorityFilter('ALL')}
            style={filterButtonStyle(priorityFilter === 'ALL')}
          >
            Tous ({sites.length})
          </button>
          {['INTERNAL', 'NETWORK', 'EXTERNAL'].map(priority => {
            const count = sites.filter(s => s.priority === priority).length;
            return (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                style={{
                  ...filterButtonStyle(priorityFilter === priority),
                  borderLeft: `3px solid ${PRIORITY_COLORS[priority]}`,
                }}
              >
                {PRIORITY_LABELS[priority]} ({count})
              </button>
            );
          })}
          <button
            onClick={() => setOpenOnlyFilter(!openOnlyFilter)}
            style={{
              ...filterButtonStyle(openOnlyFilter),
              background: openOnlyFilter ? '#00D084' : 'white',
            }}
          >
            🕐 Ouverts
          </button>
        </div>
      )}

      {/* Légende */}
      {showLegend && (
        <div style={legendStyle}>
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Priorité</div>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
              <span>{PRIORITY_LABELS[priority]}</span>
            </div>
          ))}
          {userLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <span>Votre position</span>
            </div>
          )}
        </div>
      )}

      {/* Carte SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grille de fond */}
        <defs>
          <pattern id="sitesGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sitesGrid)" />

        {/* Connexions entre sites (optionnel) */}
        {filteredSites.length > 1 && filteredSites.map((site, i) => {
          if (i === 0) return null;
          const prev = filteredSites[i - 1];
          const { x: x1, y: y1 } = latLngToSvg(prev.address.coordinates.latitude, prev.address.coordinates.longitude, svgWidth, svgHeight);
          const { x: x2, y: y2 } = latLngToSvg(site.address.coordinates.latitude, site.address.coordinates.longitude, svgWidth, svgHeight);
          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Position utilisateur */}
        {userLocation && mapBounds && (
          <g transform={`translate(${latLngToSvg(userLocation.latitude, userLocation.longitude, svgWidth, svgHeight).x}, ${latLngToSvg(userLocation.latitude, userLocation.longitude, svgWidth, svgHeight).y})`}>
            <circle r="20" fill="#ef4444" opacity="0.2">
              <animate attributeName="r" from="20" to="35" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="10" fill="#ef4444" stroke="white" strokeWidth="3" />
            <text y="30" textAnchor="middle" fontSize="11" fill="#666" fontWeight="600">
              Vous
            </text>
          </g>
        )}

        {/* Marqueurs des sites */}
        {filteredSites.map((site, index) => {
          const { x, y } = latLngToSvg(site.address.coordinates.latitude, site.address.coordinates.longitude, svgWidth, svgHeight);
          const isSelected = site.siteId === selectedSiteId;
          const isHovered = hoveredSite?.siteId === site.siteId;
          const color = PRIORITY_COLORS[site.priority] || '#667eea';
          const radius = isSelected ? 18 : isHovered ? 16 : 12;

          return (
            <g
              key={site.siteId}
              transform={`translate(${x}, ${y})`}
              onClick={() => onSelectSite?.(site)}
              onMouseEnter={() => setHoveredSite(site)}
              onMouseLeave={() => setHoveredSite(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Cercle d'ombre */}
              <circle
                r={radius + 4}
                fill="rgba(0,0,0,0.2)"
                transform="translate(2, 2)"
              />

              {/* Cercle principal */}
              <circle
                r={radius}
                fill={color}
                stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.8)'}
                strokeWidth={isSelected ? 4 : 2}
                style={{ transition: 'all 0.2s' }}
              />

              {/* Score ou rang */}
              <text
                textAnchor="middle"
                dy="4"
                fill="white"
                fontSize={isSelected ? '12' : '10'}
                fontWeight="700"
              >
                {site.matchingScore ? site.matchingScore : index + 1}
              </text>

              {/* Indicateur ouvert/fermé */}
              {site.isOpen !== undefined && (
                <circle
                  cx={radius - 2}
                  cy={-radius + 2}
                  r="5"
                  fill={site.isOpen ? '#00D084' : '#ef4444'}
                  stroke="white"
                  strokeWidth="1.5"
                />
              )}

              {/* Label au survol */}
              {isHovered && (
                <text
                  y={-radius - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#333"
                  fontWeight="600"
                  style={{
                    textShadow: '0 0 4px white, 0 0 4px white',
                  }}
                >
                  {site.siteName}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip détaillé */}
      {hoveredSite && (
        <div
          style={{
            ...tooltipStyle,
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>{hoveredSite.siteName}</div>
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
              background: hoveredSite.isOpen ? 'rgba(0,208,132,0.2)' : 'rgba(239,68,68,0.2)',
              color: hoveredSite.isOpen ? '#00D084' : '#ef4444',
            }}>
              {hoveredSite.isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </div>
          <div style={{ color: '#666', marginBottom: '8px' }}>
            {hoveredSite.address.city} ({hoveredSite.address.postalCode})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            {hoveredSite.distance !== undefined && (
              <div>
                <span style={{ opacity: 0.6 }}>Distance:</span>{' '}
                <strong>{hoveredSite.distance} km</strong>
              </div>
            )}
            {hoveredSite.quotaRemaining !== undefined && (
              <div>
                <span style={{ opacity: 0.6 }}>Quota:</span>{' '}
                <strong>{hoveredSite.quotaRemaining} places</strong>
              </div>
            )}
            {hoveredSite.matchingScore !== undefined && (
              <div>
                <span style={{ opacity: 0.6 }}>Score:</span>{' '}
                <strong>{hoveredSite.matchingScore}/100</strong>
              </div>
            )}
            {hoveredSite.openingHours && (
              <div>
                <span style={{ opacity: 0.6 }}>Horaires:</span>{' '}
                <strong>{hoveredSite.openingHours}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si aucun site */}
      {filteredSites.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
          <div style={{ fontWeight: '600' }}>Aucun site disponible</div>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>
            Modifiez les filtres ou élargissez le rayon de recherche
          </div>
        </div>
      )}

      {/* Compteur */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}>
        {filteredSites.length} site{filteredSites.length > 1 ? 's' : ''} affiché{filteredSites.length > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default SitesMap;

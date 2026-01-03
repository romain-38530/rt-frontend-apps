import React, { CSSProperties } from 'react';

export interface EmissionsDisplayProps {
  orderId?: string;
  route: RouteInfo;
  emissions: EmissionsData;
  comparison?: EmissionsComparison;
  showDetails?: boolean;
  language?: 'fr' | 'en';
}

export interface RouteInfo {
  origin: string;
  destination: string;
  distanceKm: number;
  vehicleType: VehicleType;
  loadWeight?: number; // tonnes
}

export type VehicleType = 'articulated_40t' | 'rigid_19t' | 'rigid_12t' | 'van_3_5t';

export interface EmissionsData {
  co2Kg: number;
  co2PerKm: number;
  co2PerTonneKm?: number;
  environmentalLabel: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  methodology: string;
  calculatedAt: string;
}

export interface EmissionsComparison {
  averageCo2Kg: number;
  savingsKg: number;
  savingsPercent: number;
  ranking: number; // percentile
}

const translations = {
  fr: {
    title: 'Bilan Carbone',
    regulation: 'Article L229-25 Code environnement',
    route: 'Trajet',
    distance: 'Distance',
    vehicle: 'Véhicule',
    totalEmissions: 'Émissions totales',
    perKm: 'Par kilomètre',
    perTonneKm: 'Par tonne-kilomètre',
    methodology: 'Méthodologie',
    calculatedAt: 'Calculé le',
    comparison: 'Comparaison',
    avgEmissions: 'Moyenne du secteur',
    savings: 'Économie',
    betterThan: 'Mieux que',
    ofFleet: 'de la flotte',
    environmentalLabel: 'Label environnemental',
    vehicles: {
      articulated_40t: 'Semi-remorque 40T',
      rigid_19t: 'Porteur 19T',
      rigid_12t: 'Porteur 12T',
      van_3_5t: 'Utilitaire 3.5T',
    },
    labelDescriptions: {
      A: 'Excellent - Très faibles émissions',
      B: 'Très bon - Faibles émissions',
      C: 'Bon - Émissions modérées',
      D: 'Moyen - Émissions moyennes',
      E: 'À améliorer - Émissions élevées',
      F: 'Critique - Très hautes émissions',
    }
  },
  en: {
    title: 'Carbon Footprint',
    regulation: 'Article L229-25 Environmental Code',
    route: 'Route',
    distance: 'Distance',
    vehicle: 'Vehicle',
    totalEmissions: 'Total emissions',
    perKm: 'Per kilometer',
    perTonneKm: 'Per tonne-kilometer',
    methodology: 'Methodology',
    calculatedAt: 'Calculated on',
    comparison: 'Comparison',
    avgEmissions: 'Sector average',
    savings: 'Savings',
    betterThan: 'Better than',
    ofFleet: 'of fleet',
    environmentalLabel: 'Environmental label',
    vehicles: {
      articulated_40t: 'Articulated truck 40T',
      rigid_19t: 'Rigid truck 19T',
      rigid_12t: 'Rigid truck 12T',
      van_3_5t: 'Van 3.5T',
    },
    labelDescriptions: {
      A: 'Excellent - Very low emissions',
      B: 'Very good - Low emissions',
      C: 'Good - Moderate emissions',
      D: 'Average - Medium emissions',
      E: 'Needs improvement - High emissions',
      F: 'Critical - Very high emissions',
    }
  }
};

const labelColors: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: '#d4edda', text: '#155724', border: '#28a745' },
  B: { bg: '#c3e6cb', text: '#155724', border: '#28a745' },
  C: { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  D: { bg: '#ffeeba', text: '#856404', border: '#ffc107' },
  E: { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
  F: { bg: '#f5c6cb', text: '#721c24', border: '#dc3545' },
};

export const EmissionsDisplay: React.FC<EmissionsDisplayProps> = ({
  orderId,
  route,
  emissions,
  comparison,
  showDetails = true,
  language = 'fr'
}) => {
  const t = translations[language];
  const labelColor = labelColors[emissions.environmentalLabel];

  const containerStyles: CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  };

  const headerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const titleContainerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const titleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a2e',
  };

  const regulationBadgeStyles: CSSProperties = {
    fontSize: '11px',
    padding: '4px 10px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontWeight: 500,
  };

  const labelContainerStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  };

  const labelStyles: CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 800,
    background: labelColor.bg,
    color: labelColor.text,
    border: `3px solid ${labelColor.border}`,
  };

  const labelDescStyles: CSSProperties = {
    fontSize: '10px',
    color: '#666',
    textAlign: 'center',
    maxWidth: '100px',
  };

  const mainEmissionsStyles: CSSProperties = {
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    borderRadius: '16px',
    padding: '24px',
    color: 'white',
    textAlign: 'center',
    marginBottom: '24px',
  };

  const emissionValueStyles: CSSProperties = {
    fontSize: '48px',
    fontWeight: 800,
    lineHeight: 1,
  };

  const emissionUnitStyles: CSSProperties = {
    fontSize: '18px',
    opacity: 0.9,
    marginTop: '8px',
  };

  const emissionLabelStyles: CSSProperties = {
    fontSize: '14px',
    opacity: 0.8,
    marginTop: '4px',
  };

  const gridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyles: CSSProperties = {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
  };

  const statLabelStyles: CSSProperties = {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  };

  const statValueStyles: CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1a1a2e',
  };

  const routeStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '24px',
  };

  const routePointStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  };

  const routeArrowStyles: CSSProperties = {
    fontSize: '24px',
    color: '#667eea',
  };

  const routeLabelStyles: CSSProperties = {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const routeValueStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginTop: '4px',
  };

  const comparisonStyles: CSSProperties = {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  };

  const comparisonTitleStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  };

  const comparisonGridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  };

  const savingsStyles: CSSProperties = {
    background: '#d4edda',
    color: '#155724',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  };

  const methodologyStyles: CSSProperties = {
    marginTop: '20px',
    padding: '12px 16px',
    background: '#e3f2fd',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#1565c0',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleContainerStyles}>
          <span style={{ fontSize: '24px' }}>🌱</span>
          <div>
            <div style={titleStyles}>{t.title}</div>
            <span style={regulationBadgeStyles}>{t.regulation}</span>
          </div>
        </div>

        <div style={labelContainerStyles}>
          <div style={labelStyles}>{emissions.environmentalLabel}</div>
          <div style={labelDescStyles}>
            {t.labelDescriptions[emissions.environmentalLabel]}
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div style={routeStyles}>
        <div style={routePointStyles}>
          <span style={routeLabelStyles}>Départ</span>
          <span style={routeValueStyles}>{route.origin}</span>
        </div>
        <span style={routeArrowStyles}>→</span>
        <div style={routePointStyles}>
          <span style={routeLabelStyles}>Arrivée</span>
          <span style={routeValueStyles}>{route.destination}</span>
        </div>
      </div>

      {/* Main Emissions */}
      <div style={mainEmissionsStyles}>
        <div style={emissionValueStyles}>{emissions.co2Kg.toFixed(1)}</div>
        <div style={emissionUnitStyles}>kg CO₂</div>
        <div style={emissionLabelStyles}>{t.totalEmissions}</div>
      </div>

      {/* Stats Grid */}
      <div style={gridStyles}>
        <div style={statCardStyles}>
          <div style={statLabelStyles}>{t.distance}</div>
          <div style={statValueStyles}>{route.distanceKm.toFixed(0)} km</div>
        </div>

        <div style={statCardStyles}>
          <div style={statLabelStyles}>{t.vehicle}</div>
          <div style={statValueStyles}>{t.vehicles[route.vehicleType]}</div>
        </div>

        <div style={statCardStyles}>
          <div style={statLabelStyles}>{t.perKm}</div>
          <div style={statValueStyles}>{(emissions.co2PerKm * 1000).toFixed(0)} g/km</div>
        </div>

        {emissions.co2PerTonneKm && (
          <div style={statCardStyles}>
            <div style={statLabelStyles}>{t.perTonneKm}</div>
            <div style={statValueStyles}>{(emissions.co2PerTonneKm * 1000).toFixed(1)} g/t.km</div>
          </div>
        )}
      </div>

      {/* Comparison */}
      {comparison && (
        <div style={comparisonStyles}>
          <div style={comparisonTitleStyles}>{t.comparison}</div>
          <div style={comparisonGridStyles}>
            <div style={statCardStyles}>
              <div style={statLabelStyles}>{t.avgEmissions}</div>
              <div style={statValueStyles}>{comparison.averageCo2Kg.toFixed(1)} kg</div>
            </div>

            <div style={savingsStyles}>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t.savings}</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>
                -{comparison.savingsPercent.toFixed(0)}%
              </div>
              <div style={{ fontSize: '12px' }}>({comparison.savingsKg.toFixed(1)} kg)</div>
            </div>

            <div style={statCardStyles}>
              <div style={statLabelStyles}>{t.betterThan}</div>
              <div style={statValueStyles}>{comparison.ranking}% {t.ofFleet}</div>
            </div>
          </div>
        </div>
      )}

      {/* Methodology */}
      {showDetails && (
        <div style={methodologyStyles}>
          <strong>{t.methodology}:</strong> {emissions.methodology}
          <br />
          <strong>{t.calculatedAt}:</strong> {new Date(emissions.calculatedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default EmissionsDisplay;

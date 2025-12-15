import React from 'react';

export interface CarrierInfoCardProps {
  carrierName?: string;
  driverName?: string;
  vehiclePlate?: string;
  driverPhone?: string;
}

export const CarrierInfoCard: React.FC<CarrierInfoCardProps> = ({
  carrierName,
  driverName,
  vehiclePlate,
  driverPhone,
}) => {
  if (!carrierName && !driverName) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          border: '1px solid #fbbf24',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>🚛</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              Transporteur non assigne
            </div>
            <div style={{ fontSize: '12px', color: '#a16207' }}>
              En attente d'attribution
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '2px solid #3b82f6',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🚛</span>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Transporteur assigne
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {carrierName && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
              Societe
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {carrierName}
            </div>
          </div>
        )}

        {driverName && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
              Chauffeur
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {driverName}
            </div>
          </div>
        )}

        {vehiclePlate && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
              Immatriculation
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'monospace',
                color: '#111827',
              }}
            >
              {vehiclePlate}
            </div>
          </div>
        )}

        {driverPhone && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
              Telephone
            </div>
            <a
              href={`tel:${driverPhone}`}
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              {driverPhone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarrierInfoCard;

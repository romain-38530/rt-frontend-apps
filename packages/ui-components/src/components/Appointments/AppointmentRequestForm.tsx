import React, { useState } from 'react';

export interface AppointmentRequestFormProps {
  orderId: string;
  orderReference: string;
  type: 'loading' | 'unloading';
  targetOrganizationId: string;
  targetOrganizationName?: string;
  targetSiteId?: string;
  targetSiteName?: string;
  requesterId: string;
  requesterName: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  suggestedDate?: string;
  onSubmit: (data: AppointmentRequestData) => Promise<void>;
  onCancel?: () => void;
}

export interface AppointmentRequestData {
  orderId: string;
  orderReference: string;
  type: 'loading' | 'unloading';
  targetOrganizationId: string;
  targetOrganizationName?: string;
  targetSiteId?: string;
  targetSiteName?: string;
  requesterId: string;
  requesterType: 'carrier' | 'driver';
  requesterName: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  preferredDates: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
    priority: number;
  }>;
  carrierNotes?: string;
}

export const AppointmentRequestForm: React.FC<AppointmentRequestFormProps> = ({
  orderId,
  orderReference,
  type,
  targetOrganizationId,
  targetOrganizationName,
  targetSiteId,
  targetSiteName,
  requesterId,
  requesterName,
  carrierName,
  driverName,
  driverPhone,
  vehiclePlate,
  suggestedDate,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dates, setDates] = useState<Array<{ date: string; startTime: string; endTime: string }>>([
    { date: suggestedDate || '', startTime: '08:00', endTime: '12:00' },
  ]);
  const [notes, setNotes] = useState('');

  const handleAddDate = () => {
    setDates([...dates, { date: '', startTime: '08:00', endTime: '12:00' }]);
  };

  const handleRemoveDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index));
  };

  const handleDateChange = (index: number, field: string, value: string) => {
    const newDates = [...dates];
    newDates[index] = { ...newDates[index], [field]: value };
    setDates(newDates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dates.length === 0 || !dates[0].date) {
      alert('Veuillez selectionner au moins une date');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        orderId,
        orderReference,
        type,
        targetOrganizationId,
        targetOrganizationName,
        targetSiteId,
        targetSiteName,
        requesterId,
        requesterType: 'carrier',
        requesterName,
        carrierName,
        driverName,
        driverPhone,
        vehiclePlate,
        preferredDates: dates.map((d, i) => ({
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          priority: i + 1,
        })),
        carrierNotes: notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '28px' }}>{type === 'loading' ? '📦' : '🚚'}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            Demande de RDV {type === 'loading' ? 'Chargement' : 'Livraison'}
          </h3>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Commande {orderReference} - {targetOrganizationName || targetSiteName}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Dates preferees */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Dates et creneaux souhaites</label>
          {dates.map((dateItem, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ flex: 2 }}>
                <input
                  type="date"
                  value={dateItem.date}
                  onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                  style={inputStyle}
                  required={index === 0}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="time"
                  value={dateItem.startTime}
                  onChange={(e) => handleDateChange(index, 'startTime', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <span style={{ color: '#9ca3af' }}>a</span>
              <div style={{ flex: 1 }}>
                <input
                  type="time"
                  value={dateItem.endTime}
                  onChange={(e) => handleDateChange(index, 'endTime', e.target.value)}
                  style={inputStyle}
                />
              </div>
              {dates.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDate(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              )}
              {index === 0 && (
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>Priorite 1</span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddDate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px dashed #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              width: '100%',
              marginTop: '8px',
            }}
          >
            + Ajouter une date alternative
          </button>
        </div>

        {/* Informations vehicule */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
            Informations vehicule
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#6b7280' }}>Chauffeur:</span>{' '}
              <span style={{ fontWeight: '600' }}>{driverName || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Telephone:</span>{' '}
              <span style={{ fontWeight: '600' }}>{driverPhone || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Immatriculation:</span>{' '}
              <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{vehiclePlate || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Transporteur:</span>{' '}
              <span style={{ fontWeight: '600' }}>{carrierName || '-'}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Notes / Instructions particulieres</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="Contraintes d'acces, materiel necessaire, etc."
          />
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '14px',
            }}
          >
            {isSubmitting ? 'Envoi...' : '📤 Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentRequestForm;

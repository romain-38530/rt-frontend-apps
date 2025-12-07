/**
 * SlotPicker - Sélecteur de créneaux pour la prise de RDV
 *
 * Utilisé par les transporteurs pour réserver un créneau de chargement/livraison
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId: string;
  dockName: string;
  siteId: string;
  siteName: string;
  capacity: {
    maxPallets: number;
    maxWeight: number;
    remainingPallets: number;
    remainingWeight: number;
  };
  type: 'loading' | 'unloading' | 'both';
}

export interface SlotPickerProps {
  availableSlots: AvailableSlot[];
  selectedSlotId: string | null;
  onSlotSelect: (slot: AvailableSlot | null) => void;
  onConfirm: (slot: AvailableSlot, bookingData: SlotBookingData) => void;
  requiredPallets?: number;
  requiredWeight?: number;
  operationType?: 'loading' | 'unloading' | 'both';
  minDate?: Date;
  maxDate?: Date;
  style?: React.CSSProperties;
}

export interface SlotBookingData {
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  trailerPlate?: string;
  palletCount: number;
  cargoDescription?: string;
  orderRef?: string;
  notes?: string;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  availableSlots,
  selectedSlotId,
  onSlotSelect,
  onConfirm,
  requiredPallets = 0,
  requiredWeight = 0,
  operationType = 'both',
  minDate,
  maxDate,
  style,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return minDate ? minDate.toISOString().split('T')[0] : today;
  });

  const [bookingData, setBookingData] = useState<SlotBookingData>({
    driverName: '',
    driverPhone: '',
    vehiclePlate: '',
    trailerPlate: '',
    palletCount: requiredPallets,
    cargoDescription: '',
    orderRef: '',
    notes: '',
  });

  const [showBookingForm, setShowBookingForm] = useState(false);

  // Get unique dates from available slots
  const availableDates = useMemo(() => {
    const dates = [...new Set(availableSlots.map(s => s.date))].sort();
    return dates.filter(d => {
      if (minDate && d < minDate.toISOString().split('T')[0]) return false;
      if (maxDate && d > maxDate.toISOString().split('T')[0]) return false;
      return true;
    });
  }, [availableSlots, minDate, maxDate]);

  // Filter slots for selected date and operation type
  const filteredSlots = useMemo(() => {
    return availableSlots.filter(slot => {
      if (slot.date !== selectedDate) return false;
      if (operationType !== 'both' && slot.type !== operationType && slot.type !== 'both') return false;
      if (requiredPallets > 0 && slot.capacity.remainingPallets < requiredPallets) return false;
      if (requiredWeight > 0 && slot.capacity.remainingWeight < requiredWeight) return false;
      return true;
    });
  }, [availableSlots, selectedDate, operationType, requiredPallets, requiredWeight]);

  // Group slots by site
  const slotsBySite = useMemo(() => {
    const grouped: Record<string, { name: string; slots: AvailableSlot[] }> = {};
    filteredSlots.forEach(slot => {
      if (!grouped[slot.siteId]) {
        grouped[slot.siteId] = { name: slot.siteName, slots: [] };
      }
      grouped[slot.siteId].slots.push(slot);
    });
    return grouped;
  }, [filteredSlots]);

  const selectedSlot = useMemo(() => {
    return availableSlots.find(s => s.id === selectedSlotId) || null;
  }, [availableSlots, selectedSlotId]);

  const handleSlotClick = useCallback((slot: AvailableSlot) => {
    if (selectedSlotId === slot.id) {
      onSlotSelect(null);
      setShowBookingForm(false);
    } else {
      onSlotSelect(slot);
      setShowBookingForm(true);
    }
  }, [selectedSlotId, onSlotSelect]);

  const handleConfirm = () => {
    if (selectedSlot && bookingData.driverName && bookingData.vehiclePlate) {
      onConfirm(selectedSlot, bookingData);
      setShowBookingForm(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const isFormValid = bookingData.driverName && bookingData.vehiclePlate && bookingData.palletCount > 0;

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      ...style
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1976d2',
        color: '#fff',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Réservation de créneau
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
          {operationType === 'loading' ? 'Chargement' : operationType === 'unloading' ? 'Déchargement' : 'Chargement/Déchargement'}
          {requiredPallets > 0 && ` • ${requiredPallets} palettes`}
        </p>
      </div>

      <div style={{ display: 'flex', minHeight: '500px' }}>
        {/* Date selector */}
        <div style={{
          width: '200px',
          borderRight: '1px solid #e0e0e0',
          padding: '16px',
          backgroundColor: '#fafafa',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: '#666' }}>
            Sélectionner une date
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableDates.length === 0 ? (
              <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                Aucune date disponible
              </div>
            ) : (
              availableDates.map(date => {
                const slotsForDate = availableSlots.filter(s => s.date === date).length;
                const isSelected = date === selectedDate;

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: '12px',
                      border: isSelected ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      fontWeight: 600,
                      color: isSelected ? '#1976d2' : '#333',
                      fontSize: '14px',
                    }}>
                      {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {slotsForDate} créneau{slotsForDate > 1 ? 'x' : ''} disponible{slotsForDate > 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Slots grid */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: '16px' }}>
            {formatDate(selectedDate)}
          </div>

          {Object.keys(slotsBySite).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <div>Aucun créneau disponible pour cette date</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Essayez une autre date ou contactez le site
              </div>
            </div>
          ) : (
            Object.entries(slotsBySite).map(([siteId, { name, slots }]) => (
              <div key={siteId} style={{ marginBottom: '24px' }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                }}>
                  📍 {name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {slots.map(slot => {
                    const isSelected = slot.id === selectedSlotId;
                    const capacityPercent = Math.round((slot.capacity.remainingPallets / slot.capacity.maxPallets) * 100);

                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        style={{
                          padding: '16px',
                          border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none',
                        }}
                      >
                        <div style={{
                          fontWeight: 600,
                          fontSize: '16px',
                          color: isSelected ? '#1976d2' : '#333',
                        }}>
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                          {slot.dockName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          {slot.type === 'loading' ? '🔼 Chargement' : slot.type === 'unloading' ? '🔽 Déchargement' : '↕️ Les deux'}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                            Capacité: {slot.capacity.remainingPallets}/{slot.capacity.maxPallets} palettes
                          </div>
                          <div style={{
                            height: '4px',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${capacityPercent}%`,
                              height: '100%',
                              backgroundColor: capacityPercent > 50 ? '#4caf50' : capacityPercent > 20 ? '#ff9800' : '#f44336',
                              transition: 'width 0.3s',
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking form */}
        {showBookingForm && selectedSlot && (
          <div style={{
            width: '320px',
            borderLeft: '1px solid #e0e0e0',
            padding: '20px',
            backgroundColor: '#fafafa',
          }}>
            <h4 style={{ margin: '0 0 16px', color: '#1976d2' }}>
              Confirmer la réservation
            </h4>

            <div style={{
              padding: '12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ fontWeight: 600 }}>{selectedSlot.siteName}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {selectedSlot.date} • {selectedSlot.startTime} - {selectedSlot.endTime}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>{selectedSlot.dockName}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Nom du chauffeur *
                </label>
                <input
                  type="text"
                  value={bookingData.driverName}
                  onChange={e => setBookingData(d => ({ ...d, driverName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Téléphone chauffeur
                </label>
                <input
                  type="tel"
                  value={bookingData.driverPhone}
                  onChange={e => setBookingData(d => ({ ...d, driverPhone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Immatriculation véhicule *
                </label>
                <input
                  type="text"
                  value={bookingData.vehiclePlate}
                  onChange={e => setBookingData(d => ({ ...d, vehiclePlate: e.target.value.toUpperCase() }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                  }}
                  placeholder="AB-123-CD"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Immatriculation remorque
                </label>
                <input
                  type="text"
                  value={bookingData.trailerPlate}
                  onChange={e => setBookingData(d => ({ ...d, trailerPlate: e.target.value.toUpperCase() }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                  }}
                  placeholder="EF-456-GH"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Nombre de palettes *
                </label>
                <input
                  type="number"
                  value={bookingData.palletCount}
                  onChange={e => setBookingData(d => ({ ...d, palletCount: parseInt(e.target.value) || 0 }))}
                  min={1}
                  max={selectedSlot.capacity.remainingPallets}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Max: {selectedSlot.capacity.remainingPallets} palettes
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Référence commande
                </label>
                <input
                  type="text"
                  value={bookingData.orderRef}
                  onChange={e => setBookingData(d => ({ ...d, orderRef: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="CMD-2024-001"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={e => setBookingData(d => ({ ...d, notes: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                  placeholder="Instructions particulières..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    onSlotSelect(null);
                    setShowBookingForm(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isFormValid}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isFormValid ? '#1976d2' : '#ccc',
                    color: '#fff',
                    cursor: isFormValid ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotPicker;

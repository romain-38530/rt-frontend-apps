import React, { useState, useMemo } from 'react';

export interface TimeSlot {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId?: string;
  dockName?: string;
  status: 'available' | 'booked' | 'blocked' | 'selected';
}

export interface SlotGridPickerProps {
  /** Date a afficher (format YYYY-MM-DD) */
  selectedDate: string;
  /** Creneaux disponibles pour cette date */
  slots: TimeSlot[];
  /** Callback quand un creneau est selectionne */
  onSlotSelect: (slot: TimeSlot) => void;
  /** Creneau actuellement selectionne */
  selectedSlotId?: string;
  /** Horaires d'ouverture du site (defaut: 06:00-20:00) */
  openingHour?: number;
  closingHour?: number;
  /** Duree d'un slot en minutes (defaut: 30) */
  slotDuration?: number;
  /** Afficher les quais (docks) en colonnes */
  showDocks?: boolean;
  /** Liste des quais a afficher */
  docks?: Array<{ dockId: string; dockName: string }>;
  /** Permettre la navigation entre dates */
  allowDateNavigation?: boolean;
  /** Callback pour changer de date */
  onDateChange?: (date: string) => void;
  /** Date min pour la navigation */
  minDate?: string;
  /** Date max pour la navigation */
  maxDate?: string;
}

export const SlotGridPicker: React.FC<SlotGridPickerProps> = ({
  selectedDate,
  slots,
  onSlotSelect,
  selectedSlotId,
  openingHour = 6,
  closingHour = 20,
  slotDuration = 30,
  showDocks = false,
  docks = [],
  allowDateNavigation = true,
  onDateChange,
  minDate,
  maxDate,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Generer les heures de la journee
  const timeSlots = useMemo(() => {
    const times: string[] = [];
    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        times.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
    return times;
  }, [openingHour, closingHour, slotDuration]);

  // Formater la date pour l'affichage
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Navigation date
  const handlePrevDate = () => {
    if (!onDateChange) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const newDate = current.toISOString().split('T')[0];
    if (!minDate || newDate >= minDate) {
      onDateChange(newDate);
    }
  };

  const handleNextDate = () => {
    if (!onDateChange) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    const newDate = current.toISOString().split('T')[0];
    if (!maxDate || newDate <= maxDate) {
      onDateChange(newDate);
    }
  };

  // Trouver le slot correspondant a une heure et un dock
  const getSlotForTime = (time: string, dockId?: string): TimeSlot | null => {
    return slots.find(s =>
      s.startTime === time &&
      (!dockId || s.dockId === dockId)
    ) || null;
  };

  // Couleurs des statuts
  const getSlotStyle = (slot: TimeSlot | null, isSelected: boolean, isHovered: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 4px',
      textAlign: 'center',
      cursor: slot?.status === 'available' ? 'pointer' : 'not-allowed',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.15s ease',
      border: '1px solid transparent',
    };

    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: '#8b5cf6',
        color: 'white',
        border: '2px solid #7c3aed',
        transform: 'scale(1.02)',
      };
    }

    if (!slot || slot.status === 'blocked') {
      return {
        ...baseStyle,
        backgroundColor: '#f3f4f6',
        color: '#9ca3af',
        cursor: 'not-allowed',
      };
    }

    if (slot.status === 'booked') {
      return {
        ...baseStyle,
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        cursor: 'not-allowed',
      };
    }

    if (slot.status === 'available') {
      return {
        ...baseStyle,
        backgroundColor: isHovered ? '#dcfce7' : '#ecfdf5',
        color: '#059669',
        border: isHovered ? '1px solid #86efac' : '1px solid #d1fae5',
      };
    }

    return baseStyle;
  };

  // Si pas de docks, afficher en mode simple
  if (!showDocks || docks.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header avec navigation */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {allowDateNavigation && onDateChange && (
            <button
              onClick={handlePrevDate}
              disabled={minDate ? selectedDate <= minDate : false}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: minDate && selectedDate <= minDate ? 0.5 : 1,
              }}
            >
              ← Jour precedent
            </button>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              {formatDisplayDate(selectedDate)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {slots.filter(s => s.status === 'available').length} creneaux disponibles
            </div>
          </div>
          {allowDateNavigation && onDateChange && (
            <button
              onClick={handleNextDate}
              disabled={maxDate ? selectedDate >= maxDate : false}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: maxDate && selectedDate >= maxDate ? 0.5 : 1,
              }}
            >
              Jour suivant →
            </button>
          )}
        </div>

        {/* Grille simple */}
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px',
          }}>
            {timeSlots.map((time) => {
              const slot = getSlotForTime(time);
              const isSelected = slot?.slotId === selectedSlotId;
              const isHovered = slot?.slotId === hoveredSlot;

              return (
                <div
                  key={time}
                  onClick={() => slot?.status === 'available' && onSlotSelect(slot)}
                  onMouseEnter={() => slot?.status === 'available' && setHoveredSlot(slot.slotId)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  style={getSlotStyle(slot, isSelected, isHovered)}
                >
                  {time}
                  {isSelected && <div style={{ fontSize: '10px', marginTop: '2px' }}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legende */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}></div>
            <span style={{ color: '#6b7280' }}>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fee2e2' }}></div>
            <span style={{ color: '#6b7280' }}>Reserve</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#8b5cf6' }}></div>
            <span style={{ color: '#6b7280' }}>Selectionne</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode avec quais (docks)
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header avec navigation */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {allowDateNavigation && onDateChange && (
          <button
            onClick={handlePrevDate}
            disabled={minDate ? selectedDate <= minDate : false}
            style={{
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: minDate && selectedDate <= minDate ? 0.5 : 1,
            }}
          >
            ←
          </button>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
            {formatDisplayDate(selectedDate)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            {slots.filter(s => s.status === 'available').length} creneaux disponibles
          </div>
        </div>
        {allowDateNavigation && onDateChange && (
          <button
            onClick={handleNextDate}
            disabled={maxDate ? selectedDate >= maxDate : false}
            style={{
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: maxDate && selectedDate >= maxDate ? 0.5 : 1,
            }}
          >
            →
          </button>
        )}
      </div>

      {/* Grille avec quais */}
      <div style={{ padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600', width: '60px' }}>
                Heure
              </th>
              {docks.map(dock => (
                <th key={dock.dockId} style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#374151', fontWeight: '600' }}>
                  {dock.dockName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td style={{ padding: '4px 8px', fontSize: '12px', color: '#6b7280', fontWeight: '500', borderRight: '1px solid #e5e7eb' }}>
                  {time}
                </td>
                {docks.map(dock => {
                  const slot = getSlotForTime(time, dock.dockId);
                  const isSelected = slot?.slotId === selectedSlotId;
                  const isHovered = slot?.slotId === hoveredSlot;

                  return (
                    <td key={dock.dockId} style={{ padding: '4px' }}>
                      <div
                        onClick={() => slot?.status === 'available' && onSlotSelect(slot)}
                        onMouseEnter={() => slot?.status === 'available' && setHoveredSlot(slot?.slotId || null)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        style={getSlotStyle(slot, isSelected, isHovered)}
                      >
                        {slot?.status === 'available' ? '✓' : slot?.status === 'booked' ? '✕' : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legende */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}></div>
          <span style={{ color: '#6b7280' }}>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fee2e2' }}></div>
          <span style={{ color: '#6b7280' }}>Reserve</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#8b5cf6' }}></div>
          <span style={{ color: '#6b7280' }}>Selectionne</span>
        </div>
      </div>
    </div>
  );
};

export default SlotGridPicker;

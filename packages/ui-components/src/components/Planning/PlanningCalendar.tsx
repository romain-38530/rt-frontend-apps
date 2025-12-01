/**
 * PlanningCalendar - Calendrier multi-vues pour la planification des chargements/livraisons
 *
 * Vues disponibles:
 * - day: Vue journalière par quai
 * - week: Vue hebdomadaire
 * - dock: Vue par quai de chargement
 * - transporter: Vue par transporteur
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface PlanningSlot {
  id: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dockId: string;
  dockName: string;
  siteId: string;
  siteName: string;
  status: 'available' | 'booked' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  booking?: {
    id: string;
    transporterName: string;
    transporterId: string;
    driverName?: string;
    driverPhone?: string;
    vehiclePlate?: string;
    orderRef?: string;
    cargoType?: string;
    palletCount?: number;
  };
  capacity?: {
    maxPallets: number;
    maxWeight: number;
  };
}

export interface PlanningDock {
  id: string;
  name: string;
  siteId: string;
  type: 'loading' | 'unloading' | 'both';
  isActive: boolean;
}

export interface PlanningCalendarProps {
  slots: PlanningSlot[];
  docks: PlanningDock[];
  view: 'day' | 'week' | 'dock' | 'transporter';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'day' | 'week' | 'dock' | 'transporter') => void;
  onSlotClick: (slot: PlanningSlot) => void;
  onSlotBook?: (slot: PlanningSlot) => void;
  onSlotCancel?: (slot: PlanningSlot) => void;
  readOnly?: boolean;
  highlightedTransporterId?: string;
  workingHours?: { start: string; end: string };
  style?: React.CSSProperties;
}

const HOUR_HEIGHT = 60; // pixels per hour
const SLOT_MIN_HEIGHT = 30;

const statusColors: Record<PlanningSlot['status'], { bg: string; border: string; text: string }> = {
  available: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
  booked: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
  in_progress: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  completed: { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },
  cancelled: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
  blocked: { bg: '#eceff1', border: '#607d8b', text: '#37474f' },
};

const statusLabels: Record<PlanningSlot['status'], string> = {
  available: 'Disponible',
  booked: 'Réservé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  blocked: 'Bloqué',
};

export const PlanningCalendar: React.FC<PlanningCalendarProps> = ({
  slots,
  docks,
  view,
  selectedDate,
  onDateChange,
  onViewChange,
  onSlotClick,
  onSlotBook,
  onSlotCancel,
  readOnly = false,
  highlightedTransporterId,
  workingHours = { start: '06:00', end: '20:00' },
  style,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Generate hours array for the day view
  const hours = useMemo(() => {
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    const result: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return result;
  }, [workingHours]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Filter slots for current view
  const filteredSlots = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (view === 'week') {
      const weekStart = weekDays[0].toISOString().split('T')[0];
      const weekEnd = weekDays[6].toISOString().split('T')[0];
      return slots.filter(s => s.date >= weekStart && s.date <= weekEnd);
    }

    return slots.filter(s => s.date === dateStr);
  }, [slots, selectedDate, view, weekDays]);

  // Calculate slot position
  const getSlotStyle = useCallback((slot: PlanningSlot): React.CSSProperties => {
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const workStart = parseInt(workingHours.start.split(':')[0]);

    const startMinutes = (startH - workStart) * 60 + startM;
    const endMinutes = (endH - workStart) * 60 + endM;
    const duration = endMinutes - startMinutes;

    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, SLOT_MIN_HEIGHT);

    const colors = statusColors[slot.status];
    const isHighlighted = highlightedTransporterId && slot.booking?.transporterId === highlightedTransporterId;

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '2px',
      right: '2px',
      backgroundColor: colors.bg,
      borderLeft: `4px solid ${colors.border}`,
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: slot.status === 'available' && !readOnly ? 'pointer' : 'default',
      overflow: 'hidden',
      fontSize: '12px',
      boxShadow: isHighlighted ? `0 0 0 2px ${colors.border}` : 'none',
      opacity: hoveredSlot === slot.id ? 0.9 : 1,
      transition: 'opacity 0.2s, box-shadow 0.2s',
    };
  }, [workingHours, highlightedTransporterId, readOnly, hoveredSlot]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    onDateChange(newDate);
  };

  // Group slots by dock for dock view
  const slotsByDock = useMemo(() => {
    const grouped: Record<string, PlanningSlot[]> = {};
    docks.forEach(dock => {
      grouped[dock.id] = filteredSlots.filter(s => s.dockId === dock.id);
    });
    return grouped;
  }, [filteredSlots, docks]);

  // Group slots by transporter for transporter view
  const slotsByTransporter = useMemo(() => {
    const grouped: Record<string, { name: string; slots: PlanningSlot[] }> = {};
    filteredSlots.forEach(slot => {
      if (slot.booking?.transporterId) {
        if (!grouped[slot.booking.transporterId]) {
          grouped[slot.booking.transporterId] = { name: slot.booking.transporterName, slots: [] };
        }
        grouped[slot.booking.transporterId].slots.push(slot);
      }
    });
    return grouped;
  }, [filteredSlots]);

  const renderSlotContent = (slot: PlanningSlot) => {
    const colors = statusColors[slot.status];
    return (
      <div
        style={getSlotStyle(slot)}
        onClick={() => onSlotClick(slot)}
        onMouseEnter={() => setHoveredSlot(slot.id)}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <div style={{ fontWeight: 600, color: colors.text }}>
          {slot.startTime} - {slot.endTime}
        </div>
        {slot.booking ? (
          <>
            <div style={{ color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {slot.booking.transporterName}
            </div>
            {slot.booking.vehiclePlate && (
              <div style={{ color: '#666', fontSize: '11px' }}>{slot.booking.vehiclePlate}</div>
            )}
          </>
        ) : (
          <div style={{ color: colors.text }}>{statusLabels[slot.status]}</div>
        )}
      </div>
    );
  };

  const gridHeight = hours.length * HOUR_HEIGHT;

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
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span style={{ fontWeight: 600, minWidth: '200px', textAlign: 'center' }}>
            {view === 'week'
              ? `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`
              : formatDate(selectedDate)
            }
          </span>
          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            →
          </button>
          <button
            onClick={() => onDateChange(new Date())}
            style={{
              padding: '8px 16px',
              border: '1px solid #2196f3',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#2196f3',
              cursor: 'pointer',
              marginLeft: '8px',
            }}
          >
            Aujourd'hui
          </button>
        </div>

        {/* View selector */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e0e0e0', padding: '4px', borderRadius: '8px' }}>
          {(['day', 'week', 'dock', 'transporter'] as const).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: view === v ? '#fff' : 'transparent',
                color: view === v ? '#1976d2' : '#666',
                fontWeight: view === v ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : v === 'dock' ? 'Quais' : 'Transporteurs'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        {Object.entries(statusLabels).map(([status, label]) => {
          const colors = statusColors[status as PlanningSlot['status']];
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
                borderRadius: '2px',
              }} />
              <span style={{ fontSize: '12px', color: '#666' }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div style={{ padding: '20px', overflowX: 'auto' }}>
        {(view === 'day' || view === 'dock') && (
          <div style={{ display: 'flex', minWidth: docks.length * 150 + 60 }}>
            {/* Time column */}
            <div style={{ width: '60px', flexShrink: 0 }}>
              <div style={{ height: '40px' }} /> {/* Header spacer */}
              {hours.map(hour => (
                <div key={hour} style={{
                  height: `${HOUR_HEIGHT}px`,
                  borderTop: '1px solid #eee',
                  paddingRight: '8px',
                  textAlign: 'right',
                  fontSize: '12px',
                  color: '#666',
                }}>
                  {hour}
                </div>
              ))}
            </div>

            {/* Dock columns */}
            {docks.filter(d => d.isActive).map(dock => (
              <div key={dock.id} style={{ flex: 1, minWidth: '150px', borderLeft: '1px solid #e0e0e0' }}>
                <div style={{
                  height: '40px',
                  padding: '8px',
                  fontWeight: 600,
                  textAlign: 'center',
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #e0e0e0',
                }}>
                  {dock.name}
                </div>
                <div style={{ position: 'relative', height: `${gridHeight}px` }}>
                  {hours.map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: `${i * HOUR_HEIGHT}px`,
                      left: 0,
                      right: 0,
                      height: `${HOUR_HEIGHT}px`,
                      borderTop: '1px solid #eee',
                    }} />
                  ))}
                  {slotsByDock[dock.id]?.map(slot => renderSlotContent(slot))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'week' && (
          <div style={{ display: 'flex', minWidth: '800px' }}>
            {/* Time column */}
            <div style={{ width: '60px', flexShrink: 0 }}>
              <div style={{ height: '40px' }} />
              {hours.map(hour => (
                <div key={hour} style={{
                  height: `${HOUR_HEIGHT}px`,
                  borderTop: '1px solid #eee',
                  paddingRight: '8px',
                  textAlign: 'right',
                  fontSize: '12px',
                  color: '#666',
                }}>
                  {hour}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map(day => {
              const dayStr = day.toISOString().split('T')[0];
              const daySlots = filteredSlots.filter(s => s.date === dayStr);
              const isToday = dayStr === new Date().toISOString().split('T')[0];

              return (
                <div key={dayStr} style={{ flex: 1, minWidth: '100px', borderLeft: '1px solid #e0e0e0' }}>
                  <div style={{
                    height: '40px',
                    padding: '8px',
                    fontWeight: 600,
                    textAlign: 'center',
                    backgroundColor: isToday ? '#e3f2fd' : '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    color: isToday ? '#1976d2' : 'inherit',
                  }}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ position: 'relative', height: `${gridHeight}px` }}>
                    {hours.map((_, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        top: `${i * HOUR_HEIGHT}px`,
                        left: 0,
                        right: 0,
                        height: `${HOUR_HEIGHT}px`,
                        borderTop: '1px solid #eee',
                      }} />
                    ))}
                    {daySlots.map(slot => renderSlotContent(slot))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'transporter' && (
          <div>
            {Object.entries(slotsByTransporter).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Aucune réservation pour cette période
              </div>
            ) : (
              Object.entries(slotsByTransporter).map(([transporterId, data]) => (
                <div key={transporterId} style={{
                  marginBottom: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    fontWeight: 600,
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    {data.name} ({data.slots.length} créneaux)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px' }}>
                    {data.slots.map(slot => {
                      const colors = statusColors[slot.status];
                      return (
                        <div
                          key={slot.id}
                          onClick={() => onSlotClick(slot)}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: colors.bg,
                            borderLeft: `4px solid ${colors.border}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            minWidth: '200px',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.text }}>
                            {slot.date} • {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {slot.siteName} - {slot.dockName}
                          </div>
                          {slot.booking?.vehiclePlate && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {slot.booking.vehiclePlate}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningCalendar;

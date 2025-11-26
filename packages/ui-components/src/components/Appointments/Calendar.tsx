/**
 * Composant Calendar pour afficher les rendez-vous
 * Vue mensuelle interactive
 */

import React, { useState, useMemo } from 'react';
import type { CalendarEvent } from '@rt/contracts';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  selectedDate?: Date;
  height?: string | number;
}

const DAYS_OF_WEEK = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventClick,
  onDateClick,
  onMonthChange,
  selectedDate,
  height = '600px',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculer les jours du mois
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Ajouter les jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysCount; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Regrouper les événements par date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });

    return map;
  }, [events]);

  // Navigation mois
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onMonthChange?.(today);
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Vérifier si c'est la date sélectionnée
  const isSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Obtenir les événements d'une date
  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate.get(dateKey) || [];
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: 'white',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  };

  const dayHeaderStyle: React.CSSProperties = {
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '13px',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const dayCellStyle: React.CSSProperties = {
    minHeight: '100px',
    padding: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header avec navigation */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={goToPreviousMonth}
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            ← Précédent
          </button>
          <button
            onClick={goToNextMonth}
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            Suivant →
          </button>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <button
          onClick={goToToday}
          style={{ ...buttonStyle, backgroundColor: '#667eea', color: 'white', border: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5568d3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#667eea')}
        >
          Aujourd'hui
        </button>
      </div>

      {/* Jours de la semaine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} style={dayHeaderStyle}>
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${Math.ceil(daysInMonth.length / 7)}, 1fr)`,
          overflow: 'auto',
        }}
      >
        {daysInMonth.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);
          const isSelectedDay = isSelected(date);

          return (
            <div
              key={index}
              style={{
                ...dayCellStyle,
                backgroundColor: date
                  ? isCurrentDay
                    ? '#f0f9ff'
                    : isSelectedDay
                    ? '#fef3c7'
                    : 'white'
                  : '#f9fafb',
              }}
              onClick={() => date && onDateClick?.(date)}
              onMouseEnter={(e) => {
                if (date) {
                  e.currentTarget.style.backgroundColor = isCurrentDay
                    ? '#e0f2fe'
                    : isSelectedDay
                    ? '#fde68a'
                    : '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (date) {
                  e.currentTarget.style.backgroundColor = isCurrentDay
                    ? '#f0f9ff'
                    : isSelectedDay
                    ? '#fef3c7'
                    : 'white';
                }
              }}
            >
              {date && (
                <>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isCurrentDay ? '700' : '600',
                      marginBottom: '4px',
                      color: isCurrentDay ? '#0ea5e9' : '#111827',
                    }}
                  >
                    {date.getDate()}
                  </div>

                  {/* Événements */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        style={{
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          borderRadius: '4px',
                          backgroundColor: event.color || '#3b82f6',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          fontWeight: '600',
                          marginTop: '2px',
                        }}
                      >
                        +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#10b981' }} />
          <span>Confirmé</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#3b82f6' }} />
          <span>Proposé</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
          <span>En attente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#6b7280' }} />
          <span>Terminé</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

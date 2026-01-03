import React, { CSSProperties } from 'react';

export interface DrivingTimeDisplayProps {
  driverName: string;
  driverId: string;
  currentSession: DrivingSession;
  dailyStats: DailyDrivingStats;
  weeklyStats: WeeklyDrivingStats;
  nextRequiredBreak: BreakInfo;
  alerts: ComplianceAlert[];
  language?: 'fr' | 'en';
}

export interface DrivingSession {
  startTime: string;
  drivingMinutes: number;
  maxContinuousDriving: number; // 270 minutes (4h30)
}

export interface DailyDrivingStats {
  date: string;
  totalDrivingMinutes: number;
  maxDailyDriving: number; // 540 minutes (9h) or 600 (10h) twice per week
  extendedDayUsed: boolean;
  remainingMinutes: number;
  breaksTaken: number;
  restCompleted: boolean;
}

export interface WeeklyDrivingStats {
  weekNumber: number;
  totalDrivingMinutes: number;
  maxWeeklyDriving: number; // 3360 minutes (56h)
  remainingMinutes: number;
  extendedDaysUsed: number;
  maxExtendedDays: number; // 2
}

export interface BreakInfo {
  type: 'break' | 'daily_rest' | 'weekly_rest';
  requiredInMinutes: number;
  durationMinutes: number;
  reason: string;
}

export interface ComplianceAlert {
  type: 'warning' | 'critical' | 'info';
  code: string;
  message: string;
  regulation: string;
}

const translations = {
  fr: {
    title: 'Temps de Conduite',
    regulation: 'Réglementation EU 561/2006',
    currentSession: 'Session en cours',
    dailyDriving: 'Conduite journalière',
    weeklyDriving: 'Conduite hebdomadaire',
    nextBreak: 'Prochaine pause requise',
    alerts: 'Alertes conformité',
    driving: 'Conduite',
    remaining: 'Restant',
    break: 'Pause',
    dailyRest: 'Repos journalier',
    weeklyRest: 'Repos hebdomadaire',
    inMinutes: 'dans',
    minutes: 'min',
    hours: 'h',
    extended: 'Journée prolongée',
    usedThisWeek: 'utilisées cette semaine',
    noAlerts: 'Aucune alerte - Conformité OK',
  },
  en: {
    title: 'Driving Time',
    regulation: 'EU 561/2006 Regulation',
    currentSession: 'Current session',
    dailyDriving: 'Daily driving',
    weeklyDriving: 'Weekly driving',
    nextBreak: 'Next required break',
    alerts: 'Compliance alerts',
    driving: 'Driving',
    remaining: 'Remaining',
    break: 'Break',
    dailyRest: 'Daily rest',
    weeklyRest: 'Weekly rest',
    inMinutes: 'in',
    minutes: 'min',
    hours: 'h',
    extended: 'Extended day',
    usedThisWeek: 'used this week',
    noAlerts: 'No alerts - Compliant',
  }
};

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return '#dc3545';
  if (percentage >= 75) return '#ffc107';
  return '#28a745';
};

export const DrivingTimeDisplay: React.FC<DrivingTimeDisplayProps> = ({
  driverName,
  driverId,
  currentSession,
  dailyStats,
  weeklyStats,
  nextRequiredBreak,
  alerts,
  language = 'fr'
}) => {
  const t = translations[language];

  const containerStyles: CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  };

  const headerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  };

  const titleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const regulationBadgeStyles: CSSProperties = {
    fontSize: '11px',
    padding: '4px 10px',
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '12px',
    fontWeight: 500,
  };

  const gridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  };

  const cardStyles: CSSProperties = {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
  };

  const cardTitleStyles: CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  };

  const progressContainerStyles: CSSProperties = {
    marginBottom: '12px',
  };

  const progressBarBgStyles: CSSProperties = {
    height: '8px',
    background: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const progressBarStyles = (percentage: number): CSSProperties => ({
    height: '100%',
    width: `${Math.min(percentage, 100)}%`,
    background: getProgressColor(percentage),
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  });

  const progressTextStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginTop: '8px',
  };

  const timeValueStyles: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a2e',
  };

  const timeMaxStyles: CSSProperties = {
    fontSize: '14px',
    color: '#888',
  };

  const breakCardStyles: CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '20px',
    color: 'white',
    marginBottom: '24px',
  };

  const breakTitleStyles: CSSProperties = {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '8px',
  };

  const breakTimeStyles: CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
  };

  const breakTypeStyles: CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    fontSize: '12px',
    marginTop: '12px',
  };

  const alertsContainerStyles: CSSProperties = {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  };

  const alertStyles = (type: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '8px',
    background: type === 'critical' ? '#f8d7da' :
                type === 'warning' ? '#fff3cd' : '#d1ecf1',
    border: `1px solid ${type === 'critical' ? '#f5c6cb' :
                         type === 'warning' ? '#ffeeba' : '#bee5eb'}`,
  });

  const alertIconStyles: CSSProperties = {
    fontSize: '18px',
    flexShrink: 0,
  };

  const alertTextStyles: CSSProperties = {
    flex: 1,
  };

  const alertMessageStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  };

  const alertRegulationStyles: CSSProperties = {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
  };

  const noAlertsStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    background: '#d4edda',
    borderRadius: '8px',
    color: '#155724',
    fontWeight: 500,
  };

  const sessionPercentage = (currentSession.drivingMinutes / currentSession.maxContinuousDriving) * 100;
  const dailyPercentage = (dailyStats.totalDrivingMinutes / dailyStats.maxDailyDriving) * 100;
  const weeklyPercentage = (weeklyStats.totalDrivingMinutes / weeklyStats.maxWeeklyDriving) * 100;

  const getBreakTypeLabel = (type: string) => {
    switch (type) {
      case 'break': return t.break;
      case 'daily_rest': return t.dailyRest;
      case 'weekly_rest': return t.weeklyRest;
      default: return type;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          <span>🚛</span>
          {t.title} - {driverName}
        </div>
        <span style={regulationBadgeStyles}>{t.regulation}</span>
      </div>

      <div style={gridStyles}>
        {/* Current Session */}
        <div style={cardStyles}>
          <div style={cardTitleStyles}>{t.currentSession}</div>
          <div style={progressContainerStyles}>
            <div style={progressBarBgStyles}>
              <div style={progressBarStyles(sessionPercentage)} />
            </div>
            <div style={progressTextStyles}>
              <span style={timeValueStyles}>{formatTime(currentSession.drivingMinutes)}</span>
              <span style={timeMaxStyles}>/ {formatTime(currentSession.maxContinuousDriving)}</span>
            </div>
          </div>
        </div>

        {/* Daily Driving */}
        <div style={cardStyles}>
          <div style={cardTitleStyles}>
            {t.dailyDriving}
            {dailyStats.extendedDayUsed && (
              <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ffc107', padding: '2px 6px', borderRadius: '4px', color: '#333' }}>
                {t.extended}
              </span>
            )}
          </div>
          <div style={progressContainerStyles}>
            <div style={progressBarBgStyles}>
              <div style={progressBarStyles(dailyPercentage)} />
            </div>
            <div style={progressTextStyles}>
              <span style={timeValueStyles}>{formatTime(dailyStats.totalDrivingMinutes)}</span>
              <span style={timeMaxStyles}>/ {formatTime(dailyStats.maxDailyDriving)}</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
            {t.remaining}: {formatTime(dailyStats.remainingMinutes)}
          </div>
        </div>

        {/* Weekly Driving */}
        <div style={cardStyles}>
          <div style={cardTitleStyles}>{t.weeklyDriving}</div>
          <div style={progressContainerStyles}>
            <div style={progressBarBgStyles}>
              <div style={progressBarStyles(weeklyPercentage)} />
            </div>
            <div style={progressTextStyles}>
              <span style={timeValueStyles}>{formatTime(weeklyStats.totalDrivingMinutes)}</span>
              <span style={timeMaxStyles}>/ {formatTime(weeklyStats.maxWeeklyDriving)}</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {t.extended}: {weeklyStats.extendedDaysUsed}/{weeklyStats.maxExtendedDays} {t.usedThisWeek}
          </div>
        </div>
      </div>

      {/* Next Required Break */}
      <div style={breakCardStyles}>
        <div style={breakTitleStyles}>{t.nextBreak}</div>
        <div style={breakTimeStyles}>
          {t.inMinutes} {formatTime(nextRequiredBreak.requiredInMinutes)}
        </div>
        <div style={breakTypeStyles}>
          {getBreakTypeLabel(nextRequiredBreak.type)} ({formatTime(nextRequiredBreak.durationMinutes)})
        </div>
      </div>

      {/* Alerts */}
      <div style={alertsContainerStyles}>
        <div style={{ ...cardTitleStyles, marginBottom: '16px' }}>{t.alerts}</div>

        {alerts.length === 0 ? (
          <div style={noAlertsStyles}>
            <span>✅</span>
            {t.noAlerts}
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} style={alertStyles(alert.type)}>
              <span style={alertIconStyles}>{getAlertIcon(alert.type)}</span>
              <div style={alertTextStyles}>
                <div style={alertMessageStyles}>{alert.message}</div>
                <div style={alertRegulationStyles}>{alert.regulation}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DrivingTimeDisplay;

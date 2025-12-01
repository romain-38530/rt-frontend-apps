/**
 * DriverKiosk - Borne virtuelle chauffeur
 *
 * Interface de check-in/check-out pour les chauffeurs avec:
 * - Scan QR code de réservation
 * - Détection GPS/geofence automatique
 * - Affichage des informations de quai
 * - Signature de réception/livraison
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface DriverBooking {
  id: string;
  confirmationCode: string;
  date: string;
  startTime: string;
  endTime: string;
  siteName: string;
  siteAddress: string;
  dockName: string;
  dockInstructions?: string;
  type: 'loading' | 'unloading';
  status: 'confirmed' | 'checked_in' | 'at_dock' | 'loading' | 'completed' | 'cancelled';
  cargo: {
    palletCount: number;
    description?: string;
    orderRef?: string;
  };
  transporter: {
    name: string;
    vehiclePlate: string;
    trailerPlate?: string;
  };
  driver: {
    name: string;
    phone?: string;
  };
  timestamps: {
    confirmed?: string;
    checkedIn?: string;
    atDock?: string;
    loadingStarted?: string;
    completed?: string;
  };
}

export interface DriverKioskProps {
  mode: 'standalone' | 'embedded';
  booking?: DriverBooking;
  onScanQR?: () => void;
  onCheckIn: (bookingId: string, location?: GeolocationPosition) => Promise<void>;
  onArriveAtDock: (bookingId: string) => Promise<void>;
  onStartLoading: (bookingId: string) => Promise<void>;
  onComplete: (bookingId: string, signature: string, notes?: string) => Promise<void>;
  onRequestHelp?: (bookingId: string, message: string) => void;
  geofenceEnabled?: boolean;
  geofenceRadius?: number; // meters
  siteLocation?: { lat: number; lng: number };
  style?: React.CSSProperties;
}

const statusSteps = [
  { key: 'confirmed', label: 'Confirmé', icon: '✓' },
  { key: 'checked_in', label: 'Arrivé sur site', icon: '📍' },
  { key: 'at_dock', label: 'Au quai', icon: '🚛' },
  { key: 'loading', label: 'En cours', icon: '📦' },
  { key: 'completed', label: 'Terminé', icon: '✅' },
];

const statusColors: Record<DriverBooking['status'], string> = {
  confirmed: '#2196f3',
  checked_in: '#ff9800',
  at_dock: '#9c27b0',
  loading: '#4caf50',
  completed: '#4caf50',
  cancelled: '#f44336',
};

export const DriverKiosk: React.FC<DriverKioskProps> = ({
  mode,
  booking,
  onScanQR,
  onCheckIn,
  onArriveAtDock,
  onStartLoading,
  onComplete,
  onRequestHelp,
  geofenceEnabled = true,
  geofenceRadius = 200,
  siteLocation,
  style,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Watch position for geofencing
  useEffect(() => {
    if (!geofenceEnabled || !siteLocation) return;

    let watchId: number;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position);

          // Calculate distance to site
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            siteLocation.lat,
            siteLocation.lng
          );

          setIsInGeofence(distance <= geofenceRadius);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [geofenceEnabled, siteLocation, geofenceRadius]);

  // Haversine formula for distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleAction = useCallback(async (action: () => Promise<void>, successMessage: string) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      setSuccess(successMessage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckIn = () => {
    if (!booking) return;
    handleAction(
      () => onCheckIn(booking.id, currentLocation || undefined),
      'Check-in effectué avec succès!'
    );
  };

  const handleArriveAtDock = () => {
    if (!booking) return;
    handleAction(
      () => onArriveAtDock(booking.id),
      'Arrivée au quai confirmée!'
    );
  };

  const handleStartLoading = () => {
    if (!booking) return;
    handleAction(
      () => onStartLoading(booking.id),
      'Opération démarrée!'
    );
  };

  const handleComplete = () => {
    if (!booking || !signature) return;
    handleAction(
      () => onComplete(booking.id, signature, completionNotes),
      'Opération terminée avec succès!'
    );
    setShowSignature(false);
  };

  const handleRequestHelp = () => {
    if (!booking || !helpMessage.trim()) return;
    onRequestHelp?.(booking.id, helpMessage);
    setHelpMessage('');
    setShowHelp(false);
    setSuccess('Demande d\'aide envoyée!');
  };

  const getCurrentStepIndex = (): number => {
    if (!booking) return -1;
    return statusSteps.findIndex(s => s.key === booking.status);
  };

  const getNextAction = (): { label: string; action: () => void; disabled: boolean } | null => {
    if (!booking) return null;

    switch (booking.status) {
      case 'confirmed':
        return {
          label: 'Je suis arrivé sur le site',
          action: handleCheckIn,
          disabled: geofenceEnabled && !isInGeofence,
        };
      case 'checked_in':
        return {
          label: 'Je suis au quai ' + booking.dockName,
          action: handleArriveAtDock,
          disabled: false,
        };
      case 'at_dock':
        return {
          label: booking.type === 'loading' ? 'Démarrer le chargement' : 'Démarrer le déchargement',
          action: handleStartLoading,
          disabled: false,
        };
      case 'loading':
        return {
          label: 'Terminer et signer',
          action: () => setShowSignature(true),
          disabled: false,
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();
  const currentStep = getCurrentStepIndex();

  // No booking view - show QR scanner prompt
  if (!booking) {
    return (
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        ...style
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚛</div>
        <h2 style={{ margin: '0 0 12px', color: '#333' }}>Borne Chauffeur</h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Scannez le QR code de votre réservation pour commencer
        </p>
        <button
          onClick={onScanQR}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 600,
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 auto',
          }}
        >
          <span style={{ fontSize: '24px' }}>📷</span>
          Scanner QR Code
        </button>
      </div>
    );
  }

  // Cancelled booking view
  if (booking.status === 'cancelled') {
    return (
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        ...style
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#ffebee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '40px',
        }}>
          ❌
        </div>
        <h2 style={{ margin: '0 0 12px', color: '#c62828' }}>Réservation annulée</h2>
        <p style={{ color: '#666' }}>
          Cette réservation a été annulée. Veuillez contacter votre dispatcher.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      maxWidth: mode === 'standalone' ? '600px' : '100%',
      margin: mode === 'standalone' ? '0 auto' : 0,
      ...style
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        backgroundColor: statusColors[booking.status],
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              {booking.type === 'loading' ? '🔼 Chargement' : '🔽 Déchargement'}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>{booking.siteName}</h2>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>{booking.siteAddress}</div>
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            {booking.confirmationCode}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ padding: '20px 24px', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '40px',
            right: '40px',
            height: '4px',
            backgroundColor: '#e0e0e0',
            zIndex: 0,
          }}>
            <div style={{
              width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
              height: '100%',
              backgroundColor: statusColors[booking.status],
              transition: 'width 0.5s ease',
            }} />
          </div>

          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.key} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? statusColors[booking.status] : '#e0e0e0',
                  color: isCompleted ? '#fff' : '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: isCurrent ? '3px solid #fff' : 'none',
                  boxShadow: isCurrent ? '0 0 0 3px ' + statusColors[booking.status] : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isCompleted ? '#333' : '#999',
                  marginTop: '8px',
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'center',
                  maxWidth: '70px',
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Details */}
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>📅 Date & Heure</div>
            <div style={{ fontWeight: 600 }}>{booking.date}</div>
            <div style={{ color: '#1976d2' }}>{booking.startTime} - {booking.endTime}</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🚛 Quai assigné</div>
            <div style={{ fontWeight: 600, fontSize: '20px', color: '#1976d2' }}>{booking.dockName}</div>
            {booking.dockInstructions && (
              <div style={{ fontSize: '12px', color: '#666' }}>{booking.dockInstructions}</div>
            )}
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>📦 Marchandise</div>
            <div style={{ fontWeight: 600 }}>{booking.cargo.palletCount} palettes</div>
            {booking.cargo.orderRef && (
              <div style={{ fontSize: '12px', color: '#666' }}>Ref: {booking.cargo.orderRef}</div>
            )}
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🚗 Véhicule</div>
            <div style={{ fontWeight: 600 }}>{booking.transporter.vehiclePlate}</div>
            {booking.transporter.trailerPlate && (
              <div style={{ fontSize: '12px', color: '#666' }}>Remorque: {booking.transporter.trailerPlate}</div>
            )}
          </div>
        </div>

        {/* Geofence status */}
        {geofenceEnabled && booking.status === 'confirmed' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: isInGeofence ? '#e8f5e9' : '#fff3e0',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>{isInGeofence ? '📍' : '🔍'}</span>
            <div>
              <div style={{ fontWeight: 500, color: isInGeofence ? '#2e7d32' : '#e65100' }}>
                {isInGeofence ? 'Vous êtes sur le site' : 'En attente de votre arrivée'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {isInGeofence
                  ? 'Vous pouvez confirmer votre arrivée'
                  : `Approchez-vous à moins de ${geofenceRadius}m du site`
                }
              </div>
            </div>
          </div>
        )}

        {/* Error/Success messages */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#c62828',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#2e7d32',
          }}>
            {success}
          </div>
        )}

        {/* Action button */}
        {nextAction && (
          <button
            onClick={nextAction.action}
            disabled={nextAction.disabled || loading}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: 600,
              backgroundColor: nextAction.disabled || loading ? '#ccc' : statusColors[booking.status],
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: nextAction.disabled || loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {loading ? 'Chargement...' : nextAction.label}
          </button>
        )}

        {/* Completed view */}
        {booking.status === 'completed' && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#e8f5e9',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontWeight: 600, color: '#2e7d32', fontSize: '18px' }}>
              Opération terminée
            </div>
            <div style={{ color: '#666', marginTop: '8px' }}>
              Merci et bonne route!
            </div>
          </div>
        )}

        {/* Help button */}
        {booking.status !== 'completed' && onRequestHelp && (
          <button
            onClick={() => setShowHelp(true)}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '14px',
              backgroundColor: '#fff',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🆘</span> Besoin d'aide?
          </button>
        )}
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <h3 style={{ margin: '0 0 20px' }}>Signature de confirmation</h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Signez ci-dessous
              </label>
              <div style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                cursor: 'pointer',
              }}>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Tapez votre nom pour signer"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontFamily: 'cursive',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Notes (optionnel)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
                placeholder="Remarques sur la livraison..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSignature(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleComplete}
                disabled={!signature || loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: signature ? '#4caf50' : '#ccc',
                  color: '#fff',
                  cursor: signature ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
          }}>
            <h3 style={{ margin: '0 0 20px' }}>🆘 Demande d'aide</h3>

            <textarea
              value={helpMessage}
              onChange={(e) => setHelpMessage(e.target.value)}
              rows={4}
              placeholder="Décrivez votre problème..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical',
                marginBottom: '20px',
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleRequestHelp}
                disabled={!helpMessage.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: helpMessage.trim() ? '#ff9800' : '#ccc',
                  color: '#fff',
                  cursor: helpMessage.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverKiosk;

import React, { useState, useEffect, useCallback } from 'react';

export interface DispatchCarrier {
  carrierId: string;
  carrierName: string;
  score: number;
  position: number;
  status: 'pending' | 'sent' | 'accepted' | 'refused';
  sentAt?: string;
  respondedAt?: string;
  reason?: string;
}

export interface DispatchEvent {
  id: string;
  type: string;
  timestamp: string;
  details: string;
  carrierName?: string;
  reason?: string;
}

export interface AutoPlanningModalProps {
  orders: Array<{
    id: string;
    _id?: string;
    reference?: string;
    pickupAddress?: { city?: string };
    deliveryAddress?: { city?: string };
    goods?: { weight?: number };
    estimatedPrice?: number;
  }>;
  onClose: () => void;
  onValidate: (orderId: string, carrierId: string) => Promise<void>;
  onEscalateToAffretIA: (orderIds: string[]) => void;
  /** Base URL for orders API - should NOT include /api/v1 suffix */
  ordersApiUrl?: string;
}

type PlanningStep = 'starting' | 'dispatching' | 'waiting' | 'completed' | 'failed' | 'affret_ia';

export const AutoPlanningModal: React.FC<AutoPlanningModalProps> = ({
  orders,
  onClose,
  onValidate,
  onEscalateToAffretIA,
  ordersApiUrl,
}) => {
  // Get the base API URL for orders - ensures /api/v1 prefix is used
  const getBaseUrl = () => {
    const envUrl = ordersApiUrl || process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
    // Remove any trailing /api or /api/v1 suffix, we'll add /api/v1/orders/... ourselves
    return envUrl.replace(/\/api(\/v1)?\/?$/, '');
  };
  const baseApiUrl = getBaseUrl();
  const [step, setStep] = useState<PlanningStep>('starting');
  const [dispatchChain, setDispatchChain] = useState<DispatchCarrier[]>([]);
  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPollCount = 60; // 60 * 2sec = 2 minutes

  const orderId = orders[0]?.id || orders[0]?._id;

  // Start auto-dispatch
  const startAutoDispatch = useCallback(async () => {
    if (!orderId) return;

    try {
      setStep('starting');
      setError(null);

      const response = await fetch(`${baseApiUrl}/api/v1/orders/${orderId}/auto-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API non disponible - veuillez réessayer plus tard');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du demarrage');
      }

      setDispatchChain(data.data.dispatchChain || []);
      setCurrentStatus(data.data.status);
      setStep('dispatching');

    } catch (err: any) {
      setError(err.message);
      setStep('failed');
    }
  }, [orderId, baseApiUrl]);

  // Poll for dispatch status
  const pollDispatchStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`${baseApiUrl}/api/v1/orders/${orderId}/dispatch-status`);
      const data = await response.json();

      if (response.ok && data.success) {
        setDispatchChain(data.data.dispatchChain || []);
        setEvents(data.data.events || []);
        setCurrentStatus(data.data.status);

        // Check status
        if (data.data.status === 'accepted') {
          setStep('completed');
        } else if (data.data.status === 'affret_ia') {
          setStep('affret_ia');
        } else if (data.data.status === 'echec_planification') {
          setStep('failed');
        } else if (data.data.status === 'planification_auto') {
          // Still in progress
          setPollCount(prev => prev + 1);
        }
      }
    } catch (err: any) {
      console.error('Poll error:', err);
    }
  }, [orderId, baseApiUrl]);

  // Start dispatch on mount
  useEffect(() => {
    startAutoDispatch();
  }, [startAutoDispatch]);

  // Poll for status updates
  useEffect(() => {
    if (step === 'dispatching' && pollCount < maxPollCount) {
      const timer = setTimeout(pollDispatchStatus, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, pollCount, pollDispatchStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#22c55e';
      case 'refused': return '#ef4444';
      case 'sent': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepte';
      case 'refused': return 'Refuse';
      case 'sent': return 'En attente';
      case 'pending': return 'En file';
      default: return status;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: step === 'completed' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                     step === 'affret_ia' ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' :
                     step === 'failed' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                     'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>
              {step === 'completed' ? '✅' : step === 'affret_ia' ? '🚀' : step === 'failed' ? '❌' : '🤖'}
            </span>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '700' }}>
                {step === 'completed' ? 'Planification Reussie' :
                 step === 'affret_ia' ? 'Escalade Affret IA' :
                 step === 'failed' ? 'Echec Planification' :
                 'Planification Auto'}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                {orders[0]?.reference || orderId}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Starting */}
          {step === 'starting' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700' }}>
                Demarrage de la planification...
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Recherche des meilleurs transporteurs
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Dispatching - Show dispatch chain */}
          {step === 'dispatching' && (
            <div>
              <div style={{
                textAlign: 'center',
                padding: '16px',
                backgroundColor: '#ede9fe',
                borderRadius: '12px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '14px', color: '#6d28d9', marginBottom: '4px' }}>
                  Statut: <strong>Planification en cours</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#7c3aed' }}>
                  Attente reponse transporteur...
                </div>
              </div>

              {/* Dispatch Chain */}
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Chaine de dispatch ({dispatchChain.length} transporteurs)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dispatchChain.map((carrier, index) => (
                  <div
                    key={carrier.carrierId}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: carrier.status === 'sent' ? '2px solid #f59e0b' :
                              carrier.status === 'accepted' ? '2px solid #22c55e' :
                              carrier.status === 'refused' ? '2px solid #ef4444' :
                              '1px solid #e5e7eb',
                      backgroundColor: carrier.status === 'sent' ? '#fef3c7' :
                                      carrier.status === 'accepted' ? '#f0fdf4' :
                                      carrier.status === 'refused' ? '#fef2f2' :
                                      'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(carrier.status),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}>
                          {carrier.position}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827' }}>{carrier.carrierName}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Score: {carrier.score}/100
                            {carrier.sentAt && ` • Envoye a ${formatTime(carrier.sentAt)}`}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: getStatusColor(carrier.status),
                        color: 'white',
                      }}>
                        {getStatusLabel(carrier.status)}
                      </div>
                    </div>
                    {carrier.reason && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#dc2626',
                      }}>
                        Raison: {carrier.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Events Timeline */}
              {events.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Historique
                  </h4>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '12px',
                    maxHeight: '150px',
                    overflow: 'auto',
                  }}>
                    {events.map((event, index) => (
                      <div
                        key={event.id || index}
                        style={{
                          padding: '8px 0',
                          borderBottom: index < events.length - 1 ? '1px solid #e5e7eb' : 'none',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>
                          {formatTime(event.timestamp)}
                        </div>
                        <div style={{ color: '#374151' }}>{event.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed */}
          {step === 'completed' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>
                Transporteur assigne !
              </h3>
              {dispatchChain.find(c => c.status === 'accepted') && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                    {dispatchChain.find(c => c.status === 'accepted')?.carrierName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#22c55e' }}>
                    a accepte la commande
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          )}

          {/* Affret IA */}
          {step === 'affret_ia' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '700', color: '#ec4899' }}>
                Escalade vers Affret IA
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                Tous les transporteurs ont refuse. La commande a ete transmise a Affret IA pour un matching elargi.
              </div>
              <button
                onClick={() => onEscalateToAffretIA([orderId!])}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Voir dans Affret IA
              </button>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                Echec de la planification
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                {error || 'Tous les transporteurs ont refuse et vous n\'avez pas d\'abonnement Affret IA.'}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={startAutoDispatch}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Reessayer
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '14px 24px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoPlanningModal;

import React, { useState, useEffect } from 'react';

export interface CarrierMatch {
  carrierId: string;
  carrierName: string;
  score: number;
  price: number;
  eta: string;
  rating: number;
  acceptanceRate: number;
  available: boolean;
}

export interface AutoPlanningModalProps {
  orders: Array<{
    id: string;
    reference: string;
    pickupAddress?: { city?: string };
    deliveryAddress?: { city?: string };
    goods?: { weight?: number };
    estimatedPrice?: number;
  }>;
  onClose: () => void;
  onValidate: (orderId: string, carrierId: string) => Promise<void>;
  onEscalateToAffretIA: (orderIds: string[]) => void;
  planningApiUrl?: string;
}

type PlanningStep = 'analyzing' | 'matching' | 'waiting' | 'escalating' | 'completed';

export const AutoPlanningModal: React.FC<AutoPlanningModalProps> = ({
  orders,
  onClose,
  onValidate,
  onEscalateToAffretIA,
  planningApiUrl = 'http://localhost:3002',
}) => {
  const [step, setStep] = useState<PlanningStep>('analyzing');
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState<Record<string, CarrierMatch[]>>({});
  const [selectedCarriers, setSelectedCarriers] = useState<Record<string, string>>({});
  const [waitingTime, setWaitingTime] = useState(0);
  const [validatedOrders, setValidatedOrders] = useState<Set<string>>(new Set());
  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set(orders.map(o => o.id)));
  const maxWaitTime = 120; // 2 minutes max wait

  // Simulation de l'analyse et matching
  useEffect(() => {
    if (step === 'analyzing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep('matching');
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Simulation du matching transporteurs
  useEffect(() => {
    if (step === 'matching') {
      // Simulate API call to find carriers
      setTimeout(() => {
        const simulatedMatches: Record<string, CarrierMatch[]> = {};
        orders.forEach(order => {
          simulatedMatches[order.id] = [
            {
              carrierId: 'carrier-1',
              carrierName: 'Transport Express SARL',
              score: 95,
              price: (order.estimatedPrice || 500) * 0.95,
              eta: '2h30',
              rating: 4.8,
              acceptanceRate: 92,
              available: true,
            },
            {
              carrierId: 'carrier-2',
              carrierName: 'Logistique Rapide',
              score: 88,
              price: (order.estimatedPrice || 500) * 0.98,
              eta: '3h00',
              rating: 4.5,
              acceptanceRate: 85,
              available: true,
            },
            {
              carrierId: 'carrier-3',
              carrierName: 'Euro Fret Services',
              score: 82,
              price: (order.estimatedPrice || 500) * 1.02,
              eta: '3h30',
              rating: 4.2,
              acceptanceRate: 78,
              available: true,
            },
          ];
        });
        setMatches(simulatedMatches);

        // Auto-select best match for each order
        const autoSelected: Record<string, string> = {};
        Object.keys(simulatedMatches).forEach(orderId => {
          if (simulatedMatches[orderId].length > 0) {
            autoSelected[orderId] = simulatedMatches[orderId][0].carrierId;
          }
        });
        setSelectedCarriers(autoSelected);
        setStep('waiting');
      }, 2000);
    }
  }, [step, orders]);

  // Timer d'attente validation
  useEffect(() => {
    if (step === 'waiting') {
      const interval = setInterval(() => {
        setWaitingTime(prev => {
          if (prev >= maxWaitTime) {
            clearInterval(interval);
            // Check if any orders still pending
            if (pendingOrders.size > 0) {
              setStep('escalating');
            } else {
              setStep('completed');
            }
            return prev;
          }

          // Simulate random carrier acceptances
          if (Math.random() > 0.7 && pendingOrders.size > 0) {
            const pendingArray = Array.from(pendingOrders);
            const randomOrder = pendingArray[Math.floor(Math.random() * pendingArray.length)];
            setValidatedOrders(prev => new Set([...prev, randomOrder]));
            setPendingOrders(prev => {
              const newSet = new Set(prev);
              newSet.delete(randomOrder);
              return newSet;
            });
          }

          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, pendingOrders]);

  const handleSendToCarriers = async () => {
    // Send orders to selected carriers
    for (const orderId of Object.keys(selectedCarriers)) {
      const carrierId = selectedCarriers[orderId];
      if (carrierId) {
        try {
          await onValidate(orderId, carrierId);
        } catch (err) {
          console.error('Error sending to carrier:', err);
        }
      }
    }
    setStep('waiting');
  };

  const handleEscalate = () => {
    const unvalidatedOrderIds = Array.from(pendingOrders);
    onEscalateToAffretIA(unvalidatedOrderIds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        maxWidth: '800px',
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '700' }}>
                Planification Automatique
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                {orders.length} commande{orders.length > 1 ? 's' : ''} à planifier
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
          {/* Step: Analyzing */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
                Analyse des commandes en cours...
              </h3>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Recherche des transporteurs disponibles...
              </div>
            </div>
          )}

          {/* Step: Matching */}
          {step === 'matching' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#f59e0b',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700' }}>
                Matching transporteurs...
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Calcul des meilleurs transporteurs selon vos critères
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step: Waiting for validation */}
          {step === 'waiting' && (
            <div>
              {/* Timer */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>
                  Attente validation transporteurs
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#d97706' }}>
                  {formatTime(maxWaitTime - waitingTime)}
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#fde68a',
                  borderRadius: '2px',
                  marginTop: '12px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(waitingTime / maxWaitTime) * 100}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>

              {/* Orders status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map(order => {
                  const isValidated = validatedOrders.has(order.id);
                  const isPending = pendingOrders.has(order.id);
                  const orderMatches = matches[order.id] || [];
                  const selectedCarrier = orderMatches.find(m => m.carrierId === selectedCarriers[order.id]);

                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isValidated ? '2px solid #22c55e' : '1px solid #e5e7eb',
                        backgroundColor: isValidated ? '#f0fdf4' : 'white',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#111827' }}>{order.reference}</div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {order.pickupAddress?.city} → {order.deliveryAddress?.city}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {selectedCarrier && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                {selectedCarrier.carrierName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {selectedCarrier.price.toFixed(0)}€ • {selectedCarrier.eta}
                              </div>
                            </div>
                          )}
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: isValidated ? '#22c55e' : '#fef3c7',
                            color: isValidated ? 'white' : '#92400e',
                          }}>
                            {isValidated ? '✓ Validé' : '⏳ En attente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>{validatedOrders.size}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Validées</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{pendingOrders.size}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>En attente</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{orders.length}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
                </div>
              </div>

              {/* Escalate button */}
              {pendingOrders.size > 0 && (
                <button
                  onClick={handleEscalate}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  🚀 Basculer vers Affret.IA ({pendingOrders.size} commande{pendingOrders.size > 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}

          {/* Step: Escalating */}
          {step === 'escalating' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
                Escalade vers Affret.IA
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                {pendingOrders.size} commande{pendingOrders.size > 1 ? 's' : ''} non validée{pendingOrders.size > 1 ? 's' : ''} - Publication sur la bourse de fret
              </div>
              <button
                onClick={handleEscalate}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Ouvrir Affret.IA
              </button>
            </div>
          )}

          {/* Step: Completed */}
          {step === 'completed' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>
                Planification terminée !
              </h3>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                Toutes les commandes ont été attribuées à des transporteurs
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default AutoPlanningModal;

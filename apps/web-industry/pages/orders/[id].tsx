/**
 * Page de détail d'une commande - Portail Industry
 * Affiche les informations complètes et la timeline d'événements
 * Permet la clôture des commandes livrées
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../../lib/auth';
import { OrdersService } from '@rt/utils';
import { ordersApi } from '../../lib/api';
import type { Order, OrderEvent, OrderStatus } from '@rt/contracts';

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Brouillon', color: '#9ca3af', icon: '📝' },
  created: { label: 'Créée', color: '#3b82f6', icon: '✅' },
  sent_to_carrier: { label: 'Envoyée', color: '#8b5cf6', icon: '📨' },
  carrier_accepted: { label: 'Acceptée', color: '#10b981', icon: '👍' },
  carrier_refused: { label: 'Refusée', color: '#ef4444', icon: '👎' },
  in_transit: { label: 'En transit', color: '#f59e0b', icon: '🚛' },
  arrived_pickup: { label: 'Arrivé collecte', color: '#14b8a6', icon: '📍' },
  loaded: { label: 'Chargé', color: '#06b6d4', icon: '📦' },
  arrived_delivery: { label: 'Arrivé livraison', color: '#0ea5e9', icon: '🎯' },
  delivered: { label: 'Livrée', color: '#22c55e', icon: '✨' },
  closed: { label: 'Clôturée', color: '#64748b', icon: '🔒' },
  cancelled: { label: 'Annulée', color: '#dc2626', icon: '❌' },
  escalated: { label: 'Escaladée', color: '#f97316', icon: '⚠️' },
};

export default function OrderDetailPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closureEligibility, setClosureEligibility] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closureMessage, setClosureMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger la commande et ses événements
  const loadOrder = async () => {
    if (!id || typeof id !== 'string') return;

    setIsLoading(true);
    setError(null);

    try {
      const [orderData, eventsData] = await Promise.all([
        OrdersService.getOrderById(id),
        OrdersService.getOrderEvents(id),
      ]);

      setOrder(orderData);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
      console.error('Error loading order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verifier l'eligibilite a la cloture
  const checkClosureEligibility = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const result = await ordersApi.checkClosureEligibility(id);
      setClosureEligibility(result);
    } catch (err) {
      console.error('Error checking closure eligibility:', err);
    }
  };

  // Cloturer la commande
  const handleCloseOrder = async () => {
    if (!id || typeof id !== 'string') return;

    setIsClosing(true);
    setClosureMessage(null);

    try {
      const result = await ordersApi.closeOrder(id);
      if (result.success) {
        setClosureMessage({ type: 'success', text: 'Commande cloturee avec succes' });
        loadOrder(); // Recharger pour mettre a jour le statut
      } else {
        setClosureMessage({ type: 'error', text: result.error || 'Erreur lors de la cloture' });
      }
    } catch (err: any) {
      setClosureMessage({ type: 'error', text: err.message || 'Erreur lors de la cloture' });
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadOrder();
  }, [id]);

  // Charger l'eligibilite quand la commande est livree
  useEffect(() => {
    if (order?.status === 'delivered') {
      checkClosureEligibility();
    }
  }, [order?.status]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number, currency: string = 'EUR') => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
  };

  const cardStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#111827',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Commande introuvable'}</div>
        <button
          onClick={() => router.push('/orders')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status];

  return (
    <>
      <Head>
        <title>Commande {order.reference} - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 40px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button
                onClick={() => router.push('/orders')}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                ← Retour
              </button>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
                  Commande {order.reference}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{statusInfo.icon}</span>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: `${statusInfo.color}15`,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {formatPrice(order.estimatedPrice || order.finalPrice, order.currency)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Créée le {formatDate(order.createdAt)}
                </div>
              </div>

              {/* Bouton Documents */}
              <button
                onClick={() => router.push(`/orders/${order.id}/documents`)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                📁 Documents
              </button>

              {/* Bouton Tracking */}
              {['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'].includes(order.status) && (
                <button
                  onClick={() => router.push(`/orders/${order.id}/tracking`)}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                  🗺️ Voir le tracking
                </button>
              )}

              {/* Bouton Cloturer - visible si delivered */}
              {order.status === 'delivered' && (
                <button
                  onClick={handleCloseOrder}
                  disabled={isClosing || (closureEligibility && !closureEligibility.eligible)}
                  style={{
                    padding: '12px 20px',
                    background: closureEligibility?.eligible ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: closureEligibility?.eligible ? 'pointer' : 'not-allowed',
                    boxShadow: closureEligibility?.eligible ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    opacity: isClosing ? 0.7 : 1,
                  }}>
                  {isClosing ? 'Cloture en cours...' : 'Cloturer la commande'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Colonne principale */}
            <div>
              {/* Itinéraire */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>🗺️ Itinéraire</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ ...labelStyle, color: '#15803d', marginBottom: '8px' }}>📍 Point de collecte</div>
                      <div style={{ ...valueStyle, marginBottom: '4px', fontWeight: '700' }}>{order.pickupAddress.city}</div>
                      <div style={{ ...valueStyle, fontSize: '13px', color: '#6b7280' }}>
                        {order.pickupAddress.street}<br />
                        {order.pickupAddress.postalCode} {order.pickupAddress.city}
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bbf7d0' }}>
                        <div style={{ ...labelStyle, color: '#15803d' }}>Contact</div>
                        <div style={{ ...valueStyle, fontSize: '13px' }}>{order.pickupAddress.contactName}</div>
                        {order.pickupAddress.contactPhone && (
                          <div style={{ ...valueStyle, fontSize: '13px', color: '#6b7280' }}>{order.pickupAddress.contactPhone}</div>
                        )}
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bbf7d0' }}>
                        <div style={{ ...labelStyle, color: '#15803d' }}>Date prévue</div>
                        <div style={{ ...valueStyle, fontSize: '13px' }}>{formatDate(order.dates.pickupDate)}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ ...labelStyle, color: '#1e40af', marginBottom: '8px' }}>🎯 Point de livraison</div>
                      <div style={{ ...valueStyle, marginBottom: '4px', fontWeight: '700' }}>{order.deliveryAddress.city}</div>
                      <div style={{ ...valueStyle, fontSize: '13px', color: '#6b7280' }}>
                        {order.deliveryAddress.street}<br />
                        {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bfdbfe' }}>
                        <div style={{ ...labelStyle, color: '#1e40af' }}>Contact</div>
                        <div style={{ ...valueStyle, fontSize: '13px' }}>{order.deliveryAddress.contactName}</div>
                        {order.deliveryAddress.contactPhone && (
                          <div style={{ ...valueStyle, fontSize: '13px', color: '#6b7280' }}>{order.deliveryAddress.contactPhone}</div>
                        )}
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bfdbfe' }}>
                        <div style={{ ...labelStyle, color: '#1e40af' }}>Date prévue</div>
                        <div style={{ ...valueStyle, fontSize: '13px' }}>{formatDate(order.dates.deliveryDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marchandise */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>📦 Marchandise</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={labelStyle}>Poids</div>
                    <div style={{ ...valueStyle, fontWeight: '700', fontSize: '16px' }}>{order.goods.weight} kg</div>
                  </div>
                  {order.goods.volume && (
                    <div>
                      <div style={labelStyle}>Volume</div>
                      <div style={{ ...valueStyle, fontWeight: '700', fontSize: '16px' }}>{order.goods.volume} m³</div>
                    </div>
                  )}
                  <div>
                    <div style={labelStyle}>Quantité</div>
                    <div style={{ ...valueStyle, fontWeight: '700', fontSize: '16px' }}>{order.goods.quantity}</div>
                  </div>
                  {order.goods.palettes && (
                    <div>
                      <div style={labelStyle}>Palettes</div>
                      <div style={{ ...valueStyle, fontWeight: '700', fontSize: '16px' }}>{order.goods.palettes}</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={labelStyle}>Description</div>
                  <div style={valueStyle}>{order.goods.description}</div>
                </div>
              </div>

              {/* Contraintes */}
              {order.constraints.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>⚙️ Contraintes de transport</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {order.constraints.map((constraint, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                        }}
                      >
                        {constraint.type}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Cloture - visible si delivered */}
              {order.status === 'delivered' && (
                <div style={{
                  ...cardStyle,
                  border: closureEligibility?.eligible ? '2px solid #10b981' : '2px solid #f59e0b',
                  background: closureEligibility?.eligible ? '#f0fdf4' : '#fffbeb',
                }}>
                  <h2 style={{ ...sectionTitleStyle, color: closureEligibility?.eligible ? '#059669' : '#92400e' }}>
                    {closureEligibility?.eligible ? 'Prete pour cloture' : 'Cloture en attente'}
                  </h2>

                  {closureMessage && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      backgroundColor: closureMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                      color: closureMessage.type === 'success' ? '#065f46' : '#991b1b',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                      {closureMessage.text}
                    </div>
                  )}

                  {closureEligibility ? (
                    <>
                      {closureEligibility.eligible ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '32px' }}>✅</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                              Tous les criteres sont remplis
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              Vous pouvez cloturer cette commande
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '12px' }}>
                            Criteres manquants :
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {closureEligibility.blockers?.map((blocker: string, idx: number) => (
                              <li key={idx} style={{ fontSize: '13px', color: '#78350f', marginBottom: '4px' }}>
                                {blocker}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Verification de l'eligibilite...
                    </div>
                  )}
                </div>
              )}

              {/* Commande cloturee */}
              {order.status === 'closed' && (
                <div style={{
                  ...cardStyle,
                  border: '2px solid #64748b',
                  background: '#f8fafc',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🔒</span>
                    <div>
                      <h2 style={{ ...sectionTitleStyle, marginBottom: '4px', color: '#475569' }}>
                        Commande cloturee
                      </h2>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Cette commande est finalisee et archivee
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne secondaire - Timeline */}
            <div>
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>📋 Timeline des événements</h2>
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    Aucun événement pour le moment
                  </div>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: '24px' }}>
                    {/* Ligne verticale */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '8px',
                        bottom: '8px',
                        width: '2px',
                        backgroundColor: '#e5e7eb',
                      }}
                    />

                    {events.map((event, index) => (
                      <div
                        key={event.id}
                        style={{
                          position: 'relative',
                          paddingBottom: index < events.length - 1 ? '20px' : '0',
                        }}
                      >
                        {/* Dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-20px',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#667eea',
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px #e5e7eb',
                          }}
                        />

                        <div style={{ marginBottom: '4px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {event.description}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                            {formatDate(event.timestamp)}
                          </div>
                          {event.userName && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              Par {event.userName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {order.notes && (
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>📝 Notes</h2>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

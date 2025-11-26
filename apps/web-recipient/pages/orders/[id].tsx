/**
 * Page de détail d'une commande - Portail Recipient
 * Affiche les informations complètes et la timeline d'événements
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../../lib/auth';
import OrdersService from '@rt/utils/lib/services/orders-service';
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
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadOrder();
  }, [id, router]);

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
        <title>Commande {order.reference} - Recipient | SYMPHONI.A</title>
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

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {formatPrice(order.estimatedPrice || order.finalPrice, order.currency)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Créée le {formatDate(order.createdAt)}
              </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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

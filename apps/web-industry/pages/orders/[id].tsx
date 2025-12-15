/**
 * Page de détail d'une commande - Portail Industry
 * Design basé sur la référence SYMPHONI.A Transport
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../../lib/useSafeRouter';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { isAuthenticated } from '../../lib/auth';
import { OrdersService } from '@rt/utils';
import { ordersApi, API_CONFIG } from '../../lib/api';
import { AppointmentResponsePanel, AutoPlanningModal, TrackingFeed } from '@rt/ui-components';
import type { AppointmentRequest } from '@rt/ui-components';
import type { Order, OrderEvent, OrderStatus } from '@rt/contracts';
import { useToast } from '@rt/ui-components';

// Dynamic import for Leaflet map (client-side only)
const OrderMap = dynamic(() => import('../../components/OrderMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '250px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9ca3af' }}>Chargement de la carte...</div>
    </div>
  ),
});

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Brouillon', color: '#6b7280', bgColor: '#f3f4f6' },
  created: { label: 'Créé', color: '#3b82f6', bgColor: '#dbeafe' },
  sent_to_carrier: { label: 'Envoyé', color: '#8b5cf6', bgColor: '#ede9fe' },
  carrier_accepted: { label: 'Accepté', color: '#10b981', bgColor: '#d1fae5' },
  carrier_refused: { label: 'Refusé', color: '#ef4444', bgColor: '#fee2e2' },
  in_transit: { label: 'En transit', color: '#f59e0b', bgColor: '#fef3c7' },
  arrived_pickup: { label: 'Arrivé collecte', color: '#14b8a6', bgColor: '#ccfbf1' },
  loaded: { label: 'Chargé', color: '#06b6d4', bgColor: '#cffafe' },
  arrived_delivery: { label: 'Arrivé livraison', color: '#0ea5e9', bgColor: '#e0f2fe' },
  delivered: { label: 'Livré', color: '#22c55e', bgColor: '#dcfce7' },
  closed: { label: 'Clôturé', color: '#64748b', bgColor: '#f1f5f9' },
  cancelled: { label: 'Annulé', color: '#dc2626', bgColor: '#fee2e2' },
  escalated: { label: 'Escaladé', color: '#f97316', bgColor: '#ffedd5' },
};

const getStatusInfo = (status: string) => {
  return STATUS_LABELS[status] || { label: status || 'Inconnu', color: '#6b7280', bgColor: '#f3f4f6' };
};

export default function OrderDetailPage() {
  const router = useSafeRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'evenements' | 'documents' | 'charte' | 'rdv'>('evenements');
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [loadingRdv, setLoadingRdv] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const { toast } = useToast();

  // Extract order ID from URL path
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === 'orders') {
        const extractedId = pathParts[1];
        if (extractedId && extractedId !== 'detail') {
          setOrderId(extractedId);
        }
      }
    }
  }, []);

  const loadOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);

    try {
      const orderData = await OrdersService.getOrderById(orderId);
      setOrder(orderData);

      try {
        const eventsData = await OrdersService.getOrderEvents(orderId);
        setEvents(eventsData || []);
      } catch {
        setEvents([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les demandes de RDV pour cette commande
  const loadAppointmentRequests = async () => {
    if (!orderId) return;
    setLoadingRdv(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointmentRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error loading appointment requests:', err);
    } finally {
      setLoadingRdv(false);
    }
  };

  // Proposer un créneau
  const handleProposeSlot = async (requestId: string, slotData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments/${requestId}/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(slotData),
      });
      if (response.ok) {
        loadAppointmentRequests();
      }
    } catch (err) {
      console.error('Error proposing slot:', err);
    }
  };

  // Accepter une date préférée
  const handleAcceptPreferred = async (requestId: string, dateIndex: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ acceptedDateIndex: dateIndex }),
      });
      if (response.ok) {
        loadAppointmentRequests();
      }
    } catch (err) {
      console.error('Error accepting date:', err);
    }
  };

  // Rejeter une demande
  const handleReject = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        loadAppointmentRequests();
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  // Envoyer un message
  const handleSendMessage = async (requestId: string, message: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments/${requestId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: message }),
      });
      if (response.ok) {
        loadAppointmentRequests();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadOrder();
    loadAppointmentRequests();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number, currency: string = 'EUR') => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <div style={{ marginTop: '16px', color: '#6b7280' }}>Chargement...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Commande introuvable'}</div>
        <button
          onClick={() => router.push('/orders')}
          style={{ padding: '12px 24px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const orderAny = order as any;

  return (
    <>
      <Head>
        <title>Transport n°{order.reference} - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header principal */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            {/* Ligne supérieure: Navigation et titre */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => router.push('/orders')}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  ← Retour
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                      Transport n°{order.reference}
                    </h1>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: statusInfo.bgColor,
                      color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Bouton Planification Auto - visible si pas encore de transporteur assigné */}
                {!order.carrierId && ['created', 'draft'].includes(order.status) && (
                  <button
                    onClick={() => setShowPlanningModal(true)}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    🤖 Planification Auto
                  </button>
                )}
                {/* Bouton Modifier - visible si commande pas encore en transit */}
                {!['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery', 'delivered', 'closed', 'cancelled'].includes(order.status) && (
                  <button
                    onClick={() => router.push(`/orders/${order.id}/edit`)}
                    style={{ padding: '10px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                  >
                    ✏️ Modifier
                  </button>
                )}
                {['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'].includes(order.status) && (
                  <button
                    onClick={() => router.push(`/orders/${order.id}/tracking`)}
                    style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                  >
                    📍 Suivi GPS
                  </button>
                )}
                <button style={{ padding: '10px 16px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                  📄 Imprimer
                </button>
              </div>
            </div>

            {/* Infos donneur d'ordre et transporteur */}
            <div style={{ display: 'flex', gap: '32px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🏭</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Donneur d'ordre</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{orderAny.industrialName || orderAny.organizationName || orderAny.companyName || 'Non défini'}</div>
                </div>
              </div>
              {order.carrierId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🚛</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Transporteur</div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{orderAny.carrierName || orderAny.assignedCarrier?.carrierName || order.carrierId}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📅</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Créé le</div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{formatDateTime(order.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Échelle de statut - Progress Stepper */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {/* Ligne de progression */}
              <div style={{ position: 'absolute', top: '20px', left: '60px', right: '60px', height: '3px', backgroundColor: '#e5e7eb', zIndex: 0 }} />
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '60px',
                height: '3px',
                backgroundColor: '#667eea',
                zIndex: 1,
                width: (() => {
                  const steps = ['created', 'sent_to_carrier', 'carrier_accepted', 'in_transit', 'arrived_delivery', 'delivered', 'closed'];
                  const status = order.status as string;
                  const currentIndex = steps.findIndex(s => s === status ||
                    (status === 'draft' && s === 'created') ||
                    (status === 'pending' && s === 'created') ||
                    (status === 'arrived_pickup' && s === 'in_transit') ||
                    (status === 'loaded' && s === 'in_transit')
                  );
                  if (currentIndex <= 0) return '0%';
                  return `${(currentIndex / (steps.length - 1)) * 100}%`;
                })(),
                transition: 'width 0.5s ease',
              }} />

              {/* Étapes */}
              {[
                { key: 'created', label: 'Créée', icon: '✅' },
                { key: 'sent_to_carrier', label: 'Envoyée', icon: '📨' },
                { key: 'carrier_accepted', label: 'Acceptée', icon: '👍' },
                { key: 'in_transit', label: 'Transit', icon: '🚛' },
                { key: 'arrived_delivery', label: 'Arrivé', icon: '🎯' },
                { key: 'delivered', label: 'Livrée', icon: '✨' },
                { key: 'closed', label: 'Clôturée', icon: '🔒' },
              ].map((step, index) => {
                const steps = ['created', 'sent_to_carrier', 'carrier_accepted', 'in_transit', 'arrived_delivery', 'delivered', 'closed'];
                const status = order.status as string;
                const currentIndex = steps.findIndex(s => s === status ||
                  (status === 'draft' && s === 'created') ||
                  (status === 'pending' && s === 'created') ||
                  (status === 'arrived_pickup' && s === 'in_transit') ||
                  (status === 'loaded' && s === 'in_transit')
                );
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isUpcoming = index > currentIndex;

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#667eea' : '#e5e7eb',
                      color: isCompleted || isCurrent ? 'white' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      border: isCurrent ? '3px solid #c7d2fe' : 'none',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(102, 126, 234, 0.2)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      fontWeight: isCurrent ? '700' : '500',
                      color: isCompleted ? '#22c55e' : isCurrent ? '#667eea' : '#9ca3af',
                      textAlign: 'center',
                    }}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
            {/* Colonne gauche */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Transporteur assigné */}
              {order.carrierId && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  <div style={{ padding: '16px 20px', backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚛</div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>Transporteur assigné</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>Commande acceptée</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>{formatPrice(order.finalPrice || order.estimatedPrice, order.currency)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Prix accepté</div>
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Entreprise</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{orderAny.carrierName || orderAny.assignedCarrier?.carrierName || order.carrierId}</div>
                    </div>
                    {orderAny.assignedCarrier?.driverName && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Chauffeur</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{orderAny.assignedCarrier.driverName}</div>
                        {orderAny.assignedCarrier.driverPhone && (
                          <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>📞 {orderAny.assignedCarrier.driverPhone}</div>
                        )}
                      </div>
                    )}
                    {orderAny.assignedCarrier?.vehiclePlate && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Véhicule</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: 'monospace', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{orderAny.assignedCarrier.vehiclePlate}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carte et infos distance */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {/* Carte Leaflet avec 2 marqueurs */}
                <div style={{ height: '250px', position: 'relative' }}>
                  <OrderMap
                    pickupLat={orderAny.pickupAddress?.latitude || orderAny.pickup?.coordinates?.latitude}
                    pickupLon={orderAny.pickupAddress?.longitude || orderAny.pickup?.coordinates?.longitude}
                    pickupCity={order.pickupAddress?.city}
                    deliveryLat={orderAny.deliveryAddress?.latitude || orderAny.delivery?.coordinates?.latitude}
                    deliveryLon={orderAny.deliveryAddress?.longitude || orderAny.delivery?.coordinates?.longitude}
                    deliveryCity={order.deliveryAddress?.city}
                  />
                  {/* Légende des marqueurs */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
                      <span>Enlèvement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>
                      <span>Livraison</span>
                    </div>
                  </div>
                  {/* Bouton tracking sur la carte */}
                  {['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery'].includes(order.status) && (
                    <button
                      onClick={() => router.push(`/orders/${order.id}/tracking`)}
                      style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', zIndex: 1000 }}
                    >
                      Voir le tracking en direct
                    </button>
                  )}
                </div>

                {/* Infos distance */}
                <div style={{ padding: '16px', display: 'flex', gap: '24px', borderTop: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Distance</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      {orderAny.distanceKm ? `${orderAny.distanceKm} km` : '- km'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Durée estimée</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      {orderAny.durationMinutes ? `${Math.floor(orderAny.durationMinutes / 60)}h${orderAny.durationMinutes % 60}` : '- h'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Prix</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>
                      {formatPrice(order.finalPrice || order.estimatedPrice, order.currency)}
                    </div>
                  </div>
                  {order.trackingLevel && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tracking</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: order.trackingLevel === 'premium' ? '#7c3aed' : order.trackingLevel === 'gps' ? '#0ea5e9' : '#6b7280' }}>
                        {order.trackingLevel === 'premium' ? '⭐ Premium' : order.trackingLevel === 'gps' ? '📍 GPS' : '📋 Basic'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Enlèvement */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', borderBottom: '2px solid #22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>1</div>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#15803d' }}>Enlèvement</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatDate(order.dates.pickupDate)}
                    {order.dates.pickupTimeSlotStart && ` • ${order.dates.pickupTimeSlotStart}`}
                    {order.dates.pickupTimeSlotEnd && ` - ${order.dates.pickupTimeSlotEnd}`}
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Adresse */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Adresse</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{order.pickupAddress.street}</div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{order.pickupAddress.postalCode} {order.pickupAddress.city}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{order.pickupAddress.country}</div>
                      {order.pickupAddress.instructions && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                          💡 {order.pickupAddress.instructions}
                        </div>
                      )}
                    </div>
                    {/* Contact */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Contact expéditeur</div>
                      {order.pickupAddress.contactName && (
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{order.pickupAddress.contactName}</div>
                      )}
                      {order.pickupAddress.contactPhone && (
                        <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📞 {order.pickupAddress.contactPhone}
                        </div>
                      )}
                      {order.pickupAddress.contactEmail && (
                        <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          ✉️ {order.pickupAddress.contactEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marchandise */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>Marchandise</div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <div style={{ padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{order.goods.weight}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>kg</div>
                      </div>
                      {order.goods.volume && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{order.goods.volume}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>m³</div>
                        </div>
                      )}
                      <div style={{ padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{order.goods.quantity}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>colis</div>
                      </div>
                      {order.goods.palettes && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{order.goods.palettes}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>palettes</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#374151' }}>
                      <span style={{ fontWeight: '600' }}>Description:</span> {order.goods.description}
                    </div>
                    {order.goods.packaging && (
                      <div style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
                        <span style={{ fontWeight: '600' }}>Emballage:</span> {order.goods.packaging}
                      </div>
                    )}
                    {order.goods.value && (
                      <div style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
                        <span style={{ fontWeight: '600' }}>Valeur:</span> {formatPrice(order.goods.value, order.currency)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Livraison */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', backgroundColor: '#eff6ff', borderBottom: '2px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>2</div>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>Livraison</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatDate(order.dates.deliveryDate)}
                    {order.dates.deliveryTimeSlotStart && ` • ${order.dates.deliveryTimeSlotStart}`}
                    {order.dates.deliveryTimeSlotEnd && ` - ${order.dates.deliveryTimeSlotEnd}`}
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Adresse */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Adresse</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{order.deliveryAddress.street}</div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{order.deliveryAddress.postalCode} {order.deliveryAddress.city}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{order.deliveryAddress.country}</div>
                      {order.deliveryAddress.instructions && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                          💡 {order.deliveryAddress.instructions}
                        </div>
                      )}
                    </div>
                    {/* Contact */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Contact destinataire</div>
                      {order.deliveryAddress.contactName && (
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{order.deliveryAddress.contactName}</div>
                      )}
                      {order.deliveryAddress.contactPhone && (
                        <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📞 {order.deliveryAddress.contactPhone}
                        </div>
                      )}
                      {order.deliveryAddress.contactEmail && (
                        <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          ✉️ {order.deliveryAddress.contactEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contraintes */}
              {order.constraints && order.constraints.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>Contraintes de transport</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {order.constraints.map((constraint, idx) => (
                      <div key={idx} style={{ padding: '6px 12px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
                        {constraint.type}
                        {constraint.value && `: ${constraint.value}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Palettes Europe */}
              {orderAny.palletTracking?.enabled && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>🔄 Gestion Palettes Europe (EPAL)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Attendues</div>
                      <div style={{ fontSize: '20px', fontWeight: '700' }}>{orderAny.palletTracking.expectedQuantity}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#d1fae5', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Données</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>{orderAny.palletTracking.pickup?.givenBySender || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Reçues</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{orderAny.palletTracking.delivery?.receivedByRecipient || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: orderAny.palletTracking.balance === 0 ? '#d1fae5' : '#fef3c7', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Solde</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: orderAny.palletTracking.balance === 0 ? '#059669' : '#d97706' }}>
                        {orderAny.palletTracking.balance >= 0 ? '+' : ''}{orderAny.palletTracking.balance}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite - Onglets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '8px 8px 0 0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {[
                  { key: 'evenements', label: 'Événements' },
                  { key: 'rdv', label: `RDV${appointmentRequests.filter(r => r.status === 'pending').length > 0 ? ` (${appointmentRequests.filter(r => r.status === 'pending').length})` : ''}` },
                  { key: 'documents', label: 'Documents' },
                  { key: 'charte', label: 'Charte' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: 'none',
                      backgroundColor: activeTab === tab.key ? '#667eea' : 'white',
                      color: activeTab === tab.key ? 'white' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenu des tabs */}
              <div style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, minHeight: '500px' }}>

                {/* Tab Événements - avec TrackingFeed temps réel */}
                {activeTab === 'evenements' && (
                  <div style={{ padding: '20px' }}>
                    {/* Zone commentaire */}
                    <div style={{ marginBottom: '20px' }}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          resize: 'vertical',
                          minHeight: '80px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>

                    {/* TrackingFeed temps réel - visible dès qu'un transporteur est assigné */}
                    {order.carrierId ? (
                      <TrackingFeed
                        orderId={order.id}
                        compact={true}
                        autoRefresh={true}
                        refreshInterval={30000}
                        apiUrl={API_CONFIG.ORDERS_API}
                        onRefresh={() => console.log('Refreshing tracking data...')}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                        <div>Aucun événement pour le moment</div>
                        <div style={{ fontSize: '13px', marginTop: '8px', color: '#6b7280' }}>
                          Le suivi temps réel sera disponible une fois un transporteur assigné
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab RDV */}
                {activeTab === 'rdv' && (
                  <div style={{ padding: '20px' }}>
                    {loadingRdv ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        Chargement des demandes de RDV...
                      </div>
                    ) : appointmentRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                        <div>Aucune demande de RDV pour cette commande</div>
                        <div style={{ fontSize: '13px', marginTop: '8px', color: '#6b7280' }}>
                          Les transporteurs peuvent demander des créneaux de chargement/livraison
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {appointmentRequests.map((request) => (
                          <AppointmentResponsePanel
                            key={request.requestId}
                            request={request}
                            responderId="industry-user"
                            responderName="Industriel"
                            onAccept={(requestId, slotId) => handleAcceptPreferred(requestId, slotId ? parseInt(slotId) : 0)}
                            onPropose={(requestId, slotData, message) => handleProposeSlot(requestId, slotData)}
                            onReject={(requestId, reason) => handleReject(requestId, reason)}
                            onMessage={(requestId, content) => handleSendMessage(requestId, content)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Documents */}
                {activeTab === 'documents' && (
                  <div style={{ padding: '20px' }}>
                    {/* Upload zone */}
                    <div style={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      marginBottom: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Glissez vos fichiers ici ou cliquez pour sélectionner</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>PDF, JPG, PNG (max 10MB)</div>
                    </div>

                    {/* Liste documents */}
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>
                      Documents ({order.documentIds?.length || 0})
                    </div>
                    {order.documentIds && order.documentIds.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.documentIds.map((docId, idx) => (
                          <div key={docId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '6px',
                          }}>
                            <div style={{ fontSize: '24px' }}>📄</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Document {idx + 1}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {docId.slice(0, 8)}...</div>
                            </div>
                            <button style={{
                              padding: '6px 12px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}>
                              Télécharger
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                        Aucun document attaché
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Charte */}
                {activeTab === 'charte' && (
                  <div style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📜</div>
                      <div style={{ fontSize: '14px', marginBottom: '16px' }}>Charte de transport</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', textAlign: 'left', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <p><strong>Conditions générales de transport</strong></p>
                        <p>• Respect des délais convenus</p>
                        <p>• Marchandise en bon état</p>
                        <p>• Documents de transport complets</p>
                        <p>• Assurance responsabilité civile</p>
                        {order.trackingLevel === 'premium' && (
                          <p>• Suivi GPS temps réel inclus</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {order.notes && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginTop: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>📝 Notes</div>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{order.notes}</div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal de planification automatique */}
      {showPlanningModal && order && (
        <AutoPlanningModal
          orders={[order]}
          onClose={() => {
            setShowPlanningModal(false);
            loadOrder();
          }}
          onValidate={async (orderId, carrierId) => {
            try {
              await OrdersService.updateOrder(orderId, { carrierId, status: 'sent_to_carrier' as any });
              toast.success('Transporteur assigné avec succès');
            } catch (err: any) {
              toast.error(`Erreur: ${err.message}`);
            }
          }}
          onEscalateToAffretIA={(orderIds) => {
            sessionStorage.setItem('affretia_orders', JSON.stringify([order]));
            router.push('/affret-ia?mode=escalated');
          }}
        />
      )}
    </>
  );
}

// Required for static export with dynamic routes
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: 'detail' } }],
    fallback: false,
  };
}

export async function getStaticProps() {
  return {
    props: {},
  };
}

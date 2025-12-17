/**
 * Page de détail d'une commande - Portail Transporter
 * Affiche les informations complètes et la timeline d'événements
 * Permet la confirmation de livraison et l'upload de documents
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../../lib/auth';
import { OrdersService } from '@rt/utils';
import { ordersApi, API_CONFIG } from '../../lib/api';
import { DeliveryConfirmation, DocumentUpload } from '../../components';
import PaletteExchange from '../../components/PaletteExchange';
import { palettesOrderApi, PalletTracking } from '../../lib/palettes-api';
import { OrderProgressStepper, CarrierInfoCard, AppointmentRequestForm, TrackingFeed } from '@rt/ui-components';
import type { AppointmentRequestData } from '@rt/ui-components';
import type { Order, OrderEvent, OrderStatus } from '@rt/contracts';

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Brouillon', color: '#9ca3af', icon: '📝' },
  created: { label: 'Créée', color: '#3b82f6', icon: '✅' },
  pending: { label: 'En attente', color: '#6b7280', icon: '⏳' },
  // Auto-dispatch statuts
  planification_auto: { label: 'Planification auto', color: '#8b5cf6', icon: '🤖' },
  affret_ia: { label: 'Affret IA', color: '#ec4899', icon: '🧠' },
  echec_planification: { label: 'Echec planification', color: '#dc2626', icon: '❌' },
  accepted: { label: 'Acceptée', color: '#10b981', icon: '👍' },
  // Carrier statuts
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
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [palletTracking, setPalletTracking] = useState<PalletTracking | null>(null);
  const [showLoadingRdv, setShowLoadingRdv] = useState(false);
  const [showDeliveryRdv, setShowDeliveryRdv] = useState(false);
  const [rdvSuccess, setRdvSuccess] = useState<string | null>(null);

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

  // Charger les documents de la commande
  const loadDocuments = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const result = await ordersApi.getOrderDocuments(id);
      if (result.success) {
        setDocuments(result.documents || []);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  // Charger le suivi des palettes
  const loadPalletTracking = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const result = await palettesOrderApi.getStatus(id);
      if (result.palletTracking) {
        setPalletTracking(result.palletTracking);
      }
    } catch (err) {
      console.error('Error loading pallet tracking:', err);
    }
  };

  // Confirmation de livraison reussie
  const handleDeliverySuccess = () => {
    setShowDeliveryConfirmation(false);
    loadOrder();
    loadDocuments();
  };

  // Document uploade avec succes
  const handleDocumentUploadSuccess = (documentId: string) => {
    console.log('Document uploaded:', documentId);
    loadDocuments();
  };

  // Soumettre demande de RDV
  const handleAppointmentRequest = async (data: AppointmentRequestData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3002'}/api/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la demande');
      }

      setShowLoadingRdv(false);
      setShowDeliveryRdv(false);
      setRdvSuccess(data.type === 'loading' ? 'Demande de RDV chargement envoyée !' : 'Demande de RDV livraison envoyée !');
      setTimeout(() => setRdvSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi de la demande');
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadOrder();
    loadDocuments();
    loadPalletTracking();
  }, [id]);

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
        <title>Commande {order.reference} - Transporter | SYMPHONI.A</title>
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

              {/* Bouton Confirmer Livraison - visible si arrived_delivery ou in_transit */}
              {['arrived_delivery', 'in_transit', 'loaded'].includes(order.status) && (
                <button
                  onClick={() => setShowDeliveryConfirmation(true)}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Confirmer livraison
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Echelle de statut */}
        <OrderProgressStepper status={order.status} />

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Colonne principale */}
            <div>
              {/* Transporteur assigne */}
              <CarrierInfoCard
                carrierName={(order as any).carrierName || (order as any).assignedCarrier?.carrierName}
                driverName={(order as any).driverName}
                vehiclePlate={(order as any).vehiclePlate}
                driverPhone={(order as any).driverPhone}
              />

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
                      {['carrier_accepted', 'sent_to_carrier'].includes(order.status) && (
                        <button
                          onClick={() => setShowLoadingRdv(true)}
                          style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          📅 Demander RDV chargement
                        </button>
                      )}
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
                      {['carrier_accepted', 'sent_to_carrier', 'in_transit', 'loaded'].includes(order.status) && (
                        <button
                          onClick={() => setShowDeliveryRdv(true)}
                          style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          📅 Demander RDV livraison
                        </button>
                      )}
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

              {/* Section Documents */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>📎 Documents ({documents.length})</h2>
                  <button
                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: showDocumentUpload ? '#ef4444' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {showDocumentUpload ? 'Fermer' : '+ Ajouter'}
                  </button>
                </div>

                {/* Zone d'upload */}
                {showDocumentUpload && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <DocumentUpload
                        orderId={order.id}
                        documentType="cmr"
                        onSuccess={handleDocumentUploadSuccess}
                        onError={(err) => console.error(err)}
                      />
                      <DocumentUpload
                        orderId={order.id}
                        documentType="pod"
                        onSuccess={handleDocumentUploadSuccess}
                        onError={(err) => console.error(err)}
                      />
                      <DocumentUpload
                        orderId={order.id}
                        documentType="photo"
                        onSuccess={handleDocumentUploadSuccess}
                        onError={(err) => console.error(err)}
                        label="Photo de livraison"
                      />
                      <DocumentUpload
                        orderId={order.id}
                        documentType="damage_report"
                        onSuccess={handleDocumentUploadSuccess}
                        onError={(err) => console.error(err)}
                      />
                    </div>
                  </div>
                )}

                {/* Liste des documents */}
                {documents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    Aucun document pour le moment
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documents.map((doc: any) => (
                      <div
                        key={doc.documentId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>
                            {doc.type === 'cmr' ? '📄' : doc.type === 'pod' ? '✅' : doc.type === 'photo' ? '📷' : '📎'}
                          </span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                              {doc.originalName || doc.type.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {doc.type.toUpperCase()} - {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {doc.status === 'validated' && (
                            <span style={{ padding: '4px 8px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                              Valide
                            </span>
                          )}
                          <button
                            onClick={async () => {
                              const result = await ordersApi.getDocumentDownloadUrl(doc.documentId);
                              if (result.success) window.open(result.downloadUrl, '_blank');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Telecharger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne secondaire - Timeline avec TrackingFeed temps réel */}
            <div>
              <div style={cardStyle}>
                <TrackingFeed
                  orderId={order.id}
                  compact={true}
                  autoRefresh={true}
                  refreshInterval={30000}
                  apiUrl={API_CONFIG.ORDERS_API}
                  onRefresh={() => console.log('Refreshing tracking data...')}
                />
              </div>

              {/* Suivi des palettes Europe */}
              {order.goods.palettes && order.goods.palettes > 0 && (
                <div style={cardStyle}>
                  <PaletteExchange
                    orderId={order.id}
                    orderReference={order.reference}
                    orderStatus={order.status}
                    palletTracking={palletTracking || undefined}
                    senderInfo={{
                      id: order.pickupAddress.contactName || 'sender',
                      name: order.pickupAddress.contactName || 'Expéditeur',
                      type: 'expediteur'
                    }}
                    recipientInfo={{
                      id: order.deliveryAddress.contactName || 'recipient',
                      name: order.deliveryAddress.contactName || 'Destinataire',
                      type: 'destinataire'
                    }}
                    expectedPallets={order.goods.palettes}
                    onUpdate={() => {
                      loadOrder();
                      loadPalletTracking();
                    }}
                  />
                </div>
              )}

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

      {/* Modal de confirmation de livraison */}
      {showDeliveryConfirmation && (
        <DeliveryConfirmation
          orderId={order.id}
          orderReference={order.reference}
          onSuccess={handleDeliverySuccess}
          onCancel={() => setShowDeliveryConfirmation(false)}
        />
      )}

      {/* Modal de demande de RDV chargement */}
      {showLoadingRdv && (
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
          zIndex: 100,
        }}>
          <div style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <AppointmentRequestForm
              orderId={order.id}
              orderReference={order.reference}
              type="loading"
              targetOrganizationId={(order as any).shipperId || 'unknown'}
              targetOrganizationName={order.pickupAddress.contactName}
              requesterId={(order as any).carrierId || 'carrier'}
              requesterName={(order as any).carrierName || 'Transporteur'}
              carrierName={(order as any).carrierName}
              driverName={(order as any).driverName}
              driverPhone={(order as any).driverPhone}
              vehiclePlate={(order as any).vehiclePlate}
              suggestedDate={order.dates.pickupDate?.split('T')[0]}
              onSubmit={handleAppointmentRequest}
              onCancel={() => setShowLoadingRdv(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de demande de RDV livraison */}
      {showDeliveryRdv && (
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
          zIndex: 100,
        }}>
          <div style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <AppointmentRequestForm
              orderId={order.id}
              orderReference={order.reference}
              type="unloading"
              targetOrganizationId={(order as any).recipientId || 'unknown'}
              targetOrganizationName={order.deliveryAddress.contactName}
              requesterId={(order as any).carrierId || 'carrier'}
              requesterName={(order as any).carrierName || 'Transporteur'}
              carrierName={(order as any).carrierName}
              driverName={(order as any).driverName}
              driverPhone={(order as any).driverPhone}
              vehiclePlate={(order as any).vehiclePlate}
              suggestedDate={order.dates.deliveryDate?.split('T')[0]}
              onSubmit={handleAppointmentRequest}
              onCancel={() => setShowDeliveryRdv(false)}
            />
          </div>
        </div>
      )}

      {/* Notification de succès RDV */}
      {rdvSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '16px 24px',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '600',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ✅ {rdvSuccess}
        </div>
      )}
    </>
  );
}

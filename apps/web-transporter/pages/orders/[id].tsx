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
  const [showDriverInfoForm, setShowDriverInfoForm] = useState(false);
  const [driverInfo, setDriverInfo] = useState({
    driverFirstName: '',
    driverLastName: '',
    driverPhone: '',
    tractorPlate: '',
    trailerPlate: '',
    vehicleType: 'semi' as 'semi' | 'porteur' | 'fourgon' | 'VUL' | 'autre'
  });
  const [savingDriverInfo, setSavingDriverInfo] = useState(false);

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

  // Sauvegarder les informations chauffeur
  const handleSaveDriverInfo = async () => {
    if (!id || typeof id !== 'string') return;
    if (!driverInfo.driverFirstName || !driverInfo.driverLastName || !driverInfo.tractorPlate) {
      alert('Veuillez remplir le nom, prénom et la plaque tracteur');
      return;
    }

    setSavingDriverInfo(true);
    try {
      const response = await ordersApi.updateDriverInfo(id, driverInfo);
      if (response.success) {
        setShowDriverInfoForm(false);
        loadOrder();
        alert('Informations chauffeur enregistrées !');
      } else {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde des informations');
    } finally {
      setSavingDriverInfo(false);
    }
  };

  // Initialiser le formulaire avec les données existantes
  const openDriverInfoForm = () => {
    const carrier = (order as any)?.assignedCarrier;
    if (carrier) {
      setDriverInfo({
        driverFirstName: carrier.driverFirstName || '',
        driverLastName: carrier.driverLastName || '',
        driverPhone: carrier.driverPhone || '',
        tractorPlate: carrier.tractorPlate || carrier.vehiclePlate || '',
        trailerPlate: carrier.trailerPlate || '',
        vehicleType: carrier.vehicleType || 'semi'
      });
    }
    setShowDriverInfoForm(true);
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

  // Générer et télécharger le récapitulatif PDF de la commande
  const handleDownloadRecap = () => {
    if (!order) return;

    // Créer le contenu HTML du récapitulatif
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Récapitulatif Commande ${order.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #667eea; }
    .logo-sub { font-size: 12px; color: #666; font-style: italic; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 22px; font-weight: bold; color: #333; }
    .doc-ref { font-size: 14px; color: #666; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #667eea; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
    .row { display: flex; margin-bottom: 8px; }
    .label { width: 180px; font-weight: 600; color: #555; }
    .value { flex: 1; color: #333; }
    .address-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea; }
    .address-title { font-weight: bold; color: #667eea; margin-bottom: 8px; }
    .price-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .price-label { font-size: 14px; opacity: 0.9; }
    .price-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .constraints { display: flex; flex-wrap: wrap; gap: 8px; }
    .constraint { background: #e2e8f0; padding: 5px 12px; border-radius: 15px; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SYMPHONI.A</div>
      <div class="logo-sub">Control Tower - Portail Transporteur</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">RÉCAPITULATIF DE COMMANDE</div>
      <div class="doc-ref">Réf: ${order.reference}</div>
      <div class="doc-ref">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📋 Informations générales</div>
    <div class="row"><div class="label">Référence commande:</div><div class="value"><strong>${order.reference}</strong></div></div>
    <div class="row"><div class="label">Statut:</div><div class="value">${STATUS_LABELS[order.status]?.label || order.status}</div></div>
    <div class="row"><div class="label">Date de création:</div><div class="value">${formatDate(order.createdAt)}</div></div>
    ${(order as any).clientReference ? `<div class="row"><div class="label">Référence client:</div><div class="value">${(order as any).clientReference}</div></div>` : ''}
  </div>

  <div class="price-box">
    <div class="price-label">MONTANT DE LA PRESTATION</div>
    <div class="price-value">${formatPrice(order.finalPrice || order.estimatedPrice, order.currency)}</div>
  </div>

  <div class="grid">
    <div class="address-box">
      <div class="address-title">📍 POINT DE COLLECTE</div>
      <div><strong>${order.pickupAddress.city}</strong></div>
      <div>${order.pickupAddress.street}</div>
      <div>${order.pickupAddress.postalCode} ${order.pickupAddress.city}</div>
      ${order.pickupAddress.country ? `<div>${order.pickupAddress.country}</div>` : ''}
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
        <strong>Contact:</strong> ${order.pickupAddress.contactName || '-'}
        ${order.pickupAddress.contactPhone ? `<br>📞 ${order.pickupAddress.contactPhone}` : ''}
        ${order.pickupAddress.contactEmail ? `<br>✉️ ${order.pickupAddress.contactEmail}` : ''}
      </div>
      <div style="margin-top: 10px;"><strong>Date prévue:</strong> ${formatDate(order.dates.pickupDate)}</div>
    </div>

    <div class="address-box">
      <div class="address-title">🎯 POINT DE LIVRAISON</div>
      <div><strong>${order.deliveryAddress.city}</strong></div>
      <div>${order.deliveryAddress.street}</div>
      <div>${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}</div>
      ${order.deliveryAddress.country ? `<div>${order.deliveryAddress.country}</div>` : ''}
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
        <strong>Contact:</strong> ${order.deliveryAddress.contactName || '-'}
        ${order.deliveryAddress.contactPhone ? `<br>📞 ${order.deliveryAddress.contactPhone}` : ''}
        ${order.deliveryAddress.contactEmail ? `<br>✉️ ${order.deliveryAddress.contactEmail}` : ''}
      </div>
      <div style="margin-top: 10px;"><strong>Date prévue:</strong> ${formatDate(order.dates.deliveryDate)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📦 Marchandise</div>
    <div class="row"><div class="label">Description:</div><div class="value">${order.goods.description}</div></div>
    <div class="row"><div class="label">Poids:</div><div class="value"><strong>${order.goods.weight} kg</strong></div></div>
    ${order.goods.volume ? `<div class="row"><div class="label">Volume:</div><div class="value">${order.goods.volume} m³</div></div>` : ''}
    <div class="row"><div class="label">Quantité:</div><div class="value">${order.goods.quantity}</div></div>
    ${order.goods.palettes ? `<div class="row"><div class="label">Palettes:</div><div class="value">${order.goods.palettes}</div></div>` : ''}
    ${(order.goods as any).loadingMeters ? `<div class="row"><div class="label">Mètres linéaires:</div><div class="value">${(order.goods as any).loadingMeters} ml</div></div>` : ''}
  </div>

  ${order.constraints && order.constraints.length > 0 ? `
  <div class="section">
    <div class="section-title">⚙️ Contraintes de transport</div>
    <div class="constraints">
      ${order.constraints.map(c => `<span class="constraint">${c.type}${c.value ? `: ${c.value}` : ''}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${(order as any).assignedCarrier ? `
  <div class="section">
    <div class="section-title">🚛 Informations Transporteur</div>
    <div class="row"><div class="label">Chauffeur:</div><div class="value">${(order as any).assignedCarrier.driverFirstName || ''} ${(order as any).assignedCarrier.driverLastName || ''}</div></div>
    ${(order as any).assignedCarrier.driverPhone ? `<div class="row"><div class="label">Téléphone:</div><div class="value">${(order as any).assignedCarrier.driverPhone}</div></div>` : ''}
    <div class="row"><div class="label">Plaque tracteur:</div><div class="value">${(order as any).assignedCarrier.tractorPlate || (order as any).assignedCarrier.vehiclePlate || '-'}</div></div>
    ${(order as any).assignedCarrier.trailerPlate ? `<div class="row"><div class="label">Plaque remorque:</div><div class="value">${(order as any).assignedCarrier.trailerPlate}</div></div>` : ''}
  </div>
  ` : ''}

  ${order.notes ? `
  <div class="section">
    <div class="section-title">📝 Notes</div>
    <div style="background: #fff3cd; padding: 12px; border-radius: 8px; border-left: 4px solid #ffc107;">${order.notes}</div>
  </div>
  ` : ''}

  <div class="footer">
    Document généré le ${new Date().toLocaleString('fr-FR')} via SYMPHONI.A Control Tower<br>
    Ce document fait foi pour la facturation de la prestation de transport.
  </div>
</body>
</html>
    `;

    // Ouvrir dans une nouvelle fenêtre pour impression/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Déclencher l'impression après chargement
      printWindow.onload = () => {
        printWindow.print();
      };
    }
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

              {/* Bouton Télécharger récapitulatif */}
              <button
                onClick={handleDownloadRecap}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📄 Télécharger récapitulatif
              </button>

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
              {/* Informations Chauffeur & Véhicule - Editable */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>🚛 Chauffeur & Véhicule</h2>
                  {['carrier_accepted', 'accepted', 'sent_to_carrier'].includes(order.status) && (
                    <button
                      onClick={openDriverInfoForm}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                      }}
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>

                {(order as any).assignedCarrier?.driverFirstName || (order as any).assignedCarrier?.tractorPlate ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={labelStyle}>Chauffeur</div>
                      <div style={valueStyle}>
                        {(order as any).assignedCarrier?.driverFirstName} {(order as any).assignedCarrier?.driverLastName}
                      </div>
                      {(order as any).assignedCarrier?.driverPhone && (
                        <div style={{ ...valueStyle, fontSize: '13px', color: '#6b7280' }}>
                          📞 {(order as any).assignedCarrier?.driverPhone}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={labelStyle}>Véhicule</div>
                      <div style={valueStyle}>
                        <span style={{ fontWeight: '700' }}>Tracteur:</span> {(order as any).assignedCarrier?.tractorPlate || (order as any).assignedCarrier?.vehiclePlate || '-'}
                      </div>
                      {(order as any).assignedCarrier?.trailerPlate && (
                        <div style={valueStyle}>
                          <span style={{ fontWeight: '700' }}>Remorque:</span> {(order as any).assignedCarrier?.trailerPlate}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                    <div style={{ color: '#92400e', fontWeight: '600' }}>
                      Informations chauffeur non renseignées
                    </div>
                    <div style={{ color: '#a16207', fontSize: '13px', marginTop: '4px' }}>
                      Cliquez sur "Modifier" pour ajouter le chauffeur et les plaques du véhicule
                    </div>
                  </div>
                )}
              </div>

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

      {/* Modal Informations Chauffeur */}
      {showDriverInfoForm && (
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700' }}>
              🚛 Informations Chauffeur & Véhicule
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Ces informations seront utilisées à la borne chauffeur pour l'identification lors du chargement.
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={driverInfo.driverFirstName}
                    onChange={(e) => setDriverInfo({ ...driverInfo, driverFirstName: e.target.value })}
                    placeholder="Jean"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={driverInfo.driverLastName}
                    onChange={(e) => setDriverInfo({ ...driverInfo, driverLastName: e.target.value })}
                    placeholder="DUPONT"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                  Téléphone chauffeur
                </label>
                <input
                  type="tel"
                  value={driverInfo.driverPhone}
                  onChange={(e) => setDriverInfo({ ...driverInfo, driverPhone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                    Plaque Tracteur *
                  </label>
                  <input
                    type="text"
                    value={driverInfo.tractorPlate}
                    onChange={(e) => setDriverInfo({ ...driverInfo, tractorPlate: e.target.value.toUpperCase() })}
                    placeholder="AB-123-CD"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                    Plaque Remorque
                  </label>
                  <input
                    type="text"
                    value={driverInfo.trailerPlate}
                    onChange={(e) => setDriverInfo({ ...driverInfo, trailerPlate: e.target.value.toUpperCase() })}
                    placeholder="EF-456-GH"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                  Type de véhicule
                </label>
                <select
                  value={driverInfo.vehicleType}
                  onChange={(e) => setDriverInfo({ ...driverInfo, vehicleType: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="semi">Semi-remorque</option>
                  <option value="porteur">Porteur</option>
                  <option value="fourgon">Fourgon</option>
                  <option value="VUL">VUL</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowDriverInfoForm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDriverInfo}
                disabled={savingDriverInfo}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: savingDriverInfo ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: savingDriverInfo ? 0.7 : 1,
                }}
              >
                {savingDriverInfo ? 'Enregistrement...' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

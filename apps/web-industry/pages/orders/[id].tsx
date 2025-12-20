/**
r * Page de détail d'une commande - Portail Industry
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
  pending: { label: 'En attente', color: '#6b7280', bgColor: '#f3f4f6' },
  // Auto-dispatch statuts
  planification_auto: { label: 'Planification auto', color: '#8b5cf6', bgColor: '#ede9fe' },
  affret_ia: { label: 'Affret IA', color: '#ec4899', bgColor: '#fce7f3' },
  echec_planification: { label: 'Échec planification', color: '#dc2626', bgColor: '#fee2e2' },
  accepted: { label: 'Accepté', color: '#10b981', bgColor: '#d1fae5' },
  // Legacy statuts
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

// Icons pour les types d'événements auto-dispatch
const EVENT_ICONS: Record<string, string> = {
  auto_dispatch_started: '🚀',
  sent_to_carrier: '📨',
  carrier_accepted: '✅',
  carrier_refused: '❌',
  escalated_affret_ia: '🤖',
  affret_ia_match_found: '🎯',
  dispatch_completed: '🏆',
  dispatch_failed: '⚠️',
  comment: '💬',
  status_change: '🔄',
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

  // Ajouter un commentaire a la commande
  const handleAddComment = async () => {
    if (!orderId || !newComment.trim()) return;

    try {
      const response = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${orderId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'comment',
          description: newComment.trim(),
          userName: 'Utilisateur Industry',
        }),
      });

      if (response.ok) {
        setNewComment('');
        toast.success('Commentaire envoye avec succes');
        // Recharger les evenements
        loadOrder();
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Impossible d\'ajouter le commentaire');
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

  // Fonction d'impression du contrat de transport
  const handlePrint = () => {
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderData = order as any;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrat de Transport - ${order.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #1f2937;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo { font-size: 28px; font-weight: 800; color: #667eea; }
          .logo span { color: #764ba2; }
          .doc-title {
            text-align: right;
          }
          .doc-title h1 {
            font-size: 24px;
            color: #111827;
            margin-bottom: 4px;
          }
          .doc-title .ref {
            font-size: 18px;
            color: #667eea;
            font-weight: 700;
          }
          .doc-title .customer-ref {
            font-size: 14px;
            color: #059669;
            font-weight: 600;
            margin-top: 4px;
          }
          .doc-title .date {
            font-size: 12px;
            color: #6b7280;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            padding: 8px 16px;
            margin-bottom: 16px;
            border-radius: 4px;
          }
          .section-title.green { background: #22c55e; }
          .section-title.blue { background: #3b82f6; }
          .section-title.purple { background: #8b5cf6; }
          .section-title.orange { background: #f59e0b; }
          .section-title.gray { background: #6b7280; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            background: #fafafa;
          }
          .box-title {
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .box-content { font-size: 13px; }
          .box-content strong { display: block; font-size: 14px; color: #111827; margin-bottom: 4px; }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-weight: 500; }
          .info-value { color: #111827; font-weight: 600; text-align: right; }
          .parties-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .party-box {
            padding: 16px;
            border-radius: 8px;
            border: 2px solid;
          }
          .party-box.industrial { background: #dbeafe; border-color: #3b82f6; }
          .party-box.carrier { background: #dcfce7; border-color: #22c55e; }
          .party-box.sender { background: #fef3c7; border-color: #f59e0b; }
          .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
          .party-name { font-size: 14px; font-weight: 700; color: #111827; }
          .party-detail { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .goods-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .goods-table th {
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
          }
          .goods-table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          .price-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .price-label { font-size: 12px; opacity: 0.9; }
          .price-value { font-size: 28px; font-weight: 800; margin-top: 4px; }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-box {
            border: 1px dashed #d1d5db;
            padding: 20px;
            height: 120px;
            border-radius: 8px;
          }
          .signature-label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
          }
          .legal {
            margin-top: 30px;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            padding: 16px;
            background: #f9fafb;
            border-radius: 4px;
          }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SYMPHONI<span>.A</span></div>
          <div class="doc-title">
            <h1>CONTRAT DE TRANSPORT</h1>
            <div class="ref">${order.reference}</div>
            ${orderData.customerReference ? `<div class="customer-ref">Réf. client: ${orderData.customerReference}</div>` : ''}
            <div class="date">Émis le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <!-- Parties prenantes -->
        <div class="section">
          <div class="section-title purple">PARTIES AU CONTRAT</div>
          <div class="parties-grid">
            <div class="party-box industrial">
              <div class="party-label" style="color: #1e40af;">Donneur d'ordre</div>
              <div class="party-name">${orderData.industrialName || orderData.organizationName || orderData.companyName || 'Non défini'}</div>
            </div>
            <div class="party-box carrier">
              <div class="party-label" style="color: #15803d;">Transporteur</div>
              <div class="party-name">${orderData.carrierName || orderData.assignedCarrier?.carrierName || order.carrierId || 'En attente d\'assignation'}</div>
              ${orderData.assignedCarrier?.driverName ? `<div class="party-detail">Chauffeur: ${orderData.assignedCarrier.driverName}</div>` : ''}
              ${orderData.assignedCarrier?.vehiclePlate ? `<div class="party-detail">Véhicule: ${orderData.assignedCarrier.vehiclePlate}</div>` : ''}
            </div>
            <div class="party-box sender">
              <div class="party-label" style="color: #92400e;">Expéditeur</div>
              <div class="party-name">${orderData.senderName || orderData.forwarderName || 'Non défini'}</div>
              ${orderData.senderEmail ? `<div class="party-detail">${orderData.senderEmail}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Enlèvement et Livraison -->
        <div class="section">
          <div class="grid">
            <div>
              <div class="section-title green">ENLÈVEMENT</div>
              <div class="box">
                <div class="box-title">Adresse</div>
                <div class="box-content">
                  <strong>${order.pickupAddress?.street || '-'}</strong>
                  ${order.pickupAddress?.postalCode || ''} ${order.pickupAddress?.city || ''}
                  <br/>${order.pickupAddress?.country || 'France'}
                </div>
              </div>
              <div class="box" style="margin-top: 12px;">
                <div class="box-title">Contact sur place</div>
                <div class="box-content">
                  <strong>${order.pickupAddress?.contactName || '-'}</strong>
                  ${order.pickupAddress?.contactPhone ? `Tél: ${order.pickupAddress.contactPhone}` : ''}
                  ${order.pickupAddress?.contactEmail ? `<br/>Email: ${order.pickupAddress.contactEmail}` : ''}
                </div>
              </div>
              <div class="box" style="margin-top: 12px;">
                <div class="box-title">Date prévue</div>
                <div class="box-content">
                  <strong>${order.dates?.pickupDate ? new Date(order.dates.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</strong>
                  ${order.dates?.pickupTimeSlotStart ? `Créneau: ${order.dates.pickupTimeSlotStart}${order.dates.pickupTimeSlotEnd ? ` - ${order.dates.pickupTimeSlotEnd}` : ''}` : ''}
                </div>
              </div>
            </div>
            <div>
              <div class="section-title blue">LIVRAISON</div>
              <div class="box">
                <div class="box-title">Adresse</div>
                <div class="box-content">
                  <strong>${order.deliveryAddress?.street || '-'}</strong>
                  ${order.deliveryAddress?.postalCode || ''} ${order.deliveryAddress?.city || ''}
                  <br/>${order.deliveryAddress?.country || 'France'}
                </div>
              </div>
              <div class="box" style="margin-top: 12px;">
                <div class="box-title">Contact sur place</div>
                <div class="box-content">
                  <strong>${order.deliveryAddress?.contactName || '-'}</strong>
                  ${order.deliveryAddress?.contactPhone ? `Tél: ${order.deliveryAddress.contactPhone}` : ''}
                  ${order.deliveryAddress?.contactEmail ? `<br/>Email: ${order.deliveryAddress.contactEmail}` : ''}
                </div>
              </div>
              <div class="box" style="margin-top: 12px;">
                <div class="box-title">Date prévue</div>
                <div class="box-content">
                  <strong>${order.dates?.deliveryDate ? new Date(order.dates.deliveryDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</strong>
                  ${order.dates?.deliveryTimeSlotStart ? `Créneau: ${order.dates.deliveryTimeSlotStart}${order.dates.deliveryTimeSlotEnd ? ` - ${order.dates.deliveryTimeSlotEnd}` : ''}` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Marchandise -->
        <div class="section">
          <div class="section-title orange">MARCHANDISE TRANSPORTÉE</div>
          <table class="goods-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Poids</th>
                <th>Volume</th>
                <th>Quantité</th>
                <th>Palettes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${order.goods?.description || '-'}</strong></td>
                <td>${order.goods?.weight || 0} kg</td>
                <td>${order.goods?.volume ? `${order.goods.volume} m³` : '-'}</td>
                <td>${order.goods?.quantity || 1} colis</td>
                <td>${order.goods?.palettes || 0} palettes</td>
              </tr>
            </tbody>
          </table>
          ${order.goods?.packaging ? `<div style="margin-top: 12px; font-size: 12px;"><strong>Emballage:</strong> ${order.goods.packaging}</div>` : ''}
          ${order.goods?.value ? `<div style="margin-top: 4px; font-size: 12px;"><strong>Valeur déclarée:</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency || 'EUR' }).format(order.goods.value)}</div>` : ''}
        </div>

        <!-- Prix et conditions -->
        <div class="section">
          <div class="section-title gray">CONDITIONS FINANCIÈRES</div>
          <div class="grid">
            <div class="price-box">
              <div class="price-label">Prix du transport</div>
              <div class="price-value">${order.finalPrice || order.estimatedPrice ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency || 'EUR' }).format(order.finalPrice || order.estimatedPrice || 0) : 'À définir'}</div>
            </div>
            <div class="box">
              <div class="info-row">
                <span class="info-label">Distance estimée</span>
                <span class="info-value">${orderData.distanceKm ? `${orderData.distanceKm} km` : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Durée estimée</span>
                <span class="info-value">${orderData.durationMinutes ? `${Math.floor(orderData.durationMinutes / 60)}h${String(orderData.durationMinutes % 60).padStart(2, '0')}` : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Niveau de tracking</span>
                <span class="info-value">${order.trackingLevel === 'premium' ? 'Premium (GPS temps réel)' : order.trackingLevel === 'gps' ? 'GPS' : 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>

        ${order.notes ? `
        <div class="section">
          <div class="section-title gray">INSTRUCTIONS PARTICULIÈRES</div>
          <div class="box">
            <div class="box-content">${order.notes}</div>
          </div>
        </div>
        ` : ''}

        ${order.constraints && order.constraints.length > 0 ? `
        <div class="section">
          <div class="section-title orange">CONTRAINTES DE TRANSPORT</div>
          <div class="box">
            <div class="box-content">
              ${order.constraints.map(c => `<span style="display: inline-block; margin: 4px; padding: 4px 12px; background: #fef3c7; border-radius: 4px; font-size: 12px;">${c.type}${c.value ? `: ${c.value}` : ''}</span>`).join('')}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Signatures -->
        <div class="footer">
          <div class="signature-box">
            <div class="signature-label">Signature du donneur d'ordre</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Signature du transporteur</div>
          </div>
        </div>

        <div class="legal">
          Ce contrat de transport est soumis aux conditions générales de vente du transporteur et à la Convention relative au contrat de transport international de marchandises par route (CMR).
          <br/>Document généré automatiquement par SYMPHONI.A le ${new Date().toLocaleString('fr-FR')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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
                    {orderAny.customerReference && (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #86efac',
                      }}>
                        Réf. client: {orderAny.customerReference}
                      </span>
                    )}
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
                    onClick={() => router.push(`/orders/edit/?id=${orderId}`)}
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
                <button
                  onClick={handlePrint}
                  style={{ padding: '10px 16px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                >
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

              {/* Section Parties Prenantes */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', backgroundColor: '#f5f3ff', borderBottom: '2px solid #8b5cf6' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#6d28d9' }}>Parties prenantes</span>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Expediteur */}
                  <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>Expéditeur</div>
                        <div style={{ fontSize: '10px', color: '#b45309', marginTop: '2px' }}>
                          {orderAny.senderType === 'industriel' ? 'Industriel (interne)' :
                           orderAny.senderType === 'logisticien' ? 'Logisticien de l\'industriel' :
                           'Externe (Fournisseur/Transitaire)'}
                        </div>
                      </div>
                      {/* Action button based on sender type */}
                      {(orderAny.senderType === 'industriel' || orderAny.senderType === 'logisticien') ? (
                        <a
                          href="/planning"
                          style={{ fontSize: '11px', color: '#92400e', textDecoration: 'none', fontWeight: '600', padding: '4px 8px', backgroundColor: '#fcd34d', borderRadius: '4px' }}
                        >
                          📅 Planning
                        </a>
                      ) : orderAny.senderType === 'externe' && orderAny.senderEmail ? (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${order.id}/send-supplier-invitation`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: orderAny.senderEmail, name: orderAny.senderName }),
                              });
                              if (response.ok) {
                                toast.success('Invitation envoyée au fournisseur');
                              } else {
                                throw new Error('Erreur lors de l\'envoi');
                              }
                            } catch (err) {
                              toast.error('Erreur lors de l\'envoi de l\'invitation');
                            }
                          }}
                          style={{ fontSize: '11px', color: 'white', fontWeight: '600', padding: '4px 8px', backgroundColor: '#f59e0b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        >
                          ✉️ Envoyer invitation
                        </button>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {orderAny.senderName || orderAny.forwarderName || 'Non défini'}
                    </div>
                    {orderAny.senderEmail && (
                      <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✉️ {orderAny.senderEmail}
                      </div>
                    )}
                  </div>

                  {/* Destinataire */}
                  <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af' }}>Destinataire</div>
                      {orderAny.recipientEmail && (
                        <a
                          href={`https://d3b6p09ihn5w7r.amplifyapp.com/orders/?email=${encodeURIComponent(orderAny.recipientEmail)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                        >
                          Ouvrir portail →
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {orderAny.recipientName || 'Non défini'}
                    </div>
                    {orderAny.recipientEmail && (
                      <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✉️ {orderAny.recipientEmail}
                      </div>
                    )}
                  </div>
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
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Enlèvement chez :</div>
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
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Livraison chez :</div>
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
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: newComment.trim() ? '#667eea' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>

                    {/* Timeline des événements auto-dispatch */}
                    {(order.events && order.events.length > 0) || (orderAny.dispatchChain) ? (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🤖</span> Historique de planification
                        </div>

                        {/* Dispatch Chain Status */}
                        {orderAny.dispatchChain && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: orderAny.dispatchChain.status === 'completed' ? '#d1fae5' :
                                           orderAny.dispatchChain.status === 'failed' ? '#fee2e2' :
                                           orderAny.dispatchChain.status === 'affret_ia' ? '#fce7f3' : '#ede9fe',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>
                                {orderAny.dispatchChain.status === 'completed' ? '✅ Transporteur assigné' :
                                 orderAny.dispatchChain.status === 'failed' ? '⚠️ Échec de planification' :
                                 orderAny.dispatchChain.status === 'affret_ia' ? '🤖 Escaladé vers Affret IA' :
                                 '⏳ Planification en cours...'}
                              </div>
                              {orderAny.dispatchChain.assignedCarrierName && (
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                                  {orderAny.dispatchChain.assignedCarrierName}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Events Timeline */}
                        <div style={{ position: 'relative', paddingLeft: '24px' }}>
                          {/* Ligne verticale */}
                          <div style={{
                            position: 'absolute',
                            left: '7px',
                            top: '4px',
                            bottom: '4px',
                            width: '2px',
                            backgroundColor: '#e5e7eb'
                          }} />

                          {(order.events || []).sort((a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          ).map((event, idx) => (
                            <div key={event.id || idx} style={{
                              position: 'relative',
                              paddingBottom: '16px',
                              marginLeft: '8px'
                            }}>
                              {/* Point sur la timeline */}
                              <div style={{
                                position: 'absolute',
                                left: '-25px',
                                top: '4px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: event.type === 'carrier_accepted' ? '#22c55e' :
                                               event.type === 'carrier_refused' ? '#ef4444' :
                                               event.type === 'escalated_affret_ia' ? '#ec4899' :
                                               event.type === 'auto_dispatch_started' ? '#8b5cf6' :
                                               '#667eea',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'white',
                                fontWeight: '700',
                                border: '2px solid white',
                                boxShadow: '0 0 0 2px #e5e7eb'
                              }}>
                                {EVENT_ICONS[event.type] || '📌'}
                              </div>

                              {/* Contenu de l'événement */}
                              <div style={{
                                backgroundColor: '#f9fafb',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                    {event.description || event.type}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                    {formatDateTime(event.timestamp)}
                                  </div>
                                </div>
                                {event.carrierName && (
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    🚛 {event.carrierName}
                                    {event.carrierScore && <span style={{ marginLeft: '8px', color: '#667eea' }}>Score: {event.carrierScore}/100</span>}
                                  </div>
                                )}
                                {event.reason && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#dc2626',
                                    marginTop: '4px',
                                    padding: '6px 8px',
                                    backgroundColor: '#fef2f2',
                                    borderRadius: '4px'
                                  }}>
                                    💬 Raison: {event.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {(!order.events || order.events.length === 0) && (
                            <div style={{ color: '#9ca3af', fontSize: '13px', padding: '12px' }}>
                              Aucun événement de planification
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

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
                      !order.events || order.events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                          <div>Aucun événement pour le moment</div>
                          <div style={{ fontSize: '13px', marginTop: '8px', color: '#6b7280' }}>
                            Le suivi temps réel sera disponible une fois un transporteur assigné
                          </div>
                        </div>
                      ) : null
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

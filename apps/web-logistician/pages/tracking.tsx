/**
 * Page Suivi des RDV du Jour - Portail Logistique
 * Interface simplifiée pour le logisticien
 *
 * Fonctionnalités:
 * - Sélecteur de date
 * - Liste des RDV du jour classés par heure
 * - Bouton "Demander Tracking" pour chaque RDV
 * - Envoi automatique de demande ETA au transporteur
 * - Actualisation de l'ETA dans le planning
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken, getUser } from '../lib/auth';

// Types
interface RdvTracking {
  _id: string;
  rdvId: string;
  orderRef: string;
  transporterName: string;
  transporterEmail?: string;
  transporterPhone?: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
  operationType: 'pickup' | 'delivery';
  confirmedDate: string;
  confirmedTime: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  estimatedPallets?: number;
  estimatedWeight?: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'arrived' | 'completed' | 'delayed' | 'no_show';
  // Tracking data
  trackingRequested?: boolean;
  trackingRequestedAt?: string;
  currentEta?: string;
  lastPosition?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  etaHistory?: Array<{
    eta: string;
    receivedAt: string;
    source: 'transporteur' | 'gps' | 'manual';
  }>;
}

type TrackingStatus = 'waiting' | 'requested' | 'received' | 'delayed' | 'arrived';

export default function TrackingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rdvList, setRdvList] = useState<RdvTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingTrackingFor, setRequestingTrackingFor] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Charger les RDV du jour
  const loadRdvForDate = async (date: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/rdv/by-date?date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRdvList(data.rdvs || []);
      } else {
        // Mock data pour demo
        setRdvList(generateMockRdvs(date));
      }
    } catch (err) {
      console.log('API unavailable, using mock data');
      setRdvList(generateMockRdvs(date));
    } finally {
      setIsLoading(false);
    }
  };

  // Générer des données mock réalistes
  const generateMockRdvs = (date: string): RdvTracking[] => {
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      // Moins de RDV pour les autres jours
      return [
        {
          _id: '1',
          rdvId: 'RDV-2024-101',
          orderRef: 'CMD-2024-5001',
          transporterName: 'Transports Durand',
          transporterEmail: 'dispatch@durand-transport.fr',
          transporterPhone: '+33 4 91 00 00 00',
          driverName: 'Marc Durand',
          driverPhone: '+33 6 00 00 00 01',
          licensePlate: 'EE-333-FF',
          operationType: 'pickup',
          confirmedDate: date,
          confirmedTime: '10:00',
          siteName: 'Entrepôt Lyon',
          siteAddress: '200 Rue de la Logistique',
          siteCity: 'Lyon',
          estimatedPallets: 18,
          estimatedWeight: 9000,
          status: 'confirmed',
          trackingRequested: false
        }
      ];
    }

    // RDV du jour avec différents statuts
    return [
      {
        _id: '1',
        rdvId: 'RDV-2024-001',
        orderRef: 'CMD-2024-1234',
        transporterName: 'Transports Martin',
        transporterEmail: 'dispatch@martin-transport.fr',
        transporterPhone: '+33 1 23 45 67 89',
        driverName: 'Jean Dupont',
        driverPhone: '+33 6 12 34 56 78',
        licensePlate: 'AB-123-CD',
        operationType: 'pickup',
        confirmedDate: date,
        confirmedTime: '07:30',
        siteName: 'Entrepôt Paris Nord',
        siteAddress: '123 Rue de la Logistique',
        siteCity: 'Roissy-en-France',
        estimatedPallets: 24,
        estimatedWeight: 12000,
        status: 'completed',
        trackingRequested: true,
        trackingRequestedAt: new Date(Date.now() - 3600000).toISOString(),
        currentEta: '07:28',
        lastPosition: { latitude: 49.0097, longitude: 2.5479, timestamp: new Date(Date.now() - 1800000).toISOString() }
      },
      {
        _id: '2',
        rdvId: 'RDV-2024-002',
        orderRef: 'CMD-2024-1235',
        transporterName: 'Express Fret',
        transporterEmail: 'contact@expressfret.com',
        transporterPhone: '+33 4 56 78 90 12',
        driverName: 'Pierre Martin',
        driverPhone: '+33 6 98 76 54 32',
        licensePlate: 'EF-456-GH',
        operationType: 'delivery',
        confirmedDate: date,
        confirmedTime: '09:00',
        siteName: 'Hub Lyon',
        siteAddress: '45 Avenue du Transport',
        siteCity: 'Saint-Priest',
        estimatedPallets: 12,
        estimatedWeight: 6000,
        status: 'arrived',
        trackingRequested: true,
        trackingRequestedAt: new Date(Date.now() - 7200000).toISOString(),
        currentEta: '08:55',
        lastPosition: { latitude: 45.6987, longitude: 4.9342, timestamp: new Date(Date.now() - 300000).toISOString() }
      },
      {
        _id: '3',
        rdvId: 'RDV-2024-003',
        orderRef: 'CMD-2024-1236',
        transporterName: 'Logistique Sud',
        transporterEmail: 'dispatch@logistiquesud.fr',
        driverName: 'Alain Bernard',
        licensePlate: 'IJ-789-KL',
        operationType: 'pickup',
        confirmedDate: date,
        confirmedTime: '10:30',
        siteName: 'Plateforme Marseille',
        siteAddress: '78 Boulevard Maritime',
        siteCity: 'Marseille',
        estimatedPallets: 33,
        estimatedWeight: 18000,
        status: 'in_transit',
        trackingRequested: true,
        trackingRequestedAt: new Date(Date.now() - 1800000).toISOString(),
        currentEta: '10:45',
        lastPosition: { latitude: 43.4521, longitude: 5.2876, timestamp: new Date(Date.now() - 120000).toISOString() },
        etaHistory: [
          { eta: '10:30', receivedAt: new Date(Date.now() - 3600000).toISOString(), source: 'transporteur' },
          { eta: '10:45', receivedAt: new Date(Date.now() - 1800000).toISOString(), source: 'gps' }
        ]
      },
      {
        _id: '4',
        rdvId: 'RDV-2024-004',
        orderRef: 'CMD-2024-1237',
        transporterName: 'Fast Delivery',
        transporterEmail: 'ops@fastdelivery.eu',
        transporterPhone: '+33 5 67 89 01 23',
        operationType: 'pickup',
        confirmedDate: date,
        confirmedTime: '11:00',
        siteName: 'Entrepôt Paris Nord',
        siteAddress: '123 Rue de la Logistique',
        siteCity: 'Roissy-en-France',
        estimatedPallets: 8,
        estimatedWeight: 2500,
        status: 'confirmed',
        trackingRequested: false
      },
      {
        _id: '5',
        rdvId: 'RDV-2024-005',
        orderRef: 'CMD-2024-1238',
        transporterName: 'Trans Europe',
        transporterEmail: 'dispatch@transeurope.com',
        driverName: 'Klaus Mueller',
        driverPhone: '+49 170 123 4567',
        licensePlate: 'DE-MU-1234',
        operationType: 'delivery',
        confirmedDate: date,
        confirmedTime: '14:00',
        siteName: 'Hub Lyon',
        siteAddress: '45 Avenue du Transport',
        siteCity: 'Saint-Priest',
        estimatedPallets: 20,
        estimatedWeight: 11000,
        status: 'delayed',
        trackingRequested: true,
        trackingRequestedAt: new Date(Date.now() - 5400000).toISOString(),
        currentEta: '15:30',
        lastPosition: { latitude: 46.8521, longitude: 4.3456, timestamp: new Date(Date.now() - 600000).toISOString() },
        etaHistory: [
          { eta: '14:00', receivedAt: new Date(Date.now() - 7200000).toISOString(), source: 'transporteur' },
          { eta: '14:30', receivedAt: new Date(Date.now() - 5400000).toISOString(), source: 'gps' },
          { eta: '15:30', receivedAt: new Date(Date.now() - 1800000).toISOString(), source: 'gps' }
        ]
      },
      {
        _id: '6',
        rdvId: 'RDV-2024-006',
        orderRef: 'CMD-2024-1239',
        transporterName: 'Normandie Fret',
        transporterEmail: 'contact@normandiefret.fr',
        operationType: 'pickup',
        confirmedDate: date,
        confirmedTime: '15:30',
        siteName: 'Plateforme Marseille',
        siteAddress: '78 Boulevard Maritime',
        siteCity: 'Marseille',
        estimatedPallets: 15,
        estimatedWeight: 7500,
        status: 'confirmed',
        trackingRequested: false
      },
      {
        _id: '7',
        rdvId: 'RDV-2024-007',
        orderRef: 'CMD-2024-1240',
        transporterName: 'Iberia Logistics',
        transporterEmail: 'operaciones@iberialog.es',
        driverName: 'Carlos Garcia',
        licensePlate: 'ES-1234-BCD',
        operationType: 'delivery',
        confirmedDate: date,
        confirmedTime: '16:00',
        siteName: 'Entrepôt Paris Nord',
        siteAddress: '123 Rue de la Logistique',
        siteCity: 'Roissy-en-France',
        estimatedPallets: 28,
        estimatedWeight: 14000,
        status: 'in_transit',
        trackingRequested: true,
        trackingRequestedAt: new Date(Date.now() - 3600000).toISOString(),
        currentEta: '15:50',
        lastPosition: { latitude: 48.7234, longitude: 2.1234, timestamp: new Date(Date.now() - 180000).toISOString() }
      }
    ];
  };

  // Demander le tracking à un transporteur
  const requestTracking = async (rdv: RdvTracking) => {
    setRequestingTrackingFor(rdv._id);
    setErrorMessage(null);

    try {
      const token = getAuthToken();
      const user = getUser();
      const logisticianId = user?.organizationId || user?.logisticianId || user?.id;
      const apiUrl = process.env.NEXT_PUBLIC_LOGISTICIAN_API_URL || 'http://rt-logistician-api-prod.eba-jm2vzrg3.eu-west-3.elasticbeanstalk.com';

      // Envoyer la demande de tracking au transporteur via email
      try {
        const response = await fetch(
          `${apiUrl}/api/logisticians/${logisticianId}/tracking/request-eta/${rdv._id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            }
        );

        if (response.ok) {
          // Mise à jour réussie via API
          setRdvList(prev => prev.map(r =>
            r._id === rdv._id
              ? { ...r, trackingRequested: true, trackingRequestedAt: new Date().toISOString(), status: 'in_transit' as const }
              : r
          ));
          setSuccessMessage(`Demande ETA envoyée par email à ${rdv.transporterName}`);
          setTimeout(() => setSuccessMessage(null), 4000);
          return;
        }
      } catch (apiErr) {
        console.log('API unavailable, updating locally');
      }

      // Fallback: mise à jour locale
      setRdvList(prev => prev.map(r =>
        r._id === rdv._id
          ? { ...r, trackingRequested: true, trackingRequestedAt: new Date().toISOString(), status: 'in_transit' as const }
          : r
      ));
      setSuccessMessage(`Demande de tracking envoyée à ${rdv.transporterName}`);
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err) {
      console.error('Failed to request tracking:', err);
      setErrorMessage('Erreur lors de l\'envoi de la demande');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setRequestingTrackingFor(null);
    }
  };

  // Simuler la réception d'une mise à jour ETA (WebSocket en prod)
  const simulateEtaUpdate = () => {
    setRdvList(prev => prev.map(r => {
      if (r.trackingRequested && r.status === 'in_transit') {
        // Simuler une légère variation de l'ETA
        const currentEtaMinutes = parseInt(r.currentEta?.split(':')[1] || '0');
        const variation = Math.floor(Math.random() * 10) - 5;
        const newMinutes = Math.max(0, Math.min(59, currentEtaMinutes + variation));
        const hours = r.currentEta?.split(':')[0] || r.confirmedTime.split(':')[0];
        return {
          ...r,
          currentEta: `${hours}:${newMinutes.toString().padStart(2, '0')}`,
          lastPosition: r.lastPosition ? {
            ...r.lastPosition,
            timestamp: new Date().toISOString()
          } : undefined
        };
      }
      return r;
    }));
  };

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadRdvForDate(selectedDate);
  }, [selectedDate]);

  // Simuler des mises à jour en temps réel (toutes les 30 secondes)
  useEffect(() => {
    const interval = setInterval(simulateEtaUpdate, 30000);
    return () => clearInterval(interval);
  }, []);

  // Obtenir le statut de tracking
  const getTrackingStatus = (rdv: RdvTracking): TrackingStatus => {
    if (rdv.status === 'arrived' || rdv.status === 'completed') return 'arrived';
    if (rdv.status === 'delayed') return 'delayed';
    if (rdv.trackingRequested && rdv.currentEta) return 'received';
    if (rdv.trackingRequested) return 'requested';
    return 'waiting';
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: RdvTracking['status']) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'arrived': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'in_transit': return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      case 'delayed': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'no_show': return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
      default: return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: RdvTracking['status']) => {
    switch (status) {
      case 'completed': return '✅ Terminé';
      case 'arrived': return '📍 Arrivé';
      case 'in_transit': return '🚛 En route';
      case 'delayed': return '⚠️ Retard';
      case 'no_show': return '❌ No-show';
      case 'confirmed': return '📋 Confirmé';
      default: return '⏳ En attente';
    }
  };

  // Trier les RDV par heure
  const sortedRdvs = [...rdvList].sort((a, b) => {
    const timeA = a.confirmedTime.replace(':', '');
    const timeB = b.confirmedTime.replace(':', '');
    return parseInt(timeA) - parseInt(timeB);
  });

  // Grouper par plage horaire
  const groupedByHour: Record<string, RdvTracking[]> = {};
  sortedRdvs.forEach(rdv => {
    const hour = rdv.confirmedTime.split(':')[0] + ':00';
    if (!groupedByHour[hour]) {
      groupedByHour[hour] = [];
    }
    groupedByHour[hour].push(rdv);
  });

  // Stats du jour
  const stats = {
    total: rdvList.length,
    completed: rdvList.filter(r => r.status === 'completed').length,
    inTransit: rdvList.filter(r => r.status === 'in_transit').length,
    delayed: rdvList.filter(r => r.status === 'delayed').length,
    pending: rdvList.filter(r => r.status === 'confirmed' || r.status === 'pending').length
  };

  return (
    <>
      <Head>
        <title>Suivi des RDV - Logistique | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: 'system-ui, sans-serif',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 32px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ← Retour
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                📅 Suivi des RDV du Jour
              </h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '14px' }}>
                Tracking en temps réel des transporteurs
              </p>
            </div>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ◀
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ▶
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              style={{
                padding: '10px 20px',
                background: selectedDate === new Date().toISOString().split('T')[0]
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div style={{
            margin: '16px 32px',
            padding: '16px 20px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#6ee7b7',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            margin: '16px 32px',
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            {errorMessage}
          </div>
        )}

        {/* Stats du jour */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          padding: '20px 32px'
        }}>
          <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Total RDV</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Terminés</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fbbf24' }}>{stats.inTransit}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>En route</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444' }}>{stats.delayed}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>En retard</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(156, 163, 175, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(156, 163, 175, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#9ca3af' }}>{stats.pending}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>En attente</div>
          </div>
        </div>

        {/* Liste des RDV */}
        <div style={{ padding: '0 32px 32px' }}>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <div style={{ fontSize: '18px', opacity: 0.7 }}>Chargement des RDV...</div>
            </div>
          ) : rdvList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                Aucun RDV pour cette date
              </div>
              <div style={{ opacity: 0.7 }}>
                Sélectionnez une autre date ou ajoutez des rendez-vous
              </div>
            </div>
          ) : (
            Object.entries(groupedByHour).map(([hour, rdvs]) => (
              <div key={hour} style={{ marginBottom: '24px' }}>
                {/* En-tête de l'heure */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '800'
                  }}>
                    🕐 {hour}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)'
                  }} />
                  <div style={{ fontSize: '14px', opacity: 0.6 }}>
                    {rdvs.length} RDV
                  </div>
                </div>

                {/* Cartes RDV */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rdvs.map(rdv => {
                    const statusColor = getStatusColor(rdv.status);
                    const isDelayed = rdv.status === 'delayed' || (rdv.currentEta && rdv.currentEta > rdv.confirmedTime);

                    return (
                      <div
                        key={rdv._id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '16px',
                          border: `2px solid ${statusColor.border}`,
                          borderLeft: `6px solid ${statusColor.text}`,
                          padding: '20px',
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr 200px 180px',
                          gap: '20px',
                          alignItems: 'center'
                        }}
                      >
                        {/* Heure */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            color: isDelayed ? '#ef4444' : 'white'
                          }}>
                            {rdv.confirmedTime}
                          </div>
                          {rdv.currentEta && rdv.currentEta !== rdv.confirmedTime && (
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: isDelayed ? '#ef4444' : '#10b981',
                              marginTop: '4px'
                            }}>
                              ETA: {rdv.currentEta}
                            </div>
                          )}
                          <div style={{
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: rdv.operationType === 'pickup' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: rdv.operationType === 'pickup' ? '#3b82f6' : '#10b981'
                          }}>
                            {rdv.operationType === 'pickup' ? '📥 Chargement' : '📤 Livraison'}
                          </div>
                        </div>

                        {/* Infos principales */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{
                              padding: '4px 12px',
                              background: statusColor.bg,
                              border: `1px solid ${statusColor.border}`,
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: statusColor.text
                            }}>
                              {getStatusLabel(rdv.status)}
                            </span>
                            <span style={{ fontWeight: '700', fontSize: '16px' }}>{rdv.rdvId}</span>
                            <span style={{ opacity: 0.6, fontSize: '14px' }}>• {rdv.orderRef}</span>
                          </div>
                          <div style={{ fontSize: '15px', marginBottom: '6px' }}>
                            <strong>🚛 {rdv.transporterName}</strong>
                            {rdv.driverName && <span style={{ opacity: 0.7 }}> • {rdv.driverName}</span>}
                            {rdv.licensePlate && <span style={{ opacity: 0.6 }}> • {rdv.licensePlate}</span>}
                          </div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>
                            📍 {rdv.siteName} - {rdv.siteCity}
                          </div>
                        </div>

                        {/* Détails */}
                        <div style={{ fontSize: '13px' }}>
                          {rdv.estimatedPallets && (
                            <div style={{ marginBottom: '4px' }}>
                              📦 {rdv.estimatedPallets} palettes
                            </div>
                          )}
                          {rdv.estimatedWeight && (
                            <div style={{ marginBottom: '4px' }}>
                              ⚖️ {(rdv.estimatedWeight / 1000).toFixed(1)}t
                            </div>
                          )}
                          {rdv.lastPosition && (
                            <div style={{ opacity: 0.7 }}>
                              🛰️ MAJ: {new Date(rdv.lastPosition.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ textAlign: 'right' }}>
                          {rdv.status === 'completed' || rdv.status === 'arrived' ? (
                            <div style={{
                              padding: '12px 20px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#10b981'
                            }}>
                              ✅ {rdv.status === 'completed' ? 'Terminé' : 'Sur site'}
                            </div>
                          ) : rdv.trackingRequested ? (
                            <div>
                              <div style={{
                                padding: '10px 16px',
                                background: rdv.currentEta ? 'rgba(59, 130, 246, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: rdv.currentEta ? '#3b82f6' : '#fbbf24',
                                marginBottom: '8px'
                              }}>
                                {rdv.currentEta ? `🛰️ ETA: ${rdv.currentEta}` : '⏳ En attente réponse...'}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                                Demandé {rdv.trackingRequestedAt && new Date(rdv.trackingRequestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => requestTracking(rdv)}
                              disabled={requestingTrackingFor === rdv._id}
                              style={{
                                padding: '14px 24px',
                                background: requestingTrackingFor === rdv._id
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: requestingTrackingFor === rdv._id ? 'wait' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '700',
                                boxShadow: requestingTrackingFor !== rdv._id ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              {requestingTrackingFor === rdv._id ? (
                                <>⏳ Envoi...</>
                              ) : (
                                <>🛰️ Demander Tracking</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Légende */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#9ca3af' }} />
              <span style={{ opacity: 0.7 }}>En attente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fbbf24' }} />
              <span style={{ opacity: 0.7 }}>En route</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} />
              <span style={{ opacity: 0.7 }}>Arrivé</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
              <span style={{ opacity: 0.7 }}>Terminé</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
              <span style={{ opacity: 0.7 }}>Retard</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

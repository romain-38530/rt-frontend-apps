/**
 * Page Planning - Module Planning Chargement & Livraison
 *
 * Vue Transporteur:
 * - Réservation de créneaux de chargement/livraison
 * - Visualisation des RDV confirmés
 * - Borne virtuelle chauffeur (check-in/check-out)
 * - Historique des opérations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { isAuthenticated } from '../lib/auth';
import { planningApi } from '../lib/api';

// Dynamic imports for components that need client-side only rendering
const SlotPicker = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.SlotPicker),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div> }
);

const DriverKiosk = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.DriverKiosk),
  { ssr: false }
);

// Types
interface Reservation {
  id: string;
  confirmationCode: string;
  date: string;
  startTime: string;
  endTime: string;
  siteName: string;
  siteAddress: string;
  dockName: string;
  type: 'loading' | 'unloading';
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  cargo: {
    palletCount: number;
    description?: string;
    orderRef?: string;
  };
  driver: {
    name: string;
    phone?: string;
  };
  vehicle: {
    plate: string;
    trailerPlate?: string;
  };
}

interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId: string;
  dockName: string;
  siteId: string;
  siteName: string;
  capacity: {
    maxPallets: number;
    maxWeight: number;
    remainingPallets: number;
    remainingWeight: number;
  };
  type: 'loading' | 'unloading' | 'both';
}

type TabType = 'reservations' | 'book' | 'kiosk' | 'history';

// Generate mock available slots
const generateMockSlots = (): AvailableSlot[] => {
  const slots: AvailableSlot[] = [];
  const today = new Date();
  const sites = [
    { id: 'site-1', name: 'Entrepôt Paris Nord', docks: ['Quai A1', 'Quai A2', 'Quai B1'] },
    { id: 'site-2', name: 'Plateforme Lyon Est', docks: ['Quai 1', 'Quai 2'] },
    { id: 'site-3', name: 'Hub Marseille Fos', docks: ['Quai Maritime 1', 'Quai Routier 1'] },
  ];

  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    sites.forEach(site => {
      site.docks.forEach((dockName, dockIndex) => {
        const hours = ['08:00', '10:00', '12:00', '14:00', '16:00'];
        hours.forEach((startTime, i) => {
          if (Math.random() > 0.4) {
            const maxPallets = 33;
            const remainingPallets = Math.floor(Math.random() * maxPallets) + 5;
            slots.push({
              id: `slot-${site.id}-${dockIndex}-${dateStr}-${i}`,
              date: dateStr,
              startTime,
              endTime: hours[i + 1] || '18:00',
              dockId: `dock-${site.id}-${dockIndex}`,
              dockName,
              siteId: site.id,
              siteName: site.name,
              capacity: {
                maxPallets,
                maxWeight: 25000,
                remainingPallets,
                remainingWeight: 25000 - (maxPallets - remainingPallets) * 800,
              },
              type: dockName.includes('Maritime') ? 'unloading' : 'both',
            });
          }
        });
      });
    });
  }

  return slots;
};

// Mock reservations
const mockReservations: Reservation[] = [
  {
    id: 'res-1',
    confirmationCode: 'RDV-2024-001',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    siteName: 'Entrepôt Paris Nord',
    siteAddress: '123 Rue de la Logistique, 93200 Saint-Denis',
    dockName: 'Quai A1',
    type: 'unloading',
    status: 'confirmed',
    cargo: { palletCount: 22, description: 'Marchandises diverses', orderRef: 'CMD-2024-1234' },
    driver: { name: 'Jean Martin', phone: '+33 6 12 34 56 78' },
    vehicle: { plate: 'AB-123-CD', trailerPlate: 'EF-456-GH' },
  },
  {
    id: 'res-2',
    confirmationCode: 'RDV-2024-002',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    siteName: 'Plateforme Lyon Est',
    siteAddress: '45 Avenue Industrielle, 69800 Saint-Priest',
    dockName: 'Quai 2',
    type: 'loading',
    status: 'confirmed',
    cargo: { palletCount: 18, orderRef: 'CMD-2024-1235' },
    driver: { name: 'Pierre Durand', phone: '+33 6 98 76 54 32' },
    vehicle: { plate: 'CD-789-EF' },
  },
  {
    id: 'res-3',
    confirmationCode: 'RDV-2024-003',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    siteName: 'Entrepôt Paris Nord',
    siteAddress: '123 Rue de la Logistique, 93200 Saint-Denis',
    dockName: 'Quai B1',
    type: 'unloading',
    status: 'completed',
    cargo: { palletCount: 30, orderRef: 'CMD-2024-1230' },
    driver: { name: 'Marc Bernard', phone: '+33 6 11 22 33 44' },
    vehicle: { plate: 'GH-012-IJ', trailerPlate: 'KL-345-MN' },
  },
];

export default function PlanningPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          planningApi.getAvailableSlots({}),
          planningApi.getMyBookings()
        ]);

        if (slotsRes.data && slotsRes.data.length > 0) {
          // Transform API data to component format
          const apiSlots = slotsRes.data.map((slot: any) => ({
            id: slot._id || slot.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            dockId: slot.dockId,
            dockName: slot.dockName || `Quai ${slot.dockId}`,
            siteId: slot.siteId,
            siteName: slot.siteName || 'Site',
            capacity: slot.capacity || { maxPallets: 33, maxWeight: 25000, remainingPallets: 33, remainingWeight: 25000 },
            type: slot.type || 'both'
          }));
          setAvailableSlots(apiSlots);
        } else {
          console.log('API unavailable, using mock data');
          setAvailableSlots(generateMockSlots());
        }

        if (bookingsRes.data && bookingsRes.data.length > 0) {
          const apiReservations = bookingsRes.data.map((booking: any) => ({
            id: booking._id || booking.id,
            confirmationCode: booking.confirmationCode || `RDV-${booking.id?.slice(-6).toUpperCase()}`,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            siteName: booking.siteName || 'Site',
            siteAddress: booking.siteAddress || '',
            dockName: booking.dockName || `Quai ${booking.dockId}`,
            type: booking.type || 'loading',
            status: booking.status || 'confirmed',
            cargo: booking.cargo || { palletCount: 0 },
            driver: booking.driver || { name: '' },
            vehicle: booking.vehicle || { plate: '' }
          }));
          setReservations(apiReservations);
        }
      } catch (error) {
        console.log('API error, using mock data:', error);
        setAvailableSlots(generateMockSlots());
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSlotSelect = useCallback((slot: AvailableSlot | null) => {
    setSelectedSlotId(slot?.id || null);
  }, []);

  const handleSlotConfirm = useCallback((slot: AvailableSlot, bookingData: any) => {
    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      confirmationCode: `RDV-${new Date().getFullYear()}-${String(reservations.length + 1).padStart(3, '0')}`,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      siteName: slot.siteName,
      siteAddress: '',
      dockName: slot.dockName,
      type: slot.type === 'loading' ? 'loading' : 'unloading',
      status: 'pending',
      cargo: {
        palletCount: bookingData.palletCount,
        orderRef: bookingData.orderRef,
      },
      driver: {
        name: bookingData.driverName,
        phone: bookingData.driverPhone,
      },
      vehicle: {
        plate: bookingData.vehiclePlate,
        trailerPlate: bookingData.trailerPlate,
      },
    };

    setReservations(prev => [newReservation, ...prev]);
    setAvailableSlots(prev => prev.filter(s => s.id !== slot.id));
    setSelectedSlotId(null);
    setActiveTab('reservations');
    setSuccess(`Réservation ${newReservation.confirmationCode} créée avec succès! En attente de validation.`);
  }, [reservations.length]);

  const handleCancelReservation = useCallback(() => {
    if (!reservationToCancel) return;

    setReservations(prev => prev.map(res =>
      res.id === reservationToCancel.id ? { ...res, status: 'cancelled' as const } : res
    ));
    setShowCancelModal(false);
    setReservationToCancel(null);
    setSuccess('Réservation annulée');
  }, [reservationToCancel]);

  const handleKioskCheckIn = async (bookingId: string) => {
    setReservations(prev => prev.map(res =>
      res.id === bookingId ? { ...res, status: 'checked_in' as const } : res
    ));
    setSuccess('Check-in effectué avec succès!');
  };

  const handleKioskArriveAtDock = async (bookingId: string) => {
    setReservations(prev => prev.map(res =>
      res.id === bookingId ? { ...res, status: 'in_progress' as const } : res
    ));
  };

  const handleKioskStartLoading = async (bookingId: string) => {
    // Already in_progress, nothing to change
  };

  const handleKioskComplete = async (bookingId: string, signature: string, notes?: string) => {
    setReservations(prev => prev.map(res =>
      res.id === bookingId ? { ...res, status: 'completed' as const } : res
    ));
    setSelectedReservation(null);
    setSuccess('Opération terminée avec succès!');
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = reservations.filter(r => r.date >= today && r.status !== 'cancelled' && r.status !== 'completed');
    const todayRes = reservations.filter(r => r.date === today && r.status !== 'cancelled');
    const completed = reservations.filter(r => r.status === 'completed');
    const pending = reservations.filter(r => r.status === 'pending');

    return { upcoming: upcoming.length, today: todayRes.length, completed: completed.length, pending: pending.length };
  }, [reservations]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'reservations', label: 'Mes RDV', icon: '📅' },
    { key: 'book', label: 'Réserver', icon: '➕' },
    { key: 'kiosk', label: 'Borne Chauffeur', icon: '🚛' },
    { key: 'history', label: 'Historique', icon: '📜' },
  ];

  const getStatusBadge = (status: Reservation['status']) => {
    const configs: Record<Reservation['status'], { bg: string; color: string; label: string }> = {
      pending: { bg: '#fff3e0', color: '#e65100', label: 'En attente' },
      confirmed: { bg: '#e3f2fd', color: '#1565c0', label: 'Confirmé' },
      checked_in: { bg: '#e8f5e9', color: '#2e7d32', label: 'Arrivé' },
      in_progress: { bg: '#f3e5f5', color: '#7b1fa2', label: 'En cours' },
      completed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Terminé' },
      cancelled: { bg: '#ffebee', color: '#c62828', label: 'Annulé' },
    };
    const config = configs[status];
    return (
      <span style={{
        padding: '4px 12px',
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <div>Chargement du planning...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planning & RDV - Transporter | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#7b1fa2',
          color: '#fff',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ← Retour
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                📅 Planning & RDV
              </h1>
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
                Réservez vos créneaux de chargement/livraison
              </p>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
          }}>
            🚚 Transporter
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          padding: '20px 32px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1976d2' }}>{stats.upcoming}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>RDV à venir</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff9800' }}>{stats.today}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Aujourd'hui</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fce4ec', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#e91e63' }}>{stats.pending}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>En attente</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#4caf50' }}>{stats.completed}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Terminés</div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div style={{
            margin: '16px 32px',
            padding: '12px 16px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            color: '#2e7d32',
          }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <div style={{
            margin: '16px 32px',
            padding: '12px 16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            color: '#c62828',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 32px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === tab.key ? '#7b1fa2' : '#f5f5f5',
                color: activeTab === tab.key ? '#fff' : '#666',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px' }}>
          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontWeight: 600, fontSize: '18px' }}>
                  Mes réservations à venir
                </div>
                <button
                  onClick={() => setActiveTab('book')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#7b1fa2',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  + Nouvelle réservation
                </button>
              </div>

              {reservations.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                  <div>Aucune réservation à venir</div>
                  <button
                    onClick={() => setActiveTab('book')}
                    style={{
                      marginTop: '16px',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#7b1fa2',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Réserver un créneau
                  </button>
                </div>
              ) : (
                <div>
                  {reservations.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map(reservation => (
                    <div key={reservation.id} style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#7b1fa2' }}>
                              {reservation.confirmationCode}
                            </span>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <div style={{ fontWeight: 600 }}>{reservation.siteName}</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>{reservation.siteAddress}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>
                            {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                          <div style={{ color: '#7b1fa2', fontWeight: 600 }}>
                            {reservation.startTime} - {reservation.endTime}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#666',
                        padding: '12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                      }}>
                        <div>
                          <span style={{ opacity: 0.7 }}>Quai:</span> {reservation.dockName}
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Type:</span> {reservation.type === 'loading' ? 'Chargement' : 'Déchargement'}
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Palettes:</span> {reservation.cargo.palletCount}
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Véhicule:</span> {reservation.vehicle.plate}
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Chauffeur:</span> {reservation.driver.name}
                        </div>
                        {reservation.cargo.orderRef && (
                          <div>
                            <span style={{ opacity: 0.7 }}>Ref:</span> {reservation.cargo.orderRef}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {(reservation.status === 'confirmed' || reservation.status === 'checked_in' || reservation.status === 'in_progress') && (
                          <button
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setActiveTab('kiosk');
                            }}
                            style={{
                              padding: '10px 20px',
                              border: 'none',
                              borderRadius: '8px',
                              backgroundColor: '#4caf50',
                              color: '#fff',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            🚛 Accéder à la borne
                          </button>
                        )}
                        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setReservationToCancel(reservation);
                              setShowCancelModal(true);
                            }}
                            style={{
                              padding: '10px 20px',
                              border: '1px solid #f44336',
                              borderRadius: '8px',
                              backgroundColor: '#fff',
                              color: '#f44336',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Book Tab */}
          {activeTab === 'book' && (
            <SlotPicker
              availableSlots={availableSlots}
              selectedSlotId={selectedSlotId}
              onSlotSelect={handleSlotSelect}
              onConfirm={handleSlotConfirm}
              operationType="both"
            />
          )}

          {/* Kiosk Tab */}
          {activeTab === 'kiosk' && (
            <div>
              {selectedReservation ? (
                <DriverKiosk
                  mode="embedded"
                  booking={{
                    id: selectedReservation.id,
                    confirmationCode: selectedReservation.confirmationCode,
                    date: selectedReservation.date,
                    startTime: selectedReservation.startTime,
                    endTime: selectedReservation.endTime,
                    siteName: selectedReservation.siteName,
                    siteAddress: selectedReservation.siteAddress,
                    dockName: selectedReservation.dockName,
                    type: selectedReservation.type,
                    status: selectedReservation.status === 'confirmed' ? 'confirmed' :
                            selectedReservation.status === 'checked_in' ? 'checked_in' :
                            selectedReservation.status === 'in_progress' ? 'loading' : 'confirmed',
                    cargo: selectedReservation.cargo,
                    transporter: {
                      name: 'Mon entreprise',
                      vehiclePlate: selectedReservation.vehicle.plate,
                      trailerPlate: selectedReservation.vehicle.trailerPlate,
                    },
                    driver: selectedReservation.driver,
                    timestamps: {},
                  }}
                  onCheckIn={handleKioskCheckIn}
                  onArriveAtDock={handleKioskArriveAtDock}
                  onStartLoading={handleKioskStartLoading}
                  onComplete={handleKioskComplete}
                  geofenceEnabled={true}
                  geofenceRadius={300}
                  siteLocation={{ lat: 48.8566, lng: 2.3522 }}
                />
              ) : (
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  padding: '40px',
                  textAlign: 'center',
                  maxWidth: '500px',
                  margin: '0 auto',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚛</div>
                  <h2 style={{ margin: '0 0 12px', color: '#333' }}>Borne Chauffeur</h2>
                  <p style={{ color: '#666', marginBottom: '24px' }}>
                    Sélectionnez une réservation confirmée pour accéder à la borne de check-in
                  </p>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    style={{
                      padding: '14px 28px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: '#7b1fa2',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Voir mes réservations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: 600,
                fontSize: '18px',
              }}>
                Historique des opérations
              </div>

              {reservations.filter(r => r.status === 'completed' || r.status === 'cancelled').length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                  Aucun historique disponible
                </div>
              ) : (
                <div>
                  {reservations.filter(r => r.status === 'completed' || r.status === 'cancelled').map(reservation => (
                    <div key={reservation.id} style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{reservation.confirmationCode}</span>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {reservation.siteName} - {reservation.dockName}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '14px', color: '#666' }}>
                        <div>{new Date(reservation.date).toLocaleDateString('fr-FR')}</div>
                        <div>{reservation.cargo.palletCount} palettes</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && reservationToCancel && (
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
              <h3 style={{ margin: '0 0 16px' }}>Annuler la réservation?</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Êtes-vous sûr de vouloir annuler la réservation <strong>{reservationToCancel.confirmationCode}</strong> ?
                Cette action est irréversible.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setReservationToCancel(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Non, garder
                </button>
                <button
                  onClick={handleCancelReservation}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

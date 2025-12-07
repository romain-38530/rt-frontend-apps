/**
 * Page Planning - Module Planning Chargement & Livraison
 *
 * Vue Logisticien:
 * - Gestion des créneaux de chargement/livraison
 * - Validation des RDV transporteurs
 * - Suivi en temps réel des opérations
 * - Gestion des quais
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { isAuthenticated } from '../lib/auth';
import { planningApi } from '../lib/api';

// Dynamic imports for components that need client-side only rendering
const PlanningCalendar = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.PlanningCalendar),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement calendrier...</div> }
);

const GeofenceDetector = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.GeofenceDetector),
  { ssr: false }
);

// Types
interface PlanningSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId: string;
  dockName: string;
  siteId: string;
  siteName: string;
  status: 'available' | 'booked' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  booking?: {
    id: string;
    transporterName: string;
    transporterId: string;
    driverName?: string;
    driverPhone?: string;
    vehiclePlate?: string;
    orderRef?: string;
    cargoType?: string;
    palletCount?: number;
  };
  capacity?: {
    maxPallets: number;
    maxWeight: number;
  };
}

interface PlanningDock {
  id: string;
  name: string;
  siteId: string;
  type: 'loading' | 'unloading' | 'both';
  isActive: boolean;
}

interface BookingRequest {
  id: string;
  transporterName: string;
  requestedDate: string;
  requestedTime: string;
  palletCount: number;
  type: 'loading' | 'unloading';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type TabType = 'calendar' | 'requests' | 'docks' | 'tracking' | 'stats';

// Mock data
const mockDocks: PlanningDock[] = [
  { id: 'dock-1', name: 'Quai A1', siteId: 'site-1', type: 'both', isActive: true },
  { id: 'dock-2', name: 'Quai A2', siteId: 'site-1', type: 'loading', isActive: true },
  { id: 'dock-3', name: 'Quai B1', siteId: 'site-1', type: 'unloading', isActive: true },
  { id: 'dock-4', name: 'Quai B2', siteId: 'site-1', type: 'both', isActive: false },
];

const generateMockSlots = (): PlanningSlot[] => {
  const slots: PlanningSlot[] = [];
  const today = new Date();

  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    mockDocks.filter(d => d.isActive).forEach(dock => {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      hours.forEach((startTime, i) => {
        const endTime = hours[i + 1] || '20:00';
        const random = Math.random();

        let status: PlanningSlot['status'] = 'available';
        let booking: PlanningSlot['booking'] | undefined;

        if (random > 0.6) {
          status = random > 0.9 ? 'in_progress' : random > 0.8 ? 'completed' : 'booked';
          booking = {
            id: `booking-${dock.id}-${dateStr}-${i}`,
            transporterName: ['Transport Dupont', 'Logistique Martin', 'Express Freight', 'TransEurope'][Math.floor(Math.random() * 4)],
            transporterId: `trans-${Math.floor(Math.random() * 100)}`,
            driverName: ['Jean Martin', 'Pierre Durand', 'Marc Bernard'][Math.floor(Math.random() * 3)],
            vehiclePlate: `AB-${Math.floor(Math.random() * 900) + 100}-CD`,
            palletCount: Math.floor(Math.random() * 30) + 5,
          };
        }

        slots.push({
          id: `slot-${dock.id}-${dateStr}-${i}`,
          date: dateStr,
          startTime,
          endTime,
          dockId: dock.id,
          dockName: dock.name,
          siteId: 'site-1',
          siteName: 'Entrepôt Principal',
          status,
          booking,
          capacity: { maxPallets: 33, maxWeight: 25000 },
        });
      });
    });
  }

  return slots;
};

const mockBookingRequests: BookingRequest[] = [
  { id: 'req-1', transporterName: 'Transport Dupont', requestedDate: new Date().toISOString().split('T')[0], requestedTime: '09:00', palletCount: 20, type: 'unloading', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'req-2', transporterName: 'Logistique Martin', requestedDate: new Date().toISOString().split('T')[0], requestedTime: '14:00', palletCount: 15, type: 'loading', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'req-3', transporterName: 'Express Freight', requestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], requestedTime: '10:00', palletCount: 28, type: 'unloading', status: 'pending', createdAt: new Date(Date.now() - 10800000).toISOString() },
];

export default function PlanningPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [docks, setDocks] = useState<PlanningDock[]>(mockDocks);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(mockBookingRequests);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'dock' | 'transporter'>('dock');
  const [selectedSlot, setSelectedSlot] = useState<PlanningSlot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const today = new Date().toISOString().split('T')[0];
        const slotsRes = await planningApi.getAllSlots(today);

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
            siteName: slot.siteName || 'Site principal',
            status: slot.status,
            booking: slot.booking,
            capacity: slot.capacity
          }));
          setSlots(apiSlots);
        } else {
          // Fallback to mock data
          console.log('API unavailable, using mock data');
          setSlots(generateMockSlots());
        }
      } catch (error) {
        console.log('API error, using mock data:', error);
        setSlots(generateMockSlots());
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

  const handleSlotClick = useCallback((slot: PlanningSlot) => {
    setSelectedSlot(slot);
    setShowSlotModal(true);
  }, []);

  const handleApproveRequest = useCallback((requestId: string) => {
    setBookingRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    ));
    setSuccess('Demande approuvée avec succès');
  }, []);

  const handleRejectRequest = useCallback((requestId: string) => {
    setBookingRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    ));
    setSuccess('Demande rejetée');
  }, []);

  const handleToggleDock = useCallback(async (dockId: string) => {
    try {
      const dock = docks.find(d => d.id === dockId);
      if (!dock) return;

      const newStatus = dock.isActive ? 'closed' : 'available';
      await planningApi.updateDockStatus(dock.siteId, dockId, newStatus);

      setDocks(prev => prev.map(d =>
        d.id === dockId ? { ...d, isActive: !d.isActive } : d
      ));
      setSuccess(dock.isActive ? 'Quai fermé' : 'Quai ouvert');
    } catch (err) {
      console.error('Error toggling dock:', err);
      // Fallback to local update
      setDocks(prev => prev.map(dock =>
        dock.id === dockId ? { ...dock, isActive: !dock.isActive } : dock
      ));
    }
  }, [docks]);

  const handleBlockSlot = useCallback(async (slotId: string) => {
    try {
      await planningApi.blockSlot(slotId, 'Bloqué par le logisticien');
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, status: 'blocked' as const } : slot
      ));
      setSuccess('Créneau bloqué');
    } catch (err) {
      console.error('Error blocking slot:', err);
      // Fallback to local update
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, status: 'blocked' as const } : slot
      ));
      setSuccess('Créneau bloqué (local)');
    }
    setShowSlotModal(false);
  }, []);

  const handleUnblockSlot = useCallback(async (slotId: string) => {
    try {
      await planningApi.unblockSlot(slotId);
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, status: 'available' as const } : slot
      ));
      setSuccess('Créneau débloqué');
    } catch (err) {
      console.error('Error unblocking slot:', err);
      // Fallback to local update
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, status: 'available' as const } : slot
      ));
      setSuccess('Créneau débloqué (local)');
    }
    setShowSlotModal(false);
  }, []);

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySlots = slots.filter(s => s.date === today);
    const bookedToday = todaySlots.filter(s => s.status === 'booked' || s.status === 'in_progress').length;
    const completedToday = todaySlots.filter(s => s.status === 'completed').length;
    const availableToday = todaySlots.filter(s => s.status === 'available').length;
    const pendingRequests = bookingRequests.filter(r => r.status === 'pending').length;

    return { bookedToday, completedToday, availableToday, pendingRequests };
  }, [slots, bookingRequests]);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'calendar', label: 'Calendrier', icon: '📅' },
    { key: 'requests', label: `Demandes (${stats.pendingRequests})`, icon: '📋' },
    { key: 'docks', label: 'Quais', icon: '🚛' },
    { key: 'tracking', label: 'Suivi temps réel', icon: '📍' },
    { key: 'stats', label: 'Statistiques', icon: '📊' },
  ];

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
        <title>Planning Chargement & Livraison - Logistician | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#1976d2',
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
                📅 Planning Chargement & Livraison
              </h1>
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
                Gestion des créneaux et validation des RDV transporteurs
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
            📊 Logistician
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '20px 32px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1976d2' }}>{stats.bookedToday}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>RDV aujourd'hui</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#4caf50' }}>{stats.completedToday}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Terminés</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff9800' }}>{stats.availableToday}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Créneaux libres</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fce4ec', borderRadius: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#e91e63' }}>{stats.pendingRequests}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Demandes en attente</div>
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
                backgroundColor: activeTab === tab.key ? '#1976d2' : '#f5f5f5',
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
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <PlanningCalendar
              slots={slots}
              docks={docks}
              view={calendarView}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onViewChange={setCalendarView}
              onSlotClick={handleSlotClick}
            />
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
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
                Demandes de réservation en attente
              </div>

              {bookingRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  Aucune demande en attente
                </div>
              ) : (
                <div>
                  {bookingRequests.filter(r => r.status === 'pending').map(request => (
                    <div key={request.id} style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '20px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                          {request.transporterName}
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
                          <span>📅 {new Date(request.requestedDate).toLocaleDateString('fr-FR')}</span>
                          <span>🕐 {request.requestedTime}</span>
                          <span>📦 {request.palletCount} palettes</span>
                          <span>{request.type === 'loading' ? '🔼 Chargement' : '🔽 Déchargement'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
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
                          Refuser
                        </button>
                        <button
                          onClick={() => handleApproveRequest(request.id)}
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
                          Approuver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Docks Tab */}
          {activeTab === 'docks' && (
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
                  Gestion des quais
                </div>
                <button style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}>
                  + Ajouter un quai
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '20px' }}>
                {docks.map(dock => (
                  <div key={dock.id} style={{
                    padding: '20px',
                    border: `2px solid ${dock.isActive ? '#4caf50' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    backgroundColor: dock.isActive ? '#f8fff8' : '#fafafa',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '18px' }}>{dock.name}</div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          {dock.type === 'loading' ? '🔼 Chargement uniquement' :
                           dock.type === 'unloading' ? '🔽 Déchargement uniquement' : '↕️ Chargement & Déchargement'}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: dock.isActive ? '#e8f5e9' : '#ffebee',
                        color: dock.isActive ? '#2e7d32' : '#c62828',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        {dock.isActive ? 'Actif' : 'Inactif'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => handleToggleDock(dock.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: `1px solid ${dock.isActive ? '#f44336' : '#4caf50'}`,
                          borderRadius: '6px',
                          backgroundColor: '#fff',
                          color: dock.isActive ? '#f44336' : '#4caf50',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        {dock.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button style={{
                        padding: '10px 16px',
                        border: '1px solid #1976d2',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        color: '#1976d2',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}>
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '20px',
              }}>
                <h3 style={{ margin: '0 0 20px' }}>🚛 Véhicules en approche</h3>

                {slots.filter(s => s.status === 'booked' && s.date === new Date().toISOString().split('T')[0]).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Aucun véhicule attendu actuellement
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {slots.filter(s => s.status === 'booked' && s.date === new Date().toISOString().split('T')[0]).slice(0, 5).map(slot => (
                      <div key={slot.id} style={{
                        padding: '16px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{slot.booking?.transporterName}</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {slot.startTime} - {slot.dockName}
                          </div>
                          {slot.booking?.vehiclePlate && (
                            <div style={{ fontSize: '13px', color: '#1976d2', marginTop: '4px' }}>
                              🚗 {slot.booking.vehiclePlate}
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}>
                          En route
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <GeofenceDetector
                zones={[
                  { id: 'site-1', name: 'Entrepôt Principal', lat: 48.8566, lng: 2.3522, radius: 500, type: 'site' },
                  { id: 'parking-1', name: 'Parking Poids Lourds', lat: 48.8570, lng: 2.3530, radius: 100, type: 'parking' },
                ]}
                onEnter={(event: { zone: { id: string; name: string }; timestamp: Date }) => console.log('Entrée:', event)}
                onExit={(event: { zone: { id: string; name: string }; timestamp: Date }) => console.log('Sortie:', event)}
                enabled={true}
                showUI={true}
              />
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '24px',
            }}>
              <h3 style={{ margin: '0 0 24px' }}>📊 Statistiques de la semaine</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total RDV cette semaine</div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#1976d2' }}>47</div>
                  <div style={{ fontSize: '13px', color: '#4caf50', marginTop: '8px' }}>↑ +12% vs semaine dernière</div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Taux d'occupation moyen</div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#ff9800' }}>73%</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>Objectif: 80%</div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Temps d'attente moyen</div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#4caf50' }}>18 min</div>
                  <div style={{ fontSize: '13px', color: '#4caf50', marginTop: '8px' }}>↓ -5 min vs objectif</div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Palettes traitées</div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#9c27b0' }}>1,284</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>Sur 1,500 prévues</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slot Detail Modal */}
        {showSlotModal && selectedSlot && (
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Détails du créneau</h3>
                  <div style={{ color: '#666', marginTop: '4px' }}>
                    {selectedSlot.dockName} • {selectedSlot.date}
                  </div>
                </div>
                <button
                  onClick={() => setShowSlotModal(false)}
                  style={{
                    padding: '8px',
                    border: 'none',
                    borderRadius: '50%',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '10px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Horaire</div>
                    <div style={{ fontWeight: 600 }}>{selectedSlot.startTime} - {selectedSlot.endTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Statut</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedSlot.status}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Capacité max</div>
                    <div style={{ fontWeight: 600 }}>{selectedSlot.capacity?.maxPallets} palettes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Poids max</div>
                    <div style={{ fontWeight: 600 }}>{selectedSlot.capacity?.maxWeight} kg</div>
                  </div>
                </div>
              </div>

              {selectedSlot.booking && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px' }}>Réservation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div>🏢 {selectedSlot.booking.transporterName}</div>
                    {selectedSlot.booking.driverName && <div>👤 {selectedSlot.booking.driverName}</div>}
                    {selectedSlot.booking.vehiclePlate && <div>🚗 {selectedSlot.booking.vehiclePlate}</div>}
                    {selectedSlot.booking.palletCount && <div>📦 {selectedSlot.booking.palletCount} palettes</div>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedSlot.status === 'available' && (
                  <button
                    onClick={() => handleBlockSlot(selectedSlot.id)}
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
                    Bloquer ce créneau
                  </button>
                )}
                {selectedSlot.status === 'blocked' && (
                  <button
                    onClick={() => handleUnblockSlot(selectedSlot.id)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Débloquer ce créneau
                  </button>
                )}
                <button
                  onClick={() => setShowSlotModal(false)}
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
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

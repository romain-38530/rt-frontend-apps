import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { planningApi } from '../lib/api';

interface Site {
  id: string;
  name: string;
  address: string;
  docks: Dock[];
  timeSlotDuration: 15 | 30 | 60;
  operatingHours: { start: string; end: string };
  holidays: string[];
}

interface Dock {
  id: string;
  name: string;
  type: 'loading' | 'unloading' | 'both';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
}

interface TimeSlot {
  id: string;
  dockId: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'blocked';
  booking?: {
    carrierId: string;
    carrierName: string;
    orderId: string;
  };
}

export default function PlanningPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'docks' | 'slots'>('overview');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showDockModal, setShowDockModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSites: 3,
    totalDocks: 12,
    todayBookings: 28,
    availableSlots: 45,
    occupancyRate: 62
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les sites depuis l'API
      const data = await planningApi.getSites();

      if (data.data && data.data.length > 0) {
        // Transformer les donnees API pour inclure les docks
        const sitesWithDocks = await Promise.all(
          data.data.map(async (site: any) => {
            try {
              const docksData = await planningApi.getDocks(site._id || site.id);
              return {
                ...site,
                id: site._id || site.id,
                docks: docksData.data || []
              };
            } catch {
              return { ...site, id: site._id || site.id, docks: [] };
            }
          })
        );
        setSites(sitesWithDocks);
        setSelectedSite(sitesWithDocks[0]);

        // Update stats
        const totalDocks = sitesWithDocks.reduce((acc: number, s: Site) => acc + s.docks.length, 0);
        setStats(prev => ({
          ...prev,
          totalSites: sitesWithDocks.length,
          totalDocks
        }));
      } else {
        // Fallback to mock data
        setSites(mockSites);
        setSelectedSite(mockSites[0]);
      }
    } catch (error) {
      console.log('API unavailable, using mock data');
      setSites(mockSites);
      setSelectedSite(mockSites[0]);
    }
    setLoading(false);
  };

  // Mock data
  const mockSites: Site[] = [
    {
      id: 'SITE-001',
      name: 'Entrepot Paris Nord',
      address: '123 Rue de la Logistique, 93200 Saint-Denis',
      timeSlotDuration: 30,
      operatingHours: { start: '06:00', end: '22:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-001', name: 'Quai A1', type: 'loading', capacity: 2, status: 'available' },
        { id: 'DOCK-002', name: 'Quai A2', type: 'loading', capacity: 2, status: 'occupied' },
        { id: 'DOCK-003', name: 'Quai B1', type: 'unloading', capacity: 3, status: 'available' },
        { id: 'DOCK-004', name: 'Quai B2', type: 'unloading', capacity: 3, status: 'maintenance' },
        { id: 'DOCK-005', name: 'Quai C1', type: 'both', capacity: 4, status: 'available' }
      ]
    },
    {
      id: 'SITE-002',
      name: 'Plateforme Lyon Est',
      address: '45 Avenue Industrielle, 69800 Saint-Priest',
      timeSlotDuration: 60,
      operatingHours: { start: '07:00', end: '20:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-006', name: 'Quai 1', type: 'both', capacity: 5, status: 'available' },
        { id: 'DOCK-007', name: 'Quai 2', type: 'both', capacity: 5, status: 'occupied' },
        { id: 'DOCK-008', name: 'Quai 3', type: 'loading', capacity: 3, status: 'available' }
      ]
    },
    {
      id: 'SITE-003',
      name: 'Hub Marseille Fos',
      address: '78 Port de Fos, 13270 Fos-sur-Mer',
      timeSlotDuration: 30,
      operatingHours: { start: '05:00', end: '23:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-009', name: 'Quai Maritime 1', type: 'unloading', capacity: 10, status: 'available' },
        { id: 'DOCK-010', name: 'Quai Maritime 2', type: 'unloading', capacity: 10, status: 'occupied' },
        { id: 'DOCK-011', name: 'Quai Routier 1', type: 'loading', capacity: 4, status: 'available' },
        { id: 'DOCK-012', name: 'Quai Routier 2', type: 'both', capacity: 4, status: 'available' }
      ]
    }
  ];

  const generateTimeSlots = (site: Site): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const { start, end } = site.operatingHours;
    const duration = site.timeSlotDuration;

    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    site.docks.forEach(dock => {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += duration) {
          const slotStart = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const endMin = min + duration;
          const slotEnd = endMin >= 60
            ? `${(hour + 1).toString().padStart(2, '0')}:${(endMin - 60).toString().padStart(2, '0')}`
            : `${hour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

          slots.push({
            id: `SLOT-${dock.id}-${slotStart}`,
            dockId: dock.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: Math.random() > 0.7 ? 'booked' : 'available',
            booking: Math.random() > 0.7 ? {
              carrierId: 'CARR-001',
              carrierName: 'Transport Express',
              orderId: 'ORD-2024-001'
            } : undefined
          });
        }
      }
    });

    return slots;
  };

  useEffect(() => {
    if (selectedSite) {
      setTimeSlots(generateTimeSlots(selectedSite));
    }
  }, [selectedSite, selectedDate]);

  const getDockStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#00D084';
      case 'occupied': return '#FF6B6B';
      case 'maintenance': return '#FFB800';
      default: return '#666';
    }
  };

  const getDockTypeLabel = (type: string) => {
    switch (type) {
      case 'loading': return 'Chargement';
      case 'unloading': return 'Dechargement';
      case 'both': return 'Mixte';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planning Quais - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📅</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Planning Quais</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/rdv-transporteurs')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              RDV Transporteurs
            </button>
            <button
              onClick={() => router.push('/borne-chauffeur')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Borne Chauffeur
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'Sites', value: stats.totalSites, icon: '🏭', color: '#667eea' },
              { label: 'Quais', value: stats.totalDocks, icon: '🚚', color: '#00D084' },
              { label: 'RDV Aujourd\'hui', value: stats.todayBookings, icon: '📅', color: '#FFB800' },
              { label: 'Creneaux libres', value: stats.availableSlots, icon: '✅', color: '#00D084' },
              { label: 'Taux occupation', value: `${stats.occupancyRate}%`, icon: '📊', color: '#764ba2' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[
              { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { key: 'sites', label: 'Sites', icon: '🏭' },
              { key: 'docks', label: 'Quais', icon: '🚚' },
              { key: 'slots', label: 'Creneaux', icon: '📅' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: activeTab === tab.key ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Site Selector */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Selection du site</h3>
              <button
                onClick={() => setShowSiteModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0,208,132,0.3)',
                  color: '#00D084',
                  border: '1px solid #00D084',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                + Ajouter site
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  style={{
                    padding: '16px 24px',
                    background: selectedSite?.id === site.id
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: selectedSite?.id === site.id ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '250px'
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>{site.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{site.docks.length} quais - Creneaux {site.timeSlotDuration}min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content based on active tab */}
          {activeTab === 'overview' && selectedSite && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Site Info */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                  Informations site
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Nom</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Adresse</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.address}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Horaires</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.operatingHours.start} - {selectedSite.operatingHours.end}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Duree creneaux</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.timeSlotDuration} minutes</div>
                  </div>
                </div>
              </div>

              {/* Docks Overview */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Quais</h3>
                  <button
                    onClick={() => setShowDockModal(true)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(0,208,132,0.3)',
                      color: '#00D084',
                      border: '1px solid #00D084',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    + Ajouter
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedSite.docks.map(dock => (
                    <div key={dock.id} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{dock.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>{getDockTypeLabel(dock.type)} - Capacite: {dock.capacity}</div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background: `${getDockStatusColor(dock.status)}20`,
                        color: getDockStatusColor(dock.status),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {dock.status === 'available' ? 'Disponible' : dock.status === 'occupied' ? 'Occupe' : 'Maintenance'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slots' && selectedSite && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Creneaux du {selectedDate}</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Time slots grid */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: '800px' }}>
                  {/* Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '120px repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ padding: '8px', fontWeight: '600', fontSize: '13px' }}>Quai</div>
                    {['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                      <div key={time} style={{ padding: '8px', fontWeight: '600', fontSize: '12px', textAlign: 'center' }}>{time}</div>
                    ))}
                  </div>

                  {/* Dock rows */}
                  {selectedSite.docks.map(dock => (
                    <div key={dock.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '120px repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        padding: '12px 8px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {dock.name}
                      </div>
                      {['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => {
                        const isBooked = Math.random() > 0.6;
                        return (
                          <div
                            key={`${dock.id}-${time}`}
                            style={{
                              padding: '12px 8px',
                              background: isBooked ? 'rgba(255,107,107,0.3)' : 'rgba(0,208,132,0.3)',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: isBooked ? '1px solid #FF6B6B' : '1px solid #00D084',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {isBooked ? 'Reserve' : 'Libre'}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(0,208,132,0.3)', border: '1px solid #00D084', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Disponible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(255,107,107,0.3)', border: '1px solid #FF6B6B', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Reserve</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(255,184,0,0.3)', border: '1px solid #FFB800', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Bloque</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sites' && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Gestion des sites</h3>
                <button
                  onClick={() => setShowSiteModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  + Nouveau site
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {sites.map(site => (
                  <div key={site.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontWeight: '700' }}>{site.name}</h4>
                      <span style={{
                        padding: '4px 12px',
                        background: 'rgba(0,208,132,0.3)',
                        color: '#00D084',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Actif
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px' }}>{site.address}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <span style={{ opacity: 0.7 }}>Quais:</span> {site.docks.length}
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Creneaux:</span> {site.timeSlotDuration}min
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Ouverture:</span> {site.operatingHours.start}
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Fermeture:</span> {site.operatingHours.end}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(102,126,234,0.3)',
                        color: '#667eea',
                        border: '1px solid #667eea',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        Modifier
                      </button>
                      <button style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(255,107,107,0.3)',
                        color: '#FF6B6B',
                        border: '1px solid #FF6B6B',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'docks' && selectedSite && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Quais de {selectedSite.name}</h3>
                <button
                  onClick={() => setShowDockModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  + Nouveau quai
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Capacite</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSite.docks.map(dock => (
                    <tr key={dock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>{dock.name}</td>
                      <td style={{ padding: '16px 12px' }}>{getDockTypeLabel(dock.type)}</td>
                      <td style={{ padding: '16px 12px' }}>{dock.capacity} camions</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getDockStatusColor(dock.status)}20`,
                          color: getDockStatusColor(dock.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {dock.status === 'available' ? 'Disponible' : dock.status === 'occupied' ? 'Occupe' : 'Maintenance'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{
                            padding: '6px 12px',
                            background: 'rgba(102,126,234,0.3)',
                            color: '#667eea',
                            border: '1px solid #667eea',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            Modifier
                          </button>
                          <button style={{
                            padding: '6px 12px',
                            background: 'rgba(255,184,0,0.3)',
                            color: '#FFB800',
                            border: '1px solid #FFB800',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            Maintenance
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

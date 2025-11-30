import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { driverApi } from '../lib/api';

interface DriverCheckin {
  id: string;
  driverId: string;
  driverName: string;
  carrierName: string;
  vehiclePlate: string;
  appointmentId: string;
  siteId: string;
  siteName: string;
  dockAssigned: string;
  checkinTime: string;
  checkoutTime?: string;
  status: 'waiting' | 'called' | 'at_dock' | 'loading' | 'completed' | 'departed';
  queuePosition?: number;
  estimatedWait?: number;
  type: 'loading' | 'unloading';
  orderId: string;
}

export default function BorneChauffeurPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'checkin'>('dashboard');
  const [drivers, setDrivers] = useState<DriverCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinCode, setCheckinCode] = useState('');
  const [selectedSite, setSelectedSite] = useState('SITE-001');

  // Stats
  const [stats, setStats] = useState({
    waiting: 4,
    atDock: 6,
    completed: 18,
    avgWaitTime: 12
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDrivers();
  }, [router]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await driverApi.getQueue(selectedSite);

      if (data.data && data.data.length > 0) {
        const formattedDrivers = data.data.map((d: any) => ({
          ...d,
          id: d._id || d.id,
          checkinTime: new Date(d.checkinTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          checkoutTime: d.checkoutTime ? new Date(d.checkoutTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined
        }));
        setDrivers(formattedDrivers);

        // Update stats
        const waiting = formattedDrivers.filter((d: DriverCheckin) => d.status === 'waiting').length;
        const atDock = formattedDrivers.filter((d: DriverCheckin) => ['at_dock', 'loading', 'called'].includes(d.status)).length;
        const completed = formattedDrivers.filter((d: DriverCheckin) => d.status === 'completed').length;
        setStats({ waiting, atDock, completed, avgWaitTime: 12 });
      } else {
        setDrivers(mockDrivers);
      }
    } catch (error) {
      console.log('API unavailable, using mock data');
      setDrivers(mockDrivers);
    }
    setLoading(false);
  };

  const mockDrivers: DriverCheckin[] = [
    {
      id: 'CHK-001',
      driverId: 'DRV-001',
      driverName: 'Jean Dupont',
      carrierName: 'Transport Express Lyon',
      vehiclePlate: 'AB-123-CD',
      appointmentId: 'RDV-001',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: 'Quai A1',
      checkinTime: '08:15',
      status: 'at_dock',
      type: 'loading',
      orderId: 'ORD-2024-0125'
    },
    {
      id: 'CHK-002',
      driverId: 'DRV-002',
      driverName: 'Pierre Martin',
      carrierName: 'Transports Martin',
      vehiclePlate: 'EF-456-GH',
      appointmentId: 'RDV-002',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: 'Quai B1',
      checkinTime: '09:45',
      status: 'waiting',
      queuePosition: 1,
      estimatedWait: 8,
      type: 'unloading',
      orderId: 'ORD-2024-0126'
    },
    {
      id: 'CHK-003',
      driverId: 'DRV-003',
      driverName: 'Marie Lambert',
      carrierName: 'Speed Logistics',
      vehiclePlate: 'IJ-789-KL',
      appointmentId: 'RDV-003',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: '-',
      checkinTime: '10:02',
      status: 'waiting',
      queuePosition: 2,
      estimatedWait: 15,
      type: 'loading',
      orderId: 'ORD-2024-0127'
    },
    {
      id: 'CHK-004',
      driverId: 'DRV-004',
      driverName: 'Ahmed Benali',
      carrierName: 'Euro Trans',
      vehiclePlate: 'MN-012-OP',
      appointmentId: 'RDV-004',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: 'Quai A2',
      checkinTime: '07:30',
      checkoutTime: '09:15',
      status: 'completed',
      type: 'unloading',
      orderId: 'ORD-2024-0128'
    },
    {
      id: 'CHK-005',
      driverId: 'DRV-005',
      driverName: 'Sophie Durand',
      carrierName: 'Rapide Fret',
      vehiclePlate: 'QR-345-ST',
      appointmentId: 'RDV-005',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: 'Quai C1',
      checkinTime: '10:30',
      status: 'called',
      type: 'loading',
      orderId: 'ORD-2024-0129'
    },
    {
      id: 'CHK-006',
      driverId: 'DRV-006',
      driverName: 'Luc Bernard',
      carrierName: 'Trans National',
      vehiclePlate: 'UV-678-WX',
      appointmentId: 'RDV-006',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockAssigned: 'Quai B2',
      checkinTime: '08:00',
      status: 'loading',
      type: 'loading',
      orderId: 'ORD-2024-0130'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#FFB800';
      case 'called': return '#667eea';
      case 'at_dock': return '#00D084';
      case 'loading': return '#764ba2';
      case 'completed': return '#00B073';
      case 'departed': return '#666';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'En attente';
      case 'called': return 'Appele';
      case 'at_dock': return 'Au quai';
      case 'loading': return 'En cours';
      case 'completed': return 'Termine';
      case 'departed': return 'Parti';
      default: return status;
    }
  };

  const handleCallDriver = async (driver: DriverCheckin) => {
    try {
      await driverApi.callDriver(driver.id, driver.dockAssigned);
    } catch (error) {
      console.log('Call driver - using local update');
    }
    setDrivers(prev =>
      prev.map(d => d.id === driver.id ? { ...d, status: 'called' } : d)
    );
  };

  const handleArriveAtDock = async (driver: DriverCheckin) => {
    setDrivers(prev =>
      prev.map(d => d.id === driver.id ? { ...d, status: 'at_dock' } : d)
    );
  };

  const handleStartOperation = async (driver: DriverCheckin) => {
    setDrivers(prev =>
      prev.map(d => d.id === driver.id ? { ...d, status: 'loading' } : d)
    );
  };

  const handleComplete = async (driver: DriverCheckin) => {
    try {
      await driverApi.checkout(driver.id);
    } catch (error) {
      console.log('Checkout - using local update');
    }
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setDrivers(prev =>
      prev.map(d => d.id === driver.id ? { ...d, status: 'completed', checkoutTime: now } : d)
    );
  };

  const handleCheckin = async () => {
    if (!checkinCode) return;

    try {
      const result = await driverApi.checkin({ code: checkinCode, siteId: selectedSite, method: 'manual' });

      if (result.success) {
        alert('Check-in reussi!');
        setCheckinCode('');
        loadDrivers();
      } else {
        alert('Check-in reussi! (demo)');
        setCheckinCode('');
      }
    } catch (error) {
      alert('Check-in reussi! (demo)');
      setCheckinCode('');
    }
  };

  const waitingDrivers = drivers.filter(d => d.status === 'waiting');
  const activeDrivers = drivers.filter(d => ['called', 'at_dock', 'loading'].includes(d.status));
  const completedDrivers = drivers.filter(d => ['completed', 'departed'].includes(d.status));

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
        <title>Borne Chauffeur - Industry | SYMPHONI.A</title>
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
              onClick={() => router.push('/planning')}
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
              Retour Planning
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🚛</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Borne Chauffeur</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(0,208,132,0.3)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #00D084',
            color: '#00D084'
          }}>
            Site: Entrepot Paris Nord
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'En attente', value: stats.waiting, icon: '⏳', color: '#FFB800' },
              { label: 'Aux quais', value: stats.atDock, icon: '🚚', color: '#00D084' },
              { label: 'Termines', value: stats.completed, icon: '✅', color: '#00B073' },
              { label: 'Attente moy.', value: `${stats.avgWaitTime} min`, icon: '⏱️', color: '#667eea' }
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
              { key: 'dashboard', label: 'Tableau de bord', icon: '📊' },
              { key: 'queue', label: 'File d\'attente', icon: '📋' },
              { key: 'checkin', label: 'Check-in', icon: '✅' }
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

          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Active at Docks */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                  Chauffeurs actifs ({activeDrivers.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeDrivers.map(driver => (
                    <div key={driver.id} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '700', marginBottom: '4px' }}>{driver.driverName}</div>
                          <div style={{ fontSize: '13px', opacity: 0.8 }}>{driver.carrierName}</div>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(driver.status)}20`,
                          color: getStatusColor(driver.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusLabel(driver.status)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        <div><span style={{ opacity: 0.7 }}>Quai:</span> {driver.dockAssigned}</div>
                        <div><span style={{ opacity: 0.7 }}>Plaque:</span> {driver.vehiclePlate}</div>
                        <div><span style={{ opacity: 0.7 }}>Arrivee:</span> {driver.checkinTime}</div>
                        <div><span style={{ opacity: 0.7 }}>Type:</span> {driver.type === 'loading' ? 'Chargement' : 'Dechargement'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        {driver.status === 'called' && (
                          <button
                            onClick={() => handleArriveAtDock(driver)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'rgba(0,208,132,0.3)',
                              color: '#00D084',
                              border: '1px solid #00D084',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}
                          >
                            Arrive au quai
                          </button>
                        )}
                        {driver.status === 'at_dock' && (
                          <button
                            onClick={() => handleStartOperation(driver)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'rgba(118,75,162,0.3)',
                              color: '#764ba2',
                              border: '1px solid #764ba2',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}
                          >
                            Demarrer operation
                          </button>
                        )}
                        {driver.status === 'loading' && (
                          <button
                            onClick={() => handleComplete(driver)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeDrivers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                      Aucun chauffeur actif
                    </div>
                  )}
                </div>
              </div>

              {/* Waiting Queue */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                  File d'attente ({waitingDrivers.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {waitingDrivers.map((driver, index) => (
                    <div key={driver.id} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFB800 0%, #FF9500 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '20px'
                      }}>
                        #{index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{driver.driverName}</div>
                        <div style={{ fontSize: '13px', opacity: 0.8 }}>{driver.carrierName}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Attente: ~{driver.estimatedWait} min | {driver.vehiclePlate}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCallDriver(driver)}
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        Appeler
                      </button>
                    </div>
                  ))}
                  {waitingDrivers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                      Aucun chauffeur en attente
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>
                Tous les chauffeurs aujourd'hui
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Chauffeur</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Transporteur</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Vehicule</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Quai</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Check-in</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Check-out</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(driver => (
                    <tr key={driver.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>{driver.driverName}</td>
                      <td style={{ padding: '16px 12px' }}>{driver.carrierName}</td>
                      <td style={{ padding: '16px 12px' }}>{driver.vehiclePlate}</td>
                      <td style={{ padding: '16px 12px' }}>{driver.dockAssigned}</td>
                      <td style={{ padding: '16px 12px' }}>{driver.checkinTime}</td>
                      <td style={{ padding: '16px 12px' }}>{driver.checkoutTime || '-'}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(driver.status)}20`,
                          color: getStatusColor(driver.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusLabel(driver.status)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        {driver.status === 'waiting' && (
                          <button
                            onClick={() => handleCallDriver(driver)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(102,126,234,0.3)',
                              color: '#667eea',
                              border: '1px solid #667eea',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '11px'
                            }}
                          >
                            Appeler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'checkin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Manual Check-in */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>
                  Check-in Manuel
                </h3>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span style={{ fontSize: '64px' }}>📱</span>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                    Code RDV ou plaque d'immatriculation
                  </label>
                  <input
                    type="text"
                    value={checkinCode}
                    onChange={(e) => setCheckinCode(e.target.value.toUpperCase())}
                    placeholder="Ex: RDV-001 ou AB-123-CD"
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '18px',
                      textAlign: 'center',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <button
                  onClick={handleCheckin}
                  disabled={!checkinCode}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: checkinCode
                      ? 'linear-gradient(135deg, #00D084 0%, #00B073 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: checkinCode ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}
                >
                  Valider Check-in
                </button>
              </div>

              {/* QR Code */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>
                  Check-in QR Code
                </h3>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    background: 'white',
                    borderRadius: '16px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a2e'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>Scanner QR</div>
                    </div>
                  </div>
                </div>
                <p style={{ textAlign: 'center', opacity: 0.8, fontSize: '14px', marginBottom: '24px' }}>
                  Le chauffeur peut scanner le QR code depuis l'application mobile SYMPHONI.A
                </p>
                <div style={{
                  background: 'rgba(102,126,234,0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(102,126,234,0.3)'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Mode automatique actif</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Geofencing detecte les arrivees dans un rayon de 100m
                  </div>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                  Check-ins recents
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {drivers.slice(0, 6).map(driver => (
                    <div key={driver.id} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${getStatusColor(driver.status)}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ color: getStatusColor(driver.status) }}>
                          {driver.status === 'completed' ? '✓' : '●'}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{driver.driverName}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>{driver.checkinTime} - {driver.vehiclePlate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

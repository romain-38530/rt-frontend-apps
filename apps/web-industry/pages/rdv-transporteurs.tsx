import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

interface Appointment {
  id: string;
  orderId: string;
  carrierId: string;
  carrierName: string;
  siteId: string;
  siteName: string;
  dockId: string;
  dockName: string;
  date: string;
  timeSlot: string;
  type: 'loading' | 'unloading';
  status: 'requested' | 'proposed' | 'confirmed' | 'refused' | 'completed' | 'cancelled';
  vehicleType: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  estimatedDuration: number;
  notes: string;
  createdAt: string;
}

export default function RdvTransporteursPage() {
  const router = useSafeRouter();
  const apiUrl = process.env.NEXT_PUBLIC_PLANNING_API_URL || 'https://dpw23bg2dclr1.cloudfront.net';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'today'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 5,
    confirmed: 12,
    today: 8,
    refused: 2
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadAppointments();
  }, [router]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/rdv/list`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data || mockAppointments);
      } else {
        setAppointments(mockAppointments);
      }
    } catch (error) {
      console.log('Using mock data');
      setAppointments(mockAppointments);
    }
    setLoading(false);
  };

  const mockAppointments: Appointment[] = [
    {
      id: 'RDV-001',
      orderId: 'ORD-2024-0125',
      carrierId: 'CARR-001',
      carrierName: 'Transport Express Lyon',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockId: 'DOCK-001',
      dockName: 'Quai A1',
      date: '2024-11-30',
      timeSlot: '08:00 - 09:00',
      type: 'loading',
      status: 'confirmed',
      vehicleType: 'Semi-remorque',
      vehiclePlate: 'AB-123-CD',
      driverName: 'Jean Dupont',
      driverPhone: '06 12 34 56 78',
      estimatedDuration: 60,
      notes: 'Livraison urgente - 15 palettes',
      createdAt: '2024-11-28T10:30:00Z'
    },
    {
      id: 'RDV-002',
      orderId: 'ORD-2024-0126',
      carrierId: 'CARR-002',
      carrierName: 'Transports Martin',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockId: 'DOCK-003',
      dockName: 'Quai B1',
      date: '2024-11-30',
      timeSlot: '10:00 - 11:30',
      type: 'unloading',
      status: 'requested',
      vehicleType: 'Porteur 19T',
      vehiclePlate: 'EF-456-GH',
      driverName: 'Pierre Martin',
      driverPhone: '06 98 76 54 32',
      estimatedDuration: 90,
      notes: 'Dechargement materiel fragile',
      createdAt: '2024-11-29T08:15:00Z'
    },
    {
      id: 'RDV-003',
      orderId: 'ORD-2024-0127',
      carrierId: 'CARR-003',
      carrierName: 'Speed Logistics',
      siteId: 'SITE-002',
      siteName: 'Plateforme Lyon Est',
      dockId: 'DOCK-006',
      dockName: 'Quai 1',
      date: '2024-11-30',
      timeSlot: '14:00 - 15:00',
      type: 'loading',
      status: 'proposed',
      vehicleType: 'Camion frigorifique',
      vehiclePlate: 'IJ-789-KL',
      driverName: 'Marc Durand',
      driverPhone: '06 11 22 33 44',
      estimatedDuration: 60,
      notes: 'Produits frais - respect chaine froid',
      createdAt: '2024-11-29T14:00:00Z'
    },
    {
      id: 'RDV-004',
      orderId: 'ORD-2024-0128',
      carrierId: 'CARR-004',
      carrierName: 'Euro Trans',
      siteId: 'SITE-003',
      siteName: 'Hub Marseille Fos',
      dockId: 'DOCK-009',
      dockName: 'Quai Maritime 1',
      date: '2024-12-01',
      timeSlot: '06:00 - 08:00',
      type: 'unloading',
      status: 'confirmed',
      vehicleType: 'Container 40"',
      vehiclePlate: 'MN-012-OP',
      driverName: 'Ahmed Benali',
      driverPhone: '06 55 66 77 88',
      estimatedDuration: 120,
      notes: 'Conteneur import - douanes OK',
      createdAt: '2024-11-27T16:45:00Z'
    },
    {
      id: 'RDV-005',
      orderId: 'ORD-2024-0129',
      carrierId: 'CARR-005',
      carrierName: 'Rapide Fret',
      siteId: 'SITE-001',
      siteName: 'Entrepot Paris Nord',
      dockId: 'DOCK-002',
      dockName: 'Quai A2',
      date: '2024-11-30',
      timeSlot: '16:00 - 17:00',
      type: 'loading',
      status: 'refused',
      vehicleType: 'Fourgon',
      vehiclePlate: 'QR-345-ST',
      driverName: 'Sophie Lambert',
      driverPhone: '06 99 88 77 66',
      estimatedDuration: 45,
      notes: 'Creneau non disponible',
      createdAt: '2024-11-29T09:30:00Z'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#00D084';
      case 'requested': return '#FFB800';
      case 'proposed': return '#667eea';
      case 'refused': return '#FF6B6B';
      case 'completed': return '#00B073';
      case 'cancelled': return '#666';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirme';
      case 'requested': return 'Demande';
      case 'proposed': return 'Propose';
      case 'refused': return 'Refuse';
      case 'completed': return 'Termine';
      case 'cancelled': return 'Annule';
      default: return status;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['requested', 'proposed'].includes(apt.status);
    if (filter === 'confirmed') return apt.status === 'confirmed';
    if (filter === 'today') return apt.date === new Date().toISOString().split('T')[0];
    return true;
  });

  const handleConfirm = async (appointment: Appointment) => {
    try {
      await fetch(`${apiUrl}/api/v1/rdv/${appointment.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'confirmed' } : apt
        )
      );
    } catch (error) {
      // Mock update
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'confirmed' } : apt
        )
      );
    }
  };

  const handleRefuse = async (appointment: Appointment) => {
    try {
      await fetch(`${apiUrl}/api/v1/rdv/${appointment.id}/refuse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'refused' } : apt
        )
      );
    } catch (error) {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'refused' } : apt
        )
      );
    }
  };

  const handlePropose = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowProposeModal(true);
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
        <title>RDV Transporteurs - Industry | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>📋</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>RDV Transporteurs</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowModal(true)}
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
              + Nouveau RDV
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'En attente', value: stats.pending, icon: '⏳', color: '#FFB800' },
              { label: 'Confirmes', value: stats.confirmed, icon: '✅', color: '#00D084' },
              { label: 'Aujourd\'hui', value: stats.today, icon: '📅', color: '#667eea' },
              { label: 'Refuses', value: stats.refused, icon: '❌', color: '#FF6B6B' }
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

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[
              { key: 'all', label: 'Tous' },
              { key: 'pending', label: 'En attente' },
              { key: 'confirmed', label: 'Confirmes' },
              { key: 'today', label: 'Aujourd\'hui' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                style={{
                  padding: '10px 20px',
                  background: filter === f.key
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: filter === f.key ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Appointments List */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>
              Liste des rendez-vous ({filteredAppointments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredAppointments.map(apt => (
                <div key={apt.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>{apt.carrierName}</span>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(apt.status)}20`,
                          color: getStatusColor(apt.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusLabel(apt.status)}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: apt.type === 'loading' ? 'rgba(102,126,234,0.3)' : 'rgba(118,75,162,0.3)',
                          color: apt.type === 'loading' ? '#667eea' : '#764ba2',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {apt.type === 'loading' ? 'Chargement' : 'Dechargement'}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        Commande: {apt.orderId}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#667eea' }}>{apt.date}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>{apt.timeSlot}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Site</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{apt.siteName}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{apt.dockName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Vehicule</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{apt.vehicleType}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{apt.vehiclePlate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Chauffeur</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{apt.driverName}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{apt.driverPhone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Duree estimee</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{apt.estimatedDuration} min</div>
                    </div>
                  </div>

                  {apt.notes && (
                    <div style={{
                      background: 'rgba(255,184,0,0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px',
                      marginBottom: '16px',
                      borderLeft: '3px solid #FFB800'
                    }}>
                      <strong>Note:</strong> {apt.notes}
                    </div>
                  )}

                  {/* Actions */}
                  {(apt.status === 'requested' || apt.status === 'proposed') && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handlePropose(apt)}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(102,126,234,0.3)',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        Proposer autre creneau
                      </button>
                      <button
                        onClick={() => handleRefuse(apt)}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(255,107,107,0.3)',
                          color: '#FF6B6B',
                          border: '1px solid #FF6B6B',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => handleConfirm(apt)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        Confirmer
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  opacity: 0.7
                }}>
                  Aucun rendez-vous trouve pour ce filtre
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Propose Modal */}
        {showProposeModal && selectedAppointment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700' }}>
                Proposer un autre creneau
              </h3>
              <p style={{ opacity: 0.8, marginBottom: '24px' }}>
                RDV pour <strong>{selectedAppointment.carrierName}</strong>
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Nouvelle date
                </label>
                <input
                  type="date"
                  defaultValue={selectedAppointment.date}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Nouveau creneau
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="06:00-07:00">06:00 - 07:00</option>
                  <option value="07:00-08:00">07:00 - 08:00</option>
                  <option value="09:00-10:00">09:00 - 10:00</option>
                  <option value="11:00-12:00">11:00 - 12:00</option>
                  <option value="14:00-15:00">14:00 - 15:00</option>
                  <option value="15:00-16:00">15:00 - 16:00</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Message (optionnel)
                </label>
                <textarea
                  placeholder="Raison du changement..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowProposeModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowProposeModal(false);
                    setAppointments(prev =>
                      prev.map(apt =>
                        apt.id === selectedAppointment.id ? { ...apt, status: 'proposed' } : apt
                      )
                    );
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  Envoyer proposition
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

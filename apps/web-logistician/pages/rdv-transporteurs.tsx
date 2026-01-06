import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, getToken } from '../lib/auth';

interface RdvRequest {
  _id: string;
  rdvId: string;
  orderRef: string;
  industrialName: string;
  industrialId: string;
  transporterName: string;
  transporterId: string;
  operationType: 'pickup' | 'delivery';
  requestedDate: string;
  requestedTimeSlot: string;
  confirmedDate?: string;
  confirmedTime?: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  sitePostalCode: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
  estimatedPallets?: number;
  estimatedWeight?: number;
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled' | 'no_show';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'rejected';
type ModalMode = 'view' | 'confirm' | 'reject' | null;

export default function RdvTransporteursPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rdvRequests, setRdvRequests] = useState<RdvRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedRdv, setSelectedRdv] = useState<RdvRequest | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    setUser(getUser());
    loadRdvRequests();
  }, []);

  const loadRdvRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/rdv/delegated`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRdvRequests(data.rdvs || []);
      } else {
        // Mock data for development
        setRdvRequests([
          {
            _id: '1',
            rdvId: 'RDV-2024-001',
            orderRef: 'CMD-2024-1234',
            industrialName: 'Usines Renault',
            industrialId: 'IND001',
            transporterName: 'Transports Martin',
            transporterId: 'TRP001',
            operationType: 'pickup',
            requestedDate: '2024-12-20',
            requestedTimeSlot: '08:00 - 12:00',
            siteName: 'Entrepot Paris Nord',
            siteAddress: '123 Rue de la Logistique',
            siteCity: 'Roissy-en-France',
            sitePostalCode: '95700',
            vehicleType: 'Semi-remorque',
            driverName: 'Jean Dupont',
            driverPhone: '+33 6 12 34 56 78',
            licensePlate: 'AB-123-CD',
            estimatedPallets: 24,
            estimatedWeight: 12000,
            specialInstructions: 'Quai 3 - Merci de respecter les horaires',
            status: 'pending',
            createdAt: '2024-12-15T10:00:00Z',
            updatedAt: '2024-12-15T10:00:00Z'
          },
          {
            _id: '2',
            rdvId: 'RDV-2024-002',
            orderRef: 'CMD-2024-1235',
            industrialName: 'Michelin SA',
            industrialId: 'IND002',
            transporterName: 'Express Fret',
            transporterId: 'TRP002',
            operationType: 'delivery',
            requestedDate: '2024-12-21',
            requestedTimeSlot: '14:00 - 18:00',
            confirmedDate: '2024-12-21',
            confirmedTime: '15:00',
            siteName: 'Hub Lyon',
            siteAddress: '45 Avenue du Transport',
            siteCity: 'Saint-Priest',
            sitePostalCode: '69800',
            vehicleType: 'Porteur',
            estimatedPallets: 12,
            estimatedWeight: 6000,
            status: 'confirmed',
            createdAt: '2024-12-14T08:30:00Z',
            updatedAt: '2024-12-16T14:00:00Z'
          },
          {
            _id: '3',
            rdvId: 'RDV-2024-003',
            orderRef: 'CMD-2024-1236',
            industrialName: 'PSA Group',
            industrialId: 'IND003',
            transporterName: 'Logistique Sud',
            transporterId: 'TRP003',
            operationType: 'pickup',
            requestedDate: '2024-12-19',
            requestedTimeSlot: '06:00 - 10:00',
            confirmedDate: '2024-12-19',
            confirmedTime: '07:30',
            siteName: 'Plateforme Marseille',
            siteAddress: '78 Boulevard Maritime',
            siteCity: 'Marseille',
            sitePostalCode: '13002',
            vehicleType: 'Semi-remorque',
            driverName: 'Pierre Martin',
            licensePlate: 'EF-456-GH',
            estimatedPallets: 33,
            estimatedWeight: 18000,
            status: 'completed',
            createdAt: '2024-12-12T11:00:00Z',
            updatedAt: '2024-12-19T08:45:00Z'
          },
          {
            _id: '4',
            rdvId: 'RDV-2024-004',
            orderRef: 'CMD-2024-1237',
            industrialName: 'Airbus Industries',
            industrialId: 'IND004',
            transporterName: 'Fast Delivery',
            transporterId: 'TRP004',
            operationType: 'pickup',
            requestedDate: '2024-12-22',
            requestedTimeSlot: '10:00 - 14:00',
            siteName: 'Entrepot Paris Nord',
            siteAddress: '123 Rue de la Logistique',
            siteCity: 'Roissy-en-France',
            sitePostalCode: '95700',
            vehicleType: 'Camionnette',
            estimatedPallets: 4,
            estimatedWeight: 800,
            status: 'pending',
            createdAt: '2024-12-17T16:00:00Z',
            updatedAt: '2024-12-17T16:00:00Z'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load RDV requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRdv = async () => {
    if (!selectedRdv || !confirmDate || !confirmTime) return;
    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/rdv/${selectedRdv._id}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmedDate: confirmDate,
          confirmedTime: confirmTime
        })
      });

      if (response.ok) {
        setSuccessMessage('RDV confirme avec succes');
        setModalMode(null);
        setSelectedRdv(null);
        loadRdvRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to confirm RDV:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectRdv = async () => {
    if (!selectedRdv) return;
    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/rdv/${selectedRdv._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason
        })
      });

      if (response.ok) {
        setSuccessMessage('RDV refuse');
        setModalMode(null);
        setSelectedRdv(null);
        setRejectionReason('');
        loadRdvRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to reject RDV:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (rdv: RdvRequest) => {
    try {
      const token = getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/rdv/${rdv._id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccessMessage('RDV marque comme termine');
      loadRdvRequests();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark RDV as complete:', err);
    }
  };

  const openConfirmModal = (rdv: RdvRequest) => {
    setSelectedRdv(rdv);
    setConfirmDate(rdv.requestedDate);
    setConfirmTime('');
    setModalMode('confirm');
  };

  const openRejectModal = (rdv: RdvRequest) => {
    setSelectedRdv(rdv);
    setRejectionReason('');
    setModalMode('reject');
  };

  const openViewModal = (rdv: RdvRequest) => {
    setSelectedRdv(rdv);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRdv(null);
    setConfirmDate('');
    setConfirmTime('');
    setRejectionReason('');
  };

  const filteredRdvs = rdvRequests.filter(rdv => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return rdv.status === 'pending';
    if (filterStatus === 'confirmed') return rdv.status === 'confirmed';
    if (filterStatus === 'completed') return ['completed', 'no_show'].includes(rdv.status);
    if (filterStatus === 'rejected') return ['rejected', 'cancelled'].includes(rdv.status);
    return true;
  });

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif'
  };

  const headerStyles: React.CSSProperties = {
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  };

  const cardStyles: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '24px',
    marginBottom: '20px',
    transition: 'all 0.3s ease'
  };

  const buttonPrimaryStyles: React.CSSProperties = {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: {
        background: 'rgba(255, 193, 7, 0.2)',
        color: '#ffc107',
        border: '1px solid rgba(255, 193, 7, 0.3)'
      },
      confirmed: {
        background: 'rgba(40, 167, 69, 0.2)',
        color: '#28a745',
        border: '1px solid rgba(40, 167, 69, 0.3)'
      },
      completed: {
        background: 'rgba(0, 123, 255, 0.2)',
        color: '#007bff',
        border: '1px solid rgba(0, 123, 255, 0.3)'
      },
      rejected: {
        background: 'rgba(220, 53, 69, 0.2)',
        color: '#dc3545',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      },
      cancelled: {
        background: 'rgba(108, 117, 125, 0.2)',
        color: '#6c757d',
        border: '1px solid rgba(108, 117, 125, 0.3)'
      },
      no_show: {
        background: 'rgba(220, 53, 69, 0.2)',
        color: '#dc3545',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      }
    };

    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      confirmed: '✅ Confirme',
      completed: '🏁 Termine',
      rejected: '❌ Refuse',
      cancelled: '🚫 Annule',
      no_show: '⚠️ No-show'
    };

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        ...styles[status]
      }}>
        {labels[status] || status}
      </span>
    );
  };

  const getOperationBadge = (type: string) => {
    const isPickup = type === 'pickup';
    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        background: isPickup ? 'rgba(0, 123, 255, 0.2)' : 'rgba(40, 167, 69, 0.2)',
        color: isPickup ? '#007bff' : '#28a745',
        border: `1px solid ${isPickup ? 'rgba(0, 123, 255, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
      }}>
        {isPickup ? '📥 Chargement' : '📤 Livraison'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        ...containerStyles,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <p>Chargement des demandes de RDV...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>RDV Transporteurs - SYMPHONI.A Logistician</title>
      </Head>

      <div style={containerStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Retour
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                📅 RDV Transporteurs
              </h1>
              <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0 0' }}>
                Gerez les demandes de rendez-vous des transporteurs
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '8px 16px',
              background: rdvRequests.filter(r => r.status === 'pending').length > 0
                ? 'rgba(255, 193, 7, 0.2)'
                : 'rgba(40, 167, 69, 0.2)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              color: rdvRequests.filter(r => r.status === 'pending').length > 0
                ? '#ffc107'
                : '#28a745'
            }}>
              {rdvRequests.filter(r => r.status === 'pending').length} en attente
            </span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            margin: '20px 40px 0',
            padding: '16px 24px',
            background: 'rgba(40, 167, 69, 0.2)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            borderRadius: '12px',
            color: '#28a745',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div style={{ padding: '40px' }}>
          {/* Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {[
              { icon: '📅', label: 'Total RDV', value: rdvRequests.length, color: '#667eea' },
              { icon: '⏳', label: 'En attente', value: rdvRequests.filter(r => r.status === 'pending').length, color: '#ffc107' },
              { icon: '✅', label: 'Confirmes', value: rdvRequests.filter(r => r.status === 'confirmed').length, color: '#28a745' },
              { icon: '🏁', label: 'Termines', value: rdvRequests.filter(r => r.status === 'completed').length, color: '#007bff' },
              { icon: '❌', label: 'Refuses', value: rdvRequests.filter(r => ['rejected', 'cancelled'].includes(r.status)).length, color: '#dc3545' }
            ].map((stat, i) => (
              <div key={i} style={{
                ...cardStyles,
                textAlign: 'center',
                padding: '20px',
                borderLeft: `4px solid ${stat.color}`
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all' as FilterStatus, label: 'Tous' },
              { id: 'pending' as FilterStatus, label: '⏳ En attente' },
              { id: 'confirmed' as FilterStatus, label: '✅ Confirmes' },
              { id: 'completed' as FilterStatus, label: '🏁 Termines' },
              { id: 'rejected' as FilterStatus, label: '❌ Refuses' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                style={{
                  padding: '10px 20px',
                  background: filterStatus === filter.id ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${filterStatus === filter.id ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: filterStatus === filter.id ? '700' : '500'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* RDV List */}
          {filteredRdvs.length === 0 ? (
            <div style={{
              ...cardStyles,
              textAlign: 'center',
              padding: '60px 40px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Aucune demande de RDV</h3>
              <p style={{ opacity: 0.7 }}>
                Les demandes de RDV des transporteurs apparaitront ici
              </p>
            </div>
          ) : (
            filteredRdvs.map((rdv) => (
              <div
                key={rdv._id}
                style={{
                  ...cardStyles,
                  cursor: 'pointer',
                  borderLeft: `4px solid ${rdv.status === 'pending' ? '#ffc107' : rdv.status === 'confirmed' ? '#28a745' : rdv.status === 'completed' ? '#007bff' : '#dc3545'}`
                }}
                onClick={() => openViewModal(rdv)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  {/* Left - Main Info */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                        {rdv.rdvId}
                      </h3>
                      {getStatusBadge(rdv.status)}
                      {getOperationBadge(rdv.operationType)}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                      <strong>Commande:</strong> {rdv.orderRef} | <strong>Industriel:</strong> {rdv.industrialName}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>
                      <strong>Transporteur:</strong> {rdv.transporterName}
                      {rdv.driverName && <> | <strong>Chauffeur:</strong> {rdv.driverName}</>}
                      {rdv.licensePlate && <> | <strong>Immat:</strong> {rdv.licensePlate}</>}
                    </div>
                  </div>

                  {/* Middle - Site & Date */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Site</div>
                    <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                      📍 {rdv.siteName}<br/>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>{rdv.siteCity}</span>
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Date demandee</div>
                    <div style={{ fontSize: '14px' }}>
                      📆 {new Date(rdv.requestedDate).toLocaleDateString('fr-FR')}
                      <br/>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>🕐 {rdv.requestedTimeSlot}</span>
                    </div>
                    {rdv.confirmedDate && rdv.confirmedTime && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: 'rgba(40, 167, 69, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#28a745'
                      }}>
                        ✅ Confirme: {new Date(rdv.confirmedDate).toLocaleDateString('fr-FR')} a {rdv.confirmedTime}
                      </div>
                    )}
                  </div>

                  {/* Right - Actions */}
                  <div style={{ textAlign: 'right', minWidth: '180px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                      {rdv.estimatedPallets && `${rdv.estimatedPallets} palettes`}
                      {rdv.estimatedWeight && ` | ${(rdv.estimatedWeight / 1000).toFixed(1)}t`}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '12px' }}>
                      🚛 {rdv.vehicleType}
                    </div>

                    {rdv.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal(rdv);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(40, 167, 69, 0.2)',
                            border: '1px solid rgba(40, 167, 69, 0.3)',
                            borderRadius: '8px',
                            color: '#28a745',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ✅ Confirmer
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectModal(rdv);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(220, 53, 69, 0.2)',
                            border: '1px solid rgba(220, 53, 69, 0.3)',
                            borderRadius: '8px',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ❌ Refuser
                        </button>
                      </div>
                    )}

                    {rdv.status === 'confirmed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(rdv);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(0, 123, 255, 0.2)',
                          border: '1px solid rgba(0, 123, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#007bff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        🏁 Marquer termine
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Modal */}
        {modalMode === 'view' && selectedRdv && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={closeModal}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '32px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                    {selectedRdv.rdvId}
                  </h2>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    {getStatusBadge(selectedRdv.status)}
                    {getOperationBadge(selectedRdv.operationType)}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Commande</h4>
                  <p style={{ fontSize: '16px', margin: 0 }}>{selectedRdv.orderRef}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Industriel</h4>
                  <p style={{ fontSize: '16px', margin: 0 }}>{selectedRdv.industrialName}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Transporteur</h4>
                  <p style={{ fontSize: '16px', margin: 0 }}>{selectedRdv.transporterName}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Vehicule</h4>
                  <p style={{ fontSize: '16px', margin: 0 }}>{selectedRdv.vehicleType}</p>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px'
              }}>
                <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '12px' }}>Site</h4>
                <p style={{ fontSize: '16px', margin: 0, fontWeight: '600' }}>{selectedRdv.siteName}</p>
                <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>
                  {selectedRdv.siteAddress}, {selectedRdv.sitePostalCode} {selectedRdv.siteCity}
                </p>
              </div>

              <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 193, 7, 0.2)'
                }}>
                  <h4 style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Date demandee</h4>
                  <p style={{ fontSize: '16px', margin: 0, fontWeight: '600' }}>
                    {new Date(selectedRdv.requestedDate).toLocaleDateString('fr-FR')}
                  </p>
                  <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>
                    {selectedRdv.requestedTimeSlot}
                  </p>
                </div>
                {selectedRdv.confirmedDate && selectedRdv.confirmedTime && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(40, 167, 69, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(40, 167, 69, 0.2)'
                  }}>
                    <h4 style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Date confirmee</h4>
                    <p style={{ fontSize: '16px', margin: 0, fontWeight: '600', color: '#28a745' }}>
                      {new Date(selectedRdv.confirmedDate).toLocaleDateString('fr-FR')}
                    </p>
                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>
                      {selectedRdv.confirmedTime}
                    </p>
                  </div>
                )}
              </div>

              {(selectedRdv.driverName || selectedRdv.driverPhone || selectedRdv.licensePlate) && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px'
                }}>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '12px' }}>Chauffeur</h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {selectedRdv.driverName && (
                      <div>
                        <span style={{ opacity: 0.6, fontSize: '12px' }}>Nom:</span>
                        <span style={{ marginLeft: '8px' }}>{selectedRdv.driverName}</span>
                      </div>
                    )}
                    {selectedRdv.driverPhone && (
                      <div>
                        <span style={{ opacity: 0.6, fontSize: '12px' }}>Tel:</span>
                        <span style={{ marginLeft: '8px' }}>{selectedRdv.driverPhone}</span>
                      </div>
                    )}
                    {selectedRdv.licensePlate && (
                      <div>
                        <span style={{ opacity: 0.6, fontSize: '12px' }}>Immat:</span>
                        <span style={{ marginLeft: '8px' }}>{selectedRdv.licensePlate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {selectedRdv.estimatedPallets && (
                  <div>
                    <span style={{ opacity: 0.6, fontSize: '12px' }}>Palettes:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '600' }}>{selectedRdv.estimatedPallets}</span>
                  </div>
                )}
                {selectedRdv.estimatedWeight && (
                  <div>
                    <span style={{ opacity: 0.6, fontSize: '12px' }}>Poids:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '600' }}>{(selectedRdv.estimatedWeight / 1000).toFixed(1)} tonnes</span>
                  </div>
                )}
              </div>

              {selectedRdv.specialInstructions && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <h4 style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Instructions speciales</h4>
                  <p style={{ fontSize: '14px', margin: 0 }}>{selectedRdv.specialInstructions}</p>
                </div>
              )}

              {selectedRdv.status === 'pending' && (
                <div style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      closeModal();
                      openRejectModal(selectedRdv);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(220, 53, 69, 0.2)',
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      borderRadius: '10px',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ❌ Refuser
                  </button>
                  <button
                    onClick={() => {
                      closeModal();
                      openConfirmModal(selectedRdv);
                    }}
                    style={buttonPrimaryStyles}
                  >
                    ✅ Confirmer le RDV
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {modalMode === 'confirm' && selectedRdv && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={closeModal}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: '100%',
                maxWidth: '500px',
                padding: '32px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>
                ✅ Confirmer le RDV
              </h2>
              <p style={{ opacity: 0.8, marginBottom: '24px' }}>
                Confirmez le rendez-vous <strong>{selectedRdv.rdvId}</strong> pour <strong>{selectedRdv.transporterName}</strong>
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                  Date confirmee *
                </label>
                <input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                  Heure confirmee *
                </label>
                <input
                  type="time"
                  value={confirmTime}
                  onChange={(e) => setConfirmTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', opacity: 0.6, margin: '8px 0 0 0' }}>
                  Creneau demande: {selectedRdv.requestedTimeSlot}
                </p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmRdv}
                  disabled={saving || !confirmDate || !confirmTime}
                  style={{
                    ...buttonPrimaryStyles,
                    opacity: saving || !confirmDate || !confirmTime ? 0.7 : 1
                  }}
                >
                  {saving ? '⏳ Confirmation...' : '✅ Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {modalMode === 'reject' && selectedRdv && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={closeModal}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: '100%',
                maxWidth: '500px',
                padding: '32px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#dc3545' }}>
                ❌ Refuser le RDV
              </h2>
              <p style={{ opacity: 0.8, marginBottom: '24px' }}>
                Refuser le rendez-vous <strong>{selectedRdv.rdvId}</strong> pour <strong>{selectedRdv.transporterName}</strong>
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                  Motif du refus (optionnel)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Ex: Quai indisponible, creneau complet..."
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectRdv}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(220, 53, 69, 0.3)',
                    border: '1px solid rgba(220, 53, 69, 0.5)',
                    borderRadius: '10px',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? '⏳ Refus...' : '❌ Refuser'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

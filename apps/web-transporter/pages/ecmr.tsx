import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser } from '../lib/auth';
import { ecmrApi } from '../lib/api';

// Types
interface EcmrDocument {
  ecmrId: string;
  orderId: string;
  status: 'draft' | 'pending_shipper' | 'pending_carrier' | 'in_transit' | 'pending_consignee' | 'completed' | 'disputed' | 'cancelled';
  shipper: {
    name: string;
    address?: string;
    signedAt?: string;
    signedBy?: string;
  };
  carrier: {
    name: string;
    carrierId?: string;
    driverName?: string;
    vehiclePlate?: string;
    signedAt?: string;
    signedBy?: string;
  };
  consignee: {
    name: string;
    address?: string;
    signedAt?: string;
    signedBy?: string;
  };
  goods: {
    description: string;
    quantity?: number;
    weight?: number;
    packages?: number;
  };
  pickup: {
    address: string;
    scheduledDate?: string;
    actualDate?: string;
  };
  delivery: {
    address: string;
    scheduledDate?: string;
    actualDate?: string;
  };
  reservations?: Array<{
    type: string;
    description: string;
    createdAt: string;
  }>;
  createdAt: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'draft': { label: 'Brouillon', color: '#6B7280', bgColor: '#6B728022' },
  'pending_shipper': { label: 'Attente expéditeur', color: '#F59E0B', bgColor: '#F59E0B22' },
  'pending_carrier': { label: 'Attente transporteur', color: '#3B82F6', bgColor: '#3B82F622' },
  'in_transit': { label: 'En transit', color: '#8B5CF6', bgColor: '#8B5CF622' },
  'pending_consignee': { label: 'Attente destinataire', color: '#F59E0B', bgColor: '#F59E0B22' },
  'completed': { label: 'Complété', color: '#10B981', bgColor: '#10B98122' },
  'disputed': { label: 'Litige', color: '#EF4444', bgColor: '#EF444422' },
  'cancelled': { label: 'Annulé', color: '#6B7280', bgColor: '#6B728022' }
};

// Filter types
type FilterType = 'all' | 'pending' | 'completed';

export default function EcmrPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<EcmrDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<EcmrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Modal states
  const [selectedEcmr, setSelectedEcmr] = useState<EcmrDocument | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Reservation form
  const [reservationDescription, setReservationDescription] = useState('');

  // Signing state
  const [signing, setSigning] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ecmrApi.list();
      if (response.success && response.data) {
        setDocuments(response.data);
      } else if (Array.isArray(response)) {
        setDocuments(response);
      } else {
        // Fallback mock data for demo
        setDocuments([
          {
            ecmrId: 'ECMR-2025-001',
            orderId: 'ORD-2025-001',
            status: 'pending_carrier',
            shipper: { name: 'Industrie ABC', address: '123 Rue Industrielle, Lyon', signedAt: '2025-12-20T10:00:00Z', signedBy: 'Jean Dupont' },
            carrier: { name: 'Transport Express', driverName: '', vehiclePlate: 'AB-123-CD' },
            consignee: { name: 'Entrepôt XYZ', address: '456 Avenue Logistique, Paris' },
            goods: { description: 'Palettes de marchandises', quantity: 10, weight: 5000, packages: 10 },
            pickup: { address: '123 Rue Industrielle, Lyon', scheduledDate: '2025-12-21T08:00:00Z' },
            delivery: { address: '456 Avenue Logistique, Paris', scheduledDate: '2025-12-21T16:00:00Z' },
            createdAt: '2025-12-20T09:00:00Z'
          },
          {
            ecmrId: 'ECMR-2025-002',
            orderId: 'ORD-2025-002',
            status: 'in_transit',
            shipper: { name: 'Usine DEF', address: '789 Boulevard Fabrication, Marseille', signedAt: '2025-12-19T14:00:00Z', signedBy: 'Marie Martin' },
            carrier: { name: 'Transport Express', driverName: 'Pierre Durand', vehiclePlate: 'CD-456-EF', signedAt: '2025-12-19T15:00:00Z', signedBy: 'Pierre Durand' },
            consignee: { name: 'Client GHI', address: '321 Rue Commerce, Bordeaux' },
            goods: { description: 'Matériel industriel', quantity: 5, weight: 2500, packages: 5 },
            pickup: { address: '789 Boulevard Fabrication, Marseille', scheduledDate: '2025-12-19T14:00:00Z', actualDate: '2025-12-19T14:30:00Z' },
            delivery: { address: '321 Rue Commerce, Bordeaux', scheduledDate: '2025-12-20T10:00:00Z' },
            createdAt: '2025-12-19T12:00:00Z'
          },
          {
            ecmrId: 'ECMR-2025-003',
            orderId: 'ORD-2025-003',
            status: 'completed',
            shipper: { name: 'Fournisseur JKL', address: '555 Chemin Production, Toulouse', signedAt: '2025-12-18T08:00:00Z', signedBy: 'Luc Bernard' },
            carrier: { name: 'Transport Express', driverName: 'Sophie Leroy', vehiclePlate: 'EF-789-GH', signedAt: '2025-12-18T09:00:00Z', signedBy: 'Sophie Leroy' },
            consignee: { name: 'Magasin MNO', address: '888 Avenue Vente, Nantes', signedAt: '2025-12-18T17:00:00Z', signedBy: 'Paul Petit' },
            goods: { description: 'Produits finis', quantity: 20, weight: 8000, packages: 20 },
            pickup: { address: '555 Chemin Production, Toulouse', scheduledDate: '2025-12-18T08:00:00Z', actualDate: '2025-12-18T08:15:00Z' },
            delivery: { address: '888 Avenue Vente, Nantes', scheduledDate: '2025-12-18T16:00:00Z', actualDate: '2025-12-18T16:45:00Z' },
            createdAt: '2025-12-17T16:00:00Z'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching eCMR documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter documents
  useEffect(() => {
    let filtered = [...documents];

    switch (activeFilter) {
      case 'pending':
        filtered = documents.filter(d =>
          ['pending_carrier', 'in_transit'].includes(d.status)
        );
        break;
      case 'completed':
        filtered = documents.filter(d => d.status === 'completed');
        break;
      default:
        break;
    }

    setFilteredDocuments(filtered);
  }, [documents, activeFilter]);

  // Auth check and initial fetch
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchDocuments();
  }, [router, fetchDocuments]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Handle signature submission
  const handleSign = async () => {
    if (!selectedEcmr || !canvasRef.current || !hasSignature) return;

    setSigning(true);

    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      const user = getUser();
      const signerName = user?.name || user?.email || 'Chauffeur';

      const response = await ecmrApi.sign(selectedEcmr.ecmrId, {
        party: 'carrier',
        signatureData,
        signerName,
        reservations: reservationDescription || undefined
      });

      if (response.success) {
        await fetchDocuments();
        setShowSignModal(false);
        setSelectedEcmr(null);
        clearCanvas();
        setReservationDescription('');
      } else {
        alert(response.error || 'Erreur lors de la signature');
      }
    } catch (err) {
      console.error('Error signing eCMR:', err);
      alert('Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  // Handle PDF download
  const handleDownload = async (ecmr: EcmrDocument) => {
    try {
      const blob = await ecmrApi.downloadPdf(ecmr.ecmrId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eCMR-${ecmr.ecmrId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  // Check if carrier can sign
  const canCarrierSign = (ecmr: EcmrDocument): boolean => {
    return ecmr.status === 'pending_carrier' && !ecmr.carrier.signedAt;
  };

  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>e-CMR Digital - Transporteur | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}>
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📄</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>e-CMR Digital</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            🚚 Transporteur
          </div>
        </header>

        {/* Filters */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'Tous', icon: '📋' },
            { key: 'pending', label: 'À signer', icon: '✍️' },
            { key: 'completed', label: 'Complétés', icon: '✅' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as FilterType)}
              style={{
                padding: '12px 24px',
                background: activeFilter === filter.key
                  ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                  : 'rgba(255,255,255,0.1)',
                border: activeFilter === filter.key
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}>
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '0 40px 40px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Chargement des documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredDocuments.map(doc => {
                const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG['draft'];
                const showSignButton = canCarrierSign(doc);

                return (
                  <div key={doc.ecmrId} style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      {/* Left section */}
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{
                          fontSize: '48px',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}>
                          📄
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                            {doc.ecmrId}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                            Commande: {doc.orderId}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>{doc.shipper.name}</strong> → <strong>{doc.consignee.name}</strong>
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                            {doc.goods.description} • {doc.goods.weight ? `${doc.goods.weight} kg` : ''} {doc.goods.packages ? `• ${doc.goods.packages} colis` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right section */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                        <div style={{
                          padding: '6px 16px',
                          background: statusConfig.bgColor,
                          color: statusConfig.color,
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {statusConfig.label}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => { setSelectedEcmr(doc); setShowViewModal(true); }}
                            style={{
                              padding: '8px 16px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                            👁️ Détails
                          </button>

                          <button
                            onClick={() => handleDownload(doc)}
                            style={{
                              padding: '8px 16px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                            📥 PDF
                          </button>

                          {showSignButton && (
                            <button
                              onClick={() => { setSelectedEcmr(doc); setShowSignModal(true); }}
                              style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '700'
                              }}>
                              ✍️ Signer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Signature status indicators */}
                    <div style={{
                      display: 'flex',
                      gap: '24px',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{doc.shipper.signedAt ? '✅' : '⏳'}</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                          Expéditeur {doc.shipper.signedAt ? `signé le ${formatDate(doc.shipper.signedAt)}` : 'en attente'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{doc.carrier.signedAt ? '✅' : '⏳'}</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                          Transporteur {doc.carrier.signedAt ? `signé le ${formatDate(doc.carrier.signedAt)}` : 'en attente'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{doc.consignee.signedAt ? '✅' : '⏳'}</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                          Destinataire {doc.consignee.signedAt ? `signé le ${formatDate(doc.consignee.signedAt)}` : 'en attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && selectedEcmr && (
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1a1a2e',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>📄 {selectedEcmr.ecmrId}</h2>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedEcmr(null); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}>
                  ✕
                </button>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: STATUS_CONFIG[selectedEcmr.status]?.bgColor,
                  color: STATUS_CONFIG[selectedEcmr.status]?.color,
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {STATUS_CONFIG[selectedEcmr.status]?.label}
                </div>
              </div>

              {/* Parties */}
              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>EXPÉDITEUR</div>
                  <div style={{ fontWeight: '600' }}>{selectedEcmr.shipper.name}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{selectedEcmr.shipper.address}</div>
                  {selectedEcmr.shipper.signedAt && (
                    <div style={{ fontSize: '12px', color: '#10B981', marginTop: '8px' }}>
                      ✅ Signé par {selectedEcmr.shipper.signedBy} le {formatDate(selectedEcmr.shipper.signedAt)}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>TRANSPORTEUR</div>
                  <div style={{ fontWeight: '600' }}>{selectedEcmr.carrier.name}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                    {selectedEcmr.carrier.driverName && `Chauffeur: ${selectedEcmr.carrier.driverName}`}
                    {selectedEcmr.carrier.vehiclePlate && ` • Véhicule: ${selectedEcmr.carrier.vehiclePlate}`}
                  </div>
                  {selectedEcmr.carrier.signedAt && (
                    <div style={{ fontSize: '12px', color: '#10B981', marginTop: '8px' }}>
                      ✅ Signé par {selectedEcmr.carrier.signedBy} le {formatDate(selectedEcmr.carrier.signedAt)}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>DESTINATAIRE</div>
                  <div style={{ fontWeight: '600' }}>{selectedEcmr.consignee.name}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{selectedEcmr.consignee.address}</div>
                  {selectedEcmr.consignee.signedAt && (
                    <div style={{ fontSize: '12px', color: '#10B981', marginTop: '8px' }}>
                      ✅ Signé par {selectedEcmr.consignee.signedBy} le {formatDate(selectedEcmr.consignee.signedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Goods */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>MARCHANDISES</div>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>{selectedEcmr.goods.description}</div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  {selectedEcmr.goods.quantity && (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Quantité:</span> {selectedEcmr.goods.quantity}
                    </div>
                  )}
                  {selectedEcmr.goods.weight && (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Poids:</span> {selectedEcmr.goods.weight} kg
                    </div>
                  )}
                  {selectedEcmr.goods.packages && (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Colis:</span> {selectedEcmr.goods.packages}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>ENLÈVEMENT</div>
                  <div style={{ fontSize: '14px' }}>{selectedEcmr.pickup.address}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                    Prévu: {formatDate(selectedEcmr.pickup.scheduledDate)}
                  </div>
                  {selectedEcmr.pickup.actualDate && (
                    <div style={{ fontSize: '13px', color: '#10B981' }}>
                      Réel: {formatDate(selectedEcmr.pickup.actualDate)}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>LIVRAISON</div>
                  <div style={{ fontSize: '14px' }}>{selectedEcmr.delivery.address}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                    Prévu: {formatDate(selectedEcmr.delivery.scheduledDate)}
                  </div>
                  {selectedEcmr.delivery.actualDate && (
                    <div style={{ fontSize: '13px', color: '#10B981' }}>
                      Réel: {formatDate(selectedEcmr.delivery.actualDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Reservations */}
              {selectedEcmr.reservations && selectedEcmr.reservations.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '8px' }}>⚠️ RÉSERVES</div>
                  {selectedEcmr.reservations.map((res, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <strong>{res.type}:</strong> {res.description}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleDownload(selectedEcmr)}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                  📥 Télécharger PDF
                </button>

                {canCarrierSign(selectedEcmr) && (
                  <button
                    onClick={() => { setShowViewModal(false); setShowSignModal(true); }}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                    ✍️ Signer
                  </button>
                )}

                <button
                  onClick={() => { setShowViewModal(false); setSelectedEcmr(null); }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign Modal */}
        {showSignModal && selectedEcmr && (
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1a1a2e',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>✍️ Signer l&apos;e-CMR</h2>
                <button
                  onClick={() => { setShowSignModal(false); setSelectedEcmr(null); clearCanvas(); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}>
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.7)' }}>
                Document: <strong>{selectedEcmr.ecmrId}</strong>
              </div>

              {/* Reservations input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  Réserves (optionnel)
                </label>
                <textarea
                  value={reservationDescription}
                  onChange={(e) => setReservationDescription(e.target.value)}
                  placeholder="Indiquez vos réserves ici (dommages, manquants, etc.)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Signature canvas */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  Votre signature
                </label>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '4px',
                  position: 'relative'
                }}>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                      width: '100%',
                      height: '200px',
                      cursor: 'crosshair',
                      touchAction: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  {!hasSignature && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#9CA3AF',
                      pointerEvents: 'none',
                      fontSize: '14px'
                    }}>
                      Signez ici
                    </div>
                  )}
                </div>
                <button
                  onClick={clearCanvas}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                  🗑️ Effacer
                </button>
              </div>

              {/* Legal notice */}
              <div style={{
                background: 'rgba(59,130,246,0.1)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)'
              }}>
                ℹ️ En signant, vous confirmez avoir pris en charge les marchandises décrites dans ce document.
                Cette signature électronique a valeur légale conformément au règlement eIDAS.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowSignModal(false); setSelectedEcmr(null); clearCanvas(); setReservationDescription(''); }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                  Annuler
                </button>
                <button
                  onClick={handleSign}
                  disabled={!hasSignature || signing}
                  style={{
                    padding: '12px 24px',
                    background: hasSignature && !signing
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: hasSignature && !signing ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '700',
                    opacity: hasSignature && !signing ? 1 : 0.5
                  }}>
                  {signing ? '⏳ Signature en cours...' : '✅ Valider et signer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

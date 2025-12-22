import { useEffect, useState, useRef } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { ecmrApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface ECMR {
  id: string;
  orderId: string;
  orderRef: string;
  shipper: {
    name: string;
    address: string;
    signedAt?: string;
    signedBy?: string;
  };
  carrier: {
    name: string;
    address: string;
    driverName: string;
    vehiclePlate: string;
    signedAt?: string;
    signedBy?: string;
  };
  consignee: {
    name: string;
    address: string;
    signedAt?: string;
    signedBy?: string;
  };
  goods: {
    description: string;
    quantity: number;
    weight: number;
    packages: number;
  };
  pickup: {
    date: string;
    address: string;
    actualDate?: string;
  };
  delivery: {
    date: string;
    address: string;
    actualDate?: string;
  };
  status: 'draft' | 'pending_shipper' | 'pending_carrier' | 'in_transit' | 'pending_consignee' | 'completed' | 'disputed';
  createdAt: string;
  reservations?: string;
}

export default function ECMRPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [ecmrs, setEcmrs] = useState<ECMR[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedEcmr, setSelectedEcmr] = useState<ECMR | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 156,
    pending: 12,
    completed: 138,
    disputed: 6
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    loadECMRs();
  }, [mounted]);

  const loadECMRs = async () => {
    setLoading(true);
    try {
      const data = await ecmrApi.list();

      if (data.data && data.data.length > 0) {
        const formattedEcmrs = data.data.map((e: any) => ({
          ...e,
          id: e._id || e.id
        }));
        setEcmrs(formattedEcmrs);

        // Update stats
        const pending = formattedEcmrs.filter((e: ECMR) => ['pending_shipper', 'pending_carrier', 'pending_consignee', 'in_transit'].includes(e.status)).length;
        const completed = formattedEcmrs.filter((e: ECMR) => e.status === 'completed').length;
        const disputed = formattedEcmrs.filter((e: ECMR) => e.status === 'disputed').length;
        setStats({ total: formattedEcmrs.length, pending, completed, disputed });
      } else {
        setEcmrs(mockECMRs);
      }
    } catch (error) {
      console.log('API unavailable, using mock data');
      setEcmrs(mockECMRs);
    }
    setLoading(false);
  };

  const mockECMRs: ECMR[] = [
    {
      id: 'ECMR-2024-0001',
      orderId: 'ORD-2024-0125',
      orderRef: 'CMD-INDUS-001',
      shipper: {
        name: 'Industries Dupont SA',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        signedAt: '2024-11-28T10:30:00Z',
        signedBy: 'Marc Dupont'
      },
      carrier: {
        name: 'Transport Express Lyon',
        address: '45 Rue du Fret, 69000 Lyon',
        driverName: 'Jean Dupont',
        vehiclePlate: 'AB-123-CD',
        signedAt: '2024-11-28T10:45:00Z',
        signedBy: 'Jean Dupont'
      },
      consignee: {
        name: 'Logistique Martin',
        address: '78 Avenue Commerce, 75012 Paris'
      },
      goods: {
        description: 'Pieces detachees industrielles',
        quantity: 15,
        weight: 2500,
        packages: 15
      },
      pickup: {
        date: '2024-11-28',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        actualDate: '2024-11-28'
      },
      delivery: {
        date: '2024-11-29',
        address: '78 Avenue Commerce, 75012 Paris'
      },
      status: 'in_transit',
      createdAt: '2024-11-28T08:00:00Z'
    },
    {
      id: 'ECMR-2024-0002',
      orderId: 'ORD-2024-0126',
      orderRef: 'CMD-INDUS-002',
      shipper: {
        name: 'Industries Dupont SA',
        address: '123 Zone Industrielle, 93200 Saint-Denis'
      },
      carrier: {
        name: 'Transports Martin',
        address: '12 Route Nationale, 13000 Marseille',
        driverName: 'Pierre Martin',
        vehiclePlate: 'EF-456-GH'
      },
      consignee: {
        name: 'Entrepot Sud',
        address: '90 Port de Fos, 13270 Fos-sur-Mer'
      },
      goods: {
        description: 'Materiel electronique',
        quantity: 50,
        weight: 800,
        packages: 50
      },
      pickup: {
        date: '2024-11-30',
        address: '123 Zone Industrielle, 93200 Saint-Denis'
      },
      delivery: {
        date: '2024-12-01',
        address: '90 Port de Fos, 13270 Fos-sur-Mer'
      },
      status: 'pending_shipper',
      createdAt: '2024-11-29T14:00:00Z'
    },
    {
      id: 'ECMR-2024-0003',
      orderId: 'ORD-2024-0120',
      orderRef: 'CMD-INDUS-003',
      shipper: {
        name: 'Industries Dupont SA',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        signedAt: '2024-11-25T09:00:00Z',
        signedBy: 'Marc Dupont'
      },
      carrier: {
        name: 'Speed Logistics',
        address: '56 Rue Express, 31000 Toulouse',
        driverName: 'Luc Bernard',
        vehiclePlate: 'IJ-789-KL',
        signedAt: '2024-11-25T09:30:00Z',
        signedBy: 'Luc Bernard'
      },
      consignee: {
        name: 'Client Final SA',
        address: '34 Boulevard Central, 33000 Bordeaux',
        signedAt: '2024-11-26T14:00:00Z',
        signedBy: 'Sophie Lambert'
      },
      goods: {
        description: 'Produits chimiques (non dangereux)',
        quantity: 30,
        weight: 1500,
        packages: 30
      },
      pickup: {
        date: '2024-11-25',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        actualDate: '2024-11-25'
      },
      delivery: {
        date: '2024-11-26',
        address: '34 Boulevard Central, 33000 Bordeaux',
        actualDate: '2024-11-26'
      },
      status: 'completed',
      createdAt: '2024-11-24T16:00:00Z'
    },
    {
      id: 'ECMR-2024-0004',
      orderId: 'ORD-2024-0127',
      orderRef: 'CMD-INDUS-004',
      shipper: {
        name: 'Industries Dupont SA',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        signedAt: '2024-11-27T11:00:00Z',
        signedBy: 'Marc Dupont'
      },
      carrier: {
        name: 'Euro Trans',
        address: '89 Quai Maritime, 13002 Marseille',
        driverName: 'Ahmed Benali',
        vehiclePlate: 'MN-012-OP',
        signedAt: '2024-11-27T11:30:00Z',
        signedBy: 'Ahmed Benali'
      },
      consignee: {
        name: 'Distribution Nord',
        address: '67 Zone Logistique, 59000 Lille'
      },
      goods: {
        description: 'Equipements industriels lourds',
        quantity: 5,
        weight: 8000,
        packages: 5
      },
      pickup: {
        date: '2024-11-27',
        address: '123 Zone Industrielle, 93200 Saint-Denis',
        actualDate: '2024-11-27'
      },
      delivery: {
        date: '2024-11-29',
        address: '67 Zone Logistique, 59000 Lille'
      },
      status: 'pending_consignee',
      createdAt: '2024-11-26T10:00:00Z',
      reservations: 'Emballage legerement endommage sur 1 colis'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#666';
      case 'pending_shipper': return '#FFB800';
      case 'pending_carrier': return '#FFB800';
      case 'in_transit': return '#667eea';
      case 'pending_consignee': return '#764ba2';
      case 'completed': return '#00D084';
      case 'disputed': return '#FF6B6B';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'pending_shipper': return 'Signature expediteur';
      case 'pending_carrier': return 'Signature transporteur';
      case 'in_transit': return 'En transit';
      case 'pending_consignee': return 'Signature destinataire';
      case 'completed': return 'Complete';
      case 'disputed': return 'Litige';
      default: return status;
    }
  };

  const filteredECMRs = ecmrs.filter(ecmr => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending_shipper', 'pending_carrier', 'in_transit', 'pending_consignee'].includes(ecmr.status);
    if (filter === 'completed') return ecmr.status === 'completed';
    return true;
  });

  // Canvas signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!selectedEcmr) return;

    // Get signature from canvas
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL('image/png') : '';

    // Determine which party is signing
    let party: 'shipper' | 'carrier' | 'consignee' = 'shipper';
    if (selectedEcmr.status === 'pending_carrier') party = 'carrier';
    if (selectedEcmr.status === 'pending_consignee') party = 'consignee';

    try {
      await ecmrApi.sign(selectedEcmr.id, {
        party,
        signatureData,
        signerName: 'Marc Dupont'
      });
    } catch (error) {
      console.log('Sign API - using local update');
    }

    const now = new Date().toISOString();
    setEcmrs(prev =>
      prev.map(ecmr => {
        if (ecmr.id === selectedEcmr.id) {
          // Update appropriate signature based on status
          const updates: any = {};
          if (party === 'shipper') {
            updates.shipper = { ...ecmr.shipper, signedAt: now, signedBy: 'Marc Dupont' };
            updates.status = 'pending_carrier';
          } else if (party === 'carrier') {
            updates.carrier = { ...ecmr.carrier, signedAt: now, signedBy: ecmr.carrier.driverName };
            updates.status = 'in_transit';
          } else if (party === 'consignee') {
            updates.consignee = { ...ecmr.consignee, signedAt: now, signedBy: 'Destinataire' };
            updates.status = 'completed';
          }
          return { ...ecmr, ...updates };
        }
        return ecmr;
      })
    );
    setShowSignModal(false);
    setSelectedEcmr(null);
    clearSignature();
  };

  const handleDownload = async (ecmr: ECMR) => {
    try {
      // Télécharger le PDF directement
      const blob = await ecmrApi.downloadPdf(ecmr.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eCMR-${ecmr.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Erreur lors du telechargement du PDF pour eCMR ${ecmr.id}`);
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
        <title>e-CMR Signature - Industry | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>📝</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>e-CMR Signature Electronique</h1>
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
            Conforme eIDAS
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'Total eCMR', value: stats.total, icon: '📄', color: '#667eea' },
              { label: 'En attente', value: stats.pending, icon: '⏳', color: '#FFB800' },
              { label: 'Completes', value: stats.completed, icon: '✅', color: '#00D084' },
              { label: 'Litiges', value: stats.disputed, icon: '⚠️', color: '#FF6B6B' }
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
              { key: 'pending', label: 'En cours' },
              { key: 'completed', label: 'Completes' }
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

          {/* eCMR List */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>
              Lettres de voiture electroniques ({filteredECMRs.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredECMRs.map(ecmr => (
                <div key={ecmr.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>{ecmr.id}</span>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(ecmr.status)}20`,
                          color: getStatusColor(ecmr.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusLabel(ecmr.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        Commande: {ecmr.orderRef} | Ref: {ecmr.orderId}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{ecmr.goods.description}</div>
                      <div style={{ fontSize: '13px', opacity: 0.8 }}>{ecmr.goods.weight} kg - {ecmr.goods.packages} colis</div>
                    </div>
                  </div>

                  {/* Signatures progress */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px'
                  }}>
                    {/* Shipper */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: ecmr.shipper.signedAt ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.1)',
                        border: ecmr.shipper.signedAt ? '2px solid #00D084' : '2px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px'
                      }}>
                        {ecmr.shipper.signedAt ? '✓' : '1'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>Expediteur</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {ecmr.shipper.signedAt ? ecmr.shipper.signedBy : 'En attente'}
                      </div>
                    </div>

                    <div style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '100%',
                        height: '2px',
                        background: ecmr.carrier.signedAt ? '#00D084' : 'rgba(255,255,255,0.2)'
                      }} />
                    </div>

                    {/* Carrier */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: ecmr.carrier.signedAt ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.1)',
                        border: ecmr.carrier.signedAt ? '2px solid #00D084' : '2px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px'
                      }}>
                        {ecmr.carrier.signedAt ? '✓' : '2'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>Transporteur</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {ecmr.carrier.signedAt ? ecmr.carrier.signedBy : 'En attente'}
                      </div>
                    </div>

                    <div style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '100%',
                        height: '2px',
                        background: ecmr.consignee.signedAt ? '#00D084' : 'rgba(255,255,255,0.2)'
                      }} />
                    </div>

                    {/* Consignee */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: ecmr.consignee.signedAt ? 'rgba(0,208,132,0.3)' : 'rgba(255,255,255,0.1)',
                        border: ecmr.consignee.signedAt ? '2px solid #00D084' : '2px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px'
                      }}>
                        {ecmr.consignee.signedAt ? '✓' : '3'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>Destinataire</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {ecmr.consignee.signedAt ? ecmr.consignee.signedBy : 'En attente'}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Expediteur</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{ecmr.shipper.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Transporteur</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{ecmr.carrier.name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{ecmr.carrier.driverName} - {ecmr.carrier.vehiclePlate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Destinataire</div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{ecmr.consignee.name}</div>
                    </div>
                  </div>

                  {ecmr.reservations && (
                    <div style={{
                      background: 'rgba(255,107,107,0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px',
                      marginBottom: '16px',
                      borderLeft: '3px solid #FF6B6B'
                    }}>
                      <strong>Reserves:</strong> {ecmr.reservations}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setSelectedEcmr(ecmr);
                        setShowViewModal(true);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      Voir details
                    </button>
                    <button
                      onClick={() => handleDownload(ecmr)}
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
                      Telecharger PDF
                    </button>
                    {ecmr.status === 'pending_shipper' && (
                      <button
                        onClick={() => {
                          setSelectedEcmr(ecmr);
                          setShowSignModal(true);
                        }}
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
                        Signer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
                Signature electronique
              </h3>
              <p style={{ opacity: 0.8, marginBottom: '24px' }}>
                eCMR <strong>{selectedEcmr.id}</strong>
              </p>

              <div style={{
                background: 'rgba(102,126,234,0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid rgba(102,126,234,0.3)'
              }}>
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <strong>Marchandises:</strong> {selectedEcmr.goods.description}
                </div>
                <div style={{ fontSize: '13px' }}>
                  <strong>Quantite:</strong> {selectedEcmr.goods.packages} colis - {selectedEcmr.goods.weight} kg
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Dessinez votre signature
                </label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  style={{
                    width: '100%',
                    background: 'white',
                    borderRadius: '8px',
                    cursor: 'crosshair'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <button
                  onClick={clearSignature}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(255,107,107,0.3)',
                    color: '#FF6B6B',
                    border: '1px solid #FF6B6B',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  Effacer
                </button>
              </div>

              <div style={{
                background: 'rgba(255,184,0,0.1)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                border: '1px solid rgba(255,184,0,0.3)',
                fontSize: '12px'
              }}>
                En signant, je certifie avoir verifie les informations de ce document et accepte les conditions de transport.
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowSignModal(false);
                    setSelectedEcmr(null);
                  }}
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
                  onClick={handleSign}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  Valider et signer
                </button>
              </div>
            </div>
          </div>
        )}

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
            padding: '40px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                  Details eCMR {selectedEcmr.id}
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEcmr(null);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Fermer
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Expediteur</h4>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{selectedEcmr.shipper.name}</div>
                    <div style={{ opacity: 0.8, marginBottom: '12px' }}>{selectedEcmr.shipper.address}</div>
                    {selectedEcmr.shipper.signedAt && (
                      <div style={{ color: '#00D084', fontSize: '12px' }}>
                        Signe le {new Date(selectedEcmr.shipper.signedAt).toLocaleDateString('fr-FR')} par {selectedEcmr.shipper.signedBy}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Transporteur</h4>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{selectedEcmr.carrier.name}</div>
                    <div style={{ opacity: 0.8, marginBottom: '8px' }}>{selectedEcmr.carrier.address}</div>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ opacity: 0.7 }}>Chauffeur:</span> {selectedEcmr.carrier.driverName}
                      <br />
                      <span style={{ opacity: 0.7 }}>Vehicule:</span> {selectedEcmr.carrier.vehiclePlate}
                    </div>
                    {selectedEcmr.carrier.signedAt && (
                      <div style={{ color: '#00D084', fontSize: '12px' }}>
                        Signe le {new Date(selectedEcmr.carrier.signedAt).toLocaleDateString('fr-FR')} par {selectedEcmr.carrier.signedBy}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Destinataire</h4>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{selectedEcmr.consignee.name}</div>
                    <div style={{ opacity: 0.8, marginBottom: '12px' }}>{selectedEcmr.consignee.address}</div>
                    {selectedEcmr.consignee.signedAt && (
                      <div style={{ color: '#00D084', fontSize: '12px' }}>
                        Signe le {new Date(selectedEcmr.consignee.signedAt).toLocaleDateString('fr-FR')} par {selectedEcmr.consignee.signedBy}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Marchandises</h4>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{selectedEcmr.goods.description}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><span style={{ opacity: 0.7 }}>Quantite:</span> {selectedEcmr.goods.quantity}</div>
                      <div><span style={{ opacity: 0.7 }}>Poids:</span> {selectedEcmr.goods.weight} kg</div>
                      <div><span style={{ opacity: 0.7 }}>Colis:</span> {selectedEcmr.goods.packages}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Page Economie Circulaire des Palettes Europe - Portail Logisticien
 * Integration complete avec palettes-circular-api v1.1.0
 *
 * Fonctionnalites Logisticien:
 * - Reception de cheques-palette (scan QR + geolocalisation)
 * - Gestion des sites de restitution (creation, quotas)
 * - Consultation du grand livre (dettes/credits)
 * - Ouverture et resolution des litiges
 * - Statistiques des sites
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { isAuthenticated, getAuthToken } from '../lib/auth';

// Import dynamique des composants Palettes (SSR disabled)
const QRScanner = dynamic<any>(
  () => import('../../../packages/ui-components/src/components/Palettes/QRScanner').then(mod => mod.QRScanner),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement scanner...</div> }
);
const SitesMap = dynamic<any>(
  () => import('../../../packages/ui-components/src/components/Palettes/SitesMap').then(mod => mod.SitesMap),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement carte...</div> }
);
const SignatureCapture = dynamic<any>(
  () => import('../../../packages/ui-components/src/components/Palettes/SignatureCapture').then(mod => mod.SignatureCapture),
  { ssr: false }
);
const ChequeExportButton = dynamic<any>(
  () => import('../../../packages/ui-components/src/components/Palettes/ChequeExport').then(mod => mod.ChequeExportButton),
  { ssr: false }
);

// Types
interface PalletCheque {
  chequeId: string;
  qrCode: string;
  orderId: string;
  palletType: string;
  quantity: number;
  transporterId: string;
  transporterName: string;
  vehiclePlate: string;
  driverName: string;
  destinationSiteId: string;
  destinationSiteName: string;
  status: 'EMIS' | 'EN_TRANSIT' | 'DEPOSE' | 'RECU' | 'LITIGE' | 'ANNULE';
  timestamps: {
    emittedAt: string;
    depositedAt?: string;
    receivedAt?: string;
  };
  geolocation?: {
    deposit?: { latitude: number; longitude: number };
    receive?: { latitude: number; longitude: number };
  };
  createdAt: string;
}

interface PalletLedger {
  ledgerId: string;
  companyId: string;
  balances: {
    EURO_EPAL: number;
    EURO_EPAL_2: number;
    DEMI_PALETTE: number;
    PALETTE_PERDUE: number;
  };
  adjustments: Array<{
    date: string;
    type: string;
    palletType: string;
    quantity: number;
    reason: string;
    chequeId: string;
  }>;
}

interface Site {
  siteId: string;
  siteName: string;
  companyId: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
  };
  geofencing: {
    radius: number;
    strictMode: boolean;
  };
  quota: {
    maxDaily: number;
    currentDaily: number;
    maxWeekly: number;
    currentWeekly: number;
  };
  capacities: {
    EURO_EPAL: number;
    EURO_EPAL_2: number;
    DEMI_PALETTE: number;
    PALETTE_PERDUE: number;
  };
  openingHours: { open: string; close: string };
  priority: number;
  active: boolean;
  createdAt: string;
}

interface Dispute {
  disputeId: string;
  chequeId: string;
  type: string;
  initiatorId: string;
  respondentId: string;
  description: string;
  status: string;
  priority: string;
  claimedQuantity: number;
  actualQuantity: number;
  createdAt: string;
  resolution?: {
    type: string;
    adjustedQuantity: number;
    description: string;
    proposedBy: string;
    proposedAt: string;
  };
}

interface SiteStats {
  siteId: string;
  totalReceived: number;
  totalByType: Record<string, number>;
  quotaUsage: number;
  disputeRate: number;
}

export default function PalettesCircularPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_PALETTES_API_URL || 'https://d2o4ng8nutcmou.cloudfront.net';

  // State
  const [activeTab, setActiveTab] = useState<'receive' | 'sites' | 'ledger' | 'disputes' | 'stats' | 'scan' | 'map'>('receive');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureForCheque, setSignatureForCheque] = useState<string | null>(null);
  const [scannedCheque, setScannedCheque] = useState<PalletCheque | null>(null);
  const [pendingCheques, setPendingCheques] = useState<PalletCheque[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [ledger, setLedger] = useState<PalletLedger | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for scanning cheque
  const [scanChequeId, setScanChequeId] = useState('');
  const [actualQuantity, setActualQuantity] = useState<number>(0);

  // Form state for new site
  const [newSite, setNewSite] = useState({
    siteName: '',
    street: '',
    city: '',
    postalCode: '',
    latitude: 48.8566,
    longitude: 2.3522,
    geofenceRadius: 100,
    maxDaily: 100,
    maxWeekly: 500,
    capacityEpal: 500,
    capacityEpal2: 200,
    capacityDemi: 100,
    capacityPerdue: 50,
    openHour: '08:00',
    closeHour: '18:00',
    priority: 50
  });

  // Form state for new dispute
  const [newDispute, setNewDispute] = useState({
    chequeId: '',
    type: 'quantite_incorrecte',
    claimedQuantity: 0,
    actualQuantity: 0,
    description: ''
  });

  // Form state for resolution proposal
  const [resolutionForm, setResolutionForm] = useState({
    disputeId: '',
    type: 'ajustement_partiel',
    adjustedQuantity: 0,
    description: ''
  });

  const companyId = 'LOG-001'; // TODO: Get from auth context

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadPendingCheques();
    loadSites();
    loadLedger();
    loadDisputes();
  }, [router]);

  // API Helper
  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = getAuthToken();
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur ${response.status}`);
    }
    return data;
  };

  // Load data
  const loadPendingCheques = async () => {
    try {
      // Get cheques deposited at our sites (status = DEPOSE)
      const result = await apiCall(`/api/palettes/cheques?status=DEPOSE&limit=50`);
      // Filter only those for our sites
      const ourSitesResult = await apiCall(`/api/palettes/sites?companyId=${companyId}`);
      const ourSiteIds = (ourSitesResult.data || []).map((s: Site) => s.siteId);
      const filtered = (result.data || []).filter((c: PalletCheque) => ourSiteIds.includes(c.destinationSiteId));
      setPendingCheques(filtered);
    } catch (err: any) {
      console.error('Erreur chargement cheques:', err.message);
    }
  };

  const loadSites = async () => {
    try {
      const result = await apiCall(`/api/palettes/sites?companyId=${companyId}`);
      setSites(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement sites:', err.message);
    }
  };

  const loadLedger = async () => {
    try {
      const result = await apiCall(`/api/palettes/ledger/${companyId}`);
      setLedger(result.data);
    } catch (err: any) {
      console.error('Erreur chargement ledger:', err.message);
    }
  };

  const loadDisputes = async () => {
    try {
      const result = await apiCall(`/api/palettes/disputes?companyId=${companyId}`);
      setDisputes(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement litiges:', err.message);
    }
  };

  const loadSiteStats = async () => {
    try {
      const statsPromises = sites.map(async (site) => {
        const result = await apiCall(`/api/palettes/sites/${site.siteId}/stats`);
        return result.data;
      });
      const stats = await Promise.all(statsPromises);
      setSiteStats(stats.filter(Boolean));
    } catch (err: any) {
      console.error('Erreur chargement stats:', err.message);
    }
  };

  // Receive cheque
  const receiveCheque = async (chequeId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const result = await apiCall(`/api/palettes/cheques/${chequeId}/receive`, 'POST', {
        receiverId: companyId,
        receiverName: 'Logistique Express',
        actualQuantity: quantity,
        geolocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });
      setSuccess(`Cheque ${chequeId} recu avec succes!`);
      setScanChequeId('');
      setActualQuantity(0);
      loadPendingCheques();
      loadLedger();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create site
  const createSite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/palettes/sites', 'POST', {
        siteName: newSite.siteName,
        companyId: companyId,
        address: {
          street: newSite.street,
          city: newSite.city,
          postalCode: newSite.postalCode,
          country: 'France',
          coordinates: {
            latitude: newSite.latitude,
            longitude: newSite.longitude
          }
        },
        geofencing: {
          radius: newSite.geofenceRadius,
          strictMode: true
        },
        quota: {
          maxDaily: newSite.maxDaily,
          maxWeekly: newSite.maxWeekly
        },
        capacities: {
          EURO_EPAL: newSite.capacityEpal,
          EURO_EPAL_2: newSite.capacityEpal2,
          DEMI_PALETTE: newSite.capacityDemi,
          PALETTE_PERDUE: newSite.capacityPerdue
        },
        openingHours: {
          open: newSite.openHour,
          close: newSite.closeHour
        },
        priority: newSite.priority
      });
      setSuccess('Site cree avec succes!');
      loadSites();
      // Reset form
      setNewSite({
        siteName: '', street: '', city: '', postalCode: '',
        latitude: 48.8566, longitude: 2.3522, geofenceRadius: 100,
        maxDaily: 100, maxWeekly: 500, capacityEpal: 500, capacityEpal2: 200,
        capacityDemi: 100, capacityPerdue: 50, openHour: '08:00', closeHour: '18:00', priority: 50
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update site quota
  const updateSiteQuota = async (siteId: string, maxDaily: number, maxWeekly: number) => {
    setIsLoading(true);
    try {
      await apiCall(`/api/palettes/sites/${siteId}`, 'PUT', {
        quota: { maxDaily, maxWeekly }
      });
      setSuccess('Quotas mis a jour');
      loadSites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle site active status
  const toggleSiteActive = async (siteId: string, active: boolean) => {
    setIsLoading(true);
    try {
      await apiCall(`/api/palettes/sites/${siteId}`, 'PUT', { active });
      setSuccess(active ? 'Site active' : 'Site desactive');
      loadSites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Open dispute
  const openDispute = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/palettes/disputes', 'POST', {
        chequeId: newDispute.chequeId,
        type: newDispute.type,
        initiatorId: companyId,
        claimedQuantity: newDispute.claimedQuantity,
        actualQuantity: newDispute.actualQuantity,
        description: newDispute.description
      });
      setSuccess('Litige ouvert avec succes');
      loadDisputes();
      setNewDispute({ chequeId: '', type: 'quantite_incorrecte', claimedQuantity: 0, actualQuantity: 0, description: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Propose resolution
  const proposeResolution = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiCall(`/api/palettes/disputes/${resolutionForm.disputeId}/propose-resolution`, 'POST', {
        proposerId: companyId,
        type: resolutionForm.type,
        adjustedQuantity: resolutionForm.adjustedQuantity,
        description: resolutionForm.description
      });
      setSuccess('Resolution proposee');
      loadDisputes();
      setResolutionForm({ disputeId: '', type: 'ajustement_partiel', adjustedQuantity: 0, description: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate dispute resolution
  const validateResolution = async (disputeId: string, accept: boolean) => {
    setIsLoading(true);
    try {
      await apiCall(`/api/palettes/disputes/${disputeId}/validate`, 'POST', { accept });
      setSuccess(accept ? 'Resolution acceptee' : 'Resolution refusee - escalade');
      loadDisputes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR code scan
  const handleQRScan = useCallback((qrData: string) => {
    // Parse QR data - expected format: CHQ-XXXXXX-XXXX or JSON with chequeId
    let chequeId = qrData;
    try {
      const parsed = JSON.parse(qrData);
      chequeId = parsed.chequeId || parsed.id || qrData;
    } catch {
      // Not JSON, use as-is
    }

    // Find cheque in pending list
    const cheque = pendingCheques.find(c => c.chequeId === chequeId);
    if (cheque) {
      setScannedCheque(cheque);
      setScanChequeId(chequeId);
      setActualQuantity(cheque.quantity);
      setSuccess(`Cheque ${chequeId} scanne - ${cheque.quantity} ${cheque.palletType}`);
      setActiveTab('receive');
    } else {
      setError(`Cheque ${chequeId} non trouve dans les cheques en attente`);
    }
  }, [pendingCheques]);

  // Handle signature capture
  const handleSignatureCapture = useCallback(async (signatureData: any) => {
    if (!signatureForCheque) return;

    setIsLoading(true);
    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const cheque = pendingCheques.find(c => c.chequeId === signatureForCheque);
      const quantity = cheque?.quantity || actualQuantity;

      await apiCall(`/api/palettes/cheques/${signatureForCheque}/receive`, 'POST', {
        receiverId: companyId,
        receiverName: 'Logistique Express',
        actualQuantity: quantity,
        signature: signatureData.imageBase64,
        geolocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });

      setSuccess(`Cheque ${signatureForCheque} recu avec signature!`);
      setShowSignature(false);
      setSignatureForCheque(null);
      setScanChequeId('');
      setActualQuantity(0);
      loadPendingCheques();
      loadLedger();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [signatureForCheque, pendingCheques, actualQuantity, companyId]);

  // Convert sites to map format
  const mapSites = sites.map(site => ({
    id: site.siteId,
    name: site.siteName,
    address: `${site.address.street}, ${site.address.city}`,
    latitude: site.address.coordinates.latitude,
    longitude: site.address.coordinates.longitude,
    type: 'logistician' as const,
    capacity: site.capacities?.EURO_EPAL || 0,
    currentStock: site.quota.currentDaily,
    openingHours: `${site.openingHours.open} - ${site.openingHours.close}`,
    isOpen: site.active
  }));

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif'
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    border: 'none',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.2)'
  };

  const buttonDangerStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'rgba(17, 153, 142, 0.6)' : 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'EMIS': '#FFA500',
      'EN_TRANSIT': '#3498db',
      'DEPOSE': '#9b59b6',
      'RECU': '#00D084',
      'LITIGE': '#e74c3c',
      'ANNULE': '#95a5a6'
    };
    return colors[status] || '#fff';
  };

  const getBalanceColor = (value: number) => value >= 0 ? '#00D084' : '#e74c3c';

  const getQuotaColor = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct >= 90) return '#e74c3c';
    if (pct >= 70) return '#FFA500';
    return '#00D084';
  };

  return (
    <>
      <Head>
        <title>Economie Circulaire Palettes - Logisticien | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600'
              }}
            >
              ← Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              🏭 Economie Circulaire Palettes
            </h1>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(17, 153, 142, 0.4)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Logisticien
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'receive')} onClick={() => setActiveTab('receive')}>
              Reception ({pendingCheques.length})
            </button>
            <button style={tabStyle(activeTab === 'sites')} onClick={() => setActiveTab('sites')}>
              Mes Sites ({sites.length})
            </button>
            <button style={tabStyle(activeTab === 'ledger')} onClick={() => setActiveTab('ledger')}>
              Grand Livre
            </button>
            <button style={tabStyle(activeTab === 'disputes')} onClick={() => setActiveTab('disputes')}>
              Litiges ({disputes.filter(d => d.status !== 'resolu').length})
            </button>
            <button style={tabStyle(activeTab === 'stats')} onClick={() => { setActiveTab('stats'); loadSiteStats(); }}>
              Statistiques
            </button>
            <button style={tabStyle(activeTab === 'scan')} onClick={() => setActiveTab('scan')}>
              Scanner
            </button>
            <button style={tabStyle(activeTab === 'map')} onClick={() => setActiveTab('map')}>
              Carte
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(231, 76, 60, 0.3)', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.5)' }}>
            ❌ {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(0, 208, 132, 0.3)', borderRadius: '8px', border: '1px solid rgba(0, 208, 132, 0.5)' }}>
            ✅ {success}
            <button onClick={() => setSuccess(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* Tab: Receive Cheques */}
          {activeTab === 'receive' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
              {/* Scan Form */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>📱 Scanner un Cheque-Palette</h3>
                <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
                  Scannez le QR code ou saisissez l'ID du cheque pour confirmer la reception.
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>ID du Cheque</label>
                    <input
                      style={inputStyle}
                      placeholder="CHQ-XXXXXX-XXXX"
                      value={scanChequeId}
                      onChange={(e) => {
                        setScanChequeId(e.target.value);
                        // Auto-fill quantity from pending cheques
                        const cheque = pendingCheques.find(c => c.chequeId === e.target.value);
                        if (cheque) setActualQuantity(cheque.quantity);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Quantite recue</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      value={actualQuantity}
                      onChange={(e) => setActualQuantity(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    style={buttonStyle}
                    onClick={() => receiveCheque(scanChequeId, actualQuantity)}
                    disabled={isLoading || !scanChequeId || actualQuantity <= 0}
                  >
                    {isLoading ? 'Reception en cours...' : '✅ Confirmer Reception'}
                  </button>
                </div>
              </div>

              {/* Pending Cheques List */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>Cheques en attente de reception ({pendingCheques.length})</h3>
                {pendingCheques.length === 0 ? (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun cheque en attente de reception.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {pendingCheques.map(cheque => (
                      <div
                        key={cheque.chequeId}
                        style={{ ...cardStyle, cursor: 'pointer', border: scanChequeId === cheque.chequeId ? '2px solid #11998e' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => { setScanChequeId(cheque.chequeId); setActualQuantity(cheque.quantity); }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Cheque</div>
                            <div style={{ fontWeight: '700' }}>{cheque.chequeId}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Transporteur</div>
                            <div style={{ fontWeight: '600' }}>{cheque.transporterName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Quantite</div>
                            <div style={{ fontSize: '20px', fontWeight: '800' }}>{cheque.quantity} {cheque.palletType}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Depose le</div>
                            <div style={{ fontSize: '13px' }}>{cheque.timestamps.depositedAt ? new Date(cheque.timestamps.depositedAt).toLocaleString('fr-FR') : 'N/A'}</div>
                          </div>
                          <button
                            style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); setScanChequeId(cheque.chequeId); setActualQuantity(cheque.quantity); }}
                          >
                            Recevoir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Sites Management */}
          {activeTab === 'sites' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedSite ? '1fr 400px' : '1fr', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2>Mes Sites de Restitution ({sites.length})</h2>
                  <button style={buttonStyle} onClick={() => setSelectedSite({} as Site)}>
                    + Creer un Site
                  </button>
                </div>
                {sites.length === 0 ? (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun site cree. Cliquez sur "Creer un Site" pour commencer.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {sites.map(site => (
                      <div
                        key={site.siteId}
                        style={{ ...cardStyle, cursor: 'pointer', border: selectedSite?.siteId === site.siteId ? '2px solid #11998e' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setSelectedSite(site)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '16px' }}>{site.siteName}</span>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: site.active ? 'rgba(0,208,132,0.3)' : 'rgba(231,76,60,0.3)'
                              }}>
                                {site.active ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>
                              {site.address.street}, {site.address.city} ({site.address.postalCode})
                            </div>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                              <span>
                                📊 Quota jour:
                                <span style={{ color: getQuotaColor(site.quota.currentDaily, site.quota.maxDaily), marginLeft: '4px' }}>
                                  {site.quota.currentDaily}/{site.quota.maxDaily}
                                </span>
                              </span>
                              <span>
                                📅 Quota semaine:
                                <span style={{ color: getQuotaColor(site.quota.currentWeekly, site.quota.maxWeekly), marginLeft: '4px' }}>
                                  {site.quota.currentWeekly}/{site.quota.maxWeekly}
                                </span>
                              </span>
                              <span>🕐 {site.openingHours.open} - {site.openingHours.close}</span>
                              <span>⭐ Priorite: {site.priority}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={site.active ? buttonDangerStyle : buttonStyle}
                              onClick={(e) => { e.stopPropagation(); toggleSiteActive(site.siteId, !site.active); }}
                            >
                              {site.active ? 'Desactiver' : 'Activer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Detail/Creation Panel */}
              {selectedSite && (
                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>{selectedSite.siteId ? 'Modifier Site' : 'Nouveau Site'}</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Nom du site</label>
                      <input
                        style={inputStyle}
                        placeholder="Entrepot Paris Nord"
                        value={selectedSite.siteId ? selectedSite.siteName : newSite.siteName}
                        onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, siteName: e.target.value })}
                        readOnly={!!selectedSite.siteId}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Adresse</label>
                      <input
                        style={inputStyle}
                        placeholder="123 Rue de la Logistique"
                        value={selectedSite.siteId ? selectedSite.address?.street : newSite.street}
                        onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, street: e.target.value })}
                        readOnly={!!selectedSite.siteId}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Ville</label>
                        <input
                          style={inputStyle}
                          placeholder="Paris"
                          value={selectedSite.siteId ? selectedSite.address?.city : newSite.city}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, city: e.target.value })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Code Postal</label>
                        <input
                          style={inputStyle}
                          placeholder="75001"
                          value={selectedSite.siteId ? selectedSite.address?.postalCode : newSite.postalCode}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, postalCode: e.target.value })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Latitude</label>
                        <input
                          style={inputStyle}
                          type="number"
                          step="0.0001"
                          value={selectedSite.siteId ? selectedSite.address?.coordinates?.latitude : newSite.latitude}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, latitude: parseFloat(e.target.value) })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Longitude</label>
                        <input
                          style={inputStyle}
                          type="number"
                          step="0.0001"
                          value={selectedSite.siteId ? selectedSite.address?.coordinates?.longitude : newSite.longitude}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, longitude: parseFloat(e.target.value) })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                    </div>
                    {!selectedSite.siteId && (
                      <button
                        style={{ ...buttonSecondaryStyle, width: '100%' }}
                        onClick={() => {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setNewSite({ ...newSite, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                          });
                        }}
                      >
                        📍 Utiliser ma position
                      </button>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Quota journalier</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={selectedSite.siteId ? selectedSite.quota?.maxDaily : newSite.maxDaily}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, maxDaily: parseInt(e.target.value) || 100 })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Quota hebdo</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={selectedSite.siteId ? selectedSite.quota?.maxWeekly : newSite.maxWeekly}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, maxWeekly: parseInt(e.target.value) || 500 })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Ouverture</label>
                        <input
                          style={inputStyle}
                          type="time"
                          value={selectedSite.siteId ? selectedSite.openingHours?.open : newSite.openHour}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, openHour: e.target.value })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Fermeture</label>
                        <input
                          style={inputStyle}
                          type="time"
                          value={selectedSite.siteId ? selectedSite.openingHours?.close : newSite.closeHour}
                          onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, closeHour: e.target.value })}
                          readOnly={!!selectedSite.siteId}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Priorite (0-100)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        max="100"
                        value={selectedSite.siteId ? selectedSite.priority : newSite.priority}
                        onChange={(e) => selectedSite.siteId ? null : setNewSite({ ...newSite, priority: parseInt(e.target.value) || 50 })}
                        readOnly={!!selectedSite.siteId}
                      />
                    </div>
                    {!selectedSite.siteId && (
                      <button
                        style={{ ...buttonStyle, width: '100%' }}
                        onClick={createSite}
                        disabled={isLoading || !newSite.siteName || !newSite.city}
                      >
                        {isLoading ? 'Creation...' : '✅ Creer le Site'}
                      </button>
                    )}
                    <button
                      style={{ ...buttonSecondaryStyle, width: '100%' }}
                      onClick={() => setSelectedSite(null)}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Ledger */}
          {activeTab === 'ledger' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Grand Livre - Solde Palettes</h2>
              {ledger ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {Object.entries(ledger.balances).map(([type, value]) => (
                    <div key={type} style={cardStyle}>
                      <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>{type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: getBalanceColor(value as number) }}>
                        {(value as number) > 0 ? '+' : ''}{value as number}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        {(value as number) >= 0 ? 'Credit' : 'Dette'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={cardStyle}><p>Chargement...</p></div>
              )}

              <h3 style={{ marginBottom: '16px' }}>Historique des Mouvements</h3>
              <div style={cardStyle}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {ledger?.adjustments?.slice(0, 20).map((adj, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ color: adj.type === 'credit' ? '#00D084' : '#e74c3c', fontWeight: '700' }}>
                        {adj.type === 'credit' ? '+' : ''}{adj.quantity}
                      </div>
                      <div style={{ opacity: 0.8 }}>{adj.palletType}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>{new Date(adj.date).toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{adj.reason}</div>
                    </div>
                  )) || <p style={{ opacity: 0.6 }}>Aucun mouvement</p>}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Disputes */}
          {activeTab === 'disputes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              <div>
                <h2 style={{ marginBottom: '16px' }}>Mes Litiges ({disputes.length})</h2>
                {disputes.length === 0 ? (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun litige en cours. 🎉</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {disputes.map(dispute => (
                      <div key={dispute.disputeId} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '700' }}>{dispute.disputeId}</span>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: dispute.status === 'resolu' ? 'rgba(0,208,132,0.3)' :
                                  dispute.status === 'escalade' ? 'rgba(231,76,60,0.3)' : 'rgba(255,165,0,0.3)'
                              }}>
                                {dispute.status.toUpperCase()}
                              </span>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                background: dispute.priority === 'high' ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.2)'
                              }}>
                                {dispute.priority}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                              Cheque: {dispute.chequeId} | Type: {dispute.type.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.7 }}>
                              {dispute.description}
                            </div>
                            <div style={{ fontSize: '13px', marginTop: '8px' }}>
                              Ecart: <strong>{dispute.claimedQuantity}</strong> attendu vs <strong>{dispute.actualQuantity}</strong> recu
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dispute.status === 'ouvert' && dispute.initiatorId !== companyId && (
                              <button
                                style={buttonStyle}
                                onClick={() => setResolutionForm({ ...resolutionForm, disputeId: dispute.disputeId, adjustedQuantity: Math.floor((dispute.claimedQuantity + dispute.actualQuantity) / 2) })}
                              >
                                Proposer Resolution
                              </button>
                            )}
                            {(dispute.status === 'proposition_emise' || dispute.status === 'valide_initiateur') && dispute.respondentId === companyId && (
                              <>
                                <button
                                  style={{ ...buttonStyle, background: '#00D084' }}
                                  onClick={() => validateResolution(dispute.disputeId, true)}
                                  disabled={isLoading}
                                >
                                  ✓ Accepter
                                </button>
                                <button
                                  style={buttonDangerStyle}
                                  onClick={() => validateResolution(dispute.disputeId, false)}
                                  disabled={isLoading}
                                >
                                  ✗ Refuser
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {dispute.resolution && (
                          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Resolution proposee:</div>
                            <div style={{ fontSize: '14px' }}>
                              {dispute.resolution.type} - Ajustement: {dispute.resolution.adjustedQuantity} palettes
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>{dispute.resolution.description}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Panel: Open Dispute or Propose Resolution */}
              <div>
                {/* Open Dispute Form */}
                <div style={{ ...cardStyle, marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '16px' }}>⚠️ Ouvrir un Litige</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>ID du Cheque</label>
                      <input
                        style={inputStyle}
                        placeholder="CHQ-XXXXXX-XXXX"
                        value={newDispute.chequeId}
                        onChange={(e) => setNewDispute({ ...newDispute, chequeId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Type de litige</label>
                      <select
                        style={inputStyle}
                        value={newDispute.type}
                        onChange={(e) => setNewDispute({ ...newDispute, type: e.target.value })}
                      >
                        <option value="quantite_incorrecte">Quantite incorrecte</option>
                        <option value="qualite_non_conforme">Qualite non conforme</option>
                        <option value="type_incorrect">Type incorrect</option>
                        <option value="non_reception">Non reception</option>
                        <option value="hors_delai">Hors delai</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Qty attendue</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={newDispute.claimedQuantity}
                          onChange={(e) => setNewDispute({ ...newDispute, claimedQuantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Qty recue</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={newDispute.actualQuantity}
                          onChange={(e) => setNewDispute({ ...newDispute, actualQuantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Description</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Decrivez le probleme..."
                        value={newDispute.description}
                        onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                      />
                    </div>
                    <button
                      style={buttonDangerStyle}
                      onClick={openDispute}
                      disabled={isLoading || !newDispute.chequeId || !newDispute.description}
                    >
                      {isLoading ? 'Ouverture...' : 'Ouvrir le Litige'}
                    </button>
                  </div>
                </div>

                {/* Propose Resolution Form */}
                {resolutionForm.disputeId && (
                  <div style={cardStyle}>
                    <h3 style={{ marginBottom: '16px' }}>🤝 Proposer une Resolution</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Litige: {resolutionForm.disputeId}</label>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Type de resolution</label>
                        <select
                          style={inputStyle}
                          value={resolutionForm.type}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, type: e.target.value })}
                        >
                          <option value="ajustement_total">Ajustement total</option>
                          <option value="ajustement_partiel">Ajustement partiel</option>
                          <option value="rejet">Rejet de la reclamation</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Quantite ajustee</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={resolutionForm.adjustedQuantity}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, adjustedQuantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Justification</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                          placeholder="Expliquez votre proposition..."
                          value={resolutionForm.description}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, description: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          style={buttonStyle}
                          onClick={proposeResolution}
                          disabled={isLoading}
                        >
                          Proposer
                        </button>
                        <button
                          style={buttonSecondaryStyle}
                          onClick={() => setResolutionForm({ disputeId: '', type: 'ajustement_partiel', adjustedQuantity: 0, description: '' })}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Statistics */}
          {activeTab === 'stats' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Statistiques des Sites</h2>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Sites Actifs</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#11998e' }}>
                    {sites.filter(s => s.active).length}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Total Capacite EPAL</div>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>
                    {sites.reduce((sum, s) => sum + (s.capacities?.EURO_EPAL || 0), 0)}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Quota Jour Utilise</div>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>
                    {sites.reduce((sum, s) => sum + (s.quota?.currentDaily || 0), 0)}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Cheques en Attente</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFA500' }}>
                    {pendingCheques.length}
                  </div>
                </div>
              </div>

              {/* Site Stats Table */}
              <h3 style={{ marginBottom: '16px' }}>Details par Site</h3>
              <div style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600' }}>
                  <div>Site</div>
                  <div>Quota Jour</div>
                  <div>Quota Semaine</div>
                  <div>Capacite EPAL</div>
                  <div>Statut</div>
                </div>
                {sites.map(site => (
                  <div key={site.siteId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{site.siteName}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>{site.address.city}</div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(site.quota.currentDaily / site.quota.maxDaily) * 100}%`,
                            height: '100%',
                            background: getQuotaColor(site.quota.currentDaily, site.quota.maxDaily),
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '13px' }}>{site.quota.currentDaily}/{site.quota.maxDaily}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(site.quota.currentWeekly / site.quota.maxWeekly) * 100}%`,
                            height: '100%',
                            background: getQuotaColor(site.quota.currentWeekly, site.quota.maxWeekly),
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '13px' }}>{site.quota.currentWeekly}/{site.quota.maxWeekly}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px' }}>{site.capacities?.EURO_EPAL || 0}</div>
                    <div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: site.active ? 'rgba(0,208,132,0.3)' : 'rgba(231,76,60,0.3)'
                      }}>
                        {site.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: QR Scanner */}
          {activeTab === 'scan' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>Scanner un Cheque-Palette</h3>
                <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
                  Scannez le QR code d'un cheque-palette pour le recevoir rapidement.
                </p>
                <QRScanner
                  onScan={handleQRScan}
                  onError={(err: string) => setError(err)}
                  scannerStyle="embedded"
                />
              </div>
              <div>
                <h3 style={{ marginBottom: '16px' }}>Cheque Scanne</h3>
                {scannedCheque ? (
                  <div style={cardStyle}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Cheque ID</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{scannedCheque.chequeId}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Type</div>
                          <div style={{ fontWeight: '600' }}>{scannedCheque.palletType}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Quantite</div>
                          <div style={{ fontSize: '24px', fontWeight: '800', color: '#11998e' }}>{scannedCheque.quantity}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Transporteur</div>
                        <div style={{ fontWeight: '600' }}>{scannedCheque.transporterName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Vehicule</div>
                        <div>{scannedCheque.vehiclePlate} - {scannedCheque.driverName}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                        <button
                          style={buttonStyle}
                          onClick={() => receiveCheque(scannedCheque.chequeId, scannedCheque.quantity)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Reception...' : 'Recevoir'}
                        </button>
                        <button
                          style={{ ...buttonStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                          onClick={() => {
                            setSignatureForCheque(scannedCheque.chequeId);
                            setShowSignature(true);
                          }}
                        >
                          Recevoir + Signer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>
                      Scannez un QR code pour afficher les details du cheque.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Map */}
          {activeTab === 'map' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Carte des Sites de Restitution</h2>
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', height: '600px' }}>
                <SitesMap
                  sites={mapSites}
                  height={600}
                  onSiteSelect={(site: any) => {
                    const fullSite = sites.find(s => s.siteId === site.id);
                    if (fullSite) {
                      setSelectedSite(fullSite);
                      setActiveTab('sites');
                    }
                  }}
                  showUserLocation={true}
                />
              </div>
            </div>
          )}

        </div>

        {/* Export Buttons - Fixed Position */}
        {pendingCheques.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            gap: '12px',
            zIndex: 100
          }}>
            <ChequeExportButton
              cheques={pendingCheques.map(c => ({
                chequeId: c.chequeId,
                qrCode: c.qrCode,
                orderId: c.orderId,
                palletType: c.palletType,
                quantity: c.quantity,
                emitterId: c.transporterId,
                emitterName: c.transporterName,
                receiverId: companyId,
                receiverName: 'Logistique Express',
                status: c.status,
                emittedAt: c.timestamps.emittedAt,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }))}
              exportType="pdf"
              variant="primary"
            />
            <ChequeExportButton
              cheques={pendingCheques.map(c => ({
                chequeId: c.chequeId,
                qrCode: c.qrCode,
                orderId: c.orderId,
                palletType: c.palletType,
                quantity: c.quantity,
                emitterId: c.transporterId,
                emitterName: c.transporterName,
                receiverId: companyId,
                receiverName: 'Logistique Express',
                status: c.status,
                emittedAt: c.timestamps.emittedAt,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }))}
              exportType="csv"
              variant="secondary"
            />
          </div>
        )}

        {/* Signature Modal */}
        {showSignature && signatureForCheque && (
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
            <SignatureCapture
              onCapture={handleSignatureCapture}
              onCancel={() => {
                setShowSignature(false);
                setSignatureForCheque(null);
              }}
              signerName="Logistique Express"
              signerRole="receiver"
              width={450}
              height={220}
            />
          </div>
        )}
      </div>
    </>
  );
}

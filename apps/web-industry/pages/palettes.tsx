/**
 * Page Economie Circulaire des Palettes Europe - Portail Industriel
 * Integration complete avec palettes-circular-api v1.1.0
 *
 * Fonctionnalites Industriel:
 * - Dashboard soldes et KPIs palettes
 * - Demandes de recuperation/restitution
 * - Consultation du grand livre (dettes/credits)
 * - Gestion des litiges
 * - Rapports et exports
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

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
  quota: {
    maxDaily: number;
    currentDaily: number;
  };
  capacities: {
    EURO_EPAL: number;
    EURO_EPAL_2: number;
    DEMI_PALETTE: number;
    PALETTE_PERDUE: number;
  };
  openingHours: { open: string; close: string };
  active: boolean;
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

interface RecoveryRequest {
  requestId: string;
  type: 'recuperation' | 'restitution';
  palletType: string;
  quantity: number;
  preferredDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  siteId?: string;
  siteName?: string;
  createdAt: string;
}

export default function PalettesCircularPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_PALETTES_API_URL || 'http://localhost:3000';

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'ledger' | 'disputes' | 'reports'>('dashboard');
  const [ledger, setLedger] = useState<PalletLedger | null>(null);
  const [cheques, setCheques] = useState<PalletCheque[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [nearbySites, setNearbySites] = useState<Site[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for recovery request
  const [newRequest, setNewRequest] = useState({
    type: 'recuperation' as 'recuperation' | 'restitution',
    palletType: 'EURO_EPAL',
    quantity: 10,
    preferredDate: '',
    siteId: '',
    notes: ''
  });

  // Form state for new dispute
  const [newDispute, setNewDispute] = useState({
    chequeId: '',
    type: 'quantite_incorrecte',
    claimedQuantity: 0,
    actualQuantity: 0,
    description: ''
  });

  // Report filters
  const [reportFilters, setReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    palletType: 'all'
  });

  const companyId = 'IND-001'; // TODO: Get from auth context

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadLedger();
    loadCheques();
    loadDisputes();
    loadNearbySites();
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
  const loadLedger = async () => {
    try {
      const result = await apiCall(`/api/palettes/ledger/${companyId}`);
      setLedger(result.data);
    } catch (err: any) {
      console.error('Erreur chargement ledger:', err.message);
    }
  };

  const loadCheques = async () => {
    try {
      // Get cheques related to this company (as destination or source)
      const result = await apiCall(`/api/palettes/cheques?companyId=${companyId}&limit=100`);
      setCheques(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement cheques:', err.message);
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

  const loadNearbySites = async () => {
    try {
      // Get nearby sites for recovery requests
      const result = await apiCall('/api/palettes/sites?active=true&limit=20');
      setNearbySites(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement sites:', err.message);
    }
  };

  // Create recovery request (mock - would need dedicated endpoint)
  const createRecoveryRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production, this would call a dedicated recovery request endpoint
      const request: RecoveryRequest = {
        requestId: `REQ-${Date.now()}`,
        type: newRequest.type,
        palletType: newRequest.palletType,
        quantity: newRequest.quantity,
        preferredDate: newRequest.preferredDate,
        status: 'pending',
        siteId: newRequest.siteId || undefined,
        siteName: nearbySites.find(s => s.siteId === newRequest.siteId)?.siteName,
        createdAt: new Date().toISOString()
      };
      setRecoveryRequests([request, ...recoveryRequests]);
      setSuccess(`Demande de ${newRequest.type} creee avec succes!`);
      setNewRequest({ type: 'recuperation', palletType: 'EURO_EPAL', quantity: 10, preferredDate: '', siteId: '', notes: '' });
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

  // Calculate KPIs
  const getTotalBalance = () => {
    if (!ledger) return 0;
    return Object.values(ledger.balances).reduce((sum, val) => sum + val, 0);
  };

  const getRecentMovements = () => {
    return ledger?.adjustments?.slice(0, 10) || [];
  };

  const getActiveDisputes = () => {
    return disputes.filter(d => d.status !== 'resolu').length;
  };

  const getChequesThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return cheques.filter(c => new Date(c.createdAt) >= startOfMonth).length;
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
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
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    border: 'none',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s'
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
    background: isActive ? 'rgba(240, 147, 251, 0.6)' : 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s'
  });

  const getBalanceColor = (value: number) => value >= 0 ? '#00D084' : '#e74c3c';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#FFA500',
      'confirmed': '#3498db',
      'completed': '#00D084',
      'cancelled': '#95a5a6',
      'EMIS': '#FFA500',
      'EN_TRANSIT': '#3498db',
      'DEPOSE': '#9b59b6',
      'RECU': '#00D084',
      'LITIGE': '#e74c3c',
      'ANNULE': '#95a5a6'
    };
    return colors[status] || '#fff';
  };

  return (
    <>
      <Head>
        <title>Economie Circulaire Palettes - Industriel | SYMPHONI.A</title>
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
              background: 'rgba(240, 147, 251, 0.4)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Industriel
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
              Tableau de Bord
            </button>
            <button style={tabStyle(activeTab === 'requests')} onClick={() => setActiveTab('requests')}>
              Demandes
            </button>
            <button style={tabStyle(activeTab === 'ledger')} onClick={() => setActiveTab('ledger')}>
              Grand Livre
            </button>
            <button style={tabStyle(activeTab === 'disputes')} onClick={() => setActiveTab('disputes')}>
              Litiges ({getActiveDisputes()})
            </button>
            <button style={tabStyle(activeTab === 'reports')} onClick={() => setActiveTab('reports')}>
              Rapports
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

          {/* Tab: Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Balance Totale</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: getBalanceColor(getTotalBalance()) }}>
                    {getTotalBalance() > 0 ? '+' : ''}{getTotalBalance()}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                    {getTotalBalance() >= 0 ? 'Credit net' : 'Dette nette'}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Cheques ce Mois</div>
                  <div style={{ fontSize: '36px', fontWeight: '800' }}>
                    {getChequesThisMonth()}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                    operations
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Litiges Actifs</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: getActiveDisputes() > 0 ? '#FFA500' : '#00D084' }}>
                    {getActiveDisputes()}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                    en cours
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Demandes en Cours</div>
                  <div style={{ fontSize: '36px', fontWeight: '800' }}>
                    {recoveryRequests.filter(r => r.status === 'pending' || r.status === 'confirmed').length}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                    recuperation/restitution
                  </div>
                </div>
              </div>

              {/* Balance Details */}
              <h3 style={{ marginBottom: '16px' }}>Soldes par Type de Palette</h3>
              {ledger ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {Object.entries(ledger.balances).map(([type, value]) => (
                    <div key={type} style={{ ...cardStyle, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: getBalanceColor(value as number) }}>
                        {(value as number) > 0 ? '+' : ''}{value as number}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={cardStyle}><p>Chargement...</p></div>
              )}

              {/* Recent Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Derniers Mouvements</h3>
                  <div style={cardStyle}>
                    {getRecentMovements().length === 0 ? (
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucun mouvement recent</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {getRecentMovements().map((adj, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < getRecentMovements().length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                            <div>
                              <div style={{ fontWeight: '600' }}>{adj.palletType.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '12px', opacity: 0.6 }}>{adj.reason}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', color: adj.type === 'credit' ? '#00D084' : '#e74c3c' }}>
                                {adj.type === 'credit' ? '+' : ''}{adj.quantity}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(adj.date).toLocaleDateString('fr-FR')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px' }}>Derniers Cheques</h3>
                  <div style={cardStyle}>
                    {cheques.slice(0, 5).length === 0 ? (
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucun cheque recent</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {cheques.slice(0, 5).map((cheque, idx) => (
                          <div key={cheque.chequeId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{cheque.chequeId}</div>
                              <div style={{ fontSize: '12px', opacity: 0.6 }}>{cheque.palletType} x {cheque.quantity}</div>
                            </div>
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: `${getStatusColor(cheque.status)}30`,
                              color: getStatusColor(cheque.status)
                            }}>
                              {cheque.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Requests */}
          {activeTab === 'requests' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
              {/* New Request Form */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>📦 Nouvelle Demande</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Type de demande</label>
                    <select
                      style={inputStyle}
                      value={newRequest.type}
                      onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as 'recuperation' | 'restitution' })}
                    >
                      <option value="recuperation">Recuperation (besoin de palettes)</option>
                      <option value="restitution">Restitution (renvoyer des palettes)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Type de palette</label>
                    <select
                      style={inputStyle}
                      value={newRequest.palletType}
                      onChange={(e) => setNewRequest({ ...newRequest, palletType: e.target.value })}
                    >
                      <option value="EURO_EPAL">EURO EPAL</option>
                      <option value="EURO_EPAL_2">EURO EPAL 2</option>
                      <option value="DEMI_PALETTE">Demi-Palette</option>
                      <option value="PALETTE_PERDUE">Palette Perdue</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Quantite</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="1"
                      value={newRequest.quantity}
                      onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Date souhaitee</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={newRequest.preferredDate}
                      onChange={(e) => setNewRequest({ ...newRequest, preferredDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Site (optionnel)</label>
                    <select
                      style={inputStyle}
                      value={newRequest.siteId}
                      onChange={(e) => setNewRequest({ ...newRequest, siteId: e.target.value })}
                    >
                      <option value="">-- Choisir un site --</option>
                      {nearbySites.map(site => (
                        <option key={site.siteId} value={site.siteId}>{site.siteName} - {site.address.city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Notes</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                      placeholder="Instructions particulieres..."
                      value={newRequest.notes}
                      onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                    />
                  </div>
                  <button
                    style={buttonStyle}
                    onClick={createRecoveryRequest}
                    disabled={isLoading || !newRequest.preferredDate || newRequest.quantity <= 0}
                  >
                    {isLoading ? 'Creation...' : '✅ Creer la Demande'}
                  </button>
                </div>
              </div>

              {/* Requests List */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>Mes Demandes ({recoveryRequests.length})</h3>
                {recoveryRequests.length === 0 ? (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucune demande en cours. Creez une nouvelle demande de recuperation ou restitution.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {recoveryRequests.map(request => (
                      <div key={request.requestId} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '700' }}>{request.requestId}</span>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: request.type === 'recuperation' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(155, 89, 182, 0.3)'
                              }}>
                                {request.type === 'recuperation' ? '📥 Recuperation' : '📤 Restitution'}
                              </span>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: `${getStatusColor(request.status)}30`,
                                color: getStatusColor(request.status)
                              }}>
                                {request.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                              <strong>{request.quantity}</strong> {request.palletType.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.7 }}>
                              Date souhaitee: {new Date(request.preferredDate).toLocaleDateString('fr-FR')}
                              {request.siteName && ` | Site: ${request.siteName}`}
                            </div>
                          </div>
                          {request.status === 'pending' && (
                            <button
                              style={{ ...buttonDangerStyle, padding: '8px 16px', fontSize: '12px' }}
                              onClick={() => {
                                setRecoveryRequests(recoveryRequests.map(r =>
                                  r.requestId === request.requestId ? { ...r, status: 'cancelled' as const } : r
                                ));
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
            </div>
          )}

          {/* Tab: Ledger */}
          {activeTab === 'ledger' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Grand Livre - Historique Complet</h2>

              {/* Balance Summary */}
              {ledger ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
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

              {/* Movements History */}
              <h3 style={{ marginBottom: '16px' }}>Historique des Mouvements</h3>
              <div style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 150px 1fr 100px 1fr', gap: '16px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', opacity: 0.8 }}>
                  <div>Quantite</div>
                  <div>Type Palette</div>
                  <div>Raison</div>
                  <div>Date</div>
                  <div>Cheque</div>
                </div>
                <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                  {ledger?.adjustments?.map((adj, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 150px 1fr 100px 1fr', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', alignItems: 'center' }}>
                      <div style={{ color: adj.type === 'credit' ? '#00D084' : '#e74c3c', fontWeight: '700', fontSize: '16px' }}>
                        {adj.type === 'credit' ? '+' : ''}{adj.quantity}
                      </div>
                      <div style={{ opacity: 0.8 }}>{adj.palletType.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{adj.reason}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>{new Date(adj.date).toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>{adj.chequeId || '-'}</div>
                    </div>
                  )) || <p style={{ opacity: 0.6, textAlign: 'center', padding: '16px' }}>Aucun mouvement</p>}
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
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun litige en cours.</p>
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
                          {(dispute.status === 'proposition_emise' || dispute.status === 'valide_initiateur') && (
                            <div style={{ display: 'flex', gap: '8px' }}>
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
                            </div>
                          )}
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

              {/* Open Dispute Form */}
              <div style={cardStyle}>
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
            </div>
          )}

          {/* Tab: Reports */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Rapports et Exports</h2>

              {/* Filters */}
              <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Filtres</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Date debut</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={reportFilters.dateFrom}
                      onChange={(e) => setReportFilters({ ...reportFilters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Date fin</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={reportFilters.dateTo}
                      onChange={(e) => setReportFilters({ ...reportFilters, dateTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Type de palette</label>
                    <select
                      style={inputStyle}
                      value={reportFilters.palletType}
                      onChange={(e) => setReportFilters({ ...reportFilters, palletType: e.target.value })}
                    >
                      <option value="all">Tous les types</option>
                      <option value="EURO_EPAL">EURO EPAL</option>
                      <option value="EURO_EPAL_2">EURO EPAL 2</option>
                      <option value="DEMI_PALETTE">Demi-Palette</option>
                      <option value="PALETTE_PERDUE">Palette Perdue</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button style={buttonSecondaryStyle}>
                      Appliquer les filtres
                    </button>
                  </div>
                </div>
              </div>

              {/* Report Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📊</div>
                  <h4 style={{ marginBottom: '8px', textAlign: 'center' }}>Rapport de Solde</h4>
                  <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px', textAlign: 'center' }}>
                    Export du solde actuel et historique des mouvements
                  </p>
                  <button style={{ ...buttonStyle, width: '100%' }}>
                    Telecharger PDF
                  </button>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📈</div>
                  <h4 style={{ marginBottom: '8px', textAlign: 'center' }}>Rapport Statistique</h4>
                  <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px', textAlign: 'center' }}>
                    Analyse des flux de palettes sur la periode
                  </p>
                  <button style={{ ...buttonStyle, width: '100%' }}>
                    Telecharger Excel
                  </button>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📋</div>
                  <h4 style={{ marginBottom: '8px', textAlign: 'center' }}>Export Comptable</h4>
                  <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px', textAlign: 'center' }}>
                    Export au format compatible avec les logiciels comptables
                  </p>
                  <button style={{ ...buttonStyle, width: '100%' }}>
                    Telecharger CSV
                  </button>
                </div>
              </div>

              {/* Summary Statistics */}
              <div style={{ ...cardStyle, marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Resume Statistique</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#00D084' }}>
                      {cheques.filter(c => c.status === 'RECU').length}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>Cheques recus</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#3498db' }}>
                      {cheques.reduce((sum, c) => c.status === 'RECU' ? sum + c.quantity : sum, 0)}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>Palettes recues</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#9b59b6' }}>
                      {disputes.length}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>Litiges total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: disputes.length > 0 ? '#FFA500' : '#00D084' }}>
                      {disputes.length > 0 ? Math.round((disputes.filter(d => d.status === 'resolu').length / disputes.length) * 100) : 100}%
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>Taux resolution</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

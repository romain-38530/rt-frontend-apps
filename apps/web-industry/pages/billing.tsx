/**
 * Page Prefacturation & Facturation Transport - Portail Industriel
 * Integration complete avec billing-api v1.0.0
 *
 * Fonctionnalites:
 * - Dashboard prefacturations
 * - Validation factures transporteur
 * - Gestion ecarts et contestations
 * - Suivi blocages
 * - Export ERP
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

// Types
interface Prefacturation {
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  transporterName: string;
  clientId: string;
  status: string;
  orderData: {
    deliveryDate: string;
    distance: number;
    pickupAddress: string;
    deliveryAddress: string;
  };
  calculation: {
    basePrice: number;
    optionsPrice: number;
    waitingTimePrice: number;
    penalties: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
  carrierInvoice?: {
    invoiceNumber: string;
    totalHT: number;
    totalTTC: number;
    uploadedAt: string;
  };
  discrepancies: Array<{
    type: string;
    description: string;
    difference: number;
    differencePercent: number;
    status: string;
  }>;
  blocks: Array<{
    type: string;
    reason: string;
    active: boolean;
    blockedAt: string;
  }>;
  finalInvoice?: {
    invoiceNumber: string;
    generatedAt: string;
    sentToERP: boolean;
    erpExportDate?: string;
    erpSystem?: string;
  };
  createdAt: string;
}

interface BillingStats {
  prefacturations: {
    total: number;
    byStatus: Record<string, number>;
  };
  amounts: {
    totalHT: number;
    totalTTC: number;
  };
  discrepancyRate: number;
  activeBlocks: number;
}

export default function BillingPage() {
  const router = useSafeRouter();
  const apiUrl = process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net';

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prefacturations' | 'validation' | 'blocks' | 'export'>('dashboard');
  const [prefacturations, setPrefacturations] = useState<Prefacturation[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [selectedPref, setSelectedPref] = useState<Prefacturation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new prefacturation
  const [newPrefForm, setNewPrefForm] = useState({
    orderId: '',
    transporterId: '',
    distance: 0,
    palettes: 0,
    adr: false,
    express: false,
    frigo: false
  });

  // Form state for ERP export
  const [erpConfig, setErpConfig] = useState({
    system: 'generic_api',
    endpoint: '',
    companyCode: '',
    costCenter: ''
  });

  const clientId = 'IND-001'; // TODO: Get from auth context

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadStats();
    loadPrefacturations();
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
  const loadStats = async () => {
    try {
      const result = await apiCall(`/api/billing/stats?clientId=${clientId}`);
      setStats(result.data);
    } catch (err: any) {
      console.error('Erreur chargement stats:', err.message);
    }
  };

  const loadPrefacturations = async () => {
    try {
      const filter = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const result = await apiCall(`/api/billing/prefacturations?clientId=${clientId}${filter}&limit=100`);
      setPrefacturations(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement prefacturations:', err.message);
    }
  };

  useEffect(() => {
    loadPrefacturations();
  }, [statusFilter]);

  // Generate prefacturation
  const generatePrefacturation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/billing/prefacturation/generate', 'POST', {
        orderId: newPrefForm.orderId,
        transporterId: newPrefForm.transporterId,
        clientId,
        orderData: {
          distance: newPrefForm.distance,
          deliveryDate: new Date().toISOString()
        },
        options: {
          palettesEchange: newPrefForm.palettes,
          adr: newPrefForm.adr,
          express: newPrefForm.express,
          frigo: newPrefForm.frigo
        }
      });
      setSuccess('Prefacturation generee avec succes!');
      loadPrefacturations();
      loadStats();
      setNewPrefForm({ orderId: '', transporterId: '', distance: 0, palettes: 0, adr: false, express: false, frigo: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize billing
  const finalizeBilling = async (prefacturationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiCall('/api/billing/finalize', 'POST', { prefacturationId });
      setSuccess('Facture finalisee avec succes!');
      loadPrefacturations();
      loadStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to ERP
  const exportToERP = async (prefacturationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/billing/export', 'POST', {
        prefacturationId,
        erpConfig
      });
      setSuccess(`Export ${result.data.status} vers ${result.data.erpSystem}`);
      loadPrefacturations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve discrepancy
  const resolveDiscrepancy = async (prefacturationId: string, index: number, resolution: string) => {
    setIsLoading(true);
    try {
      await apiCall('/api/billing/discrepancy/resolve', 'POST', {
        prefacturationId,
        discrepancyIndex: index,
        resolution
      });
      setSuccess('Ecart resolu');
      loadPrefacturations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Unblock
  const unblock = async (prefacturationId: string, reason: string) => {
    setIsLoading(true);
    try {
      await apiCall('/api/billing/unblock', 'POST', { prefacturationId, reason });
      setSuccess('Blocage leve');
      loadPrefacturations();
      loadStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = (prefacturationId: string) => {
    window.open(`${apiUrl}/api/billing/invoice/${prefacturationId}/pdf`, '_blank');
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

  const buttonSuccessStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)'
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
    background: isActive ? 'rgba(102, 126, 234, 0.6)' : 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': '#95a5a6',
      'generated': '#3498db',
      'discrepancy_detected': '#FFA500',
      'pending_validation': '#9b59b6',
      'validated': '#00b894',
      'contested': '#e74c3c',
      'blocked': '#e74c3c',
      'finalized': '#00cec9',
      'exported': '#00D084',
      'archived': '#636e72'
    };
    return colors[status] || '#fff';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Brouillon',
      'generated': 'Generee',
      'discrepancy_detected': 'Ecart detecte',
      'pending_validation': 'En validation',
      'validated': 'Validee',
      'contested': 'Contestee',
      'blocked': 'Bloquee',
      'finalized': 'Finalisee',
      'exported': 'Exportee',
      'archived': 'Archivee'
    };
    return labels[status] || status;
  };

  return (
    <>
      <Head>
        <title>Prefacturation & Facturation - Industriel | SYMPHONI.A</title>
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: '600' }}
            >
              ← Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Prefacturation & Facturation Transport
            </h1>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(102, 126, 234, 0.4)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Module 3
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </button>
            <button style={tabStyle(activeTab === 'prefacturations')} onClick={() => setActiveTab('prefacturations')}>
              Prefacturations ({prefacturations.length})
            </button>
            <button style={tabStyle(activeTab === 'validation')} onClick={() => setActiveTab('validation')}>
              Validation
            </button>
            <button style={tabStyle(activeTab === 'blocks')} onClick={() => setActiveTab('blocks')}>
              Blocages ({stats?.activeBlocks || 0})
            </button>
            <button style={tabStyle(activeTab === 'export')} onClick={() => setActiveTab('export')}>
              Export ERP
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(231, 76, 60, 0.3)', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.5)' }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(0, 208, 132, 0.3)', borderRadius: '8px', border: '1px solid rgba(0, 208, 132, 0.5)' }}>
            {success}
            <button onClick={() => setSuccess(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Total Prefacturations</div>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats?.prefacturations?.total || 0}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Montant Total HT</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#00D084' }}>
                    {(stats?.amounts?.totalHT || 0).toLocaleString('fr-FR')} EUR
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Taux d'Ecarts</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: (stats?.discrepancyRate || 0) > 20 ? '#e74c3c' : '#00D084' }}>
                    {stats?.discrepancyRate || 0}%
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Blocages Actifs</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: (stats?.activeBlocks || 0) > 0 ? '#e74c3c' : '#00D084' }}>
                    {stats?.activeBlocks || 0}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>En Attente Validation</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFA500' }}>
                    {stats?.prefacturations?.byStatus?.pending_validation || 0}
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Repartition par Statut</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {stats?.prefacturations?.byStatus && Object.entries(stats.prefacturations.byStatus).map(([status, count]) => (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: getStatusColor(status)
                          }} />
                          <span>{getStatusLabel(status)}</span>
                        </div>
                        <span style={{ fontWeight: '700' }}>{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Actions Rapides</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      style={buttonStyle}
                      onClick={() => setActiveTab('prefacturations')}
                    >
                      Voir toutes les prefacturations
                    </button>
                    <button
                      style={buttonSecondaryStyle}
                      onClick={() => { setStatusFilter('discrepancy_detected'); setActiveTab('prefacturations'); }}
                    >
                      Traiter les ecarts ({stats?.prefacturations?.byStatus?.discrepancy_detected || 0})
                    </button>
                    <button
                      style={buttonSecondaryStyle}
                      onClick={() => { setStatusFilter('blocked'); setActiveTab('blocks'); }}
                    >
                      Gerer les blocages ({stats?.activeBlocks || 0})
                    </button>
                    <button
                      style={buttonSuccessStyle}
                      onClick={() => setActiveTab('export')}
                    >
                      Exporter vers ERP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prefacturations Tab */}
          {activeTab === 'prefacturations' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>Prefacturations</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    style={{ ...inputStyle, width: '200px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="generated">Generees</option>
                    <option value="discrepancy_detected">Ecarts detectes</option>
                    <option value="pending_validation">En validation</option>
                    <option value="validated">Validees</option>
                    <option value="blocked">Bloquees</option>
                    <option value="finalized">Finalisees</option>
                    <option value="exported">Exportees</option>
                  </select>
                  <button style={buttonStyle} onClick={loadPrefacturations}>Actualiser</button>
                </div>
              </div>

              {/* List */}
              <div style={{ display: 'grid', gap: '16px' }}>
                {prefacturations.map(pref => (
                  <div
                    key={pref.prefacturationId}
                    style={{
                      ...cardStyle,
                      cursor: 'pointer',
                      border: selectedPref?.prefacturationId === pref.prefacturationId
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={() => setSelectedPref(selectedPref?.prefacturationId === pref.prefacturationId ? null : pref)}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px 150px auto', gap: '16px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Commande</div>
                        <div style={{ fontWeight: '700' }}>{pref.orderId}</div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>{pref.prefacturationId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Transporteur</div>
                        <div style={{ fontWeight: '600' }}>{pref.transporterName || pref.transporterId}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Distance</div>
                        <div>{pref.orderData?.distance || 0} km</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Montant HT</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          {pref.calculation?.totalHT?.toFixed(2)} EUR
                        </div>
                      </div>
                      <div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: `${getStatusColor(pref.status)}30`,
                          color: getStatusColor(pref.status)
                        }}>
                          {getStatusLabel(pref.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {pref.status === 'validated' && (
                          <button
                            style={{ ...buttonSuccessStyle, padding: '8px 12px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); finalizeBilling(pref.prefacturationId); }}
                          >
                            Finaliser
                          </button>
                        )}
                        {pref.status === 'finalized' && (
                          <button
                            style={{ ...buttonStyle, padding: '8px 12px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); downloadPDF(pref.prefacturationId); }}
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedPref?.prefacturationId === pref.prefacturationId && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                          {/* Calculation Details */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>Detail Calcul</h4>
                            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Prix base</span>
                                <span>{pref.calculation?.basePrice?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Options</span>
                                <span>{pref.calculation?.optionsPrice?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Temps attente</span>
                                <span>{pref.calculation?.waitingTimePrice?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Penalites</span>
                                <span style={{ color: '#e74c3c' }}>-{pref.calculation?.penalties?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
                                <span>Total HT</span>
                                <span>{pref.calculation?.totalHT?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>TVA (20%)</span>
                                <span>{pref.calculation?.tva?.toFixed(2)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#00D084' }}>
                                <span>Total TTC</span>
                                <span>{pref.calculation?.totalTTC?.toFixed(2)} EUR</span>
                              </div>
                            </div>
                          </div>

                          {/* Discrepancies */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>Ecarts Detectes ({pref.discrepancies?.length || 0})</h4>
                            {pref.discrepancies?.length === 0 ? (
                              <p style={{ opacity: 0.6 }}>Aucun ecart</p>
                            ) : (
                              <div style={{ display: 'grid', gap: '8px' }}>
                                {pref.discrepancies?.map((disc, idx) => (
                                  <div key={idx} style={{ padding: '8px', background: 'rgba(255,165,0,0.2)', borderRadius: '8px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{disc.type}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>{disc.description}</div>
                                    <div style={{ fontSize: '14px', color: '#e74c3c', fontWeight: '700' }}>
                                      Difference: {disc.difference?.toFixed(2)} EUR ({disc.differencePercent}%)
                                    </div>
                                    {disc.status === 'detected' && (
                                      <button
                                        style={{ ...buttonSecondaryStyle, padding: '4px 8px', fontSize: '11px', marginTop: '8px' }}
                                        onClick={() => resolveDiscrepancy(pref.prefacturationId, idx, 'Accepte')}
                                      >
                                        Resoudre
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Blocks */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>Blocages</h4>
                            {pref.blocks?.filter(b => b.active).length === 0 ? (
                              <p style={{ opacity: 0.6 }}>Aucun blocage actif</p>
                            ) : (
                              <div style={{ display: 'grid', gap: '8px' }}>
                                {pref.blocks?.filter(b => b.active).map((block, idx) => (
                                  <div key={idx} style={{ padding: '8px', background: 'rgba(231,76,60,0.2)', borderRadius: '8px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{block.type}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>{block.reason}</div>
                                    <button
                                      style={{ ...buttonDangerStyle, padding: '4px 8px', fontSize: '11px', marginTop: '8px' }}
                                      onClick={() => unblock(pref.prefacturationId, 'Deblocage manuel')}
                                    >
                                      Lever le blocage
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {prefacturations.length === 0 && (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucune prefacturation trouvee.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
              {/* Generate Prefacturation Form */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>Generer une Prefacturation</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>ID Commande</label>
                    <input
                      style={inputStyle}
                      placeholder="ORD-XXXXX"
                      value={newPrefForm.orderId}
                      onChange={(e) => setNewPrefForm({ ...newPrefForm, orderId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>ID Transporteur</label>
                    <input
                      style={inputStyle}
                      placeholder="TRP-XXXXX"
                      value={newPrefForm.transporterId}
                      onChange={(e) => setNewPrefForm({ ...newPrefForm, transporterId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Distance (km)</label>
                    <input
                      style={inputStyle}
                      type="number"
                      value={newPrefForm.distance}
                      onChange={(e) => setNewPrefForm({ ...newPrefForm, distance: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Palettes echange</label>
                    <input
                      style={inputStyle}
                      type="number"
                      value={newPrefForm.palettes}
                      onChange={(e) => setNewPrefForm({ ...newPrefForm, palettes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={newPrefForm.adr}
                        onChange={(e) => setNewPrefForm({ ...newPrefForm, adr: e.target.checked })}
                      />
                      ADR
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={newPrefForm.express}
                        onChange={(e) => setNewPrefForm({ ...newPrefForm, express: e.target.checked })}
                      />
                      Express
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={newPrefForm.frigo}
                        onChange={(e) => setNewPrefForm({ ...newPrefForm, frigo: e.target.checked })}
                      />
                      Frigo
                    </label>
                  </div>
                  <button
                    style={buttonStyle}
                    onClick={generatePrefacturation}
                    disabled={isLoading || !newPrefForm.orderId || !newPrefForm.transporterId}
                  >
                    {isLoading ? 'Generation...' : 'Generer Prefacturation'}
                  </button>
                </div>
              </div>

              {/* Pending Validation List */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>En Attente de Validation Transporteur</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {prefacturations.filter(p => ['generated', 'pending_validation', 'discrepancy_detected'].includes(p.status)).map(pref => (
                    <div key={pref.prefacturationId} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{pref.orderId}</div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>{pref.transporterName || pref.transporterId}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{pref.calculation?.totalHT?.toFixed(2)} EUR</div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            background: `${getStatusColor(pref.status)}30`,
                            color: getStatusColor(pref.status)
                          }}>
                            {getStatusLabel(pref.status)}
                          </span>
                        </div>
                      </div>
                      {pref.discrepancies?.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,165,0,0.2)', borderRadius: '8px' }}>
                          {pref.discrepancies.length} ecart(s) detecte(s)
                        </div>
                      )}
                    </div>
                  ))}
                  {prefacturations.filter(p => ['generated', 'pending_validation', 'discrepancy_detected'].includes(p.status)).length === 0 && (
                    <div style={cardStyle}>
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucune prefacturation en attente.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Blocages Actifs</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                {prefacturations.filter(p => p.blocks?.some(b => b.active)).map(pref => (
                  <div key={pref.prefacturationId} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>{pref.orderId}</div>
                        <div style={{ fontSize: '13px', opacity: 0.7 }}>{pref.transporterName}</div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>
                        {pref.calculation?.totalHT?.toFixed(2)} EUR
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                      {pref.blocks?.filter(b => b.active).map((block, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(231,76,60,0.2)', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {block.type === 'missing_documents' && 'Documents Manquants'}
                              {block.type === 'vigilance' && 'Devoir de Vigilance'}
                              {block.type === 'pallets' && 'Palettes Europe'}
                              {block.type === 'late' && 'Retard'}
                              {block.type === 'manual' && 'Blocage Manuel'}
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.8 }}>{block.reason}</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>
                              Depuis le {new Date(block.blockedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <button
                            style={buttonDangerStyle}
                            onClick={() => unblock(pref.prefacturationId, 'Deblocage manuel')}
                            disabled={isLoading}
                          >
                            Lever le blocage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {prefacturations.filter(p => p.blocks?.some(b => b.active)).length === 0 && (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucun blocage actif.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
              {/* ERP Config */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>Configuration ERP</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Systeme ERP</label>
                    <select
                      style={inputStyle}
                      value={erpConfig.system}
                      onChange={(e) => setErpConfig({ ...erpConfig, system: e.target.value })}
                    >
                      <option value="generic_api">API Generique (JSON)</option>
                      <option value="sap">SAP (FI/CO)</option>
                      <option value="oracle">Oracle E-Business Suite</option>
                      <option value="sage_x3">Sage X3</option>
                      <option value="divalto">Divalto</option>
                      <option value="dynamics_365">Microsoft Dynamics 365</option>
                      <option value="odoo">Odoo ERP</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Endpoint API</label>
                    <input
                      style={inputStyle}
                      placeholder="https://erp.example.com/api/invoices"
                      value={erpConfig.endpoint}
                      onChange={(e) => setErpConfig({ ...erpConfig, endpoint: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Code Societe</label>
                    <input
                      style={inputStyle}
                      placeholder="1000"
                      value={erpConfig.companyCode}
                      onChange={(e) => setErpConfig({ ...erpConfig, companyCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Centre de Cout</label>
                    <input
                      style={inputStyle}
                      placeholder="TRANS-001"
                      value={erpConfig.costCenter}
                      onChange={(e) => setErpConfig({ ...erpConfig, costCenter: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Ready for Export */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>Factures Prates pour Export</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {prefacturations.filter(p => p.status === 'finalized').map(pref => (
                    <div key={pref.prefacturationId} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{pref.finalInvoice?.invoiceNumber || pref.orderId}</div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>{pref.transporterName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '700' }}>{pref.calculation?.totalTTC?.toFixed(2)} EUR</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>
                              {pref.finalInvoice?.generatedAt && new Date(pref.finalInvoice.generatedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{ ...buttonSecondaryStyle, padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => downloadPDF(pref.prefacturationId)}
                            >
                              PDF
                            </button>
                            <button
                              style={{ ...buttonSuccessStyle, padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => exportToERP(pref.prefacturationId)}
                              disabled={isLoading}
                            >
                              Exporter
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {prefacturations.filter(p => p.status === 'finalized').length === 0 && (
                    <div style={cardStyle}>
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucune facture prete pour export.</p>
                    </div>
                  )}
                </div>

                <h3 style={{ margin: '32px 0 16px' }}>Factures Deja Exportees</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {prefacturations.filter(p => p.status === 'exported').map(pref => (
                    <div key={pref.prefacturationId} style={{ ...cardStyle, background: 'rgba(0,208,132,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{pref.finalInvoice?.invoiceNumber}</div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>
                            Exporte le {pref.finalInvoice?.erpExportDate && new Date(pref.finalInvoice.erpExportDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <span style={{ padding: '4px 12px', background: 'rgba(0,208,132,0.3)', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {pref.finalInvoice?.erpSystem || 'ERP'}
                        </span>
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

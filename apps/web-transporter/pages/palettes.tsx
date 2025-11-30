/**
 * Page Economie Circulaire des Palettes Europe - Portail Transporteur
 * Integration complete avec palettes-circular-api v1.1.0
 *
 * Fonctionnalites Transporteur:
 * - Emission de cheques-palette avec QR code
 * - Depot de palettes sur sites de restitution
 * - Consultation du grand livre (dettes/credits)
 * - Matching IA pour trouver les meilleurs sites
 * - Gestion des litiges
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
  matchingInfo?: {
    matchedBySuggestion: boolean;
    suggestionRank: number;
    distanceKm: number;
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
    coordinates: { latitude: number; longitude: number };
  };
  distance: number;
  quotaRemaining: number;
  matchingScore: number;
  openingHours: { open: string; close: string };
}

interface Dispute {
  disputeId: string;
  chequeId: string;
  type: string;
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
  };
}

export default function PalettesCircularPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_PALETTES_API_URL || 'http://localhost:3000';

  // State
  const [activeTab, setActiveTab] = useState<'cheques' | 'ledger' | 'matching' | 'disputes' | 'emit'>('cheques');
  const [cheques, setCheques] = useState<PalletCheque[]>([]);
  const [ledger, setLedger] = useState<PalletLedger | null>(null);
  const [suggestedSites, setSuggestedSites] = useState<Site[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedCheque, setSelectedCheque] = useState<PalletCheque | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new cheque
  const [newCheque, setNewCheque] = useState({
    orderId: '',
    palletType: 'EURO_EPAL',
    quantity: 1,
    vehiclePlate: '',
    driverName: '',
    destinationSiteId: ''
  });

  // Matching form
  const [matchingForm, setMatchingForm] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    quantity: 10,
    palletType: 'EURO_EPAL',
    radiusKm: 30
  });

  const companyId = 'TRANS-001'; // TODO: Get from auth context

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCheques();
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
  const loadCheques = async () => {
    try {
      const result = await apiCall(`/api/palettes/cheques?transporterId=${companyId}&limit=50`);
      setCheques(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement cheques:', err.message);
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

  // Emit cheque
  const emitCheque = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/palettes/cheques', 'POST', {
        ...newCheque,
        transporterId: companyId,
        transporterName: 'Transport Express'
      });
      setSuccess('Cheque-palette emis avec succes!');
      setCheques([result.data, ...cheques]);
      setSelectedCheque(result.data);
      setActiveTab('cheques');
      setNewCheque({ orderId: '', palletType: 'EURO_EPAL', quantity: 1, vehiclePlate: '', driverName: '', destinationSiteId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit cheque
  const depositCheque = async (chequeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const result = await apiCall(`/api/palettes/cheques/${chequeId}/deposit`, 'POST', {
        geolocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });
      setSuccess('Cheque depose avec succes!');
      loadCheques();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Find matching sites
  const findMatchingSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/api/palettes/matching/find-sites', 'POST', {
        deliveryLocation: {
          latitude: matchingForm.latitude,
          longitude: matchingForm.longitude
        },
        transporterId: companyId,
        quantity: matchingForm.quantity,
        palletType: matchingForm.palletType,
        radiusKm: matchingForm.radiusKm
      });
      setSuggestedSites(result.data.suggestions || []);
      if (result.data.suggestions?.length === 0) {
        setError('Aucun site disponible dans ce rayon');
      }
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
    transition: 'all 0.2s'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '14px',
    outline: 'none'
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
    transition: 'all 0.2s'
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

  return (
    <>
      <Head>
        <title>Economie Circulaire Palettes - Transporteur | SYMPHONI.A</title>
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
              🏗️ Economie Circulaire Palettes
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'cheques')} onClick={() => setActiveTab('cheques')}>
              Mes Cheques
            </button>
            <button style={tabStyle(activeTab === 'emit')} onClick={() => setActiveTab('emit')}>
              + Emettre
            </button>
            <button style={tabStyle(activeTab === 'ledger')} onClick={() => setActiveTab('ledger')}>
              Grand Livre
            </button>
            <button style={tabStyle(activeTab === 'matching')} onClick={() => setActiveTab('matching')}>
              Matching IA
            </button>
            <button style={tabStyle(activeTab === 'disputes')} onClick={() => setActiveTab('disputes')}>
              Litiges ({disputes.filter(d => d.status !== 'resolu').length})
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

          {/* Tab: Cheques List */}
          {activeTab === 'cheques' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedCheque ? '1fr 400px' : '1fr', gap: '24px' }}>
              <div>
                <h2 style={{ marginBottom: '16px' }}>Mes Cheques-Palette ({cheques.length})</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {cheques.length === 0 ? (
                    <div style={cardStyle}>
                      <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun cheque emis. Cliquez sur "+ Emettre" pour creer votre premier cheque-palette.</p>
                    </div>
                  ) : cheques.map(cheque => (
                    <div
                      key={cheque.chequeId}
                      style={{ ...cardStyle, cursor: 'pointer', border: selectedCheque?.chequeId === cheque.chequeId ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)' }}
                      onClick={() => setSelectedCheque(cheque)}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Cheque</div>
                          <div style={{ fontWeight: '700' }}>{cheque.chequeId}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Destination</div>
                          <div style={{ fontWeight: '600' }}>{cheque.destinationSiteName || cheque.destinationSiteId}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Quantite</div>
                          <div style={{ fontSize: '20px', fontWeight: '800' }}>{cheque.quantity} {cheque.palletType}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Statut</div>
                          <div style={{ fontWeight: '700', color: getStatusColor(cheque.status) }}>{cheque.status}</div>
                        </div>
                        {cheque.status === 'EMIS' && (
                          <button
                            style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); depositCheque(cheque.chequeId); }}
                            disabled={isLoading}
                          >
                            Deposer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Panel */}
              {selectedCheque && (
                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>QR Code Cheque</h3>
                  {selectedCheque.qrCode && (
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <img src={selectedCheque.qrCode} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '8px' }} />
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div><strong>ID:</strong> {selectedCheque.chequeId}</div>
                    <div><strong>Commande:</strong> {selectedCheque.orderId || 'N/A'}</div>
                    <div><strong>Type:</strong> {selectedCheque.palletType}</div>
                    <div><strong>Quantite:</strong> {selectedCheque.quantity}</div>
                    <div><strong>Vehicule:</strong> {selectedCheque.vehiclePlate}</div>
                    <div><strong>Chauffeur:</strong> {selectedCheque.driverName}</div>
                    <div><strong>Destination:</strong> {selectedCheque.destinationSiteName}</div>
                    <div><strong>Statut:</strong> <span style={{ color: getStatusColor(selectedCheque.status) }}>{selectedCheque.status}</span></div>
                    <div><strong>Emis le:</strong> {new Date(selectedCheque.timestamps.emittedAt).toLocaleString('fr-FR')}</div>
                    {selectedCheque.timestamps.depositedAt && (
                      <div><strong>Depose le:</strong> {new Date(selectedCheque.timestamps.depositedAt).toLocaleString('fr-FR')}</div>
                    )}
                    {selectedCheque.matchingInfo?.matchedBySuggestion && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(102, 126, 234, 0.2)', borderRadius: '8px' }}>
                        ✨ Site suggere par Matching IA (rang #{selectedCheque.matchingInfo.suggestionRank}, {selectedCheque.matchingInfo.distanceKm}km)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Emit Cheque */}
          {activeTab === 'emit' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={cardStyle}>
                <h2 style={{ marginBottom: '24px' }}>Emettre un Cheque-Palette</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Reference Commande</label>
                    <input
                      style={inputStyle}
                      placeholder="ORD-2024-001"
                      value={newCheque.orderId}
                      onChange={(e) => setNewCheque({ ...newCheque, orderId: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Type Palette</label>
                      <select
                        style={inputStyle}
                        value={newCheque.palletType}
                        onChange={(e) => setNewCheque({ ...newCheque, palletType: e.target.value })}
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
                        value={newCheque.quantity}
                        onChange={(e) => setNewCheque({ ...newCheque, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Immatriculation</label>
                      <input
                        style={inputStyle}
                        placeholder="AB-123-CD"
                        value={newCheque.vehiclePlate}
                        onChange={(e) => setNewCheque({ ...newCheque, vehiclePlate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Nom Chauffeur</label>
                      <input
                        style={inputStyle}
                        placeholder="Jean Dupont"
                        value={newCheque.driverName}
                        onChange={(e) => setNewCheque({ ...newCheque, driverName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Site de Destination</label>
                    <input
                      style={inputStyle}
                      placeholder="SITE-XXXXX ou utilisez le Matching IA"
                      value={newCheque.destinationSiteId}
                      onChange={(e) => setNewCheque({ ...newCheque, destinationSiteId: e.target.value })}
                    />
                    <button
                      style={{ ...buttonStyle, marginTop: '8px', background: 'rgba(255,255,255,0.2)', width: '100%' }}
                      onClick={() => setActiveTab('matching')}
                    >
                      🔍 Trouver un site avec Matching IA
                    </button>
                  </div>
                  <button
                    style={{ ...buttonStyle, width: '100%', marginTop: '16px' }}
                    onClick={emitCheque}
                    disabled={isLoading || !newCheque.destinationSiteId}
                  >
                    {isLoading ? 'Emission en cours...' : '✅ Emettre le Cheque-Palette'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Ledger */}
          {activeTab === 'ledger' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Grand Livre - Solde Palettes</h2>
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

          {/* Tab: Matching IA */}
          {activeTab === 'matching' && (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>🤖 Matching IA - Affret IA</h3>
                <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
                  Trouvez les meilleurs sites de restitution selon la distance, les quotas disponibles et les priorites.
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Latitude</label>
                      <input
                        style={inputStyle}
                        type="number"
                        step="0.0001"
                        value={matchingForm.latitude}
                        onChange={(e) => setMatchingForm({ ...matchingForm, latitude: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Longitude</label>
                      <input
                        style={inputStyle}
                        type="number"
                        step="0.0001"
                        value={matchingForm.longitude}
                        onChange={(e) => setMatchingForm({ ...matchingForm, longitude: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <button
                    style={{ ...buttonStyle, background: 'rgba(255,255,255,0.2)', width: '100%' }}
                    onClick={() => {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setMatchingForm({ ...matchingForm, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                      });
                    }}
                  >
                    📍 Ma position actuelle
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Quantite</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min="1"
                        value={matchingForm.quantity}
                        onChange={(e) => setMatchingForm({ ...matchingForm, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Rayon (km)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min="5"
                        max="100"
                        value={matchingForm.radiusKm}
                        onChange={(e) => setMatchingForm({ ...matchingForm, radiusKm: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Type Palette</label>
                    <select
                      style={inputStyle}
                      value={matchingForm.palletType}
                      onChange={(e) => setMatchingForm({ ...matchingForm, palletType: e.target.value })}
                    >
                      <option value="EURO_EPAL">EURO EPAL</option>
                      <option value="EURO_EPAL_2">EURO EPAL 2</option>
                      <option value="DEMI_PALETTE">Demi-Palette</option>
                      <option value="PALETTE_PERDUE">Palette Perdue</option>
                    </select>
                  </div>
                  <button
                    style={{ ...buttonStyle, width: '100%' }}
                    onClick={findMatchingSites}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Recherche...' : '🔍 Trouver les meilleurs sites'}
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '16px' }}>Sites Suggeres ({suggestedSites.length})</h3>
                {suggestedSites.length === 0 ? (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Lancez une recherche pour voir les sites disponibles</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {suggestedSites.map((site, idx) => (
                      <div key={site.siteId} style={{ ...cardStyle, border: idx === 0 ? '2px solid #00D084' : '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '24px', fontWeight: '800', color: idx === 0 ? '#00D084' : '#667eea' }}>#{idx + 1}</span>
                              <span style={{ fontWeight: '700', fontSize: '16px' }}>{site.siteName}</span>
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>{site.address.city} ({site.address.postalCode})</div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginTop: '8px' }}>
                              <span>📍 {site.distance} km</span>
                              <span>📦 {site.quotaRemaining} places</span>
                              <span>⭐ Score: {site.matchingScore}/100</span>
                              <span>🕐 {site.openingHours?.open} - {site.openingHours?.close}</span>
                            </div>
                          </div>
                          <button
                            style={buttonStyle}
                            onClick={() => {
                              setNewCheque({ ...newCheque, destinationSiteId: site.siteId });
                              setActiveTab('emit');
                            }}
                          >
                            Selectionner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Disputes */}
          {activeTab === 'disputes' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Mes Litiges ({disputes.length})</h2>
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
                              style={{ ...buttonStyle, background: '#e74c3c' }}
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
          )}

        </div>
      </div>
    </>
  );
}

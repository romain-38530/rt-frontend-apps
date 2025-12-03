import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../lib/api';

interface PricingGrid {
  gridId: string;
  name: string;
  description: string;
  carrierId: string;
  transportType: string;
  calculationType: string;
  status: string;
  basePricing: {
    basePrice: number;
    pricePerKm: number;
    pricePerKg: number;
    minimumPrice: number;
    currency: string;
  };
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  carrier?: { companyName: string };
}

export default function PricingGridsPage() {
  const router = useRouter();
  const apiUrl = API_CONFIG.SUBSCRIPTIONS_PRICING_API;

  const [grids, setGrids] = useState<PricingGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [transportTypes, setTransportTypes] = useState<any>({});
  const [selectedGrid, setSelectedGrid] = useState<PricingGrid | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    carrierId: '',
    transportType: 'FTL',
    calculationType: 'PER_KM',
    basePrice: 150,
    pricePerKm: 1.5,
    pricePerKg: 0.02,
    minimumPrice: 100
  });

  const apiCall = useCallback(async (endpoint: string, method = 'GET', body?: any) => {
    const token = getAuthToken();
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${apiUrl}${endpoint}`, options);
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'API Error');
    return data;
  }, [apiUrl]);

  const loadGrids = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/pricing-grids');
      setGrids(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTransportTypes = async () => {
    try {
      const data = await apiCall('/api/pricing-grids/types/transport');
      setTransportTypes(data.data || {});
    } catch (err: any) {
      console.error('Error loading transport types:', err);
    }
  };

  const createGrid = async () => {
    if (!formData.name || !formData.carrierId) {
      setError('Nom et ID transporteur requis');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        carrierId: formData.carrierId,
        industrialId: 'demo-industrie-org',
        transportType: formData.transportType,
        calculationType: formData.calculationType,
        basePricing: {
          basePrice: formData.basePrice,
          pricePerKm: formData.pricePerKm,
          pricePerKg: formData.pricePerKg,
          minimumPrice: formData.minimumPrice,
          currency: 'EUR'
        },
        createdBy: 'demo-industrie'
      };
      const data = await apiCall('/api/pricing-grids', 'POST', payload);
      setSuccessMsg(`Grille ${data.data.name} creee`);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', carrierId: '', transportType: 'FTL', calculationType: 'PER_KM', basePrice: 150, pricePerKm: 1.5, pricePerKg: 0.02, minimumPrice: 100 });
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activateGrid = async (gridId: string) => {
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}/activate`, 'POST', { activatedBy: 'demo-industrie' });
      setSuccessMsg('Grille activee');
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const suspendGrid = async (gridId: string) => {
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}/suspend`, 'POST', { suspendedBy: 'demo-industrie', reason: 'Suspension manuelle' });
      setSuccessMsg('Grille suspendue');
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteGrid = async (gridId: string) => {
    if (!confirm('Supprimer cette grille ?')) return;
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}`, 'DELETE');
      setSuccessMsg('Grille supprimee');
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadGrids();
    loadTransportTypes();
  }, [router]);

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => { setError(null); setSuccessMsg(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  const cardStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '20px' };
  const buttonStyle = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const, marginRight: '10px', marginBottom: '10px' };
  const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '100%', marginBottom: '10px' };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#00D084';
      case 'DRAFT': return '#f39c12';
      case 'SUSPENDED': return '#e74c3c';
      case 'ARCHIVED': return '#95a5a6';
      default: return '#667eea';
    }
  };

  return (
    <>
      <Head><title>Grilles Tarifaires | SYMPHONI.A</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Retour</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📋</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Grilles Tarifaires</h1>
            </div>
          </div>
          <button style={buttonStyle} onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Annuler' : '+ Nouvelle Grille'}
          </button>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.3)', padding: '15px 40px' }}>{error}</div>}
        {successMsg && <div style={{ background: 'rgba(0,255,0,0.2)', padding: '15px 40px' }}>{successMsg}</div>}

        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>}

          {showCreateForm && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Nouvelle Grille Tarifaire</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Nom de la grille *</label>
                  <input style={inputStyle} placeholder="Ex: Tarif Standard 2024" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>ID Transporteur *</label>
                  <input style={inputStyle} placeholder="Ex: CARRIER-001" value={formData.carrierId} onChange={e => setFormData({ ...formData, carrierId: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Type de transport</label>
                  <select style={{ ...inputStyle, background: 'rgba(30,30,50,0.8)' }} value={formData.transportType} onChange={e => setFormData({ ...formData, transportType: e.target.value })}>
                    <option value="FTL">Camion complet (FTL)</option>
                    <option value="LTL">Groupage (LTL)</option>
                    <option value="EXPRESS">Express</option>
                    <option value="FRIGO">Frigorifique</option>
                    <option value="ADR">Matieres dangereuses (ADR)</option>
                    <option value="HAYON">Avec hayon</option>
                    <option value="MESSAGERIE">Messagerie</option>
                    <option value="PALETTE">Palette</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Prix de base (EUR)</label>
                  <input style={inputStyle} type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Prix / km (EUR)</label>
                  <input style={inputStyle} type="number" step="0.01" value={formData.pricePerKm} onChange={e => setFormData({ ...formData, pricePerKm: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Prix minimum (EUR)</label>
                  <input style={inputStyle} type="number" value={formData.minimumPrice} onChange={e => setFormData({ ...formData, minimumPrice: parseFloat(e.target.value) })} />
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Description</label>
                  <input style={inputStyle} placeholder="Description de la grille" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
              <button style={buttonStyle} onClick={createGrid}>Creer la grille</button>
            </div>
          )}

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Mes Grilles Tarifaires ({grids.length})</h3>
            </div>

            {grids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div>Aucune grille tarifaire</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Cliquez sur "Nouvelle Grille" pour commencer</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {grids.map(grid => (
                  <div key={grid.gridId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '16px' }}>{grid.name}</strong>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: `${getStatusColor(grid.status)}30`, color: getStatusColor(grid.status) }}>
                            {grid.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>
                          {grid.description || 'Aucune description'}
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                          <div><span style={{ opacity: 0.6 }}>Type:</span> {grid.transportType}</div>
                          <div><span style={{ opacity: 0.6 }}>Base:</span> {grid.basePricing?.basePrice} EUR</div>
                          <div><span style={{ opacity: 0.6 }}>Par km:</span> {grid.basePricing?.pricePerKm} EUR</div>
                          <div><span style={{ opacity: 0.6 }}>Min:</span> {grid.basePricing?.minimumPrice} EUR</div>
                          <div><span style={{ opacity: 0.6 }}>Transporteur:</span> {grid.carrierId}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {grid.status === 'DRAFT' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(0,208,132,0.6)' }} onClick={() => activateGrid(grid.gridId)}>Activer</button>
                        )}
                        {grid.status === 'ACTIVE' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(243,156,18,0.6)' }} onClick={() => suspendGrid(grid.gridId)}>Suspendre</button>
                        )}
                        {grid.status === 'DRAFT' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(231,76,60,0.6)' }} onClick={() => deleteGrid(grid.gridId)}>Supprimer</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Calculateur de Prix</h3>
            <p style={{ opacity: 0.7, marginBottom: '20px' }}>Estimez le cout d'un transport selon vos grilles tarifaires</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Distance (km)</label>
                <input style={inputStyle} type="number" placeholder="Ex: 450" />
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Poids (kg)</label>
                <input style={inputStyle} type="number" placeholder="Ex: 15000" />
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Volume (m3)</label>
                <input style={inputStyle} type="number" placeholder="Ex: 80" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button style={buttonStyle}>Calculer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

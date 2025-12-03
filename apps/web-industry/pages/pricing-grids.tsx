import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../lib/api';

interface PalletTier {
  min: number;
  max: number;
  pricePerPallet: number;
}

interface ZonePricing {
  zoneOrigin: string;
  zoneDestination: string;
  palletTiers?: PalletTier[];
  vehicleType?: string;
  flatRate?: number;
  pricePerKm?: number;
  minKm?: number;
  minimumPrice: number;
  transitDays: number;
}

interface WeightTier {
  minKg: number;
  maxKg: number;
  price: number;
}

interface DepartmentPricing {
  departmentOrigin: string;
  departmentDestination: string;
  weightTiers: WeightTier[];
  minimumPrice: number;
  transitDays: number;
}

interface PricingGrid {
  gridId: string;
  name: string;
  description: string;
  carrierId: string;
  transportType: string;
  calculationType: string;
  status: string;
  ltlPricing?: { zonePricing: ZonePricing[] };
  ftlPricing?: { zonePricing: ZonePricing[] };
  messageriePricing?: { volumetricDivisor: number; departmentPricing: DepartmentPricing[] };
  basePricing?: {
    basePrice: number;
    pricePerKm: number;
    pricePerKg: number;
    minimumPrice: number;
    currency: string;
  };
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  importedFrom?: { type: string; fileName: string };
  carrier?: { companyName: string };
}

const ZONES = {
  IDF: 'Île-de-France', ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté',
  BRE: 'Bretagne', CVL: 'Centre-Val de Loire', GES: 'Grand Est',
  HDF: 'Hauts-de-France', NOR: 'Normandie', NAQ: 'Nouvelle-Aquitaine',
  OCC: 'Occitanie', PDL: 'Pays de la Loire', PAC: "Provence-Alpes-Côte d'Azur",
  COR: 'Corse', BE: 'Belgique', LU: 'Luxembourg', DE: 'Allemagne',
  ES: 'Espagne', IT: 'Italie', NL: 'Pays-Bas', CH: 'Suisse'
};

export default function PricingGridsPage() {
  const router = useRouter();
  const apiUrl = API_CONFIG.SUBSCRIPTIONS_PRICING_API;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [grids, setGrids] = useState<PricingGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState<PricingGrid | null>(null);
  const [filterType, setFilterType] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    carrierId: '',
    transportType: 'LTL',
    calculationType: 'PER_PALLET'
  });

  const [importData, setImportData] = useState({
    gridName: '',
    carrierId: '',
    transportType: 'LTL',
    file: null as File | null
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
      let endpoint = '/api/pricing-grids';
      if (filterType) endpoint += `?transportType=${filterType}`;
      const data = await apiCall(endpoint);
      setGrids(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        createdBy: 'demo-industrie'
      };
      const data = await apiCall('/api/pricing-grids', 'POST', payload);
      setSuccessMsg(`Grille ${data.data.name} creee`);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', carrierId: '', transportType: 'LTL', calculationType: 'PER_PALLET' });
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const importExcel = async () => {
    if (!importData.file || !importData.gridName || !importData.carrierId) {
      setError('Fichier, nom de grille et transporteur requis');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const formDataObj = new FormData();
      formDataObj.append('file', importData.file);
      formDataObj.append('gridName', importData.gridName);
      formDataObj.append('carrierId', importData.carrierId);
      formDataObj.append('industrialId', 'demo-industrie-org');
      formDataObj.append('transportType', importData.transportType);
      formDataObj.append('importedBy', 'demo-industrie');

      const response = await fetch(`${apiUrl}/api/pricing-grids/import/excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message || 'Import failed');

      setSuccessMsg(`Grille importee: ${data.importStats?.rowsProcessed || 0} lignes, ${data.importStats?.zonesCreated || 0} zones`);
      setShowImportModal(false);
      setImportData({ gridName: '', carrierId: '', transportType: 'LTL', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/pricing-grids/import/template/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${type.toLowerCase()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
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
      setSelectedGrid(null);
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
  }, [router, filterType]);

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => { setError(null); setSuccessMsg(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  const cardStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '20px' };
  const buttonStyle = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const, marginRight: '10px', marginBottom: '10px' };
  const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '100%', marginBottom: '10px' };
  const selectStyle = { ...inputStyle, background: 'rgba(30,30,50,0.8)' };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#00D084';
      case 'DRAFT': return '#f39c12';
      case 'SUSPENDED': return '#e74c3c';
      case 'ARCHIVED': return '#95a5a6';
      default: return '#667eea';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LTL': return '📦';
      case 'FTL': return '🚛';
      case 'MESSAGERIE': return '📬';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LTL': return 'Groupage (palette)';
      case 'FTL': return 'Lot complet';
      case 'MESSAGERIE': return 'Messagerie (poids)';
      default: return type;
    }
  };

  const renderGridDetails = (grid: PricingGrid) => {
    if (grid.transportType === 'LTL' && grid.ltlPricing?.zonePricing?.length) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.8 }}>Tarifs par zone ({grid.ltlPricing.zonePricing.length} zones)</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Origine</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Destination</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Paliers</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Delai</th>
                </tr>
              </thead>
              <tbody>
                {grid.ltlPricing.zonePricing.slice(0, 5).map((zone, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px' }}>{ZONES[zone.zoneOrigin as keyof typeof ZONES] || zone.zoneOrigin}</td>
                    <td style={{ padding: '8px' }}>{ZONES[zone.zoneDestination as keyof typeof ZONES] || zone.zoneDestination}</td>
                    <td style={{ padding: '8px' }}>
                      {zone.palletTiers?.map((t, i) => (
                        <span key={i} style={{ display: 'inline-block', background: 'rgba(102,126,234,0.3)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px', fontSize: '11px' }}>
                          {t.min}-{t.max}p: {t.pricePerPallet}EUR
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{zone.transitDays}j</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {grid.ltlPricing.zonePricing.length > 5 && (
              <div style={{ textAlign: 'center', padding: '8px', opacity: 0.7, fontSize: '12px' }}>
                +{grid.ltlPricing.zonePricing.length - 5} autres zones...
              </div>
            )}
          </div>
        </div>
      );
    }

    if (grid.transportType === 'FTL' && grid.ftlPricing?.zonePricing?.length) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.8 }}>Tarifs lot complet ({grid.ftlPricing.zonePricing.length} zones)</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Origine</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Destination</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Vehicule</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {grid.ftlPricing.zonePricing.slice(0, 5).map((zone, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px' }}>{ZONES[zone.zoneOrigin as keyof typeof ZONES] || zone.zoneOrigin}</td>
                    <td style={{ padding: '8px' }}>{ZONES[zone.zoneDestination as keyof typeof ZONES] || zone.zoneDestination}</td>
                    <td style={{ padding: '8px' }}>{zone.vehicleType || 'SEMI'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {zone.flatRate ? `${zone.flatRate} EUR` : `${zone.pricePerKm} EUR/km`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (grid.transportType === 'MESSAGERIE' && grid.messageriePricing?.departmentPricing?.length) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.8 }}>
            Tarifs messagerie ({grid.messageriePricing.departmentPricing.length} relations dept)
            <span style={{ fontWeight: 'normal', opacity: 0.7 }}> - Diviseur vol: {grid.messageriePricing.volumetricDivisor}</span>
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Dept. Origine</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Dept. Dest.</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Paliers poids</th>
                </tr>
              </thead>
              <tbody>
                {grid.messageriePricing.departmentPricing.slice(0, 5).map((dept, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px' }}>{dept.departmentOrigin}</td>
                    <td style={{ padding: '8px' }}>{dept.departmentDestination}</td>
                    <td style={{ padding: '8px' }}>
                      {dept.weightTiers?.map((t, i) => (
                        <span key={i} style={{ display: 'inline-block', background: 'rgba(102,126,234,0.3)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px', fontSize: '11px' }}>
                          {t.minKg}-{t.maxKg}kg: {t.price}EUR
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginTop: '15px', opacity: 0.7, fontSize: '13px' }}>
        Aucun tarif configure. Importez un fichier Excel pour ajouter des tarifs.
      </div>
    );
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ ...buttonStyle, background: 'rgba(0,208,132,0.6)' }} onClick={() => setShowImportModal(true)}>
              📥 Importer Excel
            </button>
            <button style={buttonStyle} onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Annuler' : '+ Nouvelle Grille'}
            </button>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.3)', padding: '15px 40px' }}>{error}</div>}
        {successMsg && <div style={{ background: 'rgba(0,255,0,0.2)', padding: '15px 40px' }}>{successMsg}</div>}

        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>}

          {/* Filtres */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 24px' }}>
            <span style={{ opacity: 0.7 }}>Filtrer par type:</span>
            <button
              style={{ ...buttonStyle, background: filterType === '' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', padding: '6px 16px' }}
              onClick={() => setFilterType('')}
            >Tous</button>
            <button
              style={{ ...buttonStyle, background: filterType === 'LTL' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', padding: '6px 16px' }}
              onClick={() => setFilterType('LTL')}
            >📦 LTL (Groupage)</button>
            <button
              style={{ ...buttonStyle, background: filterType === 'FTL' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', padding: '6px 16px' }}
              onClick={() => setFilterType('FTL')}
            >🚛 FTL (Complet)</button>
            <button
              style={{ ...buttonStyle, background: filterType === 'MESSAGERIE' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', padding: '6px 16px' }}
              onClick={() => setFilterType('MESSAGERIE')}
            >📬 Messagerie</button>
          </div>

          {/* Formulaire de creation */}
          {showCreateForm && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Nouvelle Grille Tarifaire</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Nom de la grille *</label>
                  <input style={inputStyle} placeholder="Ex: Tarif LTL 2024" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>ID Transporteur *</label>
                  <input style={inputStyle} placeholder="Ex: CARRIER-001" value={formData.carrierId} onChange={e => setFormData({ ...formData, carrierId: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Type de transport</label>
                  <select style={selectStyle} value={formData.transportType} onChange={e => {
                    const type = e.target.value;
                    let calcType = 'PER_PALLET';
                    if (type === 'FTL') calcType = 'FLAT_RATE';
                    if (type === 'MESSAGERIE') calcType = 'PER_WEIGHT';
                    setFormData({ ...formData, transportType: type, calculationType: calcType });
                  }}>
                    <option value="LTL">📦 Groupage (LTL) - par palette</option>
                    <option value="FTL">🚛 Lot complet (FTL) - forfait/km</option>
                    <option value="MESSAGERIE">📬 Messagerie - par poids</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 3' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Description</label>
                  <input style={inputStyle} placeholder="Description de la grille" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <button style={buttonStyle} onClick={createGrid}>Creer la grille</button>
                <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '10px' }}>
                  La grille sera creee vide. Importez ensuite un fichier Excel pour ajouter les tarifs.
                </span>
              </div>
            </div>
          )}

          {/* Modal Import Excel */}
          {showImportModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ ...cardStyle, width: '600px', maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>📥 Importer une grille depuis Excel</h3>
                  <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>x</button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Type de grille *</label>
                  <select style={selectStyle} value={importData.transportType} onChange={e => setImportData({ ...importData, transportType: e.target.value })}>
                    <option value="LTL">📦 LTL (Groupage palette)</option>
                    <option value="FTL">🚛 FTL (Lot complet)</option>
                    <option value="MESSAGERIE">📬 Messagerie (Dept/Poids)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Nom de la grille *</label>
                  <input style={inputStyle} placeholder="Ex: Tarif Geodis LTL 2024" value={importData.gridName} onChange={e => setImportData({ ...importData, gridName: e.target.value })} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>ID Transporteur *</label>
                  <input style={inputStyle} placeholder="Ex: CARRIER-001" value={importData.carrierId} onChange={e => setImportData({ ...importData, carrierId: e.target.value })} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', opacity: 0.7 }}>Fichier Excel (.xlsx) *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ ...inputStyle, padding: '10px' }}
                    onChange={e => setImportData({ ...importData, file: e.target.files?.[0] || null })}
                  />
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', marginBottom: '10px' }}>Telecharger un template:</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('LTL')}>Template LTL</button>
                    <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('FTL')}>Template FTL</button>
                    <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('MESSAGERIE')}>Template Messagerie</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...buttonStyle, background: 'rgba(0,208,132,0.8)' }} onClick={importExcel}>
                    Importer
                  </button>
                  <button style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowImportModal(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des grilles */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Mes Grilles Tarifaires ({grids.length})</h3>
            </div>

            {grids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div>Aucune grille tarifaire</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Cliquez sur "Nouvelle Grille" ou "Importer Excel" pour commencer</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {grids.map(grid => (
                  <div key={grid.gridId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: selectedGrid?.gridId === grid.gridId ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{getTypeIcon(grid.transportType)}</span>
                          <strong style={{ fontSize: '16px' }}>{grid.name}</strong>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: `${getStatusColor(grid.status)}30`, color: getStatusColor(grid.status) }}>
                            {grid.status}
                          </span>
                          {grid.importedFrom && (
                            <span style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '10px', background: 'rgba(102,126,234,0.3)' }}>
                              📥 {grid.importedFrom.fileName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>
                          {grid.description || 'Aucune description'} | <strong>{getTypeLabel(grid.transportType)}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                          <div><span style={{ opacity: 0.6 }}>Transporteur:</span> {grid.carrierId}</div>
                          <div><span style={{ opacity: 0.6 }}>Cree le:</span> {new Date(grid.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>

                        {/* Details de la grille */}
                        {renderGridDetails(grid)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                        {grid.status === 'DRAFT' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(0,208,132,0.6)', marginRight: 0 }} onClick={() => activateGrid(grid.gridId)}>Activer</button>
                        )}
                        {grid.status === 'ACTIVE' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(243,156,18,0.6)', marginRight: 0 }} onClick={() => suspendGrid(grid.gridId)}>Suspendre</button>
                        )}
                        {grid.status === 'DRAFT' && (
                          <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(231,76,60,0.6)', marginRight: 0 }} onClick={() => deleteGrid(grid.gridId)}>Supprimer</button>
                        )}
                        <button
                          style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', marginRight: 0 }}
                          onClick={() => setSelectedGrid(selectedGrid?.gridId === grid.gridId ? null : grid)}
                        >
                          {selectedGrid?.gridId === grid.gridId ? 'Masquer' : 'Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calculateur de Prix */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Calculateur de Prix</h3>
            <p style={{ opacity: 0.7, marginBottom: '20px' }}>Estimez le cout d'un transport selon vos grilles tarifaires</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Type</label>
                <select style={selectStyle}>
                  <option value="LTL">LTL - Palettes</option>
                  <option value="FTL">FTL - Lot complet</option>
                  <option value="MESSAGERIE">Messagerie</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Zone Origine</label>
                <select style={selectStyle}>
                  {Object.entries(ZONES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Zone Destination</label>
                <select style={selectStyle}>
                  {Object.entries(ZONES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
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

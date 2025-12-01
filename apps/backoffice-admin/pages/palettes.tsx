import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  palettesAdminApi,
  PalletCheque,
  PalletSite,
  PalletLedger,
  PalletDispute,
  PalletSiteQuota,
} from '../lib/api/palettes';

// Dynamic imports for Palettes components (SSR disabled for camera/canvas)
const QRScanner = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.QRScanner),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement scanner...</div> }
);
const SitesMap = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.SitesMap),
  { ssr: false, loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Chargement carte...</div> }
);
const SignatureCapture = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.SignatureCapture),
  { ssr: false }
);
const ChequeExportButton = dynamic<any>(
  () => import('@rt/ui-components').then(mod => mod.ChequeExportButton),
  { ssr: false }
);

type Tab = 'dashboard' | 'cheques' | 'ledgers' | 'sites' | 'disputes' | 'analytics' | 'scan' | 'map';

export default function PalettesAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [sites, setSites] = useState<PalletSite[]>([]);
  const [ledgers, setLedgers] = useState<PalletLedger[]>([]);
  const [disputes, setDisputes] = useState<PalletDispute[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [siteQuota, setSiteQuota] = useState<PalletSiteQuota | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // QR Scanner and Signature states
  const [showSignature, setShowSignature] = useState(false);
  const [signatureForCheque, setSignatureForCheque] = useState<string | null>(null);
  const [scannedChequeId, setScannedChequeId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [sitesData, disputesData] = await Promise.all([
        palettesAdminApi.getSites(),
        palettesAdminApi.getDisputes(),
      ]);

      setSites(sitesData);
      setDisputes(disputesData);

      // Load ledgers for all companies found in sites
      const companyIds = [...new Set(sitesData.map(s => s.companyId))];
      const ledgersData = await palettesAdminApi.getAllLedgers(companyIds);
      setLedgers(ledgersData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSiteQuota(siteId: string) {
    try {
      const { quota } = await palettesAdminApi.getSite(siteId);
      setSiteQuota(quota);
      setSelectedSite(siteId);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateQuota(siteId: string, newQuota: number) {
    try {
      const updated = await palettesAdminApi.updateSiteQuota(siteId, { dailyMax: newQuota });
      setSiteQuota(updated);

      // Reload sites to get updated data
      const sitesData = await palettesAdminApi.getSites();
      setSites(sitesData);

      alert('Quota mis à jour avec succès');
    } catch (e: any) {
      setError(e.message);
    }
  }

  function exportLedgersCSV() {
    const data = ledgers.map(l => ({
      companyId: l.companyId,
      balance: l.balance,
      transactions: l.history.length,
      lastUpdate: l.history[l.history.length - 1]?.date || 'N/A',
    }));
    palettesAdminApi.exportToCSV(data, 'ledgers-palettes.csv');
  }

  function exportSitesCSV() {
    const data = sites.map(s => ({
      id: s.id,
      companyId: s.companyId,
      name: s.name,
      address: s.address,
      quotaDailyMax: s.quotaDailyMax,
      priority: s.priority,
    }));
    palettesAdminApi.exportToCSV(data, 'sites-palettes.csv');
  }

  // Handle QR code scan (admin verification)
  const handleQRScan = useCallback((qrData: string) => {
    let chequeId = qrData;
    try {
      const parsed = JSON.parse(qrData);
      chequeId = parsed.chequeId || parsed.id || qrData;
    } catch {
      // Not JSON, use as-is
    }
    setScannedChequeId(chequeId);
    alert(`Chèque scanné: ${chequeId}\nCe chèque peut maintenant être vérifié dans le système.`);
  }, []);

  // Handle signature capture (admin validation)
  const handleSignatureCapture = useCallback((signatureData: any) => {
    if (!signatureForCheque) return;
    console.log('Admin signature captured for cheque:', signatureForCheque, signatureData);
    alert(`Signature admin enregistrée pour le chèque ${signatureForCheque}`);
    setShowSignature(false);
    setSignatureForCheque(null);
  }, [signatureForCheque]);

  // Convert sites to map format
  const mapSites = sites.map((site, index) => ({
    id: site.id,
    name: site.name,
    address: site.address,
    latitude: (site as any).latitude || 48.8566 + (index * 0.02),
    longitude: (site as any).longitude || 2.3522 + (index * 0.02),
    type: 'admin' as const,
    capacity: site.quotaDailyMax,
    currentStock: 0,
    openingHours: `${site.openingHours?.start || '08:00'} - ${site.openingHours?.end || '18:00'}`,
    isOpen: true
  }));

  // Calculate KPIs
  const kpis = {
    totalSites: sites.length,
    totalLedgers: ledgers.length,
    totalDisputes: disputes.length,
    openDisputes: disputes.filter(d => d.status === 'OPEN').length,
    totalPallets: ledgers.reduce((sum, l) => sum + Math.abs(l.balance), 0),
    positiveBalances: ledgers.filter(l => l.balance > 0).length,
    negativeBalances: ledgers.filter(l => l.balance < 0).length,
  };

  // Top companies with highest balances (positive and negative)
  const topPositiveBalances = [...ledgers]
    .filter(l => l.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  const topNegativeBalances = [...ledgers]
    .filter(l => l.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 5);

  // Sites utilization
  const sitesWithQuota = sites.map(s => {
    // On ne peut pas récupérer quotaConsumed facilement sans faire des appels supplémentaires
    // On va simuler avec 0 pour l'instant
    return { ...s, quotaConsumed: 0 };
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Administration Palettes Europe</h1>
        <p style={{ opacity: 0.8 }}>
          Gestion centralisée des chèques palettes, sites de retour, ledgers et litiges
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: 8, borderBottom: '2px solid #eee', marginBottom: 24, flexWrap: 'wrap' }}>
        {(['dashboard', 'cheques', 'ledgers', 'sites', 'disputes', 'analytics', 'scan', 'map'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeTab === tab ? '#0a66ff' : 'transparent',
              color: activeTab === tab ? '#fff' : '#333',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {error && (
        <div style={{ padding: 16, background: '#fee', color: '#c00', borderRadius: 8, marginBottom: 16 }}>
          Erreur: {error}
        </div>
      )}

      {loading && <div style={{ padding: 16, textAlign: 'center' }}>Chargement...</div>}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Tableau de bord</h2>

          {/* KPIs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0a66ff' }}>{kpis.totalSites}</div>
              <div style={{ opacity: 0.8 }}>Sites de retour</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0a66ff' }}>{kpis.totalLedgers}</div>
              <div style={{ opacity: 0.8 }}>Entreprises</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0a66ff' }}>{kpis.totalPallets}</div>
              <div style={{ opacity: 0.8 }}>Palettes en circulation</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fee' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#c00' }}>{kpis.openDisputes}</div>
              <div style={{ opacity: 0.8 }}>Litiges ouverts</div>
            </div>
          </div>

          {/* Top Balances */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, color: '#080' }}>
                Plus gros crédits (palettes en stock)
              </h3>
              {topPositiveBalances.length === 0 ? (
                <p style={{ opacity: 0.6 }}>Aucun crédit</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {topPositiveBalances.map(l => (
                    <li key={l.companyId} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <strong>{l.companyId}</strong>: +{l.balance} palettes
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, color: '#c00' }}>
                Plus grosses dettes (palettes empruntées)
              </h3>
              {topNegativeBalances.length === 0 ? (
                <p style={{ opacity: 0.6 }}>Aucune dette</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {topNegativeBalances.map(l => (
                    <li key={l.companyId} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <strong>{l.companyId}</strong>: {l.balance} palettes
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            onClick={loadData}
            style={{
              padding: '10px 16px',
              background: '#0a66ff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Rafraîchir les données
          </button>
        </div>
      )}

      {/* CHEQUES TAB */}
      {activeTab === 'cheques' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Chèques Palettes</h2>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>
            Fonctionnalité à venir : Liste complète des chèques générés avec filtres par statut
          </p>
          <div style={{ padding: 16, border: '1px solid #fa0', borderRadius: 8, background: '#fff9e6' }}>
            <strong>Note:</strong> Le service palette ne fournit pas encore d'endpoint pour lister tous les chèques.
            Il faut ajouter GET /palette/admin/cheques dans le service backend.
          </div>
        </div>
      )}

      {/* LEDGERS TAB */}
      {activeTab === 'ledgers' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Ledgers des entreprises</h2>

          <button
            onClick={exportLedgersCSV}
            style={{
              padding: '10px 16px',
              background: '#080',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Exporter CSV
          </button>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Company ID</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Solde (palettes)</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Transactions</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map(l => (
                <tr key={l.companyId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}><strong>{l.companyId}</strong></td>
                  <td
                    style={{
                      padding: 12,
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: l.balance > 0 ? '#080' : l.balance < 0 ? '#c00' : '#666',
                    }}
                  >
                    {l.balance > 0 ? '+' : ''}{l.balance}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{l.history.length}</td>
                  <td style={{ padding: 12 }}>
                    {l.history.length > 0
                      ? new Date(l.history[l.history.length - 1].date).toLocaleString('fr-FR')
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SITES TAB */}
      {activeTab === 'sites' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Sites de retour</h2>

          <button
            onClick={exportSitesCSV}
            style={{
              padding: '10px 16px',
              background: '#080',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Exporter CSV
          </button>

          <div style={{ display: 'grid', gap: 16 }}>
            {sites.map(s => (
              <div key={s.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, margin: 0 }}>{s.name}</h3>
                    <p style={{ margin: '4px 0', opacity: 0.8 }}>{s.address}</p>
                    <p style={{ margin: '4px 0', fontSize: 14 }}>
                      <strong>Propriétaire:</strong> {s.companyId} | <strong>Priorité:</strong> {s.priority}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: 14 }}>
                      <strong>Quota journalier:</strong> {s.quotaDailyMax} palettes
                    </p>
                    <p style={{ margin: '4px 0', fontSize: 14 }}>
                      <strong>Horaires:</strong> {s.openingHours.start} - {s.openingHours.end}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => loadSiteQuota(s.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#0a66ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Gérer quota
                    </button>
                  </div>
                </div>

                {selectedSite === s.id && siteQuota && (
                  <div style={{ marginTop: 16, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>Gestion du quota</h4>
                    <p>
                      <strong>Quota actuel:</strong> {siteQuota.dailyMax} | <strong>Consommé:</strong> {siteQuota.consumed}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                      <input
                        type="number"
                        id={`quota-${s.id}`}
                        defaultValue={siteQuota.dailyMax}
                        style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, width: 100 }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`quota-${s.id}`) as HTMLInputElement;
                          const newQuota = parseInt(input.value, 10);
                          if (newQuota > 0) {
                            updateQuota(s.id, newQuota);
                          }
                        }}
                        style={{
                          padding: '8px 12px',
                          background: '#080',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Litiges</h2>

          {disputes.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucun litige enregistré</p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {disputes.map(d => (
                <div
                  key={d.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                    background: d.status === 'OPEN' ? '#fff9e6' : '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ fontSize: 18, margin: 0 }}>Litige #{d.id}</h3>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Chèque:</strong> {d.chequeId} | <strong>Plaignant:</strong> {d.claimantId}
                      </p>
                      <p style={{ margin: '4px 0' }}><strong>Raison:</strong> {d.reason}</p>
                      <p style={{ margin: '4px 0', fontSize: 14, opacity: 0.8 }}>
                        Créé le {new Date(d.createdAt).toLocaleString('fr-FR')}
                      </p>
                      {d.comments && (
                        <p style={{ margin: '8px 0', fontStyle: 'italic' }}>"{d.comments}"</p>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: d.status === 'OPEN' ? '#fa0' : d.status === 'RESOLVED' ? '#080' : '#666',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {d.status}
                    </div>
                  </div>
                  {d.status === 'OPEN' && (
                    <button
                      onClick={() => alert('Fonctionnalité de résolution à implémenter')}
                      style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: '#080',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Résoudre le litige
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Analytics & Graphiques</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Répartition des soldes */}
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Répartition des soldes</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 'bold', color: '#080' }}>{kpis.positiveBalances}</div>
                  <div style={{ opacity: 0.8 }}>Crédits</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 'bold', color: '#c00' }}>{kpis.negativeBalances}</div>
                  <div style={{ opacity: 0.8 }}>Dettes</div>
                </div>
              </div>
            </div>

            {/* Sites par priorité */}
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Sites par priorité</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['INTERNAL', 'NETWORK', 'EXTERNAL'].map(priority => {
                  const count = sites.filter(s => s.priority === priority).length;
                  return (
                    <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 100 }}>{priority}</div>
                      <div style={{ flex: 1, background: '#eee', borderRadius: 4, height: 24, position: 'relative' }}>
                        <div
                          style={{
                            background: priority === 'INTERNAL' ? '#0a66ff' : priority === 'NETWORK' ? '#080' : '#fa0',
                            height: '100%',
                            borderRadius: 4,
                            width: `${(count / sites.length) * 100}%`,
                          }}
                        />
                      </div>
                      <div style={{ width: 40, textAlign: 'right' }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: 16, border: '1px solid #0a66ff', borderRadius: 8, background: '#f0f8ff' }}>
            <strong>Graphiques avancés:</strong> À venir - Évolution des flux, prédictions IA, heatmap géographique
          </div>
        </div>
      )}

      {/* SCAN TAB */}
      {activeTab === 'scan' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Scanner QR Code - Vérification Admin</h2>
          <p style={{ opacity: 0.8, marginBottom: 24 }}>
            Scannez un chèque-palette pour vérifier son authenticité et son statut dans le système.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Scanner</h3>
              <QRScanner
                onScan={handleQRScan}
                onError={(err: string) => setError(err)}
                scannerStyle="embedded"
              />
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Résultat du scan</h3>
              {scannedChequeId ? (
                <div>
                  <p style={{ marginBottom: 12 }}>
                    <strong>Chèque ID:</strong> {scannedChequeId}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setSignatureForCheque(scannedChequeId);
                        setShowSignature(true);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: '#0a66ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      Valider avec signature
                    </button>
                    <button
                      onClick={() => setScannedChequeId(null)}
                      style={{
                        padding: '10px 16px',
                        background: '#eee',
                        color: '#333',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      Effacer
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ opacity: 0.6 }}>Aucun chèque scanné. Utilisez le scanner à gauche.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAP TAB */}
      {activeTab === 'map' && (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Carte des Sites de Retour</h2>
          <p style={{ opacity: 0.8, marginBottom: 24 }}>
            Visualisation géographique de tous les sites de retour de palettes.
          </p>

          <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', height: 600 }}>
            <SitesMap
              sites={mapSites}
              height={600}
              onSiteSelect={(site: any) => {
                setSelectedSite(site.id);
                setActiveTab('sites');
              }}
              showUserLocation={true}
            />
          </div>
        </div>
      )}

      {/* Export Buttons - Fixed Position */}
      {ledgers.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          gap: 12,
          zIndex: 100
        }}>
          <ChequeExportButton
            cheques={ledgers.map(l => ({
              chequeId: `LEDGER-${l.companyId}`,
              qrCode: '',
              orderId: l.companyId,
              palletType: 'EURO_EPAL',
              quantity: Math.abs(l.balance),
              emitterId: 'ADMIN',
              emitterName: 'Administration',
              receiverId: l.companyId,
              receiverName: l.companyId,
              status: l.balance >= 0 ? 'CREDIT' : 'DEBIT',
              emittedAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }))}
            exportType="pdf"
            variant="primary"
          />
          <ChequeExportButton
            cheques={ledgers.map(l => ({
              chequeId: `LEDGER-${l.companyId}`,
              qrCode: '',
              orderId: l.companyId,
              palletType: 'EURO_EPAL',
              quantity: Math.abs(l.balance),
              emitterId: 'ADMIN',
              emitterName: 'Administration',
              receiverId: l.companyId,
              receiverName: l.companyId,
              status: l.balance >= 0 ? 'CREDIT' : 'DEBIT',
              emittedAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
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
          background: 'rgba(0,0,0,0.7)',
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
            signerName="Administrateur"
            signerRole="validator"
            width={450}
            height={220}
          />
        </div>
      )}
    </div>
  );
}

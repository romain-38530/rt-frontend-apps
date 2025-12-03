import { useState, useEffect } from 'react';
import Head from 'next/head';
import { billingApi } from '../lib/api';
import {
  Euro,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Filter,
  Search,
  Calendar,
  Building2,
  Truck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Clock,
  Archive,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Edit,
  Trash2,
  Shield,
} from 'lucide-react';

// Types
interface Prefacturation {
  _id: string;
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  transporterName: string;
  clientId: string;
  clientName: string;
  status: string;
  orderData: {
    pickupDate: string;
    deliveryDate: string;
    distance: number;
    vehicleType: string;
  };
  options: {
    adr: boolean;
    hayon: boolean;
    express: boolean;
    frigo: boolean;
    palettesEchange: number;
    weekend: boolean;
    nuit: boolean;
  };
  waitingTime: {
    total: number;
    billable: number;
  };
  calculation: {
    basePrice: number;
    distancePrice: number;
    optionsPrice: number;
    waitingTimePrice: number;
    penalties: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
  discrepancies: any[];
  blocks: any[];
  carrierInvoice?: {
    invoiceNumber: string;
    totalHT: number;
    uploadedAt: string;
  };
  finalInvoice?: {
    invoiceNumber: string;
    generatedAt: string;
  };
  createdAt: string;
}

interface Block {
  _id: string;
  blockId: string;
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  transporterName?: string;
  clientId: string;
  clientName?: string;
  type: string;
  reason: string;
  details: any;
  active: boolean;
  blockedAt: string;
  blockedBy: string;
  unlockedAt?: string;
  unlockedBy?: string;
}

interface TariffGrid {
  _id: string;
  gridId: string;
  transporterId: string;
  clientId: string;
  name: string;
  validFrom: string;
  validTo?: string;
  active: boolean;
  baseRates: any[];
  options: any;
}

interface Stats {
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

const API_BASE = process.env.NEXT_PUBLIC_BILLING_API || 'https://d2i50a1vlg138w.cloudfront.net';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: 'text-gray-800', bg: 'bg-gray-100' },
  generated: { label: 'Générée', color: 'text-blue-800', bg: 'bg-blue-100' },
  discrepancy_detected: { label: 'Écarts', color: 'text-yellow-800', bg: 'bg-yellow-100' },
  pending_validation: { label: 'En attente', color: 'text-orange-800', bg: 'bg-orange-100' },
  validated: { label: 'Validée', color: 'text-green-800', bg: 'bg-green-100' },
  contested: { label: 'Contestée', color: 'text-red-800', bg: 'bg-red-100' },
  conflict_closed: { label: 'Conflit clos', color: 'text-purple-800', bg: 'bg-purple-100' },
  blocked: { label: 'Bloquée', color: 'text-red-800', bg: 'bg-red-100' },
  finalized: { label: 'Finalisée', color: 'text-emerald-800', bg: 'bg-emerald-100' },
  exported: { label: 'Exportée', color: 'text-indigo-800', bg: 'bg-indigo-100' },
  archived: { label: 'Archivée', color: 'text-slate-800', bg: 'bg-slate-100' },
};

const BLOCK_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  missing_documents: { label: 'Documents manquants', icon: FileText, color: 'text-orange-600' },
  vigilance: { label: 'Vigilance', icon: Shield, color: 'text-red-600' },
  pallets: { label: 'Dette palettes', icon: AlertCircle, color: 'text-amber-600' },
  late: { label: 'Retard', icon: Clock, color: 'text-purple-600' },
  manual: { label: 'Manuel', icon: AlertTriangle, color: 'text-gray-600' },
};

export default function BillingAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'prefacturations' | 'blocks' | 'tariffs' | 'exports' | 'settings'>('overview');
  const [prefacturations, setPrefacturations] = useState<Prefacturation[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tariffs, setTariffs] = useState<TariffGrid[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTransporter, setSelectedTransporter] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');

  // Modal state
  const [selectedPrefact, setSelectedPrefact] = useState<Prefacturation | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({ prefacturationId: '', type: 'manual', reason: '' });

  // ERP Config
  const [erpConfig, setErpConfig] = useState({
    system: 'generic_api',
    endpoint: '',
    apiKey: '',
    companyCode: '',
    costCenter: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prefactRes, blocksRes, tariffsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/billing/prefacturations?limit=100`),
        fetch(`${API_BASE}/api/billing/blocks?active=true`),
        fetch(`${API_BASE}/api/billing/tariffs`),
        fetch(`${API_BASE}/api/billing/stats`),
      ]);

      if (prefactRes.ok) {
        const data = await prefactRes.json();
        setPrefacturations(data.data || []);
      }
      if (blocksRes.ok) {
        const data = await blocksRes.json();
        setBlocks(data.data || []);
      }
      if (tariffsRes.ok) {
        const data = await tariffsRes.json();
        setTariffs(data.data || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (prefacturationId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefacturationId }),
      });
      if (response.ok) {
        await fetchData();
        alert('Facture finalisée avec succès');
      }
    } catch (error) {
      console.error('Erreur finalisation:', error);
    }
  };

  const handleExportERP = async (prefacturationId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefacturationId, erpConfig }),
      });
      if (response.ok) {
        const result = await response.json();
        await fetchData();
        alert(`Export ${result.data.status} vers ${result.data.erpSystem}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const handleUnblock = async (blockId: string, reason: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, reason }),
      });
      if (response.ok) {
        await fetchData();
        alert('Blocage levé avec succès');
      }
    } catch (error) {
      console.error('Erreur déblocage:', error);
    }
  };

  const handleCreateBlock = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockFormData),
      });
      if (response.ok) {
        await fetchData();
        setShowBlockModal(false);
        setBlockFormData({ prefacturationId: '', type: 'manual', reason: '' });
        alert('Blocage créé avec succès');
      }
    } catch (error) {
      console.error('Erreur création blocage:', error);
    }
  };

  const filteredPrefacturations = prefacturations.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.orderId.toLowerCase().includes(query) &&
          !p.prefacturationId.toLowerCase().includes(query) &&
          !(p.transporterName || '').toLowerCase().includes(query) &&
          !(p.clientName || '').toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedTransporter && p.transporterId !== selectedTransporter) return false;
    if (selectedClient && p.clientId !== selectedClient) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Facturation - Backoffice Admin | RT Technologie</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Euro className="w-7 h-7 text-emerald-600" />
                  Administration Facturation
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion globale des préfacturations, blocages et exports ERP
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau blocage
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 border-b">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                { id: 'prefacturations', label: 'Préfacturations', icon: FileText },
                { id: 'blocks', label: 'Blocages', icon: AlertCircle },
                { id: 'tariffs', label: 'Grilles tarifaires', icon: Euro },
                { id: 'exports', label: 'Exports ERP', icon: Send },
                { id: 'settings', label: 'Configuration', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total préfacturations</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.prefacturations.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Montant total HT</p>
                          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.amounts.totalHT)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <Euro className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Taux d'écarts</p>
                          <p className="text-3xl font-bold text-yellow-600">{stats.discrepancyRate}%</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Blocages actifs</p>
                          <p className="text-3xl font-bold text-red-600">{stats.activeBlocks}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-gray-600" />
                        Répartition par statut
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.prefacturations.byStatus || {}).map(([status, count]) => {
                          const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                          const percent = stats.prefacturations.total > 0
                            ? Math.round((count as number / stats.prefacturations.total) * 100)
                            : 0;
                          return (
                            <div key={status} className="flex items-center gap-3">
                              <div className="w-32">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                              <div className="flex-1 bg-gray-100 rounded-full h-4">
                                <div
                                  className={`h-4 rounded-full ${config.bg}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="w-16 text-right text-sm font-medium">
                                {count} ({percent}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Blocages actifs par type
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(BLOCK_TYPES).map(([type, config]) => {
                          const count = blocks.filter(b => b.type === type && b.active).length;
                          const Icon = config.icon;
                          return (
                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <span className="font-medium">{config.label}</span>
                              </div>
                              <span className={`text-lg font-bold ${count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Dernières préfacturations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporteur</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {prefacturations.slice(0, 10).map(p => (
                            <tr key={p._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{p.orderId}</td>
                              <td className="px-4 py-3 text-gray-600">{p.clientName || p.clientId}</td>
                              <td className="px-4 py-3 text-gray-600">{p.transporterName || p.transporterId}</td>
                              <td className="px-4 py-3 font-medium">{formatCurrency(p.calculation.totalHT)}</td>
                              <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                              <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(p.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Prefacturations Tab */}
              {activeTab === 'prefacturations' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher..."
                          className="border rounded-lg px-3 py-2 text-sm w-64"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="all">Tous les statuts</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                      <div className="ml-auto text-sm text-gray-500">
                        {filteredPrefacturations.length} résultat(s)
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporteur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Écarts</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blocages</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredPrefacturations.map(p => (
                          <tr key={p._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{p.orderId}</p>
                                <p className="text-xs text-gray-500">{p.prefacturationId}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-sm">{p.clientName || p.clientId}</td>
                            <td className="px-4 py-3 text-gray-600 text-sm">{p.transporterName || p.transporterId}</td>
                            <td className="px-4 py-3 text-gray-600 text-sm">{p.orderData.distance || 0} km</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(p.calculation.totalHT)}</td>
                            <td className="px-4 py-3">
                              {p.discrepancies.length > 0 ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  {p.discrepancies.filter(d => d.status === 'detected').length}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {p.blocks.filter(b => b.active).length > 0 ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  {p.blocks.filter(b => b.active).length}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setSelectedPrefact(p)}
                                  className="p-1.5 hover:bg-gray-100 rounded"
                                  title="Voir détails"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                                {p.status === 'validated' && !p.blocks.some(b => b.active) && (
                                  <button
                                    onClick={() => handleFinalize(p.prefacturationId)}
                                    className="p-1.5 hover:bg-green-100 rounded"
                                    title="Finaliser"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </button>
                                )}
                                {p.status === 'finalized' && (
                                  <button
                                    onClick={() => handleExportERP(p.prefacturationId)}
                                    className="p-1.5 hover:bg-blue-100 rounded"
                                    title="Export ERP"
                                  >
                                    <Send className="w-4 h-4 text-blue-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Blocks Tab */}
              {activeTab === 'blocks' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold">Blocages actifs</h2>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Blocage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Préfacturation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date blocage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {blocks.filter(b => b.active).map(block => {
                          const typeConfig = BLOCK_TYPES[block.type] || BLOCK_TYPES.manual;
                          const Icon = typeConfig.icon;
                          return (
                            <tr key={block._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-sm">{block.blockId}</td>
                              <td className="px-4 py-3 text-sm">{block.prefacturationId}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                                  <span className="text-sm">{typeConfig.label}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{block.reason}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(block.blockedAt)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => {
                                    const reason = prompt('Raison du déblocage:');
                                    if (reason) handleUnblock(block.blockId, reason);
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Lever
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {blocks.filter(b => b.active).length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              Aucun blocage actif
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tariffs Tab */}
              {activeTab === 'tariffs' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Grilles tarifaires</h2>
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        <Plus className="w-4 h-4" />
                        Nouvelle grille
                      </button>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporteur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validité</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tariffs.map(tariff => (
                          <tr key={tariff._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-sm">{tariff.gridId}</td>
                            <td className="px-4 py-3 font-medium">{tariff.name || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{tariff.clientId}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{tariff.transporterId}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(tariff.validFrom)}
                              {tariff.validTo && ` → ${formatDate(tariff.validTo)}`}
                            </td>
                            <td className="px-4 py-3">
                              {tariff.active ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-gray-100 rounded" title="Modifier">
                                  <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button className="p-1.5 hover:bg-red-100 rounded" title="Supprimer">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {tariffs.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              Aucune grille tarifaire
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Configuration Export ERP</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Système ERP</label>
                        <select
                          value={erpConfig.system}
                          onChange={(e) => setErpConfig({ ...erpConfig, system: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="sap">SAP</option>
                          <option value="oracle">Oracle</option>
                          <option value="sage_x3">Sage X3</option>
                          <option value="divalto">Divalto</option>
                          <option value="dynamics_365">Microsoft Dynamics 365</option>
                          <option value="odoo">Odoo</option>
                          <option value="generic_api">API Générique</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                        <input
                          type="url"
                          value={erpConfig.endpoint}
                          onChange={(e) => setErpConfig({ ...erpConfig, endpoint: e.target.value })}
                          placeholder="https://erp.example.com/api"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
                        <input
                          type="password"
                          value={erpConfig.apiKey}
                          onChange={(e) => setErpConfig({ ...erpConfig, apiKey: e.target.value })}
                          placeholder="••••••••"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code Société</label>
                        <input
                          type="text"
                          value={erpConfig.companyCode}
                          onChange={(e) => setErpConfig({ ...erpConfig, companyCode: e.target.value })}
                          placeholder="1000"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        Enregistrer la configuration
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Paramètres de facturation</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Délai validation transporteur</p>
                          <p className="text-sm text-gray-600">Timeout après lequel la préfacturation est auto-validée</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={7} className="w-20 border rounded px-2 py-1 text-center" />
                          <span className="text-gray-600">jours</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Tolérance écarts</p>
                          <p className="text-sm text-gray-600">Seuil de détection des écarts tarifaires</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={2} className="w-20 border rounded px-2 py-1 text-center" />
                          <span className="text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Durée archivage</p>
                          <p className="text-sm text-gray-600">Conservation légale des factures</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={10} className="w-20 border rounded px-2 py-1 text-center" />
                          <span className="text-gray-600">ans</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Block Creation Modal */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Nouveau blocage manuel</h2>
                <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Préfacturation</label>
                  <select
                    value={blockFormData.prefacturationId}
                    onChange={(e) => setBlockFormData({ ...blockFormData, prefacturationId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Sélectionner...</option>
                    {prefacturations.filter(p => !['blocked', 'finalized', 'exported', 'archived'].includes(p.status)).map(p => (
                      <option key={p._id} value={p.prefacturationId}>
                        {p.orderId} - {p.clientName || p.clientId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de blocage</label>
                  <select
                    value={blockFormData.type}
                    onChange={(e) => setBlockFormData({ ...blockFormData, type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {Object.entries(BLOCK_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                  <textarea
                    value={blockFormData.reason}
                    onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                    placeholder="Décrivez la raison du blocage..."
                    className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateBlock}
                  disabled={!blockFormData.prefacturationId || !blockFormData.reason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Créer le blocage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedPrefact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedPrefact.orderId}</h2>
                  <p className="text-sm text-gray-500">{selectedPrefact.prefacturationId}</p>
                </div>
                <button onClick={() => setSelectedPrefact(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
                {/* Status & Amount */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedPrefact.status)}
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(selectedPrefact.calculation.totalHT)} HT</p>
                    <p className="text-gray-500">{formatCurrency(selectedPrefact.calculation.totalTTC)} TTC</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium">{selectedPrefact.clientName || selectedPrefact.clientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transporteur</p>
                    <p className="font-medium">{selectedPrefact.transporterName || selectedPrefact.transporterId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium">{selectedPrefact.orderData.distance || 0} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Créée le</p>
                    <p className="font-medium">{formatDate(selectedPrefact.createdAt)}</p>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Détail calcul</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Prix de base</span>
                      <span>{formatCurrency(selectedPrefact.calculation.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix distance</span>
                      <span>{formatCurrency(selectedPrefact.calculation.distancePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Options</span>
                      <span>{formatCurrency(selectedPrefact.calculation.optionsPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temps d'attente</span>
                      <span>{formatCurrency(selectedPrefact.calculation.waitingTimePrice)}</span>
                    </div>
                    {selectedPrefact.calculation.penalties > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Pénalités</span>
                        <span>-{formatCurrency(selectedPrefact.calculation.penalties)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total HT</span>
                      <span>{formatCurrency(selectedPrefact.calculation.totalHT)}</span>
                    </div>
                  </div>
                </div>

                {/* Discrepancies */}
                {selectedPrefact.discrepancies.length > 0 && (
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <h3 className="font-medium text-yellow-800 mb-3">Écarts détectés ({selectedPrefact.discrepancies.length})</h3>
                    <div className="space-y-2">
                      {selectedPrefact.discrepancies.map((d, i) => (
                        <div key={i} className="text-sm bg-white p-2 rounded">
                          <p className="font-medium">{d.type}: {d.description}</p>
                          <p className="text-gray-500">
                            Attendu: {d.expectedValue} | Déclaré: {d.actualValue} | Écart: {d.difference}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                {selectedPrefact.blocks.filter(b => b.active).length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-medium text-red-800 mb-3">Blocages actifs ({selectedPrefact.blocks.filter(b => b.active).length})</h3>
                    <div className="space-y-2">
                      {selectedPrefact.blocks.filter(b => b.active).map((b, i) => (
                        <div key={i} className="text-sm bg-white p-2 rounded flex items-center justify-between">
                          <div>
                            <p className="font-medium">{BLOCK_TYPES[b.type]?.label || b.type}</p>
                            <p className="text-gray-500">{b.reason}</p>
                          </div>
                          <button
                            onClick={() => {
                              const reason = prompt('Raison du déblocage:');
                              if (reason) handleUnblock(b.blockId || '', reason);
                            }}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                          >
                            Lever
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setSelectedPrefact(null)} className="px-4 py-2 border rounded-lg">
                  Fermer
                </button>
                {selectedPrefact.status === 'validated' && !selectedPrefact.blocks.some(b => b.active) && (
                  <button
                    onClick={() => {
                      handleFinalize(selectedPrefact.prefacturationId);
                      setSelectedPrefact(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Finaliser
                  </button>
                )}
                {selectedPrefact.status === 'finalized' && (
                  <button
                    onClick={() => {
                      handleExportERP(selectedPrefact.prefacturationId);
                      setSelectedPrefact(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Export ERP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

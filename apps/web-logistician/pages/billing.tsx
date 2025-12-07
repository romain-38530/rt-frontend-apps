import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Euro,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Building2,
  Truck,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { useToast } from '@rt/ui-components';

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
    pickupAddress: string;
    deliveryAddress: string;
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
  discrepancies: Discrepancy[];
  blocks: Block[];
  carrierInvoice?: {
    invoiceNumber: string;
    totalHT: number;
    uploadedAt: string;
  };
  carrierValidation: {
    status: string;
    timeoutAt: string;
  };
  createdAt: string;
}

interface Discrepancy {
  type: string;
  description: string;
  expectedValue: any;
  actualValue: any;
  difference: number;
  differencePercent: number;
  status: string;
  resolution?: string;
}

interface Block {
  type: string;
  reason: string;
  active: boolean;
  blockedAt: string;
}

interface Stats {
  totalPrefacturations: number;
  montantTotalHT: number;
  enAttente: number;
  avecEcarts: number;
  blocages: number;
  tauxValidation: number;
  parClient: { clientId: string; clientName: string; count: number; montant: number }[];
  parTransporteur: { transporterId: string; transporterName: string; count: number; montant: number }[];
}

const API_BASE = process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net';

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

const DISCREPANCY_LABELS: Record<string, string> = {
  price_global: 'Écart de prix',
  distance: 'Écart distance',
  options: 'Options',
  palettes: 'Palettes',
  waiting_time: 'Temps attente',
  volume: 'Volume',
};

const BLOCK_LABELS: Record<string, string> = {
  missing_documents: 'Documents manquants',
  vigilance: 'Vigilance',
  pallets: 'Dette palettes',
  late: 'Retard',
  manual: 'Manuel',
};

export default function LogisticianBillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'prefacturations' | 'disputes' | 'blocks'>('overview');
  const [prefacturations, setPrefacturations] = useState<Prefacturation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Prefacturation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/billing/prefacturations?limit=200`);
      if (response.ok) {
        const data = await response.json();
        setPrefacturations(data.data || []);
        calculateStats(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Prefacturation[]) => {
    const total = data.length;
    const montant = data.reduce((sum, p) => sum + p.calculation.totalHT, 0);
    const pending = data.filter(p => ['pending_validation', 'generated'].includes(p.status)).length;
    const withDiscrepancies = data.filter(p => p.discrepancies.some(d => d.status === 'detected')).length;
    const blocked = data.filter(p => p.blocks.some(b => b.active)).length;
    const validated = data.filter(p => ['validated', 'finalized', 'exported'].includes(p.status)).length;

    // Group by client
    const clientMap = new Map<string, { clientName: string; count: number; montant: number }>();
    data.forEach(p => {
      const existing = clientMap.get(p.clientId) || { clientName: p.clientName || p.clientId, count: 0, montant: 0 };
      existing.count++;
      existing.montant += p.calculation.totalHT;
      clientMap.set(p.clientId, existing);
    });

    // Group by transporter
    const transporterMap = new Map<string, { transporterName: string; count: number; montant: number }>();
    data.forEach(p => {
      const existing = transporterMap.get(p.transporterId) || { transporterName: p.transporterName || p.transporterId, count: 0, montant: 0 };
      existing.count++;
      existing.montant += p.calculation.totalHT;
      transporterMap.set(p.transporterId, existing);
    });

    setStats({
      totalPrefacturations: total,
      montantTotalHT: montant,
      enAttente: pending,
      avecEcarts: withDiscrepancies,
      blocages: blocked,
      tauxValidation: total > 0 ? (validated / total) * 100 : 0,
      parClient: Array.from(clientMap.entries()).map(([clientId, data]) => ({
        clientId,
        ...data,
      })).sort((a, b) => b.montant - a.montant).slice(0, 5),
      parTransporteur: Array.from(transporterMap.entries()).map(([transporterId, data]) => ({
        transporterId,
        ...data,
      })).sort((a, b) => b.montant - a.montant).slice(0, 5),
    });
  };

  const handleResolveDiscrepancy = async (prefacturationId: string, discrepancyIndex: number, resolution: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/discrepancy/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefacturationId, discrepancyIndex, resolution }),
      });
      if (response.ok) {
        await fetchData();
        toast.success('Écart résolu avec succès');
      }
    } catch (error) {
      console.error('Erreur résolution:', error);
    }
  };

  const handleUnblock = async (prefacturationId: string, reason: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefacturationId, reason }),
      });
      if (response.ok) {
        await fetchData();
        toast.success('Blocage levé');
      }
    } catch (error) {
      console.error('Erreur déblocage:', error);
    }
  };

  const filteredPrefacturations = prefacturations.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.orderId.toLowerCase().includes(query) &&
          !(p.clientName || '').toLowerCase().includes(query) &&
          !(p.transporterName || '').toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const disputedPrefacturations = prefacturations.filter(p =>
    p.discrepancies.some(d => d.status === 'detected' || d.status === 'contested')
  );

  const blockedPrefacturations = prefacturations.filter(p => p.blocks.some(b => b.active));

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

  const getDaysUntilTimeout = (timeoutAt: string) => {
    const timeout = new Date(timeoutAt);
    const now = new Date();
    const diffTime = timeout.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Head>
        <title>Facturation | RT Logisticien</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Euro className="w-7 h-7 text-purple-600" />
                  Gestion Facturation
                </h1>
                <p className="text-gray-600 mt-1">
                  Supervisez les préfacturations, résolvez les écarts et gérez les blocages
                </p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                { id: 'prefacturations', label: 'Préfacturations', icon: FileText },
                { id: 'disputes', label: `Litiges (${disputedPrefacturations.length})`, icon: MessageSquare },
                { id: 'blocks', label: `Blocages (${blockedPrefacturations.length})`, icon: AlertCircle },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                          <p className="text-sm text-gray-600">Préfacturations</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalPrefacturations}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Volume total</p>
                          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.montantTotalHT)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <Euro className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Litiges ouverts</p>
                          <p className="text-3xl font-bold text-yellow-600">{stats.avecEcarts}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                      {stats.avecEcarts > 0 && (
                        <button
                          onClick={() => setActiveTab('disputes')}
                          className="mt-3 text-sm text-yellow-700 hover:underline flex items-center gap-1"
                        >
                          Voir les litiges <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Blocages actifs</p>
                          <p className="text-3xl font-bold text-red-600">{stats.blocages}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                      {stats.blocages > 0 && (
                        <button
                          onClick={() => setActiveTab('blocks')}
                          className="mt-3 text-sm text-red-700 hover:underline flex items-center gap-1"
                        >
                          Gérer les blocages <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Top Clients & Transporters */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Top Clients
                      </h3>
                      <div className="space-y-3">
                        {stats.parClient.map((client, i) => (
                          <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {i + 1}
                              </span>
                              <span className="font-medium">{client.clientName}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(client.montant)}</p>
                              <p className="text-xs text-gray-500">{client.count} préfact.</p>
                            </div>
                          </div>
                        ))}
                        {stats.parClient.length === 0 && (
                          <p className="text-gray-500 text-center py-4">Aucune donnée</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-green-600" />
                        Top Transporteurs
                      </h3>
                      <div className="space-y-3">
                        {stats.parTransporteur.map((transporter, i) => (
                          <div key={transporter.transporterId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {i + 1}
                              </span>
                              <span className="font-medium">{transporter.transporterName}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(transporter.montant)}</p>
                              <p className="text-xs text-gray-500">{transporter.count} préfact.</p>
                            </div>
                          </div>
                        ))}
                        {stats.parTransporteur.length === 0 && (
                          <p className="text-gray-500 text-center py-4">Aucune donnée</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validation Progress */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Taux de validation</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-500 h-4 rounded-full transition-all"
                          style={{ width: `${stats.tauxValidation}%` }}
                        />
                      </div>
                      <span className="text-2xl font-bold text-green-600">{stats.tauxValidation.toFixed(1)}%</span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <p className="text-gray-500">En attente</p>
                        <p className="font-semibold text-orange-600">{stats.enAttente}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avec écarts</p>
                        <p className="font-semibold text-yellow-600">{stats.avecEcarts}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bloquées</p>
                        <p className="font-semibold text-red-600">{stats.blocages}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Validées</p>
                        <p className="font-semibold text-green-600">
                          {prefacturations.filter(p => ['validated', 'finalized', 'exported'].includes(p.status)).length}
                        </p>
                      </div>
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
                      <div className="flex items-center gap-2 flex-1 min-w-64">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher par ordre, client, transporteur..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
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
                      <span className="text-sm text-gray-500">
                        {filteredPrefacturations.length} résultat(s)
                      </span>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-3">
                    {filteredPrefacturations.map(prefact => {
                      const isExpanded = expandedId === prefact._id;
                      const hasIssues = prefact.discrepancies.some(d => d.status === 'detected') || prefact.blocks.some(b => b.active);
                      const daysLeft = prefact.carrierValidation?.timeoutAt ? getDaysUntilTimeout(prefact.carrierValidation.timeoutAt) : null;

                      return (
                        <div key={prefact._id} className="bg-white rounded-lg shadow">
                          <div
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedId(isExpanded ? null : prefact._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  hasIssues ? 'bg-red-100' : 'bg-green-100'
                                }`}>
                                  {hasIssues ? (
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{prefact.orderId}</span>
                                    {getStatusBadge(prefact.status)}
                                    {daysLeft !== null && daysLeft <= 3 && daysLeft > 0 && (
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                        {daysLeft}j restants
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {prefact.clientName || prefact.clientId} → {prefact.transporterName || prefact.transporterId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xl font-bold">{formatCurrency(prefact.calculation.totalHT)}</p>
                                  <p className="text-xs text-gray-500">{formatDate(prefact.createdAt)}</p>
                                </div>
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t px-6 py-4 space-y-4">
                              {/* Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Distance</p>
                                  <p className="font-medium">{prefact.orderData.distance} km</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Véhicule</p>
                                  <p className="font-medium">{prefact.orderData.vehicleType || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Temps attente</p>
                                  <p className="font-medium">{prefact.waitingTime?.billable || 0} min</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Total TTC</p>
                                  <p className="font-medium">{formatCurrency(prefact.calculation.totalTTC)}</p>
                                </div>
                              </div>

                              {/* Discrepancies */}
                              {prefact.discrepancies.length > 0 && (
                                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                                  <h4 className="font-medium text-yellow-800 mb-2">
                                    Écarts ({prefact.discrepancies.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {prefact.discrepancies.map((d, i) => (
                                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                                        <div>
                                          <p className="font-medium text-sm">{DISCREPANCY_LABELS[d.type] || d.type}</p>
                                          <p className="text-xs text-gray-500">{d.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                            d.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {d.status === 'resolved' ? 'Résolu' : 'Ouvert'}
                                          </span>
                                          {d.status !== 'resolved' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const resolution = prompt('Résolution de l\'écart:');
                                                if (resolution) handleResolveDiscrepancy(prefact.prefacturationId, i, resolution);
                                              }}
                                              className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                                            >
                                              Résoudre
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Blocks */}
                              {prefact.blocks.filter(b => b.active).length > 0 && (
                                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                  <h4 className="font-medium text-red-800 mb-2">
                                    Blocages actifs ({prefact.blocks.filter(b => b.active).length})
                                  </h4>
                                  <div className="space-y-2">
                                    {prefact.blocks.filter(b => b.active).map((b, i) => (
                                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                                        <div>
                                          <p className="font-medium text-sm">{BLOCK_LABELS[b.type] || b.type}</p>
                                          <p className="text-xs text-gray-500">{b.reason}</p>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const reason = prompt('Raison du déblocage:');
                                            if (reason) handleUnblock(prefact.prefacturationId, reason);
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
                          )}
                        </div>
                      );
                    })}

                    {filteredPrefacturations.length === 0 && (
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune préfacturation trouvée</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disputes Tab */}
              {activeTab === 'disputes' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {disputedPrefacturations.length} litige(s) à traiter
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Résolvez les écarts entre les préfacturations SYMPHONI.A et les factures transporteurs.
                    </p>
                  </div>

                  {disputedPrefacturations.map(prefact => (
                    <div key={prefact._id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{prefact.orderId}</span>
                            {getStatusBadge(prefact.status)}
                          </div>
                          <p className="text-gray-600">
                            {prefact.clientName} → {prefact.transporterName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{formatCurrency(prefact.calculation.totalHT)}</p>
                          {prefact.carrierInvoice && (
                            <p className="text-sm text-gray-500">
                              Facture transp.: {formatCurrency(prefact.carrierInvoice.totalHT)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {prefact.discrepancies.filter(d => d.status !== 'resolved').map((d, i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{DISCREPANCY_LABELS[d.type] || d.type}</h4>
                              <span className="text-red-600 font-semibold">
                                {d.difference > 0 ? '+' : ''}{formatCurrency(d.difference)} ({d.differencePercent?.toFixed(1)}%)
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{d.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <span className="text-gray-500">Attendu:</span> {d.expectedValue} |
                                <span className="text-gray-500 ml-2">Déclaré:</span> {d.actualValue}
                              </div>
                              <button
                                onClick={() => {
                                  const resolution = prompt('Comment résoudre cet écart ?');
                                  if (resolution) handleResolveDiscrepancy(prefact.prefacturationId, i, resolution);
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                              >
                                Résoudre l'écart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {disputedPrefacturations.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">Aucun litige à traiter</p>
                    </div>
                  )}
                </div>
              )}

              {/* Blocks Tab */}
              {activeTab === 'blocks' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {blockedPrefacturations.length} préfacturation(s) bloquée(s)
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Levez les blocages pour permettre la finalisation des factures.
                    </p>
                  </div>

                  {blockedPrefacturations.map(prefact => (
                    <div key={prefact._id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{prefact.orderId}</span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Bloquée
                            </span>
                          </div>
                          <p className="text-gray-600">
                            {prefact.clientName} → {prefact.transporterName}
                          </p>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(prefact.calculation.totalHT)}</p>
                      </div>

                      <div className="space-y-3">
                        {prefact.blocks.filter(b => b.active).map((block, i) => (
                          <div key={i} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-red-800">{BLOCK_LABELS[block.type] || block.type}</h4>
                                <p className="text-sm text-red-700 mt-1">{block.reason}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Bloqué le {formatDate(block.blockedAt)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const reason = prompt('Raison du déblocage:');
                                  if (reason) handleUnblock(prefact.prefacturationId, reason);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Lever le blocage
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {blockedPrefacturations.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">Aucune préfacturation bloquée</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

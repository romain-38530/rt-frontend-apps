import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useToast } from '@rt/ui-components';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Eye,
  Send,
  Download,
  Shield,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Paperclip
} from 'lucide-react';

interface Prefacturation {
  _id: string;
  orderId: string;
  orderRef: string;
  industrielId: string;
  industrielName: string;
  status: 'pending' | 'validated' | 'disputed' | 'finalized';
  basePrice: number;
  optionsPrice: number;
  waitingTimePrice: number;
  totalHT: number;
  totalTTC: number;
  tvaRate: number;
  createdAt: string;
  validatedAt?: string;
  dueDate: string;
  discrepancies: Discrepancy[];
  blocks: Block[];
  carrierInvoice?: {
    uploadedAt: string;
    filename: string;
    ocrData: any;
    matchScore: number;
  };
  calculationDetails: {
    distance: number;
    vehicleType: string;
    baseRate: number;
    options: {
      adr: boolean;
      hayon: boolean;
      express: boolean;
      frigo: boolean;
      palettesCount: number;
      weekend: boolean;
      nuit: boolean;
    };
    waitingMinutes: number;
  };
}

interface Discrepancy {
  _id: string;
  type: 'price' | 'distance' | 'options' | 'palettes' | 'waiting_time' | 'volume';
  expectedValue: number;
  declaredValue: number;
  difference: number;
  differencePercent: number;
  status: 'open' | 'accepted' | 'rejected' | 'contested';
  contestation?: {
    reason: string;
    documents: string[];
    createdAt: string;
  };
  resolution?: {
    decision: string;
    resolvedBy: string;
    resolvedAt: string;
  };
}

interface Block {
  _id: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late';
  reason: string;
  active: boolean;
  createdAt: string;
  resolvedAt?: string;
}

interface VigilanceDocument {
  _id: string;
  type: 'urssaf' | 'assurance' | 'licence' | 'kbis';
  filename: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  verified: boolean;
}

interface Stats {
  totalPrefacturations: number;
  montantTotal: number;
  enAttente: number;
  ecarts: number;
  blocages: number;
  tauxValidation: number;
}

const DISCREPANCY_LABELS: Record<string, string> = {
  price: 'Écart de prix',
  distance: 'Écart de distance',
  options: 'Options non conformes',
  palettes: 'Écart palettes',
  waiting_time: 'Temps d\'attente',
  volume: 'Écart de volume'
};

const BLOCK_LABELS: Record<string, string> = {
  missing_documents: 'Documents manquants',
  vigilance: 'Vigilance non conforme',
  pallets: 'Solde palettes négatif',
  late: 'Livraison en retard'
};

export default function BillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prefacturations' | 'upload' | 'vigilance'>('dashboard');
  const [prefacturations, setPrefacturations] = useState<Prefacturation[]>([]);
  const [vigilanceDocuments, setVigilanceDocuments] = useState<VigilanceDocument[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedPrefact, setExpandedPrefact] = useState<string | null>(null);
  const [contestationModal, setContestationModal] = useState<{prefactId: string; discrepancyId: string} | null>(null);
  const [contestationReason, setContestationReason] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get carrier ID from auth context
      const carrierId = 'current-carrier-id'; // À remplacer par le contexte auth

      const [prefactRes, vigilanceRes] = await Promise.all([
        fetch(`${API_BASE}/api/prefacturations?carrierId=${carrierId}`),
        fetch(`${API_BASE}/api/vigilance/${carrierId}`)
      ]);

      if (prefactRes.ok) {
        const data = await prefactRes.json();
        setPrefacturations(data);
        calculateStats(data);
      }

      if (vigilanceRes.ok) {
        const data = await vigilanceRes.json();
        setVigilanceDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Prefacturation[]) => {
    const total = data.length;
    const montant = data.reduce((sum, p) => sum + p.totalHT, 0);
    const pending = data.filter(p => p.status === 'pending').length;
    const withDiscrepancies = data.filter(p => p.discrepancies.some(d => d.status === 'open')).length;
    const blocked = data.filter(p => p.blocks.some(b => b.active)).length;
    const validated = data.filter(p => p.status === 'validated' || p.status === 'finalized').length;

    setStats({
      totalPrefacturations: total,
      montantTotal: montant,
      enAttente: pending,
      ecarts: withDiscrepancies,
      blocages: blocked,
      tauxValidation: total > 0 ? (validated / total) * 100 : 0
    });
  };

  const uploadInvoice = async (prefactId: string, file: File) => {
    setUploadingInvoice(prefactId);
    try {
      const formData = new FormData();
      formData.append('invoice', file);
      formData.append('prefacturationId', prefactId);

      const response = await fetch(`${API_BASE}/api/carrier-invoice/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchData();
        toast.success('Facture uploadée avec succès. Analyse OCR en cours...');
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingInvoice(null);
    }
  };

  const submitContestation = async () => {
    if (!contestationModal || !contestationReason.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/prefacturations/${contestationModal.prefactId}/discrepancies/${contestationModal.discrepancyId}/contest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: contestationReason })
        }
      );

      if (response.ok) {
        await fetchData();
        setContestationModal(null);
        setContestationReason('');
        toast.success('Contestation soumise avec succès');
      }
    } catch (error) {
      console.error('Erreur contestation:', error);
    }
  };

  const acceptDiscrepancy = async (prefactId: string, discrepancyId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/prefacturations/${prefactId}/discrepancies/${discrepancyId}/accept`,
        { method: 'POST' }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur acceptation:', error);
    }
  };

  const uploadVigilanceDocument = async (type: string, file: File, expiresAt: string) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);
      formData.append('expiresAt', expiresAt);

      const carrierId = 'current-carrier-id';
      const response = await fetch(`${API_BASE}/api/vigilance/${carrierId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchData();
        toast.success('Document vigilance uploadé avec succès');
      }
    } catch (error) {
      console.error('Erreur upload vigilance:', error);
    }
  };

  const filteredPrefacturations = prefacturations.filter(p => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'with_discrepancies') return p.discrepancies.some(d => d.status === 'open');
    if (statusFilter === 'blocked') return p.blocks.some(b => b.active);
    return p.status === statusFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      disputed: 'bg-red-100 text-red-800',
      finalized: 'bg-blue-100 text-blue-800'
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      validated: 'Validée',
      disputed: 'Contestée',
      finalized: 'Finalisée'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getVigilanceStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      valid: 'bg-green-100 text-green-800',
      expiring_soon: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      valid: 'Valide',
      expiring_soon: 'Expire bientôt',
      expired: 'Expiré'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <Head>
        <title>Facturation | RT Transporteur</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Euro className="w-7 h-7 text-green-600" />
                  Facturation & Préfacturation
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos préfacturations, uploadez vos factures et suivez vos paiements
                </p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
                { id: 'prefacturations', label: 'Mes préfacturations', icon: FileText },
                { id: 'upload', label: 'Uploader facture', icon: Upload },
                { id: 'vigilance', label: 'Documents vigilance', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Préfacturations</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalPrefacturations}</p>
                        </div>
                        <FileText className="w-10 h-10 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Montant total HT</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.montantTotal)}</p>
                        </div>
                        <Euro className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">En attente</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
                        </div>
                        <Clock className="w-10 h-10 text-yellow-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Taux validation</p>
                          <p className="text-2xl font-bold text-green-600">{stats.tauxValidation.toFixed(1)}%</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {(stats.ecarts > 0 || stats.blocages > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.ecarts > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-yellow-800">
                              {stats.ecarts} écart{stats.ecarts > 1 ? 's' : ''} à traiter
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Des écarts ont été détectés sur vos préfacturations. Veuillez les vérifier et accepter ou contester.
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab('prefacturations');
                                setStatusFilter('with_discrepancies');
                              }}
                              className="text-sm text-yellow-800 font-medium mt-2 hover:underline"
                            >
                              Voir les écarts →
                            </button>
                          </div>
                        </div>
                      )}

                      {stats.blocages > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-red-800">
                              {stats.blocages} blocage{stats.blocages > 1 ? 's' : ''} actif{stats.blocages > 1 ? 's' : ''}
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                              Certaines préfacturations sont bloquées. Régularisez votre situation pour débloquer les paiements.
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab('prefacturations');
                                setStatusFilter('blocked');
                              }}
                              className="text-sm text-red-800 font-medium mt-2 hover:underline"
                            >
                              Voir les blocages →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Prefacturations */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold">Dernières préfacturations</h2>
                    </div>
                    <div className="divide-y">
                      {prefacturations.slice(0, 5).map(prefact => (
                        <div key={prefact._id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{prefact.orderRef}</p>
                              <p className="text-sm text-gray-600">{prefact.industrielName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(prefact.totalHT)}</p>
                            <div className="mt-1">{getStatusBadge(prefact.status)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Prefacturations Tab */}
              {activeTab === 'prefacturations' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Filtrer par:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="all">Toutes</option>
                        <option value="pending">En attente</option>
                        <option value="validated">Validées</option>
                        <option value="disputed">Contestées</option>
                        <option value="finalized">Finalisées</option>
                        <option value="with_discrepancies">Avec écarts</option>
                        <option value="blocked">Bloquées</option>
                      </select>
                    </div>
                  </div>

                  {/* Prefacturations List */}
                  <div className="space-y-3">
                    {filteredPrefacturations.map(prefact => {
                      const isExpanded = expandedPrefact === prefact._id;
                      const hasOpenDiscrepancies = prefact.discrepancies.some(d => d.status === 'open');
                      const hasActiveBlocks = prefact.blocks.some(b => b.active);
                      const daysUntilDue = getDaysUntilDue(prefact.dueDate);

                      return (
                        <div key={prefact._id} className="bg-white rounded-lg shadow">
                          {/* Header */}
                          <div
                            className="px-6 py-4 cursor-pointer"
                            onClick={() => setExpandedPrefact(isExpanded ? null : prefact._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  hasActiveBlocks ? 'bg-red-100' : hasOpenDiscrepancies ? 'bg-yellow-100' : 'bg-green-100'
                                }`}>
                                  {hasActiveBlocks ? (
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                  ) : hasOpenDiscrepancies ? (
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                  ) : (
                                    <FileText className="w-6 h-6 text-green-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-lg">{prefact.orderRef}</p>
                                    {getStatusBadge(prefact.status)}
                                  </div>
                                  <p className="text-gray-600">{prefact.industrielName}</p>
                                  <p className="text-sm text-gray-500">
                                    Créée le {formatDate(prefact.createdAt)} •
                                    Échéance: {formatDate(prefact.dueDate)}
                                    {daysUntilDue <= 7 && daysUntilDue > 0 && (
                                      <span className="text-yellow-600 ml-2">
                                        (dans {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''})
                                      </span>
                                    )}
                                    {daysUntilDue <= 0 && (
                                      <span className="text-red-600 ml-2">(échue)</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{formatCurrency(prefact.totalHT)}</p>
                                  <p className="text-sm text-gray-500">HT • {formatCurrency(prefact.totalTTC)} TTC</p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2 mt-3">
                              {hasOpenDiscrepancies && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  {prefact.discrepancies.filter(d => d.status === 'open').length} écart(s)
                                </span>
                              )}
                              {hasActiveBlocks && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  {prefact.blocks.filter(b => b.active).length} blocage(s)
                                </span>
                              )}
                              {prefact.carrierInvoice && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" />
                                  Facture uploadée ({prefact.carrierInvoice.matchScore}% match)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t px-6 py-4 space-y-4">
                              {/* Calculation Details */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium mb-3">Détail du calcul</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500">Distance</p>
                                    <p className="font-medium">{prefact.calculationDetails.distance} km</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Type véhicule</p>
                                    <p className="font-medium">{prefact.calculationDetails.vehicleType}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Prix de base</p>
                                    <p className="font-medium">{formatCurrency(prefact.basePrice)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Attente ({prefact.calculationDetails.waitingMinutes} min)</p>
                                    <p className="font-medium">{formatCurrency(prefact.waitingTimePrice)}</p>
                                  </div>
                                </div>

                                {/* Options */}
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-gray-500 text-sm mb-2">Options appliquées:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {prefact.calculationDetails.options.adr && (
                                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">ADR</span>
                                    )}
                                    {prefact.calculationDetails.options.hayon && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Hayon</span>
                                    )}
                                    {prefact.calculationDetails.options.express && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Express</span>
                                    )}
                                    {prefact.calculationDetails.options.frigo && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Frigo</span>
                                    )}
                                    {prefact.calculationDetails.options.weekend && (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Weekend</span>
                                    )}
                                    {prefact.calculationDetails.options.nuit && (
                                      <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded">Nuit</span>
                                    )}
                                    {prefact.calculationDetails.options.palettesCount > 0 && (
                                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                                        {prefact.calculationDetails.options.palettesCount} palettes
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t flex justify-between">
                                  <span className="text-gray-500">Options</span>
                                  <span className="font-medium">{formatCurrency(prefact.optionsPrice)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg mt-2">
                                  <span>Total HT</span>
                                  <span>{formatCurrency(prefact.totalHT)}</span>
                                </div>
                              </div>

                              {/* Discrepancies */}
                              {prefact.discrepancies.length > 0 && (
                                <div className="border rounded-lg">
                                  <div className="px-4 py-3 bg-yellow-50 border-b">
                                    <h3 className="font-medium flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      Écarts détectés
                                    </h3>
                                  </div>
                                  <div className="divide-y">
                                    {prefact.discrepancies.map(disc => (
                                      <div key={disc._id} className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">{DISCREPANCY_LABELS[disc.type]}</p>
                                            <p className="text-sm text-gray-600">
                                              Attendu: {formatCurrency(disc.expectedValue)} •
                                              Déclaré: {formatCurrency(disc.declaredValue)} •
                                              Écart: <span className={disc.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                                                {disc.difference > 0 ? '+' : ''}{formatCurrency(disc.difference)} ({disc.differencePercent.toFixed(1)}%)
                                              </span>
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {disc.status === 'open' && (
                                              <>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    acceptDiscrepancy(prefact._id, disc._id);
                                                  }}
                                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                >
                                                  Accepter
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContestationModal({ prefactId: prefact._id, discrepancyId: disc._id });
                                                  }}
                                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                >
                                                  Contester
                                                </button>
                                              </>
                                            )}
                                            {disc.status === 'accepted' && (
                                              <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Accepté
                                              </span>
                                            )}
                                            {disc.status === 'contested' && (
                                              <span className="text-yellow-600 flex items-center gap-1">
                                                <MessageSquare className="w-4 h-4" />
                                                En cours
                                              </span>
                                            )}
                                            {disc.status === 'rejected' && (
                                              <span className="text-red-600">Rejeté</span>
                                            )}
                                          </div>
                                        </div>
                                        {disc.contestation && (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                            <p className="text-yellow-800">
                                              <strong>Votre contestation:</strong> {disc.contestation.reason}
                                            </p>
                                          </div>
                                        )}
                                        {disc.resolution && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                            <p className="text-gray-700">
                                              <strong>Décision:</strong> {disc.resolution.decision}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Blocks */}
                              {prefact.blocks.some(b => b.active) && (
                                <div className="border border-red-200 rounded-lg">
                                  <div className="px-4 py-3 bg-red-50 border-b">
                                    <h3 className="font-medium flex items-center gap-2 text-red-800">
                                      <AlertCircle className="w-4 h-4" />
                                      Blocages actifs
                                    </h3>
                                  </div>
                                  <div className="divide-y">
                                    {prefact.blocks.filter(b => b.active).map(block => (
                                      <div key={block._id} className="px-4 py-3">
                                        <p className="font-medium">{BLOCK_LABELS[block.type]}</p>
                                        <p className="text-sm text-gray-600">{block.reason}</p>
                                        {block.type === 'vigilance' && (
                                          <button
                                            onClick={() => setActiveTab('vigilance')}
                                            className="text-sm text-blue-600 hover:underline mt-1"
                                          >
                                            Mettre à jour mes documents →
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Upload Invoice */}
                              {!prefact.carrierInvoice && prefact.status === 'pending' && (
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-600 mb-3">Uploadez votre facture pour valider</p>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadInvoice(prefact._id, file);
                                    }}
                                    className="hidden"
                                    id={`invoice-${prefact._id}`}
                                    disabled={uploadingInvoice === prefact._id}
                                  />
                                  <label
                                    htmlFor={`invoice-${prefact._id}`}
                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 ${
                                      uploadingInvoice === prefact._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {uploadingInvoice === prefact._id ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Upload en cours...
                                      </>
                                    ) : (
                                      <>
                                        <Paperclip className="w-4 h-4" />
                                        Joindre ma facture
                                      </>
                                    )}
                                  </label>
                                </div>
                              )}

                              {/* Carrier Invoice Info */}
                              {prefact.carrierInvoice && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <h3 className="font-medium flex items-center gap-2 text-blue-800 mb-2">
                                    <FileCheck className="w-4 h-4" />
                                    Votre facture
                                  </h3>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm">{prefact.carrierInvoice.filename}</p>
                                      <p className="text-xs text-gray-600">
                                        Uploadée le {formatDate(prefact.carrierInvoice.uploadedAt)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-lg font-bold ${
                                        prefact.carrierInvoice.matchScore >= 95 ? 'text-green-600' :
                                        prefact.carrierInvoice.matchScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {prefact.carrierInvoice.matchScore}%
                                      </div>
                                      <p className="text-xs text-gray-600">Correspondance OCR</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex justify-end gap-2 pt-2">
                                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                                  <Download className="w-4 h-4" />
                                  Télécharger PDF
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                                  <Eye className="w-4 h-4" />
                                  Voir l'ordre
                                </button>
                              </div>
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

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Uploader une facture</h2>
                    <p className="text-gray-600 mb-6">
                      Sélectionnez une préfacturation en attente, puis uploadez votre facture.
                      Notre système OCR analysera automatiquement le document pour vérifier la correspondance.
                    </p>

                    {prefacturations.filter(p => p.status === 'pending' && !p.carrierInvoice).length > 0 ? (
                      <div className="space-y-4">
                        {prefacturations
                          .filter(p => p.status === 'pending' && !p.carrierInvoice)
                          .map(prefact => (
                            <div key={prefact._id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="font-medium">{prefact.orderRef}</p>
                                  <p className="text-sm text-gray-600">{prefact.industrielName}</p>
                                </div>
                                <p className="font-bold">{formatCurrency(prefact.totalHT)}</p>
                              </div>
                              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadInvoice(prefact._id, file);
                                  }}
                                  className="hidden"
                                  id={`upload-${prefact._id}`}
                                  disabled={uploadingInvoice === prefact._id}
                                />
                                <label
                                  htmlFor={`upload-${prefact._id}`}
                                  className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 ${
                                    uploadingInvoice === prefact._id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {uploadingInvoice === prefact._id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      Analyse OCR en cours...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      Uploader ma facture
                                    </>
                                  )}
                                </label>
                                <p className="text-xs text-gray-500 mt-2">
                                  Formats acceptés: PDF, JPG, PNG (max 10 MB)
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p>Toutes vos préfacturations ont déjà une facture uploadée!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vigilance Tab */}
              {activeTab === 'vigilance' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-2">Documents de vigilance</h2>
                    <p className="text-gray-600 mb-6">
                      Maintenez vos documents à jour pour éviter les blocages de paiement.
                      Les documents expirés ou manquants bloquent automatiquement vos préfacturations.
                    </p>

                    <div className="space-y-4">
                      {['urssaf', 'assurance', 'licence', 'kbis'].map(docType => {
                        const doc = vigilanceDocuments.find(d => d.type === docType);
                        const labels: Record<string, string> = {
                          urssaf: 'Attestation URSSAF',
                          assurance: 'Attestation Assurance RC',
                          licence: 'Licence de transport',
                          kbis: 'Extrait Kbis'
                        };

                        return (
                          <div
                            key={docType}
                            className={`border rounded-lg p-4 ${
                              !doc ? 'border-red-200 bg-red-50' :
                              doc.status === 'expired' ? 'border-red-200 bg-red-50' :
                              doc.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50' :
                              'border-green-200 bg-green-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  !doc || doc.status === 'expired' ? 'bg-red-100' :
                                  doc.status === 'expiring_soon' ? 'bg-yellow-100' : 'bg-green-100'
                                }`}>
                                  <Shield className={`w-5 h-5 ${
                                    !doc || doc.status === 'expired' ? 'text-red-600' :
                                    doc.status === 'expiring_soon' ? 'text-yellow-600' : 'text-green-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium">{labels[docType]}</p>
                                  {doc ? (
                                    <>
                                      <p className="text-sm text-gray-600">{doc.filename}</p>
                                      <p className="text-xs text-gray-500">
                                        Expire le {formatDate(doc.expiresAt)}
                                        {doc.verified && <span className="text-green-600 ml-2">✓ Vérifié</span>}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-red-600">Document manquant</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc && getVigilanceStatusBadge(doc.status)}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const expiresAt = prompt('Date d\'expiration (YYYY-MM-DD):');
                                      if (expiresAt) {
                                        uploadVigilanceDocument(docType, file, expiresAt);
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  id={`vigilance-${docType}`}
                                />
                                <label
                                  htmlFor={`vigilance-${docType}`}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer"
                                >
                                  {doc ? 'Mettre à jour' : 'Ajouter'}
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Information</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Les documents sont vérifiés automatiquement dans un délai de 24h</li>
                      <li>• Un rappel vous sera envoyé 30 jours avant expiration</li>
                      <li>• Les documents expirés bloquent automatiquement vos paiements</li>
                      <li>• Formats acceptés: PDF, JPG, PNG (max 5 MB)</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contestation Modal */}
        {contestationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Contester l'écart</h2>
                <button
                  onClick={() => {
                    setContestationModal(null);
                    setContestationReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-600 mb-4">
                  Expliquez pourquoi vous contestez cet écart. Joignez tout document justificatif si nécessaire.
                </p>
                <textarea
                  value={contestationReason}
                  onChange={(e) => setContestationReason(e.target.value)}
                  placeholder="Motif de la contestation..."
                  className="w-full border rounded-lg p-3 h-32 resize-none"
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setContestationModal(null);
                    setContestationReason('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={submitContestation}
                  disabled={!contestationReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Soumettre contestation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

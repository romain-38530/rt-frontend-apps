import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FileText, Search, Filter, Eye, Download, MoreVertical,
  CheckCircle, Clock, AlertTriangle, XCircle, Calendar, Euro,
  Building, User, ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://rt-admin-api-prod.eba-gqzj9rrf.eu-central-1.elasticbeanstalk.com';

interface Contract {
  _id: string;
  contractNumber: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  commercialName: string;
  type: string;
  packName?: string;
  modules: { moduleName: string; monthlyPrice: number; }[];
  pricing: {
    monthlyTotal: number;
    setupFeeTotal: number;
    billingCycle: string;
  };
  startDate: string;
  endDate?: string;
  commitmentMonths: number;
  status: string;
  installation: {
    status: string;
    scheduledDate?: string;
    completedDate?: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  mrr: number;
  avgCommitment: number;
  byStatus: Record<string, number>;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  pending_signature: { label: 'En attente signature', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  active: { label: 'Actif', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspended: { label: 'Suspendu', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  terminated: { label: 'Resilie', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Expire', color: 'bg-gray-100 text-gray-500', icon: XCircle }
};

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData(token);
  }, [router, statusFilter]);

  const loadData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const [contractsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/manager/contracts?${params}`, { headers }),
        fetch(`${API_URL}/api/v1/admin/manager/contracts/stats`, { headers })
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
            <p className="text-gray-500">Vue d'ensemble des contrats clients</p>
          </div>
          <Link href="/crm" className="text-blue-600 hover:underline">
            Retour CRM
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Total contrats</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Contrats actifs</div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">MRR</div>
              <div className="text-2xl font-bold text-blue-600">{stats.mrr.toLocaleString()} EUR</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Engagement moyen</div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgCommitment} mois</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par entreprise, numero, contact..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="pending_signature">En attente signature</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="terminated">Resilie</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contrat</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Commercial</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Mensuel</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Installation</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredContracts.map((contract) => {
                const status = statusConfig[contract.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <tr key={contract._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-blue-600">{contract.contractNumber}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{contract.companyName}</div>
                          <div className="text-sm text-gray-500">{contract.contactName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{contract.commercialName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{contract.packName || contract.type}</span>
                      <div className="text-xs text-gray-400">{contract.modules.length} modules</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium">{contract.pricing.monthlyTotal.toLocaleString()} EUR</div>
                      <div className="text-xs text-gray-400">{contract.pricing.billingCycle}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contract.installation.status === 'completed' ? (
                        <span className="text-green-600 text-sm flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Fait
                        </span>
                      ) : contract.installation.status === 'scheduled' ? (
                        <span className="text-blue-600 text-sm flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {contract.installation.scheduledDate
                            ? new Date(contract.installation.scheduledDate).toLocaleDateString('fr-FR')
                            : 'Planifie'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">A planifier</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    Aucun contrat trouve
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <div className="font-mono text-blue-600">{selectedContract.contractNumber}</div>
                <h2 className="text-xl font-bold">{selectedContract.companyName}</h2>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedContract.status]?.color}`}>
                    {statusConfig[selectedContract.status]?.label}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Engagement: {selectedContract.commitmentMonths} mois
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Client</h3>
                  <div className="space-y-1 text-sm">
                    <div>{selectedContract.companyName}</div>
                    <div className="text-gray-500">{selectedContract.contactName}</div>
                    <div className="text-gray-500">{selectedContract.contactEmail}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Commercial</h3>
                  <div className="text-sm">{selectedContract.commercialName || 'Non assigne'}</div>
                </div>
              </div>

              {/* Modules */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Modules souscrits</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedContract.modules.map((mod, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{mod.moduleName}</span>
                      <span className="font-medium">{mod.monthlyPrice} EUR/mois</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-medium">
                    <span>Total mensuel</span>
                    <span className="text-blue-600">{selectedContract.pricing.monthlyTotal} EUR</span>
                  </div>
                </div>
              </div>

              {/* Installation */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Installation</h3>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedContract.installation.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedContract.installation.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedContract.installation.status === 'completed' ? 'Terminee' :
                     selectedContract.installation.status === 'scheduled' ? 'Planifiee' :
                     selectedContract.installation.status === 'in_progress' ? 'En cours' :
                     'A planifier'}
                  </span>
                  {selectedContract.installation.scheduledDate && (
                    <span className="text-sm text-gray-500">
                      {new Date(selectedContract.installation.scheduledDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {selectedContract.installation.status === 'pending' && (
                    <Link
                      href={`/crm/installations?contract=${selectedContract._id}`}
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      Planifier <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Date debut:</span>
                  <div className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Date fin:</span>
                  <div className="font-medium">
                    {selectedContract.endDate
                      ? new Date(selectedContract.endDate).toLocaleDateString('fr-FR')
                      : 'Reconduction auto'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

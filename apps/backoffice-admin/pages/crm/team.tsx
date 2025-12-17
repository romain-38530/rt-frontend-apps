import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Building2, TrendingUp, Euro, Award, CheckCircle,
  Clock, XCircle, Edit2, Trash2, RefreshCw, Filter, ChevronDown,
  UserCheck, Target, Calendar, Briefcase
} from 'lucide-react';
import { crmApi } from '../../lib/api';

interface Commercial {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  type: 'internal' | 'external';
  status: 'active' | 'inactive' | 'on_leave';
  region?: string;
  specialisation?: string[];
  objectifMensuel?: number;
  commissionConfig: {
    tauxConversion: number;
    tauxSignature: number;
    tauxRecurrent: number;
    bonusObjectif: number;
  };
  stats: {
    leadsAssignes: number;
    leadsConverts: number;
    leadsEnCours: number;
    tauxConversion: number;
    commissionsTotal: number;
    commissionsPending: number;
  };
  createdAt: string;
}

interface Commission {
  _id: string;
  commercialId: { _id: string; firstName: string; lastName: string } | string;
  type: 'conversion' | 'signature' | 'bonus' | 'recurring';
  leadCompanyId?: { _id: string; raisonSociale: string };
  montant: number;
  devise: string;
  periode: string;
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  description?: string;
  dateValidation?: string;
  datePaiement?: string;
  createdAt: string;
}

interface TeamStats {
  totalCommerciaux: number;
  internal: number;
  external: number;
  active: number;
  totalLeadsAssignes: number;
  totalLeadsConverts: number;
  avgTauxConversion: number;
  totalCommissions: number;
  totalCommissionsPending: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  internal: { label: 'Interne', color: 'bg-blue-100 text-blue-700' },
  external: { label: 'Externe', color: 'bg-purple-100 text-purple-700' }
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700' },
  on_leave: { label: 'Conge', color: 'bg-yellow-100 text-yellow-700' }
};

const COMMISSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  conversion: { label: 'Conversion', color: 'bg-green-100 text-green-700' },
  signature: { label: 'Signature', color: 'bg-blue-100 text-blue-700' },
  bonus: { label: 'Bonus', color: 'bg-yellow-100 text-yellow-700' },
  recurring: { label: 'Recurrent', color: 'bg-purple-100 text-purple-700' }
};

const COMMISSION_STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  validated: { label: 'Valide', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  paid: { label: 'Paye', color: 'bg-green-100 text-green-700', icon: Euro },
  cancelled: { label: 'Annule', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'commissions'>('team');
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCommercial, setEditingCommercial] = useState<Commercial | null>(null);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    commissionType: '',
    commissionStatus: '',
    periode: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    type: 'internal' as 'internal' | 'external',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    region: '',
    specialisation: [] as string[],
    objectifMensuel: 10,
    commissionConfig: {
      tauxConversion: 50,
      tauxSignature: 200,
      tauxRecurrent: 5,
      bonusObjectif: 500
    }
  });
  const [commissionFormData, setCommissionFormData] = useState({
    commercialId: '',
    type: 'conversion' as 'conversion' | 'signature' | 'bonus' | 'recurring',
    montant: 0,
    description: ''
  });

  useEffect(() => {
    if (activeTab === 'team') {
      loadCommerciaux();
    } else {
      loadCommissions();
    }
    loadStats();
  }, [activeTab, filters]);

  const loadCommerciaux = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getCommerciaux({
        type: filters.type || undefined,
        status: filters.status || undefined
      });
      setCommerciaux(result.data || result || []);
    } catch (error) {
      console.error('Error loading commerciaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getCommissions({
        type: filters.commissionType || undefined,
        status: filters.commissionStatus || undefined,
        periode: filters.periode || undefined
      });
      setCommissions(result.data || result || []);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await crmApi.getCommerciauxStats();
      setStats(result);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCommercial) {
        await crmApi.updateCommercial(editingCommercial._id, formData);
      } else {
        await crmApi.createCommercial(formData);
      }
      setShowForm(false);
      setEditingCommercial(null);
      resetForm();
      loadCommerciaux();
      loadStats();
    } catch (error) {
      console.error('Error saving commercial:', error);
    }
  };

  const handleEdit = (commercial: Commercial) => {
    setEditingCommercial(commercial);
    setFormData({
      firstName: commercial.firstName,
      lastName: commercial.lastName,
      email: commercial.email,
      telephone: commercial.telephone || '',
      type: commercial.type,
      status: commercial.status,
      region: commercial.region || '',
      specialisation: commercial.specialisation || [],
      objectifMensuel: commercial.objectifMensuel || 10,
      commissionConfig: commercial.commissionConfig || {
        tauxConversion: 50,
        tauxSignature: 200,
        tauxRecurrent: 5,
        bonusObjectif: 500
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce commercial ?')) return;
    try {
      await crmApi.deleteCommercial(id);
      loadCommerciaux();
      loadStats();
    } catch (error) {
      console.error('Error deleting commercial:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      telephone: '',
      type: 'internal',
      status: 'active',
      region: '',
      specialisation: [],
      objectifMensuel: 10,
      commissionConfig: {
        tauxConversion: 50,
        tauxSignature: 200,
        tauxRecurrent: 5,
        bonusObjectif: 500
      }
    });
  };

  const handleCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      await crmApi.createCommission({
        ...commissionFormData,
        periode: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      });
      setShowCommissionForm(false);
      setCommissionFormData({ commercialId: '', type: 'conversion', montant: 0, description: '' });
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error creating commission:', error);
    }
  };

  const handleValidateCommission = async (id: string) => {
    try {
      await crmApi.validateCommission(id);
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error validating commission:', error);
    }
  };

  const handlePayCommission = async (id: string) => {
    try {
      await crmApi.payCommission(id);
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error paying commission:', error);
    }
  };

  const handleCancelCommission = async (id: string) => {
    if (!confirm('Etes-vous sur de vouloir annuler cette commission ?')) return;
    try {
      await crmApi.cancelCommission(id);
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error cancelling commission:', error);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      const result = await crmApi.generateMonthlyCommissions();
      alert(`${result.commissionsCreated} commissions generees pour ${result.periode}`);
      loadCommissions();
      loadStats();
    } catch (error) {
      console.error('Error generating commissions:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Equipe Commerciale</h1>
                <p className="text-gray-600">Gestion des commerciaux et commissions</p>
              </div>
            </div>
            <div className="flex gap-2">
              {activeTab === 'team' && (
                <button
                  onClick={() => { setShowForm(true); setEditingCommercial(null); resetForm(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter Commercial
                </button>
              )}
              {activeTab === 'commissions' && (
                <>
                  <button
                    onClick={() => setShowCommissionForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Euro className="w-4 h-4" />
                    Ajouter Commission
                  </button>
                  <button
                    onClick={handleGenerateMonthly}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generer Mensuel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCommerciaux}</p>
              <p className="text-xs text-gray-500">{stats.internal} internes / {stats.external} externes</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">Actifs</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Leads Assignes</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalLeadsAssignes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Convertis</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalLeadsConverts}</p>
              <p className="text-xs text-gray-500">{stats.avgTauxConversion?.toFixed(1)}% taux</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Euro className="w-4 h-4" />
                <span className="text-sm">Commissions Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCommissions?.toLocaleString()} EUR</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">En Attente</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCommissionsPending?.toLocaleString()} EUR</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'team'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Equipe ({commerciaux.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'commissions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Commissions ({commissions.length})
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500" />
          {activeTab === 'team' ? (
            <>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="">Tous les types</option>
                <option value="internal">Interne</option>
                <option value="external">Externe</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="on_leave">En conge</option>
              </select>
            </>
          ) : (
            <>
              <select
                value={filters.commissionType}
                onChange={(e) => setFilters({ ...filters, commissionType: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="">Tous les types</option>
                <option value="conversion">Conversion</option>
                <option value="signature">Signature</option>
                <option value="bonus">Bonus</option>
                <option value="recurring">Recurrent</option>
              </select>
              <select
                value={filters.commissionStatus}
                onChange={(e) => setFilters({ ...filters, commissionStatus: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="validated">Valide</option>
                <option value="paid">Paye</option>
                <option value="cancelled">Annule</option>
              </select>
              <input
                type="month"
                value={filters.periode}
                onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
                placeholder="Periode"
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : activeTab === 'team' ? (
          <div className="grid gap-4">
            {commerciaux.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun commercial trouve</p>
                <button
                  onClick={() => { setShowForm(true); resetForm(); }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Ajouter votre premier commercial
                </button>
              </div>
            ) : (
              commerciaux.map((commercial) => (
                <div key={commercial._id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {commercial.firstName[0]}{commercial.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {commercial.firstName} {commercial.lastName}
                        </h3>
                        <p className="text-gray-600 text-sm">{commercial.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_LABELS[commercial.type].color}`}>
                            {TYPE_LABELS[commercial.type].label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_LABELS[commercial.status].color}`}>
                            {STATUS_LABELS[commercial.status].label}
                          </span>
                          {commercial.region && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                              {commercial.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(commercial)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(commercial._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Leads Assignes</p>
                      <p className="font-semibold">{commercial.stats?.leadsAssignes || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">En Cours</p>
                      <p className="font-semibold text-blue-600">{commercial.stats?.leadsEnCours || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Convertis</p>
                      <p className="font-semibold text-green-600">{commercial.stats?.leadsConverts || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Taux Conversion</p>
                      <p className="font-semibold">{(commercial.stats?.tauxConversion || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Commissions</p>
                      <p className="font-semibold text-purple-600">
                        {(commercial.stats?.commissionsTotal || 0).toLocaleString()} EUR
                        {(commercial.stats?.commissionsPending || 0) > 0 && (
                          <span className="text-yellow-600 text-xs ml-1">
                            (+{commercial.stats?.commissionsPending?.toLocaleString()} pending)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {commercial.objectifMensuel && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Objectif mensuel: {commercial.objectifMensuel} leads
                        </span>
                        <span className="text-gray-500">
                          Commission: {commercial.commissionConfig?.tauxConversion || 50} EUR/lead |
                          Bonus: {commercial.commissionConfig?.bonusObjectif || 500} EUR
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Commercial</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Periode</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Aucune commission trouvee
                    </td>
                  </tr>
                ) : (
                  commissions.map((commission) => {
                    const StatusIcon = COMMISSION_STATUS_LABELS[commission.status]?.icon || Clock;
                    const commercialInfo = typeof commission.commercialId === 'object'
                      ? `${commission.commercialId.firstName} ${commission.commercialId.lastName}`
                      : commission.commercialId;
                    return (
                      <tr key={commission._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium">{commercialInfo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${COMMISSION_TYPE_LABELS[commission.type]?.color || 'bg-gray-100'}`}>
                            {COMMISSION_TYPE_LABELS[commission.type]?.label || commission.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {commission.montant?.toLocaleString()} {commission.devise}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{commission.periode}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${COMMISSION_STATUS_LABELS[commission.status]?.color || 'bg-gray-100'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {COMMISSION_STATUS_LABELS[commission.status]?.label || commission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {commission.description || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {commission.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleValidateCommission(commission._id)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Valider
                                </button>
                                <button
                                  onClick={() => handleCancelCommission(commission._id)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Annuler
                                </button>
                              </>
                            )}
                            {commission.status === 'validated' && (
                              <button
                                onClick={() => handlePayCommission(commission._id)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Payer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commercial Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingCommercial ? 'Modifier Commercial' : 'Nouveau Commercial'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="internal">Interne</option>
                    <option value="external">Externe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="on_leave">En conge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="ex: IDF, PACA..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objectif Mensuel (leads)</label>
                <input
                  type="number"
                  value={formData.objectifMensuel}
                  onChange={(e) => setFormData({ ...formData, objectifMensuel: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Configuration des Commissions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Par Lead Converti (EUR)</label>
                    <input
                      type="number"
                      value={formData.commissionConfig.tauxConversion}
                      onChange={(e) => setFormData({
                        ...formData,
                        commissionConfig: { ...formData.commissionConfig, tauxConversion: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Par Signature (EUR)</label>
                    <input
                      type="number"
                      value={formData.commissionConfig.tauxSignature}
                      onChange={(e) => setFormData({
                        ...formData,
                        commissionConfig: { ...formData.commissionConfig, tauxSignature: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Recurrent (%)</label>
                    <input
                      type="number"
                      value={formData.commissionConfig.tauxRecurrent}
                      onChange={(e) => setFormData({
                        ...formData,
                        commissionConfig: { ...formData.commissionConfig, tauxRecurrent: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bonus Objectif (EUR)</label>
                    <input
                      type="number"
                      value={formData.commissionConfig.bonusObjectif}
                      onChange={(e) => setFormData({
                        ...formData,
                        commissionConfig: { ...formData.commissionConfig, bonusObjectif: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCommercial(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCommercial ? 'Modifier' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Form Modal */}
      {showCommissionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Nouvelle Commission</h2>
            </div>
            <form onSubmit={handleCommissionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commercial *</label>
                <select
                  required
                  value={commissionFormData.commercialId}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, commercialId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selectionner...</option>
                  {commerciaux.map((c) => (
                    <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={commissionFormData.type}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="conversion">Conversion</option>
                  <option value="signature">Signature</option>
                  <option value="bonus">Bonus</option>
                  <option value="recurring">Recurrent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (EUR) *</label>
                <input
                  type="number"
                  required
                  value={commissionFormData.montant}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, montant: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={commissionFormData.description}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCommissionForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Creer Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Building2, Search, Filter, Plus, Sparkles, ChevronRight, Globe, Mail, Phone, ExternalLink, RefreshCw } from 'lucide-react';
import { crmApi } from '../../../lib/api';

interface Company {
  _id: string;
  raisonSociale: string;
  siren?: string;
  pays: string;
  ville?: string;
  secteurActivite?: string;
  effectif?: string;
  siteWeb?: string;
  telephone?: string;
  statutProspection: string;
  scoreLead?: number;
  dateEnrichissement?: string;
  commercialAssigneId?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau',
  ENRICHED: 'Enrichi',
  CONTACTED: 'Contacte',
  IN_PROGRESS: 'En cours',
  CONVERTED: 'Converti',
  LOST: 'Perdu',
  BLACKLISTED: 'Blackliste'
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  ENRICHED: 'bg-purple-100 text-purple-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  CONVERTED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  BLACKLISTED: 'bg-gray-100 text-gray-700'
};

const COUNTRIES = ['France', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni', 'Pays-Bas', 'Belgique', 'Suisse', 'Autriche', 'Portugal'];
const SECTORS = ['Transport', 'Logistique', 'Industrie', 'Agroalimentaire', 'Chimie', 'Automobile', 'Distribution', 'E-commerce'];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    pays: '',
    secteur: '',
    statut: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, [filters, pagination.page]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getCompanies({
        ...filters,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      if (result.success) {
        setCompanies(result.companies);
        setPagination(prev => ({ ...prev, total: result.total }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCompanies();
  };

  const handleEnrich = async (companyId: string) => {
    setEnrichingId(companyId);
    try {
      const result = await crmApi.enrichCompany(companyId);
      if (result.success) {
        loadCompanies();
      } else {
        alert('Erreur enrichissement: ' + result.error);
      }
    } catch (error) {
      console.error('Error enriching company:', error);
    } finally {
      setEnrichingId(null);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-700';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    if (score >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="text-orange-500" />
            Entreprises
          </h1>
          <p className="text-gray-600 mt-1">Gerez vos prospects et enrichissez leurs donnees</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
            Filtres
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, SIREN, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Rechercher
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select
                value={filters.pays}
                onChange={(e) => setFilters(prev => ({ ...prev, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
              <select
                value={filters.secteur}
                onChange={(e) => setFilters(prev => ({ ...prev, secteur: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les secteurs</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune entreprise</h3>
            <p className="text-gray-600">Ajoutez des entreprises ou modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Entreprise</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Localisation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Secteur</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {company.raisonSociale?.charAt(0) || '?'}
                        </div>
                        <div>
                          <a
                            href={`/crm/companies/${company._id}`}
                            className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                          >
                            {company.raisonSociale}
                          </a>
                          {company.siren && (
                            <p className="text-sm text-gray-500">SIREN: {company.siren}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Globe size={16} />
                        <span>{company.ville ? `${company.ville}, ` : ''}{company.pays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-600">{company.secteurActivite || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[company.statutProspection] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[company.statutProspection] || company.statutProspection}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {company.scoreLead !== undefined ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(company.scoreLead)}`}>
                          {company.scoreLead}/100
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEnrich(company._id)}
                          disabled={enrichingId === company._id}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Enrichir via Lemlist"
                        >
                          {enrichingId === company._id ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </button>
                        {company.siteWeb && (
                          <a
                            href={company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Visiter le site"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                        <a
                          href={`/crm/companies/${company._id}`}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Voir les details"
                        >
                          <ChevronRight size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Precedent
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}

function AddCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    raisonSociale: '',
    siren: '',
    pays: 'France',
    ville: '',
    secteurActivite: '',
    siteWeb: '',
    telephone: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await crmApi.createCompany(formData);
      if (result.success) {
        onSuccess();
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter une entreprise</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale *</label>
            <input
              type="text"
              required
              value={formData.raisonSociale}
              onChange={(e) => setFormData(prev => ({ ...prev, raisonSociale: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
              <input
                type="text"
                value={formData.siren}
                onChange={(e) => setFormData(prev => ({ ...prev, siren: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
              <select
                required
                value={formData.pays}
                onChange={(e) => setFormData(prev => ({ ...prev, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
              <select
                value={formData.secteurActivite}
                onChange={(e) => setFormData(prev => ({ ...prev, secteurActivite: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Selectionner</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <input
              type="text"
              value={formData.siteWeb}
              onChange={(e) => setFormData(prev => ({ ...prev, siteWeb: e.target.value }))}
              placeholder="www.exemple.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

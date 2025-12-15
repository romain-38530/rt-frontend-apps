import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Users, Building2, Search, Filter, Globe, Star, UserPlus, RefreshCw,
  ChevronRight, ExternalLink, Mail, Phone, Linkedin, Award, TrendingUp,
  CheckCircle, Clock, Inbox, UserCheck, ArrowRight, XCircle
} from 'lucide-react';
import { crmApi } from '../../lib/api';

interface PoolLead {
  _id: string;
  raisonSociale: string;
  siteWeb?: string;
  telephone?: string;
  emailGenerique?: string;
  adresse: {
    pays: string;
    ville?: string;
    ligne1?: string;
    codePostal?: string;
  };
  secteurActivite?: string;
  scoreLead?: number;
  prioritePool?: number;
  nbContactsEnrichis?: number;
  dateAddedToPool?: string;
  salonSourceId?: { _id: string; nom: string };
  produits?: string[];
  contacts?: Array<{
    prenom: string;
    nom: string;
    email: string;
    poste: string;
    emailStatus: string;
  }>;
}

interface PoolStats {
  totalLeads: number;
  avgScore: number;
  withContacts: number;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  5: { label: 'Tres haute', color: 'bg-red-100 text-red-700' },
  4: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'Basse', color: 'bg-blue-100 text-blue-700' },
  1: { label: 'Tres basse', color: 'bg-gray-100 text-gray-700' }
};

const COUNTRIES = ['France', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni', 'Pays-Bas', 'Belgique', 'Suisse'];

// Simulated commercial ID (in real app, get from auth context)
// Using a valid MongoDB ObjectId format for demo
const CURRENT_COMMERCIAL_ID = '507f1f77bcf86cd799439011';
const CURRENT_COMMERCIAL_NAME = 'Commercial Demo';

export default function LeadPoolPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<PoolLead[]>([]);
  const [myLeads, setMyLeads] = useState<PoolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pool' | 'my-leads'>('pool');
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [poolStats, setPoolStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    departement: '',
    minScore: 0,
    hasContacts: false,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (activeTab === 'pool') {
      loadPool();
    } else {
      loadMyLeads();
    }
    loadPoolStats();
  }, [activeTab, filters, page]);

  const loadPool = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getPool({
        page,
        limit: 20,
        pays: filters.pays || undefined,
        ville: filters.ville || undefined,
        departement: filters.departement || undefined,
        minScore: filters.minScore || undefined,
        hasContacts: filters.hasContacts || undefined,
        search: filters.search || undefined
      });
      setLeads(result.data || []);
      setTotal(result.total || 0);
      setStats(result.stats || null);
    } catch (error) {
      console.error('Error loading pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyLeads = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getMyLeads(CURRENT_COMMERCIAL_ID, { page, limit: 20 });
      setMyLeads(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Error loading my leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPoolStats = async () => {
    try {
      const result = await crmApi.getPoolStats();
      setPoolStats(result);
    } catch (error) {
      console.error('Error loading pool stats:', error);
    }
  };

  const handleClaimLead = async (companyId: string) => {
    setClaimingId(companyId);
    try {
      const result = await crmApi.claimLead(companyId, CURRENT_COMMERCIAL_ID, CURRENT_COMMERCIAL_NAME);
      if (result.success) {
        // Remove from pool list
        setLeads(prev => prev.filter(l => l._id !== companyId));
        // Reload stats
        loadPoolStats();
        alert('Lead assigne avec succes!');
      } else {
        alert('Erreur: ' + (result.error || 'Lead non disponible'));
      }
    } catch (error) {
      console.error('Error claiming lead:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleReleaseLead = async (companyId: string, reason: string) => {
    setReleasingId(companyId);
    try {
      const result = await crmApi.releaseLead(companyId, CURRENT_COMMERCIAL_ID, reason);
      if (result.success) {
        setMyLeads(prev => prev.filter(l => l._id !== companyId));
        loadPoolStats();
        alert('Lead libere et remis dans le pool');
      } else {
        alert('Erreur: ' + (result.error || 'Impossible de liberer le lead'));
      }
    } catch (error) {
      console.error('Error releasing lead:', error);
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Inbox size={32} />
          <h1 className="text-3xl font-bold">Pool de Leads</h1>
        </div>
        <p className="text-lg opacity-90">
          Piochez dans le pool de leads qualifies et enrichis pour votre prospection
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-3xl font-bold">{poolStats?.inPool || 0}</div>
            <div className="text-sm opacity-75">Leads disponibles</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-3xl font-bold">{poolStats?.withContacts || 0}</div>
            <div className="text-sm opacity-75">Avec contacts</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-3xl font-bold">{poolStats?.avgScore || 0}</div>
            <div className="text-sm opacity-75">Score moyen</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-3xl font-bold">{poolStats?.assigned || 0}</div>
            <div className="text-sm opacity-75">Leads assignes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('pool'); setPage(1); }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'pool'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox size={18} />
            Pool disponible
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
              {poolStats?.inPool || 0}
            </span>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('my-leads'); setPage(1); }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'my-leads'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck size={18} />
            Mes leads
          </div>
        </button>
      </div>

      {/* Filters (Pool tab only) */}
      {activeTab === 'pool' && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              Filtres
            </button>
            <button
              onClick={loadPool}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200"
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && loadPool()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && activeTab === 'pool' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select
                value={filters.pays}
                onChange={(e) => setFilters(prev => ({ ...prev, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departement</label>
              <input
                type="text"
                placeholder="Ex: 75, 69, 33..."
                value={filters.departement}
                onChange={(e) => setFilters(prev => ({ ...prev, departement: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                placeholder="Ex: Paris, Lyon..."
                value={filters.ville}
                onChange={(e) => setFilters(prev => ({ ...prev, ville: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score minimum</label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Tous</option>
                <option value={50}>50+</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
                <option value={90}>90+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacts</label>
              <select
                value={filters.hasContacts ? 'yes' : 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, hasContacts: e.target.value === 'yes' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tous</option>
                <option value="yes">Avec contacts enrichis</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilters({ pays: '', ville: '', departement: '', minScore: 0, hasContacts: false, search: '' }); setPage(1); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-indigo-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : (activeTab === 'pool' ? leads : myLeads).length === 0 ? (
          <div className="text-center py-12">
            <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pool' ? 'Pool vide' : 'Aucun lead assigne'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pool'
                ? 'Aucun lead disponible avec ces criteres'
                : 'Piochez dans le pool pour vous affecter des leads'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {(activeTab === 'pool' ? leads : myLeads).map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                isMyLead={activeTab === 'my-leads'}
                onClaim={() => handleClaimLead(lead._id)}
                onRelease={(reason) => handleReleaseLead(lead._id, reason)}
                claiming={claimingId === lead._id}
                releasing={releasingId === lead._id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {page} sur {Math.ceil(total / 20)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Precedent
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  isMyLead,
  onClaim,
  onRelease,
  claiming,
  releasing
}: {
  lead: PoolLead;
  isMyLead: boolean;
  onClaim: () => void;
  onRelease: (reason: string) => void;
  claiming: boolean;
  releasing: boolean;
}) {
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');

  const priorityConfig = PRIORITY_LABELS[lead.prioritePool || 3] || PRIORITY_LABELS[3];

  return (
    <>
      <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/crm/leads/${lead._id}`)}>
        <div className="flex items-start gap-4">
          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {lead.raisonSociale?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 hover:text-purple-600">{lead.raisonSociale}</h3>
                  {lead.scoreLead && (
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                      <Star size={12} />
                      {lead.scoreLead}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Globe size={14} />
                    {lead.adresse?.ligne1 && `${lead.adresse.ligne1}, `}
                    {lead.adresse?.codePostal && `${lead.adresse.codePostal} `}
                    {lead.adresse?.ville || ''}{lead.adresse?.ville && lead.adresse?.pays ? ', ' : ''}
                    {lead.adresse?.pays || 'N/A'}
                  </span>
                  {lead.secteurActivite && (
                    <span className="flex items-center gap-1">
                      <Building2 size={14} />
                      {lead.secteurActivite}
                    </span>
                  )}
                  {lead.salonSourceId && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Award size={14} />
                      {lead.salonSourceId.nom}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contacts Preview */}
            {lead.contacts && lead.contacts.length > 0 && (
              <div className="mt-3 pl-15">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {lead.contacts.length} contact(s) enrichi(s)
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.contacts.slice(0, 3).map((contact, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {contact.prenom?.charAt(0)}{contact.nom?.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium">{contact.prenom} {contact.nom}</span>
                        <span className="text-gray-500 ml-1">- {contact.poste}</span>
                      </div>
                      {contact.emailStatus === 'VALID' && (
                        <CheckCircle size={14} className="text-green-500" />
                      )}
                    </div>
                  ))}
                  {lead.contacts.length > 3 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{lead.contacts.length - 3} autres
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* No contacts indicator */}
            {(!lead.contacts || lead.contacts.length === 0) && lead.nbContactsEnrichis === 0 && (
              <div className="mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                <Clock size={12} />
                En attente d'enrichissement
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {lead.siteWeb && (
              <a
                href={lead.siteWeb.startsWith('http') ? lead.siteWeb : `https://${lead.siteWeb}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Visiter le site"
              >
                <ExternalLink size={18} />
              </a>
            )}

            {!isMyLead ? (
              <button
                onClick={onClaim}
                disabled={claiming}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {claiming ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {claiming ? 'Assignation...' : 'Prendre ce lead'}
              </button>
            ) : (
              <button
                onClick={() => setShowReleaseModal(true)}
                disabled={releasing}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {releasing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Liberer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Liberer ce lead</h3>
            <p className="text-gray-600 mb-4">
              Ce lead sera remis dans le pool et pourra etre pris par un autre commercial.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
              <textarea
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Ex: Pas d'interet, mauvais contact, etc."
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onRelease(releaseReason);
                  setShowReleaseModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

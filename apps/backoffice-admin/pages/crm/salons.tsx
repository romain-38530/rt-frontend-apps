import { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Globe, MapPin, RefreshCw, ExternalLink, Play, Pause, CheckCircle, AlertCircle, Download, Link, Settings, Zap, Clock, Building2, Users, Sparkles } from 'lucide-react';
import { crmApi } from '../../lib/api';

interface Salon {
  _id: string;
  nom: string;
  edition?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  pays: string;
  url?: string;
  urlListeExposants?: string;
  adaptateur?: string;
  statutScraping: string;
  nbExposantsCollectes: number;
  derniereExecution?: string;
  createdAt: string;
}

interface ScrapingAdapter {
  name: string;
  description: string;
}

const SCRAPING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  A_SCRAPER: { label: 'A scraper', color: 'bg-blue-100 text-blue-700', icon: Play },
  EN_COURS: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
  TERMINE: { label: 'Termine', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ERREUR: { label: 'Erreur', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  DESACTIVE: { label: 'Desactive', color: 'bg-gray-100 text-gray-700', icon: Pause }
};

const COUNTRIES = ['France', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni', 'Pays-Bas', 'Belgique', 'Suisse', 'Autriche', 'Portugal'];

export default function SalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [adapters, setAdapters] = useState<ScrapingAdapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ pays: '', statut: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [scrapingInProgress, setScrapingInProgress] = useState<string | null>(null);
  const [scrapingResult, setScrapingResult] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);

  useEffect(() => {
    loadSalons();
    loadAdapters();
  }, [filters]);

  const loadSalons = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getSalons(filters);
      if (result.success) {
        setSalons(result.salons);
      }
    } catch (error) {
      console.error('Error loading salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdapters = async () => {
    try {
      const result = await crmApi.getScrapingAdapters();
      if (result.adapters) {
        setAdapters(result.adapters);
      }
    } catch (error) {
      console.error('Error loading adapters:', error);
    }
  };

  const handleUpdateStatus = async (salonId: string, newStatus: string) => {
    try {
      const result = await crmApi.updateSalon(salonId, { statutScraping: newStatus });
      if (result.success) {
        loadSalons();
      }
    } catch (error) {
      console.error('Error updating salon:', error);
    }
  };

  const handleStartScraping = async (salon: Salon) => {
    if (!salon.urlListeExposants) {
      alert('URL de la liste des exposants requise. Veuillez modifier le salon pour ajouter cette URL.');
      return;
    }

    setScrapingInProgress(salon._id);
    setScrapingResult(null);

    try {
      const result = await crmApi.scrapeSalon(salon._id, { maxPages: 10, delay: 2000 });
      setScrapingResult({
        salonId: salon._id,
        salonName: salon.nom,
        ...result
      });
      loadSalons();
    } catch (error: any) {
      setScrapingResult({
        salonId: salon._id,
        salonName: salon.nom,
        success: false,
        error: error.message || 'Erreur lors du scraping'
      });
    } finally {
      setScrapingInProgress(null);
    }
  };

  const handleEnrichSalon = async (salon: Salon) => {
    if (salon.nbExposantsCollectes === 0) {
      alert('Aucune entreprise a enrichir. Lancez d\'abord le scraping.');
      return;
    }

    setEnrichingId(salon._id);
    setEnrichmentResult(null);

    try {
      const result = await crmApi.enrichSalonCompanies(salon._id, 50);
      setEnrichmentResult({
        salonId: salon._id,
        salonName: salon.nom,
        ...result
      });
    } catch (error: any) {
      setEnrichmentResult({
        salonId: salon._id,
        salonName: salon.nom,
        success: false,
        error: error.message || 'Erreur lors de l\'enrichissement'
      });
    } finally {
      setEnrichingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="text-purple-500" />
            Salons professionnels
          </h1>
          <p className="text-gray-600 mt-1">Sources de leads - Scraping automatique des exposants</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Zap size={18} />
            Test scraping
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search size={18} />
            Filtres
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 hover:bg-purple-600 transition-colors"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Scraping Result Banner */}
      {scrapingResult && (
        <div className={`rounded-xl p-4 ${scrapingResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {scrapingResult.success ? (
                <CheckCircle className="text-green-500 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
              )}
              <div>
                <h3 className={`font-semibold ${scrapingResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {scrapingResult.success ? 'Scraping termine' : 'Erreur de scraping'} - {scrapingResult.salonName}
                </h3>
                {scrapingResult.success ? (
                  <div className="text-sm text-green-700 mt-1 space-y-1">
                    <p><strong>{scrapingResult.totalScraped}</strong> exposants trouves</p>
                    <p><strong>{scrapingResult.companiesCreated}</strong> nouvelles entreprises creees</p>
                    <p><strong>{scrapingResult.duplicatesSkipped}</strong> doublons ignores</p>
                    <p className="text-green-600">Duree: {Math.round(scrapingResult.duration / 1000)}s</p>
                    {scrapingResult.enrichment?.enrichmentStarted && (
                      <p className="text-blue-600 font-medium mt-2">
                        Enrichissement automatique lance en arriere-plan
                      </p>
                    )}
                    {scrapingResult.companiesCreated > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <a
                          href="/crm/pool"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                        >
                          Voir dans le Pool de Leads
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-700 mt-1">{scrapingResult.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setScrapingResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Enrichment Result Banner */}
      {enrichmentResult && (
        <div className={`rounded-xl p-4 ${enrichmentResult.success ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {enrichmentResult.success ? (
                <Sparkles className="text-blue-500 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
              )}
              <div>
                <h3 className={`font-semibold ${enrichmentResult.success ? 'text-blue-900' : 'text-red-900'}`}>
                  {enrichmentResult.success ? 'Enrichissement termine' : 'Erreur d\'enrichissement'} - {enrichmentResult.salonName}
                </h3>
                {enrichmentResult.success ? (
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p><strong>{enrichmentResult.totalCompanies}</strong> entreprises traitees</p>
                    <p><strong>{enrichmentResult.totalContactsFound}</strong> contacts trouves</p>
                    <p><strong>{enrichmentResult.totalContactsCreated}</strong> contacts crees</p>
                    <p className="text-blue-600">Duree: {Math.round(enrichmentResult.duration / 1000)}s</p>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <a
                        href="/crm/pool"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                      >
                        <Users size={16} />
                        Voir dans le Pool de Leads
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700 mt-1">{enrichmentResult.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEnrichmentResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select
                value={filters.pays}
                onChange={(e) => setFilters(prev => ({ ...prev, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut scraping</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(SCRAPING_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Salons List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-purple-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun salon</h3>
            <p className="text-gray-600">Ajoutez votre premier salon professionnel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {salons.map((salon) => {
              const statusConfig = SCRAPING_STATUS_CONFIG[salon.statutScraping] || SCRAPING_STATUS_CONFIG.A_SCRAPER;
              const StatusIcon = statusConfig.icon;
              const isScrapingThis = scrapingInProgress === salon._id;

              return (
                <div key={salon._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{salon.nom}</h3>
                      {salon.edition && (
                        <p className="text-sm text-gray-500">{salon.edition}</p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon size={12} className={salon.statutScraping === 'EN_COURS' || isScrapingThis ? 'animate-spin' : ''} />
                      {isScrapingThis ? 'Scraping...' : statusConfig.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe size={14} />
                      <span>{salon.pays}</span>
                    </div>
                    {salon.lieu && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{salon.lieu}</span>
                      </div>
                    )}
                    {salon.dateDebut && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>
                          {new Date(salon.dateDebut).toLocaleDateString('fr-FR')}
                          {salon.dateFin && ` - ${new Date(salon.dateFin).toLocaleDateString('fr-FR')}`}
                        </span>
                      </div>
                    )}
                    {salon.adaptateur && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Settings size={14} />
                        <span>Adaptateur: {salon.adaptateur}</span>
                      </div>
                    )}
                    {salon.derniereExecution && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>Dernier: {new Date(salon.derniereExecution).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>

                  {/* URL exposants indicator */}
                  {salon.urlListeExposants ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-3 bg-green-50 p-2 rounded-lg">
                      <Link size={14} />
                      <span className="truncate">{salon.urlListeExposants}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-3 bg-orange-50 p-2 rounded-lg">
                      <AlertCircle size={14} />
                      <span>URL exposants manquante</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm">
                      <span className="font-semibold text-purple-600">{salon.nbExposantsCollectes}</span>
                      <span className="text-gray-500 ml-1">exposants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {salon.url && (
                        <a
                          href={salon.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Site web"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {salon.urlListeExposants && salon.statutScraping !== 'EN_COURS' && !isScrapingThis && (
                        <button
                          onClick={() => handleStartScraping(salon)}
                          disabled={isScrapingThis}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Lancer le scraping"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      {salon.nbExposantsCollectes > 0 && enrichingId !== salon._id && (
                        <button
                          onClick={() => handleEnrichSalon(salon)}
                          disabled={enrichingId === salon._id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Enrichir les contacts"
                        >
                          <Sparkles size={16} />
                        </button>
                      )}
                      {enrichingId === salon._id && (
                        <div className="p-2">
                          <RefreshCw size={16} className="animate-spin text-blue-500" />
                        </div>
                      )}
                      {salon.statutScraping !== 'EN_COURS' && !isScrapingThis && (
                        <button
                          onClick={() => handleUpdateStatus(salon._id, salon.statutScraping === 'DESACTIVE' ? 'A_SCRAPER' : 'DESACTIVE')}
                          className={`p-2 rounded-lg transition-colors ${
                            salon.statutScraping === 'DESACTIVE'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title={salon.statutScraping === 'DESACTIVE' ? 'Activer' : 'Desactiver'}
                        >
                          {salon.statutScraping === 'DESACTIVE' ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Salon Modal */}
      {showAddModal && (
        <AddSalonModal
          adapters={adapters}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadSalons();
          }}
        />
      )}

      {/* Test Scraping Modal */}
      {showTestModal && (
        <TestScrapingModal
          adapters={adapters}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
}

function AddSalonModal({ adapters, onClose, onSuccess }: { adapters: ScrapingAdapter[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nom: '',
    edition: '',
    pays: 'France',
    lieu: '',
    url: '',
    urlListeExposants: '',
    adaptateur: 'Generic',
    dateDebut: '',
    dateFin: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await crmApi.createSalon(formData);
      if (result.success) {
        onSuccess();
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error creating salon:', error);
      alert('Erreur: ' + (error?.message || 'Erreur de connexion'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter un salon</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du salon *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Transport Logistic Munich"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => setFormData(prev => ({ ...prev, edition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
              <select
                required
                value={formData.pays}
                onChange={(e) => setFormData(prev => ({ ...prev, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Munich, Parc des expositions"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date debut</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Download size={16} className="text-purple-500" />
              Configuration scraping
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL site web du salon</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://www.salon-exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de la liste des exposants
              <span className="text-orange-500 ml-1">*</span>
            </label>
            <input
              type="url"
              value={formData.urlListeExposants}
              onChange={(e) => setFormData(prev => ({ ...prev, urlListeExposants: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://www.salon-exemple.com/exhibitors"
            />
            <p className="text-xs text-gray-500 mt-1">Page listant tous les exposants du salon (obligatoire pour le scraping)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adaptateur scraping</label>
            <select
              value={formData.adaptateur}
              onChange={(e) => setFormData(prev => ({ ...prev, adaptateur: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {adapters.map(a => (
                <option key={a.name} value={a.name}>{a.name} - {a.description}</option>
              ))}
              {adapters.length === 0 && <option value="Generic">Generic</option>}
            </select>
            <p className="text-xs text-gray-500 mt-1">Selectionnez l'adaptateur adapte au site web du salon</p>
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
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TestScrapingModal({ adapters, onClose }: { adapters: ScrapingAdapter[]; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [adapter, setAdapter] = useState('Generic');
  const [maxPages, setMaxPages] = useState(3);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!url) {
      alert('URL requise');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const testResult = await crmApi.testScraping({ url, adapter, maxPages });
      setResult(testResult);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-green-500" />
          Test de scraping
        </h2>
        <p className="text-gray-600 mb-4">
          Testez le scraping sur une URL sans sauvegarder les resultats en base de donnees.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL a scraper *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://www.salon-exemple.com/exhibitors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adaptateur</label>
              <select
                value={adapter}
                onChange={(e) => setAdapter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {adapters.map(a => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
                {adapters.length === 0 && <option value="Generic">Generic</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nb pages max</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={testing || !url}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Scraping en cours...
              </>
            ) : (
              <>
                <Zap size={18} />
                Lancer le test
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? 'Resultats du test' : 'Erreur'}
            </h3>

            {result.success ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-500">Entreprises trouvees</span>
                    <p className="text-2xl font-bold text-green-600">{result.totalScraped}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-500">Duree</span>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(result.duration / 1000)}s</p>
                  </div>
                </div>

                {result.companies && result.companies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Apercu (10 premieres):</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.companies.slice(0, 10).map((company: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded border border-gray-200 flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{company.raisonSociale}</span>
                          {company.pays && <span className="text-xs text-gray-500">({company.pays})</span>}
                          {company.siteWeb && (
                            <a href={`https://${company.siteWeb}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-500 hover:text-blue-700">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-red-700">{result.error}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

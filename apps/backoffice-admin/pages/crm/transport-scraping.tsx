/**
 * Page de scraping transport pour Affret IA
 * Outil de collecte et gestion des entreprises de transport
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useApi } from '../../hooks/useApi';
import { useRouter } from 'next/router';

interface ScrapingJob {
  id: string;
  source: string;
  type: 'companies' | 'offers' | 'continuous';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  startedAt?: string;
  completedAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  totalFound: number;
  totalImported: number;
  totalUpdated: number;
  totalDuplicates: number;
  errors: string[];
  interval?: number;
  isActive: boolean;
}

interface CompanyStats {
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  addedToLeadPool: number;
  withEmail: number;
  withPhone: number;
}

interface OfferStats {
  total: number;
  active: number;
  bySource: Record<string, number>;
  byOriginDepartment: Record<string, number>;
  byDestinationDepartment: Record<string, number>;
  topRoutes: Array<{ origin: string; destination: string; count: number }>;
  lastScrapedAt?: string;
}

interface TransportCompany {
  _id: string;
  companyName: string;
  legalName?: string;
  siret?: string;
  email?: string;
  phone?: string;
  address?: {
    city?: string;
    postalCode?: string;
    departmentCode?: string;
  };
  transportInfo?: {
    services?: string[];
    vehicleTypes?: string[];
    coveredDepartments?: string[];
  };
  source?: {
    name: string;
    scrapedAt?: string;
  };
  prospectionStatus: string;
  addedToLeadPool: boolean;
  tags?: string[];
}

interface TransportOffer {
  _id: string;
  externalId: string;
  company: {
    name: string;
    transportCompanyId?: string;
  };
  route: {
    origin: { city?: string; department?: string; country?: string };
    destination: { city?: string; department?: string; country?: string };
  };
  loadingDate?: string;
  cargo?: {
    type?: string;
    weight?: number;
  };
  vehicle?: {
    type?: string;
  };
  status: string;
  source: {
    name: string;
    scrapedAt: string;
    lastSeenAt: string;
  };
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  to_contact: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-purple-100 text-purple-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-gray-100 text-gray-800',
  client: 'bg-emerald-100 text-emerald-800',
  blacklist: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  to_contact: 'A contacter',
  contacted: 'Contacte',
  interested: 'Interesse',
  not_interested: 'Pas interesse',
  client: 'Client',
  blacklist: 'Blacklist'
};

export default function TransportScrapingPage() {
  const router = useRouter();
  const api = useApi();

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'offers' | 'jobs'>('dashboard');
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [offerStats, setOfferStats] = useState<OfferStats | null>(null);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [companies, setCompanies] = useState<TransportCompany[]>([]);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [offersPage, setOffersPage] = useState(1);
  const [offersTotal, setOffersTotal] = useState(0);

  // Filters
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatus, setCompanyStatus] = useState('');
  const [companyDepartment, setCompanyDepartment] = useState('');
  const [offerSearch, setOfferSearch] = useState('');

  // Config
  const [config, setConfig] = useState<any>(null);
  const [b2pwebUsername, setB2pwebUsername] = useState('');
  const [b2pwebPassword, setB2pwebPassword] = useState('');

  // Loading
  const [loading, setLoading] = useState(false);

  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to format dates only on client side (prevents hydration mismatch)
  const formatDate = (dateStr: string | undefined, includeTime = false) => {
    if (!dateStr || !mounted) return '-';
    try {
      const date = new Date(dateStr);
      return includeTime
        ? date.toLocaleString('fr-FR')
        : date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  // Fetch data - sequential calls to avoid overwhelming the browser
  const fetchStats = useCallback(async () => {
    try {
      // Sequential calls instead of parallel to reduce load
      const compStats = await api.get('/admin/transport-scraping/stats');
      setCompanyStats(compStats.data);

      const offStats = await api.get('/admin/transport-scraping/stats/offers');
      setOfferStats(offStats.data);

      const configData = await api.get('/admin/transport-scraping/config');
      setConfig(configData.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get('/admin/transport-scraping/jobs');
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: companiesPage.toString(),
        limit: '20',
        ...(companySearch && { search: companySearch }),
        ...(companyStatus && { status: companyStatus }),
        ...(companyDepartment && { department: companyDepartment })
      });
      const response = await api.get(`/admin/transport-scraping/companies?${params}`);
      setCompanies(response.data?.companies || []);
      setCompaniesTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesPage, companySearch, companyStatus, companyDepartment]);

  const fetchOffers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: offersPage.toString(),
        limit: '20',
        ...(offerSearch && { search: offerSearch })
      });
      const response = await api.get(`/admin/transport-scraping/offers?${params}`);
      setOffers(response.data?.offers || []);
      setOffersTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offersPage, offerSearch]);

  // Initial fetch - only once on mount
  useEffect(() => {
    fetchStats();
    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab change effect
  useEffect(() => {
    if (activeTab === 'companies') fetchCompanies();
    if (activeTab === 'offers') fetchOffers();
    if (activeTab === 'jobs') fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Actions
  const handleB2PWebAuth = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/transport-scraping/b2pweb/auth', {
        username: b2pwebUsername,
        password: b2pwebPassword
      });
      if (response.success) {
        alert('Authentification B2PWeb reussie!');
        fetchStats();
      } else {
        alert('Erreur: ' + response.error);
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const handleStartContinuousScraping = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/transport-scraping/scrape/continuous/start', {
        intervalMinutes: 30
      });
      if (response.success) {
        alert('Scraping continu demarre!');
        fetchJobs();
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const handleStopContinuousScraping = async () => {
    setLoading(true);
    try {
      await api.post('/admin/transport-scraping/scrape/continuous/stop');
      alert('Scraping continu arrete');
      fetchJobs();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddToLeadPool = async () => {
    if (selectedCompanies.length === 0) {
      alert('Selectionnez des entreprises');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/admin/transport-scraping/companies/add-to-lead-pool', {
        companyIds: selectedCompanies
      });
      alert(`${response.data?.success || 0} entreprises ajoutees au Lead Pool`);
      setSelectedCompanies([]);
      fetchCompanies();
      fetchStats();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (companyId: string, status: string) => {
    try {
      await api.post(`/admin/transport-scraping/companies/${companyId}/status`, { status });
      fetchCompanies();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/admin/transport-scraping/export/csv`, '_blank');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const continuousJob = jobs.find(j => j.type === 'continuous' && j.isActive);

  return (
    <>
      <Head>
        <title>Scraping Transport - Affret IA | SYMPHONI.A</title>
      </Head>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scraping Transport - Affret IA</h1>
          <p className="text-gray-600">Collecte et gestion des entreprises de transport</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'companies', label: 'Entreprises' },
              { id: 'offers', label: 'Offres/Routes' },
              { id: 'jobs', label: 'Jobs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* B2PWeb Config */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Configuration B2PWeb</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${config?.b2pwebAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {config?.b2pwebAuthenticated ? 'Connecte' : 'Non connecte'}
                </span>
                {continuousJob && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Scraping actif (interval: {continuousJob.interval}min)
                  </span>
                )}
              </div>

              {!config?.b2pwebAuthenticated && (
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={b2pwebUsername}
                      onChange={e => setB2pwebUsername(e.target.value)}
                      className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={b2pwebPassword}
                      onChange={e => setB2pwebPassword(e.target.value)}
                      className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleB2PWebAuth}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Connecter
                  </button>
                </div>
              )}

              {config?.b2pwebAuthenticated && (
                <div className="flex gap-4">
                  {!continuousJob ? (
                    <button
                      onClick={handleStartContinuousScraping}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Demarrer Scraping Continu
                    </button>
                  ) : (
                    <button
                      onClick={handleStopContinuousScraping}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Arreter Scraping
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Entreprises</p>
                <p className="text-2xl font-bold">{companyStats?.total || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Avec Email</p>
                <p className="text-2xl font-bold">{companyStats?.withEmail || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Dans Lead Pool</p>
                <p className="text-2xl font-bold">{companyStats?.addedToLeadPool || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Offres Actives</p>
                <p className="text-2xl font-bold">{offerStats?.active || 0}</p>
              </div>
            </div>

            {/* Top Routes */}
            {offerStats?.topRoutes && offerStats.topRoutes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Top Routes</h2>
                <div className="space-y-2">
                  {offerStats.topRoutes.slice(0, 10).map((route, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b">
                      <span>{route.origin} → {route.destination}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm">{route.count} offres</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Status */}
            {companyStats?.byStatus && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Par Statut</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(companyStats.byStatus).map(([status, count]) => (
                    <span key={status} className={`px-3 py-1 rounded-full text-sm ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[status] || status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Filters & Actions */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Rechercher..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <select
                value={companyStatus}
                onChange={e => setCompanyStatus(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Tous statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Departement (ex: 75)"
                value={companyDepartment}
                onChange={e => setCompanyDepartment(e.target.value)}
                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button onClick={() => { setCompaniesPage(1); fetchCompanies(); }} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Filtrer
              </button>
              <div className="flex-1" />
              <button onClick={handleExportCSV} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Export CSV
              </button>
              {selectedCompanies.length > 0 && (
                <button onClick={handleAddToLeadPool} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                  Ajouter au Lead Pool ({selectedCompanies.length})
                </button>
              )}
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === companies.length && companies.length > 0}
                        onChange={e => setSelectedCompanies(e.target.checked ? companies.map(c => c._id) : [])}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map(company => (
                    <tr key={company._id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company._id)}
                          onChange={e => setSelectedCompanies(prev =>
                            e.target.checked ? [...prev, company._id] : prev.filter(id => id !== company._id)
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{company.companyName}</div>
                        {company.siret && <div className="text-xs text-gray-500">SIRET: {company.siret}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {company.email && <div>{company.email}</div>}
                        {company.phone && <div>{company.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {company.address?.city && <div>{company.address.city}</div>}
                        {company.address?.departmentCode && <div className="text-gray-500">Dept. {company.address.departmentCode}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{company.source?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={company.prospectionStatus}
                          onChange={e => handleUpdateStatus(company._id, e.target.value)}
                          className={`text-xs rounded px-2 py-1 ${statusColors[company.prospectionStatus] || ''}`}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/crm/transport-company/${company._id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">{companiesTotal} entreprises</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCompaniesPage(p => Math.max(1, p - 1))}
                    disabled={companiesPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Precedent
                  </button>
                  <span className="px-3 py-1">Page {companiesPage}</span>
                  <button
                    onClick={() => setCompaniesPage(p => p + 1)}
                    disabled={companies.length < 20}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
              <input
                type="text"
                placeholder="Rechercher..."
                value={offerSearch}
                onChange={e => setOfferSearch(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button onClick={() => { setOffersPage(1); fetchOffers(); }} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Filtrer
              </button>
            </div>

            {/* Offers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporteur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Chargement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicule</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Derniere vue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers.map(offer => (
                    <tr key={offer._id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{offer.company.name}</div>
                        <div className="text-xs text-gray-500">{offer.source.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{offer.route.origin?.city || offer.route.origin?.department || '-'}</div>
                        <div className="text-gray-400">↓</div>
                        <div>{offer.route.destination?.city || offer.route.destination?.department || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(offer.loadingDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {offer.vehicle?.type || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${offer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(offer.source.lastSeenAt, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">{offersTotal} offres</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOffersPage(p => Math.max(1, p - 1))}
                    disabled={offersPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Precedent
                  </button>
                  <span className="px-3 py-1">Page {offersPage}</span>
                  <button
                    onClick={() => setOffersPage(p => p + 1)}
                    disabled={offers.length < 20}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trouve</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Derniere execution</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prochaine</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 font-medium">{job.source}</td>
                      <td className="px-4 py-3 text-sm">{job.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{job.totalFound}</td>
                      <td className="px-4 py-3 text-sm">{job.totalImported}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(job.lastRunAt, true)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(job.nextRunAt, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

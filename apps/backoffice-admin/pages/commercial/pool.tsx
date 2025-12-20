import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Target, Building2, MapPin, Mail, Globe, Star,
  LogOut, Search, Filter, CheckCircle, AlertCircle, Package
} from 'lucide-react';

const COMMERCIAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';

interface PoolLead {
  _id: string;
  raisonSociale: string;
  siteWeb?: string;
  telephone?: string;
  emailGenerique?: string;
  adresse?: {
    ville?: string;
    codePostal?: string;
    pays?: string;
  };
  secteurActivite?: string;
  scoreLead?: number;
  nbContactsEnrichis?: number;
  salonSourceId?: {
    nom: string;
  };
  createdAt: string;
}

export default function CommercialPool() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<PoolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    city: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('commercial_token');
    const userData = localStorage.getItem('commercial_user');

    if (!token || !userData) {
      router.push('/commercial/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.mustChangePassword) {
      router.push('/commercial/change-password');
      return;
    }

    setUser(parsedUser);
    loadPool(token);
  }, [router]);

  const loadPool = async (token: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.city) params.append('ville', filters.city);

      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/pool?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('commercial_token');
        localStorage.removeItem('commercial_user');
        router.push('/commercial/login');
        return;
      }

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Erreur chargement pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (leadId: string) => {
    setClaiming(leadId);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('commercial_token');
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/pool/claim/${leadId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la selection');
      }

      setSuccess(`${data.lead.raisonSociale} a ete ajoute a vos leads. Un email a ete envoye au prospect.`);
      setLeads(prev => prev.filter(l => l._id !== leadId));

      // Redirect to the lead detail after 2 seconds
      setTimeout(() => {
        router.push(`/commercial/my-leads/${leadId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('commercial_token');
    if (token) {
      setLoading(true);
      loadPool(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('commercial_token');
    localStorage.removeItem('commercial_user');
    router.push('/commercial/login');
  };

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Portail Commercial</h1>
                <p className="text-sm text-gray-500">{user?.prenom} {user?.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {user?.accessCode}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link href="/commercial/dashboard" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <Link href="/commercial/pool" className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium">
              Bourse de Leads
            </Link>
            <Link href="/commercial/my-leads" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Mes Leads
            </Link>
            <Link href="/commercial/calendar" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Calendrier
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Bourse de Leads</h2>
          <p className="text-gray-500 mt-1">
            Selectionnez les prospects que vous souhaitez prospecter. Un email sera envoye automatiquement au prospect.
          </p>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, SIRET..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                placeholder="Ville"
                className="w-full sm:w-40 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtrer
            </button>
          </div>
        </form>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-500">
          {leads.length} prospect{leads.length > 1 ? 's' : ''} disponible{leads.length > 1 ? 's' : ''}
        </div>

        {/* Leads Grid */}
        {leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    {lead.scoreLead && lead.scoreLead > 0 && (
                      <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded flex items-center gap-1">
                        <Star className="w-3 h-3" /> {lead.scoreLead}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{lead.raisonSociale}</h3>

                  {lead.secteurActivite && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {lead.secteurActivite}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {lead.adresse?.ville && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{lead.adresse.codePostal} {lead.adresse.ville}</span>
                      </div>
                    )}
                    {lead.siteWeb && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{lead.siteWeb}</span>
                      </div>
                    )}
                    {lead.emailGenerique && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{lead.emailGenerique}</span>
                      </div>
                    )}
                    {lead.nbContactsEnrichis && lead.nbContactsEnrichis > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{lead.nbContactsEnrichis} contact{lead.nbContactsEnrichis > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleClaim(lead._id)}
                    disabled={claiming === lead._id}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                  >
                    {claiming === lead._id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Target className="w-5 h-5" />
                        Selectionner ce prospect
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun prospect disponible</h3>
            <p className="text-gray-500">
              {search || filters.city
                ? 'Aucun resultat pour ces criteres. Essayez de modifier vos filtres.'
                : 'Tous les prospects ont deja ete assignes.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

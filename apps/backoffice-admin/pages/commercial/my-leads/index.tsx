import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Target, Building2, MapPin, Calendar, Phone, Mail,
  LogOut, Search, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp
} from 'lucide-react';

const COMMERCIAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';

interface MyLead {
  _id: string;
  companyName: string;
  siret?: string;
  address?: {
    city?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
  currentStage: string;
  pipeline: Array<{
    stageCode: string;
    status: string;
    completedAt?: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STAGES = [
  { code: 'QUALIFICATION', label: 'Qualification' },
  { code: 'PREMIER_CONTACT', label: 'Premier Contact' },
  { code: 'DECOUVERTE', label: 'Decouverte' },
  { code: 'PROPOSITION', label: 'Proposition' },
  { code: 'NEGOCIATION', label: 'Negociation' },
  { code: 'CLOSING', label: 'Closing' }
];

export default function MyLeadsList() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    loadLeads(token);
  }, [router]);

  const loadLeads = async (token: string) => {
    try {
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/my-leads`, {
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
      console.error('Erreur chargement leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('commercial_token');
    localStorage.removeItem('commercial_user');
    router.push('/commercial/login');
  };

  const getStageLabel = (code: string) => {
    const stage = STAGES.find(s => s.code === code);
    return stage?.label || code;
  };

  const getStageProgress = (lead: MyLead) => {
    const currentIndex = STAGES.findIndex(s => s.code === lead.currentStage);
    return Math.round(((currentIndex + 1) / STAGES.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" /> Gagne
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-3 h-3" /> Perdu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <Clock className="w-3 h-3" /> En cours
          </span>
        );
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = search === '' ||
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.contact?.lastName?.toLowerCase().includes(search.toLowerCase())) ||
      (lead.contact?.firstName?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'in_progress' && lead.status !== 'WON' && lead.status !== 'LOST') ||
      (statusFilter === 'won' && lead.status === 'WON') ||
      (statusFilter === 'lost' && lead.status === 'LOST');

    return matchesSearch && matchesStatus;
  });

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
            <Link href="/commercial/pool" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Bourse de Leads
            </Link>
            <Link href="/commercial/my-leads" className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium">
              Mes Leads
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Mes Leads</h2>
          <p className="text-gray-500 mt-1">
            Gerez vos prospects et suivez leur progression dans le pipeline de vente.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, contact..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_progress">En cours</option>
              <option value="won">Gagnes</option>
              <option value="lost">Perdus</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Clock className="w-4 h-4" />
              En cours
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {leads.filter(l => l.status !== 'WON' && l.status !== 'LOST').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Gagnes
            </div>
            <p className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.status === 'WON').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
              <XCircle className="w-4 h-4" />
              Perdus
            </div>
            <p className="text-2xl font-bold text-red-600">
              {leads.filter(l => l.status === 'LOST').length}
            </p>
          </div>
        </div>

        {/* Leads List */}
        {filteredLeads.length > 0 ? (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Link
                key={lead._id}
                href={`/commercial/my-leads/${lead._id}`}
                className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.companyName}</h3>
                        {lead.contact?.firstName && lead.contact?.lastName && (
                          <p className="text-sm text-gray-500">
                            {lead.contact.firstName} {lead.contact.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(lead.status)}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    {lead.address?.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {lead.address.city}
                      </div>
                    )}
                    {lead.contact?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {lead.contact.email}
                      </div>
                    )}
                    {lead.contact?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {lead.contact.phone}
                      </div>
                    )}
                  </div>

                  {/* Pipeline Progress */}
                  {lead.status !== 'WON' && lead.status !== 'LOST' && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Etape actuelle: <span className="font-medium text-gray-900">{getStageLabel(lead.currentStage)}</span></span>
                        <span className="text-blue-600 font-medium">{getStageProgress(lead)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                          style={{ width: `${getStageProgress(lead)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lead trouve</h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter !== 'all'
                ? 'Aucun resultat pour ces criteres.'
                : 'Vous n\'avez pas encore de leads assignes.'}
            </p>
            <Link
              href="/commercial/pool"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Users className="w-5 h-5" />
              Voir la bourse de leads
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

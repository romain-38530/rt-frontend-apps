import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Target, TrendingUp, Euro, LogOut,
  ChevronRight, Calendar, Clock, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const COMMERCIAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';

interface DashboardStats {
  totalLeads: number;
  leadsEnCours: number;
  leadsGagnes: number;
  leadsPerdus: number;
  tauxConversion: number;
  commissionsEnAttente: number;
  commissionsValidees: number;
  commissionsDuMois: number;
}

interface RecentLead {
  _id: string;
  companyName: string;
  currentStage: string;
  lastInteraction?: Date;
}

export default function CommercialDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadDashboard(token);
  }, [router]);

  const loadDashboard = async (token: string) => {
    try {
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('commercial_token');
        localStorage.removeItem('commercial_user');
        router.push('/commercial/login');
        return;
      }

      const data = await res.json();
      setStats(data.stats);
      setRecentLeads(data.recentLeads || []);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
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
    const stages: Record<string, string> = {
      'QUALIFICATION': 'Qualification',
      'PREMIER_CONTACT': 'Premier Contact',
      'DECOUVERTE': 'Decouverte',
      'PROPOSITION': 'Proposition',
      'NEGOCIATION': 'Negociation',
      'CLOSING': 'Closing'
    };
    return stages[code] || code;
  };

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
                <p className="text-sm text-gray-500">Bienvenue, {user?.prenom} {user?.nom}</p>
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
                <span className="hidden sm:inline">Deconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link href="/commercial/dashboard" className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/commercial/pool" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalLeads || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Leads assignes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">En cours</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.leadsEnCours || 0}</p>
            <p className="text-sm text-gray-500 mt-1">A prospecter</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">{stats?.tauxConversion || 0}%</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.leadsGagnes || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Leads gagnes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Ce mois</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.commissionsDuMois?.toLocaleString() || 0} €</p>
            <p className="text-sm text-gray-500 mt-1">Commissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leads */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Leads recents</h2>
              <Link href="/commercial/my-leads" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                  <Link
                    key={lead._id}
                    href={`/commercial/my-leads/${lead._id}`}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{lead.companyName}</p>
                      <p className="text-sm text-gray-500">Etape: {getStageLabel(lead.currentStage)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun lead assigne</p>
                  <Link href="/commercial/pool" className="mt-2 inline-block text-blue-600 hover:underline">
                    Voir la bourse de leads
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Commissions</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">En attente</span>
                </div>
                <span className="font-bold text-yellow-800">{stats?.commissionsEnAttente?.toLocaleString() || 0} €</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Validees</span>
                </div>
                <span className="font-bold text-green-800">{stats?.commissionsValidees?.toLocaleString() || 0} €</span>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm opacity-80">Ce mois</span>
                </div>
                <p className="text-2xl font-bold">{stats?.commissionsDuMois?.toLocaleString() || 0} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/commercial/pool"
              className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <Users className="w-6 h-6" />
              <div>
                <p className="font-medium">Bourse de Leads</p>
                <p className="text-sm opacity-80">Selectionner de nouveaux prospects</p>
              </div>
            </Link>
            <Link
              href="/commercial/my-leads"
              className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <Target className="w-6 h-6" />
              <div>
                <p className="font-medium">Mes Leads</p>
                <p className="text-sm opacity-80">Gerer mes prospects</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg">
              <TrendingUp className="w-6 h-6" />
              <div>
                <p className="font-medium">Performance</p>
                <p className="text-sm opacity-80">Taux: {stats?.tauxConversion || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

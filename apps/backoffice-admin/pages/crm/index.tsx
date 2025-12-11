import { useState, useEffect } from 'react';
import { Building2, Users, Mail, TrendingUp, Target, Calendar, Globe, ChevronRight, RefreshCw, Sparkles, FileText, Inbox, Compass } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { DashboardCard } from '../../components/DashboardCard';
import { crmApi } from '../../lib/api';

interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  totalEmails: number;
  companiesByStatus: Record<string, number>;
  companiesByCountry: Record<string, number>;
  emailsByStatus: Record<string, number>;
  recentCompanies: Array<{
    _id: string;
    raisonSociale: string;
    pays: string;
    statutProspection: string;
    createdAt: string;
  }>;
  recentEmails: Array<{
    _id: string;
    sujet: string;
    statutEnvoi: string;
    sentAt: string;
  }>;
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

export default function CRMDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getDashboard();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading CRM dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainStats = [
    {
      title: 'Entreprises',
      value: stats?.totalCompanies?.toLocaleString() || '0',
      subtitle: 'Total prospects',
      icon: Building2,
      color: 'primary' as const
    },
    {
      title: 'Contacts',
      value: stats?.totalContacts?.toLocaleString() || '0',
      subtitle: 'Decideurs identifies',
      icon: Users,
      color: 'success' as const
    },
    {
      title: 'Emails envoyes',
      value: stats?.totalEmails?.toLocaleString() || '0',
      subtitle: 'Campagnes email',
      icon: Mail,
      color: 'warning' as const
    },
    {
      title: 'Conversion',
      value: stats ? `${Math.round((stats.companiesByStatus?.CONVERTED || 0) / Math.max(stats.totalCompanies, 1) * 100)}%` : '0%',
      subtitle: 'Taux de conversion',
      icon: TrendingUp,
      color: 'purple' as const
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Target size={32} />
          <h1 className="text-3xl font-bold">CRM Lead Generation</h1>
        </div>
        <p className="text-lg opacity-90">Gerez vos prospects, enrichissez les donnees et automatisez vos campagnes email</p>
        <div className="flex gap-4 mt-6">
          <a href="/crm/companies" className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center gap-2">
            <Building2 size={20} />
            Voir les entreprises
          </a>
          <button
            onClick={loadDashboard}
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-2"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, idx) => (
          <div key={idx} className="animate-slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <DashboardCard
          title="Pipeline de prospection"
          subtitle="Repartition par statut"
          icon={Target}
        >
          <div className="space-y-3">
            {stats?.companiesByStatus && Object.entries(stats.companiesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min((count / Math.max(stats.totalCompanies, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-700 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
            {(!stats?.companiesByStatus || Object.keys(stats.companiesByStatus).length === 0) && (
              <div className="text-center text-gray-500 py-8">
                Aucune donnee disponible
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Countries */}
        <DashboardCard
          title="Repartition geographique"
          subtitle="Entreprises par pays"
          icon={Globe}
        >
          <div className="space-y-3">
            {stats?.companiesByCountry && Object.entries(stats.companiesByCountry)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCountryFlag(country)}</span>
                    <span className="font-medium text-gray-900">{country}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(stats.totalCompanies, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-700 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            {(!stats?.companiesByCountry || Object.keys(stats.companiesByCountry).length === 0) && (
              <div className="text-center text-gray-500 py-8">
                Aucune donnee disponible
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <DashboardCard
          title="Entreprises recentes"
          subtitle="Dernieres entreprises ajoutees"
          icon={Building2}
          action={{ label: 'Voir tout', onClick: () => window.location.href = '/crm/companies' }}
        >
          <div className="space-y-3">
            {stats?.recentCompanies?.map((company) => (
              <a
                key={company._id}
                href={`/crm/companies/${company._id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {company.raisonSociale?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {company.raisonSociale}
                    </h4>
                    <p className="text-sm text-gray-500">{company.pays}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[company.statutProspection] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[company.statutProspection] || company.statutProspection}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </a>
            ))}
            {(!stats?.recentCompanies || stats.recentCompanies.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                Aucune entreprise recente
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard
          title="Actions rapides"
          subtitle="Outils CRM"
          icon={Sparkles}
        >
          <div className="space-y-3">
            <a
              href="/crm/companies"
              className="flex items-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Building2 size={24} />
              <div>
                <span className="font-semibold block">Entreprises</span>
                <span className="text-sm opacity-75">Gerer les prospects</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/contacts"
              className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users size={24} />
              <div>
                <span className="font-semibold block">Contacts</span>
                <span className="text-sm opacity-75">Decideurs et contacts</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/emails"
              className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Mail size={24} />
              <div>
                <span className="font-semibold block">Emails</span>
                <span className="text-sm opacity-75">Campagnes et tracking</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/pool"
              className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Inbox size={24} />
              <div>
                <span className="font-semibold block">Pool de Leads</span>
                <span className="text-sm opacity-75">Piocher des prospects</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/salons"
              className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Calendar size={24} />
              <div>
                <span className="font-semibold block">Salons</span>
                <span className="text-sm opacity-75">Scraping exposants</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/discovery"
              className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Compass size={24} />
              <div>
                <span className="font-semibold block">Decouverte</span>
                <span className="text-sm opacity-75">Trouver des salons</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
            <a
              href="/crm/templates"
              className="flex items-center gap-3 p-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <FileText size={24} />
              <div>
                <span className="font-semibold block">Templates</span>
                <span className="text-sm opacity-75">Modeles d'emails</span>
              </div>
              <ChevronRight size={20} className="ml-auto" />
            </a>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'France': '🇫🇷',
    'Allemagne': '🇩🇪',
    'Espagne': '🇪🇸',
    'Italie': '🇮🇹',
    'Royaume-Uni': '🇬🇧',
    'Pays-Bas': '🇳🇱',
    'Belgique': '🇧🇪',
    'Suisse': '🇨🇭',
    'Autriche': '🇦🇹',
    'Portugal': '🇵🇹',
    'Pologne': '🇵🇱',
    'Suede': '🇸🇪',
    'Norvege': '🇳🇴',
    'Danemark': '🇩🇰',
    'Finlande': '🇫🇮',
    'Irlande': '🇮🇪',
    'Grece': '🇬🇷',
    'Republique Tcheque': '🇨🇿',
    'Hongrie': '🇭🇺',
    'Roumanie': '🇷🇴',
  };
  return flags[country] || '🌍';
}

import { Building2, Users, TrendingUp, Activity, Package, DollarSign, Truck, BarChart3 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DashboardCard } from '../components/DashboardCard';
import { ActivityChart } from '../components/ActivityChart';

export default function Home() {
  const stats = [
    { title: 'Organisations', value: '1,234', subtitle: 'Actives', icon: Building2, trend: { value: 12.5, isPositive: true }, color: 'primary' as const },
    { title: 'Utilisateurs', value: '8,456', subtitle: 'Total', icon: Users, trend: { value: 8.2, isPositive: true }, color: 'success' as const },
    { title: 'Revenus', value: '245K€', subtitle: 'Ce mois', icon: DollarSign, trend: { value: 15.3, isPositive: true }, color: 'warning' as const },
    { title: 'Missions', value: '3,891', subtitle: 'En cours', icon: Truck, trend: { value: 3.1, isPositive: false }, color: 'purple' as const },
  ];

  const activityData = [
    { name: 'Jan', value: 400 }, { name: 'Fev', value: 300 }, { name: 'Mar', value: 600 },
    { name: 'Avr', value: 800 }, { name: 'Mai', value: 700 }, { name: 'Jun', value: 900 }, { name: 'Jul', value: 1100 },
  ];

  const recentTransactions = [
    { id: 1, org: 'Acme Corp', amount: '1,250€', status: 'completed', date: '2025-01-15' },
    { id: 2, org: 'TechStart Inc', amount: '3,400€', status: 'pending', date: '2025-01-14' },
    { id: 3, org: 'Global Logistics', amount: '890€', status: 'completed', date: '2025-01-14' },
    { id: 4, org: 'FastShip SA', amount: '2,100€', status: 'completed', date: '2025-01-13' },
  ];

  const topOrganizations = [
    { id: 1, name: 'Acme Corp', missions: 145, revenue: '45,600€', growth: 23 },
    { id: 2, name: 'TechStart Inc', missions: 132, revenue: '38,200€', growth: 18 },
    { id: 3, name: 'Global Logistics', missions: 98, revenue: '29,800€', growth: 15 },
    { id: 4, name: 'FastShip SA', missions: 87, revenue: '24,500€', growth: 12 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Bienvenue sur RT Technologie Admin</h1>
        <p className="text-lg opacity-90">Plateforme unifiee de gestion - Suivez vos performances en temps reel</p>
        <div className="flex gap-4 mt-6">
          <a href="/orgs" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg">Gerer les organisations</a>
          <a href="/health" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-all">Voir l'etat des services</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="animate-slide-in" style={{ animationDelay: `${idx * 0.1}s` }}><StatCard {...stat} /></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Activite mensuelle" subtitle="Nombre d'organisations actives par mois" icon={TrendingUp} action={{ label: 'Voir details', onClick: () => {} }}>
          <ActivityChart data={activityData} type="area" />
        </DashboardCard>
        <DashboardCard title="Top Organisations" subtitle="Les plus performantes ce mois" icon={BarChart3}>
          <div className="space-y-4">
            {topOrganizations.map((org, idx) => (
              <div key={org.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">{idx + 1}</div>
                <div className="flex-1"><h4 className="font-semibold text-gray-900">{org.name}</h4><p className="text-sm text-gray-600">{org.missions} missions • {org.revenue}</p></div>
                <span className="text-green-600 font-semibold text-sm">+{org.growth}%</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard title="Transactions recentes" subtitle="Dernieres operations" icon={DollarSign} className="lg:col-span-2">
          <div className="space-y-3">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
                  <div><h4 className="font-medium text-gray-900">{t.org}</h4><p className="text-sm text-gray-600">{t.date}</p></div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{t.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status === 'completed' ? 'Complete' : 'En attente'}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Actions rapides" icon={Activity}>
          <div className="space-y-3">
            <a href="/orgs" className="flex items-center gap-3 p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"><Building2 size={20} /><span className="font-medium">Nouvelle organisation</span></a>
            <a href="/pricing" className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"><DollarSign size={20} /><span className="font-medium">Gerer les tarifs</span></a>
            <a href="/palettes" className="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"><Package size={20} /><span className="font-medium">Voir les palettes</span></a>
            <a href="/health" className="flex items-center gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"><Activity size={20} /><span className="font-medium">Etat des services</span></a>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Truck size={24} className="text-blue-600" /></div>
            <div><p className="text-sm text-gray-600">Missions actives</p><h3 className="text-2xl font-bold text-gray-900">3,891</h3></div>
          </div>
          <p className="text-sm text-gray-600">156 missions en attente d'affectation</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Package size={24} className="text-green-600" /></div>
            <div><p className="text-sm text-gray-600">Palettes gerees</p><h3 className="text-2xl font-bold text-gray-900">12,456</h3></div>
          </div>
          <p className="text-sm text-gray-600">789 palettes en transit aujourd'hui</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><Activity size={24} className="text-purple-600" /></div>
            <div><p className="text-sm text-gray-600">Taux de satisfaction</p><h3 className="text-2xl font-bold text-gray-900">98.5%</h3></div>
          </div>
          <p className="text-sm text-gray-600">Base sur 2,345 evaluations</p>
        </div>
      </div>
    </div>
  );
}

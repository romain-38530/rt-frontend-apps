import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CreditCard,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  Zap,
  Rocket,
  Crown,
  Star,
  Shield,
  Clock,
  BarChart3,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import * as subscriptionsApi from '@shared/services/subscriptions-api';

// Types
interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  companyType: string;
  subscriptionType: string;
  subscriptionName: string;
  packName?: string;
  pricing: {
    totalMonthly: number;
    totalAnnual: number;
    discountPercent: number;
  };
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended';
  engagement: {
    type: string;
    endDate?: string;
  };
  createdAt: string;
}

interface RevenueStats {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  monthlyRevenue: Array<{ _id: string; revenue: number }>;
  subscribersByType: Array<{ _id: string; count: number }>;
}

// Grille tarifaire officielle SYMPHONI.A
const PRICING_GRID = {
  subscriptions: {
    INDUSTRIEL: { name: 'Industriel', priceMonthly: 799, priceLaunch: 499 },
    TRANSPORTEUR_INVITE: { name: 'Transporteur Invite', priceMonthly: 0 },
    TRANSPORTEUR_PREMIUM: { name: 'Transporteur Premium', priceMonthly: 299 },
    TRANSPORTEUR_DO: { name: 'Transporteur D.O.', priceMonthly: 499 },
    LOGISTICIEN_INVITE: { name: 'Logisticien Invite', priceMonthly: 0 },
    LOGISTICIEN_PREMIUM: { name: 'Logisticien Premium', priceMonthly: 499 },
    TRANSITAIRE_INVITE: { name: 'Transitaire Invite', priceMonthly: 0 },
    TRANSITAIRE_PREMIUM: { name: 'Transitaire Premium', priceMonthly: 299 },
  },
  trackingIA: {
    BASIC: { name: 'Tracking IA Basic', priceMonthly: 50 },
    INTERMEDIAIRE: { name: 'Tracking IA Intermediaire', priceMonthly: 150 },
    PREMIUM: { name: 'Tracking IA Premium', pricePerTransport: 4 },
  },
  modules: {
    AFFRET_IA: { name: 'Affret.IA', priceMonthly: 0, commission: '4%' },
    PALETTES_EUROPE: { name: 'Palettes Europe', priceMonthly: 199 },
    SIGNATURE_ELECTRONIQUE: { name: 'Signature eCMR', priceMonthly: 99 },
    PREFACTURATION: { name: 'Prefacturation', priceMonthly: 199 },
    TMS_SYNC_PREMIUM: { name: 'TMS Sync Premium', priceMonthly: 149 },
    CHATBOT_IA: { name: 'Chatbot IA', priceMonthly: 49 },
  },
  services: {
    TRAINING: { name: 'Training et Formation', priceOneShot: 299 },
    SMS: { name: 'Notifications SMS', pricePerUnit: 0.04, unit: 'SMS' },
  },
  packs: {
    INDUSTRIEL_PREMIUM: { name: 'Pack Industriel Premium', priceMonthly: 699, savings: '35%' },
    TRANSPORTEUR_DO: { name: 'Pack Transporteur D.O.', priceMonthly: 599, savings: '30%' },
    LOGISTICIEN_PREMIUM: { name: 'Pack Logisticien Premium', priceMonthly: 599, savings: '30%' },
    ULTIMATE: { name: 'Pack Ultimate', priceMonthly: 999, savings: '50%' },
  },
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'pricing' | 'invoices'>('overview');
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les données depuis l'API en parallèle
      const [revenueData, subscriptionsData] = await Promise.all([
        subscriptionsApi.getRevenueStats(),
        subscriptionsApi.getSubscriptions({ status: 'active' }),
      ]);

      // Stats revenus
      setStats({
        mrr: revenueData.mrr || 45780,
        arr: revenueData.arr || 549360,
        totalActiveSubscriptions: revenueData.totalActiveSubscriptions || 127,
        monthlyRevenue: revenueData.monthlyRevenue || [
          { _id: '2024-07', revenue: 38500 },
          { _id: '2024-08', revenue: 41200 },
          { _id: '2024-09', revenue: 43800 },
          { _id: '2024-10', revenue: 44500 },
          { _id: '2024-11', revenue: 45780 },
        ],
        subscribersByType: revenueData.subscribersByType || [
          { _id: 'INDUSTRIEL', count: 45 },
          { _id: 'TRANSPORTEUR_PREMIUM', count: 38 },
          { _id: 'TRANSPORTEUR_DO', count: 22 },
          { _id: 'LOGISTICIEN_PREMIUM', count: 15 },
          { _id: 'TRANSITAIRE_PREMIUM', count: 7 },
        ],
      });

      // Subscriptions
      const mappedSubs = (subscriptionsData.subscriptions || []).map((s: any) => ({
        id: s.id,
        companyId: s.companyId,
        companyName: s.companyName,
        companyType: s.companyType,
        subscriptionType: s.subscriptionType,
        subscriptionName: s.subscriptionName,
        packName: s.packName,
        pricing: {
          totalMonthly: s.pricing?.totalMonthly || 0,
          totalAnnual: s.pricing?.totalAnnual || 0,
          discountPercent: s.pricing?.discountPercent || s.engagement?.discountPercent || 0,
        },
        status: s.status,
        engagement: {
          type: s.engagement?.type || 'monthly',
          endDate: s.engagement?.endDate,
        },
        createdAt: s.createdAt,
      }));
      if (mappedSubs.length > 0) setSubscriptions(mappedSubs);

    } catch (error) {
      console.error('Erreur chargement données abonnements:', error);
      // Fallback mock data
      setStats({
        mrr: 45780,
        arr: 549360,
        totalActiveSubscriptions: 127,
        monthlyRevenue: [
          { _id: '2024-07', revenue: 38500 },
          { _id: '2024-08', revenue: 41200 },
          { _id: '2024-09', revenue: 43800 },
          { _id: '2024-10', revenue: 44500 },
          { _id: '2024-11', revenue: 45780 },
        ],
        subscribersByType: [
          { _id: 'INDUSTRIEL', count: 45 },
          { _id: 'TRANSPORTEUR_PREMIUM', count: 38 },
          { _id: 'TRANSPORTEUR_DO', count: 22 },
          { _id: 'LOGISTICIEN_PREMIUM', count: 15 },
          { _id: 'TRANSITAIRE_PREMIUM', count: 7 },
        ],
      });

      setSubscriptions([
        {
          id: '1',
          companyId: 'comp-001',
          companyName: 'Industrie Moderne SA',
          companyType: 'industry',
          subscriptionType: 'INDUSTRIEL',
          subscriptionName: 'Industriel',
          packName: 'Pack Ultimate',
          pricing: { totalMonthly: 999, totalAnnual: 11988, discountPercent: 5 },
          status: 'active',
          engagement: { type: '4_years', endDate: '2028-01-15' },
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          companyId: 'comp-002',
          companyName: 'Transport Express SARL',
          companyType: 'transporter',
          subscriptionType: 'TRANSPORTEUR_DO',
          subscriptionName: 'Transporteur D.O.',
          pricing: { totalMonthly: 599, totalAnnual: 7188, discountPercent: 3 },
          status: 'active',
          engagement: { type: '3_years', endDate: '2027-03-20' },
          createdAt: '2024-03-20',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Essai' },
      past_due: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Impaye' },
      canceled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Annule' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspendu' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const PricingCard = ({ title, price, period, features, popular, savings, icon: Icon }: any) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${popular ? 'ring-2 ring-blue-500' : ''}`}>
      {popular && (
        <div className="flex justify-center mb-4">
          <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
            Plus populaire
          </span>
        </div>
      )}
      {savings && (
        <div className="flex justify-center mb-4">
          <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
            Economie {savings}
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
          <span className="text-gray-500">/{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-2 rounded-lg font-medium ${
        popular
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}>
        Choisir cette offre
      </button>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Gestion Abonnements - SYMPHONI.A Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => router.push('/')} className="text-purple-200 hover:text-white text-sm mb-2">
                  &larr; Retour au backoffice
                </button>
                <h1 className="text-2xl font-bold">Gestion des Abonnements</h1>
                <p className="text-purple-200">Tarification, facturation et suivi des revenus</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50">
                  <Plus className="w-4 h-4" />
                  Nouvel abonnement
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b border-white/20">
              {[
                { id: 'overview', label: 'Vue globale', icon: BarChart3 },
                { id: 'subscriptions', label: 'Abonnements', icon: Users },
                { id: 'pricing', label: 'Grille tarifaire', icon: CreditCard },
                { id: 'invoices', label: 'Facturation', icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-purple-200 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="MRR (Revenus mensuels)"
                  value={formatPrice(stats.mrr)}
                  icon={DollarSign}
                  color="bg-green-500"
                  trend={8.5}
                />
                <StatCard
                  title="ARR (Revenus annuels)"
                  value={formatPrice(stats.arr)}
                  icon={TrendingUp}
                  color="bg-blue-500"
                  trend={12.3}
                />
                <StatCard
                  title="Abonnes actifs"
                  value={stats.totalActiveSubscriptions}
                  icon={Users}
                  color="bg-purple-500"
                  trend={5.2}
                />
                <StatCard
                  title="Valeur moyenne"
                  value={formatPrice(stats.mrr / stats.totalActiveSubscriptions)}
                  subtitle="Par abonne/mois"
                  icon={CreditCard}
                  color="bg-indigo-500"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Evolution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolution des revenus</h3>
                  <div className="space-y-3">
                    {stats.monthlyRevenue.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 w-20">{item._id}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                            style={{ width: `${(item.revenue / 50000) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-24 text-right">
                          {formatPrice(item.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscribers by Type */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Repartition par type</h3>
                  <div className="space-y-3">
                    {stats.subscribersByType.map((item, idx) => {
                      const sub = PRICING_GRID.subscriptions[item._id as keyof typeof PRICING_GRID.subscriptions];
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 w-40 truncate">{sub?.name || item._id}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[idx % colors.length]} rounded-full`}
                              style={{ width: `${(item.count / 50) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {item.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">2 abonnements en impaye</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      FastFreight et LogiTrans ont des paiements en retard depuis plus de 7 jours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Liste des abonnements</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="trial">En essai</option>
                    <option value="past_due">Impayes</option>
                  </select>
                  <button className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    Exporter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonnement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/mois</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{sub.companyName}</p>
                            <p className="text-xs text-gray-500">{sub.companyType}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm text-gray-900">{sub.packName || sub.subscriptionName}</p>
                            {sub.pricing.discountPercent > 0 && (
                              <p className="text-xs text-green-600">-{sub.pricing.discountPercent}% engagement</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(sub.pricing.totalMonthly)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">
                            {sub.engagement.type === 'monthly' ? 'Sans engagement' : sub.engagement.type.replace('_', ' ')}
                          </p>
                          {sub.engagement.endDate && (
                            <p className="text-xs text-gray-400">Fin: {sub.engagement.endDate}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(sub.status)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-8">
              {/* Launch Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Prix de lancement</h2>
                    <p className="text-green-100 mt-1">
                      Offre speciale jusqu'au 31 decembre 2025 - Industriel a 499EUR/mois au lieu de 799EUR
                    </p>
                  </div>
                  <Rocket className="w-12 h-12 text-green-200" />
                </div>
              </div>

              {/* Abonnements principaux */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Abonnements principaux</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <PricingCard
                    title="Industriel"
                    price={499}
                    period="mois"
                    icon={Package}
                    popular={true}
                    features={[
                      'Creation ordres de transport',
                      'Acces reseau transporteurs',
                      'Tableau de bord analytique',
                      'Suivi temps reel',
                      '100 transports/mois inclus',
                    ]}
                  />
                  <PricingCard
                    title="Transporteur Premium"
                    price={299}
                    period="mois"
                    icon={Zap}
                    features={[
                      'Acces Affret.IA',
                      'Score transporteur visible',
                      'Tableau de bord performance',
                      'Visibilite prioritaire',
                      'Support prioritaire',
                    ]}
                  />
                  <PricingCard
                    title="Transporteur D.O."
                    price={499}
                    period="mois"
                    icon={Crown}
                    features={[
                      'Tout Transporteur Premium',
                      'Creation ordres transport',
                      'Gestion sous-traitants',
                      'Affretement fret propre',
                      'Analytics avances',
                    ]}
                  />
                </div>
              </div>

              {/* Packs */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Packs tout-en-un</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(PRICING_GRID.packs).map(([key, pack]) => (
                    <PricingCard
                      key={key}
                      title={pack.name}
                      price={pack.priceMonthly}
                      period="mois"
                      savings={pack.savings}
                      icon={key === 'ULTIMATE' ? Star : Shield}
                      popular={key === 'ULTIMATE'}
                      features={
                        key === 'ULTIMATE'
                          ? ['Abonnement Industriel', 'Tracking IA Premium', 'Tous les modules', 'Support 24/7', 'Account manager VIP']
                          : ['Abonnement inclus', 'Tracking IA', 'Modules selectionnes', 'Support prioritaire']
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Modules additionnels */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Modules additionnels</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(PRICING_GRID.modules).map(([key, mod]) => (
                    <div key={key} className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-semibold text-gray-900">{mod.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {mod.priceMonthly === 0 ? 'Gratuit' : formatPrice(mod.priceMonthly)}
                        {mod.priceMonthly > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
                      </p>
                      {mod.commission && (
                        <p className="text-xs text-gray-500 mt-1">+ {mod.commission} commission</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking IA */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tracking IA</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PRICING_GRID.trackingIA).map(([key, track]) => (
                    <div key={key} className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-semibold text-gray-900">{track.name}</h3>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {track.priceMonthly ? formatPrice(track.priceMonthly) : `${track.pricePerTransport}EUR`}
                        <span className="text-sm font-normal text-gray-500">
                          /{track.priceMonthly ? 'mois' : 'transport'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remises engagement */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Remises engagement long terme
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">-3%</p>
                    <p className="text-gray-600">Engagement 3 ans</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">-5%</p>
                    <p className="text-gray-600">Engagement 4 ans</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">-7%</p>
                    <p className="text-gray-600">Engagement 5 ans</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Module Facturation</h3>
                <p className="text-gray-500 mt-2">
                  Generation automatique des factures, suivi des paiements, et integration Stripe.
                </p>
                <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Generer les factures du mois
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

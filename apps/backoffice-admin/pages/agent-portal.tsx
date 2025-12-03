import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Home,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Building,
  Calendar,
  Clock,
  Trophy,
  Target,
  Phone,
  Mail,
  MapPin,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Award,
  BarChart3,
} from 'lucide-react';
import * as salesAgentsApi from '@shared/services/sales-agents-api';

// Types
interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  region: string;
  status: 'active' | 'suspended' | 'non_compliant';
  contractType: 'unlimited' | '1_year';
  stats: {
    totalClients: number;
    activeClients: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
  companyType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: 'prospect' | 'pending_activation' | 'active' | 'churned';
  activatedAt?: string;
  monthlyCommission: number;
  totalCommissionsPaid: number;
  createdAt: string;
}

interface Commission {
  id: string;
  period: string;
  activeClients: number;
  totalAmount: number;
  status: 'pending' | 'validated' | 'paid';
  createdAt: string;
  paidAt?: string;
}

interface PortalDashboard {
  agent: Agent;
  currentMonth: {
    activeClients: number;
    pendingClients: number;
    projectedCommission: number;
  };
  lastMonth: {
    activeClients: number;
    commission: number;
    status: string;
  };
  yearToDate: {
    totalCommissions: number;
    totalClients: number;
    averageMonthly: number;
  };
  activeChallenge?: {
    name: string;
    endDate: string;
    currentRank: number;
    clientsRecruited: number;
    targetClients: number;
    potentialPrize?: number;
  };
}

const COMMISSION_RATE = 70;

export default function AgentPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'commissions' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  useEffect(() => {
    const agentToken = localStorage.getItem('agentToken');
    if (agentToken) {
      setIsLoggedIn(true);
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await salesAgentsApi.portalLogin({ email: loginEmail, password: loginPassword });
      if (response.token) {
        localStorage.setItem('agentToken', response.token);
        setIsLoggedIn(true);
        loadDashboard();
      } else {
        setLoginError('Email ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agentToken');
    setIsLoggedIn(false);
    setDashboard(null);
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agentToken');
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      // Charger les données depuis l'API
      const [dashboardData, clientsData, commissionsData] = await Promise.all([
        salesAgentsApi.getPortalDashboard(),
        salesAgentsApi.getPortalClients(),
        salesAgentsApi.getPortalCommissions(),
      ]);

      // Transformer les données pour le format attendu par le composant
      if (dashboardData.agent) {
        setDashboard({
          agent: {
            id: dashboardData.agent.id,
            firstName: dashboardData.agent.firstName,
            lastName: dashboardData.agent.lastName,
            email: dashboardData.agent.email,
            phone: dashboardData.agent.phone,
            company: dashboardData.agent.company,
            region: dashboardData.agent.region,
            status: dashboardData.agent.status as 'active' | 'suspended' | 'non_compliant',
            contractType: dashboardData.agent.contractType,
            stats: dashboardData.agent.stats,
            createdAt: dashboardData.agent.createdAt,
          },
          currentMonth: dashboardData.currentMonth || {
            activeClients: dashboardData.agent.stats?.activeClients || 0,
            pendingClients: 0,
            projectedCommission: (dashboardData.agent.stats?.activeClients || 0) * COMMISSION_RATE,
          },
          lastMonth: dashboardData.lastMonth || {
            activeClients: 0,
            commission: 0,
            status: 'pending',
          },
          yearToDate: dashboardData.yearToDate || {
            totalCommissions: dashboardData.agent.stats?.totalCommissions || 0,
            totalClients: dashboardData.agent.stats?.totalClients || 0,
            averageMonthly: 0,
          },
          activeChallenge: dashboardData.activeChallenge,
        });
      }

      // Mapper les clients
      if (clientsData.clients) {
        setClients(clientsData.clients.map((c: any) => ({
          id: c.id,
          companyName: c.companyName,
          companyType: c.companyType || 'industry',
          contactName: c.contactName,
          contactEmail: c.email || c.contactEmail,
          contactPhone: c.phone || c.contactPhone,
          status: c.status,
          activatedAt: c.activatedAt,
          monthlyCommission: COMMISSION_RATE,
          totalCommissionsPaid: c.totalCommissionsPaid || 0,
          createdAt: c.createdAt,
        })));
      }

      // Mapper les commissions
      if (commissionsData.commissions) {
        setCommissions(commissionsData.commissions.map((c: any) => ({
          id: c.id,
          period: c.period,
          activeClients: c.activeClients || c.clientCount || 0,
          totalAmount: c.totalAmount || c.amount || 0,
          status: c.status,
          createdAt: c.createdAt,
          paidAt: c.paidAt,
        })));
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // En cas d'erreur d'authentification, déconnecter
      if ((error as any)?.message?.includes('401') || (error as any)?.message?.includes('unauthorized')) {
        localStorage.removeItem('agentToken');
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getClientStatusBadge = (status: Client['status']) => {
    const config: Record<string, { class: string; label: string }> = {
      active: { class: 'bg-green-100 text-green-800', label: 'Actif' },
      pending_activation: { class: 'bg-orange-100 text-orange-800', label: 'En attente' },
      prospect: { class: 'bg-blue-100 text-blue-800', label: 'Prospect' },
      churned: { class: 'bg-gray-100 text-gray-800', label: 'Resilie' },
    };
    const c = config[status] || { class: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.class}`}>{c.label}</span>;
  };

  const getCommissionStatusBadge = (status: Commission['status']) => {
    const config: Record<string, { class: string; label: string }> = {
      pending: { class: 'bg-orange-100 text-orange-800', label: 'En attente' },
      validated: { class: 'bg-blue-100 text-blue-800', label: 'Validee' },
      paid: { class: 'bg-green-100 text-green-800', label: 'Payee' },
    };
    const c = config[status] || { class: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.class}`}>{c.label}</span>;
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <>
        <Head>
          <title>Portail Agent - SYMPHONI.A</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portail Agent Commercial</h1>
              <p className="text-gray-500 mt-2">Connectez-vous pour acceder a votre espace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="********"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-indigo-600 hover:underline">
                Mot de passe oublie ?
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Demo: agent@example.com / password
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Portail Agent - SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold">
                  {dashboard.agent.firstName[0]}{dashboard.agent.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{dashboard.agent.firstName} {dashboard.agent.lastName}</p>
                <p className="text-sm text-gray-500">Agent Commercial</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: Home },
                { id: 'clients', label: 'Mes Clients', icon: Building },
                { id: 'commissions', label: 'Mes Commissions', icon: DollarSign },
                { id: 'profile', label: 'Mon Profil', icon: Settings },
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Deconnexion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bonjour {dashboard.agent.firstName} !</h1>
                <p className="text-gray-500">Voici le resume de votre activite</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Clients Actifs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.currentMonth.activeClients}</p>
                      <p className="text-xs text-orange-500 mt-1">+{dashboard.currentMonth.pendingClients} en attente</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Commission ce mois</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.currentMonth.projectedCommission)}</p>
                      <p className="text-xs text-gray-400 mt-1">Projection</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Mois dernier</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.lastMonth.commission)}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Payee
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total 2024</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.yearToDate.totalCommissions)}</p>
                      <p className="text-xs text-gray-400 mt-1">Moy. {formatCurrency(dashboard.yearToDate.averageMonthly)}/mois</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Challenge Card */}
              {dashboard.activeChallenge && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-yellow-300" />
                        <span className="font-medium">Challenge en cours</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{dashboard.activeChallenge.name}</h3>
                      <p className="text-white/80 text-sm">
                        Fin le {new Date(dashboard.activeChallenge.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-yellow-300">#{dashboard.activeChallenge.currentRank}</div>
                      <p className="text-white/80 text-sm">Votre position</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Vos clients recrutes: {dashboard.activeChallenge.clientsRecruited}</span>
                      <span>Objectif collectif: {dashboard.activeChallenge.targetClients}</span>
                    </div>
                  </div>

                  {dashboard.activeChallenge.potentialPrize && (
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-300" />
                      <span>Dotation potentielle: {formatCurrency(dashboard.activeChallenge.potentialPrize)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAddClientModal(true)}
                      className="w-full flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium">Ajouter un nouveau client</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                    <button
                      onClick={() => setActiveTab('commissions')}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Voir mes releves de commission</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                    <button
                      onClick={() => setActiveTab('clients')}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Building className="w-5 h-5" />
                      <span>Gerer mes clients</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Derniers clients ajoutes</h3>
                  <div className="space-y-3">
                    {clients.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Building className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{client.companyName}</p>
                          <p className="text-sm text-gray-500">{client.contactName}</p>
                        </div>
                        {getClientStatusBadge(client.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mes Clients</h1>
                  <p className="text-gray-500">{clients.filter(c => c.status === 'active').length} clients actifs</p>
                </div>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau Client
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Actifs', count: clients.filter(c => c.status === 'active').length, color: 'green' },
                  { label: 'En attente', count: clients.filter(c => c.status === 'pending_activation').length, color: 'orange' },
                  { label: 'Prospects', count: clients.filter(c => c.status === 'prospect').length, color: 'blue' },
                  { label: 'Resilies', count: clients.filter(c => c.status === 'churned').length, color: 'gray' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                ))}
              </div>

              {/* Clients List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{client.companyName}</p>
                            <p className="text-sm text-gray-500 capitalize">{client.companyType.replace('_', ' ')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-900">{client.contactName}</p>
                            <p className="text-sm text-gray-500">{client.contactEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getClientStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4">
                          {client.status === 'active' ? (
                            <div>
                              <p className="font-medium text-green-600">{formatCurrency(client.monthlyCommission)}/mois</p>
                              <p className="text-sm text-gray-500">Total: {formatCurrency(client.totalCommissionsPaid)}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mes Commissions</h1>
                  <p className="text-gray-500">Historique et releves de commission</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">En attente de paiement</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {formatCurrency(commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.totalAmount, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total paye en 2024</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {formatCurrency(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.totalAmount, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Taux de commission</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(COMMISSION_RATE)}</p>
                  <p className="text-sm text-gray-500">par client actif / mois</p>
                </div>
              </div>

              {/* Commission History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Historique des commissions</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clients actifs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date paiement</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Releve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissions.map(commission => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{commission.period}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{commission.activeClients} clients</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatCurrency(commission.totalAmount)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getCommissionStatusBadge(commission.status)}
                        </td>
                        <td className="px-6 py-4">
                          {commission.paidAt ? (
                            <p className="text-gray-900">{new Date(commission.paidAt).toLocaleDateString('fr-FR')}</p>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-medium text-blue-900 mb-2">Comment sont calculees vos commissions ?</h4>
                <p className="text-blue-800 text-sm">
                  Vous recevez {formatCurrency(COMMISSION_RATE)} par client actif et par mois, tant que le client reste abonne a SYMPHONI.A.
                  Les commissions sont calculees le 1er de chaque mois et payees apres validation.
                </p>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-gray-500">Vos informations personnelles</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      {dashboard.agent.firstName[0]}{dashboard.agent.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {dashboard.agent.firstName} {dashboard.agent.lastName}
                    </h2>
                    {dashboard.agent.company && (
                      <p className="text-gray-600">{dashboard.agent.company}</p>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                      <CheckCircle className="w-3 h-3" />
                      Actif
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{dashboard.agent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telephone</p>
                        <p className="font-medium text-gray-900">{dashboard.agent.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-medium text-gray-900">{dashboard.agent.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Agent depuis</p>
                        <p className="font-medium text-gray-900">
                          {new Date(dashboard.agent.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-4">Contrat</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Type de contrat</p>
                        <p className="font-medium text-gray-900">
                          {dashboard.agent.contractType === 'unlimited' ? 'Duree indeterminee' : '1 an'}
                        </p>
                      </div>
                      <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Telecharger mon contrat
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium text-gray-900 mb-4">Mes statistiques</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-xl">
                    <p className="text-3xl font-bold text-indigo-600">{dashboard.agent.stats.totalClients}</p>
                    <p className="text-sm text-indigo-600">Clients total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-3xl font-bold text-green-600">{dashboard.agent.stats.activeClients}</p>
                    <p className="text-sm text-green-600">Clients actifs</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(dashboard.agent.stats.totalCommissions)}</p>
                    <p className="text-sm text-purple-600">Commissions payees</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <p className="text-3xl font-bold text-orange-600">{formatCurrency(dashboard.agent.stats.pendingCommissions)}</p>
                    <p className="text-sm text-orange-600">En attente</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Add Client Modal */}
        {showAddClientModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Nouveau Client</h2>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-500">&times;</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'entreprise</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="industry">Industriel</option>
                    <option value="transporter">Transporteur</option>
                    <option value="logistician">Logisticien</option>
                    <option value="forwarder">Transitaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contact</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email du contact</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input type="tel" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Commission:</strong> Vous recevrez {formatCurrency(COMMISSION_RATE)}/mois pour ce client
                    des son activation sur SYMPHONI.A.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddClientModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Ajouter le client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

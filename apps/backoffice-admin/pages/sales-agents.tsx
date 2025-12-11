import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  Eye,
  Edit,
  FileText,
  Download,
  RefreshCw,
  Trophy,
  Target,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
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
  status: 'pending_signature' | 'active' | 'suspended' | 'terminated' | 'non_compliant';
  contractType: 'unlimited' | '1_year';
  stats: {
    totalClients: number;
    activeClients: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
  createdAt: string;
  activatedAt?: string;
}

interface Commission {
  id: string;
  agentId: string;
  agentName: string;
  period: string;
  activeClients: number;
  totalAmount: number;
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  createdAt: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetClients: number;
  status: 'upcoming' | 'active' | 'ended';
  ranking: Array<{ agentId: string; agentName: string; clientsRecruited: number; rank: number }>;
}

interface DirectionStats {
  totalAgents: number;
  activeAgents: number;
  pendingAgents: number;
  totalClients: number;
  activeClients: number;
  currentMonthCommissions: number;
  yearToDateCommissions: number;
  mrr: number;
}

const COMMISSION_RATE = 70; // EUR per client per month

const REGIONS = [
  'Ile-de-France',
  'Auvergne-Rhone-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Cote d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comte',
  'Centre-Val de Loire',
  'Corse',
];

export default function SalesAgentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'commissions' | 'challenges'>('overview');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<DirectionStats | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les données depuis l'API en parallèle
      const [overviewData, agentsData, commissionsData, challengesData] = await Promise.all([
        salesAgentsApi.getDirectionOverview(),
        salesAgentsApi.getAgents(),
        salesAgentsApi.getCommissions(),
        salesAgentsApi.getChallenges(),
      ]);

      // Stats depuis l'overview
      setStats({
        totalAgents: overviewData.totalAgents || 45,
        activeAgents: overviewData.activeAgents || 38,
        pendingAgents: overviewData.pendingAgents || 5,
        totalClients: overviewData.totalClients || 312,
        activeClients: overviewData.activeClients || 287,
        currentMonthCommissions: overviewData.currentMonthCommissions || 20090,
        yearToDateCommissions: overviewData.yearToDateCommissions || 186540,
        mrr: overviewData.mrr || (overviewData.activeClients || 287) * COMMISSION_RATE,
      });

      // Agents
      const mappedAgents = (agentsData.agents || []).map((a: any) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        phone: a.phone,
        company: a.company,
        region: a.region,
        status: a.status,
        contractType: a.contractType,
        stats: a.stats || { totalClients: 0, activeClients: 0, totalCommissions: 0, pendingCommissions: 0 },
        createdAt: a.createdAt,
        activatedAt: a.activatedAt,
      }));
      if (mappedAgents.length > 0) setAgents(mappedAgents);

      // Commissions
      const mappedCommissions = (commissionsData.commissions || []).map((c: any) => ({
        id: c.id,
        agentId: c.agentId,
        agentName: c.agentName,
        period: c.period,
        activeClients: c.activeClients,
        totalAmount: c.totalAmount,
        status: c.status,
        createdAt: c.createdAt,
      }));
      if (mappedCommissions.length > 0) setCommissions(mappedCommissions);

      // Challenges
      const mappedChallenges = (challengesData || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        startDate: ch.startDate,
        endDate: ch.endDate,
        targetClients: ch.targetClients,
        status: ch.status,
        ranking: ch.ranking || [],
      }));
      if (mappedChallenges.length > 0) setChallenges(mappedChallenges);

    } catch (error) {
      console.error('Erreur chargement données agents:', error);
      // Fallback mock data
      setStats({
        totalAgents: 45,
        activeAgents: 38,
        pendingAgents: 5,
        totalClients: 312,
        activeClients: 287,
        currentMonthCommissions: 20090,
        yearToDateCommissions: 186540,
        mrr: 287 * COMMISSION_RATE,
      });

      setAgents([
        {
          id: '1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          phone: '06 12 34 56 78',
          company: 'JD Consulting',
          region: 'Ile-de-France',
          status: 'active',
          contractType: 'unlimited',
          stats: { totalClients: 28, activeClients: 25, totalCommissions: 15400, pendingCommissions: 1750 },
          createdAt: '2024-03-15',
          activatedAt: '2024-03-20',
        },
        {
          id: '2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@example.com',
          phone: '06 98 76 54 32',
          region: 'Auvergne-Rhone-Alpes',
          status: 'active',
          contractType: '1_year',
          stats: { totalClients: 19, activeClients: 18, totalCommissions: 9800, pendingCommissions: 1260 },
          createdAt: '2024-05-01',
          activatedAt: '2024-05-10',
        },
        {
          id: '3',
          firstName: 'Pierre',
          lastName: 'Bernard',
          email: 'pierre.bernard@example.com',
          phone: '06 55 44 33 22',
          company: 'Bernard & Associes',
          region: 'Nouvelle-Aquitaine',
          status: 'pending_signature',
          contractType: 'unlimited',
          stats: { totalClients: 0, activeClients: 0, totalCommissions: 0, pendingCommissions: 0 },
          createdAt: '2024-11-25',
        },
      ]);

      setCommissions([
        { id: '1', agentId: '1', agentName: 'Jean Dupont', period: '2024-11', activeClients: 25, totalAmount: 1750, status: 'pending', createdAt: '2024-12-01' },
        { id: '2', agentId: '2', agentName: 'Marie Martin', period: '2024-11', activeClients: 18, totalAmount: 1260, status: 'pending', createdAt: '2024-12-01' },
      ]);

      setChallenges([
        {
          id: '1',
          name: '1000 clients en 4 mois',
          description: 'Objectif collectif: recruter 1000 nouveaux clients actifs en 4 mois',
          startDate: '2024-10-01',
          endDate: '2025-01-31',
          targetClients: 1000,
          status: 'active',
          ranking: [
            { agentId: '1', agentName: 'Jean Dupont', clientsRecruited: 28, rank: 1 },
            { agentId: '2', agentName: 'Marie Martin', clientsRecruited: 19, rank: 2 },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_signature': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'suspended': return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'terminated': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'non_compliant': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: Agent['status']) => {
    const labels: Record<string, string> = {
      active: 'Actif',
      pending_signature: 'En attente signature',
      suspended: 'Suspendu',
      terminated: 'Resilie',
      non_compliant: 'Non conforme URSSAF',
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: Agent['status']) => {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending_signature: 'bg-orange-100 text-orange-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-gray-100 text-gray-800',
      non_compliant: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getCommissionStatusBadge = (status: Commission['status']) => {
    const classes: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      validated: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      validated: 'Validee',
      paid: 'Payee',
      cancelled: 'Annulee',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const filteredAgents = agents.filter(agent => {
    if (filterStatus !== 'all' && agent.status !== filterStatus) return false;
    if (filterRegion !== 'all' && agent.region !== filterRegion) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        agent.firstName.toLowerCase().includes(query) ||
        agent.lastName.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        (agent.company && agent.company.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (loading) {
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
        <title>Agents Commerciaux - SYMPHONI.A Backoffice</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Module Agents Commerciaux</h1>
              <p className="text-sm text-gray-500 mt-1">Gestion des agents et commissions</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNewAgentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Nouvel Agent
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'agents', label: 'Agents', icon: Users },
              { id: 'commissions', label: 'Commissions', icon: DollarSign },
              { id: 'challenges', label: 'Challenges', icon: Trophy },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Agents Actifs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeAgents}</p>
                      <p className="text-xs text-gray-400 mt-1">{stats.pendingAgents} en attente</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Clients Actifs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeClients}</p>
                      <p className="text-xs text-gray-400 mt-1">{stats.totalClients} total</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Commissions ce mois</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.currentMonthCommissions)}</p>
                      <p className="text-xs text-gray-400 mt-1">A valider et payer</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">MRR Agents</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.mrr)}</p>
                      <p className="text-xs text-gray-400 mt-1">{COMMISSION_RATE}EUR/client/mois</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Agents & Active Challenge */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Agents */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Top Agents</h3>
                    <p className="text-sm text-gray-500">Par nombre de clients actifs</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {agents
                        .filter(a => a.status === 'active')
                        .sort((a, b) => b.stats.activeClients - a.stats.activeClients)
                        .slice(0, 5)
                        .map((agent, index) => (
                          <div key={agent.id} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                              <p className="text-sm text-gray-500">{agent.region}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{agent.stats.activeClients} clients</p>
                              <p className="text-sm text-green-600">{formatCurrency(agent.stats.activeClients * COMMISSION_RATE)}/mois</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Active Challenge */}
                {challenges.find(c => c.status === 'active') && (
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm text-white">
                    <div className="p-6 border-b border-white/20">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Challenge en cours</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      {(() => {
                        const challenge = challenges.find(c => c.status === 'active')!;
                        const totalRecruited = challenge.ranking.reduce((sum, r) => sum + r.clientsRecruited, 0);
                        const progress = (totalRecruited / challenge.targetClients) * 100;
                        return (
                          <>
                            <h4 className="text-xl font-bold mb-2">{challenge.name}</h4>
                            <p className="text-white/80 text-sm mb-4">{challenge.description}</p>

                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{totalRecruited} clients recrutes</span>
                                <span>Objectif: {challenge.targetClients}</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-3">
                                <div
                                  className="bg-white rounded-full h-3 transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium">Podium actuel:</p>
                              {challenge.ranking.slice(0, 3).map((r, i) => (
                                <div key={r.agentId} className="flex items-center gap-2 text-sm">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                    i === 1 ? 'bg-gray-300 text-gray-700' :
                                    'bg-orange-400 text-orange-900'
                                  }`}>{i + 1}</span>
                                  <span className="flex-1">{r.agentName}</span>
                                  <span className="font-medium">{r.clientsRecruited} clients</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className="text-sm text-white/80">
                                Fin du challenge: {new Date(challenge.endDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Agents by Region */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Repartition par Region</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {REGIONS.map(region => {
                      const regionAgents = agents.filter(a => a.region === region);
                      const activeCount = regionAgents.filter(a => a.status === 'active').length;
                      const clientsCount = regionAgents.reduce((sum, a) => sum + a.stats.activeClients, 0);
                      return (
                        <div key={region} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 text-sm">{region}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{activeCount} agents</span>
                            <span className="text-indigo-600 font-medium">{clientsCount} clients</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un agent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="pending_signature">En attente signature</option>
                    <option value="suspended">Suspendu</option>
                    <option value="non_compliant">Non conforme</option>
                    <option value="terminated">Resilie</option>
                  </select>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Toutes les regions</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agents List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commissions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAgents.map(agent => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {agent.firstName[0]}{agent.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                              <p className="text-sm text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{agent.region}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(agent.status)}`}>
                            {getStatusIcon(agent.status)}
                            {getStatusLabel(agent.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{agent.stats.activeClients} actifs</p>
                          <p className="text-sm text-gray-500">{agent.stats.totalClients} total</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-green-600">{formatCurrency(agent.stats.totalCommissions)}</p>
                          {agent.stats.pendingCommissions > 0 && (
                            <p className="text-sm text-orange-500">{formatCurrency(agent.stats.pendingCommissions)} en attente</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Voir details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Contrat"
                            >
                              <FileText className="w-4 h-4" />
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

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">En attente</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.totalAmount, 0))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Validees</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(commissions.filter(c => c.status === 'validated').reduce((sum, c) => sum + c.totalAmount, 0))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payees ce mois</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.totalAmount, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Calculer commissions du mois
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>

              {/* Commissions Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients actifs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissions.map(commission => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{commission.agentName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{commission.period}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{commission.activeClients}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatCurrency(commission.totalAmount)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getCommissionStatusBadge(commission.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {commission.status === 'pending' && (
                              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                Valider
                              </button>
                            )}
                            {commission.status === 'validated' && (
                              <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                Marquer payee
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <FileText className="w-4 h-4" />
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

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-6">
              {/* Create Challenge Button */}
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Trophy className="w-4 h-4" />
                  Creer un Challenge
                </button>
              </div>

              {/* Challenges List */}
              {challenges.map(challenge => (
                <div key={challenge.id} className={`rounded-xl shadow-sm border overflow-hidden ${
                  challenge.status === 'active'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent'
                    : 'bg-white border-gray-100'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className={`w-5 h-5 ${challenge.status === 'active' ? 'text-yellow-300' : 'text-indigo-600'}`} />
                          <h3 className={`text-xl font-bold ${challenge.status === 'active' ? 'text-white' : 'text-gray-900'}`}>
                            {challenge.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            challenge.status === 'active' ? 'bg-white/20 text-white' :
                            challenge.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {challenge.status === 'active' ? 'En cours' : challenge.status === 'upcoming' ? 'A venir' : 'Termine'}
                          </span>
                        </div>
                        <p className={challenge.status === 'active' ? 'text-white/80' : 'text-gray-600'}>
                          {challenge.description}
                        </p>
                      </div>
                      <div className={`text-right ${challenge.status === 'active' ? 'text-white/80' : 'text-gray-500'}`}>
                        <p className="text-sm">Du {new Date(challenge.startDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-sm">au {new Date(challenge.endDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    {(() => {
                      const totalRecruited = challenge.ranking.reduce((sum, r) => sum + r.clientsRecruited, 0);
                      const progress = (totalRecruited / challenge.targetClients) * 100;
                      return (
                        <div className="mb-6">
                          <div className={`flex justify-between text-sm mb-2 ${challenge.status === 'active' ? 'text-white' : 'text-gray-700'}`}>
                            <span>{totalRecruited} clients recrutes</span>
                            <span>Objectif: {challenge.targetClients}</span>
                          </div>
                          <div className={`w-full rounded-full h-3 ${challenge.status === 'active' ? 'bg-white/20' : 'bg-gray-100'}`}>
                            <div
                              className={`rounded-full h-3 transition-all ${challenge.status === 'active' ? 'bg-white' : 'bg-indigo-600'}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Ranking */}
                    <div>
                      <h4 className={`font-medium mb-3 ${challenge.status === 'active' ? 'text-white' : 'text-gray-900'}`}>
                        Classement
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {challenge.ranking.slice(0, 10).map((r, i) => (
                          <div
                            key={r.agentId}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              challenge.status === 'active' ? 'bg-white/10' : 'bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              i === 0 ? 'bg-yellow-400 text-yellow-900' :
                              i === 1 ? 'bg-gray-300 text-gray-700' :
                              i === 2 ? 'bg-orange-400 text-orange-900' :
                              challenge.status === 'active' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${challenge.status === 'active' ? 'text-white' : 'text-gray-900'}`}>
                                {r.agentName}
                              </p>
                            </div>
                            <p className={`font-bold ${challenge.status === 'active' ? 'text-white' : 'text-indigo-600'}`}>
                              {r.clientsRecruited}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prizes */}
                    <div className={`mt-6 pt-6 border-t ${challenge.status === 'active' ? 'border-white/20' : 'border-gray-100'}`}>
                      <h4 className={`font-medium mb-3 ${challenge.status === 'active' ? 'text-white' : 'text-gray-900'}`}>
                        Dotations
                      </h4>
                      <div className="flex gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          challenge.status === 'active' ? 'bg-yellow-400/20' : 'bg-yellow-50'
                        }`}>
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className={challenge.status === 'active' ? 'text-white' : 'text-gray-900'}>1er: 4 000 EUR</span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          challenge.status === 'active' ? 'bg-gray-400/20' : 'bg-gray-50'
                        }`}>
                          <Award className="w-5 h-5 text-gray-400" />
                          <span className={challenge.status === 'active' ? 'text-white' : 'text-gray-900'}>2eme: 2 000 EUR</span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          challenge.status === 'active' ? 'bg-orange-400/20' : 'bg-orange-50'
                        }`}>
                          <Award className="w-5 h-5 text-orange-500" />
                          <span className={challenge.status === 'active' ? 'text-white' : 'text-gray-900'}>3eme: 1 000 EUR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Agent Detail Modal */}
        {showAgentModal && selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Details de l'agent</h2>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Agent Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {selectedAgent.firstName[0]}{selectedAgent.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedAgent.firstName} {selectedAgent.lastName}
                    </h3>
                    {selectedAgent.company && (
                      <p className="text-gray-600">{selectedAgent.company}</p>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${getStatusBadgeClass(selectedAgent.status)}`}>
                      {getStatusIcon(selectedAgent.status)}
                      {getStatusLabel(selectedAgent.status)}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedAgent.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedAgent.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedAgent.region}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">Depuis le {new Date(selectedAgent.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-sm text-indigo-600 font-medium">Clients actifs</p>
                    <p className="text-3xl font-bold text-indigo-900">{selectedAgent.stats.activeClients}</p>
                    <p className="text-sm text-indigo-600">{selectedAgent.stats.totalClients} total</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 font-medium">Commissions totales</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(selectedAgent.stats.totalCommissions)}</p>
                    <p className="text-sm text-orange-600">{formatCurrency(selectedAgent.stats.pendingCommissions)} en attente</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {selectedAgent.status === 'pending_signature' && (
                    <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Renvoyer invitation
                    </button>
                  )}
                  {selectedAgent.status === 'active' && (
                    <button className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                      Suspendre
                    </button>
                  )}
                  {selectedAgent.status === 'suspended' && (
                    <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                      Reactiver
                    </button>
                  )}
                  {selectedAgent.status === 'non_compliant' && (
                    <button className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      Marquer conforme
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Voir contrat
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Historique
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Agent Modal */}
        {showNewAgentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Nouvel Agent Commercial</h2>
                <button
                  onClick={() => setShowNewAgentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input type="tel" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (optionnel)</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="contractType" value="unlimited" defaultChecked className="text-indigo-600" />
                      <span>Duree indeterminee</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="contractType" value="1_year" className="text-indigo-600" />
                      <span>1 an</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowNewAgentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Creer et envoyer invitation
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

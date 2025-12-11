import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Warehouse,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Truck,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MapPin,
  Timer,
  XCircle,
  Activity,
  Brain,
  Sparkles,
  Target,
  Lightbulb,
  ChevronRight,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import kpiApi, { LogisticsKPIs as APILogisticsKPIs, CarrierScore } from '@shared/services/kpi-api';

// API URL pour les rapports IA
const ORDERS_API = process.env.NEXT_PUBLIC_ORDERS_API || 'https://dh9acecfz0wg0.cloudfront.net/api/v1';

interface AIReport {
  reportId: string;
  reportType: string;
  period: { month: number; year: number };
  status: string;
  executiveSummary: {
    overview: string;
    keyFindings: string[];
    mainRecommendation: string;
    confidenceScore: number;
  };
  alerts: Array<{ type: string; severity: string; message: string; metric?: string }>;
  recommendations: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
    implementation: { difficulty: string; timeframe: string };
  }>;
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    mediumTerm: string[];
  };
  nextMonthTargets: Array<{ metric: string; currentValue: number; targetValue: number; unit: string }>;
  createdAt: string;
  userFeedback?: { rating: number; helpful: boolean };
}

interface LogisticsKPIs {
  dockPerformance: {
    averageWaitTime: number;
    averageLoadingTime: number;
    dockSaturation: number;
    appointmentsHonored: number;
    noShowRate: number;
    trackingDelays: number;
    kioskAdoption: number;
  };
  realTimeStatus: {
    activeDocks: number;
    totalDocks: number;
    currentQueue: number;
    trucksOnSite: number;
    estimatedClearTime: number;
  };
  dailyMetrics: {
    completed: number;
    pending: number;
    cancelled: number;
    onTime: number;
    late: number;
  };
  topIssues: Array<{
    type: string;
    count: number;
    trend: number;
  }>;
  carrierPerformance: Array<{
    name: string;
    onTime: number;
    noShow: number;
    avgWait: number;
  }>;
}

export default function LogisticianKPIPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<LogisticsKPIs | null>(null);
  const [selectedSite, setSelectedSite] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSection, setShowAiSection] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getUser();
    setUser(currentUser);
    loadKPIs();
    if (currentUser?.userId || currentUser?.id) {
      loadAIReport(currentUser.userId || currentUser.id);
    }

    if (autoRefresh) {
      const interval = setInterval(loadKPIs, 30000);
      return () => clearInterval(interval);
    }
  }, [router, selectedSite, autoRefresh]);

  const loadAIReport = async (userId: string) => {
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/logistician/${userId}/latest`);
      const data = await response.json();
      if (data.success && data.report) {
        setAiReport(data.report);
        setFeedbackSent(!!data.report.userFeedback);
      }
    } catch (error) {
      console.error('Erreur chargement rapport IA:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIReport = async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/generate/logistician`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          userName: user.name || user.email || 'Logisticien'
        })
      });
      const data = await response.json();
      if (data.success && data.report) {
        setAiReport(data.report);
        setFeedbackSent(false);
      }
    } catch (error) {
      console.error('Erreur generation rapport IA:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const submitFeedback = async (rating: number, helpful: boolean) => {
    if (!aiReport?.reportId) return;
    try {
      await fetch(`${ORDERS_API}/ai-reports/${aiReport.reportId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, helpful })
      });
      setFeedbackSent(true);
    } catch (error) {
      console.error('Erreur envoi feedback:', error);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    return months[month - 1] || '';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const loadKPIs = async () => {
    setLoading(true);
    try {
      // Récupérer le warehouseId depuis l'utilisateur ou le site sélectionné
      const warehouseId = selectedSite !== 'all' ? selectedSite : (user?.warehouseId || 'warehouse-1');

      // Charger les KPIs logistique et les scores transporteurs en parallèle
      const [logisticsData, carriersData] = await Promise.all([
        kpiApi.logistics.get(warehouseId),
        kpiApi.carriers.getTop(10),
      ]);

      // Transformer les données API en format attendu par l'UI
      const carrierPerformance = (carriersData.data || []).slice(0, 4).map((c: CarrierScore) => ({
        name: c.carrierName || 'Transporteur',
        onTime: Math.round(c.metrics?.onTimeDeliveries / c.metrics?.totalTransports * 100) || 90,
        noShow: c.metrics?.totalCancellations || 0,
        avgWait: c.metrics?.averageDelay || 15,
      }));

      setKpis({
        dockPerformance: {
          averageWaitTime: logisticsData.dockPerformance?.averageWaitTime || 18,
          averageLoadingTime: logisticsData.dockPerformance?.averageLoadingTime || 42,
          dockSaturation: parseFloat(logisticsData.dockPerformance?.dockSaturation || '72'),
          appointmentsHonored: parseFloat(logisticsData.dockPerformance?.appointmentsHonored || '91'),
          noShowRate: parseFloat(logisticsData.dockPerformance?.noShowRate || '4.2'),
          trackingDelays: logisticsData.dockPerformance?.trackingDelays || 8,
          kioskAdoption: parseFloat(logisticsData.dockPerformance?.kioskAdoption || '67'),
        },
        realTimeStatus: {
          activeDocks: logisticsData.realTimeStatus?.activeDocks || 8,
          totalDocks: logisticsData.realTimeStatus?.totalDocks || 12,
          currentQueue: logisticsData.realTimeStatus?.currentQueue || 5,
          trucksOnSite: logisticsData.realTimeStatus?.trucksOnSite || 14,
          estimatedClearTime: logisticsData.realTimeStatus?.estimatedClearTime || 45,
        },
        dailyMetrics: {
          completed: logisticsData.dailyMetrics?.completed || 42,
          pending: logisticsData.dailyMetrics?.pending || 18,
          cancelled: logisticsData.dailyMetrics?.cancelled || 3,
          onTime: Math.round((logisticsData.dailyMetrics?.completed || 42) * 0.9),
          late: Math.round((logisticsData.dailyMetrics?.completed || 42) * 0.1),
        },
        topIssues: [
          { type: 'Retard arrivee', count: logisticsData.dockPerformance?.trackingDelays || 12, trend: -8 },
          { type: 'Documents manquants', count: 8, trend: 15 },
          { type: 'No-show', count: Math.round(parseFloat(logisticsData.dockPerformance?.noShowRate || '3')), trend: -25 },
          { type: 'Blocage quai', count: 2, trend: 0 },
        ],
        carrierPerformance: carrierPerformance.length > 0 ? carrierPerformance : [
          { name: 'Transport Express', onTime: 94, noShow: 1, avgWait: 12 },
          { name: 'Logistics Pro', onTime: 89, noShow: 2, avgWait: 18 },
          { name: 'FastFreight', onTime: 85, noShow: 0, avgWait: 22 },
          { name: 'EuroTrans', onTime: 78, noShow: 3, avgWait: 28 },
        ],
      });
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      // Fallback données mock en cas d'erreur
      setKpis({
        dockPerformance: {
          averageWaitTime: 18,
          averageLoadingTime: 42,
          dockSaturation: 72,
          appointmentsHonored: 91,
          noShowRate: 4.2,
          trackingDelays: 8,
          kioskAdoption: 67,
        },
        realTimeStatus: {
          activeDocks: 8,
          totalDocks: 12,
          currentQueue: 5,
          trucksOnSite: 14,
          estimatedClearTime: 45,
        },
        dailyMetrics: {
          completed: 42,
          pending: 18,
          cancelled: 3,
          onTime: 38,
          late: 4,
        },
        topIssues: [
          { type: 'Retard arrivee', count: 12, trend: -8 },
          { type: 'Documents manquants', count: 8, trend: 15 },
          { type: 'No-show', count: 3, trend: -25 },
          { type: 'Blocage quai', count: 2, trend: 0 },
        ],
        carrierPerformance: [
          { name: 'Transport Express', onTime: 94, noShow: 1, avgWait: 12 },
          { name: 'Logistics Pro', onTime: 89, noShow: 2, avgWait: 18 },
          { name: 'FastFreight', onTime: 85, noShow: 0, avgWait: 22 },
          { name: 'EuroTrans', onTime: 78, noShow: 3, avgWait: 28 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, unit, icon: Icon, color, bgColor, trend, status }: any) => (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${
      status === 'good' ? 'border-green-500' :
      status === 'warning' ? 'border-yellow-500' :
      status === 'danger' ? 'border-red-500' : 'border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <Head>
        <title>KPI Logistique - SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => router.push('/')} className="text-teal-200 hover:text-white text-sm mb-2">
                  &larr; Retour au portail
                </button>
                <h1 className="text-2xl font-bold">KPIs Logistique</h1>
                <p className="text-teal-200">Supervision des sites et performance des quais</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                >
                  <option value="all">Tous les sites</option>
                  <option value="site1">Entrepot Lyon</option>
                  <option value="site2">Entrepot Paris</option>
                  <option value="site3">Entrepot Marseille</option>
                </select>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    autoRefresh ? 'bg-white/20' : 'bg-white/10'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Live' : 'Pause'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>)}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ) : kpis && (
            <>
              {/* Real-time Status Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Statut Temps Reel
                  </h2>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    Actualise: {new Date().toLocaleTimeString('fr-FR')}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{kpis.realTimeStatus.activeDocks}/{kpis.realTimeStatus.totalDocks}</p>
                    <p className="text-blue-200 text-sm">Quais actifs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{kpis.realTimeStatus.trucksOnSite}</p>
                    <p className="text-blue-200 text-sm">Camions sur site</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{kpis.realTimeStatus.currentQueue}</p>
                    <p className="text-blue-200 text-sm">En file d'attente</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{kpis.dockPerformance.dockSaturation}%</p>
                    <p className="text-blue-200 text-sm">Saturation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{kpis.realTimeStatus.estimatedClearTime}min</p>
                    <p className="text-blue-200 text-sm">Temps de vidage</p>
                  </div>
                </div>
              </div>

              {/* Main KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard
                  title="Temps d'attente moyen"
                  value={kpis.dockPerformance.averageWaitTime}
                  unit="min"
                  icon={Clock}
                  color="text-orange-600"
                  bgColor="bg-orange-100"
                  trend={-12}
                  status={kpis.dockPerformance.averageWaitTime <= 15 ? 'good' : kpis.dockPerformance.averageWaitTime <= 25 ? 'warning' : 'danger'}
                />
                <KPICard
                  title="RDV honores"
                  value={kpis.dockPerformance.appointmentsHonored}
                  unit="%"
                  icon={CheckCircle}
                  color="text-green-600"
                  bgColor="bg-green-100"
                  trend={3.5}
                  status={kpis.dockPerformance.appointmentsHonored >= 90 ? 'good' : kpis.dockPerformance.appointmentsHonored >= 80 ? 'warning' : 'danger'}
                />
                <KPICard
                  title="Taux no-show"
                  value={kpis.dockPerformance.noShowRate}
                  unit="%"
                  icon={XCircle}
                  color="text-red-600"
                  bgColor="bg-red-100"
                  trend={-18}
                  status={kpis.dockPerformance.noShowRate <= 3 ? 'good' : kpis.dockPerformance.noShowRate <= 5 ? 'warning' : 'danger'}
                />
                <KPICard
                  title="Adoption borne check-in"
                  value={kpis.dockPerformance.kioskAdoption}
                  unit="%"
                  icon={MapPin}
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                  trend={8}
                  status="good"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Daily Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Operations du Jour
                  </h3>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{kpis.dailyMetrics.completed}</p>
                      <p className="text-xs text-gray-500">Termines</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{kpis.dailyMetrics.pending}</p>
                      <p className="text-xs text-gray-500">En attente</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{kpis.dailyMetrics.onTime}</p>
                      <p className="text-xs text-gray-500">A l'heure</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{kpis.dailyMetrics.late}</p>
                      <p className="text-xs text-gray-500">En retard</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{kpis.dailyMetrics.cancelled}</p>
                      <p className="text-xs text-gray-500">Annules</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progression journaliere</span>
                      <span className="font-medium">
                        {Math.round((kpis.dailyMetrics.completed / (kpis.dailyMetrics.completed + kpis.dailyMetrics.pending)) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${(kpis.dailyMetrics.completed / (kpis.dailyMetrics.completed + kpis.dailyMetrics.pending)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top Issues */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Problemes Frequents
                  </h3>
                  <div className="space-y-3">
                    {kpis.topIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                            {issue.count}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{issue.type}</span>
                        </div>
                        <div className={`flex items-center text-sm ${issue.trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {issue.trend <= 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
                          {issue.trend >= 0 ? '+' : ''}{issue.trend}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carrier Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Performance Transporteurs sur Site
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Transporteur</th>
                        <th className="pb-3 font-medium text-center">Ponctualite</th>
                        <th className="pb-3 font-medium text-center">No-shows</th>
                        <th className="pb-3 font-medium text-center">Attente moy.</th>
                        <th className="pb-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.carrierPerformance.map((carrier, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="font-medium text-gray-900">{carrier.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`font-medium ${
                              carrier.onTime >= 90 ? 'text-green-600' :
                              carrier.onTime >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {carrier.onTime}%
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              carrier.noShow === 0 ? 'bg-green-100 text-green-700' :
                              carrier.noShow <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {carrier.noShow}
                            </span>
                          </td>
                          <td className="py-4 text-center text-gray-600">
                            {carrier.avgWait} min
                          </td>
                          <td className="py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              carrier.onTime >= 90 && carrier.noShow <= 1 ? 'bg-green-100 text-green-700' :
                              carrier.onTime >= 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {carrier.onTime >= 90 && carrier.noShow <= 1 ? 'Excellent' :
                               carrier.onTime >= 80 ? 'Correct' : 'A surveiller'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Analyse IA & Recommandations
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Powered by Claude
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {!aiReport && !aiLoading && (
                      <button
                        onClick={generateAIReport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generer
                      </button>
                    )}
                    <button
                      onClick={() => setShowAiSection(!showAiSection)}
                      className="p-1.5 text-gray-500 hover:text-gray-700"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAiSection ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {showAiSection && (
                  <>
                    {aiLoading ? (
                      <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                          <p className="text-sm text-gray-600">Analyse IA en cours...</p>
                        </div>
                      </div>
                    ) : aiReport ? (
                      <div className="space-y-4">
                        {/* Executive Summary */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-purple-900 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Synthese {getMonthName(aiReport.period.month)} {aiReport.period.year}
                              </h4>
                            </div>
                            <span className="text-sm text-purple-700 font-medium">
                              Confiance: {aiReport.executiveSummary.confidenceScore}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{aiReport.executiveSummary.overview}</p>
                          <div className="p-3 bg-white/60 rounded-lg">
                            <h5 className="text-xs font-medium text-purple-800 mb-1 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Recommandation principale
                            </h5>
                            <p className="text-sm text-gray-700">{aiReport.executiveSummary.mainRecommendation}</p>
                          </div>
                        </div>

                        {/* Key Findings & Alerts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Points cles
                            </h4>
                            <ul className="space-y-2">
                              {aiReport.executiveSummary.keyFindings.slice(0, 3).map((finding, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {aiReport.alerts && aiReport.alerts.length > 0 && (
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                              <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Alertes
                              </h4>
                              <ul className="space-y-2">
                                {aiReport.alerts.slice(0, 3).map((alert, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(alert.severity)}`}></span>
                                    {alert.message}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Top Recommendations */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-teal-600" />
                            Actions recommandees
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiReport.recommendations.slice(0, 4).map((rec, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(rec.priority)}`}>
                                    {rec.priority === 'critical' ? 'Critique' :
                                     rec.priority === 'high' ? 'Haute' :
                                     rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                  </span>
                                  <span className="text-xs text-green-600">{rec.expectedImpact}</span>
                                </div>
                                <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Plan */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <h5 className="text-xs font-medium text-red-800 mb-2">Immediat</h5>
                            <ul className="space-y-1">
                              {aiReport.actionPlan.immediate.slice(0, 2).map((action, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                  <ChevronRight className="w-3 h-3 text-red-500 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <h5 className="text-xs font-medium text-orange-800 mb-2">Court terme</h5>
                            <ul className="space-y-1">
                              {aiReport.actionPlan.shortTerm.slice(0, 2).map((action, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                  <ChevronRight className="w-3 h-3 text-orange-500 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <h5 className="text-xs font-medium text-teal-800 mb-2">Moyen terme</h5>
                            <ul className="space-y-1">
                              {aiReport.actionPlan.mediumTerm.slice(0, 2).map((action, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                  <ChevronRight className="w-3 h-3 text-teal-500 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Feedback */}
                        {!feedbackSent ? (
                          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                            <span className="text-sm text-gray-600">Ce rapport vous a-t-il ete utile ?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => submitFeedback(5, true)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                Oui
                              </button>
                              <button
                                onClick={() => submitFeedback(2, false)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                Non
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Merci pour votre feedback !
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <Brain className="w-10 h-10 text-purple-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-3">
                          Obtenez des recommandations personnalisees pour optimiser vos operations logistiques.
                        </p>
                        <button
                          onClick={generateAIReport}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generer un rapport IA
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

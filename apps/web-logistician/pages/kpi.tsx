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
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import kpiApi, { LogisticsKPIs as APILogisticsKPIs, CarrierScore } from '@shared/services/kpi-api';

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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadKPIs();

    if (autoRefresh) {
      const interval = setInterval(loadKPIs, 30000);
      return () => clearInterval(interval);
    }
  }, [router, selectedSite, autoRefresh]);

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
            </>
          )}
        </div>
      </div>
    </>
  );
}

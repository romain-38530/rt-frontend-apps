import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Activity,
  Users,
  Factory,
  Warehouse,
  DollarSign,
  Leaf,
  Download,
  FileText,
  FileSpreadsheet,
  Bell,
  RefreshCw,
  Filter,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  KPICard,
  KPIGrid,
  CarrierScoreCard,
  AlertCard,
  OperationalStatus,
  RSEMetrics,
} from '@shared/components/kpi';
import kpiApi, {
  GlobalKPIs,
  OperationalKPIs,
  CarrierScore,
  IndustryKPIs,
  LogisticsKPIs,
  FinancialKPIs,
  RSEKPIs,
  Alert,
} from '@shared/services/kpi-api';

type TabType = 'overview' | 'operational' | 'carriers' | 'industry' | 'logistics' | 'financial' | 'rse' | 'alerts';

export default function KPIDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState<GlobalKPIs | null>(null);
  const [operationalData, setOperationalData] = useState<OperationalKPIs | null>(null);
  const [carrierScores, setCarrierScores] = useState<CarrierScore[]>([]);
  const [industryData, setIndustryData] = useState<IndustryKPIs | null>(null);
  const [logisticsData, setLogisticsData] = useState<LogisticsKPIs | null>(null);
  const [financialData, setFinancialData] = useState<FinancialKPIs | null>(null);
  const [rseData, setRseData] = useState<RSEKPIs | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load data based on active tab
      const [global, operational, carriers, alertsData] = await Promise.all([
        kpiApi.global.getGlobal(),
        kpiApi.operational.getLive(),
        kpiApi.carriers.getTop(20),
        kpiApi.alerts.getActive({ limit: 50 }),
      ]);

      setGlobalData(global);
      setOperationalData(operational);
      setCarrierScores(carriers.data || []);
      setAlerts(alertsData.data || []);

      // Load additional data
      const [industry, logistics, financial, rse] = await Promise.all([
        kpiApi.industry.get('default', selectedPeriod),
        kpiApi.logistics.get('warehouse-1'),
        kpiApi.financial.get('global', selectedPeriod),
        kpiApi.rse.get('global'),
      ]);

      setIndustryData(industry);
      setLogisticsData(logistics);
      setFinancialData(financial);
      setRseData(rse);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
      // Generate mock data for demo
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Mock operational data
    setOperationalData({
      transportsInProgress: {
        total: 187,
        byStatus: { enRoute: 98, loading: 32, unloading: 28, waiting: 18, delayed: 11 },
      },
      delays: { percentage: '7.2', averageMinutes: 23, detectedByTrackingIA: 11 },
      eta: { accuracy: '92.4', averageDeviation: 12 },
      orderAcceptance: { averageTimeMinutes: 18, pendingOrders: 34 },
      planning: { saturationLevel: '78.5', availableSlots: 67 },
      affretIA: { activeOrders: 56, matchRate: '82.3' },
      vigilance: { blockedCarriers: 4, pendingValidations: 12 },
      carrierResponse: { averageRate: '89.6', belowThreshold: 7 },
      timestamp: new Date().toISOString(),
    });

    // Mock carrier scores
    setCarrierScores([
      { carrierId: 'TR001', carrierName: 'Transport Express', score: 92, ranking: { global: 1, percentile: 95 }, trends: { lastWeek: '2.1', lastMonth: '5.3', evolution: 'up' }, metrics: { totalTransports: 456, onTimeDeliveries: 421, averageDelay: 8, documentsOnTime: '94.2', totalCancellations: 3, averageResponseTime: 12 }, comparisons: { vsLaneAverage: '8.2', vsNetworkAverage: '12.4', vsTop20: '-2.1' }, scoreDetails: {} as any },
      { carrierId: 'TR002', carrierName: 'Logistics Pro', score: 88, ranking: { global: 2, percentile: 90 }, trends: { lastWeek: '1.2', lastMonth: '3.1', evolution: 'up' }, metrics: { totalTransports: 389, onTimeDeliveries: 342, averageDelay: 11, documentsOnTime: '91.5', totalCancellations: 5, averageResponseTime: 15 }, comparisons: { vsLaneAverage: '5.6', vsNetworkAverage: '9.2', vsTop20: '-5.8' }, scoreDetails: {} as any },
      { carrierId: 'TR003', carrierName: 'FastFreight', score: 85, ranking: { global: 3, percentile: 85 }, trends: { lastWeek: '-0.5', lastMonth: '2.4', evolution: 'stable' }, metrics: { totalTransports: 312, onTimeDeliveries: 265, averageDelay: 14, documentsOnTime: '88.7', totalCancellations: 8, averageResponseTime: 18 }, comparisons: { vsLaneAverage: '3.2', vsNetworkAverage: '6.8', vsTop20: '-8.4' }, scoreDetails: {} as any },
    ]);

    // Mock alerts
    setAlerts([
      { alertId: 'ALT-001', type: 'delay_detected', severity: 'high', title: 'Retards multiples detectes', message: '11 transports en retard', acknowledged: false, resolved: false, createdAt: new Date().toISOString() },
      { alertId: 'ALT-002', type: 'capacity_warning', severity: 'medium', title: 'Saturation planning elevee', message: 'Niveau 78.5%', acknowledged: true, resolved: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    ]);

    // Mock RSE data
    setRseData({
      companyId: 'global',
      carbonFootprint: { totalCO2: '34567', co2PerTrip: '78.5', co2PerKm: '0.82', byVehicleType: { truck: '28000', van: '5500', electric: '1067' } },
      optimization: { co2Reduction: '15.2', kmAvoided: 12450, truckFillRate: '82.4', emptyKmReduction: '18.7' },
      operationalGains: { planningHoursSaved: 87, freightHoursSaved: 62, trackingHoursSaved: 45, followUpHoursSaved: 28 },
      compliance: { regulatoryCompliance: '97.2', documentCompliance: '94.8', safetyCompliance: '98.5' },
    });
  };

  const handleExportPDF = () => {
    window.open(kpiApi.export.getPDFUrl(), '_blank');
  };

  const handleExportExcel = () => {
    window.open(kpiApi.export.getExcelUrl(), '_blank');
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await kpiApi.alerts.acknowledge(alertId, 'admin');
      loadData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await kpiApi.alerts.resolve(alertId);
      loadData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue globale', icon: Activity },
    { id: 'operational', label: 'Operationnel', icon: Activity },
    { id: 'carriers', label: 'Transporteurs', icon: Users },
    { id: 'industry', label: 'Industriel', icon: Factory },
    { id: 'logistics', label: 'Logistique', icon: Warehouse },
    { id: 'financial', label: 'Financier', icon: DollarSign },
    { id: 'rse', label: 'RSE', icon: Leaf },
    { id: 'alerts', label: 'Alertes', icon: Bell, badge: alerts.filter(a => !a.acknowledged).length },
  ];

  return (
    <>
      <Head>
        <title>KPI Dashboard - SYMPHONI.A Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Module KPI SYMPHONI.A</h1>
                <p className="text-sm text-gray-500">Pilotage de la performance transport & logistique</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="daily">Journalier</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto-refresh
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Health Score */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Score Sante Global"
                  value={globalData?.summary?.healthScore || 82}
                  unit="/100"
                  icon={Activity}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-100"
                  status={globalData?.summary?.healthScore && globalData.summary.healthScore >= 80 ? 'success' : 'warning'}
                  loading={loading}
                />
                <KPICard
                  title="Transports en cours"
                  value={operationalData?.transportsInProgress?.total || 0}
                  icon={TrendingUp}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-100"
                  trend={5.2}
                  trendLabel="vs semaine dern."
                  loading={loading}
                />
                <KPICard
                  title="Alertes critiques"
                  value={alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
                  icon={AlertTriangle}
                  iconColor="text-red-600"
                  iconBgColor="bg-red-100"
                  status={alerts.filter(a => a.severity === 'critical').length > 0 ? 'danger' : 'success'}
                  loading={loading}
                />
                <KPICard
                  title="Taux ponctualite"
                  value={`${100 - parseFloat(operationalData?.delays?.percentage || '0')}%`}
                  icon={CheckCircle}
                  iconColor="text-emerald-600"
                  iconBgColor="bg-emerald-100"
                  trend={2.1}
                  loading={loading}
                />
              </div>

              {/* Operational Status */}
              {operationalData && <OperationalStatus data={operationalData} loading={loading} />}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Carriers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Transporteurs</h3>
                  <div className="space-y-3">
                    {carrierScores.slice(0, 5).map((carrier) => (
                      <CarrierScoreCard key={carrier.carrierId} carrier={carrier} compact />
                    ))}
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Alertes recentes</h3>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <AlertCard key={alert.alertId} alert={alert} compact />
                    ))}
                  </div>
                </div>
              </div>

              {/* RSE Preview */}
              {rseData && <RSEMetrics data={rseData} loading={loading} />}
            </div>
          )}

          {/* Operational Tab */}
          {activeTab === 'operational' && operationalData && (
            <OperationalStatus data={operationalData} loading={loading} />
          )}

          {/* Carriers Tab */}
          {activeTab === 'carriers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Classement Transporteurs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carrierScores.map((carrier) => (
                    <CarrierScoreCard key={carrier.carrierId} carrier={carrier} showDetails />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RSE Tab */}
          {activeTab === 'rse' && rseData && (
            <RSEMetrics data={rseData} loading={loading} />
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Alertes Actives</h3>
                <div className="flex gap-2 text-sm">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                    {alerts.filter(a => a.severity === 'critical').length} critiques
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                    {alerts.filter(a => a.severity === 'high').length} hautes
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {alerts.filter(a => a.severity === 'medium').length} moyennes
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.alertId}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeAlert}
                    onResolve={handleResolveAlert}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Industry Tab */}
          {activeTab === 'industry' && industryData && (
            <div className="space-y-6">
              <KPIGrid
                kpis={[
                  { title: 'Livraisons a l\'heure', value: `${industryData.qualityOfService?.onTimeDeliveries}%`, icon: CheckCircle, iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
                  { title: 'Chargements a l\'heure', value: `${industryData.qualityOfService?.onTimePickups}%`, icon: Clock, iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
                  { title: 'Cout moyen/lane', value: `${industryData.costOptimization?.averageCostPerLane?.domestic}`, unit: 'EUR', icon: DollarSign, iconColor: 'text-purple-600', iconBgColor: 'bg-purple-100' },
                  { title: 'Transports/jour', value: industryData.volumetry?.dailyTransports || 0, icon: Activity, iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
                ]}
                columns={4}
                loading={loading}
              />
            </div>
          )}

          {/* Logistics Tab */}
          {activeTab === 'logistics' && logisticsData && (
            <div className="space-y-6">
              <KPIGrid
                kpis={[
                  { title: 'Temps attente moyen', value: logisticsData.dockPerformance?.averageWaitTime || 0, unit: 'min', icon: Clock, iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
                  { title: 'Saturation quais', value: `${logisticsData.dockPerformance?.dockSaturation}%`, icon: Warehouse, iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
                  { title: 'RDV honores', value: `${logisticsData.dockPerformance?.appointmentsHonored}%`, icon: CheckCircle, iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
                  { title: 'Taux no-show', value: `${logisticsData.dockPerformance?.noShowRate}%`, icon: AlertTriangle, iconColor: 'text-red-600', iconBgColor: 'bg-red-100' },
                ]}
                columns={4}
                loading={loading}
              />
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && financialData && (
            <div className="space-y-6">
              <KPIGrid
                kpis={[
                  { title: 'Factures en attente', value: financialData.invoicing?.pendingValidation || 0, icon: FileText, iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
                  { title: 'Factures validees', value: financialData.invoicing?.validated || 0, icon: CheckCircle, iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
                  { title: 'Ecart tarifaire', value: financialData.tariffAnalysis?.totalVariance || '0', unit: 'EUR', icon: DollarSign, iconColor: 'text-purple-600', iconBgColor: 'bg-purple-100' },
                  { title: 'Marge Affret.IA', value: `${financialData.margins?.affretIAMargin}%`, icon: TrendingUp, iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
                ]}
                columns={4}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSafeRouter } from '../lib/useSafeRouter';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Truck,
  Package,
  Users,
  Download,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Leaf,
  BarChart3,
  Brain,
  Sparkles,
  Target,
  Lightbulb,
  ChevronRight,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import kpiApi, { IndustryKPIs, CarrierScore } from '@shared/services/kpi-api';

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

interface IndustryKPIsExtended {
  qualityOfService: {
    onTimeDeliveries: string;
    onTimePickups: string;
    delayAnalysis?: {
      carrierCaused: number;
      logisticsCaused: number;
      externalCaused: number;
    };
    deliveryConformity: string;
    missingDocuments: number;
  };
  costOptimization: {
    averageCostPerLane: { domestic: string; international: string };
    costPerKm: string;
    affretIASavings: string;
    delayCosts: string;
  };
  volumetry: {
    dailyTransports: number;
    monthlyTransports: number;
    tonnage: { daily: number; monthly: number };
    pallets: { daily: number; monthly: number };
  };
  carrierDistribution: Array<{ name: string; percentage: number; score: number }>;
}

export default function IndustryKPIPage() {
  const router = useSafeRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<IndustryKPIsExtended | null>(null);
  const [topCarriers, setTopCarriers] = useState<CarrierScore[]>([]);
  const [period, setPeriod] = useState('monthly');
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
    if (currentUser?.companyId) {
      loadAIReport(currentUser.companyId);
    }
  }, [router, period]);

  const loadAIReport = async (industrialId: string) => {
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/industrial/${industrialId}/latest`);
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
    if (!user?.companyId) return;
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/generate/industrial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industrialId: user.companyId,
          industrialName: user.companyName || 'Industriel'
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
      // Charger les KPIs industrie et les top transporteurs en parallèle
      const [industryData, carriersData] = await Promise.all([
        kpiApi.industry.get(user?.companyId || 'default', period),
        kpiApi.carriers.getTop(10),
      ]);

      // Transformer les données API en format attendu par l'UI
      const carrierDistribution = (carriersData.data || []).slice(0, 5).map((c: CarrierScore, idx: number) => ({
        name: c.carrierName || `Transporteur ${idx + 1}`,
        percentage: Math.round(100 / (idx + 2)),
        score: c.score,
      }));

      setKpis({
        qualityOfService: {
          onTimeDeliveries: industryData.qualityOfService?.onTimeDeliveries || '94.2',
          onTimePickups: industryData.qualityOfService?.onTimePickups || '91.8',
          deliveryConformity: industryData.qualityOfService?.deliveryConformity || '97.5',
          missingDocuments: industryData.qualityOfService?.missingDocuments || 12,
        },
        costOptimization: {
          averageCostPerLane: industryData.costOptimization?.averageCostPerLane || { domestic: '385.50', international: '1250.00' },
          costPerKm: industryData.costOptimization?.costPerKm || '1.42',
          affretIASavings: industryData.costOptimization?.affretIAvsReferenced?.savings || '12.5',
          delayCosts: industryData.costOptimization?.delayCosts || '4250.00',
        },
        volumetry: {
          dailyTransports: industryData.volumetry?.dailyTransports || 45,
          monthlyTransports: industryData.volumetry?.monthlyTransports || 987,
          tonnage: industryData.volumetry?.tonnage || { daily: 450, monthly: 12500 },
          pallets: industryData.volumetry?.pallets || { daily: 180, monthly: 4800 },
        },
        carrierDistribution: carrierDistribution.length > 0 ? carrierDistribution : [
          { name: 'Transport Express', percentage: 28, score: 92 },
          { name: 'Logistics Pro', percentage: 22, score: 88 },
          { name: 'FastFreight', percentage: 18, score: 85 },
          { name: 'EuroTrans', percentage: 15, score: 79 },
          { name: 'Autres', percentage: 17, score: 75 },
        ],
      });
      setTopCarriers(carriersData.data || []);
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      // Fallback données mock en cas d'erreur
      setKpis({
        qualityOfService: {
          onTimeDeliveries: '94.2',
          onTimePickups: '91.8',
          deliveryConformity: '97.5',
          missingDocuments: 12,
        },
        costOptimization: {
          averageCostPerLane: { domestic: '385.50', international: '1250.00' },
          costPerKm: '1.42',
          affretIASavings: '12.5',
          delayCosts: '4250.00',
        },
        volumetry: {
          dailyTransports: 45,
          monthlyTransports: 987,
          tonnage: { daily: 450, monthly: 12500 },
          pallets: { daily: 180, monthly: 4800 },
        },
        carrierDistribution: [
          { name: 'Transport Express', percentage: 28, score: 92 },
          { name: 'Logistics Pro', percentage: 22, score: 88 },
          { name: 'FastFreight', percentage: 18, score: 85 },
          { name: 'EuroTrans', percentage: 15, score: 79 },
          { name: 'Autres', percentage: 17, score: 75 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, unit, icon: Icon, color, bgColor, trend, subtitle }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
        <title>KPI Performance - SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white text-sm mb-2">
                  &larr; Retour au portail
                </button>
                <h1 className="text-2xl font-bold">Cockpit Performance</h1>
                <p className="text-blue-200">Analyse de vos KPIs transport & logistique</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                >
                  <option value="daily">Journalier</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
                <button
                  onClick={loadKPIs}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50">
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Quality of Service */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Qualite de Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Livraisons a l'heure"
                value={kpis?.qualityOfService.onTimeDeliveries}
                unit="%"
                icon={CheckCircle}
                color="text-green-600"
                bgColor="bg-green-100"
                trend={2.3}
              />
              <KPICard
                title="Chargements a l'heure"
                value={kpis?.qualityOfService.onTimePickups}
                unit="%"
                icon={Clock}
                color="text-blue-600"
                bgColor="bg-blue-100"
                trend={1.5}
              />
              <KPICard
                title="Conformite livraisons"
                value={kpis?.qualityOfService.deliveryConformity}
                unit="%"
                icon={Package}
                color="text-purple-600"
                bgColor="bg-purple-100"
                trend={0.8}
              />
              <KPICard
                title="Documents manquants"
                value={kpis?.qualityOfService.missingDocuments}
                icon={FileText}
                color="text-orange-600"
                bgColor="bg-orange-100"
                trend={-15}
                subtitle="Ce mois"
              />
            </div>
          </section>

          {/* Cost Optimization */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Optimisation des Couts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Cout moyen/lane (France)"
                value={kpis?.costOptimization.averageCostPerLane.domestic}
                unit="EUR"
                icon={DollarSign}
                color="text-green-600"
                bgColor="bg-green-100"
              />
              <KPICard
                title="Cout moyen/lane (Int.)"
                value={kpis?.costOptimization.averageCostPerLane.international}
                unit="EUR"
                icon={DollarSign}
                color="text-blue-600"
                bgColor="bg-blue-100"
              />
              <KPICard
                title="Economies Affret.IA"
                value={kpis?.costOptimization.affretIASavings}
                unit="%"
                icon={TrendingDown}
                color="text-emerald-600"
                bgColor="bg-emerald-100"
                subtitle="vs transporteurs ref."
              />
              <KPICard
                title="Surcouts retards"
                value={kpis?.costOptimization.delayCosts}
                unit="EUR"
                icon={AlertTriangle}
                color="text-red-600"
                bgColor="bg-red-100"
                subtitle="Ce mois"
              />
            </div>
          </section>

          {/* Volumetry */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Volumetrie & Capacite
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Transports/jour"
                value={kpis?.volumetry.dailyTransports}
                icon={Truck}
                color="text-blue-600"
                bgColor="bg-blue-100"
                trend={8.5}
              />
              <KPICard
                title="Transports ce mois"
                value={kpis?.volumetry.monthlyTransports}
                icon={Activity}
                color="text-indigo-600"
                bgColor="bg-indigo-100"
              />
              <KPICard
                title="Tonnage/jour"
                value={kpis?.volumetry.tonnage.daily}
                unit="T"
                icon={Package}
                color="text-purple-600"
                bgColor="bg-purple-100"
              />
              <KPICard
                title="Palettes/jour"
                value={kpis?.volumetry.pallets.daily}
                icon={Package}
                color="text-orange-600"
                bgColor="bg-orange-100"
              />
            </div>
          </section>

          {/* Carrier Distribution */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Repartition Transporteurs
            </h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Part de marche</h3>
                  <div className="space-y-3">
                    {kpis?.carrierDistribution.map((carrier, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{carrier.name}</span>
                          <span className="font-medium">{carrier.percentage}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-blue-500' :
                              idx === 1 ? 'bg-green-500' :
                              idx === 2 ? 'bg-purple-500' :
                              idx === 3 ? 'bg-orange-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${carrier.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Scores Performance</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-2">Transporteur</th>
                        <th className="text-right py-2">Score</th>
                        <th className="text-right py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis?.carrierDistribution.map((carrier, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-3 text-sm text-gray-900">{carrier.name}</td>
                          <td className="py-3 text-sm text-right font-medium">{carrier.score}/100</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              carrier.score >= 85 ? 'bg-green-100 text-green-700' :
                              carrier.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {carrier.score >= 85 ? 'Excellent' : carrier.score >= 70 ? 'Bon' : 'A surveiller'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Alerte dependance</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Transport Express represente 28% de vos flux. Pensez a diversifier vos partenaires.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RSE Preview */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Impact Environnemental
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">-15.2%</p>
                  <p className="text-sm text-gray-600">Reduction CO2</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">12,450</p>
                  <p className="text-sm text-gray-600">km evites</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">82.4%</p>
                  <p className="text-sm text-gray-600">Taux remplissage</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">222h</p>
                  <p className="text-sm text-gray-600">economisees</p>
                </div>
              </div>
            </div>
          </section>

          {/* AI Analysis Section */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Analyse IA & Recommandations
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Powered by Claude
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {!aiReport && !aiLoading && (
                  <button
                    onClick={generateAIReport}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generer un rapport
                  </button>
                )}
                <button
                  onClick={() => setShowAiSection(!showAiSection)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform ${showAiSection ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>

            {showAiSection && (
              <>
                {aiLoading ? (
                  <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                      <p className="text-gray-600">Analyse IA en cours...</p>
                      <p className="text-sm text-gray-400 mt-1">Claude analyse vos KPIs transporteurs</p>
                    </div>
                  </div>
                ) : aiReport ? (
                  <div className="space-y-6">
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow p-6 border border-purple-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Synthese Executive
                          </h3>
                          <p className="text-sm text-purple-600">
                            {getMonthName(aiReport.period.month)} {aiReport.period.year}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Indice de confiance</p>
                            <p className="text-lg font-bold text-purple-700">{aiReport.executiveSummary.confidenceScore}%</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{aiReport.executiveSummary.overview}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-purple-800 mb-2">Points cles</h4>
                          <ul className="space-y-1">
                            {aiReport.executiveSummary.keyFindings.map((finding, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-white/60 rounded-lg">
                          <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
                            <Lightbulb className="w-4 h-4" />
                            Recommandation principale
                          </h4>
                          <p className="text-sm text-gray-700">{aiReport.executiveSummary.mainRecommendation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {aiReport.alerts && aiReport.alerts.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          Alertes detectees
                        </h3>
                        <div className="space-y-3">
                          {aiReport.alerts.map((alert, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}></div>
                              <div>
                                <p className="font-medium text-gray-800">{alert.message}</p>
                                {alert.metric && (
                                  <p className="text-sm text-gray-500">Metrique: {alert.metric}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Recommandations detaillees
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiReport.recommendations.slice(0, 4).map((rec, idx) => (
                          <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(rec.priority)}`}>
                                {rec.priority === 'critical' ? 'Critique' :
                                 rec.priority === 'high' ? 'Haute' :
                                 rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>
                              <span className="text-xs text-gray-500">{rec.category}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600">Impact: {rec.expectedImpact}</span>
                              <span className="text-gray-400">{rec.implementation.timeframe}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Plan */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Plan d'action
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-800 mb-2">Immediat</h4>
                          <ul className="space-y-2">
                            {aiReport.actionPlan.immediate.map((action, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-red-500 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-2">Court terme (1-2 sem)</h4>
                          <ul className="space-y-2">
                            {aiReport.actionPlan.shortTerm.map((action, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">Moyen terme (1 mois)</h4>
                          <ul className="space-y-2">
                            {aiReport.actionPlan.mediumTerm.map((action, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Targets */}
                    {aiReport.nextMonthTargets && aiReport.nextMonthTargets.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          Objectifs mois prochain
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {aiReport.nextMonthTargets.map((target, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg text-center">
                              <p className="text-sm text-gray-500 mb-1">{target.metric}</p>
                              <p className="text-lg font-bold text-gray-900">
                                {target.currentValue} → {target.targetValue}{target.unit}
                              </p>
                              <p className="text-xs text-green-600">
                                +{((target.targetValue - target.currentValue) / target.currentValue * 100).toFixed(1)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {!feedbackSent && (
                      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">Ce rapport vous a-t-il ete utile ?</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => submitFeedback(5, true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Oui
                          </button>
                          <button
                            onClick={() => submitFeedback(2, false)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Non
                          </button>
                        </div>
                      </div>
                    )}
                    {feedbackSent && (
                      <div className="bg-green-50 rounded-lg p-4 flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <p className="text-sm">Merci pour votre feedback !</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Brain className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport IA disponible</h3>
                    <p className="text-gray-500 mb-4">
                      Generez votre premier rapport d'analyse pour obtenir des recommandations personnalisees.
                    </p>
                    <button
                      onClick={generateAIReport}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generer un rapport IA
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle,
  FileText,
  Truck,
  AlertTriangle,
  Star,
  Target,
  MessageSquare,
  Shield,
  Calendar,
  BarChart3,
  Brain,
  Sparkles,
  Lightbulb,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import { scoringApi } from '../lib/api';

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

interface CarrierScore {
  score: number;
  ranking: { global: number; percentile: number };
  evolution: 'up' | 'down' | 'stable';
  lastMonthChange: number;
  criteria: {
    slotRespect: { value: number; score: number };
    documentDelay: { value: number; score: number };
    unjustifiedDelays: { value: number; score: number };
    responseTime: { value: number; score: number };
    vigilanceCompliance: { value: number; score: number };
    cancellationRate: { value: number; score: number };
    trackingQuality: { value: number; score: number };
    premiumAdoption: { value: number; score: number };
    overallReliability: { value: number; score: number };
  };
  metrics: {
    totalTransports: number;
    onTimeDeliveries: number;
    averageDelay: number;
    documentsOnTime: number;
    cancellations: number;
    averageResponseTime: number;
  };
  comparisons: {
    vsLaneAverage: number;
    vsNetworkAverage: number;
    vsTop20: number;
  };
}

export default function TransporterKPIPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<CarrierScore | null>(null);
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
    loadScore();
    if (currentUser?.carrierId || currentUser?.companyId) {
      loadAIReport(currentUser.carrierId || currentUser.companyId);
    }
  }, [router, period]);

  const loadAIReport = async (carrierId: string) => {
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/carrier/${carrierId}/latest`);
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
    const carrierId = user?.carrierId || user?.companyId;
    if (!carrierId) return;
    setAiLoading(true);
    try {
      const response = await fetch(`${ORDERS_API}/ai-reports/generate/carrier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: carrierId,
          carrierName: user.companyName || 'Transporteur'
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

  const loadScore = async () => {
    setLoading(true);
    try {
      // Appel API scoring
      const apiData = await scoringApi.getScoreDetails();

      // Transformer les données API en format attendu par l'UI
      const scoreDetails = apiData.scoreDetails || apiData.criteria || {};
      setScoreData({
        score: apiData.score || 87,
        ranking: {
          global: apiData.ranking?.global || 12,
          percentile: apiData.ranking?.percentile || 88,
        },
        evolution: apiData.trends?.evolution || apiData.evolution || 'up',
        lastMonthChange: parseFloat(apiData.trends?.lastMonth || apiData.lastMonthChange || '3.2'),
        criteria: {
          slotRespect: { value: parseFloat(scoreDetails.slotRespect?.value || '92'), score: parseFloat(scoreDetails.slotRespect?.score || '13.8') },
          documentDelay: { value: parseFloat(scoreDetails.documentDelay?.value || '88'), score: parseFloat(scoreDetails.documentDelay?.score || '8.8') },
          unjustifiedDelays: { value: parseFloat(scoreDetails.unjustifiedDelays?.value || '85'), score: parseFloat(scoreDetails.unjustifiedDelays?.score || '12.75') },
          responseTime: { value: parseFloat(scoreDetails.responseTime?.value || '90'), score: parseFloat(scoreDetails.responseTime?.score || '9.0') },
          vigilanceCompliance: { value: parseFloat(scoreDetails.vigilanceCompliance?.value || '100'), score: parseFloat(scoreDetails.vigilanceCompliance?.score || '15.0') },
          cancellationRate: { value: parseFloat(scoreDetails.cancellationRate?.value || '95'), score: parseFloat(scoreDetails.cancellationRate?.score || '9.5') },
          trackingQuality: { value: parseFloat(scoreDetails.trackingQuality?.value || '78'), score: parseFloat(scoreDetails.trackingQuality?.score || '7.8') },
          premiumAdoption: { value: parseFloat(scoreDetails.premiumAdoption?.value || '60'), score: parseFloat(scoreDetails.premiumAdoption?.score || '3.0') },
          overallReliability: { value: parseFloat(scoreDetails.overallReliability?.value || '82'), score: parseFloat(scoreDetails.overallReliability?.score || '8.2') },
        },
        metrics: {
          totalTransports: apiData.metrics?.totalTransports || 342,
          onTimeDeliveries: apiData.metrics?.onTimeDeliveries || 298,
          averageDelay: apiData.metrics?.averageDelay || 12,
          documentsOnTime: parseFloat(apiData.metrics?.documentsOnTime || '88'),
          cancellations: apiData.metrics?.totalCancellations || apiData.metrics?.cancellations || 8,
          averageResponseTime: apiData.metrics?.averageResponseTime || 18,
        },
        comparisons: {
          vsLaneAverage: parseFloat(apiData.comparisons?.vsLaneAverage || '5.2'),
          vsNetworkAverage: parseFloat(apiData.comparisons?.vsNetworkAverage || '8.7'),
          vsTop20: parseFloat(apiData.comparisons?.vsTop20 || '-6.3'),
        },
      });
    } catch (error) {
      console.error('Erreur chargement score:', error);
      // Fallback données mock en cas d'erreur
      setScoreData({
        score: 87,
        ranking: { global: 12, percentile: 88 },
        evolution: 'up',
        lastMonthChange: 3.2,
        criteria: {
          slotRespect: { value: 92, score: 13.8 },
          documentDelay: { value: 88, score: 8.8 },
          unjustifiedDelays: { value: 85, score: 12.75 },
          responseTime: { value: 90, score: 9.0 },
          vigilanceCompliance: { value: 100, score: 15.0 },
          cancellationRate: { value: 95, score: 9.5 },
          trackingQuality: { value: 78, score: 7.8 },
          premiumAdoption: { value: 60, score: 3.0 },
          overallReliability: { value: 82, score: 8.2 },
        },
        metrics: {
          totalTransports: 342,
          onTimeDeliveries: 298,
          averageDelay: 12,
          documentsOnTime: 88,
          cancellations: 8,
          averageResponseTime: 18,
        },
        comparisons: {
          vsLaneAverage: 5.2,
          vsNetworkAverage: 8.7,
          vsTop20: -6.3,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-500' };
    if (score >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-500' };
    return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-500' };
  };

  const criteriaLabels: Record<string, { label: string; icon: any; weight: number }> = {
    slotRespect: { label: 'Respect des creneaux', icon: Calendar, weight: 15 },
    documentDelay: { label: 'Delai documents', icon: FileText, weight: 10 },
    unjustifiedDelays: { label: 'Retards non justifies', icon: Clock, weight: 15 },
    responseTime: { label: 'Temps de reponse', icon: MessageSquare, weight: 10 },
    vigilanceCompliance: { label: 'Conformite vigilance', icon: Shield, weight: 15 },
    cancellationRate: { label: 'Taux d\'annulation', icon: AlertTriangle, weight: 10 },
    trackingQuality: { label: 'Qualite tracking', icon: Target, weight: 10 },
    premiumAdoption: { label: 'Adoption Premium', icon: Star, weight: 5 },
    overallReliability: { label: 'Fiabilite globale', icon: CheckCircle, weight: 10 },
  };

  if (!user) return null;

  const colors = scoreData ? getScoreColor(scoreData.score) : getScoreColor(0);

  return (
    <>
      <Head>
        <title>Mon Score Performance - SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => router.push('/')} className="text-purple-200 hover:text-white text-sm mb-2">
                  &larr; Retour au portail
                </button>
                <h1 className="text-2xl font-bold">Mon Score Performance</h1>
                <p className="text-purple-200">Analysez vos KPIs et ameliorez votre classement</p>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
              >
                <option value="weekly">Cette semaine</option>
                <option value="monthly">Ce mois</option>
                <option value="quarterly">Ce trimestre</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          ) : scoreData && (
            <>
              {/* Score Principal */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Score Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`w-40 h-40 rounded-full ${colors.bg} flex flex-col items-center justify-center ring-4 ${colors.ring}`}>
                      <span className={`text-5xl font-bold ${colors.text}`}>{scoreData.score}</span>
                      <span className={`text-lg ${colors.text}`}>/100</span>
                    </div>
                    <div className="flex items-center mt-4 text-lg">
                      {scoreData.evolution === 'up' && <TrendingUp className="w-5 h-5 text-green-500 mr-2" />}
                      {scoreData.evolution === 'down' && <TrendingDown className="w-5 h-5 text-red-500 mr-2" />}
                      {scoreData.evolution === 'stable' && <Minus className="w-5 h-5 text-gray-400 mr-2" />}
                      <span className={scoreData.lastMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {scoreData.lastMonthChange >= 0 ? '+' : ''}{scoreData.lastMonthChange}%
                      </span>
                      <span className="text-gray-400 ml-2">ce mois</span>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                      <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">#{scoreData.ranking.global}</p>
                      <p className="text-sm text-gray-600">Classement global</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">Top {100 - scoreData.ranking.percentile}%</p>
                      <p className="text-sm text-gray-600">Percentile reseau</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">
                        {scoreData.score >= 90 ? 'Elite' :
                         scoreData.score >= 80 ? 'Or' :
                         scoreData.score >= 70 ? 'Argent' : 'Bronze'}
                      </p>
                      <p className="text-sm text-gray-600">Niveau actuel</p>
                    </div>
                  </div>
                </div>

                {/* Comparisons */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Comparaisons</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className={`text-xl font-bold ${scoreData.comparisons.vsLaneAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreData.comparisons.vsLaneAverage >= 0 ? '+' : ''}{scoreData.comparisons.vsLaneAverage}%
                      </p>
                      <p className="text-sm text-gray-500">vs Moyenne lane</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${scoreData.comparisons.vsNetworkAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreData.comparisons.vsNetworkAverage >= 0 ? '+' : ''}{scoreData.comparisons.vsNetworkAverage}%
                      </p>
                      <p className="text-sm text-gray-500">vs Moyenne reseau</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${scoreData.comparisons.vsTop20 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreData.comparisons.vsTop20 >= 0 ? '+' : ''}{scoreData.comparisons.vsTop20}%
                      </p>
                      <p className="text-sm text-gray-500">vs Top 20</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.totalTransports}</p>
                  <p className="text-xs text-gray-500">Transports</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.onTimeDeliveries}</p>
                  <p className="text-xs text-gray-500">A l'heure</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.averageDelay}min</p>
                  <p className="text-xs text-gray-500">Retard moy.</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.documentsOnTime}%</p>
                  <p className="text-xs text-gray-500">Docs a temps</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.cancellations}</p>
                  <p className="text-xs text-gray-500">Annulations</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <MessageSquare className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{scoreData.metrics.averageResponseTime}min</p>
                  <p className="text-xs text-gray-500">Temps reponse</p>
                </div>
              </div>

              {/* Criteria Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Detail des Criteres de Score</h2>
                <div className="space-y-4">
                  {Object.entries(scoreData.criteria).map(([key, data]) => {
                    const criteria = criteriaLabels[key];
                    const Icon = criteria.icon;
                    const maxScore = criteria.weight;
                    const percentage = (data.score / maxScore) * 100;

                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{criteria.label}</span>
                            <span className="text-sm text-gray-500">
                              {data.score.toFixed(1)} / {maxScore} pts
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage >= 80 ? 'bg-green-500' :
                                percentage >= 60 ? 'bg-yellow-500' :
                                percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className={`text-sm font-medium ${
                            data.value >= 80 ? 'text-green-600' :
                            data.value >= 60 ? 'text-yellow-600' :
                            data.value >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {data.value}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Analysis Section */}
                <div className="mt-8">
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

                          {/* Key Findings */}
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2">Points cles identifies</h4>
                            <ul className="space-y-2">
                              {aiReport.executiveSummary.keyFindings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Top Recommendations */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              Actions recommandees
                            </h4>
                            {aiReport.recommendations.slice(0, 3).map((rec, idx) => (
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

                          {/* Action Plan Summary */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <h5 className="text-xs font-medium text-red-800 mb-1">Immediat</h5>
                              <p className="text-xs text-gray-700">{aiReport.actionPlan.immediate[0]}</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <h5 className="text-xs font-medium text-orange-800 mb-1">Court terme</h5>
                              <p className="text-xs text-gray-700">{aiReport.actionPlan.shortTerm[0]}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <h5 className="text-xs font-medium text-blue-800 mb-1">Moyen terme</h5>
                              <p className="text-xs text-gray-700">{aiReport.actionPlan.mediumTerm[0]}</p>
                            </div>
                          </div>

                          {/* Feedback */}
                          {!feedbackSent ? (
                            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                              <span className="text-sm text-gray-600">Utile ?</span>
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
                            Obtenez des recommandations personnalisees pour ameliorer votre score.
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
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

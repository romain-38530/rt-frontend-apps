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
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';

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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadScore();
  }, [router, period]);

  const loadScore = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

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
    setLoading(false);
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

                {/* Recommendations */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-2">Axes d'amelioration</h3>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Ameliorez votre qualite de tracking (+10 pts potentiels)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Adoptez le module Premium pour booster votre score (+2 pts)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Reduisez votre temps de reponse moyen de 3 min pour atteindre le Top 10</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

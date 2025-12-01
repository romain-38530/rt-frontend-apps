import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import kpiApi, { IndustryKPIs, CarrierScore } from '@shared/services/kpi-api';

interface IndustryKPIsExtended extends Partial<IndustryKPIs> {
  qualityOfService: {
    onTimeDeliveries: string;
    onTimePickups: string;
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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<IndustryKPIsExtended | null>(null);
  const [topCarriers, setTopCarriers] = useState<CarrierScore[]>([]);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadKPIs();
  }, [router, period]);

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
        </div>
      </div>
    </>
  );
}

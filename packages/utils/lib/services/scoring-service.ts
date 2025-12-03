/**
 * Service API pour le scoring et analytics des transporteurs
 * Calcul de scores, métriques de performance, classements
 */

import { createApiClient } from '../api-client';
import type {
  CarrierScore,
  PerformanceMetrics,
  CarrierAnalytics,
  CarrierRanking,
  RankingList,
  ScoringFilters,
  CalculateScoreRequest,
  UpdateWeightsRequest,
  PerformanceAlert,
  BenchmarkComparison,
  PerformanceReport,
  GenerateReportRequest,
  ScoringWeights,
  ScoringCriterion,
  ScorePeriod,
} from '@rt/contracts';

// Client API pour le scoring
const scoringApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_SCORING_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1',
  timeout: 30000,
  retries: 3,
});

// Poids par défaut des critères (total = 1.0)
export const DEFAULT_WEIGHTS: ScoringWeights = {
  on_time_delivery: 0.25, // 25%
  communication: 0.15, // 15%
  damage_rate: 0.20, // 20%
  documentation: 0.10, // 10%
  responsiveness: 0.15, // 15%
  pricing: 0.10, // 10%
  compliance: 0.05, // 5%
};

export class ScoringService {
  // ========== SCORES ==========

  /**
   * Obtenir le score d'un transporteur
   */
  static async getCarrierScore(
    carrierId: string,
    period: ScorePeriod = '30d'
  ): Promise<CarrierScore> {
    return await scoringApi.get<CarrierScore>(`/scores/carriers/${carrierId}`, { period });
  }

  /**
   * Obtenir les scores de tous les transporteurs
   */
  static async getAllCarrierScores(filters?: ScoringFilters): Promise<CarrierScore[]> {
    return await scoringApi.get<CarrierScore[]>('/scores/carriers', filters);
  }

  /**
   * Calculer/recalculer le score d'un transporteur
   */
  static async calculateScore(request: CalculateScoreRequest): Promise<CarrierScore> {
    return await scoringApi.post<CarrierScore>('/scores/calculate', request);
  }

  /**
   * Mettre à jour les poids des critères
   */
  static async updateWeights(request: UpdateWeightsRequest): Promise<ScoringWeights> {
    return await scoringApi.put<ScoringWeights>('/scores/weights', request);
  }

  /**
   * Obtenir les poids actuels
   */
  static async getWeights(carrierId?: string): Promise<ScoringWeights> {
    return await scoringApi.get<ScoringWeights>('/scores/weights', { carrierId });
  }

  // ========== MÉTRIQUES ==========

  /**
   * Obtenir les métriques de performance d'un transporteur
   */
  static async getPerformanceMetrics(
    carrierId: string,
    period: ScorePeriod = '30d'
  ): Promise<PerformanceMetrics> {
    return await scoringApi.get<PerformanceMetrics>(`/metrics/carriers/${carrierId}`, {
      period,
    });
  }

  /**
   * Comparer les métriques de plusieurs transporteurs
   */
  static async compareCarriers(carrierIds: string[], period: ScorePeriod = '30d'): Promise<{
    carriers: Array<{ carrierId: string; metrics: PerformanceMetrics }>;
    period: ScorePeriod;
  }> {
    return await scoringApi.post('/metrics/compare', { carrierIds, period });
  }

  // ========== ANALYTICS ==========

  /**
   * Obtenir les analytics complètes d'un transporteur
   */
  static async getCarrierAnalytics(
    carrierId: string,
    period: ScorePeriod = '30d'
  ): Promise<CarrierAnalytics> {
    return await scoringApi.get<CarrierAnalytics>(`/analytics/carriers/${carrierId}`, {
      period,
    });
  }

  /**
   * Obtenir l'évolution temporelle d'un transporteur
   */
  static async getTimeline(
    carrierId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<CarrierAnalytics['timeline']> {
    return await scoringApi.get(`/analytics/carriers/${carrierId}/timeline`, {
      dateFrom,
      dateTo,
    });
  }

  // ========== CLASSEMENTS ==========

  /**
   * Obtenir le classement des transporteurs
   */
  static async getRanking(
    period: ScorePeriod = '30d',
    limit: number = 50
  ): Promise<RankingList> {
    return await scoringApi.get<RankingList>('/rankings', { period, limit });
  }

  /**
   * Obtenir le classement d'un transporteur spécifique
   */
  static async getCarrierRank(
    carrierId: string,
    period: ScorePeriod = '30d'
  ): Promise<CarrierRanking> {
    return await scoringApi.get<CarrierRanking>(`/rankings/carriers/${carrierId}`, { period });
  }

  // ========== ALERTES ==========

  /**
   * Obtenir les alertes de performance
   */
  static async getPerformanceAlerts(carrierId?: string): Promise<PerformanceAlert[]> {
    return await scoringApi.get<PerformanceAlert[]>('/alerts', { carrierId });
  }

  /**
   * Marquer une alerte comme acquittée
   */
  static async acknowledgeAlert(alertId: string): Promise<PerformanceAlert> {
    return await scoringApi.post<PerformanceAlert>(`/alerts/${alertId}/acknowledge`);
  }

  // ========== BENCHMARKS ==========

  /**
   * Comparer avec les benchmarks de l'industrie
   */
  static async getBenchmarkComparison(carrierId: string): Promise<BenchmarkComparison[]> {
    return await scoringApi.get<BenchmarkComparison[]>(
      `/benchmarks/carriers/${carrierId}/compare`
    );
  }

  // ========== REPORTS ==========

  /**
   * Générer un rapport de performance
   */
  static async generateReport(request: GenerateReportRequest): Promise<PerformanceReport> {
    return await scoringApi.post<PerformanceReport>('/reports/generate', request);
  }

  /**
   * Obtenir un rapport existant
   */
  static async getReport(reportId: string): Promise<PerformanceReport> {
    return await scoringApi.get<PerformanceReport>(`/reports/${reportId}`);
  }

  /**
   * Télécharger un rapport (PDF/Excel)
   */
  static async downloadReport(reportId: string, format: 'pdf' | 'excel' = 'pdf'): Promise<string> {
    const response = await scoringApi.get<{ url: string }>(`/reports/${reportId}/download`, {
      format,
    });
    return response.url;
  }

  // ========== CALCULS LOCAUX ==========

  /**
   * Calculer le score global à partir des scores de critères
   */
  static calculateOverallScore(
    criterionScores: Record<ScoringCriterion, number>,
    weights: ScoringWeights = DEFAULT_WEIGHTS
  ): number {
    let totalScore = 0;

    Object.entries(criterionScores).forEach(([criterion, score]) => {
      const weight = weights[criterion as ScoringCriterion] || 0;
      totalScore += score * weight;
    });

    return Math.round(totalScore * 10) / 10; // Arrondi à 1 décimale
  }

  /**
   * Déterminer la tendance basée sur l'évolution
   */
  static determineTrend(currentValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    const diff = currentValue - previousValue;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  /**
   * Calculer le percentile d'une valeur dans une distribution
   */
  static calculatePercentile(value: number, allValues: number[]): number {
    const sorted = [...allValues].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= value);
    if (index === -1) return 100;
    return Math.round((index / sorted.length) * 100);
  }

  // ========== HELPERS ==========

  /**
   * Obtenir la couleur d'un score
   */
  static getScoreColor(score: number): string {
    if (score >= 90) return '#10b981'; // Vert
    if (score >= 75) return '#84cc16'; // Vert clair
    if (score >= 60) return '#f59e0b'; // Orange
    if (score >= 40) return '#f97316'; // Orange foncé
    return '#ef4444'; // Rouge
  }

  /**
   * Obtenir le label d'un score
   */
  static getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Très bon';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  }

  /**
   * Obtenir l'icône de tendance
   */
  static getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  }

  /**
   * Obtenir la couleur de tendance
   */
  static getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    return trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
  }

  /**
   * Obtenir le label d'un critère
   */
  static getCriterionLabel(criterion: ScoringCriterion): string {
    const labels: Record<ScoringCriterion, string> = {
      on_time_delivery: 'Ponctualité',
      communication: 'Communication',
      damage_rate: 'Taux d\'avaries',
      documentation: 'Documentation',
      responsiveness: 'Réactivité',
      pricing: 'Prix compétitif',
      compliance: 'Conformité',
    };
    return labels[criterion];
  }

  /**
   * Obtenir l'icône d'un critère
   */
  static getCriterionIcon(criterion: ScoringCriterion): string {
    const icons: Record<ScoringCriterion, string> = {
      on_time_delivery: '⏰',
      communication: '💬',
      damage_rate: '📦',
      documentation: '📄',
      responsiveness: '⚡',
      pricing: '💰',
      compliance: '✅',
    };
    return icons[criterion];
  }

  /**
   * Obtenir la description d'un critère
   */
  static getCriterionDescription(criterion: ScoringCriterion): string {
    const descriptions: Record<ScoringCriterion, string> = {
      on_time_delivery: 'Respect des délais de livraison',
      communication: 'Qualité et rapidité de communication',
      damage_rate: 'Taux d\'incidents et d\'avaries',
      documentation: 'Complétude et qualité des documents',
      responsiveness: 'Temps de réponse et réactivité',
      pricing: 'Compétitivité des prix proposés',
      compliance: 'Respect des normes et réglementations',
    };
    return descriptions[criterion];
  }

  /**
   * Obtenir le label d'une période
   */
  static getPeriodLabel(period: ScorePeriod): string {
    const labels: Record<ScorePeriod, string> = {
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      '90d': '3 derniers mois',
      '1y': '12 derniers mois',
      'all': 'Depuis le début',
    };
    return labels[period];
  }

  /**
   * Formater un nombre avec séparateurs de milliers
   */
  static formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  /**
   * Formater un pourcentage
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)} %`;
  }

  /**
   * Obtenir le badge d'un classement
   */
  static getRankBadge(rank: number): { emoji: string; label: string; color: string } | null {
    if (rank === 1) {
      return { emoji: '🥇', label: 'Or', color: '#fbbf24' };
    }
    if (rank === 2) {
      return { emoji: '🥈', label: 'Argent', color: '#9ca3af' };
    }
    if (rank === 3) {
      return { emoji: '🥉', label: 'Bronze', color: '#d97706' };
    }
    return null;
  }

  /**
   * Obtenir la couleur de sévérité d'une alerte
   */
  static getAlertSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const colors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    };
    return colors[severity];
  }

  /**
   * Obtenir le label de sévérité d'une alerte
   */
  static getAlertSeverityLabel(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const labels = {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      critical: 'Critique',
    };
    return labels[severity];
  }
}

export default ScoringService;

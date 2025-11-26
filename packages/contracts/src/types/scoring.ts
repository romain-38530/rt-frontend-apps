/**
 * Types pour le système de scoring et analytics des transporteurs
 */

// ========== SCORING ==========

export type ScoringCriterion =
  | 'on_time_delivery' // Livraison à temps
  | 'communication' // Qualité de communication
  | 'damage_rate' // Taux d'avaries
  | 'documentation' // Qualité documentaire
  | 'responsiveness' // Réactivité
  | 'pricing' // Compétitivité prix
  | 'compliance'; // Conformité réglementaire

export interface CarrierScore {
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;
  overallScore: number; // Score global (0-100)
  rank?: number; // Classement
  scores: Record<ScoringCriterion, CriterionScore>;
  trend: 'up' | 'down' | 'stable'; // Tendance
  trendValue: number; // +/- points vs période précédente
  totalOrders: number; // Nombre de commandes
  lastUpdated: string; // Date dernière maj
  period: ScorePeriod;
}

export interface CriterionScore {
  criterion: ScoringCriterion;
  score: number; // 0-100
  weight: number; // Poids du critère (0-1)
  trend: 'up' | 'down' | 'stable';
  details?: CriterionDetails;
}

export interface CriterionDetails {
  // Pour on_time_delivery
  onTimeCount?: number;
  lateCount?: number;
  averageDelay?: number; // En minutes

  // Pour communication
  responseTimeAvg?: number; // En minutes
  messageCount?: number;

  // Pour damage_rate
  damageCount?: number;
  totalDeliveries?: number;
  damagePercentage?: number;

  // Pour documentation
  completeDocCount?: number;
  incompleteDocCount?: number;

  // Pour responsiveness
  acceptanceRate?: number; // %
  averageResponseTime?: number; // En heures

  // Pour pricing
  averagePrice?: number;
  competitivenessScore?: number;

  // Pour compliance
  certificationsCount?: number;
  violationsCount?: number;

  [key: string]: any;
}

export type ScorePeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface ScoringWeights {
  on_time_delivery: number;
  communication: number;
  damage_rate: number;
  documentation: number;
  responsiveness: number;
  pricing: number;
  compliance: number;
}

// ========== PERFORMANCE METRICS ==========

export interface PerformanceMetrics {
  carrierId: string;
  period: ScorePeriod;
  dateFrom: string;
  dateTo: string;

  // Métriques opérationnelles
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;

  // Métriques de ponctualité
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimePercentage: number;
  averageDelay: number; // En minutes

  // Métriques de qualité
  damageReports: number;
  damageRate: number; // %
  customerSatisfaction: number; // Score moyen (0-5)
  complaintRate: number; // %

  // Métriques de réactivité
  averageAcceptanceTime: number; // Temps pour accepter une commande (en heures)
  averageResponseTime: number; // Temps de réponse aux messages (en minutes)
  acceptanceRate: number; // % de commandes acceptées

  // Métriques documentaires
  documentsCompleted: number;
  documentsMissing: number;
  documentCompletionRate: number; // %

  // Métriques financières
  totalRevenue: number;
  averageOrderValue: number;
  pricingCompetitiveness: number; // Score (0-100)

  // Métriques de conformité
  certificationsValid: number;
  certificationsExpired: number;
  complianceViolations: number;
  insuranceActive: boolean;
}

// ========== ANALYTICS ==========

export interface CarrierAnalytics {
  carrierId: string;
  carrierName: string;
  period: ScorePeriod;
  dateFrom: string;
  dateTo: string;

  // Scores
  scores: CarrierScore;

  // Métriques
  metrics: PerformanceMetrics;

  // Évolution temporelle
  timeline: TimelineDataPoint[];

  // Comparaison
  comparison?: {
    marketAverage: number;
    topPerformer: number;
    rank: number;
    totalCarriers: number;
  };

  // Top/Flop
  strengths: ScoringCriterion[]; // 3 meilleurs critères
  weaknesses: ScoringCriterion[]; // 3 pires critères

  // Recommandations
  recommendations?: string[];
}

export interface TimelineDataPoint {
  date: string;
  overallScore: number;
  onTimeDelivery: number;
  communication: number;
  damageRate: number;
  documentation: number;
  responsiveness: number;
  pricing: number;
  compliance: number;
  ordersCount: number;
}

// ========== RANKING ==========

export interface CarrierRanking {
  rank: number;
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;
  overallScore: number;
  totalOrders: number;
  onTimePercentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  badge?: 'gold' | 'silver' | 'bronze';
}

export interface RankingList {
  period: ScorePeriod;
  dateFrom: string;
  dateTo: string;
  carriers: CarrierRanking[];
  total: number;
  userCarrier?: CarrierRanking; // Carrier de l'utilisateur si applicable
}

// ========== FILTERS & PARAMS ==========

export interface ScoringFilters {
  carrierId?: string;
  period?: ScorePeriod;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'score' | 'onTime' | 'orders' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CalculateScoreRequest {
  carrierId: string;
  period?: ScorePeriod;
  dateFrom?: string;
  dateTo?: string;
  weights?: Partial<ScoringWeights>;
}

export interface UpdateWeightsRequest {
  weights: ScoringWeights;
  applyToAll?: boolean; // Appliquer à tous les transporteurs
}

// ========== ALERTS ==========

export interface PerformanceAlert {
  id: string;
  carrierId: string;
  carrierName: string;
  type: 'score_drop' | 'late_deliveries' | 'damage_increase' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  threshold: number;
  currentValue: number;
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// ========== BENCHMARKS ==========

export interface IndustryBenchmark {
  metric: string;
  average: number;
  median: number;
  topQuartile: number; // 25% meilleurs
  bottomQuartile: number; // 25% pires
  unit: string;
  lastUpdated: string;
}

export interface BenchmarkComparison {
  carrierId: string;
  metric: string;
  carrierValue: number;
  benchmark: IndustryBenchmark;
  percentile: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'poor';
}

// ========== REPORTS ==========

export interface PerformanceReport {
  id: string;
  carrierId: string;
  carrierName: string;
  period: ScorePeriod;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  generatedBy: string;

  summary: {
    overallScore: number;
    rank: number;
    totalCarriers: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
  };

  scores: CarrierScore;
  metrics: PerformanceMetrics;
  analytics: CarrierAnalytics;

  insights: {
    strengths: Array<{ criterion: ScoringCriterion; score: number; description: string }>;
    weaknesses: Array<{ criterion: ScoringCriterion; score: number; description: string }>;
    recommendations: string[];
  };

  attachments?: {
    charts: string[]; // URLs des graphiques
    exportUrl?: string; // URL export PDF/Excel
  };
}

export interface GenerateReportRequest {
  carrierId: string;
  period: ScorePeriod;
  dateFrom?: string;
  dateTo?: string;
  includeCharts?: boolean;
  format?: 'pdf' | 'excel' | 'json';
  recipients?: string[]; // Emails pour envoi automatique
}

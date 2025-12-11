/**
 * Modèle AIReport - Rapports d'analyse IA mensuelle SYMPHONI.A
 * Stocke les analyses et recommandations générées par IA
 */
import mongoose, { Document, Schema } from 'mongoose';

export type ReportType = 'industrial_carriers' | 'carrier_industrials' | 'logistician_performance' | 'global_overview';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

// Recommandation générée par IA
export interface IRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
  targetKPI?: string;
  potentialGain?: string;
}

// Tendance identifiée
export interface ITrend {
  direction: 'up' | 'down' | 'stable';
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  interpretation: string;
}

// Alerte IA
export interface IAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedEntity?: string;
  suggestedAction: string;
}

// Analyse d'un transporteur (pour rapport industriel)
export interface ICarrierAnalysis {
  carrierId: string;
  carrierName: string;
  globalScore: number;
  scoreEvolution: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: IRecommendation[];
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}

// Analyse d'un industriel (pour rapport transporteur)
export interface IIndustrialAnalysis {
  industrialId: string;
  industrialName: string;
  revenueShare: number;
  profitabilityScore: number;
  workingConditionsScore: number;
  paymentReliabilityScore: number;
  strengths: string[];
  concerns: string[];
  recommendations: IRecommendation[];
  relationshipHealth: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
}

// Analyse logisticien
export interface ILogisticianAnalysis {
  userId: string;
  userName: string;
  productivityScore: number;
  qualityScore: number;
  efficiencyScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: IRecommendation[];
  overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  summary: string;
}

export interface IAIReport extends Document {
  reportId: string;
  reportType: ReportType;
  status: ReportStatus;

  // Période analysée
  period: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };

  // Entité concernée
  targetEntity: {
    type: 'industrial' | 'carrier' | 'logistician' | 'global';
    id: string;
    name: string;
  };

  // Résumé exécutif généré par IA
  executiveSummary: {
    title: string;
    overview: string;
    keyFindings: string[];
    mainRecommendation: string;
    outlook: string;
  };

  // KPIs analysés
  kpiSnapshot: {
    totalOrders: number;
    completedOrders: number;
    serviceRate: number;
    averageScore: number;
    totalRevenue: number;
    incidentRate: number;
    onTimeDeliveryRate: number;
    additionalMetrics: Record<string, number>;
  };

  // Tendances identifiées
  trends: ITrend[];

  // Alertes
  alerts: IAlert[];

  // Analyses détaillées (selon le type de rapport)
  carrierAnalyses?: ICarrierAnalysis[];
  industrialAnalyses?: IIndustrialAnalysis[];
  logisticianAnalysis?: ILogisticianAnalysis;

  // Recommandations globales
  globalRecommendations: IRecommendation[];

  // Plan d'action suggéré
  actionPlan: {
    shortTerm: string[];  // Cette semaine
    mediumTerm: string[]; // Ce mois
    longTerm: string[];   // Ce trimestre
  };

  // Objectifs suggérés pour le mois suivant
  nextMonthTargets: {
    metric: string;
    currentValue: number;
    targetValue: number;
    rationale: string;
  }[];

  // Métadonnées IA
  aiMetadata: {
    model: string;
    generatedAt: Date;
    processingTimeMs: number;
    tokensUsed?: number;
    confidence: number;
  };

  // Feedback utilisateur
  userFeedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    helpful: boolean;
    comment?: string;
    submittedAt: Date;
  };

  // Notification
  notificationSent: boolean;
  notificationSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>({
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  expectedImpact: String,
  actionItems: [String],
  targetKPI: String,
  potentialGain: String
}, { _id: false });

const TrendSchema = new Schema<ITrend>({
  direction: { type: String, enum: ['up', 'down', 'stable'], required: true },
  metric: { type: String, required: true },
  currentValue: { type: Number, required: true },
  previousValue: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  interpretation: String
}, { _id: false });

const AlertSchema = new Schema<IAlert>({
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  affectedEntity: String,
  suggestedAction: String
}, { _id: false });

const CarrierAnalysisSchema = new Schema<ICarrierAnalysis>({
  carrierId: { type: String, required: true },
  carrierName: { type: String, required: true },
  globalScore: Number,
  scoreEvolution: Number,
  strengths: [String],
  weaknesses: [String],
  recommendations: [RecommendationSchema],
  riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
  summary: String
}, { _id: false });

const IndustrialAnalysisSchema = new Schema<IIndustrialAnalysis>({
  industrialId: { type: String, required: true },
  industrialName: { type: String, required: true },
  revenueShare: Number,
  profitabilityScore: Number,
  workingConditionsScore: Number,
  paymentReliabilityScore: Number,
  strengths: [String],
  concerns: [String],
  recommendations: [RecommendationSchema],
  relationshipHealth: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  summary: String
}, { _id: false });

const LogisticianAnalysisSchema = new Schema<ILogisticianAnalysis>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  productivityScore: Number,
  qualityScore: Number,
  efficiencyScore: Number,
  strengths: [String],
  areasForImprovement: [String],
  recommendations: [RecommendationSchema],
  overallRating: { type: String, enum: ['excellent', 'good', 'satisfactory', 'needs_improvement'] },
  summary: String
}, { _id: false });

const AIReportSchema = new Schema<IAIReport>({
  reportId: { type: String, required: true, unique: true, index: true },
  reportType: {
    type: String,
    enum: ['industrial_carriers', 'carrier_industrials', 'logistician_performance', 'global_overview'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },

  period: {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  targetEntity: {
    type: { type: String, enum: ['industrial', 'carrier', 'logistician', 'global'], required: true },
    id: { type: String, required: true },
    name: { type: String, required: true }
  },

  executiveSummary: {
    title: String,
    overview: String,
    keyFindings: [String],
    mainRecommendation: String,
    outlook: String
  },

  kpiSnapshot: {
    totalOrders: Number,
    completedOrders: Number,
    serviceRate: Number,
    averageScore: Number,
    totalRevenue: Number,
    incidentRate: Number,
    onTimeDeliveryRate: Number,
    additionalMetrics: { type: Schema.Types.Mixed }
  },

  trends: [TrendSchema],
  alerts: [AlertSchema],

  carrierAnalyses: [CarrierAnalysisSchema],
  industrialAnalyses: [IndustrialAnalysisSchema],
  logisticianAnalysis: LogisticianAnalysisSchema,

  globalRecommendations: [RecommendationSchema],

  actionPlan: {
    shortTerm: [String],
    mediumTerm: [String],
    longTerm: [String]
  },

  nextMonthTargets: [{
    metric: String,
    currentValue: Number,
    targetValue: Number,
    rationale: String
  }],

  aiMetadata: {
    model: { type: String, default: 'claude-3-haiku' },
    generatedAt: Date,
    processingTimeMs: Number,
    tokensUsed: Number,
    confidence: { type: Number, default: 0.85 }
  },

  userFeedback: {
    rating: { type: Number, enum: [1, 2, 3, 4, 5] },
    helpful: Boolean,
    comment: String,
    submittedAt: Date
  },

  notificationSent: { type: Boolean, default: false },
  notificationSentAt: Date
}, { timestamps: true });

// Indexes
AIReportSchema.index({ 'targetEntity.type': 1, 'targetEntity.id': 1 });
AIReportSchema.index({ 'period.year': 1, 'period.month': 1 });
AIReportSchema.index({ reportType: 1, status: 1 });

export default mongoose.model<IAIReport>('AIReport', AIReportSchema);

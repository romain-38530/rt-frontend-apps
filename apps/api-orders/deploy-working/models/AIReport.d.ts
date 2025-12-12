/**
 * Modèle AIReport - Rapports d'analyse IA mensuelle SYMPHONI.A
 * Stocke les analyses et recommandations générées par IA
 */
import mongoose, { Document } from 'mongoose';
export type ReportType = 'industrial_carriers' | 'carrier_industrials' | 'logistician_performance' | 'global_overview';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
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
export interface ITrend {
    direction: 'up' | 'down' | 'stable';
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: number;
    interpretation: string;
}
export interface IAlert {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    affectedEntity?: string;
    suggestedAction: string;
}
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
    period: {
        month: number;
        year: number;
        startDate: Date;
        endDate: Date;
    };
    targetEntity: {
        type: 'industrial' | 'carrier' | 'logistician' | 'global';
        id: string;
        name: string;
    };
    executiveSummary: {
        title: string;
        overview: string;
        keyFindings: string[];
        mainRecommendation: string;
        outlook: string;
    };
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
    trends: ITrend[];
    alerts: IAlert[];
    carrierAnalyses?: ICarrierAnalysis[];
    industrialAnalyses?: IIndustrialAnalysis[];
    logisticianAnalysis?: ILogisticianAnalysis;
    globalRecommendations: IRecommendation[];
    actionPlan: {
        shortTerm: string[];
        mediumTerm: string[];
        longTerm: string[];
    };
    nextMonthTargets: {
        metric: string;
        currentValue: number;
        targetValue: number;
        rationale: string;
    }[];
    aiMetadata: {
        model: string;
        generatedAt: Date;
        processingTimeMs: number;
        tokensUsed?: number;
        confidence: number;
    };
    userFeedback?: {
        rating: 1 | 2 | 3 | 4 | 5;
        helpful: boolean;
        comment?: string;
        submittedAt: Date;
    };
    notificationSent: boolean;
    notificationSentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAIReport, {}, {}, {}, mongoose.Document<unknown, {}, IAIReport, {}, {}> & IAIReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AIReport.d.ts.map
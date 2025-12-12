"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Modèle AIReport - Rapports d'analyse IA mensuelle SYMPHONI.A
 * Stocke les analyses et recommandations générées par IA
 */
const mongoose_1 = __importStar(require("mongoose"));
const RecommendationSchema = new mongoose_1.Schema({
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    expectedImpact: String,
    actionItems: [String],
    targetKPI: String,
    potentialGain: String
}, { _id: false });
const TrendSchema = new mongoose_1.Schema({
    direction: { type: String, enum: ['up', 'down', 'stable'], required: true },
    metric: { type: String, required: true },
    currentValue: { type: Number, required: true },
    previousValue: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    interpretation: String
}, { _id: false });
const AlertSchema = new mongoose_1.Schema({
    severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    affectedEntity: String,
    suggestedAction: String
}, { _id: false });
const CarrierAnalysisSchema = new mongoose_1.Schema({
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
const IndustrialAnalysisSchema = new mongoose_1.Schema({
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
const LogisticianAnalysisSchema = new mongoose_1.Schema({
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
const AIReportSchema = new mongoose_1.Schema({
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
        additionalMetrics: { type: mongoose_1.Schema.Types.Mixed }
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
exports.default = mongoose_1.default.model('AIReport', AIReportSchema);
//# sourceMappingURL=AIReport.js.map
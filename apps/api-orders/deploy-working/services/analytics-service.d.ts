export interface CarrierKPIs {
    carrierId: string;
    carrierName: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    operational: {
        totalOrdersProposed: number;
        totalOrdersAccepted: number;
        totalOrdersRefused: number;
        totalOrdersTimeout: number;
        acceptanceRate: number;
        refusalRate: number;
        timeoutRate: number;
        averageResponseTimeMinutes: number;
    };
    punctuality: {
        onTimePickupRate: number;
        onTimeDeliveryRate: number;
        averagePickupDelayMinutes: number;
        averageDeliveryDelayMinutes: number;
        latePickupCount: number;
        lateDeliveryCount: number;
    };
    waitingTimes: {
        averageLoadingWaitMinutes: number;
        averageUnloadingWaitMinutes: number;
        totalWaitingHours: number;
        waitingCostEstimate: number;
        ordersWithExcessiveWait: number;
    };
    documentation: {
        documentsCount: number;
        averageDocSubmissionDelayHours: number;
    };
    incidents: {
        totalIncidents: number;
        incidentRate: number;
        incidentsByType: Record<string, number>;
        openIncidents: number;
    };
    financial: {
        totalRevenue: number;
        averageOrderValue: number;
        ordersCount: number;
    };
    globalScore: number;
    trend: 'up' | 'down' | 'stable';
    ranking?: number;
}
export interface IndustrialKPIs {
    industrialId: string;
    industrialName: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    activity: {
        totalOrders: number;
        totalRevenue: number;
        revenueShare: number;
        ordersTrend: number;
        averageOrdersPerWeek: number;
    };
    profitability: {
        averagePricePerOrder: number;
        priceEvolution: number;
    };
    workingConditions: {
        averageWaitingTimeMinutes: number;
        excessiveWaitRate: number;
    };
    payments: {
        averagePaymentDelayDays: number;
        onTimePaymentRate: number;
        outstandingAmount: number;
    };
    relationship: {
        partnershipDurationMonths: number;
        orderFrequency: 'regular' | 'occasional' | 'sporadic';
        loyaltyScore: number;
    };
}
export interface LogisticianKPIs {
    userId: string;
    userName: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    productivity: {
        ordersCreated: number;
        ordersManaged: number;
        pendingOrders: number;
    };
    assignments: {
        firstAttemptSuccessRate: number;
        averageAttemptsToAssign: number;
        escalationToAffretiaRate: number;
    };
    monitoring: {
        activeOrdersCount: number;
        deliveredCount: number;
    };
    performance: {
        serviceRate: number;
        globalScore: number;
    };
}
export interface DashboardSummary {
    period: {
        startDate: Date;
        endDate: Date;
    };
    overview: {
        totalOrders: number;
        completedOrders: number;
        inProgressOrders: number;
        cancelledOrders: number;
        serviceRate: number;
    };
    topCarriers: Array<{
        carrierId: string;
        carrierName: string;
        score: number;
        ordersCount: number;
    }>;
    alerts: {
        pendingAssignments: number;
        openIncidents: number;
    };
    trends: {
        ordersVsLastPeriod: number;
        serviceRateVsLastPeriod: number;
    };
}
export declare class AnalyticsService {
    /**
     * Calcule les KPIs d'un transporteur pour un industriel
     */
    static getCarrierKPIs(carrierId: string, industrialId: string, startDate: Date, endDate: Date): Promise<CarrierKPIs>;
    /**
     * Calcule les KPIs d'un industriel pour un transporteur
     */
    static getIndustrialKPIs(industrialId: string, carrierId: string, startDate: Date, endDate: Date): Promise<IndustrialKPIs>;
    /**
     * Calcule les KPIs d'un logisticien
     */
    static getLogisticianKPIs(userId: string, startDate: Date, endDate: Date): Promise<LogisticianKPIs>;
    /**
     * Dashboard resume pour un industriel
     */
    static getIndustrialDashboard(industrialId: string, startDate: Date, endDate: Date): Promise<DashboardSummary>;
    /**
     * Liste des transporteurs avec leurs KPIs pour un industriel
     */
    static getCarriersRanking(industrialId: string, startDate: Date, endDate: Date): Promise<Array<CarrierKPIs & {
        ranking: number;
    }>>;
    /**
     * Liste des industriels avec leurs KPIs pour un transporteur
     */
    static getIndustrialsRanking(carrierId: string, startDate: Date, endDate: Date): Promise<IndustrialKPIs[]>;
}
export default AnalyticsService;
//# sourceMappingURL=analytics-service.d.ts.map
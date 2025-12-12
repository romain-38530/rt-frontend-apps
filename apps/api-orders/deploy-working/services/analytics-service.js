"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
/**
 * Service Analytics - KPIs SYMPHONI.A
 * Calcul des indicateurs de performance pour industriels, transporteurs et logisticiens
 */
const Order_1 = __importDefault(require("../models/Order"));
const OrderEvent_1 = __importDefault(require("../models/OrderEvent"));
const CarrierScore_1 = require("../models/CarrierScore");
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
// ============================================
// SERVICE
// ============================================
class AnalyticsService {
    /**
     * Calcule les KPIs d'un transporteur pour un industriel
     */
    static async getCarrierKPIs(carrierId, industrialId, startDate, endDate) {
        // Recuperer les commandes du transporteur pour cet industriel
        const orders = await Order_1.default.find({
            carrierId,
            industrialId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        // Recuperer les chaines de dispatch
        const dispatchChains = await DispatchChain_1.default.find({
            industrialId,
            'attempts.carrierId': carrierId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        // Recuperer les evenements
        const orderIds = orders.map(o => o.orderId);
        const events = await OrderEvent_1.default.find({
            orderId: { $in: orderIds },
            timestamp: { $gte: startDate, $lte: endDate }
        }).lean();
        // Recuperer le score global
        const carrierScore = await CarrierScore_1.CarrierGlobalScore.findOne({ carrierId }).lean();
        // Calculer les metriques operationnelles
        let totalProposed = 0;
        let totalAccepted = 0;
        let totalRefused = 0;
        let totalTimeout = 0;
        const responseTimes = [];
        for (const chain of dispatchChains) {
            for (const attempt of chain.attempts) {
                if (attempt.carrierId === carrierId) {
                    totalProposed++;
                    if (attempt.status === 'accepted') {
                        totalAccepted++;
                        if (attempt.respondedAt && attempt.sentAt) {
                            responseTimes.push((new Date(attempt.respondedAt).getTime() - new Date(attempt.sentAt).getTime()) / 60000);
                        }
                    }
                    else if (attempt.status === 'refused') {
                        totalRefused++;
                    }
                    else if (attempt.status === 'timeout') {
                        totalTimeout++;
                    }
                }
            }
        }
        // Calculer ponctualite
        let onTimePickup = 0;
        let onTimeDelivery = 0;
        const pickupDelays = [];
        const deliveryDelays = [];
        for (const order of orders) {
            if (order.status === 'delivered' || order.status === 'closed' || order.status === 'completed') {
                // Verifier ponctualite enlevement
                if (order.dates?.actualPickupDate && order.dates?.pickupDate) {
                    const scheduledPickup = new Date(order.dates.pickupDate);
                    const actualPickup = new Date(order.dates.actualPickupDate);
                    const delayMinutes = (actualPickup.getTime() - scheduledPickup.getTime()) / 60000;
                    if (delayMinutes <= 15)
                        onTimePickup++;
                    else if (delayMinutes > 0)
                        pickupDelays.push(delayMinutes);
                }
                else {
                    // Si pas de date reelle, considerer comme a l'heure
                    onTimePickup++;
                }
                // Verifier ponctualite livraison
                if (order.dates?.actualDeliveryDate && order.dates?.deliveryDate) {
                    const scheduledDelivery = new Date(order.dates.deliveryDate);
                    const actualDelivery = new Date(order.dates.actualDeliveryDate);
                    const delayMinutes = (actualDelivery.getTime() - scheduledDelivery.getTime()) / 60000;
                    if (delayMinutes <= 30)
                        onTimeDelivery++;
                    else if (delayMinutes > 0)
                        deliveryDelays.push(delayMinutes);
                }
                else {
                    onTimeDelivery++;
                }
            }
        }
        // Calculer incidents
        const incidentEvents = events.filter(e => e.eventType === 'incident_reported');
        const resolvedEvents = events.filter(e => e.eventType === 'incident_resolved');
        const incidentsByType = {};
        for (const event of incidentEvents) {
            const type = event.data?.incidentType || 'other';
            incidentsByType[type] = (incidentsByType[type] || 0) + 1;
        }
        // Calculer financier
        const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'closed' || o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice || 0), 0);
        const deliveredCount = completedOrders.length;
        const carrierName = orders[0]?.carrierName || 'Transporteur';
        return {
            carrierId,
            carrierName,
            period: { startDate, endDate },
            operational: {
                totalOrdersProposed: totalProposed || orders.length,
                totalOrdersAccepted: totalAccepted || orders.length,
                totalOrdersRefused: totalRefused,
                totalOrdersTimeout: totalTimeout,
                acceptanceRate: totalProposed > 0 ? (totalAccepted / totalProposed) * 100 : 100,
                refusalRate: totalProposed > 0 ? (totalRefused / totalProposed) * 100 : 0,
                timeoutRate: totalProposed > 0 ? (totalTimeout / totalProposed) * 100 : 0,
                averageResponseTimeMinutes: responseTimes.length > 0
                    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                    : 30
            },
            punctuality: {
                onTimePickupRate: deliveredCount > 0 ? (onTimePickup / deliveredCount) * 100 : 100,
                onTimeDeliveryRate: deliveredCount > 0 ? (onTimeDelivery / deliveredCount) * 100 : 100,
                averagePickupDelayMinutes: pickupDelays.length > 0
                    ? pickupDelays.reduce((a, b) => a + b, 0) / pickupDelays.length
                    : 0,
                averageDeliveryDelayMinutes: deliveryDelays.length > 0
                    ? deliveryDelays.reduce((a, b) => a + b, 0) / deliveryDelays.length
                    : 0,
                latePickupCount: pickupDelays.length,
                lateDeliveryCount: deliveryDelays.length
            },
            waitingTimes: {
                averageLoadingWaitMinutes: 45, // Valeur par defaut - a calculer via tracking
                averageUnloadingWaitMinutes: 30,
                totalWaitingHours: (45 + 30) * deliveredCount / 60,
                waitingCostEstimate: 0,
                ordersWithExcessiveWait: 0
            },
            documentation: {
                documentsCount: orders.reduce((sum, o) => sum + (o.documentIds?.length || 0), 0),
                averageDocSubmissionDelayHours: 24
            },
            incidents: {
                totalIncidents: incidentEvents.length,
                incidentRate: deliveredCount > 0 ? (incidentEvents.length / deliveredCount) * 100 : 0,
                incidentsByType,
                openIncidents: Math.max(0, incidentEvents.length - resolvedEvents.length)
            },
            financial: {
                totalRevenue,
                averageOrderValue: deliveredCount > 0 ? totalRevenue / deliveredCount : 0,
                ordersCount: deliveredCount
            },
            globalScore: carrierScore?.globalScore || 75,
            trend: 'stable',
            ranking: undefined
        };
    }
    /**
     * Calcule les KPIs d'un industriel pour un transporteur
     */
    static async getIndustrialKPIs(industrialId, carrierId, startDate, endDate) {
        const orders = await Order_1.default.find({
            industrialId,
            carrierId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        // Calculer volume total du transporteur pour la periode
        const allCarrierOrders = await Order_1.default.find({
            carrierId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        const totalRevenue = orders.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice || 0), 0);
        const allRevenue = allCarrierOrders.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice || 0), 0);
        // Determiner frequence
        const weekCount = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
        const ordersPerWeek = orders.length / weekCount;
        let frequency = 'sporadic';
        if (ordersPerWeek >= 3)
            frequency = 'regular';
        else if (ordersPerWeek >= 1)
            frequency = 'occasional';
        // Trouver le nom de l'industriel - utiliser le premier site de chargement
        const industrialName = orders[0]?.pickupAddress?.contactName || `Industriel ${industrialId.slice(-6)}`;
        return {
            industrialId,
            industrialName,
            period: { startDate, endDate },
            activity: {
                totalOrders: orders.length,
                totalRevenue,
                revenueShare: allRevenue > 0 ? (totalRevenue / allRevenue) * 100 : 0,
                ordersTrend: 0,
                averageOrdersPerWeek: ordersPerWeek
            },
            profitability: {
                averagePricePerOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
                priceEvolution: 0
            },
            workingConditions: {
                averageWaitingTimeMinutes: 45,
                excessiveWaitRate: 10
            },
            payments: {
                averagePaymentDelayDays: 30,
                onTimePaymentRate: 85,
                outstandingAmount: 0
            },
            relationship: {
                partnershipDurationMonths: 12,
                orderFrequency: frequency,
                loyaltyScore: 75
            }
        };
    }
    /**
     * Calcule les KPIs d'un logisticien
     */
    static async getLogisticianKPIs(userId, startDate, endDate) {
        // Commandes creees par ce logisticien
        const createdOrders = await Order_1.default.countDocuments({
            createdBy: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });
        // Dispatch chains
        const dispatchChains = await DispatchChain_1.default.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        // Calculer taux succes premier envoi
        let firstAttemptSuccess = 0;
        let totalChains = 0;
        const attemptCounts = [];
        for (const chain of dispatchChains) {
            if (chain.status === 'completed') {
                totalChains++;
                const acceptedIndex = chain.attempts.findIndex(a => a.status === 'accepted');
                if (acceptedIndex === 0)
                    firstAttemptSuccess++;
                if (acceptedIndex >= 0)
                    attemptCounts.push(acceptedIndex + 1);
            }
        }
        const completedOrders = await Order_1.default.countDocuments({
            status: { $in: ['delivered', 'closed', 'completed'] },
            createdAt: { $gte: startDate, $lte: endDate }
        });
        const totalOrders = await Order_1.default.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });
        const activeOrders = await Order_1.default.countDocuments({
            status: { $in: ['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery', 'carrier_accepted'] }
        });
        const pendingOrders = await Order_1.default.countDocuments({
            status: { $in: ['draft', 'created', 'sent_to_carrier'] }
        });
        const escalatedChains = dispatchChains.filter(c => c.status === 'escalated').length;
        return {
            userId,
            userName: 'Logisticien',
            period: { startDate, endDate },
            productivity: {
                ordersCreated: createdOrders,
                ordersManaged: totalOrders,
                pendingOrders
            },
            assignments: {
                firstAttemptSuccessRate: totalChains > 0 ? (firstAttemptSuccess / totalChains) * 100 : 100,
                averageAttemptsToAssign: attemptCounts.length > 0
                    ? attemptCounts.reduce((a, b) => a + b, 0) / attemptCounts.length
                    : 1,
                escalationToAffretiaRate: totalChains > 0 ? (escalatedChains / totalChains) * 100 : 0
            },
            monitoring: {
                activeOrdersCount: activeOrders,
                deliveredCount: completedOrders
            },
            performance: {
                serviceRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100,
                globalScore: 82
            }
        };
    }
    /**
     * Dashboard resume pour un industriel
     */
    static async getIndustrialDashboard(industrialId, startDate, endDate) {
        const orders = await Order_1.default.find({
            industrialId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'closed' || o.status === 'completed');
        const inProgressOrders = orders.filter(o => ['in_transit', 'arrived_pickup', 'loaded', 'arrived_delivery', 'carrier_accepted'].includes(o.status));
        const cancelledOrders = orders.filter(o => o.status === 'cancelled');
        // Aggreger par transporteur
        const carrierStats = {};
        for (const order of orders) {
            if (order.carrierId) {
                if (!carrierStats[order.carrierId]) {
                    carrierStats[order.carrierId] = { orders: 0, score: 75, name: order.carrierName || 'Transporteur' };
                }
                carrierStats[order.carrierId].orders++;
            }
        }
        // Recuperer scores
        const carrierIds = Object.keys(carrierStats);
        if (carrierIds.length > 0) {
            const scores = await CarrierScore_1.CarrierGlobalScore.find({ carrierId: { $in: carrierIds } }).lean();
            for (const score of scores) {
                if (carrierStats[score.carrierId]) {
                    carrierStats[score.carrierId].score = score.globalScore;
                }
            }
        }
        // Top performers
        const sortedCarriers = Object.entries(carrierStats)
            .map(([id, data]) => ({ carrierId: id, ...data }))
            .sort((a, b) => b.score - a.score);
        // Compter assignments en attente
        const pendingAssignments = orders.filter(o => o.status === 'created' || o.status === 'sent_to_carrier').length;
        return {
            period: { startDate, endDate },
            overview: {
                totalOrders: orders.length,
                completedOrders: completedOrders.length,
                inProgressOrders: inProgressOrders.length,
                cancelledOrders: cancelledOrders.length,
                serviceRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 100
            },
            topCarriers: sortedCarriers.slice(0, 5).map(c => ({
                carrierId: c.carrierId,
                carrierName: c.name,
                score: c.score,
                ordersCount: c.orders
            })),
            alerts: {
                pendingAssignments,
                openIncidents: 0
            },
            trends: {
                ordersVsLastPeriod: 5,
                serviceRateVsLastPeriod: 2
            }
        };
    }
    /**
     * Liste des transporteurs avec leurs KPIs pour un industriel
     */
    static async getCarriersRanking(industrialId, startDate, endDate) {
        // Recuperer tous les transporteurs de cet industriel
        const orders = await Order_1.default.find({
            industrialId,
            carrierId: { $exists: true, $ne: null },
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        const carrierIds = [...new Set(orders.map(o => o.carrierId).filter(Boolean))];
        // Calculer KPIs pour chaque transporteur
        const kpisList = [];
        for (const carrierId of carrierIds) {
            const kpis = await this.getCarrierKPIs(carrierId, industrialId, startDate, endDate);
            kpisList.push(kpis);
        }
        // Trier par score global et ajouter ranking
        return kpisList
            .sort((a, b) => b.globalScore - a.globalScore)
            .map((kpi, index) => ({ ...kpi, ranking: index + 1 }));
    }
    /**
     * Liste des industriels avec leurs KPIs pour un transporteur
     */
    static async getIndustrialsRanking(carrierId, startDate, endDate) {
        const orders = await Order_1.default.find({
            carrierId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
        const industrialIds = [...new Set(orders.map(o => o.industrialId))];
        const kpisList = [];
        for (const industrialId of industrialIds) {
            const kpis = await this.getIndustrialKPIs(industrialId, carrierId, startDate, endDate);
            kpisList.push(kpis);
        }
        // Trier par CA
        return kpisList.sort((a, b) => b.activity.totalRevenue - a.activity.totalRevenue);
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = AnalyticsService;
//# sourceMappingURL=analytics-service.js.map
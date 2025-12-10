"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Dispatch - Gestion de la chaîne d'affectation SYMPHONI.A
 */
const express_1 = require("express");
const dispatch_service_1 = __importDefault(require("../services/dispatch-service"));
const event_service_1 = __importDefault(require("../services/event-service"));
const affretia_service_1 = __importDefault(require("../services/affretia-service"));
const DispatchChain_1 = __importDefault(require("../models/DispatchChain"));
const router = (0, express_1.Router)();
/**
 * POST /api/v1/dispatch/detect-lane/:orderId
 * Détecte la lane correspondant à une commande
 */
router.post('/detect-lane/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const lane = await dispatch_service_1.default.detectLane(orderId);
        if (!lane) {
            return res.status(200).json({
                success: true,
                message: 'Aucune lane trouvée - commande escaladée vers Affret.IA',
                lane: null,
                escalated: true
            });
        }
        res.json({
            success: true,
            lane: {
                laneId: lane.laneId,
                name: lane.name,
                carriersCount: lane.carriers.length
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/generate-chain/:orderId
 * Génère la chaîne de dispatch à partir de la lane détectée
 */
router.post('/generate-chain/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { laneId } = req.body;
        // Si laneId fourni, utiliser cette lane, sinon détecter automatiquement
        let lane;
        if (laneId) {
            const lanes = await dispatch_service_1.default.getActiveLanes();
            lane = lanes.find(l => l.laneId === laneId);
            if (!lane) {
                return res.status(404).json({ success: false, error: 'Lane non trouvée' });
            }
        }
        else {
            lane = await dispatch_service_1.default.detectLane(orderId);
            if (!lane) {
                return res.status(200).json({
                    success: false,
                    error: 'Aucune lane disponible',
                    escalated: true
                });
            }
        }
        const chain = await dispatch_service_1.default.generateDispatchChain(orderId, lane);
        res.json({
            success: true,
            chain: {
                chainId: chain.chainId,
                laneId: chain.laneId,
                laneName: chain.laneName,
                status: chain.status,
                attempts: chain.attempts.map(a => ({
                    position: a.position,
                    carrierName: a.carrierName,
                    status: a.status
                })),
                config: chain.config
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/start/:chainId
 * Démarre le dispatch (envoie au premier transporteur)
 */
router.post('/start/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const attempt = await dispatch_service_1.default.startDispatch(chainId);
        res.json({
            success: true,
            message: `Commande envoyée au transporteur ${attempt.carrierName}`,
            attempt: {
                position: attempt.position,
                carrierName: attempt.carrierName,
                status: attempt.status,
                sentAt: attempt.sentAt,
                expiresAt: attempt.expiresAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/respond/:chainId
 * Réponse d'un transporteur (acceptation ou refus)
 */
router.post('/respond/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { carrierId, accepted, proposedPrice, refusalReason } = req.body;
        if (!carrierId || accepted === undefined) {
            return res.status(400).json({
                success: false,
                error: 'carrierId et accepted sont requis'
            });
        }
        let chain;
        if (accepted) {
            chain = await dispatch_service_1.default.handleCarrierAccept(chainId, carrierId, proposedPrice);
            res.json({
                success: true,
                message: 'Transporteur accepté',
                chain: {
                    chainId: chain.chainId,
                    status: chain.status,
                    selectedCarrier: chain.assignedCarrierName
                }
            });
        }
        else {
            chain = await dispatch_service_1.default.handleCarrierRefuse(chainId, carrierId, refusalReason);
            res.json({
                success: true,
                message: 'Refus enregistré, passage au transporteur suivant',
                chain: {
                    chainId: chain.chainId,
                    status: chain.status,
                    currentAttemptIndex: chain.currentAttemptIndex
                }
            });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/timeout/:chainId/:attemptIndex
 * Traite le timeout d'une tentative
 */
router.post('/timeout/:chainId/:attemptIndex', async (req, res) => {
    try {
        const { chainId, attemptIndex } = req.params;
        const chain = await dispatch_service_1.default.handleCarrierTimeout(chainId, parseInt(attemptIndex));
        res.json({
            success: true,
            message: 'Timeout traité, passage au transporteur suivant',
            chain: {
                chainId: chain.chainId,
                status: chain.status,
                currentAttemptIndex: chain.currentAttemptIndex
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/dispatch/status/:orderId
 * Récupère le statut de dispatch d'une commande
 */
router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const chain = await dispatch_service_1.default.getDispatchStatus(orderId);
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Aucune chaîne de dispatch trouvée pour cette commande'
            });
        }
        res.json({
            success: true,
            dispatch: {
                chainId: chain.chainId,
                orderId: chain.orderId,
                orderReference: chain.orderReference,
                laneId: chain.laneId,
                laneName: chain.laneName,
                status: chain.status,
                currentAttemptIndex: chain.currentAttemptIndex,
                attempts: chain.attempts,
                assignedCarrier: chain.assignedCarrierName,
                escalation: chain.escalation,
                startedAt: chain.startedAt,
                completedAt: chain.completedAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/dispatch/events/:orderId
 * Récupère tous les événements d'une commande
 */
router.get('/events/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const events = await event_service_1.default.getOrderEvents(orderId);
        res.json({
            success: true,
            count: events.length,
            events
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/auto/:orderId
 * Dispatch automatique complet (détection lane + génération chaîne + démarrage)
 */
router.post('/auto/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        // 1. Détecter la lane
        const lane = await dispatch_service_1.default.detectLane(orderId);
        if (!lane) {
            return res.json({
                success: true,
                message: 'Aucune lane disponible - commande escaladée vers Affret.IA',
                escalated: true
            });
        }
        // 2. Générer la chaîne
        const chain = await dispatch_service_1.default.generateDispatchChain(orderId, lane);
        // 3. Démarrer le dispatch
        const attempt = await dispatch_service_1.default.startDispatch(chain.chainId);
        res.json({
            success: true,
            message: `Dispatch automatique lancé - commande envoyée à ${attempt.carrierName}`,
            result: {
                lane: {
                    laneId: lane.laneId,
                    name: lane.name
                },
                chain: {
                    chainId: chain.chainId,
                    carriersCount: chain.attempts.length
                },
                currentAttempt: {
                    position: attempt.position,
                    carrierName: attempt.carrierName,
                    expiresAt: attempt.expiresAt
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/affretia-callback
 * Callback d'Affret.IA - transporteur trouvé ou échec
 */
router.post('/affretia-callback', async (req, res) => {
    try {
        const { affretiaOrderId, externalOrderId, status, carrier, reason } = req.body;
        if (!affretiaOrderId || !externalOrderId || !status) {
            return res.status(400).json({
                success: false,
                error: 'affretiaOrderId, externalOrderId et status sont requis'
            });
        }
        await affretia_service_1.default.handleCallback({
            affretiaOrderId,
            externalOrderId,
            status,
            carrier,
            reason
        });
        res.json({
            success: true,
            message: `Callback Affret.IA traité: ${status}`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/dispatch/affretia-status/:orderId
 * Vérifie le statut de l'escalade Affret.IA
 */
router.get('/affretia-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const chain = await DispatchChain_1.default.findOne({ orderId });
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Chaîne de dispatch non trouvée'
            });
        }
        if (!chain.escalation?.affretiaOrderId) {
            return res.status(404).json({
                success: false,
                error: 'Commande non escaladée vers Affret.IA'
            });
        }
        // Interroger Affret.IA pour le statut actuel
        const affretiaStatus = await affretia_service_1.default.checkStatus(chain.escalation.affretiaOrderId);
        res.json({
            success: true,
            escalation: {
                ...chain.escalation,
                currentStatus: affretiaStatus
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/dispatch/cancel-affretia/:orderId
 * Annule une demande Affret.IA
 */
router.post('/cancel-affretia/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const chain = await DispatchChain_1.default.findOne({ orderId });
        if (!chain) {
            return res.status(404).json({
                success: false,
                error: 'Chaîne de dispatch non trouvée'
            });
        }
        if (!chain.escalation?.affretiaOrderId) {
            return res.status(400).json({
                success: false,
                error: 'Commande non escaladée vers Affret.IA'
            });
        }
        const cancelled = await affretia_service_1.default.cancelRequest(chain.escalation.affretiaOrderId, reason || 'Annulation manuelle');
        if (cancelled) {
            chain.status = 'cancelled';
            await chain.save();
        }
        res.json({
            success: cancelled,
            message: cancelled ? 'Demande Affret.IA annulée' : 'Échec de l\'annulation'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/dispatch/stats
 * Statistiques globales du dispatch
 */
router.get('/stats', async (req, res) => {
    try {
        const { industrialId, startDate, endDate } = req.query;
        const matchQuery = {};
        if (industrialId)
            matchQuery.industrialId = industrialId;
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate)
                matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate)
                matchQuery.createdAt.$lte = new Date(endDate);
        }
        // Agrégations pour les statistiques
        const [totalChains, statusCounts, avgResponseTime, escalationStats, carrierPerformance] = await Promise.all([
            // Total des chaînes
            DispatchChain_1.default.countDocuments(matchQuery),
            // Répartition par statut
            DispatchChain_1.default.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Temps de réponse moyen (pour les chaînes complétées)
            DispatchChain_1.default.aggregate([
                { $match: { ...matchQuery, status: 'completed', completedAt: { $exists: true }, startedAt: { $exists: true } } },
                {
                    $project: {
                        responseTime: { $subtract: ['$completedAt', '$startedAt'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: '$responseTime' },
                        minTime: { $min: '$responseTime' },
                        maxTime: { $max: '$responseTime' }
                    }
                }
            ]),
            // Statistiques d'escalade
            DispatchChain_1.default.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalEscalated: {
                            $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] }
                        },
                        affretiaSuccess: {
                            $sum: { $cond: [{ $eq: ['$escalation.status', 'assigned'] }, 1, 0] }
                        }
                    }
                }
            ]),
            // Performance par transporteur (top 10)
            DispatchChain_1.default.aggregate([
                { $match: { ...matchQuery, assignedCarrierId: { $exists: true } } },
                {
                    $group: {
                        _id: { carrierId: '$assignedCarrierId', carrierName: '$assignedCarrierName' },
                        ordersAssigned: { $sum: 1 }
                    }
                },
                { $sort: { ordersAssigned: -1 } },
                { $limit: 10 }
            ])
        ]);
        // Formater les résultats
        const statusMap = statusCounts.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, {});
        const avgTimeData = avgResponseTime[0] || { avgTime: 0, minTime: 0, maxTime: 0 };
        const escalationData = escalationStats[0] || { totalEscalated: 0, affretiaSuccess: 0 };
        res.json({
            success: true,
            stats: {
                total: totalChains,
                byStatus: {
                    pending: statusMap.pending || 0,
                    in_progress: statusMap.in_progress || 0,
                    completed: statusMap.completed || 0,
                    escalated: statusMap.escalated || 0,
                    cancelled: statusMap.cancelled || 0
                },
                responseTime: {
                    average: Math.round(avgTimeData.avgTime / 60000), // En minutes
                    min: Math.round(avgTimeData.minTime / 60000),
                    max: Math.round(avgTimeData.maxTime / 60000)
                },
                escalation: {
                    total: escalationData.totalEscalated,
                    affretiaSuccess: escalationData.affretiaSuccess,
                    successRate: escalationData.totalEscalated > 0
                        ? Math.round((escalationData.affretiaSuccess / escalationData.totalEscalated) * 100)
                        : 0
                },
                topCarriers: carrierPerformance.map((c) => ({
                    carrierId: c._id.carrierId,
                    carrierName: c._id.carrierName,
                    ordersAssigned: c.ordersAssigned
                }))
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/dispatch/dashboard
 * Données pour le tableau de bord temps réel
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { industrialId } = req.query;
        const matchQuery = {};
        if (industrialId)
            matchQuery.industrialId = industrialId;
        // Chaînes actives (en cours)
        const activeChains = await DispatchChain_1.default.find({
            ...matchQuery,
            status: { $in: ['pending', 'in_progress'] }
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        // Chaînes complétées récemment (24h)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        const recentCompleted = await DispatchChain_1.default.find({
            ...matchQuery,
            status: 'completed',
            completedAt: { $gte: oneDayAgo }
        })
            .sort({ completedAt: -1 })
            .limit(10)
            .lean();
        // Escalades en attente
        const pendingEscalations = await DispatchChain_1.default.find({
            ...matchQuery,
            status: 'escalated',
            'escalation.status': { $in: ['pending', 'in_progress'] }
        })
            .sort({ 'escalation.escalatedAt': -1 })
            .lean();
        // Tentatives en timeout imminent (moins de 15 min)
        const soonTimeout = new Date();
        soonTimeout.setMinutes(soonTimeout.getMinutes() + 15);
        const urgentChains = await DispatchChain_1.default.find({
            ...matchQuery,
            status: 'in_progress',
            'attempts.status': 'sent',
            'attempts.expiresAt': { $lte: soonTimeout, $gte: new Date() }
        }).lean();
        res.json({
            success: true,
            dashboard: {
                activeChains: activeChains.map(c => ({
                    chainId: c.chainId,
                    orderReference: c.orderReference,
                    status: c.status,
                    currentCarrier: c.attempts[c.currentAttemptIndex]?.carrierName,
                    expiresAt: c.attempts[c.currentAttemptIndex]?.expiresAt,
                    startedAt: c.startedAt
                })),
                recentCompleted: recentCompleted.map(c => ({
                    chainId: c.chainId,
                    orderReference: c.orderReference,
                    assignedCarrier: c.assignedCarrierName,
                    completedAt: c.completedAt
                })),
                pendingEscalations: pendingEscalations.map(c => ({
                    chainId: c.chainId,
                    orderReference: c.orderReference,
                    escalatedAt: c.escalation?.escalatedAt,
                    affretiaStatus: c.escalation?.status
                })),
                urgentTimeouts: urgentChains.length,
                summary: {
                    active: activeChains.length,
                    completedToday: recentCompleted.length,
                    escalated: pendingEscalations.length
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=dispatch.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Lanes - Gestion des lignes de transport SYMPHONI.A
 */
const express_1 = require("express");
const dispatch_service_1 = __importDefault(require("../services/dispatch-service"));
const Lane_1 = __importDefault(require("../models/Lane"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/lanes
 * Liste toutes les lanes actives
 */
router.get('/', async (req, res) => {
    try {
        const { industrialId, includeInactive } = req.query;
        const query = {};
        if (!includeInactive) {
            query.isActive = true;
        }
        if (industrialId) {
            query.industrialId = industrialId;
        }
        const lanes = await Lane_1.default.find(query).sort({ name: 1 });
        res.json({
            success: true,
            count: lanes.length,
            lanes: lanes.map(l => ({
                laneId: l.laneId,
                name: l.name,
                description: l.description,
                isActive: l.isActive,
                origin: l.origin,
                destination: l.destination,
                merchandiseTypes: l.merchandiseTypes,
                carriersCount: l.carriers.length,
                dispatchConfig: l.dispatchConfig
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/lanes/:laneId
 * Détail d'une lane
 */
router.get('/:laneId', async (req, res) => {
    try {
        const { laneId } = req.params;
        const lane = await Lane_1.default.findOne({ laneId });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        res.json({
            success: true,
            lane
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/lanes
 * Crée une nouvelle lane
 */
router.post('/', async (req, res) => {
    try {
        const laneData = req.body;
        // Validation basique
        if (!laneData.name) {
            return res.status(400).json({ success: false, error: 'Le nom est requis' });
        }
        if (!laneData.industrialId) {
            return res.status(400).json({ success: false, error: 'industrialId est requis' });
        }
        const lane = await dispatch_service_1.default.createLane(laneData);
        res.status(201).json({
            success: true,
            message: 'Lane créée avec succès',
            lane
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * PUT /api/v1/lanes/:laneId
 * Met à jour une lane
 */
router.put('/:laneId', async (req, res) => {
    try {
        const { laneId } = req.params;
        const updates = req.body;
        const lane = await dispatch_service_1.default.updateLane(laneId, updates);
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        res.json({
            success: true,
            message: 'Lane mise à jour',
            lane
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/lanes/:laneId
 * Désactive une lane (soft delete)
 */
router.delete('/:laneId', async (req, res) => {
    try {
        const { laneId } = req.params;
        const lane = await dispatch_service_1.default.updateLane(laneId, { isActive: false });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        res.json({
            success: true,
            message: 'Lane désactivée'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/lanes/:laneId/carriers
 * Ajoute un transporteur à la cascade
 */
router.post('/:laneId/carriers', async (req, res) => {
    try {
        const { laneId } = req.params;
        const { carrierId, carrierName, position, minScore, responseDelayMinutes, contact, // { email, phone, contactName }
        priceGrid, constraints } = req.body;
        if (!carrierId || !carrierName) {
            return res.status(400).json({
                success: false,
                error: 'carrierId et carrierName sont requis'
            });
        }
        const lane = await Lane_1.default.findOne({ laneId });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        // Vérifier si le transporteur existe déjà
        const existingCarrier = lane.carriers.find(c => c.carrierId === carrierId);
        if (existingCarrier) {
            return res.status(400).json({
                success: false,
                error: `Transporteur ${carrierName} déjà présent dans la cascade`
            });
        }
        // Déterminer la position
        const pos = position || lane.carriers.length + 1;
        // Ajouter le transporteur avec contact
        lane.carriers.push({
            position: pos,
            carrierId,
            carrierName,
            contact: contact || undefined,
            priceGrid: priceGrid || undefined,
            constraints: constraints || undefined,
            minScore: minScore || 70,
            responseDelayMinutes: responseDelayMinutes || 120,
            isActive: true
        });
        // Réordonner les positions
        lane.carriers.sort((a, b) => a.position - b.position);
        lane.carriers.forEach((c, i) => c.position = i + 1);
        await lane.save();
        res.json({
            success: true,
            message: `Transporteur ${carrierName} ajouté à la position ${pos}`,
            carriers: lane.carriers
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * PATCH /api/v1/lanes/:laneId/carriers/:carrierId
 * Met à jour les informations d'un transporteur (contact, config)
 */
router.patch('/:laneId/carriers/:carrierId', async (req, res) => {
    try {
        const { laneId, carrierId } = req.params;
        const { contact, // { email, phone, contactName }
        priceGrid, constraints, minScore, responseDelayMinutes, isActive } = req.body;
        const lane = await Lane_1.default.findOne({ laneId });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        const carrier = lane.carriers.find(c => c.carrierId === carrierId);
        if (!carrier) {
            return res.status(404).json({ success: false, error: 'Transporteur non trouvé dans la cascade' });
        }
        // Mise à jour des champs fournis
        if (contact !== undefined) {
            carrier.contact = contact;
        }
        if (priceGrid !== undefined) {
            carrier.priceGrid = priceGrid;
        }
        if (constraints !== undefined) {
            carrier.constraints = constraints;
        }
        if (minScore !== undefined) {
            carrier.minScore = minScore;
        }
        if (responseDelayMinutes !== undefined) {
            carrier.responseDelayMinutes = responseDelayMinutes;
        }
        if (isActive !== undefined) {
            carrier.isActive = isActive;
        }
        await lane.save();
        res.json({
            success: true,
            message: `Transporteur ${carrier.carrierName} mis à jour`,
            carrier
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/lanes/:laneId/carriers/:carrierId
 * Retire un transporteur de la cascade
 */
router.delete('/:laneId/carriers/:carrierId', async (req, res) => {
    try {
        const { laneId, carrierId } = req.params;
        const lane = await Lane_1.default.findOne({ laneId });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        const carrierIndex = lane.carriers.findIndex(c => c.carrierId === carrierId);
        if (carrierIndex === -1) {
            return res.status(404).json({ success: false, error: 'Transporteur non trouvé dans la cascade' });
        }
        const removed = lane.carriers.splice(carrierIndex, 1)[0];
        // Réordonner les positions
        lane.carriers.forEach((c, i) => c.position = i + 1);
        await lane.save();
        res.json({
            success: true,
            message: `Transporteur ${removed.carrierName} retiré de la cascade`,
            carriers: lane.carriers
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * PUT /api/v1/lanes/:laneId/carriers/reorder
 * Réordonne les transporteurs dans la cascade
 */
router.put('/:laneId/carriers/reorder', async (req, res) => {
    try {
        const { laneId } = req.params;
        const { carrierOrder } = req.body; // Array de carrierIds dans le nouvel ordre
        if (!Array.isArray(carrierOrder)) {
            return res.status(400).json({
                success: false,
                error: 'carrierOrder doit être un tableau de carrierIds'
            });
        }
        const lane = await Lane_1.default.findOne({ laneId });
        if (!lane) {
            return res.status(404).json({ success: false, error: 'Lane non trouvée' });
        }
        // Réordonner selon carrierOrder
        const newCascade = [];
        for (let i = 0; i < carrierOrder.length; i++) {
            const carrier = lane.carriers.find(c => c.carrierId === carrierOrder[i]);
            if (carrier) {
                carrier.position = i + 1;
                newCascade.push(carrier);
            }
        }
        // Ajouter les transporteurs non présents dans carrierOrder à la fin
        for (const carrier of lane.carriers) {
            if (!carrierOrder.includes(carrier.carrierId)) {
                carrier.position = newCascade.length + 1;
                newCascade.push(carrier);
            }
        }
        lane.carriers = newCascade;
        await lane.save();
        res.json({
            success: true,
            message: 'Cascade réordonnée',
            carriers: lane.carriers
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=lanes.js.map
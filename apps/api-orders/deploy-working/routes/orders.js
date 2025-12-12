"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes pour la gestion des commandes SYMPHONI.A
 */
const express_1 = require("express");
const uuid_1 = require("uuid");
const Order_1 = __importDefault(require("../models/Order"));
const portal_invitation_service_1 = __importDefault(require("../services/portal-invitation-service"));
const router = (0, express_1.Router)();
// Fonction pour générer la référence de commande unique avec timestamp
async function generateReference() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    // Format: CMD-YYMMDD-HHMMSS-XXX (avec millisecondes pour unicité)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `CMD-${year}${month}${day}-${hours}${minutes}${seconds}${ms}`;
}
// GET /orders - Liste des commandes avec filtres et pagination
router.get('/', async (req, res) => {
    try {
        const { status, dateFrom, dateTo, carrierId, search, trackingLevel, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filter = {};
        // Filtrer par industrialId si fourni (via header ou query)
        const industrialId = req.headers['x-industrial-id'];
        if (industrialId) {
            filter.industrialId = industrialId;
        }
        if (status) {
            filter.status = Array.isArray(status) ? { $in: status } : status;
        }
        if (carrierId)
            filter.carrierId = carrierId;
        if (trackingLevel)
            filter.trackingLevel = trackingLevel;
        if (dateFrom || dateTo) {
            filter['dates.pickupDate'] = {};
            if (dateFrom)
                filter['dates.pickupDate'].$gte = new Date(dateFrom);
            if (dateTo)
                filter['dates.pickupDate'].$lte = new Date(dateTo);
        }
        if (search) {
            filter.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { 'pickupAddress.city': { $regex: search, $options: 'i' } },
                { 'deliveryAddress.city': { $regex: search, $options: 'i' } },
                { 'goods.description': { $regex: search, $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const [orders, total] = await Promise.all([
            Order_1.default.find(filter).sort(sort).skip(skip).limit(limitNum),
            Order_1.default.countDocuments(filter),
        ]);
        res.json({
            data: orders.map(o => ({ ...o.toObject(), id: o.orderId })),
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
});
// GET /orders/:orderId - Détail d'une commande
router.get('/:orderId', async (req, res) => {
    try {
        const order = await Order_1.default.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        // Récupérer les invitations portail
        const invitations = await portal_invitation_service_1.default.getOrderInvitations(req.params.orderId);
        res.json({ ...order.toObject(), id: order.orderId, portalInvitations: invitations });
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
    }
});
// POST /orders - Créer une nouvelle commande
router.post('/', async (req, res) => {
    try {
        // Validation des données requises
        const { pickupAddress, deliveryAddress, dates, goods } = req.body;
        if (!pickupAddress || !pickupAddress.street || !pickupAddress.city || !pickupAddress.postalCode) {
            return res.status(400).json({
                error: 'Adresse d\'enlèvement invalide',
                details: 'pickupAddress doit contenir street, city et postalCode'
            });
        }
        if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode) {
            return res.status(400).json({
                error: 'Adresse de livraison invalide',
                details: 'deliveryAddress doit contenir street, city et postalCode'
            });
        }
        if (!dates || !dates.pickupDate || !dates.deliveryDate) {
            return res.status(400).json({
                error: 'Dates invalides',
                details: 'dates doit contenir pickupDate et deliveryDate'
            });
        }
        if (!goods || !goods.description || goods.weight === undefined) {
            return res.status(400).json({
                error: 'Marchandises invalides',
                details: 'goods doit contenir description et weight'
            });
        }
        const orderId = `ord_${(0, uuid_1.v4)()}`;
        const reference = await generateReference();
        // Récupérer l'industrialId et le createdBy depuis les headers ou le body
        const industrialId = req.headers['x-industrial-id'] || req.body.industrialId;
        const createdBy = req.headers['x-user-id'] || req.body.createdBy || 'system';
        if (!industrialId) {
            return res.status(400).json({
                error: 'industrialId requis',
                details: 'Fournir industrialId dans le body ou header x-industrial-id'
            });
        }
        const orderData = {
            ...req.body,
            orderId,
            reference,
            orderNumber: reference, // Ajout pour compatibilité avec l'index MongoDB existant
            industrialId,
            createdBy,
            dates: {
                ...req.body.dates,
                pickupDate: new Date(req.body.dates.pickupDate),
                deliveryDate: new Date(req.body.dates.deliveryDate),
            },
        };
        const order = new Order_1.default(orderData);
        await order.save();
        // Créer les invitations portail si activées
        const invitationIds = [];
        // Invitation pour l'expéditeur (supplier)
        if (order.pickupAddress.enablePortalAccess && order.pickupAddress.contactEmail) {
            try {
                const supplierId = await portal_invitation_service_1.default.createAndSendInvitation({
                    orderId: order.orderId,
                    orderReference: order.reference,
                    address: order.pickupAddress,
                    role: 'supplier',
                    invitedBy: createdBy,
                });
                if (supplierId)
                    invitationIds.push(supplierId);
            }
            catch (err) {
                console.error('Error sending supplier invitation:', err);
            }
        }
        // Invitation pour le destinataire (recipient)
        if (order.deliveryAddress.enablePortalAccess && order.deliveryAddress.contactEmail) {
            try {
                const recipientId = await portal_invitation_service_1.default.createAndSendInvitation({
                    orderId: order.orderId,
                    orderReference: order.reference,
                    address: order.deliveryAddress,
                    role: 'recipient',
                    invitedBy: createdBy,
                });
                if (recipientId)
                    invitationIds.push(recipientId);
            }
            catch (err) {
                console.error('Error sending recipient invitation:', err);
            }
        }
        // Mettre à jour la commande avec les IDs d'invitation
        if (invitationIds.length > 0) {
            order.portalInvitations = invitationIds;
            await order.save();
        }
        res.status(201).json({ ...order.toObject(), id: order.orderId });
    }
    catch (error) {
        console.error('Error creating order:', error);
        // Erreur de validation Mongoose
        if (error.name === 'ValidationError') {
            const details = Object.values(error.errors).map((e) => e.message).join(', ');
            return res.status(400).json({
                error: 'Erreur de validation',
                details
            });
        }
        // Erreur de duplication (référence ou orderId)
        if (error.code === 11000) {
            const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'unknown';
            const duplicateValue = error.keyValue ? Object.values(error.keyValue)[0] : 'unknown';
            console.error(`[Orders] Duplicate key error - Field: ${duplicateField}, Value: ${duplicateValue}`);
            return res.status(409).json({
                error: 'Commande déjà existante',
                details: `Duplication sur le champ: ${duplicateField}`,
                field: duplicateField,
                value: duplicateValue
            });
        }
        // Erreur MongoDB générale
        res.status(500).json({
            error: 'Erreur lors de la création de la commande',
            details: error.message || 'Erreur inconnue'
        });
    }
});
// PUT /orders/:orderId - Mettre à jour une commande
router.put('/:orderId', async (req, res) => {
    try {
        const order = await Order_1.default.findOneAndUpdate({ orderId: req.params.orderId }, { $set: req.body }, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        res.json({ ...order.toObject(), id: order.orderId });
    }
    catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
    }
});
// PUT /orders/:orderId/cancel - Annuler une commande
router.put('/:orderId/cancel', async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order_1.default.findOneAndUpdate({ orderId: req.params.orderId }, { $set: { status: 'cancelled', notes: reason ? `Annulée: ${reason}` : 'Annulée' } }, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        res.json({ ...order.toObject(), id: order.orderId });
    }
    catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: "Erreur lors de l'annulation de la commande" });
    }
});
// POST /orders/:orderId/duplicate - Dupliquer une commande
router.post('/:orderId/duplicate', async (req, res) => {
    try {
        const sourceOrder = await Order_1.default.findOne({ orderId: req.params.orderId });
        if (!sourceOrder) {
            return res.status(404).json({ error: 'Commande source non trouvée' });
        }
        const orderId = `ord_${(0, uuid_1.v4)()}`;
        const reference = await generateReference();
        const duplicatedData = {
            ...sourceOrder.toObject(),
            _id: undefined,
            orderId,
            reference,
            status: 'draft',
            portalInvitations: [],
            createdAt: undefined,
            updatedAt: undefined,
        };
        const newOrder = new Order_1.default(duplicatedData);
        await newOrder.save();
        res.status(201).json({ ...newOrder.toObject(), id: newOrder.orderId });
    }
    catch (error) {
        console.error('Error duplicating order:', error);
        res.status(500).json({ error: 'Erreur lors de la duplication de la commande' });
    }
});
// GET /orders/:orderId/events - Historique des événements
router.get('/:orderId/events', async (req, res) => {
    try {
        // Retourner un événement de création par défaut
        const order = await Order_1.default.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        const events = [
            {
                id: `evt_${(0, uuid_1.v4)()}`,
                orderId: req.params.orderId,
                type: 'status_change',
                timestamp: order.createdAt.toISOString(),
                description: 'Commande créée',
                userName: 'Système',
            },
        ];
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching order events:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
    }
});
// POST /orders/:orderId/invitations/:invitationId/resend - Renvoyer une invitation
router.post('/:orderId/invitations/:invitationId/resend', async (req, res) => {
    try {
        await portal_invitation_service_1.default.resendInvitation(req.params.invitationId);
        res.json({ success: true, message: 'Invitation renvoyée avec succès' });
    }
    catch (error) {
        console.error('Error resending invitation:', error);
        res.status(400).json({ error: error.message || "Erreur lors du renvoi de l'invitation" });
    }
});
// DELETE /orders/:orderId - Supprimer une commande
router.delete('/:orderId', async (req, res) => {
    try {
        const order = await Order_1.default.findOneAndDelete({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        res.json({ success: true, message: 'Commande supprimée' });
    }
    catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map
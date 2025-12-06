/**
 * Routes pour la gestion des commandes SYMPHONI.A
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Order from '../models/Order';
import PortalInvitationService from '../services/portal-invitation-service';

const router = Router();

// Fonction pour générer la référence de commande
async function generateReference(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = await Order.countDocuments() + 1;
  return `CMD-${year}${month}-${count.toString().padStart(5, '0')}`;
}

// GET /orders - Liste des commandes avec filtres et pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status, dateFrom, dateTo, carrierId, search,
      trackingLevel, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter: any = {};

    // Filtrer par industrialId si fourni (via header ou query)
    const industrialId = req.headers['x-industrial-id'] as string;
    if (industrialId) {
      filter.industrialId = industrialId;
    }

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }
    if (carrierId) filter.carrierId = carrierId;
    if (trackingLevel) filter.trackingLevel = trackingLevel;

    if (dateFrom || dateTo) {
      filter['dates.pickupDate'] = {};
      if (dateFrom) filter['dates.pickupDate'].$gte = new Date(dateFrom as string);
      if (dateTo) filter['dates.pickupDate'].$lte = new Date(dateTo as string);
    }

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { 'pickupAddress.city': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.city': { $regex: search, $options: 'i' } },
        { 'goods.description': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      data: orders.map(o => ({ ...o.toObject(), id: o.orderId })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// GET /orders/:orderId - Détail d'une commande
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Récupérer les invitations portail
    const invitations = await PortalInvitationService.getOrderInvitations(req.params.orderId);

    res.json({ ...order.toObject(), id: order.orderId, portalInvitations: invitations });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
});

// POST /orders - Créer une nouvelle commande
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderId = `ord_${uuidv4()}`;
    const reference = await generateReference();

    // Récupérer l'industrialId et le createdBy depuis les headers ou le body
    const industrialId = req.headers['x-industrial-id'] as string || req.body.industrialId;
    const createdBy = req.headers['x-user-id'] as string || req.body.createdBy || 'system';

    const orderData = {
      orderId,
      reference,
      industrialId,
      createdBy,
      ...req.body,
      dates: {
        ...req.body.dates,
        pickupDate: new Date(req.body.dates.pickupDate),
        deliveryDate: new Date(req.body.dates.deliveryDate),
      },
    };

    const order = new Order(orderData);
    await order.save();

    // Créer les invitations portail si activées
    const invitationIds: string[] = [];

    // Invitation pour l'expéditeur (supplier)
    if (order.pickupAddress.enablePortalAccess && order.pickupAddress.contactEmail) {
      try {
        const supplierId = await PortalInvitationService.createAndSendInvitation({
          orderId: order.orderId,
          orderReference: order.reference,
          address: order.pickupAddress,
          role: 'supplier',
          invitedBy: createdBy,
        });
        if (supplierId) invitationIds.push(supplierId);
      } catch (err) {
        console.error('Error sending supplier invitation:', err);
      }
    }

    // Invitation pour le destinataire (recipient)
    if (order.deliveryAddress.enablePortalAccess && order.deliveryAddress.contactEmail) {
      try {
        const recipientId = await PortalInvitationService.createAndSendInvitation({
          orderId: order.orderId,
          orderReference: order.reference,
          address: order.deliveryAddress,
          role: 'recipient',
          invitedBy: createdBy,
        });
        if (recipientId) invitationIds.push(recipientId);
      } catch (err) {
        console.error('Error sending recipient invitation:', err);
      }
    }

    // Mettre à jour la commande avec les IDs d'invitation
    if (invitationIds.length > 0) {
      order.portalInvitations = invitationIds;
      await order.save();
    }

    res.status(201).json({ ...order.toObject(), id: order.orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// PUT /orders/:orderId - Mettre à jour une commande
router.put('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: req.body },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ ...order.toObject(), id: order.orderId });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
});

// PUT /orders/:orderId/cancel - Annuler une commande
router.put('/:orderId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { $set: { status: 'cancelled', notes: reason ? `Annulée: ${reason}` : 'Annulée' } },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ ...order.toObject(), id: order.orderId });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: "Erreur lors de l'annulation de la commande" });
  }
});

// POST /orders/:orderId/duplicate - Dupliquer une commande
router.post('/:orderId/duplicate', async (req: Request, res: Response) => {
  try {
    const sourceOrder = await Order.findOne({ orderId: req.params.orderId });
    if (!sourceOrder) {
      return res.status(404).json({ error: 'Commande source non trouvée' });
    }

    const orderId = `ord_${uuidv4()}`;
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

    const newOrder = new Order(duplicatedData);
    await newOrder.save();

    res.status(201).json({ ...newOrder.toObject(), id: newOrder.orderId });
  } catch (error) {
    console.error('Error duplicating order:', error);
    res.status(500).json({ error: 'Erreur lors de la duplication de la commande' });
  }
});

// GET /orders/:orderId/events - Historique des événements
router.get('/:orderId/events', async (req: Request, res: Response) => {
  try {
    // Retourner un événement de création par défaut
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const events = [
      {
        id: `evt_${uuidv4()}`,
        orderId: req.params.orderId,
        type: 'status_change',
        timestamp: order.createdAt.toISOString(),
        description: 'Commande créée',
        userName: 'Système',
      },
    ];
    res.json(events);
  } catch (error) {
    console.error('Error fetching order events:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// POST /orders/:orderId/invitations/:invitationId/resend - Renvoyer une invitation
router.post('/:orderId/invitations/:invitationId/resend', async (req: Request, res: Response) => {
  try {
    await PortalInvitationService.resendInvitation(req.params.invitationId);
    res.json({ success: true, message: 'Invitation renvoyée avec succès' });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    res.status(400).json({ error: error.message || "Erreur lors du renvoi de l'invitation" });
  }
});

// DELETE /orders/:orderId - Supprimer une commande
router.delete('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ success: true, message: 'Commande supprimée' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
  }
});

export default router;

import express, { Response } from 'express';
import { Delivery } from '../models/Delivery';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';
import { TrackingService } from '../services/tracking-service';

const router = express.Router();
const trackingService = new TrackingService();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(requireActiveRecipient);

// GET /deliveries - Liste des livraisons avec filtres
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      siteId,
      startDate,
      endDate,
      supplierId,
      transporterId,
      priority,
      urgency,
      page = '1',
      limit = '20',
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    const recipientId = req.user!.recipientId;

    // Construire le filtre
    const filter: any = { recipientId };

    if (status) {
      if (typeof status === 'string') {
        filter.status = status;
      } else {
        filter.status = { $in: status };
      }
    }

    if (siteId) filter.siteId = siteId;
    if (supplierId) filter.supplierId = supplierId;
    if (transporterId) filter['transport.carrierId'] = transporterId;
    if (priority) filter.priority = priority;

    // Filtre par date
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate as string);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate as string);
    }

    // Filtre d'urgence (livraisons dans les 4 heures)
    if (urgency === 'urgent') {
      const now = new Date();
      const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      filter['eta.predicted'] = { $lte: fourHoursLater };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Tri
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Exécuter la requête
    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Delivery.countDocuments(filter)
    ]);

    res.json({
      deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Error fetching deliveries', details: error.message });
  }
});

// GET /deliveries/:id - Détail d'une livraison avec ETA
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    // Mettre à jour l'ETA si le tracking est actif
    if (delivery.transport.trackingEnabled && delivery.status !== 'delivered') {
      try {
        const updatedETA = await trackingService.updateETA(delivery.deliveryId);
        if (updatedETA) {
          delivery.eta = updatedETA;
          await delivery.save();
        }
      } catch (error) {
        console.error('Error updating ETA:', error);
      }
    }

    res.json(delivery);
  } catch (error: any) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ error: 'Error fetching delivery', details: error.message });
  }
});

// GET /deliveries/:id/tracking - Tracking temps réel (GPS, ETA)
router.get('/:id/tracking', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (!delivery.transport.trackingEnabled) {
      res.status(400).json({
        error: 'Tracking not enabled for this delivery',
        trackingEnabled: false
      });
      return;
    }

    // Récupérer les données de tracking en temps réel
    const trackingData = await trackingService.getRealtimeTracking(delivery.deliveryId);

    res.json({
      deliveryId: delivery.deliveryId,
      status: delivery.status,
      eta: delivery.eta,
      gpsPosition: trackingData.gpsPosition,
      distanceRemaining: trackingData.distanceRemaining,
      timeRemaining: trackingData.timeRemaining,
      route: trackingData.route,
      lastUpdate: trackingData.lastUpdate
    });
  } catch (error: any) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: 'Error fetching tracking data', details: error.message });
  }
});

// GET /deliveries/:id/documents - Documents de transport
router.get('/:id/documents', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    res.json({
      deliveryId: delivery.deliveryId,
      documents: delivery.documents,
      total: delivery.documents.length
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents', details: error.message });
  }
});

// GET /deliveries/:id/timeline - Historique des événements
router.get('/:id/timeline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    // Trier la timeline par timestamp décroissant
    const timeline = delivery.timeline.sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    res.json({
      deliveryId: delivery.deliveryId,
      timeline,
      total: timeline.length
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Error fetching timeline', details: error.message });
  }
});

// GET /deliveries/today/:siteId - Livraisons du jour par site
router.get('/today/:siteId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { siteId } = req.params;
    const recipientId = req.user!.recipientId;

    // Obtenir la date du jour (début et fin)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deliveries = await Delivery.find({
      recipientId,
      siteId,
      scheduledDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ 'eta.predicted': 1 });

    // Grouper par statut
    const grouped = {
      scheduled: deliveries.filter(d => d.status === 'scheduled'),
      in_transit: deliveries.filter(d => d.status === 'in_transit'),
      arriving: deliveries.filter(d => d.status === 'arriving'),
      arrived: deliveries.filter(d => d.status === 'arrived'),
      unloading: deliveries.filter(d => d.status === 'unloading'),
      delivered: deliveries.filter(d => d.status === 'delivered')
    };

    res.json({
      siteId,
      date: today,
      deliveries,
      total: deliveries.length,
      byStatus: grouped,
      summary: {
        scheduled: grouped.scheduled.length,
        in_transit: grouped.in_transit.length,
        arriving: grouped.arriving.length,
        arrived: grouped.arrived.length,
        unloading: grouped.unloading.length,
        delivered: grouped.delivered.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching today deliveries:', error);
    res.status(500).json({ error: 'Error fetching today deliveries', details: error.message });
  }
});

// GET /deliveries/upcoming - Livraisons à venir (prochaines 48h)
router.get('/upcoming', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;
    const { siteId } = req.query;

    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const filter: any = {
      recipientId,
      status: { $in: ['scheduled', 'in_transit', 'arriving'] },
      'eta.predicted': {
        $gte: now,
        $lte: twoDaysLater
      }
    };

    if (siteId) filter.siteId = siteId;

    const deliveries = await Delivery.find(filter)
      .sort({ 'eta.predicted': 1 })
      .limit(50);

    res.json({
      deliveries,
      total: deliveries.length,
      timeframe: {
        start: now,
        end: twoDaysLater
      }
    });
  } catch (error: any) {
    console.error('Error fetching upcoming deliveries:', error);
    res.status(500).json({ error: 'Error fetching upcoming deliveries', details: error.message });
  }
});

// POST /deliveries/:id/confirm-arrival - Confirmer l'arrivée
router.post('/:id/confirm-arrival', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (delivery.status !== 'arriving') {
      res.status(400).json({
        error: 'Invalid status for arrival confirmation',
        currentStatus: delivery.status
      });
      return;
    }

    delivery.status = 'arrived';
    delivery.arrivalDate = new Date();

    delivery.addTimelineEvent(
      'arrived',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      'Arrival confirmed by recipient'
    );

    await delivery.save();

    res.json({
      message: 'Arrival confirmed successfully',
      delivery: {
        deliveryId: delivery.deliveryId,
        status: delivery.status,
        arrivalDate: delivery.arrivalDate
      }
    });
  } catch (error: any) {
    console.error('Error confirming arrival:', error);
    res.status(500).json({ error: 'Error confirming arrival', details: error.message });
  }
});

// POST /deliveries/:id/start-unloading - Démarrer le déchargement
router.post('/:id/start-unloading', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (delivery.status !== 'arrived') {
      res.status(400).json({
        error: 'Delivery must be in arrived status',
        currentStatus: delivery.status
      });
      return;
    }

    delivery.status = 'unloading';
    if (!delivery.unloading) {
      delivery.unloading = {} as any;
    }
    delivery.unloading!.startedAt = new Date();

    delivery.addTimelineEvent(
      'unloading',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      'Unloading started'
    );

    await delivery.save();

    res.json({
      message: 'Unloading started successfully',
      delivery: {
        deliveryId: delivery.deliveryId,
        status: delivery.status,
        unloadingStartedAt: delivery.unloading!.startedAt
      }
    });
  } catch (error: any) {
    console.error('Error starting unloading:', error);
    res.status(500).json({ error: 'Error starting unloading', details: error.message });
  }
});

// POST /deliveries/:id/rate - Noter une livraison
router.post('/:id/rate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    const recipientId = req.user!.recipientId;

    if (!score || score < 1 || score > 5) {
      res.status(400).json({ error: 'Score must be between 1 and 5' });
      return;
    }

    const delivery = await Delivery.findOne({
      deliveryId: id,
      recipientId
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (delivery.status !== 'delivered') {
      res.status(400).json({
        error: 'Can only rate delivered deliveries',
        currentStatus: delivery.status
      });
      return;
    }

    delivery.rating = {
      score,
      comment,
      ratedBy: req.user!.id,
      ratedAt: new Date()
    };

    await delivery.save();

    res.json({
      message: 'Delivery rated successfully',
      rating: delivery.rating
    });
  } catch (error: any) {
    console.error('Error rating delivery:', error);
    res.status(500).json({ error: 'Error rating delivery', details: error.message });
  }
});

export default router;

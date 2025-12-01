import express, { Response } from 'express';
import { Incident } from '../models/Incident';
import { Delivery } from '../models/Delivery';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';
import { IncidentService } from '../services/incident-service';

const router = express.Router();
const incidentService = new IncidentService();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(requireActiveRecipient);

// POST /incidents - Déclarer un incident
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      deliveryId,
      type,
      severity,
      title,
      description,
      affectedItems,
      category,
      priority
    } = req.body;

    // Validation
    if (!deliveryId || !type || !severity || !title || !description) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipientId = req.user!.recipientId;

    // Vérifier que la livraison existe
    const delivery = await Delivery.findOne({ deliveryId, recipientId });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    // Générer un incidentId
    const incidentId = await (Incident as any).generateIncidentId();

    // Créer l'incident
    const incident = new Incident({
      incidentId,
      deliveryId,
      recipientId,
      siteId: delivery.siteId,
      industrialId: delivery.industrialId,
      supplierId: delivery.supplierId,
      transporterId: delivery.transport.carrierId,
      type,
      severity,
      category: category || 'transport',
      title,
      description,
      affectedItems: affectedItems || [],
      photos: [],
      status: 'reported',
      reportedAt: new Date(),
      reportedBy: {
        userId: req.user!.id,
        name: req.user!.email,
        role: req.user!.role,
        email: req.user!.email
      },
      acknowledgements: [],
      notifications: {
        transporterNotified: false,
        industrialNotified: false,
        supplierNotified: false
      },
      billingBlocked: false,
      timeline: [],
      priority: priority || (severity === 'critical' ? 'urgent' : 'normal'),
      tags: [],
      metadata: {
        source: 'web'
      }
    });

    // Ajouter l'événement initial à la timeline
    incident.addTimelineEvent(
      'reported',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      `Incident reported: ${title}`
    );

    // Bloquer la facturation si sévérité majeure ou critique
    if (['major', 'critical'].includes(severity)) {
      incident.blockBilling(`Incident ${incidentId} - ${title}`);
    }

    await incident.save();

    // Mettre à jour la livraison
    if (!delivery.incidents) {
      delivery.incidents = [];
    }
    delivery.incidents.push(incidentId);
    delivery.status = 'incident';

    delivery.addTimelineEvent(
      'incident',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      `Incident reported: ${incidentId}`
    );

    await delivery.save();

    // Envoyer les notifications
    await incidentService.sendIncidentNotifications(incident, delivery);

    // Bloquer la préfacturation si nécessaire
    if (incident.billingBlocked) {
      await incidentService.blockBilling(incident, delivery);
    }

    res.status(201).json({
      message: 'Incident reported successfully',
      incident: {
        incidentId: incident.incidentId,
        deliveryId: incident.deliveryId,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        billingBlocked: incident.billingBlocked,
        reportedAt: incident.reportedAt
      }
    });
  } catch (error: any) {
    console.error('Error reporting incident:', error);
    res.status(500).json({ error: 'Error reporting incident', details: error.message });
  }
});

// GET /incidents - Liste des incidents avec filtres
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      severity,
      type,
      deliveryId,
      siteId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      sortBy = 'reportedAt',
      sortOrder = 'desc'
    } = req.query;

    const recipientId = req.user!.recipientId;

    // Construire le filtre
    const filter: any = { recipientId };

    if (status) filter.status = typeof status === 'string' ? status : { $in: status };
    if (severity) filter.severity = typeof severity === 'string' ? severity : { $in: severity };
    if (type) filter.type = typeof type === 'string' ? type : { $in: type };
    if (deliveryId) filter.deliveryId = deliveryId;
    if (siteId) filter.siteId = siteId;

    // Filtre par date
    if (startDate || endDate) {
      filter.reportedAt = {};
      if (startDate) filter.reportedAt.$gte = new Date(startDate as string);
      if (endDate) filter.reportedAt.$lte = new Date(endDate as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Tri
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Exécuter la requête
    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Incident.countDocuments(filter)
    ]);

    res.json({
      incidents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Error fetching incidents', details: error.message });
  }
});

// GET /incidents/:id - Détail d'un incident
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Récupérer aussi les infos de la livraison associée
    const delivery = await Delivery.findOne({ deliveryId: incident.deliveryId });

    res.json({
      incident,
      delivery: delivery ? {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        status: delivery.status,
        carrier: delivery.transport.carrierName,
        scheduledDate: delivery.scheduledDate
      } : null
    });
  } catch (error: any) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Error fetching incident', details: error.message });
  }
});

// PUT /incidents/:id - Mettre à jour un incident
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const {
      title,
      description,
      affectedItems,
      severity,
      priority,
      tags
    } = req.body;

    // Mise à jour des champs autorisés
    if (title) incident.title = title;
    if (description) incident.description = description;
    if (affectedItems) incident.affectedItems = affectedItems;
    if (severity) incident.severity = severity;
    if (priority) incident.priority = priority;
    if (tags) incident.tags = tags;

    incident.addTimelineEvent(
      'updated',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      'Incident updated by recipient'
    );

    await incident.save();

    res.json({
      message: 'Incident updated successfully',
      incident
    });
  } catch (error: any) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Error updating incident', details: error.message });
  }
});

// POST /incidents/:id/photos - Ajouter des photos à un incident
router.post('/:id/photos', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { photos } = req.body;
    const recipientId = req.user!.recipientId;

    if (!photos || !Array.isArray(photos)) {
      res.status(400).json({ error: 'Photos array is required' });
      return;
    }

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Ajouter les photos
    for (const photo of photos) {
      incident.addPhoto(
        photo.url,
        req.user!.id,
        photo.description,
        photo.tags
      );
    }

    incident.addTimelineEvent(
      'photos_added',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      `${photos.length} photo(s) added`
    );

    await incident.save();

    res.json({
      message: 'Photos added successfully',
      incidentId: incident.incidentId,
      photos: incident.photos,
      total: incident.photos.length
    });
  } catch (error: any) {
    console.error('Error adding photos:', error);
    res.status(500).json({ error: 'Error adding photos', details: error.message });
  }
});

// POST /incidents/:id/acknowledge - Accuser réception (transporter/industrial)
// Cette route est également accessible par d'autres parties prenantes
router.post('/:id/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment, actionPlan } = req.body;
    const recipientId = req.user!.recipientId;

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Dans ce cas, c'est le destinataire qui accuse réception d'une réponse
    incident.acknowledge(
      req.user!.id,
      'recipient',
      comment,
      actionPlan
    );

    await incident.save();

    res.json({
      message: 'Incident acknowledged successfully',
      incident: {
        incidentId: incident.incidentId,
        status: incident.status,
        acknowledgements: incident.acknowledgements
      }
    });
  } catch (error: any) {
    console.error('Error acknowledging incident:', error);
    res.status(500).json({ error: 'Error acknowledging incident', details: error.message });
  }
});

// POST /incidents/:id/resolve - Résoudre un incident (généralement fait par le transporteur/industriel)
router.post('/:id/resolve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, compensation, resolution, documents } = req.body;
    const recipientId = req.user!.recipientId;

    if (!action || !resolution) {
      res.status(400).json({ error: 'Action and resolution are required' });
      return;
    }

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Créer la résolution
    incident.resolution = {
      action,
      resolvedAt: new Date(),
      resolvedBy: req.user!.id,
      resolvedByType: 'recipient',
      compensation,
      resolution,
      documents: documents || []
    };

    incident.status = 'resolved';

    // Débloquer la facturation
    if (incident.billingBlocked) {
      incident.unblockBilling();
    }

    incident.addTimelineEvent(
      'resolved',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      `Incident resolved: ${action}`
    );

    await incident.save();

    // Envoyer les notifications
    await incidentService.sendResolutionNotifications(incident);

    res.json({
      message: 'Incident resolved successfully',
      incident: {
        incidentId: incident.incidentId,
        status: incident.status,
        resolution: incident.resolution,
        billingBlocked: incident.billingBlocked
      }
    });
  } catch (error: any) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ error: 'Error resolving incident', details: error.message });
  }
});

// POST /incidents/:id/close - Fermer un incident
router.post('/:id/close', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const recipientId = req.user!.recipientId;

    const incident = await Incident.findOne({
      incidentId: id,
      recipientId
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    if (incident.status !== 'resolved') {
      res.status(400).json({
        error: 'Can only close resolved incidents',
        currentStatus: incident.status
      });
      return;
    }

    incident.status = 'closed';

    incident.addTimelineEvent(
      'closed',
      {
        id: req.user!.id,
        type: 'recipient',
        name: req.user!.email
      },
      comment || 'Incident closed'
    );

    await incident.save();

    res.json({
      message: 'Incident closed successfully',
      incident: {
        incidentId: incident.incidentId,
        status: incident.status
      }
    });
  } catch (error: any) {
    console.error('Error closing incident:', error);
    res.status(500).json({ error: 'Error closing incident', details: error.message });
  }
});

// GET /incidents/stats - Statistiques des incidents
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;
    const { startDate, endDate } = req.query;

    const filter: any = { recipientId };

    if (startDate || endDate) {
      filter.reportedAt = {};
      if (startDate) filter.reportedAt.$gte = new Date(startDate as string);
      if (endDate) filter.reportedAt.$lte = new Date(endDate as string);
    }

    const [
      total,
      byStatus,
      bySeverity,
      byType,
      billingBlocked
    ] = await Promise.all([
      Incident.countDocuments(filter),
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Incident.countDocuments({ ...filter, billingBlocked: true })
    ]);

    res.json({
      total,
      byStatus: byStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySeverity: bySeverity.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      billingBlocked
    });
  } catch (error: any) {
    console.error('Error fetching incident stats:', error);
    res.status(500).json({ error: 'Error fetching incident stats', details: error.message });
  }
});

export default router;

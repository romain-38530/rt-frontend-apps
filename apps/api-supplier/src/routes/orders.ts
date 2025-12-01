import { Router, Request, Response } from 'express';
import SupplierOrder from '../models/SupplierOrder';
import axios from 'axios';

const router = Router();

/**
 * GET /orders
 * Liste des commandes avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    const {
      status,
      dateFrom,
      dateTo,
      industrialId,
      page = '1',
      limit = '20'
    } = req.query;

    const query: any = { supplierId };

    if (status) {
      query.status = status;
    }

    if (industrialId) {
      query.industrialId = industrialId;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo as string);
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await SupplierOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await SupplierOrder.countDocuments(query);

    res.json({
      orders: orders.map((order) => ({
        orderId: order.orderId,
        supplierId: order.supplierId,
        industrialId: order.industrialId,
        status: order.status,
        loadingSlot: order.loadingSlot,
        goods: order.goods,
        transportInfo: order.transportInfo,
        documentsCount: order.documents.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /orders/:id
 * Détail d'une commande
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    const order = await SupplierOrder.findOne({
      orderId: id,
      supplierId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      supplierId: order.supplierId,
      industrialId: order.industrialId,
      status: order.status,
      loadingSlot: order.loadingSlot,
      goods: order.goods,
      transportInfo: order.transportInfo,
      documents: order.documents,
      timeline: order.timeline,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /orders/:id/status
 * Mettre à jour le statut d'une commande
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    const validStatuses = ['to_prepare', 'ready', 'in_progress', 'loaded', 'dispute'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    const order = await SupplierOrder.findOne({
      orderId: id,
      supplierId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;

    // Ajouter l'événement à la timeline
    order.timeline.push({
      status,
      timestamp: new Date(),
      actor: supplierId,
      notes: notes || `Status changed from ${previousStatus} to ${status}`
    });

    await order.save();

    // Émettre événement
    await emitEvent('fournisseur.order.status_changed', {
      orderId: order.orderId,
      supplierId: order.supplierId,
      industrialId: order.industrialId,
      previousStatus,
      newStatus: status,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        timeline: order.timeline
      }
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /orders/:id/documents
 * Upload un document pour une commande
 */
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;
    const { id } = req.params;
    const { type, filename, url } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    if (!type || !filename || !url) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'filename', 'url']
      });
    }

    const order = await SupplierOrder.findOne({
      orderId: id,
      supplierId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.documents.push({
      type,
      filename,
      url,
      uploadedAt: new Date(),
      uploadedBy: supplierId
    });

    await order.save();

    // Émettre événement
    await emitEvent('fournisseur.document.uploaded', {
      orderId: order.orderId,
      supplierId: order.supplierId,
      documentType: type,
      filename,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: order.documents[order.documents.length - 1]
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /orders/:id/documents
 * Liste des documents d'une commande
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    const order = await SupplierOrder.findOne({
      orderId: id,
      supplierId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      documents: order.documents.sort(
        (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
      )
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /orders/:id/timeline
 * Historique des événements d'une commande
 */
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const supplierId = req.headers['x-supplier-id'] as string;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID is required' });
    }

    const order = await SupplierOrder.findOne({
      orderId: id,
      supplierId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      timeline: order.timeline.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /orders (Créer une commande - pour tests ou import)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      supplierId,
      industrialId,
      goods,
      transportInfo
    } = req.body;

    if (!orderId || !supplierId || !industrialId || !goods) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'supplierId', 'industrialId', 'goods']
      });
    }

    const existingOrder = await SupplierOrder.findOne({ orderId });
    if (existingOrder) {
      return res.status(409).json({
        error: 'Order already exists'
      });
    }

    const order = new SupplierOrder({
      orderId,
      supplierId,
      industrialId,
      goods,
      transportInfo: transportInfo || {},
      status: 'to_prepare',
      timeline: [
        {
          status: 'to_prepare',
          timestamp: new Date(),
          actor: 'system',
          notes: 'Order created'
        }
      ]
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction helper pour émettre des événements
 */
async function emitEvent(eventType: string, data: any) {
  try {
    await axios.post(`${process.env.API_EVENTS_URL}/events`, {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error emitting event:', error);
  }
}

export default router;

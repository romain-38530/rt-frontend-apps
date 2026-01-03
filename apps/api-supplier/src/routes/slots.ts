import { Router, Response } from 'express';
import slotService from '../services/slot-service';
import LoadingSlot from '../models/LoadingSlot';
import { authenticateSupplier, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /slots
 * Liste des créneaux proposés pour le fournisseur
 */
router.get('/', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      status,
      dateFrom,
      dateTo,
      orderId,
      page = '1',
      limit = '50'
    } = req.query;

    const query: any = { supplierId };

    if (status) {
      query.status = status;
    }

    if (orderId) {
      query.orderId = orderId;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo as string);
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const slots = await LoadingSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await LoadingSlot.countDocuments(query);

    res.json({
      slots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /slots/:orderId
 * Récupérer le créneau pour une commande spécifique
 */
router.get('/:orderId', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { orderId } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const slots = await LoadingSlot.find({
      orderId,
      supplierId
    }).sort({ createdAt: -1 });

    if (slots.length === 0) {
      return res.status(404).json({ error: 'No slots found for this order' });
    }

    // Retourner le créneau le plus récent et l'historique
    res.json({
      currentSlot: slots[0],
      history: slots.slice(1)
    });
  } catch (error: any) {
    console.error('Error fetching slot:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /slots/:id/accept
 * Accepter un créneau proposé
 */
router.post('/:id/accept', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const slot = await slotService.acceptSlot(id, supplierId);

    res.json({
      success: true,
      message: 'Slot accepted successfully',
      slot: {
        slotId: slot.slotId,
        orderId: slot.orderId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status
      }
    });
  } catch (error: any) {
    console.error('Error accepting slot:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /slots/:id/modify
 * Proposer une modification de créneau
 */
router.post('/:id/modify', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;
    const { alternativeSlot, reason } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!alternativeSlot || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['alternativeSlot', 'reason']
      });
    }

    if (!alternativeSlot.date || !alternativeSlot.startTime || !alternativeSlot.endTime) {
      return res.status(400).json({
        error: 'Invalid alternativeSlot',
        required: ['date', 'startTime', 'endTime']
      });
    }

    const result = await slotService.modifySlot(
      id,
      {
        date: new Date(alternativeSlot.date),
        startTime: alternativeSlot.startTime,
        endTime: alternativeSlot.endTime,
        dockId: alternativeSlot.dockId
      },
      reason,
      supplierId
    );

    res.json({
      success: true,
      message: 'Slot modification proposed successfully',
      originalSlot: {
        slotId: result.originalSlot.slotId,
        status: result.originalSlot.status
      },
      newSlot: {
        slotId: result.newSlot.slotId,
        date: result.newSlot.date,
        startTime: result.newSlot.startTime,
        endTime: result.newSlot.endTime,
        status: result.newSlot.status
      }
    });
  } catch (error: any) {
    console.error('Error modifying slot:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /slots/:id/reject
 * Refuser un créneau proposé
 */
router.post('/:id/reject', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'Reason is required'
      });
    }

    const slot = await slotService.rejectSlot(id, reason, supplierId);

    res.json({
      success: true,
      message: 'Slot rejected successfully',
      slot: {
        slotId: slot.slotId,
        status: slot.status,
        response: slot.response
      }
    });
  } catch (error: any) {
    console.error('Error rejecting slot:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /slots/availability
 * Récupérer les disponibilités
 */
router.get('/availability', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { date } = req.query;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const queryDate = date ? new Date(date as string) : undefined;
    const slots = await slotService.getAvailableSlots(supplierId, queryDate);

    // Grouper par date
    const slotsByDate: { [key: string]: any[] } = {};
    slots.forEach((slot) => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push({
        slotId: slot.slotId,
        orderId: slot.orderId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        dockId: slot.dockId
      });
    });

    res.json({
      availability: slotsByDate,
      total: slots.length
    });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /slots/propose
 * Proposer un nouveau créneau (par le fournisseur)
 */
router.post('/propose', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { orderId, date, startTime, endTime, dockId } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!orderId || !date || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'date', 'startTime', 'endTime']
      });
    }

    const slot = await slotService.proposeSlot({
      supplierId,
      orderId,
      proposedBy: 'supplier',
      date: new Date(date),
      startTime,
      endTime,
      dockId
    });

    res.status(201).json({
      success: true,
      message: 'Slot proposed successfully',
      slot: {
        slotId: slot.slotId,
        orderId: slot.orderId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status
      }
    });
  } catch (error: any) {
    console.error('Error proposing slot:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /slots/sync-eta
 * Synchroniser les ETA depuis l'API Tracking
 */
router.post('/sync-eta', async (_req: Request, res: Response) => {
  try {
    const result = await slotService.syncETAForActiveSlots();

    res.json({
      success: true,
      message: 'ETA synchronized successfully',
      synced: result.synced
    });
  } catch (error: any) {
    console.error('Error syncing ETA:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

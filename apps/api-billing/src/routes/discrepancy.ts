import { Router, Request, Response } from 'express';
import { Dispute, Prefacturation } from '../models';

const router = Router();

// Get discrepancy details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Discrepancy not found'
      });
    }

    res.json({
      success: true,
      data: dispute
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve discrepancy
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { action, adjustedAmount, comment, userId } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Discrepancy not found'
      });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Discrepancy already resolved'
      });
    }

    dispute.status = 'resolved';
    dispute.resolution = {
      decision: action,
      adjustedAmount,
      comment,
      resolvedBy: userId || 'system',
      resolvedAt: new Date()
    };

    // Add to timeline
    dispute.timeline.push({
      date: new Date(),
      action: 'resolved',
      actor: userId || 'system',
      comment,
      status: 'resolved'
    });

    if (adjustedAmount !== undefined) {
      dispute.amount.final = adjustedAmount;
    }

    await dispute.save();

    // Update related prefacturation if exists
    if (dispute.prefacturationId) {
      const prefacturation = await Prefacturation.findById(dispute.prefacturationId);
      if (prefacturation) {
        prefacturation.discrepanciesCount = Math.max(0, prefacturation.discrepanciesCount - 1);
        prefacturation.hasDiscrepancies = prefacturation.discrepanciesCount > 0;
        await prefacturation.save();
      }
    }

    res.json({
      success: true,
      data: dispute
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all discrepancies
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [discrepancies, total] = await Promise.all([
      Dispute.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dispute.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: discrepancies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

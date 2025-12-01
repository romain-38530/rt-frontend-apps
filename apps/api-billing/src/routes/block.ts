import { Router, Request, Response } from 'express';
import { Block, CarrierVigilance } from '../models';

const router = Router();

// Check blocks for an order/entity
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, carrierId } = req.body;

    const blocks: any[] = [];

    // Check for entity-specific blocks
    const entityBlocks = await Block.find({
      'entity.type': entityType,
      'entity.id': entityId,
      status: 'active'
    });

    blocks.push(...entityBlocks);

    // Check carrier vigilance if carrierId provided
    if (carrierId) {
      const vigilance = await CarrierVigilance.findOne({ 'carrier.id': carrierId });

      if (vigilance && vigilance.billingRestrictions.isBlocked) {
        blocks.push({
          type: 'vigilance',
          reason: vigilance.billingRestrictions.reason,
          severity: 'critical',
          entity: {
            type: 'carrier',
            id: carrierId
          }
        });
      }

      // Check for expired documents
      if (vigilance && vigilance.compliance.expiredCount > 0) {
        const expiredDocs = vigilance.documents.filter(doc => doc.status === 'expired');
        expiredDocs.forEach(doc => {
          blocks.push({
            type: 'vigilance',
            reason: `Document ${doc.type} expired on ${doc.expiryDate}`,
            severity: 'high',
            entity: {
              type: 'carrier',
              id: carrierId
            }
          });
        });
      }
    }

    res.json({
      success: true,
      data: {
        hasBlocks: blocks.length > 0,
        blocksCount: blocks.length,
        blocks
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create manual block
router.post('/', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, entityReference, type, reason, severity, details, userId } = req.body;

    const reference = `BLK-${Date.now()}-${entityType.toUpperCase()}`;

    const block = new Block({
      reference,
      type,
      entity: {
        type: entityType,
        id: entityId,
        reference: entityReference
      },
      reason,
      details,
      severity: severity || 'medium',
      status: 'active',
      impact: {
        blocksBilling: true,
        requiresApproval: severity === 'critical' || severity === 'high'
      },
      createdBy: userId || 'system'
    });

    await block.save();

    res.status(201).json({
      success: true,
      data: block
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove/resolve block
router.post('/unblock', async (req: Request, res: Response) => {
  try {
    const { blockId, action, comment, userId } = req.body;

    const block = await Block.findById(blockId);

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found'
      });
    }

    if (block.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Block is not active'
      });
    }

    block.status = 'resolved';
    block.resolution = {
      action,
      comment,
      resolvedBy: userId || 'system',
      resolvedAt: new Date()
    };

    await block.save();

    res.json({
      success: true,
      data: block
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List active blocks
router.get('/', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, type, status = 'active', page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (entityType) filter['entity.type'] = entityType;
    if (entityId) filter['entity.id'] = entityId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [blocks, total] = await Promise.all([
      Block.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Block.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: blocks,
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

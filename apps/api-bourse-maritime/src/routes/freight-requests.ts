import { Router, Response } from 'express';
import FreightRequest from '../models/FreightRequest';
import Bid from '../models/Bid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Create freight request
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = new FreightRequest({
      ...req.body,
      shipper: {
        ...req.body.shipper,
        companyId: req.user?.companyId
      }
    });

    await freightRequest.save();

    res.status(201).json({
      success: true,
      data: freightRequest
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// List freight requests with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      origin,
      destination,
      type,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const query: any = {};

    if (origin) {
      query.$or = [
        { 'origin.port': new RegExp(origin as string, 'i') },
        { 'origin.country': new RegExp(origin as string, 'i') }
      ];
    }

    if (destination) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'destination.port': new RegExp(destination as string, 'i') },
        { 'destination.country': new RegExp(destination as string, 'i') }
      );
    }

    if (type) {
      query['cargo.type'] = type;
    }

    if (status) {
      query.status = status;
    } else {
      // Default: show published and bidding requests
      query.status = { $in: ['published', 'bidding'] };
    }

    if (dateFrom || dateTo) {
      query['schedule.loadingDate'] = {};
      if (dateFrom) {
        query['schedule.loadingDate'].$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query['schedule.loadingDate'].$lte = new Date(dateTo as string);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [freightRequests, total] = await Promise.all([
      FreightRequest.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      FreightRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: freightRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get freight request details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    res.json({
      success: true,
      data: freightRequest
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update freight request
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check ownership
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this freight request'
      });
    }

    // Can't update if already awarded
    if (freightRequest.status === 'awarded' || freightRequest.status === 'inProgress' || freightRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update freight request in current status'
      });
    }

    Object.assign(freightRequest, req.body);
    await freightRequest.save();

    res.json({
      success: true,
      data: freightRequest
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel freight request
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check ownership
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this freight request'
      });
    }

    freightRequest.status = 'cancelled';
    await freightRequest.save();

    // Update all pending bids to withdrawn
    await Bid.updateMany(
      {
        freightRequestId: freightRequest._id,
        status: { $in: ['submitted', 'shortlisted'] }
      },
      { status: 'withdrawn' }
    );

    res.json({
      success: true,
      message: 'Freight request cancelled successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Publish freight request to marketplace
router.post('/:id/publish', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check ownership
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to publish this freight request'
      });
    }

    if (freightRequest.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft freight requests can be published'
      });
    }

    freightRequest.status = 'published';
    freightRequest.publishedAt = new Date();

    // Set closing date (e.g., 7 days from now or custom)
    const closingDate = req.body.closingDate
      ? new Date(req.body.closingDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    freightRequest.closingDate = closingDate;

    await freightRequest.save();

    res.json({
      success: true,
      data: freightRequest,
      message: 'Freight request published successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Close bidding
router.post('/:id/close', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check ownership
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to close this freight request'
      });
    }

    if (freightRequest.status !== 'published' && freightRequest.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        error: 'Can only close published or bidding freight requests'
      });
    }

    freightRequest.closingDate = new Date();
    freightRequest.status = 'bidding'; // Change to a closed status if needed
    await freightRequest.save();

    // Expire all submitted bids
    await Bid.updateMany(
      {
        freightRequestId: freightRequest._id,
        status: 'submitted'
      },
      { status: 'expired' }
    );

    res.json({
      success: true,
      data: freightRequest,
      message: 'Bidding closed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

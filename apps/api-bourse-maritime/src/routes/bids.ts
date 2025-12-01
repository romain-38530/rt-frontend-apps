import { Router, Response } from 'express';
import Bid from '../models/Bid';
import FreightRequest from '../models/FreightRequest';
import Contract from '../models/Contract';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Submit bid for freight request
router.post('/freight-requests/:id/bids', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check if freight request is open for bidding
    if (freightRequest.status !== 'published' && freightRequest.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        error: 'Freight request is not open for bidding'
      });
    }

    // Check if closing date has passed
    if (freightRequest.closingDate && new Date() > freightRequest.closingDate) {
      return res.status(400).json({
        success: false,
        error: 'Bidding period has closed'
      });
    }

    // Create bid
    const bid = new Bid({
      ...req.body,
      freightRequestId: freightRequest._id,
      carrier: {
        ...req.body.carrier,
        companyId: req.user?.companyId
      }
    });

    await bid.save();

    // Update freight request stats
    freightRequest.bidsCount += 1;
    freightRequest.status = 'bidding';

    if (!freightRequest.lowestBid || bid.pricing.amount < freightRequest.lowestBid) {
      freightRequest.lowestBid = bid.pricing.amount;
    }

    if (!freightRequest.highestBid || bid.pricing.amount > freightRequest.highestBid) {
      freightRequest.highestBid = bid.pricing.amount;
    }

    await freightRequest.save();

    res.status(201).json({
      success: true,
      data: bid,
      message: 'Bid submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// List bids for freight request
router.get('/freight-requests/:id/bids', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const freightRequest = await FreightRequest.findById(req.params.id);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check authorization - only shipper can see all bids
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view bids for this freight request'
      });
    }

    const bids = await Bid.find({ freightRequestId: freightRequest._id })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: bids
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get my submitted bids
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {
      'carrier.companyId': req.user?.companyId
    };

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bids, total] = await Promise.all([
      Bid.find(query)
        .populate('freightRequestId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Bid.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: bids,
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

// Update bid
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check ownership
    if (bid.carrier.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this bid'
      });
    }

    // Can only update submitted bids
    if (bid.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        error: 'Can only update submitted bids'
      });
    }

    // Check if bid has expired
    if (new Date() > bid.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Bid has expired'
      });
    }

    Object.assign(bid, req.body);
    await bid.save();

    // Update freight request stats if price changed
    if (req.body.pricing?.amount) {
      const freightRequest = await FreightRequest.findById(bid.freightRequestId);
      if (freightRequest) {
        const allBids = await Bid.find({
          freightRequestId: freightRequest._id,
          status: { $in: ['submitted', 'shortlisted'] }
        });

        if (allBids.length > 0) {
          freightRequest.lowestBid = Math.min(...allBids.map(b => b.pricing.amount));
          freightRequest.highestBid = Math.max(...allBids.map(b => b.pricing.amount));
          await freightRequest.save();
        }
      }
    }

    res.json({
      success: true,
      data: bid
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Withdraw bid
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check ownership
    if (bid.carrier.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to withdraw this bid'
      });
    }

    // Can only withdraw submitted or shortlisted bids
    if (bid.status !== 'submitted' && bid.status !== 'shortlisted') {
      return res.status(400).json({
        success: false,
        error: 'Can only withdraw submitted or shortlisted bids'
      });
    }

    bid.status = 'withdrawn';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid withdrawn successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Accept bid (shipper only)
router.post('/:id/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('freightRequestId');

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    const freightRequest = await FreightRequest.findById(bid.freightRequestId);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check authorization - only shipper can accept
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept this bid'
      });
    }

    // Check bid status
    if (bid.status !== 'submitted' && bid.status !== 'shortlisted') {
      return res.status(400).json({
        success: false,
        error: 'Bid is not in a valid state for acceptance'
      });
    }

    // Accept bid
    bid.status = 'accepted';
    await bid.save();

    // Update freight request
    freightRequest.status = 'awarded';
    freightRequest.selectedBid = bid._id as any;
    freightRequest.awardedAt = new Date();
    await freightRequest.save();

    // Reject all other bids
    await Bid.updateMany(
      {
        freightRequestId: freightRequest._id,
        _id: { $ne: bid._id },
        status: { $in: ['submitted', 'shortlisted'] }
      },
      { status: 'rejected' }
    );

    // Create contract
    const contract = new Contract({
      freightRequestId: freightRequest._id,
      bidId: bid._id,
      shipper: freightRequest.shipper,
      carrier: {
        companyId: bid.carrier.companyId,
        companyName: bid.carrier.companyName,
        contactName: bid.carrier.contactName,
        contactEmail: '',
        contactPhone: '',
        address: ''
      },
      cargo: {
        type: freightRequest.cargo.type,
        description: freightRequest.cargo.description,
        weight: freightRequest.cargo.weight,
        volume: freightRequest.cargo.volume,
        specialRequirements: freightRequest.cargo.specialHandling || ''
      },
      route: {
        origin: freightRequest.origin,
        destination: freightRequest.destination
      },
      schedule: {
        loadingDate: freightRequest.schedule.loadingDate,
        deliveryDeadline: freightRequest.schedule.deliveryDeadline,
        estimatedDeparture: bid.schedule.estimatedDeparture,
        estimatedArrival: bid.schedule.estimatedArrival
      },
      pricing: {
        totalAmount: bid.pricing.amount,
        currency: bid.pricing.currency,
        breakdown: bid.pricing.breakdown
      },
      paymentSchedule: [],
      terms: {
        incoterm: freightRequest.requirements.incoterm,
        paymentTerms: bid.terms.paymentTerms,
        insurance: freightRequest.requirements.insurance,
        liability: '',
        disputeResolution: '',
        cancellationPolicy: '',
        additionalTerms: bid.terms.conditions
      },
      documents: [],
      signatures: {
        shipper: {},
        carrier: {}
      },
      status: 'pendingSignatures'
    });

    await contract.save();

    res.json({
      success: true,
      data: {
        bid,
        contract
      },
      message: 'Bid accepted and contract created'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Reject bid (shipper only)
router.post('/:id/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    const freightRequest = await FreightRequest.findById(bid.freightRequestId);

    if (!freightRequest) {
      return res.status(404).json({
        success: false,
        error: 'Freight request not found'
      });
    }

    // Check authorization
    if (freightRequest.shipper.companyId !== req.user?.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reject this bid'
      });
    }

    bid.status = 'rejected';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid rejected successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

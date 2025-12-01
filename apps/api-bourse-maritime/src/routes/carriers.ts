import { Router, Response } from 'express';
import Carrier from '../models/Carrier';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// List verified carriers
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      country,
      vesselType,
      minRating,
      verified = 'true',
      page = 1,
      limit = 20
    } = req.query;

    const query: any = {};

    if (verified === 'true') {
      query.verified = true;
    }

    if (country) {
      query['company.country'] = new RegExp(country as string, 'i');
    }

    if (vesselType) {
      query['fleet.vesselTypes'] = vesselType;
    }

    if (minRating) {
      query['ratings.overall'] = { $gte: Number(minRating) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [carriers, total] = await Promise.all([
      Carrier.find(query)
        .select('-certifications -preferences') // Hide sensitive data
        .sort({ 'ratings.overall': -1 })
        .skip(skip)
        .limit(Number(limit)),
      Carrier.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: carriers,
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

// Get carrier profile
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const carrier = await Carrier.findById(req.params.id);

    if (!carrier) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

    res.json({
      success: true,
      data: carrier
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get carrier ratings
router.get('/:id/ratings', async (req: AuthRequest, res: Response) => {
  try {
    const carrier = await Carrier.findById(req.params.id).select('ratings stats');

    if (!carrier) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

    res.json({
      success: true,
      data: {
        ratings: carrier.ratings,
        stats: carrier.stats
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Rate carrier (after completed shipment)
router.post('/:id/rate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const carrier = await Carrier.findById(req.params.id);

    if (!carrier) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

    const { overall, reliability, communication, pricing } = req.body;

    // Validate ratings
    const ratings = [overall, reliability, communication, pricing];
    if (ratings.some(r => r < 0 || r > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Ratings must be between 0 and 5'
      });
    }

    // Calculate new averages
    const totalReviews = carrier.ratings.totalReviews;

    carrier.ratings.overall = (carrier.ratings.overall * totalReviews + overall) / (totalReviews + 1);
    carrier.ratings.reliability = (carrier.ratings.reliability * totalReviews + reliability) / (totalReviews + 1);
    carrier.ratings.communication = (carrier.ratings.communication * totalReviews + communication) / (totalReviews + 1);
    carrier.ratings.pricing = (carrier.ratings.pricing * totalReviews + pricing) / (totalReviews + 1);
    carrier.ratings.totalReviews += 1;

    await carrier.save();

    res.json({
      success: true,
      data: carrier.ratings,
      message: 'Rating submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Register as carrier
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if carrier already exists
    const existingCarrier = await Carrier.findOne({ companyId: req.user?.companyId });

    if (existingCarrier) {
      return res.status(400).json({
        success: false,
        error: 'Carrier already registered'
      });
    }

    const carrier = new Carrier({
      ...req.body,
      companyId: req.user?.companyId,
      verified: false
    });

    await carrier.save();

    res.status(201).json({
      success: true,
      data: carrier,
      message: 'Carrier registration submitted. Verification pending.'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update carrier profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const carrier = await Carrier.findOne({ companyId: req.user?.companyId });

    if (!carrier) {
      return res.status(404).json({
        success: false,
        error: 'Carrier profile not found'
      });
    }

    // Don't allow updating certain fields
    delete req.body.verified;
    delete req.body.verifiedAt;
    delete req.body.verifiedBy;
    delete req.body.ratings;
    delete req.body.stats;

    Object.assign(carrier, req.body);
    await carrier.save();

    res.json({
      success: true,
      data: carrier
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

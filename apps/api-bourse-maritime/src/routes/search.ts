import { Router, Response } from 'express';
import FreightRequest from '../models/FreightRequest';
import Carrier from '../models/Carrier';
import Bid from '../models/Bid';
import matchingService from '../services/matching-service';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Search available routes
router.get('/routes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { origin, destination, cargoType, dateFrom, dateTo } = req.query;

    const query: any = {
      status: { $in: ['published', 'bidding'] }
    };

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

    if (cargoType) {
      query['cargo.type'] = cargoType;
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

    const routes = await FreightRequest.find(query)
      .select('reference origin destination cargo schedule pricing bidsCount lowestBid')
      .sort({ publishedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Search carriers by criteria
router.get('/carriers', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      route,
      cargoType,
      minCapacity,
      vesselType,
      minRating,
      country
    } = req.query;

    const query: any = {
      verified: true
    };

    if (cargoType) {
      query['preferences.cargoTypes'] = cargoType;
    }

    if (vesselType) {
      query['fleet.vesselTypes'] = vesselType;
    }

    if (minRating) {
      query['ratings.overall'] = { $gte: Number(minRating) };
    }

    if (country) {
      query['company.country'] = new RegExp(country as string, 'i');
    }

    if (minCapacity) {
      query['fleet.totalCapacity'] = { $gte: Number(minCapacity) };
    }

    if (route) {
      // Search in routes
      const routeParts = (route as string).split('-');
      if (routeParts.length === 2) {
        query['routes'] = {
          $elemMatch: {
            origin: new RegExp(routeParts[0].trim(), 'i'),
            destination: new RegExp(routeParts[1].trim(), 'i')
          }
        };
      }
    }

    const carriers = await Carrier.find(query)
      .select('-certifications -preferences')
      .sort({ 'ratings.overall': -1 })
      .limit(50);

    res.json({
      success: true,
      data: carriers,
      count: carriers.length
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// AI matching for freight requests
router.post('/match/freight', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { freightRequestId } = req.body;

    if (!freightRequestId) {
      return res.status(400).json({
        success: false,
        error: 'freightRequestId is required'
      });
    }

    const matches = await matchingService.matchCarriersToFreight(freightRequestId);

    res.json({
      success: true,
      data: matches,
      message: `Found ${matches.length} potential carriers`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Market statistics
router.get('/market/stats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const daysMap: { [key: string]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const days = daysMap[period as string] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get statistics
    const [
      totalRequests,
      activeRequests,
      completedRequests,
      totalBids,
      avgBidsPerRequest,
      totalCarriers,
      verifiedCarriers
    ] = await Promise.all([
      FreightRequest.countDocuments({
        createdAt: { $gte: startDate }
      }),
      FreightRequest.countDocuments({
        status: { $in: ['published', 'bidding'] }
      }),
      FreightRequest.countDocuments({
        status: 'completed',
        updatedAt: { $gte: startDate }
      }),
      Bid.countDocuments({
        submittedAt: { $gte: startDate }
      }),
      FreightRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, avgBids: { $avg: '$bidsCount' } } }
      ]),
      Carrier.countDocuments(),
      Carrier.countDocuments({ verified: true })
    ]);

    // Get average prices by cargo type
    const avgPrices = await Bid.aggregate([
      { $match: { submittedAt: { $gte: startDate }, status: 'accepted' } },
      {
        $lookup: {
          from: 'freightrequests',
          localField: 'freightRequestId',
          foreignField: '_id',
          as: 'freightRequest'
        }
      },
      { $unwind: '$freightRequest' },
      {
        $group: {
          _id: '$freightRequest.cargo.type',
          avgPrice: { $avg: '$pricing.amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top routes
    const topRoutes = await FreightRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            origin: '$origin.port',
            destination: '$destination.port'
          },
          count: { $sum: 1 },
          avgBids: { $avg: '$bidsCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period,
        overview: {
          totalRequests,
          activeRequests,
          completedRequests,
          totalBids,
          avgBidsPerRequest: avgBidsPerRequest[0]?.avgBids || 0,
          totalCarriers,
          verifiedCarriers
        },
        avgPricesByCargoType: avgPrices,
        topRoutes
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

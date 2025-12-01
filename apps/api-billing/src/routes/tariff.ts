import { Router, Request, Response } from 'express';
import { TariffGrid } from '../models';

const router = Router();

// Create tariff grid
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      carrier,
      client,
      validFrom,
      validTo,
      zones,
      fuelSurcharge,
      options,
      currency = 'EUR',
      tva = 20,
      priority = 0,
      userId
    } = req.body;

    const reference = `TARIFF-${Date.now()}-${carrier.id.substring(0, 6).toUpperCase()}`;

    const tariffGrid = new TariffGrid({
      reference,
      name,
      carrier,
      client,
      validFrom,
      validTo,
      zones,
      fuelSurcharge,
      options,
      currency,
      tva,
      status: 'draft',
      priority,
      createdBy: userId || 'system'
    });

    await tariffGrid.save();

    res.status(201).json({
      success: true,
      data: tariffGrid
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List tariffs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { carrierId, clientId, status, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (carrierId) filter['carrier.id'] = carrierId;
    if (clientId) filter['client.id'] = clientId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [tariffs, total] = await Promise.all([
      TariffGrid.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TariffGrid.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: tariffs,
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

// Get tariff details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tariff = await TariffGrid.findById(req.params.id);

    if (!tariff) {
      return res.status(404).json({
        success: false,
        error: 'Tariff grid not found'
      });
    }

    res.json({
      success: true,
      data: tariff
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update tariff
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tariff = await TariffGrid.findById(req.params.id);

    if (!tariff) {
      return res.status(404).json({
        success: false,
        error: 'Tariff grid not found'
      });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.reference;
    delete updates.createdAt;
    delete updates.createdBy;

    Object.assign(tariff, updates);
    await tariff.save();

    res.json({
      success: true,
      data: tariff
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

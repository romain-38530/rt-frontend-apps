import { Router, Request, Response } from 'express';
import { Prefacturation } from '../models';

const router = Router();

// Generate prefacturation from order data
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { carrierId, clientId, period, orders } = req.body;

    // Generate reference
    const reference = `PRE-${Date.now()}-${carrierId.substring(0, 6).toUpperCase()}`;

    // Calculate totals
    let baseAmount = 0;
    let fuelSurcharge = 0;
    let optionsTotal = 0;
    let totalHT = 0;
    let tva = 0;
    let discrepancyAmount = 0;
    let discrepanciesCount = 0;

    const lines = orders.map((order: any) => {
      const lineBase = order.weight * (order.pricePerKg || 0);
      const lineFuel = lineBase * (order.fuelSurchargeRate || 0.1);
      const lineOptions = order.options?.reduce((sum: number, opt: any) => sum + opt.amount, 0) || 0;
      const lineHT = lineBase + lineFuel + lineOptions;
      const lineTVA = lineHT * 0.2;

      baseAmount += lineBase;
      fuelSurcharge += lineFuel;
      optionsTotal += lineOptions;
      totalHT += lineHT;
      tva += lineTVA;

      const discrepancies = order.discrepancies || [];
      if (discrepancies.length > 0) {
        discrepanciesCount += discrepancies.length;
        discrepancyAmount += discrepancies.reduce((sum: number, d: any) => sum + (d.impact || 0), 0);
      }

      return {
        orderReference: order.reference,
        deliveryDate: order.deliveryDate,
        origin: order.origin,
        destination: order.destination,
        weight: order.weight,
        pallets: order.pallets,
        tariffCode: order.tariffCode || 'STANDARD',
        baseAmount: lineBase,
        fuelSurcharge: lineFuel,
        options: order.options || [],
        totalHT: lineHT,
        tva: lineTVA,
        totalTTC: lineHT + lineTVA,
        discrepancies
      };
    });

    const prefacturation = new Prefacturation({
      reference,
      carrier: req.body.carrier,
      client: req.body.client,
      period,
      lines,
      totals: {
        baseAmount,
        fuelSurcharge,
        options: optionsTotal,
        totalHT,
        tva,
        totalTTC: totalHT + tva,
        discrepancyAmount
      },
      status: 'draft',
      hasDiscrepancies: discrepanciesCount > 0,
      discrepanciesCount,
      blocks: [],
      createdBy: req.body.userId || 'system'
    });

    await prefacturation.save();

    res.status(201).json({
      success: true,
      data: prefacturation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get prefacturation details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    res.json({
      success: true,
      data: prefacturation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List prefacturations with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { carrierId, status, hasDiscrepancies, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (carrierId) filter['carrier.id'] = carrierId;
    if (status) filter.status = status;
    if (hasDiscrepancies !== undefined) filter.hasDiscrepancies = hasDiscrepancies === 'true';
    if (startDate || endDate) {
      filter['period.start'] = {};
      if (startDate) filter['period.start'].$gte = new Date(startDate as string);
      if (endDate) filter['period.start'].$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [prefacturations, total] = await Promise.all([
      Prefacturation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Prefacturation.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: prefacturations,
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

// Finalize prefacturation to invoice
router.post('/:id/finalize', async (req: Request, res: Response) => {
  try {
    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    if (prefacturation.status === 'paid' || prefacturation.status === 'invoice_accepted') {
      return res.status(400).json({
        success: false,
        error: 'Prefacturation already finalized'
      });
    }

    if (prefacturation.blocks.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot finalize prefacturation with active blocks',
        blocks: prefacturation.blocks
      });
    }

    prefacturation.status = 'invoice_accepted';
    prefacturation.finalizationDate = new Date();
    prefacturation.invoiceReference = `INV-${Date.now()}-${prefacturation.carrier.id.substring(0, 6).toUpperCase()}`;

    await prefacturation.save();

    res.json({
      success: true,
      data: prefacturation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download prefacturation PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    // In production, generate actual PDF
    const pdfUrl = `/files/prefacturations/${prefacturation.reference}.pdf`;

    res.json({
      success: true,
      data: {
        pdfUrl,
        reference: prefacturation.reference
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

/**
 * Routes Demo/Prefacturation pour le portail industriel
 * Compatible avec le frontend web-industry/billing.tsx
 */
import { Router, Request, Response } from 'express';
import { Prefacturation } from '../models';

const router = Router();

// Helper to transform DB document to frontend format
function transformToFrontendFormat(doc: any) {
  return {
    preInvoiceId: doc._id.toString(),
    preInvoiceNumber: doc.reference,
    period: {
      month: doc.period?.month || new Date(doc.period?.start).getMonth() + 1,
      year: doc.period?.year || new Date(doc.period?.start).getFullYear(),
      startDate: doc.period?.start,
      endDate: doc.period?.end
    },
    industrialId: doc.client?.id,
    industrialName: doc.client?.name,
    industrialEmail: doc.client?.email,
    carrierId: doc.carrier?.id,
    carrierName: doc.carrier?.name,
    carrierEmail: doc.carrier?.email,
    carrierSiret: doc.carrier?.siret,
    lines: doc.lines?.map((line: any) => ({
      orderId: line.orderReference,
      orderReference: line.orderReference,
      pickupDate: line.deliveryDate,
      deliveryDate: line.deliveryDate,
      pickupCity: line.origin,
      deliveryCity: line.destination,
      baseAmount: line.baseAmount,
      waitingHours: 0,
      waitingAmount: 0,
      delayHours: 0,
      delayPenalty: 0,
      fuelSurcharge: line.fuelSurcharge,
      tolls: 0,
      otherCharges: line.options?.reduce((sum: number, o: any) => sum + o.amount, 0) || 0,
      totalAmount: line.totalTTC,
      cmrValidated: true,
      kpiData: {
        onTimePickup: true,
        onTimeDelivery: true,
        documentsComplete: true,
        incidentFree: !line.discrepancies?.length
      }
    })) || [],
    totals: {
      baseAmount: doc.totals?.baseAmount || 0,
      waitingAmount: 0,
      delayPenalty: 0,
      fuelSurcharge: doc.totals?.fuelSurcharge || 0,
      tolls: 0,
      otherCharges: doc.totals?.options || 0,
      subtotalHT: doc.totals?.totalHT || 0,
      tvaRate: 20,
      tvaAmount: doc.totals?.tva || 0,
      totalTTC: doc.totals?.totalTTC || 0
    },
    kpis: doc.kpis || {
      totalOrders: doc.lines?.length || 0,
      onTimePickupRate: 95,
      onTimeDeliveryRate: 92,
      documentsCompleteRate: 98,
      incidentFreeRate: 97,
      averageWaitingHours: 0.5
    },
    status: doc.status,
    industrialValidation: doc.industrialValidation,
    carrierInvoice: doc.carrierInvoice,
    invoiceControl: doc.invoiceControl,
    payment: doc.payment ? {
      ...doc.payment,
      daysRemaining: doc.payment.dueDate
        ? Math.ceil((new Date(doc.payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30
    } : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

/**
 * GET /billing/demo/prefacturations
 * Liste des préfactures avec filtres (compatible frontend)
 */
router.get('/prefacturations', async (req: Request, res: Response) => {
  try {
    const { industrialId, carrierId, status, month, year, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (industrialId) filter['client.id'] = industrialId;
    if (carrierId) filter['carrier.id'] = carrierId;
    if (status && status !== 'all') filter.status = status;

    // Filter by month/year
    if (month && year) {
      filter['period.month'] = Number(month);
      filter['period.year'] = Number(year);
    } else if (year) {
      filter['period.year'] = Number(year);
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
      data: prefacturations.map(transformToFrontendFormat),
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

/**
 * GET /billing/demo/stats
 * Statistiques des préfactures (compatible frontend)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.query;

    const filter: any = {};
    if (industrialId) filter['client.id'] = industrialId;

    // Get counts by status
    const statusCounts = await Prefacturation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totals.totalTTC' }
        }
      }
    ]);

    // Build byStatus object
    const byStatus: Record<string, number> = {};
    let totalAmountPending = 0;
    let totalAmountPaid = 0;

    statusCounts.forEach((item: any) => {
      byStatus[item._id] = item.count;
      if (['pending', 'sent_to_industrial', 'validated_industrial', 'invoice_uploaded', 'invoice_accepted', 'payment_pending'].includes(item._id)) {
        totalAmountPending += item.totalAmount;
      }
      if (item._id === 'paid') {
        totalAmountPaid += item.totalAmount;
      }
    });

    // Total prefactures
    const totalPreInvoices = await Prefacturation.countDocuments(filter);

    // Average payment days
    const paidPrefactures = await Prefacturation.find({
      ...filter,
      status: 'paid',
      'payment.paidAt': { $exists: true }
    }).select('createdAt payment.paidAt');

    let averagePaymentDays = 0;
    if (paidPrefactures.length > 0) {
      const totalDays = paidPrefactures.reduce((sum, p) => {
        if (p.payment?.paidAt && p.createdAt) {
          return sum + Math.ceil((new Date(p.payment.paidAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        }
        return sum;
      }, 0);
      averagePaymentDays = Math.round(totalDays / paidPrefactures.length);
    }

    res.json({
      success: true,
      data: {
        totalPreInvoices,
        byStatus,
        totalAmountPending,
        totalAmountPaid,
        averagePaymentDays
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /billing/prefacturation/:id
 * Détail d'une préfacture
 */
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
      data: transformToFrontendFormat(prefacturation)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /billing/prefacturation/:id/validate
 * Validation par l'industriel
 */
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { validatedBy, comments, adjustments } = req.body;

    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    // Check status allows validation
    if (!['sent_to_industrial', 'pending'].includes(prefacturation.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot validate prefacturation with status: ${prefacturation.status}`
      });
    }

    // Apply adjustments if any
    if (adjustments && adjustments.length > 0) {
      adjustments.forEach((adj: { lineIndex: number; adjustedAmount: number; reason: string }) => {
        if (prefacturation.lines[adj.lineIndex]) {
          const line = prefacturation.lines[adj.lineIndex];
          const diff = adj.adjustedAmount - line.totalTTC;
          line.totalTTC = adj.adjustedAmount;
          line.totalHT = adj.adjustedAmount / 1.2;
          // Add adjustment note to discrepancies
          if (!line.discrepancies) line.discrepancies = [];
          line.discrepancies.push({
            type: 'tariff',
            description: `Adjustment: ${adj.reason}`,
            expectedValue: line.totalTTC,
            actualValue: adj.adjustedAmount,
            impact: diff
          });
        }
      });
      // Recalculate totals
      prefacturation.totals.totalTTC = prefacturation.lines.reduce((sum, l) => sum + l.totalTTC, 0);
      prefacturation.totals.totalHT = prefacturation.totals.totalTTC / 1.2;
      prefacturation.totals.tva = prefacturation.totals.totalTTC - prefacturation.totals.totalHT;
    }

    // Update validation info
    prefacturation.industrialValidation = {
      validatedAt: new Date(),
      validatedBy: validatedBy || 'Industriel',
      comments
    };
    prefacturation.status = 'validated_industrial';
    prefacturation.validationDate = new Date();

    // Set payment due date (30 days from validation)
    if (!prefacturation.payment) {
      prefacturation.payment = {
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTermDays: 30,
        daysRemaining: 30
      } as any;
    }

    await prefacturation.save();

    res.json({
      success: true,
      data: transformToFrontendFormat(prefacturation),
      message: 'Prefacturation validated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /billing/prefacturation/:id/mark-paid
 * Marquer comme payé
 */
router.post('/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const { paymentReference, paidAmount } = req.body;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required'
      });
    }

    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    // Update payment info
    const paymentData = prefacturation.payment || {} as any;
    paymentData.paidAt = new Date();
    paymentData.paidAmount = paidAmount || prefacturation.totals.totalTTC;
    paymentData.paymentReference = paymentReference;
    paymentData.daysRemaining = 0;
    (prefacturation as any).payment = paymentData;
    prefacturation.status = 'paid';

    await prefacturation.save();

    res.json({
      success: true,
      data: transformToFrontendFormat(prefacturation),
      message: 'Payment recorded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /billing/prefacturations/export
 * Export CSV des préfactures pour paiement
 */
router.get('/prefacturations/export', async (req: Request, res: Response) => {
  try {
    const { industrialId, status = 'payment_pending' } = req.query;

    const filter: any = { status };
    if (industrialId) filter['client.id'] = industrialId;

    const prefacturations = await Prefacturation.find(filter).sort({ createdAt: -1 });

    // Generate CSV content
    const csvRows = [
      ['Reference', 'Transporteur', 'SIRET', 'IBAN', 'BIC', 'Montant HT', 'TVA', 'Montant TTC', 'Echeance', 'Periode'].join(';')
    ];

    prefacturations.forEach(p => {
      csvRows.push([
        p.reference,
        p.carrier.name,
        p.carrier.siret || '',
        p.payment?.bankDetails?.iban || '',
        p.payment?.bankDetails?.bic || '',
        p.totals.totalHT.toFixed(2),
        p.totals.tva.toFixed(2),
        p.totals.totalTTC.toFixed(2),
        p.payment?.dueDate ? new Date(p.payment.dueDate).toLocaleDateString('fr-FR') : '',
        `${p.period.month}/${p.period.year}`
      ].join(';'));
    });

    const csvContent = csvRows.join('\n');

    res.json({
      success: true,
      data: {
        csv: csvContent,
        filename: `export_prefactures_${new Date().toISOString().split('T')[0]}.csv`,
        count: prefacturations.length,
        totalAmount: prefacturations.reduce((sum, p) => sum + p.totals.totalTTC, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /billing/prefacturations/send-monthly
 * Générer et envoyer les préfactures mensuelles
 */
router.post('/prefacturations/send-monthly', async (req: Request, res: Response) => {
  try {
    // Update all draft prefactures to sent_to_industrial
    const result = await Prefacturation.updateMany(
      { status: 'draft' },
      {
        $set: {
          status: 'sent_to_industrial',
          'payment.dueDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          'payment.paymentTermDays': 30,
          'payment.daysRemaining': 30
        }
      }
    );

    res.json({
      success: true,
      data: {
        updated: result.modifiedCount
      },
      message: `${result.modifiedCount} prefactures sent to industrials`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /billing/prefacturations/update-countdowns
 * Mettre à jour les décomptes de paiement (J-30)
 */
router.post('/prefacturations/update-countdowns', async (req: Request, res: Response) => {
  try {
    const prefacturations = await Prefacturation.find({
      status: { $in: ['validated_industrial', 'invoice_accepted', 'payment_pending'] },
      'payment.dueDate': { $exists: true }
    });

    let updated = 0;
    for (const p of prefacturations) {
      if (p.payment?.dueDate) {
        const daysRemaining = Math.ceil(
          (new Date(p.payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        p.payment.daysRemaining = daysRemaining;
        await p.save();
        updated++;
      }
    }

    res.json({
      success: true,
      data: { updated },
      message: `${updated} countdowns updated`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /billing/prefacturation/:id/dispute
 * Contester une préfacture
 */
router.post('/:id/dispute', async (req: Request, res: Response) => {
  try {
    const { reason, disputedLines } = req.body;

    const prefacturation = await Prefacturation.findById(req.params.id);

    if (!prefacturation) {
      return res.status(404).json({
        success: false,
        error: 'Prefacturation not found'
      });
    }

    prefacturation.status = 'disputed';
    prefacturation.blocks.push({
      type: 'dispute',
      reason: reason || 'Contested by industrial'
    });

    await prefacturation.save();

    res.json({
      success: true,
      data: transformToFrontendFormat(prefacturation),
      message: 'Dispute registered'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

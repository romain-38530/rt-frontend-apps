import { Router, Request, Response } from 'express';
import { ERPExport, Prefacturation } from '../models';

const router = Router();

// Export to ERP
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      prefacturationIds,
      erpSystem,
      format,
      type = 'invoices',
      period,
      userId,
      metadata
    } = req.body;

    const reference = `ERP-${Date.now()}-${erpSystem.toUpperCase()}`;

    // Fetch prefacturations
    const prefacturations = await Prefacturation.find({
      _id: { $in: prefacturationIds }
    });

    if (prefacturations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No prefacturations found'
      });
    }

    // Generate ERP lines
    const lines = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const pref of prefacturations) {
      // Client debit (receivable)
      lines.push({
        accountCode: '411000',
        accountLabel: 'Clients',
        debit: pref.totals.totalTTC,
        credit: 0,
        label: `Facture ${pref.invoiceReference || pref.reference}`,
        reference: pref.reference,
        analyticalCode: pref.client.id
      });
      totalDebit += pref.totals.totalTTC;

      // Revenue credit
      lines.push({
        accountCode: '706000',
        accountLabel: 'Prestations de services',
        debit: 0,
        credit: pref.totals.totalHT,
        label: `Facture ${pref.invoiceReference || pref.reference}`,
        reference: pref.reference,
        analyticalCode: pref.carrier.id
      });
      totalCredit += pref.totals.totalHT;

      // VAT credit
      lines.push({
        accountCode: '445710',
        accountLabel: 'TVA collectée',
        debit: 0,
        credit: pref.totals.tva,
        label: `TVA Facture ${pref.invoiceReference || pref.reference}`,
        reference: pref.reference
      });
      totalCredit += pref.totals.tva;
    }

    const erpExport = new ERPExport({
      reference,
      exportDate: new Date(),
      period: period || {
        start: new Date(Math.min(...prefacturations.map(p => p.period.start.getTime()))),
        end: new Date(Math.max(...prefacturations.map(p => p.period.end.getTime())))
      },
      erpSystem,
      format,
      type,
      status: 'pending',
      prefacturations: prefacturations.map(p => ({
        id: p._id.toString(),
        reference: p.reference,
        amount: p.totals.totalTTC
      })),
      lines,
      totals: {
        linesCount: lines.length,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit
      },
      validation: {
        isValid: Math.abs(totalDebit - totalCredit) < 0.01,
        errors: Math.abs(totalDebit - totalCredit) >= 0.01 ? ['Debit/Credit imbalance'] : [],
        warnings: []
      },
      metadata,
      createdBy: userId || 'system'
    });

    // Generate file (simulated)
    erpExport.status = 'completed';
    erpExport.fileName = `${reference}.${format}`;
    erpExport.fileUrl = `/files/erp-exports/${reference}.${format}`;
    erpExport.fileSize = 1024 * lines.length;

    await erpExport.save();

    res.status(201).json({
      success: true,
      data: erpExport
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List exports history
router.get('/', async (req: Request, res: Response) => {
  try {
    const { erpSystem, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (erpSystem) filter.erpSystem = erpSystem;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.exportDate = {};
      if (startDate) filter.exportDate.$gte = new Date(startDate as string);
      if (endDate) filter.exportDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [exports, total] = await Promise.all([
      ERPExport.find(filter)
        .sort({ exportDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ERPExport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: exports,
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

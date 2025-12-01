import { Router, Request, Response } from 'express';
import { Prefacturation, Block, Dispute, ERPExport, CarrierVigilance } from '../models';

const router = Router();

// Get dashboard statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Prefacturations stats
    const [
      totalPrefacturations,
      draftPrefacturations,
      validatedPrefacturations,
      finalizedPrefacturations,
      prefacturationsWithDiscrepancies,
      totalAmount
    ] = await Promise.all([
      Prefacturation.countDocuments({
        createdAt: { $gte: startDate }
      }),
      Prefacturation.countDocuments({
        status: 'draft',
        createdAt: { $gte: startDate }
      }),
      Prefacturation.countDocuments({
        status: 'validated',
        createdAt: { $gte: startDate }
      }),
      Prefacturation.countDocuments({
        status: 'finalized',
        createdAt: { $gte: startDate }
      }),
      Prefacturation.countDocuments({
        hasDiscrepancies: true,
        createdAt: { $gte: startDate }
      }),
      Prefacturation.aggregate([
        {
          $match: {
            status: { $in: ['finalized', 'invoiced'] },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totals.totalTTC' }
          }
        }
      ])
    ]);

    // Blocks stats
    const [activeBlocks, blocksByType] = await Promise.all([
      Block.countDocuments({ status: 'active' }),
      Block.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Disputes stats
    const [openDisputes, disputesByStatus] = await Promise.all([
      Dispute.countDocuments({
        status: { $in: ['open', 'under_review'] }
      }),
      Dispute.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount.disputed' }
          }
        }
      ])
    ]);

    // ERP Exports stats
    const [totalExports, recentExports] = await Promise.all([
      ERPExport.countDocuments({
        exportDate: { $gte: startDate }
      }),
      ERPExport.find({
        exportDate: { $gte: startDate }
      })
        .sort({ exportDate: -1 })
        .limit(5)
        .select('reference exportDate status totals')
    ]);

    // Carrier vigilance stats
    const [
      totalCarriers,
      compliantCarriers,
      nonCompliantCarriers,
      carriersWithAlerts
    ] = await Promise.all([
      CarrierVigilance.countDocuments(),
      CarrierVigilance.countDocuments({ overallStatus: 'compliant' }),
      CarrierVigilance.countDocuments({ overallStatus: 'non_compliant' }),
      CarrierVigilance.countDocuments({ 'alerts.0': { $exists: true } })
    ]);

    // Amount by status
    const amountByStatus = await Prefacturation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totals.totalTTC' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        prefacturations: {
          total: totalPrefacturations,
          draft: draftPrefacturations,
          validated: validatedPrefacturations,
          finalized: finalizedPrefacturations,
          withDiscrepancies: prefacturationsWithDiscrepancies,
          totalAmount: totalAmount[0]?.total || 0,
          byStatus: amountByStatus
        },
        blocks: {
          active: activeBlocks,
          byType: blocksByType.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        disputes: {
          open: openDisputes,
          byStatus: disputesByStatus
        },
        exports: {
          total: totalExports,
          recent: recentExports
        },
        vigilance: {
          totalCarriers,
          compliant: compliantCarriers,
          nonCompliant: nonCompliantCarriers,
          withAlerts: carriersWithAlerts,
          complianceRate: totalCarriers > 0 ? (compliantCarriers / totalCarriers * 100).toFixed(2) : 0
        }
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

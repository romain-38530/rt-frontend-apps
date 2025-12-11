/**
 * Routes AI Reports - Endpoints pour les rapports d'analyse IA
 */
import { Router, Request, Response } from 'express';
import AIAnalyticsService from '../services/ai-analytics-service';
import aiReportScheduler from '../services/ai-report-scheduler';
import AIReport from '../models/AIReport';

const router = Router();

/**
 * GET /api/v1/ai-reports/industrial/:industrialId/latest
 * Récupère le dernier rapport pour un industriel
 */
router.get('/industrial/:industrialId/latest', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;

    const report = await AIAnalyticsService.getLatestReport('industrial', industrialId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Aucun rapport disponible pour cet industriel'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error fetching industrial report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/carrier/:carrierId/latest
 * Récupère le dernier rapport pour un transporteur
 */
router.get('/carrier/:carrierId/latest', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;

    const report = await AIAnalyticsService.getLatestReport('carrier', carrierId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Aucun rapport disponible pour ce transporteur'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error fetching carrier report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/logistician/:userId/latest
 * Récupère le dernier rapport pour un logisticien
 */
router.get('/logistician/:userId/latest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const report = await AIAnalyticsService.getLatestReport('logistician', userId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Aucun rapport disponible pour ce logisticien'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error fetching logistician report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/industrial/:industrialId/history
 * Liste les rapports historiques d'un industriel
 */
router.get('/industrial/:industrialId/history', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;

    const reports = await AIAnalyticsService.listReports('industrial', industrialId, limit);

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error: any) {
    console.error('[AI Reports] Error listing industrial reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/carrier/:carrierId/history
 * Liste les rapports historiques d'un transporteur
 */
router.get('/carrier/:carrierId/history', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;

    const reports = await AIAnalyticsService.listReports('carrier', carrierId, limit);

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error: any) {
    console.error('[AI Reports] Error listing carrier reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/logistician/:userId/history
 * Liste les rapports historiques d'un logisticien
 */
router.get('/logistician/:userId/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;

    const reports = await AIAnalyticsService.listReports('logistician', userId, limit);

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error: any) {
    console.error('[AI Reports] Error listing logistician reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/stats
 * Statistiques globales des rapports IA
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalReports, byType, byMonth, avgFeedback] = await Promise.all([
      AIReport.countDocuments({ status: 'completed' }),
      AIReport.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$reportType', count: { $sum: 1 } } }
      ]),
      AIReport.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: { year: '$period.year', month: '$period.month' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ]),
      AIReport.aggregate([
        { $match: { 'userFeedback.rating': { $exists: true } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$userFeedback.rating' },
            helpfulCount: { $sum: { $cond: ['$userFeedback.helpful', 1, 0] } },
            totalFeedback: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalReports,
        byType: byType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byMonth: byMonth.map((m: any) => ({
          year: m._id.year,
          month: m._id.month,
          count: m.count
        })),
        feedback: avgFeedback[0] || { avgRating: 0, helpfulCount: 0, totalFeedback: 0 }
      }
    });
  } catch (error: any) {
    console.error('[AI Reports] Error fetching stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/ai-reports/trigger-monthly
 * Déclenche manuellement la génération de tous les rapports mensuels (admin)
 */
router.post('/trigger-monthly', async (req: Request, res: Response) => {
  try {
    aiReportScheduler.generateAllMonthlyReports().catch(err => {
      console.error('[AI Reports] Background generation error:', err);
    });

    res.json({
      success: true,
      message: 'Génération des rapports mensuels lancée en arrière-plan'
    });
  } catch (error: any) {
    console.error('[AI Reports] Error triggering monthly reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/ai-reports/:reportId
 * Récupère un rapport spécifique par son ID
 */
router.get('/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await AIReport.findOne({ reportId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error fetching report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/ai-reports/generate/industrial
 * Génère manuellement un rapport industriel
 */
router.post('/generate/industrial', async (req: Request, res: Response) => {
  try {
    const { industrialId, industrialName, month, year } = req.body;

    if (!industrialId || !industrialName) {
      return res.status(400).json({
        success: false,
        message: 'industrialId et industrialName sont requis'
      });
    }

    const report = await aiReportScheduler.generateManualReport(
      'industrial',
      industrialId,
      industrialName,
      month,
      year
    );

    res.json({
      success: true,
      message: 'Rapport généré avec succès',
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error generating industrial report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/ai-reports/generate/carrier
 * Génère manuellement un rapport transporteur
 */
router.post('/generate/carrier', async (req: Request, res: Response) => {
  try {
    const { carrierId, carrierName, month, year } = req.body;

    if (!carrierId || !carrierName) {
      return res.status(400).json({
        success: false,
        message: 'carrierId et carrierName sont requis'
      });
    }

    const report = await aiReportScheduler.generateManualReport(
      'carrier',
      carrierId,
      carrierName,
      month,
      year
    );

    res.json({
      success: true,
      message: 'Rapport généré avec succès',
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error generating carrier report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/ai-reports/generate/logistician
 * Génère manuellement un rapport logisticien
 */
router.post('/generate/logistician', async (req: Request, res: Response) => {
  try {
    const { userId, userName, month, year } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'userId et userName sont requis'
      });
    }

    const report = await aiReportScheduler.generateManualReport(
      'logistician',
      userId,
      userName,
      month,
      year
    );

    res.json({
      success: true,
      message: 'Rapport généré avec succès',
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error generating logistician report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/ai-reports/:reportId/feedback
 * Soumet un feedback sur un rapport
 */
router.post('/:reportId/feedback', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { rating, helpful, comment } = req.body;

    if (!rating || helpful === undefined) {
      return res.status(400).json({
        success: false,
        message: 'rating et helpful sont requis'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating doit être entre 1 et 5'
      });
    }

    const report = await AIAnalyticsService.submitFeedback(
      reportId,
      rating as 1 | 2 | 3 | 4 | 5,
      helpful,
      comment
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Feedback enregistré',
      report
    });
  } catch (error: any) {
    console.error('[AI Reports] Error submitting feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

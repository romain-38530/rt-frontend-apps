/**
 * Routes Analytics - KPIs SYMPHONI.A
 * Endpoints pour recuperer les indicateurs de performance
 */
import { Router, Request, Response } from 'express';
import AnalyticsService from '../services/analytics-service';

const router = Router();

// Helper pour parser les dates de periode
function getPeriodDates(req: Request): { startDate: Date; endDate: Date } {
  const now = new Date();
  const { startDate, endDate, period } = req.query;

  if (startDate && endDate) {
    return {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };
  }

  // Periodes predefinies
  switch (period) {
    case 'week':
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      };
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now
      };
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return {
        startDate: quarterStart,
        endDate: now
      };
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now
      };
    case 'last30':
    default:
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      };
  }
}

// ============================================
// ENDPOINTS INDUSTRIEL
// ============================================

/**
 * Dashboard resume pour un industriel
 * GET /api/v1/analytics/industrial/:industrialId/dashboard
 */
router.get('/industrial/:industrialId/dashboard', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const dashboard = await AnalyticsService.getIndustrialDashboard(
      industrialId,
      startDate,
      endDate
    );

    res.json(dashboard);
  } catch (error: any) {
    console.error('[Analytics] Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * KPIs d'un transporteur specifique pour un industriel
 * GET /api/v1/analytics/industrial/:industrialId/carrier/:carrierId
 */
router.get('/industrial/:industrialId/carrier/:carrierId', async (req: Request, res: Response) => {
  try {
    const { industrialId, carrierId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const kpis = await AnalyticsService.getCarrierKPIs(
      carrierId,
      industrialId,
      startDate,
      endDate
    );

    res.json(kpis);
  } catch (error: any) {
    console.error('[Analytics] Carrier KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Classement des transporteurs pour un industriel
 * GET /api/v1/analytics/industrial/:industrialId/carriers
 */
router.get('/industrial/:industrialId/carriers', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const ranking = await AnalyticsService.getCarriersRanking(
      industrialId,
      startDate,
      endDate
    );

    res.json({
      period: { startDate, endDate },
      carriers: ranking,
      total: ranking.length
    });
  } catch (error: any) {
    console.error('[Analytics] Carriers ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Comparaison de transporteurs
 * POST /api/v1/analytics/industrial/:industrialId/compare
 * Body: { carrierIds: string[] }
 */
router.post('/industrial/:industrialId/compare', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;
    const { carrierIds } = req.body;
    const { startDate, endDate } = getPeriodDates(req);

    if (!carrierIds || !Array.isArray(carrierIds)) {
      return res.status(400).json({ error: 'carrierIds array required' });
    }

    const comparisons = await Promise.all(
      carrierIds.map(carrierId =>
        AnalyticsService.getCarrierKPIs(carrierId, industrialId, startDate, endDate)
      )
    );

    res.json({
      period: { startDate, endDate },
      carriers: comparisons
    });
  } catch (error: any) {
    console.error('[Analytics] Compare carriers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINTS TRANSPORTEUR
// ============================================

/**
 * KPIs d'un industriel specifique pour un transporteur
 * GET /api/v1/analytics/carrier/:carrierId/industrial/:industrialId
 */
router.get('/carrier/:carrierId/industrial/:industrialId', async (req: Request, res: Response) => {
  try {
    const { carrierId, industrialId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const kpis = await AnalyticsService.getIndustrialKPIs(
      industrialId,
      carrierId,
      startDate,
      endDate
    );

    res.json(kpis);
  } catch (error: any) {
    console.error('[Analytics] Industrial KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Classement des industriels pour un transporteur
 * GET /api/v1/analytics/carrier/:carrierId/industrials
 */
router.get('/carrier/:carrierId/industrials', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const ranking = await AnalyticsService.getIndustrialsRanking(
      carrierId,
      startDate,
      endDate
    );

    res.json({
      period: { startDate, endDate },
      industrials: ranking,
      total: ranking.length
    });
  } catch (error: any) {
    console.error('[Analytics] Industrials ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Resume global pour un transporteur
 * GET /api/v1/analytics/carrier/:carrierId/summary
 */
router.get('/carrier/:carrierId/summary', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const industrials = await AnalyticsService.getIndustrialsRanking(
      carrierId,
      startDate,
      endDate
    );

    // Agreger les metriques
    const summary = {
      period: { startDate, endDate },
      totalIndustrials: industrials.length,
      totalRevenue: industrials.reduce((sum, i) => sum + i.activity.totalRevenue, 0),
      totalOrders: industrials.reduce((sum, i) => sum + i.activity.totalOrders, 0),
      averageWaitingTime: industrials.length > 0
        ? industrials.reduce((sum, i) => sum + i.workingConditions.averageWaitingTimeMinutes, 0) / industrials.length
        : 0,
      averagePaymentDelay: industrials.length > 0
        ? industrials.reduce((sum, i) => sum + i.payments.averagePaymentDelayDays, 0) / industrials.length
        : 0,
      topIndustrials: industrials.slice(0, 5).map(i => ({
        industrialId: i.industrialId,
        industrialName: i.industrialName,
        revenue: i.activity.totalRevenue,
        orders: i.activity.totalOrders,
        revenueShare: i.activity.revenueShare
      })),
      industryBreakdown: industrials.map(i => ({
        industrialId: i.industrialId,
        industrialName: i.industrialName,
        revenueShare: i.activity.revenueShare
      }))
    };

    res.json(summary);
  } catch (error: any) {
    console.error('[Analytics] Carrier summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINTS LOGISTICIEN
// ============================================

/**
 * KPIs d'un logisticien
 * GET /api/v1/analytics/logistician/:userId
 */
router.get('/logistician/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const kpis = await AnalyticsService.getLogisticianKPIs(
      userId,
      startDate,
      endDate
    );

    res.json(kpis);
  } catch (error: any) {
    console.error('[Analytics] Logistician KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * KPIs equipe logistique (tous les logisticiens)
 * GET /api/v1/analytics/logisticians
 */
router.get('/logisticians', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getPeriodDates(req);
    const { industrialId } = req.query;

    // TODO: Recuperer la liste des logisticiens depuis le service auth
    // Pour l'instant, retourner des metriques globales
    const globalKpis = await AnalyticsService.getLogisticianKPIs(
      'global',
      startDate,
      endDate
    );

    res.json({
      period: { startDate, endDate },
      team: globalKpis,
      // TODO: ajouter metriques individuelles
      members: []
    });
  } catch (error: any) {
    console.error('[Analytics] Team KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXPORTS & RAPPORTS
// ============================================

/**
 * Export CSV des KPIs transporteurs
 * GET /api/v1/analytics/industrial/:industrialId/export
 */
router.get('/industrial/:industrialId/export', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const ranking = await AnalyticsService.getCarriersRanking(
      industrialId,
      startDate,
      endDate
    );

    // Generer CSV
    const headers = [
      'Rang', 'Transporteur', 'Score Global',
      'Taux Acceptation', 'Ponctualite Enlevement', 'Ponctualite Livraison',
      'Attente Moyenne (min)', 'Taux Incidents', 'CA Total'
    ];

    const rows = ranking.map(c => [
      c.ranking,
      c.carrierName,
      c.globalScore.toFixed(1),
      c.operational.acceptanceRate.toFixed(1) + '%',
      c.punctuality.onTimePickupRate.toFixed(1) + '%',
      c.punctuality.onTimeDeliveryRate.toFixed(1) + '%',
      c.waitingTimes.averageLoadingWaitMinutes.toFixed(0),
      c.incidents.incidentRate.toFixed(1) + '%',
      c.financial.totalRevenue.toFixed(2) + ' EUR'
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=kpis-transporteurs-${industrialId}.csv`);
    res.send('\ufeff' + csv); // BOM for Excel
  } catch (error: any) {
    console.error('[Analytics] Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export CSV des KPIs industriels pour transporteur
 * GET /api/v1/analytics/carrier/:carrierId/export
 */
router.get('/carrier/:carrierId/export', async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const { startDate, endDate } = getPeriodDates(req);

    const industrials = await AnalyticsService.getIndustrialsRanking(
      carrierId,
      startDate,
      endDate
    );

    const headers = [
      'Industriel', 'Commandes', 'CA Total', 'Part CA (%)',
      'Prix Moyen/Commande', 'Attente Moyenne (min)', 'Delai Paiement (j)',
      'Taux Paiement OK (%)'
    ];

    const rows = industrials.map(i => [
      i.industrialName,
      i.activity.totalOrders,
      i.activity.totalRevenue.toFixed(2) + ' EUR',
      i.activity.revenueShare.toFixed(1) + '%',
      i.profitability.averagePricePerOrder.toFixed(2) + ' EUR',
      i.workingConditions.averageWaitingTimeMinutes.toFixed(0),
      i.payments.averagePaymentDelayDays,
      i.payments.onTimePaymentRate.toFixed(1) + '%'
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=kpis-industriels-${carrierId}.csv`);
    res.send('\ufeff' + csv);
  } catch (error: any) {
    console.error('[Analytics] Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

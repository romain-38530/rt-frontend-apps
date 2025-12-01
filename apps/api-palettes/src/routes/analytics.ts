import { Router, Request, Response } from 'express';
import {
  predictRestitutionDelay,
  detectAnomalies,
  calculateOptimalRoutes,
  getNetworkHealth,
  getDetailedKPIs,
} from '../services/analytics';

const router = Router();

/**
 * GET /analytics/predictions/:siteId
 * Prédire le délai moyen de restitution pour un site
 */
router.get('/predictions/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const prediction = await predictRestitutionDelay(siteId);
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /analytics/anomalies
 * Détecter les anomalies dans les transactions
 */
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const anomalies = await detectAnomalies();
    res.json(anomalies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /analytics/routes/:transporterId
 * Calculer les routes optimales pour un transporteur
 */
router.get('/routes/:transporterId', async (req: Request, res: Response) => {
  try {
    const { transporterId } = req.params;
    const routes = await calculateOptimalRoutes(transporterId);
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /analytics/network-health
 * Obtenir la santé globale du réseau
 */
router.get('/network-health', async (req: Request, res: Response) => {
  try {
    const health = await getNetworkHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /analytics/kpis
 * Obtenir des KPIs détaillés
 */
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const kpis = await getDetailedKPIs();
    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

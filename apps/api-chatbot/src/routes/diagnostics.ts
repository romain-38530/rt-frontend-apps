import { Router, Request, Response } from 'express';
import {
  runDiagnostic,
  checkService,
  getServiceStatus,
  getAllServicesStatus,
} from '../services/diagnostics-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /diagnostics/run - Lancer un diagnostic
router.post('/run', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type } = req.body;

    if (!type || !['erp', 'api', 'tracking', 'server'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid diagnostic type. Must be one of: erp, api, tracking, server',
      });
    }

    const results = await runDiagnostic(type);

    // Calculer le statut global
    const allHealthy = results.every(r => r.status === 'healthy');
    const anyDown = results.some(r => r.status === 'down');
    const globalStatus = anyDown ? 'critical' : allHealthy ? 'healthy' : 'degraded';

    res.json({
      success: true,
      diagnostic: {
        type,
        timestamp: new Date(),
        globalStatus,
        services: results,
        summary: {
          total: results.length,
          healthy: results.filter(r => r.status === 'healthy').length,
          degraded: results.filter(r => r.status === 'degraded').length,
          down: results.filter(r => r.status === 'down').length,
          maintenance: results.filter(r => r.status === 'maintenance').length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error running diagnostic:', error);
    res.status(500).json({
      error: 'Failed to run diagnostic',
      message: error.message,
    });
  }
});

// GET /diagnostics/status - Statut de tous les services
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const statuses = await getAllServicesStatus();

    // Calculer statistiques globales
    const healthyCount = statuses.filter(s => s.status === 'healthy').length;
    const degradedCount = statuses.filter(s => s.status === 'degraded').length;
    const downCount = statuses.filter(s => s.status === 'down').length;

    const globalUptime = statuses.reduce((sum, s) => sum + (s.uptime || 0), 0) / statuses.length;

    res.json({
      success: true,
      timestamp: new Date(),
      summary: {
        total: statuses.length,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
        globalUptime: Math.round(globalUptime),
      },
      services: statuses,
    });
  } catch (error: any) {
    console.error('Error fetching service status:', error);
    res.status(500).json({
      error: 'Failed to fetch service status',
      message: error.message,
    });
  }
});

// GET /diagnostics/:service - Statut d'un service spécifique
router.get('/:service', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { service } = req.params;

    const status = await getServiceStatus(service);

    if (status.status === 'unknown') {
      return res.status(404).json({
        error: 'Service not found or no diagnostic data available',
      });
    }

    res.json({
      success: true,
      service: status,
    });
  } catch (error: any) {
    console.error('Error fetching service status:', error);
    res.status(500).json({
      error: 'Failed to fetch service status',
      message: error.message,
    });
  }
});

// POST /diagnostics/check/:service - Vérifier un service maintenant
router.post('/check/:service', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { service } = req.params;

    const result = await checkService(service);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Error checking service:', error);

    if (error.message.startsWith('Unknown service')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to check service',
      message: error.message,
    });
  }
});

export default router;

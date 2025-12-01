import { Router, Request, Response } from 'express';
import {
  validatePalletSerial,
  reportMovement,
  getRegistryStats,
  syncLedgerWithRegistry,
  searchPalletBySerial,
  recordPalletRepair,
  getPalletHistory,
} from '../services/epal-registry';

const router = Router();

/**
 * POST /epal/validate-serial
 * Valider un numéro de série EPAL
 */
router.post('/validate-serial', async (req: Request, res: Response) => {
  try {
    const { serialNumber } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ error: 'serialNumber requis' });
    }

    const result = await validatePalletSerial(serialNumber);

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        error: result.error,
      });
    }

    res.json({
      valid: true,
      record: result.record,
      message: 'Numéro de série EPAL valide',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /epal/report-movement
 * Signaler un mouvement de palettes au registre EPAL
 */
router.post('/report-movement', async (req: Request, res: Response) => {
  try {
    const { chequeId, movementType } = req.body;

    if (!chequeId || !movementType) {
      return res.status(400).json({ error: 'chequeId et movementType requis' });
    }

    if (!['emission', 'reception', 'transfert'].includes(movementType)) {
      return res.status(400).json({ error: 'movementType invalide (emission, reception, transfert)' });
    }

    const result = await reportMovement(chequeId, movementType);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      reportId: result.reportId,
      message: 'Mouvement signalé au registre EPAL',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /epal/stats
 * Récupérer les statistiques du registre EPAL
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getRegistryStats();
    res.json({
      registry: 'EPAL European Pallet Association',
      stats,
      note: 'Données simulées - Dans un système réel, ces données proviendraient de l\'API EPAL officielle',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /epal/sync/:companyId
 * Synchroniser le ledger avec le registre EPAL
 */
router.post('/sync/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const result = await syncLedgerWithRegistry(companyId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      synchronized: result.synchronized,
      differences: result.differences,
      message: result.synchronized
        ? 'Ledger synchronisé avec le registre EPAL'
        : 'Écarts détectés entre le ledger local et le registre EPAL',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /epal/search/:serialNumber
 * Rechercher une palette par numéro de série
 */
router.get('/search/:serialNumber', async (req: Request, res: Response) => {
  try {
    const { serialNumber } = req.params;

    const result = await searchPalletBySerial(serialNumber);

    if (!result.found) {
      return res.status(404).json({
        found: false,
        message: 'Palette non trouvée dans le registre EPAL',
      });
    }

    res.json({
      found: true,
      record: result.record,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /epal/repair
 * Enregistrer une réparation de palette
 */
router.post('/repair', async (req: Request, res: Response) => {
  try {
    const { serialNumber, repairedBy, description } = req.body;

    if (!serialNumber || !repairedBy || !description) {
      return res.status(400).json({ error: 'serialNumber, repairedBy et description requis' });
    }

    const result = await recordPalletRepair(serialNumber, repairedBy, description);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Réparation enregistrée dans le registre EPAL',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /epal/history/:serialNumber
 * Obtenir l'historique complet d'une palette
 */
router.get('/history/:serialNumber', async (req: Request, res: Response) => {
  try {
    const { serialNumber } = req.params;

    const result = await getPalletHistory(serialNumber);

    if (!result.found) {
      return res.status(404).json({
        found: false,
        error: result.error,
      });
    }

    res.json({
      found: true,
      history: result.history,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /epal/health
 * Vérifier la connectivité avec le registre EPAL
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Dans un vrai système, tester la connexion à l'API EPAL
    res.json({
      status: 'ok',
      registry: 'EPAL European Pallet Association',
      mode: 'simulation',
      message: 'Registre EPAL accessible (mode simulation)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

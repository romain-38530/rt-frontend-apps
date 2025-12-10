/**
 * Routes Archive - Gestion de l'archivage légal SYMPHONI.A
 * Conservation 10 ans avec valeur probante
 */
import { Router, Request, Response } from 'express';
import ArchiveService from '../services/archive-service';

const router = Router();

/**
 * GET /api/v1/archive/stats
 * Statistiques d'archivage pour le dashboard
 * NOTE: Doit être défini AVANT /:archiveId pour éviter les conflits de route
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { industrialId } = req.query;

    if (!industrialId) {
      return res.status(400).json({
        success: false,
        error: 'industrialId est requis'
      });
    }

    const stats = await ArchiveService.getArchiveStats(industrialId as string);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/archive/search
 * Recherche dans les archives
 * NOTE: Doit être défini AVANT /:archiveId pour éviter les conflits de route
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { industrialId, reference, carrierName, startDate, endDate, city } = req.query;

    if (!industrialId) {
      return res.status(400).json({
        success: false,
        error: 'industrialId est requis'
      });
    }

    const archives = await ArchiveService.searchArchives(
      industrialId as string,
      {
        reference: reference as string,
        carrierName: carrierName as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        city: city as string
      }
    );

    res.json({
      success: true,
      count: archives.length,
      archives: archives.map(a => ({
        archiveId: a.archiveId,
        orderId: a.orderId,
        orderReference: a.orderReference,
        carrier: a.orderSnapshot.carrierName,
        pickupCity: a.orderSnapshot.pickupAddress?.city,
        deliveryCity: a.orderSnapshot.deliveryAddress?.city,
        archivedAt: a.archiveMetadata.archivedAt
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/archive/cleanup
 * Nettoie les archives expirées (admin only)
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    // TODO: Vérifier les permissions admin
    const result = await ArchiveService.cleanupExpiredArchives();

    res.json({
      success: true,
      message: 'Nettoyage terminé',
      result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/archive/:orderId
 * Archive une commande avec ses documents
 */
router.post('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { documents } = req.body;

    // Pour l'instant, les documents sont passés sans contenu binaire
    // En production, utiliser un upload multipart
    const docsWithContent = (documents || []).map((doc: any) => ({
      ...doc,
      content: Buffer.from(doc.content || '', 'base64')
    }));

    const archive = await ArchiveService.archiveOrder(orderId, docsWithContent);

    res.json({
      success: true,
      message: 'Commande archivée avec succès',
      archive: {
        archiveId: archive.archiveId,
        orderId: archive.orderId,
        orderReference: archive.orderReference,
        documentsCount: archive.documents.length,
        archivedAt: archive.archiveMetadata.archivedAt,
        expiresAt: archive.archiveMetadata.expiresAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/archive/:archiveId
 * Récupère une archive par ID
 */
router.get('/:archiveId', async (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;
    const archive = await ArchiveService.getArchive(archiveId);

    if (!archive) {
      return res.status(404).json({
        success: false,
        error: 'Archive non trouvée'
      });
    }

    res.json({
      success: true,
      archive
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/archive
 * Liste les archives d'un industriel
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { industrialId, page, limit, year } = req.query;

    if (!industrialId) {
      return res.status(400).json({
        success: false,
        error: 'industrialId est requis'
      });
    }

    const result = await ArchiveService.getArchivesByIndustrial(
      industrialId as string,
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        year: year ? parseInt(year as string) : undefined
      }
    );

    res.json({
      success: true,
      total: result.total,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      archives: result.archives.map(a => ({
        archiveId: a.archiveId,
        orderId: a.orderId,
        orderReference: a.orderReference,
        documentsCount: a.documents.length,
        archivedAt: a.archiveMetadata.archivedAt,
        expiresAt: a.archiveMetadata.expiresAt,
        integrityVerified: a.integrity.verified
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/archive/:archiveId/verify
 * Vérifie l'intégrité d'une archive
 */
router.post('/:archiveId/verify', async (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;
    const result = await ArchiveService.verifyArchiveIntegrity(archiveId);

    res.json({
      success: true,
      verification: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/archive/:archiveId/export
 * Exporte une archive (conformité légale)
 */
router.get('/:archiveId/export', async (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;
    const result = await ArchiveService.exportArchive(archiveId);

    res.json({
      success: true,
      export: {
        archiveId: result.archive.archiveId,
        orderReference: result.archive.orderReference,
        exportedAt: result.exportedAt,
        format: result.exportFormat,
        data: result.archive
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

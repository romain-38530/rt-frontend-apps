"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Archive - Gestion de l'archivage légal SYMPHONI.A
 * Conservation 10 ans avec valeur probante
 */
const express_1 = require("express");
const archive_service_1 = __importDefault(require("../services/archive-service"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/archive/stats
 * Statistiques d'archivage pour le dashboard
 * NOTE: Doit être défini AVANT /:archiveId pour éviter les conflits de route
 */
router.get('/stats', async (req, res) => {
    try {
        const { industrialId } = req.query;
        if (!industrialId) {
            return res.status(400).json({
                success: false,
                error: 'industrialId est requis'
            });
        }
        const stats = await archive_service_1.default.getArchiveStats(industrialId);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/archive/search
 * Recherche dans les archives
 * NOTE: Doit être défini AVANT /:archiveId pour éviter les conflits de route
 */
router.get('/search', async (req, res) => {
    try {
        const { industrialId, reference, carrierName, startDate, endDate, city } = req.query;
        if (!industrialId) {
            return res.status(400).json({
                success: false,
                error: 'industrialId est requis'
            });
        }
        const archives = await archive_service_1.default.searchArchives(industrialId, {
            reference: reference,
            carrierName: carrierName,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            city: city
        });
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/archive/cleanup
 * Nettoie les archives expirées (admin only)
 */
router.post('/cleanup', async (req, res) => {
    try {
        // TODO: Vérifier les permissions admin
        const result = await archive_service_1.default.cleanupExpiredArchives();
        res.json({
            success: true,
            message: 'Nettoyage terminé',
            result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/archive/:orderId
 * Archive une commande avec ses documents
 */
router.post('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { documents } = req.body;
        // Pour l'instant, les documents sont passés sans contenu binaire
        // En production, utiliser un upload multipart
        const docsWithContent = (documents || []).map((doc) => ({
            ...doc,
            content: Buffer.from(doc.content || '', 'base64')
        }));
        const archive = await archive_service_1.default.archiveOrder(orderId, docsWithContent);
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/archive/:archiveId
 * Récupère une archive par ID
 */
router.get('/:archiveId', async (req, res) => {
    try {
        const { archiveId } = req.params;
        const archive = await archive_service_1.default.getArchive(archiveId);
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/archive
 * Liste les archives d'un industriel
 */
router.get('/', async (req, res) => {
    try {
        const { industrialId, page, limit, year } = req.query;
        if (!industrialId) {
            return res.status(400).json({
                success: false,
                error: 'industrialId est requis'
            });
        }
        const result = await archive_service_1.default.getArchivesByIndustrial(industrialId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            year: year ? parseInt(year) : undefined
        });
        res.json({
            success: true,
            total: result.total,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/archive/:archiveId/verify
 * Vérifie l'intégrité d'une archive
 */
router.post('/:archiveId/verify', async (req, res) => {
    try {
        const { archiveId } = req.params;
        const result = await archive_service_1.default.verifyArchiveIntegrity(archiveId);
        res.json({
            success: true,
            verification: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/archive/:archiveId/export
 * Exporte une archive (conformité légale)
 */
router.get('/:archiveId/export', async (req, res) => {
    try {
        const { archiveId } = req.params;
        const result = await archive_service_1.default.exportArchive(archiveId);
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=archive.js.map
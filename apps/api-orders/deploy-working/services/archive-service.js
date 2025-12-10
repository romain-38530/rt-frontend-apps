"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ArchiveService - Service d'archivage légal SYMPHONI.A
 * Gère l'archivage à valeur probante des commandes pendant 10 ans
 */
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const OrderArchive_1 = __importDefault(require("../models/OrderArchive"));
const OrderEvent_1 = __importDefault(require("../models/OrderEvent"));
const Order_1 = __importDefault(require("../models/Order"));
const event_service_1 = __importDefault(require("./event-service"));
class ArchiveService {
    /**
     * Archive une commande avec tous ses documents
     */
    static async archiveOrder(orderId, documents, archivedBy = 'system') {
        const order = await Order_1.default.findOne({ orderId });
        if (!order)
            throw new Error('Commande non trouvée');
        // Vérifier que la commande est clôturable
        if (!['delivered', 'completed', 'closed'].includes(order.status)) {
            throw new Error(`Impossible d'archiver une commande avec le statut: ${order.status}`);
        }
        // Récupérer la timeline complète
        const events = await OrderEvent_1.default.find({ orderId }).sort({ timestamp: 1 });
        const timeline = events.map(e => ({
            eventType: e.eventType,
            timestamp: e.timestamp,
            description: e.description
        }));
        // Préparer les documents archivés avec checksums
        const archivedDocuments = documents.map(doc => ({
            documentId: `doc_${(0, uuid_1.v4)()}`,
            type: doc.type,
            filename: doc.filename,
            mimeType: doc.mimeType,
            size: doc.size,
            checksum: this.calculateChecksum(doc.content),
            s3Key: doc.s3Key || `archives/${orderId}/${doc.filename}`,
            uploadedAt: new Date()
        }));
        // Calculer les dates de rétention
        const archivedAt = new Date();
        const expiresAt = new Date(archivedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + this.RETENTION_YEARS);
        // Calculer le checksum global de l'archive
        const archiveContent = JSON.stringify({
            orderId,
            orderSnapshot: this.createOrderSnapshot(order),
            documents: archivedDocuments,
            timeline
        });
        const archiveChecksum = crypto_1.default.createHash('sha256').update(archiveContent).digest('hex');
        // Créer l'archive
        const archiveId = `archive_${(0, uuid_1.v4)()}`;
        const archive = new OrderArchive_1.default({
            archiveId,
            orderId,
            orderReference: order.reference,
            industrialId: order.industrialId,
            orderSnapshot: this.createOrderSnapshot(order),
            documents: archivedDocuments,
            timeline,
            archiveMetadata: {
                archivedAt,
                archivedBy,
                archiveVersion: '1.0',
                legalRetentionYears: this.RETENTION_YEARS,
                expiresAt,
                storageClass: 'glacier',
                s3Bucket: process.env.ARCHIVE_S3_BUCKET || 'rt-orders-archives',
                encryptionType: 'AES256'
            },
            integrity: {
                checksum: archiveChecksum,
                calculatedAt: archivedAt,
                verified: true,
                lastVerifiedAt: archivedAt
            },
            accessLog: [{
                    accessedAt: archivedAt,
                    accessedBy: archivedBy,
                    action: 'view'
                }],
            status: 'active'
        });
        await archive.save();
        // Mettre à jour la commande
        await Order_1.default.findOneAndUpdate({ orderId }, {
            $set: {
                status: 'archived',
                archiveId: archiveId,
                archivedAt: archivedAt
            }
        });
        // Enregistrer l'événement
        await event_service_1.default.orderArchived(orderId, order.reference, archiveId);
        return archive;
    }
    /**
     * Crée un snapshot de la commande pour l'archive
     */
    static createOrderSnapshot(order) {
        return {
            pickupAddress: order.pickupAddress || {},
            deliveryAddress: order.deliveryAddress || {},
            dates: order.dates || {},
            goods: order.goods || {},
            constraints: order.constraints || [],
            carrierId: order.assignedCarrier?.carrierId,
            carrierName: order.assignedCarrier?.carrierName,
            finalPrice: order.pricing?.finalPrice,
            currency: order.pricing?.currency || 'EUR'
        };
    }
    /**
     * Calcule le checksum SHA-256 d'un fichier
     */
    static calculateChecksum(content) {
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    /**
     * Récupère une archive par ID
     */
    static async getArchive(archiveId, accessedBy = 'system') {
        const archive = await OrderArchive_1.default.findOne({ archiveId });
        if (archive) {
            // Enregistrer l'accès
            await OrderArchive_1.default.findOneAndUpdate({ archiveId }, {
                $push: {
                    accessLog: {
                        accessedAt: new Date(),
                        accessedBy,
                        action: 'view'
                    }
                }
            });
        }
        return archive;
    }
    /**
     * Récupère les archives d'un industriel
     */
    static async getArchivesByIndustrial(industrialId, options = {}) {
        const { page = 1, limit = 20, year } = options;
        const query = { industrialId };
        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year + 1, 0, 1);
            query['archiveMetadata.archivedAt'] = { $gte: startDate, $lt: endDate };
        }
        const [archives, total] = await Promise.all([
            OrderArchive_1.default.find(query)
                .sort({ 'archiveMetadata.archivedAt': -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            OrderArchive_1.default.countDocuments(query)
        ]);
        return { archives, total };
    }
    /**
     * Vérifie l'intégrité d'une archive
     */
    static async verifyArchiveIntegrity(archiveId) {
        const archive = await OrderArchive_1.default.findOne({ archiveId });
        if (!archive)
            throw new Error('Archive non trouvée');
        const issues = [];
        // Vérifier que l'archive n'a pas expiré
        if (new Date() > archive.archiveMetadata.expiresAt) {
            issues.push('Période de rétention expirée');
        }
        // Recalculer le checksum et comparer
        const archiveContent = JSON.stringify({
            orderId: archive.orderId,
            orderSnapshot: archive.orderSnapshot,
            documents: archive.documents,
            timeline: archive.timeline
        });
        const currentChecksum = crypto_1.default.createHash('sha256').update(archiveContent).digest('hex');
        if (currentChecksum !== archive.integrity.checksum) {
            issues.push('Checksum invalide - données potentiellement corrompues');
        }
        // Mettre à jour le statut d'intégrité
        const isValid = issues.length === 0;
        await OrderArchive_1.default.findOneAndUpdate({ archiveId }, {
            $set: {
                'integrity.verified': isValid,
                'integrity.lastVerifiedAt': new Date()
            }
        });
        return { isValid, issues };
    }
    /**
     * Recherche dans les archives
     */
    static async searchArchives(industrialId, searchParams) {
        const query = { industrialId };
        if (searchParams.reference) {
            query.orderReference = { $regex: searchParams.reference, $options: 'i' };
        }
        if (searchParams.carrierName) {
            query['orderSnapshot.carrierName'] = {
                $regex: searchParams.carrierName,
                $options: 'i'
            };
        }
        if (searchParams.startDate || searchParams.endDate) {
            query['archiveMetadata.archivedAt'] = {};
            if (searchParams.startDate) {
                query['archiveMetadata.archivedAt'].$gte = searchParams.startDate;
            }
            if (searchParams.endDate) {
                query['archiveMetadata.archivedAt'].$lte = searchParams.endDate;
            }
        }
        if (searchParams.city) {
            query.$or = [
                { 'orderSnapshot.pickupAddress.city': { $regex: searchParams.city, $options: 'i' } },
                { 'orderSnapshot.deliveryAddress.city': { $regex: searchParams.city, $options: 'i' } }
            ];
        }
        return OrderArchive_1.default.find(query).sort({ 'archiveMetadata.archivedAt': -1 }).limit(100);
    }
    /**
     * Exporte une archive (pour conformité légale)
     */
    static async exportArchive(archiveId, exportedBy = 'system') {
        const archive = await OrderArchive_1.default.findOne({ archiveId });
        if (!archive)
            throw new Error('Archive non trouvée');
        // Enregistrer l'export dans le log d'accès
        await OrderArchive_1.default.findOneAndUpdate({ archiveId }, {
            $push: {
                accessLog: {
                    accessedAt: new Date(),
                    accessedBy: exportedBy,
                    action: 'download'
                }
            }
        });
        return {
            archive,
            exportedAt: new Date(),
            exportFormat: 'JSON'
        };
    }
    /**
     * Statistiques d'archivage
     */
    static async getArchiveStats(industrialId) {
        const archives = await OrderArchive_1.default.find({ industrialId });
        // Grouper par année
        const byYear = {};
        let totalDocuments = 0;
        let totalSize = 0;
        let oldestDate = null;
        let newestDate = null;
        for (const archive of archives) {
            const year = archive.archiveMetadata.archivedAt.getFullYear();
            byYear[year] = (byYear[year] || 0) + 1;
            totalDocuments += archive.documents.length;
            totalSize += archive.documents.reduce((sum, d) => sum + d.size, 0);
            if (!oldestDate || archive.archiveMetadata.archivedAt < oldestDate) {
                oldestDate = archive.archiveMetadata.archivedAt;
            }
            if (!newestDate || archive.archiveMetadata.archivedAt > newestDate) {
                newestDate = archive.archiveMetadata.archivedAt;
            }
        }
        const archivesByYear = Object.entries(byYear)
            .map(([year, count]) => ({ year: parseInt(year), count }))
            .sort((a, b) => b.year - a.year);
        return {
            totalArchives: archives.length,
            totalDocuments,
            archivesByYear,
            storageEstimateGB: Math.round((totalSize / (1024 * 1024 * 1024)) * 100) / 100,
            oldestArchive: oldestDate,
            newestArchive: newestDate
        };
    }
    /**
     * Nettoie les archives expirées (à exécuter via CRON)
     */
    static async cleanupExpiredArchives() {
        const expiredArchives = await OrderArchive_1.default.find({
            'archiveMetadata.expiresAt': { $lt: new Date() },
            status: 'active'
        });
        let deleted = 0;
        for (const archive of expiredArchives) {
            // Marquer comme expiré au lieu de supprimer directement
            await OrderArchive_1.default.findOneAndUpdate({ archiveId: archive.archiveId }, { $set: { status: 'expired' } });
            deleted++;
        }
        return {
            processed: expiredArchives.length,
            deleted
        };
    }
}
ArchiveService.RETENTION_YEARS = 10;
exports.default = ArchiveService;
//# sourceMappingURL=archive-service.js.map
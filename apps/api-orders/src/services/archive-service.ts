/**
 * ArchiveService - Service d'archivage légal SYMPHONI.A
 * Gère l'archivage à valeur probante des commandes pendant 10 ans
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import OrderArchive, { IOrderArchive, IArchiveDocument } from '../models/OrderArchive';
import OrderEvent from '../models/OrderEvent';
import Order from '../models/Order';
import EventService from './event-service';

interface ArchiveDocumentInput {
  type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'ecmr' | 'other';
  filename: string;
  size: number;
  mimeType: string;
  content: Buffer; // Contenu du fichier pour calcul du hash
  s3Key?: string;
}

class ArchiveService {
  private static readonly RETENTION_YEARS = 10;

  /**
   * Archive une commande avec tous ses documents
   */
  static async archiveOrder(
    orderId: string,
    documents: ArchiveDocumentInput[],
    archivedBy: string = 'system'
  ): Promise<IOrderArchive> {
    const order = await Order.findOne({ orderId });
    if (!order) throw new Error('Commande non trouvée');

    // Vérifier que la commande est clôturable
    if (!['delivered', 'completed', 'closed'].includes(order.status)) {
      throw new Error(`Impossible d'archiver une commande avec le statut: ${order.status}`);
    }

    // Récupérer la timeline complète
    const events = await OrderEvent.find({ orderId }).sort({ timestamp: 1 });
    const timeline = events.map(e => ({
      eventType: e.eventType,
      timestamp: e.timestamp,
      description: e.description
    }));

    // Préparer les documents archivés avec checksums
    const archivedDocuments: IArchiveDocument[] = documents.map(doc => ({
      documentId: `doc_${uuidv4()}`,
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
    const archiveChecksum = crypto.createHash('sha256').update(archiveContent).digest('hex');

    // Créer l'archive
    const archiveId = `archive_${uuidv4()}`;
    const archive = new OrderArchive({
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
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status: 'archived',
          archiveId: archiveId,
          archivedAt: archivedAt
        }
      }
    );

    // Enregistrer l'événement
    await EventService.orderArchived(orderId, order.reference, archiveId);

    return archive;
  }

  /**
   * Crée un snapshot de la commande pour l'archive
   */
  private static createOrderSnapshot(order: any): IOrderArchive['orderSnapshot'] {
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
  private static calculateChecksum(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Récupère une archive par ID
   */
  static async getArchive(archiveId: string, accessedBy: string = 'system'): Promise<IOrderArchive | null> {
    const archive = await OrderArchive.findOne({ archiveId });

    if (archive) {
      // Enregistrer l'accès
      await OrderArchive.findOneAndUpdate(
        { archiveId },
        {
          $push: {
            accessLog: {
              accessedAt: new Date(),
              accessedBy,
              action: 'view'
            }
          }
        }
      );
    }

    return archive;
  }

  /**
   * Récupère les archives d'un industriel
   */
  static async getArchivesByIndustrial(
    industrialId: string,
    options: {
      page?: number;
      limit?: number;
      year?: number;
    } = {}
  ): Promise<{ archives: IOrderArchive[]; total: number }> {
    const { page = 1, limit = 20, year } = options;

    const query: any = { industrialId };
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      query['archiveMetadata.archivedAt'] = { $gte: startDate, $lt: endDate };
    }

    const [archives, total] = await Promise.all([
      OrderArchive.find(query)
        .sort({ 'archiveMetadata.archivedAt': -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OrderArchive.countDocuments(query)
    ]);

    return { archives, total };
  }

  /**
   * Vérifie l'intégrité d'une archive
   */
  static async verifyArchiveIntegrity(archiveId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const archive = await OrderArchive.findOne({ archiveId });
    if (!archive) throw new Error('Archive non trouvée');

    const issues: string[] = [];

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
    const currentChecksum = crypto.createHash('sha256').update(archiveContent).digest('hex');

    if (currentChecksum !== archive.integrity.checksum) {
      issues.push('Checksum invalide - données potentiellement corrompues');
    }

    // Mettre à jour le statut d'intégrité
    const isValid = issues.length === 0;
    await OrderArchive.findOneAndUpdate(
      { archiveId },
      {
        $set: {
          'integrity.verified': isValid,
          'integrity.lastVerifiedAt': new Date()
        }
      }
    );

    return { isValid, issues };
  }

  /**
   * Recherche dans les archives
   */
  static async searchArchives(
    industrialId: string,
    searchParams: {
      reference?: string;
      carrierName?: string;
      startDate?: Date;
      endDate?: Date;
      city?: string;
    }
  ): Promise<IOrderArchive[]> {
    const query: any = { industrialId };

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

    return OrderArchive.find(query).sort({ 'archiveMetadata.archivedAt': -1 }).limit(100);
  }

  /**
   * Exporte une archive (pour conformité légale)
   */
  static async exportArchive(archiveId: string, exportedBy: string = 'system'): Promise<{
    archive: IOrderArchive;
    exportedAt: Date;
    exportFormat: string;
  }> {
    const archive = await OrderArchive.findOne({ archiveId });
    if (!archive) throw new Error('Archive non trouvée');

    // Enregistrer l'export dans le log d'accès
    await OrderArchive.findOneAndUpdate(
      { archiveId },
      {
        $push: {
          accessLog: {
            accessedAt: new Date(),
            accessedBy: exportedBy,
            action: 'download'
          }
        }
      }
    );

    return {
      archive,
      exportedAt: new Date(),
      exportFormat: 'JSON'
    };
  }

  /**
   * Statistiques d'archivage
   */
  static async getArchiveStats(industrialId: string): Promise<{
    totalArchives: number;
    totalDocuments: number;
    archivesByYear: { year: number; count: number }[];
    storageEstimateGB: number;
    oldestArchive: Date | null;
    newestArchive: Date | null;
  }> {
    const archives = await OrderArchive.find({ industrialId });

    // Grouper par année
    const byYear: Record<number, number> = {};
    let totalDocuments = 0;
    let totalSize = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

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
  static async cleanupExpiredArchives(): Promise<{
    processed: number;
    deleted: number;
  }> {
    const expiredArchives = await OrderArchive.find({
      'archiveMetadata.expiresAt': { $lt: new Date() },
      status: 'active'
    });

    let deleted = 0;

    for (const archive of expiredArchives) {
      // Marquer comme expiré au lieu de supprimer directement
      await OrderArchive.findOneAndUpdate(
        { archiveId: archive.archiveId },
        { $set: { status: 'expired' } }
      );
      deleted++;
    }

    return {
      processed: expiredArchives.length,
      deleted
    };
  }
}

export default ArchiveService;

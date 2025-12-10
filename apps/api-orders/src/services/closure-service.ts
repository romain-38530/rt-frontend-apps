/**
 * Service de clôture automatique - SYMPHONI.A
 * Gère la clôture des commandes et l'archivage après 30 jours
 */
import Order from '../models/Order';
import DocumentService from './document-service';
import ScoringService from './scoring-service';
import ArchiveService from './archive-service';
import EventService from './event-service';
import PreInvoiceService from './preinvoice-service';
import nodemailer from 'nodemailer';

// Configuration email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'ssl0.ovh.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ClosureResult {
  success: boolean;
  orderId: string;
  status: 'completed' | 'pending_documents' | 'pending_score' | 'error';
  message: string;
}

class ClosureService {
  /**
   * Vérifie si une commande peut être clôturée
   */
  static async checkClosureEligibility(orderId: string): Promise<{
    eligible: boolean;
    reason?: string;
    missingItems?: string[];
  }> {
    const order = await Order.findOne({ orderId });
    if (!order) {
      return { eligible: false, reason: 'Commande non trouvée' };
    }

    // La commande doit être livrée
    if (!['delivered', 'completed'].includes(order.status)) {
      return { eligible: false, reason: `Statut incorrect: ${order.status}` };
    }

    const missingItems: string[] = [];

    // Vérifier les documents requis
    const docCheck = await DocumentService.checkRequiredDocuments(orderId);
    if (!docCheck.complete) {
      if (docCheck.missing.length > 0) {
        missingItems.push(...docCheck.missing.map(d => `Document manquant: ${d.toUpperCase()}`));
      }
      if (docCheck.pending.length > 0) {
        missingItems.push(...docCheck.pending.map(d => `Document en attente: ${d.toUpperCase()}`));
      }
    }

    // Vérifier le scoring (si transporteur assigné)
    if (order.carrierId) {
      const score = await ScoringService.getOrderScore(orderId);
      if (!score) {
        missingItems.push('Score transporteur non calculé');
      }
    }

    if (missingItems.length > 0) {
      return { eligible: false, reason: 'Éléments manquants', missingItems };
    }

    return { eligible: true };
  }

  /**
   * Clôture une commande manuellement
   */
  static async closeOrder(orderId: string, closedBy: { id: string; name: string }): Promise<ClosureResult> {
    try {
      const order = await Order.findOne({ orderId });
      if (!order) {
        return { success: false, orderId, status: 'error', message: 'Commande non trouvée' };
      }

      // Vérifier l'éligibilité
      const eligibility = await this.checkClosureEligibility(orderId);
      if (!eligibility.eligible) {
        return {
          success: false,
          orderId,
          status: 'pending_documents',
          message: eligibility.reason || 'Non éligible à la clôture'
        };
      }

      // Mettre à jour le statut
      order.status = 'completed';
      (order as any).closedAt = new Date();
      (order as any).closedBy = closedBy;
      await order.save();

      // Créer l'événement
      await EventService.createEvent({
        orderId,
        orderReference: order.reference,
        eventType: 'order.completed',
        source: 'user',
        actorId: closedBy.id,
        actorName: closedBy.name,
        data: { closedAt: new Date() }
      });

      // Ajouter à la préfacturation du transporteur (si transporteur assigné)
      if (order.carrierId) {
        try {
          await PreInvoiceService.addCompletedOrder(order.orderId);
          console.log(`[ClosureService] Order ${orderId} added to carrier ${order.carrierId} pre-invoice`);
        } catch (preInvoiceError: any) {
          console.error(`[ClosureService] Error adding to pre-invoice: ${preInvoiceError.message}`);
          // Ne pas bloquer la clôture si la préfacturation échoue
        }
      }

      // Notifier les parties
      await this.notifyOrderClosed(order);

      return {
        success: true,
        orderId,
        status: 'completed',
        message: 'Commande clôturée avec succès'
      };
    } catch (error: any) {
      return { success: false, orderId, status: 'error', message: error.message };
    }
  }

  /**
   * Clôture automatique des commandes livrées depuis plus de X heures
   * À exécuter via un cron job
   */
  static async autoCloseDeliveredOrders(hoursAfterDelivery = 24): Promise<{
    processed: number;
    closed: number;
    pending: number;
    errors: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAfterDelivery);

    // Trouver les commandes livrées depuis plus de X heures
    const orders = await Order.find({
      status: 'delivered',
      'dates.actualDeliveryDate': { $lte: cutoffDate }
    });

    const results = {
      processed: orders.length,
      closed: 0,
      pending: 0,
      errors: [] as string[]
    };

    for (const order of orders) {
      try {
        const eligibility = await this.checkClosureEligibility(order.orderId);

        if (eligibility.eligible) {
          order.status = 'completed';
          (order as any).closedAt = new Date();
          (order as any).closedBy = { id: 'system', name: 'Clôture automatique' };
          await order.save();

          await EventService.createEvent({
            orderId: order.orderId,
            orderReference: order.reference,
            eventType: 'order.completed',
            source: 'system',
            data: { automatic: true, closedAt: new Date() }
          });

          // Ajouter à la préfacturation du transporteur (si transporteur assigné)
          if (order.carrierId) {
            try {
              await PreInvoiceService.addCompletedOrder(order.orderId);
              console.log(`[ClosureService] Auto-close: Order ${order.orderId} added to carrier ${order.carrierId} pre-invoice`);
            } catch (preInvoiceError: any) {
              console.error(`[ClosureService] Auto-close pre-invoice error: ${preInvoiceError.message}`);
            }
          }

          results.closed++;
        } else {
          results.pending++;
        }
      } catch (error: any) {
        results.errors.push(`${order.orderId}: ${error.message}`);
      }
    }

    console.log(`[ClosureService] Auto-close: ${results.closed} fermées, ${results.pending} en attente, ${results.errors.length} erreurs`);

    return results;
  }

  /**
   * Archivage automatique des commandes clôturées depuis plus de X jours
   * Conservation 10 ans selon les obligations légales
   */
  static async autoArchiveCompletedOrders(daysAfterClosure = 30): Promise<{
    processed: number;
    archived: number;
    errors: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAfterClosure);

    // Trouver les commandes complétées depuis plus de X jours
    const orders = await Order.find({
      status: 'completed',
      $or: [
        { closedAt: { $lte: cutoffDate } },
        { 'dates.actualDeliveryDate': { $lte: cutoffDate } }
      ]
    });

    const results = {
      processed: orders.length,
      archived: 0,
      errors: [] as string[]
    };

    for (const order of orders) {
      try {
        // Créer l'archive (sans documents pour l'instant - ils sont déjà stockés)
        const archive = await ArchiveService.archiveOrder(order.orderId, [], 'system');

        // Mettre à jour le statut
        order.status = 'archived';
        await order.save();

        // Créer l'événement
        await EventService.orderArchived(
          order.orderId,
          order.reference,
          archive.archiveId
        );

        // Archiver les documents
        await DocumentService.archiveOrderDocuments(order.orderId);

        results.archived++;
      } catch (error: any) {
        results.errors.push(`${order.orderId}: ${error.message}`);
      }
    }

    console.log(`[ClosureService] Auto-archive: ${results.archived} archivées, ${results.errors.length} erreurs`);

    return results;
  }

  /**
   * Notifie la clôture d'une commande
   */
  private static async notifyOrderClosed(order: any): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .summary { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Commande Clôturée</h1>
            <p>SYMPHONI.A</p>
          </div>
          <div class="content">
            <p>La commande <strong>${order.reference}</strong> a été clôturée avec succès.</p>

            <div class="summary">
              <p><strong>Référence :</strong> ${order.reference}</p>
              <p><strong>Trajet :</strong> ${order.pickupAddress?.city} → ${order.deliveryAddress?.city}</p>
              <p><strong>Livraison :</strong> ${order.dates?.actualDeliveryDate ? new Date(order.dates.actualDeliveryDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
              <p><strong>Transporteur :</strong> ${order.carrierName || order.carrierId || 'N/A'}</p>
            </div>

            <p>📁 Cette commande sera automatiquement archivée dans 30 jours et conservée 10 ans conformément aux obligations légales.</p>

            <p>Tous les documents (CMR, POD, factures) sont disponibles dans votre espace.</p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (order.createdBy?.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'SYMPHONI.A <noreply@symphonia-controltower.com>',
          to: order.createdBy.email,
          subject: `[SYMPHONI.A] ✅ Commande clôturée - ${order.reference}`,
          html
        });
      } catch (error) {
        console.error('[ClosureService] Email error:', error);
      }
    }
  }

  /**
   * Statistiques de clôture
   */
  static async getClosureStats(industrialId?: string): Promise<{
    totalCompleted: number;
    totalArchived: number;
    pendingClosure: number;
    averageClosureTime: number;
  }> {
    const matchStage: any = {};
    if (industrialId) {
      matchStage.industrialId = industrialId;
    }

    const [completed, archived, pending] = await Promise.all([
      Order.countDocuments({ ...matchStage, status: 'completed' }),
      Order.countDocuments({ ...matchStage, status: 'archived' }),
      Order.countDocuments({ ...matchStage, status: 'delivered' })
    ]);

    // Calculer le temps moyen de clôture
    const completedOrders = await Order.find({
      ...matchStage,
      status: { $in: ['completed', 'archived'] },
      'dates.actualDeliveryDate': { $exists: true },
      closedAt: { $exists: true }
    }).select('dates.actualDeliveryDate closedAt').limit(100);

    let totalTime = 0;
    let count = 0;

    for (const order of completedOrders) {
      if (order.dates?.actualDeliveryDate && (order as any).closedAt) {
        const delivery = new Date(order.dates.actualDeliveryDate).getTime();
        const closed = new Date((order as any).closedAt).getTime();
        totalTime += closed - delivery;
        count++;
      }
    }

    return {
      totalCompleted: completed,
      totalArchived: archived,
      pendingClosure: pending,
      averageClosureTime: count > 0 ? Math.round(totalTime / count / (1000 * 60 * 60)) : 0 // en heures
    };
  }
}

export default ClosureService;

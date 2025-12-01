import axios from 'axios';
import { IIncident } from '../models/Incident';
import { IDelivery } from '../models/Delivery';
import { Incident } from '../models/Incident';
import { IRefusalDetails } from '../models/DeliverySignature';

export class IncidentService {
  private billingApiUrl: string;
  private notificationsApiUrl: string;

  constructor() {
    this.billingApiUrl = process.env.BILLING_API_URL || 'http://localhost:3014';
    this.notificationsApiUrl = process.env.NOTIFICATIONS_API_URL || 'http://localhost:3013';
  }

  /**
   * Créer automatiquement un incident à partir d'un refus de livraison
   */
  async createIncidentFromRefusal(
    delivery: IDelivery,
    signature: any,
    refusalDetails: IRefusalDetails
  ): Promise<IIncident> {
    const incidentId = await (Incident as any).generateIncidentId();

    const incident = new Incident({
      incidentId,
      deliveryId: delivery.deliveryId,
      recipientId: delivery.recipientId,
      siteId: delivery.siteId,
      industrialId: delivery.industrialId,
      supplierId: delivery.supplierId,
      transporterId: delivery.transport.carrierId,
      type: this.mapRefusalReasonToIncidentType(refusalDetails.reason),
      severity: refusalDetails.actionTaken === 'total_refusal' ? 'critical' : 'major',
      category: 'transport',
      title: `Livraison refusée: ${refusalDetails.reason}`,
      description: refusalDetails.detailedReason,
      affectedItems: refusalDetails.affectedItems?.map(item => ({
        itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        reference: item.reference,
        description: item.description,
        quantityAffected: item.quantity,
        damageType: 'wrong' as const,
        damageDescription: item.issue
      })) || [],
      photos: [],
      status: 'reported',
      reportedAt: new Date(),
      reportedBy: {
        userId: signature.signatureId,
        name: signature.signerName,
        role: signature.signerRole,
        email: signature.signerEmail
      },
      acknowledgements: [],
      notifications: {
        transporterNotified: false,
        industrialNotified: false,
        supplierNotified: false
      },
      billingBlocked: true,
      billingBlockedAt: new Date(),
      billingBlockedReason: `Refus de livraison: ${refusalDetails.reason}`,
      timeline: [],
      priority: 'urgent',
      tags: ['refusal', 'auto_generated'],
      metadata: {
        source: 'system'
      }
    });

    (incident as any).addTimelineEvent(
      'reported',
      {
        id: 'system',
        type: 'system',
        name: 'System'
      },
      `Incident créé automatiquement suite au refus de livraison`
    );

    await incident.save();

    // Envoyer les notifications
    await this.sendIncidentNotifications(incident, delivery);

    // Bloquer la facturation
    await this.blockBilling(incident, delivery);

    return incident;
  }

  /**
   * Mapper une raison de refus vers un type d'incident
   */
  private mapRefusalReasonToIncidentType(
    reason: IRefusalDetails['reason']
  ): IIncident['type'] {
    const mapping: Record<IRefusalDetails['reason'], IIncident['type']> = {
      'damaged': 'damage',
      'wrong_product': 'wrong_product',
      'late_delivery': 'delay',
      'no_order': 'other',
      'incomplete': 'partial_refusal',
      'quality_issue': 'quality_issue',
      'other': 'other'
    };

    return mapping[reason] || 'other';
  }

  /**
   * Envoyer les notifications d'incident à toutes les parties prenantes
   */
  async sendIncidentNotifications(
    incident: IIncident,
    delivery: IDelivery
  ): Promise<void> {
    try {
      const notificationData = {
        incidentId: incident.incidentId,
        deliveryId: incident.deliveryId,
        type: incident.type,
        severity: incident.severity,
        title: incident.title,
        description: incident.description,
        reportedAt: incident.reportedAt,
        billingBlocked: incident.billingBlocked
      };

      // Notifier le transporteur
      if (delivery.transport.carrierId) {
        await this.sendNotification(
          'transporter',
          delivery.transport.carrierId,
          `INCIDENT ${incident.severity.toUpperCase()}: ${incident.title}`,
          incident.description,
          'urgent',
          notificationData
        );

        incident.notifications.transporterNotified = true;
        incident.notifications.transporterNotifiedAt = new Date();
      }

      // Notifier l'industriel
      await this.sendNotification(
        'industrial',
        delivery.industrialId,
        `INCIDENT ${incident.severity.toUpperCase()}: ${incident.title}`,
        incident.description,
        incident.severity === 'critical' ? 'urgent' : 'high',
        notificationData
      );

      incident.notifications.industrialNotified = true;
      incident.notifications.industrialNotifiedAt = new Date();

      // Notifier le fournisseur si présent
      if (delivery.supplierId) {
        await this.sendNotification(
          'supplier',
          delivery.supplierId,
          `INCIDENT: ${incident.title}`,
          incident.description,
          'normal',
          notificationData
        );

        incident.notifications.supplierNotified = true;
        incident.notifications.supplierNotifiedAt = new Date();
      }

      await incident.save();

      console.log(`Notifications sent for incident ${incident.incidentId}`);
    } catch (error: any) {
      console.error('Error sending incident notifications:', error.message);
    }
  }

  /**
   * Envoyer une notification
   */
  private async sendNotification(
    recipientType: string,
    recipientId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
    data?: any
  ): Promise<void> {
    try {
      const channels = priority === 'urgent' ? ['email', 'sms', 'push'] : ['email', 'push'];

      await axios.post(
        `${this.notificationsApiUrl}/notifications/send`,
        {
          recipientType,
          recipientId,
          title,
          message,
          data,
          priority,
          channels
        },
        {
          timeout: 5000
        }
      );
    } catch (error: any) {
      console.error(`Error sending notification to ${recipientType} ${recipientId}:`, error.message);
    }
  }

  /**
   * Bloquer la préfacturation pour un incident
   */
  async blockBilling(incident: IIncident, delivery: IDelivery): Promise<void> {
    try {
      await axios.post(
        `${this.billingApiUrl}/billing/block`,
        {
          deliveryId: delivery.deliveryId,
          incidentId: incident.incidentId,
          reason: incident.billingBlockedReason,
          severity: incident.severity,
          blockedAt: incident.billingBlockedAt
        },
        {
          timeout: 5000
        }
      );

      console.log(`Billing blocked for delivery ${delivery.deliveryId} due to incident ${incident.incidentId}`);

      // Émettre un événement
      await this.emitEvent('destinataire.billing.blocked', {
        deliveryId: delivery.deliveryId,
        incidentId: incident.incidentId,
        recipientId: incident.recipientId,
        severity: incident.severity
      });
    } catch (error: any) {
      console.error(`Error blocking billing for incident ${incident.incidentId}:`, error.message);
    }
  }

  /**
   * Débloquer la facturation après résolution
   */
  async unblockBilling(incident: IIncident): Promise<void> {
    try {
      await axios.post(
        `${this.billingApiUrl}/billing/unblock`,
        {
          deliveryId: incident.deliveryId,
          incidentId: incident.incidentId,
          resolvedAt: incident.resolution?.resolvedAt
        },
        {
          timeout: 5000
        }
      );

      console.log(`Billing unblocked for delivery ${incident.deliveryId}`);

      // Émettre un événement
      await this.emitEvent('destinataire.billing.unblocked', {
        deliveryId: incident.deliveryId,
        incidentId: incident.incidentId,
        recipientId: incident.recipientId
      });
    } catch (error: any) {
      console.error(`Error unblocking billing for incident ${incident.incidentId}:`, error.message);
    }
  }

  /**
   * Envoyer les notifications de résolution d'incident
   */
  async sendResolutionNotifications(incident: IIncident): Promise<void> {
    try {
      const notificationData = {
        incidentId: incident.incidentId,
        deliveryId: incident.deliveryId,
        resolution: incident.resolution,
        resolvedAt: incident.resolution?.resolvedAt,
        billingUnblocked: !incident.billingBlocked
      };

      // Notifier toutes les parties prenantes
      const recipients = [
        { type: 'industrial', id: incident.industrialId },
        { type: 'transporter', id: incident.transporterId },
        { type: 'supplier', id: incident.supplierId }
      ].filter(r => r.id);

      for (const recipient of recipients) {
        await this.sendNotification(
          recipient.type,
          recipient.id!,
          `Incident résolu: ${incident.incidentId}`,
          `L'incident "${incident.title}" a été résolu. Action: ${incident.resolution?.action}`,
          'normal',
          notificationData
        );
      }

      // Émettre un événement
      await this.emitEvent('destinataire.incident.resolved', {
        incidentId: incident.incidentId,
        deliveryId: incident.deliveryId,
        recipientId: incident.recipientId,
        resolution: incident.resolution
      });
    } catch (error: any) {
      console.error('Error sending resolution notifications:', error.message);
    }
  }

  /**
   * Calculer des statistiques d'incidents pour un destinataire
   */
  async calculateIncidentStats(recipientId: string, period: 'week' | 'month' | 'year'): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    resolutionRate: number;
    averageResolutionTime: number;
  }> {
    try {
      const startDate = this.getStartDate(period);

      const incidents = await Incident.find({
        recipientId,
        reportedAt: { $gte: startDate }
      });

      const bySeverity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      incidents.forEach(incident => {
        // Comptage par sévérité
        bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;

        // Comptage par type
        byType[incident.type] = (byType[incident.type] || 0) + 1;

        // Temps de résolution
        if (incident.status === 'resolved' && incident.resolution) {
          resolvedCount++;
          const resolutionTime =
            incident.resolution.resolvedAt.getTime() - incident.reportedAt.getTime();
          totalResolutionTime += resolutionTime;
        }
      });

      const averageResolutionTime = resolvedCount > 0
        ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)) // en heures
        : 0;

      const resolutionRate = incidents.length > 0
        ? Math.round((resolvedCount / incidents.length) * 100)
        : 0;

      return {
        total: incidents.length,
        bySeverity,
        byType,
        resolutionRate,
        averageResolutionTime
      };
    } catch (error: any) {
      console.error('Error calculating incident stats:', error.message);
      return {
        total: 0,
        bySeverity: {},
        byType: {},
        resolutionRate: 0,
        averageResolutionTime: 0
      };
    }
  }

  /**
   * Obtenir la date de début pour une période donnée
   */
  private getStartDate(period: 'week' | 'month' | 'year'): Date {
    const now = new Date();

    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Émettre un événement vers l'API Events
   */
  private async emitEvent(eventType: string, data: any): Promise<void> {
    try {
      // TODO: Implémenter l'envoi d'événements vers une API Events ou message queue
      console.log(`Event emitted: ${eventType}`, data);
    } catch (error: any) {
      console.error('Error emitting event:', error.message);
    }
  }
}

import { v4 as uuidv4 } from 'uuid';
import Notification, { NotificationType } from '../models/Notification';
import PalletCheque from '../models/PalletCheque';
import PalletDispute from '../models/PalletDispute';
import PalletSite from '../models/PalletSite';

/**
 * Service de notifications multi-canaux
 * Supporte: email, sms, push, webhook
 */

interface NotificationRecipient {
  type: NotificationType;
  address: string; // email, phone, deviceId, or webhook URL
}

/**
 * Notifier un changement de statut de chèque
 */
export async function notifyChequeStatusChange(
  chequeId: string,
  newStatus: string,
  recipients: NotificationRecipient[]
): Promise<void> {
  try {
    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      throw new Error('Chèque non trouvé');
    }

    const statusMessages: Record<string, string> = {
      EMIS: 'émis',
      EN_TRANSIT: 'en transit',
      DEPOSE: 'déposé',
      RECU: 'reçu',
      LITIGE: 'en litige',
      ANNULE: 'annulé',
    };

    const subject = `Chèque-palette ${chequeId} - Statut: ${statusMessages[newStatus] || newStatus}`;
    const body = `Le chèque-palette ${chequeId} (${cheque.quantity} ${cheque.palletType}) a changé de statut: ${statusMessages[newStatus] || newStatus}.\n\nDe: ${cheque.fromCompanyName}\nVers: ${cheque.toSiteName}\n\nDate: ${new Date().toLocaleString('fr-FR')}`;

    for (const recipient of recipients) {
      await createNotification({
        type: recipient.type,
        recipient: recipient.address,
        subject,
        body,
        relatedEntity: { type: 'cheque', id: chequeId },
        metadata: {
          chequeId,
          companyId: cheque.fromCompanyId,
          action: `status_change_${newStatus}`,
        },
      });
    }

    console.log(`[Notification] ${recipients.length} notification(s) créée(s) pour chèque ${chequeId}`);
  } catch (error) {
    console.error('[Notification] Erreur notifyChequeStatusChange:', error);
    throw error;
  }
}

/**
 * Notifier une mise à jour de litige
 */
export async function notifyDisputeUpdate(
  disputeId: string,
  action: string,
  recipients: NotificationRecipient[]
): Promise<void> {
  try {
    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      throw new Error('Litige non trouvé');
    }

    const actionMessages: Record<string, string> = {
      created: 'ouvert',
      proposed: 'résolution proposée',
      resolved: 'résolu',
      escalated: 'escaladé',
      commented: 'commentaire ajouté',
    };

    const subject = `Litige ${disputeId} - ${actionMessages[action] || action}`;
    const body = `Le litige ${disputeId} a été mis à jour.\n\nAction: ${actionMessages[action] || action}\nType: ${dispute.type}\nStatut: ${dispute.status}\nPriorité: ${dispute.priority}\n\nChèque: ${dispute.chequeId}\nInitiateur: ${dispute.initiatorName}\nRépondant: ${dispute.respondentName}\n\nDate: ${new Date().toLocaleString('fr-FR')}`;

    for (const recipient of recipients) {
      await createNotification({
        type: recipient.type,
        recipient: recipient.address,
        subject,
        body,
        relatedEntity: { type: 'dispute', id: disputeId },
        metadata: {
          disputeId,
          chequeId: dispute.chequeId,
          companyId: dispute.initiatorId,
          action: `dispute_${action}`,
        },
      });
    }

    console.log(`[Notification] ${recipients.length} notification(s) créée(s) pour litige ${disputeId}`);
  } catch (error) {
    console.error('[Notification] Erreur notifyDisputeUpdate:', error);
    throw error;
  }
}

/**
 * Notifier une alerte de quota
 */
export async function notifyQuotaAlert(
  siteId: string,
  percentUsed: number
): Promise<void> {
  try {
    const site = await PalletSite.findOne({ siteId });
    if (!site) {
      throw new Error('Site non trouvé');
    }

    // Vérifier s'il y a un contact email
    if (!site.contactEmail) {
      console.log(`[Notification] Pas d'email de contact pour site ${siteId}`);
      return;
    }

    const subject = `Alerte Quota - ${site.siteName} - ${percentUsed}% utilisé`;
    const body = `Le site ${site.siteName} a atteint ${percentUsed}% de son quota journalier.\n\nQuota actuel: ${site.quota.currentDaily}/${site.quota.maxDaily}\nQuota hebdomadaire: ${site.quota.currentWeekly}/${site.quota.maxWeekly}\n\n${percentUsed >= 90 ? 'ATTENTION: Quota presque atteint!' : 'Veuillez surveiller les dépôts.'}\n\nDate: ${new Date().toLocaleString('fr-FR')}`;

    await createNotification({
      type: 'email',
      recipient: site.contactEmail,
      subject,
      body,
      relatedEntity: { type: 'quota', id: siteId },
      metadata: {
        siteId,
        companyId: site.companyId,
        action: `quota_alert_${percentUsed}`,
      },
    });

    console.log(`[Notification] Alerte quota créée pour site ${siteId} (${percentUsed}%)`);
  } catch (error) {
    console.error('[Notification] Erreur notifyQuotaAlert:', error);
    throw error;
  }
}

/**
 * Notifier une escalade de litige
 */
export async function notifyEscalation(
  disputeId: string,
  reason: string
): Promise<void> {
  try {
    const dispute = await PalletDispute.findOne({ disputeId });
    if (!dispute) {
      throw new Error('Litige non trouvé');
    }

    const subject = `ESCALADE - Litige ${disputeId}`;
    const body = `Le litige ${disputeId} a été escaladé.\n\nRaison: ${reason}\n\nType: ${dispute.type}\nPriorité: ${dispute.priority}\nStatut: ${dispute.status}\n\nChèque: ${dispute.chequeId}\nInitiateur: ${dispute.initiatorName}\nRépondant: ${dispute.respondentName}\n\nDescription:\n${dispute.description}\n\nACTION REQUISE: Ce litige nécessite une intervention prioritaire.\n\nDate: ${new Date().toLocaleString('fr-FR')}`;

    // Notifier les deux parties (simulation avec webhook)
    const recipients: NotificationRecipient[] = [
      { type: 'webhook', address: `https://api.example.com/webhook/disputes/${disputeId}/escalated` },
    ];

    for (const recipient of recipients) {
      await createNotification({
        type: recipient.type,
        recipient: recipient.address,
        subject,
        body,
        relatedEntity: { type: 'dispute', id: disputeId },
        metadata: {
          disputeId,
          chequeId: dispute.chequeId,
          action: 'dispute_escalated',
        },
      });
    }

    console.log(`[Notification] Escalade notifiée pour litige ${disputeId}`);
  } catch (error) {
    console.error('[Notification] Erreur notifyEscalation:', error);
    throw error;
  }
}

/**
 * Créer une notification dans la base de données
 */
async function createNotification(data: {
  type: NotificationType;
  recipient: string;
  subject?: string;
  body: string;
  relatedEntity?: { type: 'cheque' | 'dispute' | 'site' | 'quota'; id: string };
  metadata?: any;
}): Promise<void> {
  try {
    const notificationId = `NOTIF-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    const notification = await Notification.create({
      notificationId,
      type: data.type,
      recipient: data.recipient,
      subject: data.subject,
      body: data.body,
      status: 'pending',
      relatedEntity: data.relatedEntity,
      metadata: data.metadata,
      retryCount: 0,
      maxRetries: 3,
    });

    // Simuler l'envoi (dans un vrai système, appeler le service d'envoi réel)
    setTimeout(() => simulateSend(notification.notificationId), 1000);
  } catch (error) {
    console.error('[Notification] Erreur createNotification:', error);
    throw error;
  }
}

/**
 * Simuler l'envoi d'une notification
 * Dans un vrai système, ceci appellerait les APIs externes (SendGrid, Twilio, FCM, etc.)
 */
async function simulateSend(notificationId: string): Promise<void> {
  try {
    const notification = await Notification.findOne({ notificationId });
    if (!notification) return;

    // Simuler un succès (95% de réussite)
    const success = Math.random() > 0.05;

    if (success) {
      notification.status = 'sent';
      notification.sentAt = new Date();

      // Simuler la livraison pour certains types
      if (notification.type === 'email' || notification.type === 'sms') {
        notification.status = 'delivered';
        notification.deliveredAt = new Date();
      }
    } else {
      notification.status = 'failed';
      notification.error = 'Erreur simulée lors de l\'envoi';
      notification.retryCount += 1;

      // Réessayer si pas atteint le max
      if (notification.retryCount < notification.maxRetries) {
        setTimeout(() => simulateSend(notificationId), 5000);
      }
    }

    await notification.save();
  } catch (error) {
    console.error('[Notification] Erreur simulateSend:', error);
  }
}

/**
 * Interface pour les préférences de notifications
 */
export interface NotificationSettings {
  companyId: string;
  channels: {
    email: { enabled: boolean; address?: string };
    sms: { enabled: boolean; phone?: string };
    push: { enabled: boolean; deviceId?: string };
    webhook: { enabled: boolean; url?: string };
  };
  events: {
    chequeStatusChange: boolean;
    disputeCreated: boolean;
    disputeResolved: boolean;
    disputeEscalated: boolean;
    quotaAlert: boolean;
  };
  quotaAlertThresholds: {
    daily: number; // pourcentage
    weekly: number; // pourcentage
  };
}

// Stocker les paramètres en mémoire (dans un vrai système, utiliser la DB)
const notificationSettingsStore = new Map<string, NotificationSettings>();

/**
 * Sauvegarder les paramètres de notification
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  notificationSettingsStore.set(settings.companyId, settings);
  console.log(`[Notification] Paramètres sauvegardés pour ${settings.companyId}`);
}

/**
 * Récupérer les paramètres de notification
 */
export function getNotificationSettings(companyId: string): NotificationSettings | undefined {
  return notificationSettingsStore.get(companyId);
}

/**
 * Récupérer tous les paramètres
 */
export function getAllNotificationSettings(): NotificationSettings[] {
  return Array.from(notificationSettingsStore.values());
}

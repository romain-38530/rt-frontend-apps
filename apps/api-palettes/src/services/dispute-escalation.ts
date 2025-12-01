import PalletDispute from '../models/PalletDispute';
import { notifyEscalation } from './notifications';

/**
 * Service d'auto-escalation des litiges
 * Vérifie les litiges ouverts depuis plus de 48h sans résolution
 * et les escalade automatiquement
 */

const ESCALATION_THRESHOLD_HOURS = 48;

export async function checkAndEscalateDisputes(): Promise<void> {
  try {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - ESCALATION_THRESHOLD_HOURS);

    // Trouver les litiges ouverts depuis plus de 48h
    const disputesToEscalate = await PalletDispute.find({
      status: { $in: ['OPEN', 'PROPOSED'] },
      createdAt: { $lt: threshold },
    });

    console.log(`[Escalation Check] ${disputesToEscalate.length} litiges à escalader`);

    for (const dispute of disputesToEscalate) {
      const hoursOpen = Math.round(
        (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60)
      );

      // Escalader le litige
      dispute.status = 'ESCALATED';
      dispute.priority = 'high';

      const escalationReason = `Auto-escalade: Litige ouvert depuis ${hoursOpen}h sans résolution (seuil: ${ESCALATION_THRESHOLD_HOURS}h)`;

      dispute.auditTrail.push({
        action: 'AUTO_ESCALADE',
        by: 'système',
        at: new Date(),
        details: escalationReason,
      });

      await dispute.save();

      // Notifier les parties concernées
      try {
        await notifyEscalation(dispute.disputeId, escalationReason);
      } catch (notifError) {
        console.error(`[Escalation] Erreur notification pour ${dispute.disputeId}:`, notifError);
      }

      console.log(`[Escalation] Litige ${dispute.disputeId} escaladé (${hoursOpen}h)`);
    }
  } catch (error) {
    console.error('[Escalation] Erreur lors de la vérification:', error);
  }
}

/**
 * Récupère les litiges en attente d'escalation
 * (ouverts depuis plus de 40h mais pas encore escaladés)
 */
export async function getPendingEscalationDisputes() {
  const threshold40h = new Date();
  threshold40h.setHours(threshold40h.getHours() - 40);

  const threshold48h = new Date();
  threshold48h.setHours(threshold48h.getHours() - ESCALATION_THRESHOLD_HOURS);

  const disputes = await PalletDispute.find({
    status: { $in: ['OPEN', 'PROPOSED'] },
    createdAt: { $lt: threshold40h },
  }).sort({ createdAt: 1 });

  return disputes.map(dispute => {
    const hoursOpen = Math.round(
      (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60)
    );
    const hoursUntilEscalation = ESCALATION_THRESHOLD_HOURS - hoursOpen;

    return {
      disputeId: dispute.disputeId,
      chequeId: dispute.chequeId,
      type: dispute.type,
      status: dispute.status,
      priority: dispute.priority,
      hoursOpen,
      hoursUntilEscalation: Math.max(0, hoursUntilEscalation),
      willEscalate: hoursOpen >= ESCALATION_THRESHOLD_HOURS,
      createdAt: dispute.createdAt,
      initiatorName: dispute.initiatorName,
      respondentName: dispute.respondentName,
    };
  });
}

/**
 * Initialise le scheduler d'escalation automatique
 * Vérifie toutes les heures
 */
export function startEscalationScheduler(): NodeJS.Timeout {
  console.log('[Escalation Scheduler] Démarrage - vérification chaque heure');

  // Vérification immédiate au démarrage
  checkAndEscalateDisputes();

  // Puis toutes les heures
  const interval = setInterval(() => {
    checkAndEscalateDisputes();
  }, 60 * 60 * 1000); // 1 heure

  return interval;
}

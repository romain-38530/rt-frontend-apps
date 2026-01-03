/**
 * Routes pour les actions email et le traitement des emails entrants
 */
import { Router, Request, Response } from 'express';
import EmailActionService from '../services/email-action-service';
import InboundEmailService from '../services/inbound-email-service';

const router = Router();

/**
 * GET /actions/:token
 * Page d'action depuis un lien email
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const action = await EmailActionService.getActionByToken(token);

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Lien invalide ou expire',
        message: 'Ce lien n\'est plus valide. Veuillez demander un nouveau lien.'
      });
    }

    if (action.status === 'executed') {
      return res.json({
        success: true,
        alreadyExecuted: true,
        message: 'Cette action a deja ete effectuee.',
        executedAt: action.executedAt
      });
    }

    if (action.status === 'expired' || action.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Lien expire',
        message: 'Ce lien a expire. Veuillez demander un nouveau lien.',
        expiredAt: action.expiresAt
      });
    }

    // Tenter d'executer l'action directement
    const result = await EmailActionService.executeAction(token);

    // Si l'action necessite une saisie utilisateur
    if (result.success && result.data?.requiresInput) {
      return res.json({
        success: true,
        requiresInput: true,
        inputType: result.data.inputType,
        actionId: action.actionId,
        actionType: action.actionType,
        orderReference: action.orderReference,
        ...result.data
      });
    }

    // Si redirection
    if (result.success && result.data?.redirect) {
      return res.redirect(result.data.redirect);
    }

    // Action executee avec succes
    if (result.success) {
      return res.json({
        success: true,
        message: result.message || 'Action effectuee avec succes',
        data: result.data
      });
    }

    return res.status(400).json({
      success: false,
      error: result.error
    });

  } catch (error: any) {
    console.error('[EmailActions] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /actions/:token
 * Soumet les donnees pour une action (position, signature, formulaire)
 */
router.post('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const executionData = req.body;

    const result = await EmailActionService.executeAction(token, executionData);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message || 'Action effectuee avec succes',
        data: result.data
      });
    }

    return res.status(400).json({
      success: false,
      error: result.error
    });

  } catch (error: any) {
    console.error('[EmailActions] POST Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /webhooks/ses-inbound
 * Webhook pour les emails entrants via AWS SNS
 */
router.post('/webhooks/ses-inbound', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Gerer la confirmation d'abonnement SNS
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('[EmailWebhook] SNS Subscription confirmation received');
      console.log('SubscribeURL:', body.SubscribeURL);
      // En production: faire un GET sur SubscribeURL pour confirmer
      return res.status(200).send('OK');
    }

    // Gerer les notifications
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);

      // Verifier que c'est bien un email entrant
      if (message.notificationType === 'Received') {
        console.log(`[EmailWebhook] Inbound email from: ${message.mail.source}`);

        // Traiter l'email de maniere asynchrone
        InboundEmailService.processInboundEmail(message)
          .then(email => {
            console.log(`[EmailWebhook] Email processed: ${email.emailId}, intent: ${email.claudeAnalysis?.intent}`);
          })
          .catch(error => {
            console.error('[EmailWebhook] Processing error:', error.message);
          });

        return res.status(200).send('OK');
      }
    }

    // Message non reconnu
    console.log('[EmailWebhook] Unknown message type:', body.Type);
    res.status(200).send('OK');

  } catch (error: any) {
    console.error('[EmailWebhook] Error:', error.message);
    // Toujours repondre 200 a SNS pour eviter les retries
    res.status(200).send('OK');
  }
});

/**
 * GET /emails/order/:orderId
 * Recupere les emails lies a une commande
 */
router.get('/emails/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const emails = await InboundEmailService.getEmailsForOrder(orderId);

    res.json({
      success: true,
      count: emails.length,
      emails: emails.map(e => ({
        emailId: e.emailId,
        from: { email: e.fromEmail, name: e.fromName },
        subject: e.subject,
        receivedAt: e.receivedAt,
        status: e.status,
        analysis: e.claudeAnalysis ? {
          intent: e.claudeAnalysis.intent,
          confidence: e.claudeAnalysis.confidence,
          summary: e.claudeAnalysis.summary,
          urgency: e.claudeAnalysis.urgency
        } : null,
        actionsExecuted: e.actionsExecuted?.length || 0,
        autoReplySent: e.autoReply?.sent || false
      }))
    });

  } catch (error: any) {
    console.error('[EmailActions] Get emails error:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /emails/stats
 * Statistiques des emails traites
 */
router.get('/emails/stats', async (req: Request, res: Response) => {
  try {
    const stats = await InboundEmailService.getEmailStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('[EmailActions] Stats error:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /emails/pending
 * Emails en attente de traitement
 */
router.get('/emails/pending', async (req: Request, res: Response) => {
  try {
    const emails = await InboundEmailService.getPendingEmails();
    res.json({
      success: true,
      count: emails.length,
      emails
    });
  } catch (error: any) {
    console.error('[EmailActions] Pending emails error:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /actions/stats/:orderId?
 * Statistiques des actions email
 */
router.get('/stats/:orderId?', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const stats = await EmailActionService.getActionStats(orderId);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('[EmailActions] Action stats error:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;

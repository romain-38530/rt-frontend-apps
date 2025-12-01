/**
 * Routes: Broadcast
 * POST /affretia/broadcast - Diffusion multi-canal
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AffretSession from '../models/AffretSession';
import BroadcastCampaign from '../models/BroadcastCampaign';
import { getEventEmitter } from '../modules/events';

const router = Router();

/**
 * POST / - Lancer une diffusion
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      channels = ['email', 'marketplace', 'push'],
      message,
      deadline,
      estimatedPrice
    } = req.body;

    const session = await AffretSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (!session.shortlist || session.shortlist.carriers.length === 0) {
      return res.status(400).json({ error: 'Shortlist non générée. Lancez d\'abord l\'analyse.' });
    }

    // Créer la campagne de diffusion
    const broadcastId = uuidv4();
    const deadlineDate = deadline ? new Date(deadline) : new Date(Date.now() + 2 * 60 * 60 * 1000); // +2h par défaut

    // Préparer les destinataires
    const recipients = session.shortlist.carriers.map(carrier => ({
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      email: `${carrier.carrierId}@demo.com`, // Demo
      phone: '+33600000000',
      channel: channels[Math.floor(Math.random() * channels.length)],
      status: 'pending'
    }));

    const campaign = new BroadcastCampaign({
      sessionId,
      orderId: session.orderId,
      channels,
      message,
      estimatedPrice: estimatedPrice || 0,
      deadline: deadlineDate,
      recipients,
      stats: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        responded: 0,
        bounced: 0,
        failed: 0
      },
      status: 'sending'
    });

    await campaign.save();

    // Simuler l'envoi
    campaign.stats.totalSent = recipients.length;
    campaign.stats.delivered = Math.floor(recipients.length * 0.95);
    campaign.status = 'sent';
    await campaign.save();

    // Mettre à jour la session
    session.broadcast = {
      id: broadcastId,
      channels,
      sentAt: new Date(),
      stats: campaign.stats
    };
    session.status = 'awaiting_responses';
    await session.save();

    // Émettre événement
    const eventEmitter = getEventEmitter();
    eventEmitter.emitBroadcasted(
      sessionId,
      broadcastId,
      channels,
      recipients.length,
      estimatedPrice || 0,
      session.organizationId
    );

    res.json({
      success: true,
      broadcastId: campaign._id,
      recipientsCount: recipients.length,
      channels,
      deadline: deadlineDate,
      stats: campaign.stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id - Détails d'une campagne
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await BroadcastCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /session/:sessionId - Campagnes d'une session
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const campaigns = await BroadcastCampaign.find({ sessionId: req.params.sessionId });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:id/track - Tracker un événement (ouverture, clic, etc.)
 */
router.post('/:id/track', async (req: Request, res: Response) => {
  try {
    const { carrierId, event } = req.body; // event: 'delivered', 'opened', 'clicked'

    const campaign = await BroadcastCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    await (campaign as any).updateRecipientStatus(carrierId, event);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

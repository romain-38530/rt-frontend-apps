/**
 * Routes: Trigger
 * POST /affretia/trigger - Déclencher AFFRET.IA
 * GET /affretia/sessions - Lister les sessions
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AffretSession from '../models/AffretSession';
import { getEventEmitter } from '../modules/events';

const router = Router();

/**
 * POST / - Déclencher une nouvelle session AFFRET.IA
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      triggerType,
      reason,
      organizationId,
      userId,
      priority,
      maxPrice,
      maxResponseTime
    } = req.body;

    // Validation
    if (!orderId || !organizationId) {
      return res.status(400).json({
        error: 'orderId et organizationId sont requis'
      });
    }

    // Vérifier si une session active existe déjà pour cette commande
    const existingSession = await AffretSession.findOne({
      orderId,
      status: { $nin: ['closed', 'failed', 'cancelled'] }
    });

    if (existingSession) {
      return res.status(409).json({
        error: 'Une session AFFRET.IA est déjà active pour cette commande',
        sessionId: existingSession._id
      });
    }

    // Créer la session
    const session = new AffretSession({
      orderId,
      organizationId,
      status: 'pending',
      triggerType: triggerType || 'manual',
      triggerReason: reason,
      priority: priority || 'normal',
      createdBy: userId
    });

    await session.save();

    // Émettre l'événement approprié
    const eventEmitter = getEventEmitter();
    if (triggerType === 'manual') {
      eventEmitter.emitTriggerManual(
        session._id.toString(),
        orderId,
        userId || 'system',
        reason,
        organizationId
      );
    } else if (triggerType === 'capability-gap') {
      eventEmitter.emitTriggerCapabilityGap(
        session._id.toString(),
        orderId,
        [], // missingCapabilities sera rempli lors de l'analyse
        0,
        organizationId
      );
    } else {
      eventEmitter.emitTriggerNoCarrierAccepted(
        session._id.toString(),
        orderId,
        'no_response',
        0,
        0,
        organizationId
      );
    }

    // Mettre à jour le status
    session.status = 'analyzing';
    await session.save();

    res.status(201).json({
      success: true,
      sessionId: session._id,
      status: session.status,
      message: 'Session AFFRET.IA créée avec succès'
    });
  } catch (error: any) {
    console.error('Error creating AFFRET.IA session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET / - Lister les sessions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    if (status) filter.status = status;

    const sessions = await AffretSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AffretSession.countDocuments(filter);

    res.json({
      sessions,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id - Détails d'une session
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await AffretSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:id/cancel - Annuler une session
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const session = await AffretSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (['closed', 'failed', 'cancelled'].includes(session.status)) {
      return res.status(400).json({ error: 'Session déjà terminée' });
    }

    session.status = 'cancelled';
    session.closedAt = new Date();
    session.closedReason = reason || 'Annulée par l\'utilisateur';
    await session.save();

    res.json({
      success: true,
      sessionId: session._id,
      status: session.status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /analyze - Analyser une commande (shortlist)
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId, orderData } = req.body;

    const session = await AffretSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Simuler la génération d'une shortlist (20-200 transporteurs)
    const shortlistId = uuidv4();
    const carriers = [];

    // Générer des transporteurs fictifs pour demo
    const numCarriers = Math.floor(Math.random() * 30) + 20;
    for (let i = 0; i < numCarriers; i++) {
      carriers.push({
        carrierId: `carrier-${i + 1}`,
        carrierName: `Transporteur ${i + 1}`,
        score: Math.floor(Math.random() * 40) + 60,
        matchScore: Math.floor(Math.random() * 30) + 70,
        estimatedPrice: Math.floor(Math.random() * 500) + 500,
        distance: Math.floor(Math.random() * 100) + 10
      });
    }

    // Trier par score
    carriers.sort((a, b) => b.score - a.score);

    session.shortlist = {
      id: shortlistId,
      carriers,
      generatedAt: new Date()
    };
    session.status = 'shortlist_generated';
    await session.save();

    // Émettre événement
    const eventEmitter = getEventEmitter();
    eventEmitter.emitShortlistGenerated(
      sessionId,
      shortlistId,
      carriers.length,
      {
        geographic: Math.floor(Math.random() * 30) + 70,
        temporal: Math.floor(Math.random() * 20) + 80,
        capability: Math.floor(Math.random() * 25) + 75,
        historical: Math.floor(Math.random() * 35) + 65
      },
      session.organizationId
    );

    res.json({
      success: true,
      shortlistId,
      totalCandidates: carriers.length,
      topCarriers: carriers.slice(0, 10)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

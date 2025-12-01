/**
 * Routes: Proposals
 * Gestion des propositions transporteurs
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AffretSession from '../models/AffretSession';
import CarrierProposal from '../models/CarrierProposal';
import { getEventEmitter } from '../modules/events';
import { aiScoringEngine } from '../modules/ai-scoring-engine';

const router = Router();

/**
 * POST / - Créer une proposition (transporteur répond)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      carrierId,
      carrierName,
      responseType,
      proposedPrice,
      pickupDate,
      deliveryDate,
      vehicle,
      conditions
    } = req.body;

    const session = await AffretSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Calculer le temps de réponse
    const responseTime = Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000);

    // Trouver le prix estimé original
    const shortlistCarrier = session.shortlist?.carriers.find(c => c.carrierId === carrierId);
    const originalEstimate = shortlistCarrier?.estimatedPrice || proposedPrice;

    // Créer la proposition
    const proposal = new CarrierProposal({
      sessionId,
      carrierId,
      carrierName,
      responseType: responseType || 'accept',
      proposedPrice,
      originalEstimate,
      currency: 'EUR',
      pickupDate: new Date(pickupDate),
      deliveryDate: new Date(deliveryDate),
      vehicle,
      conditions,
      respondedAt: new Date(),
      responseTime,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
      status: 'pending'
    });

    // Calculer le score IA
    const scoringResult = aiScoringEngine.calculateTotalScore(
      {
        carrierId,
        carrierName,
        proposedPrice,
        distance: shortlistCarrier?.distance,
        responseTime
      },
      {
        orderId: session.orderId,
        estimatedPrice: originalEstimate,
        distance: 200, // Demo
        pickupDate,
        deliveryDate,
        goodsType: 'pallet',
        weight: 1000
      }
    );

    proposal.score = scoringResult.totalScore;
    proposal.scoreBreakdown = scoringResult.breakdown;

    await proposal.save();

    // Émettre événement
    const eventEmitter = getEventEmitter();
    eventEmitter.emitCarrierResponded(
      sessionId,
      carrierId,
      carrierName,
      responseType || 'accept',
      responseTime,
      proposedPrice,
      session.organizationId
    );

    res.status(201).json({
      success: true,
      proposalId: proposal._id,
      score: scoringResult.totalScore,
      recommendation: scoringResult.recommendation,
      autoAcceptable: scoringResult.autoAcceptable
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /session/:sessionId - Propositions d'une session
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const proposals = await CarrierProposal.find({ sessionId: req.params.sessionId })
      .sort({ score: -1 });
    res.json(proposals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id - Détails d'une proposition
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const proposal = await CarrierProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }
    res.json(proposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /:id/accept - Accepter une proposition
 */
router.put('/:id/accept', async (req: Request, res: Response) => {
  try {
    const proposal = await CarrierProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    proposal.status = 'accepted';
    await proposal.save();

    // Mettre à jour la session
    const session = await AffretSession.findById(proposal.sessionId);
    if (session) {
      session.selectedProposalId = proposal._id.toString();
      session.selectedCarrierId = proposal.carrierId;
      session.selectedPrice = proposal.proposedPrice;
      session.status = 'selecting';
      await session.save();
    }

    res.json({
      success: true,
      proposalId: proposal._id,
      status: proposal.status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /:id/reject - Rejeter une proposition
 */
router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const proposal = await CarrierProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    proposal.status = 'rejected';
    proposal.conditions = reason || proposal.conditions;
    await proposal.save();

    res.json({
      success: true,
      proposalId: proposal._id,
      status: proposal.status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:id/negotiate - Négocier (contre-offre)
 */
router.post('/:id/negotiate', async (req: Request, res: Response) => {
  try {
    const { counterPrice, message } = req.body;
    const proposal = await CarrierProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    proposal.status = 'negotiating';
    if (!proposal.negotiationHistory) {
      proposal.negotiationHistory = [];
    }
    proposal.negotiationHistory.push({
      type: 'counter',
      from: 'shipper',
      price: counterPrice,
      message,
      timestamp: new Date()
    });
    await proposal.save();

    res.json({
      success: true,
      proposalId: proposal._id,
      status: proposal.status,
      negotiationRound: proposal.negotiationHistory.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id/history - Historique de négociation
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const proposal = await CarrierProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }
    res.json(proposal.negotiationHistory || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

/**
 * Routes: Selection
 * POST /affretia/select - Sélection IA du meilleur transporteur
 */

import { Router, Request, Response } from 'express';
import AffretSession from '../models/AffretSession';
import CarrierProposal from '../models/CarrierProposal';
import { getEventEmitter } from '../modules/events';
import { aiScoringEngine } from '../modules/ai-scoring-engine';

const router = Router();

/**
 * POST / - Exécuter la sélection IA
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, autoAcceptThreshold = 85, priceTolerancePercent = 15 } = req.body;

    const session = await AffretSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Récupérer toutes les propositions en attente
    const proposals = await CarrierProposal.find({
      sessionId,
      status: { $in: ['pending', 'negotiating'] }
    }).sort({ score: -1 });

    if (proposals.length === 0) {
      return res.status(400).json({
        error: 'Aucune proposition disponible pour la sélection'
      });
    }

    // Sélectionner la meilleure proposition
    const bestProposal = proposals[0];
    const priceVariation = bestProposal.priceVariation || 0;

    // Vérifier si auto-acceptation possible
    const canAutoAccept = aiScoringEngine.canAutoAccept(
      bestProposal.score,
      priceVariation
    );

    // Générer des alternatives
    const alternatives = proposals.slice(1, 4).map(p => ({
      carrierId: p.carrierId,
      carrierName: p.carrierName,
      price: p.proposedPrice,
      score: p.score,
      reason: p.score >= 75 ? 'Bon score, alternative viable' :
              p.score >= 60 ? 'Score acceptable' : 'Score insuffisant'
    }));

    // Générer recommandation
    let recommendation = '';
    let confidence = bestProposal.score;

    if (bestProposal.score >= 85) {
      recommendation = `${bestProposal.carrierName} est fortement recommandé avec un score de ${bestProposal.score}/100. Attribution automatique possible.`;
    } else if (bestProposal.score >= 75) {
      recommendation = `${bestProposal.carrierName} est un bon choix avec un score de ${bestProposal.score}/100. Validation recommandée.`;
    } else if (bestProposal.score >= 60) {
      recommendation = `${bestProposal.carrierName} est acceptable avec un score de ${bestProposal.score}/100. Considérer les alternatives.`;
    } else {
      recommendation = `Aucun transporteur n'atteint le score minimum. Relancer la diffusion recommandé.`;
      confidence = 30;
    }

    // Émettre événement
    const eventEmitter = getEventEmitter();
    eventEmitter.emitBestCarrierSelected(
      sessionId,
      bestProposal.carrierId,
      bestProposal.carrierName,
      bestProposal.score,
      bestProposal.proposedPrice,
      {
        priceScore: bestProposal.scoreBreakdown?.price || 0,
        qualityScore: bestProposal.scoreBreakdown?.quality || 0,
        distanceScore: bestProposal.scoreBreakdown?.distance || 0,
        historicalScore: bestProposal.scoreBreakdown?.historical || 0
      },
      session.organizationId
    );

    res.json({
      success: true,
      selectedCarrierId: bestProposal.carrierId,
      selectedCarrierName: bestProposal.carrierName,
      selectedPrice: bestProposal.proposedPrice,
      score: bestProposal.score,
      confidence,
      recommendation,
      alternatives,
      autoAccepted: canAutoAccept,
      priceVariation: `${priceVariation > 0 ? '+' : ''}${priceVariation.toFixed(1)}%`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /decision/:sessionId - Obtenir la décision IA
 */
router.get('/decision/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await AffretSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const proposals = await CarrierProposal.find({
      sessionId: req.params.sessionId
    }).sort({ score: -1 });

    if (proposals.length === 0) {
      return res.json({
        hasDecision: false,
        recommendation: 'Aucune proposition reçue',
        confidence: 0
      });
    }

    const best = proposals[0];

    res.json({
      hasDecision: true,
      recommendation: best.carrierName,
      confidence: best.score,
      proposalId: best._id,
      price: best.proposedPrice,
      scoreBreakdown: best.scoreBreakdown
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

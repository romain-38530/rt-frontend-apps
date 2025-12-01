/**
 * Routes: Assign
 * POST /affretia/assign - Assigner la mission au transporteur
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AffretSession from '../models/AffretSession';
import CarrierProposal from '../models/CarrierProposal';
import { getEventEmitter } from '../modules/events';

const router = Router();

/**
 * POST / - Assigner la mission
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      carrierId,
      proposalId,
      finalPrice,
      trackingLevel = 'basic',
      notes,
      userId
    } = req.body;

    const session = await AffretSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Récupérer la proposition
    let proposal;
    if (proposalId) {
      proposal = await CarrierProposal.findById(proposalId);
    } else if (carrierId) {
      proposal = await CarrierProposal.findOne({ sessionId, carrierId });
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposition non trouvée' });
    }

    // Créer l'assignation
    const assignmentId = uuidv4();
    const assignment = {
      id: assignmentId,
      carrierId: proposal.carrierId,
      carrierName: proposal.carrierName,
      finalPrice: finalPrice || proposal.proposedPrice,
      trackingLevel,
      trackingId: `TRK-${Date.now()}`,
      confirmedAt: new Date()
    };

    // Mettre à jour la session
    session.assignment = assignment;
    session.selectedProposalId = proposal._id.toString();
    session.selectedCarrierId = proposal.carrierId;
    session.selectedPrice = assignment.finalPrice;
    session.status = 'assigned';
    await session.save();

    // Mettre à jour la proposition
    proposal.status = 'accepted';
    await proposal.save();

    // Rejeter les autres propositions
    await CarrierProposal.updateMany(
      { sessionId, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );

    // Émettre événements
    const eventEmitter = getEventEmitter();
    eventEmitter.emitOrderAssigned(
      sessionId,
      session.orderId,
      proposal.carrierId,
      proposal.carrierName,
      assignmentId,
      trackingLevel,
      proposal.pickupDate?.toISOString() || '',
      proposal.deliveryDate?.toISOString() || '',
      session.organizationId
    );

    // Démarrer le tracking
    eventEmitter.emitTrackingStart(
      sessionId,
      assignment.trackingId || '',
      trackingLevel,
      trackingLevel === 'premium' ? 'tomtom' :
        trackingLevel === 'intermediate' ? 'gps_smartphone' : 'email',
      session.organizationId
    );

    res.json({
      success: true,
      assignmentId,
      carrierId: proposal.carrierId,
      carrierName: proposal.carrierName,
      finalPrice: assignment.finalPrice,
      trackingId: assignment.trackingId,
      trackingLevel,
      status: 'assigned',
      message: `Mission assignée à ${proposal.carrierName}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:sessionId - Détails de l'assignation
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await AffretSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (!session.assignment) {
      return res.status(404).json({ error: 'Aucune assignation pour cette session' });
    }

    res.json(session.assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:sessionId/confirm - Confirmer l'assignation (côté transporteur)
 */
router.post('/:sessionId/confirm', async (req: Request, res: Response) => {
  try {
    const { vehicle, driver } = req.body;

    const session = await AffretSession.findById(req.params.sessionId);
    if (!session || !session.assignment) {
      return res.status(404).json({ error: 'Assignation non trouvée' });
    }

    // Mettre à jour avec les infos véhicule/chauffeur
    if (vehicle) {
      session.assignment = {
        ...session.assignment,
        ...vehicle
      };
    }

    session.status = 'in_transit';
    await session.save();

    res.json({
      success: true,
      status: 'in_transit',
      message: 'Assignation confirmée par le transporteur'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

/**
 * Routes: Tracking
 * Configuration et mises à jour du tracking
 */

import { Router, Request, Response } from 'express';
import AffretSession from '../models/AffretSession';
import { getEventEmitter } from '../modules/events';

const router = Router();

// Stockage en mémoire pour les mises à jour tracking (en prod: Redis/DB)
const trackingUpdates: Map<string, any[]> = new Map();

/**
 * GET /levels - Niveaux de tracking disponibles
 */
router.get('/levels', (req: Request, res: Response) => {
  res.json([
    {
      id: 'basic',
      name: 'BASIC - Suivi par E-mail',
      description: 'Mises à jour manuelles par e-mail aux étapes clés',
      frequency: '3-4 points par mission',
      price: 0,
      features: [
        'Notification chargement',
        'Notification en transit',
        'Notification livraison'
      ]
    },
    {
      id: 'intermediate',
      name: 'INTERMÉDIAIRE - GPS Smartphone',
      description: 'Position GPS en temps réel via application mobile',
      frequency: 'Toutes les 5-10 minutes',
      price: 15,
      features: [
        'Position GPS temps réel',
        'ETA dynamique',
        'Alertes de retard',
        'Historique parcours'
      ]
    },
    {
      id: 'premium',
      name: 'PREMIUM - OpenStreetMap',
      description: 'Tracking avancé avec OpenStreetMap, Nominatim et OSRM',
      frequency: 'Toutes les 1-2 minutes',
      price: 25,
      features: [
        'Données véhicule temps réel',
        'Géocodage Nominatim',
        'Routing OSRM optimisé',
        'Géofencing',
        'Alertes intelligentes',
        'Rapports détaillés'
      ]
    }
  ]);
});

/**
 * POST /configure - Configurer le tracking pour une commande
 */
router.post('/configure', async (req: Request, res: Response) => {
  try {
    const { orderId, sessionId, level, provider, alerts } = req.body;

    const session = sessionId ? await AffretSession.findById(sessionId) :
                    await AffretSession.findOne({ orderId });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Mettre à jour le niveau de tracking
    if (session.assignment) {
      session.assignment.trackingLevel = level;
      session.assignment.trackingId = session.assignment.trackingId || `TRK-${Date.now()}`;
    }
    await session.save();

    // Émettre événement
    const eventEmitter = getEventEmitter();
    eventEmitter.emitTrackingStart(
      session._id.toString(),
      session.assignment?.trackingId || '',
      level,
      provider,
      session.organizationId
    );

    res.json({
      success: true,
      trackingId: session.assignment?.trackingId,
      level,
      provider: provider || (level === 'premium' ? 'openstreetmap' :
                level === 'intermediate' ? 'gps_smartphone' : 'email'),
      message: `Tracking ${level} activé`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /update - Recevoir une mise à jour de position
 */
router.post('/update', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      trackingId,
      latitude,
      longitude,
      status,
      timestamp,
      address,
      eta,
      source = 'api'
    } = req.body;

    const update = {
      id: `UPD-${Date.now()}`,
      orderId,
      trackingId,
      location: {
        latitude,
        longitude,
        address
      },
      status,
      eta,
      timestamp: timestamp || new Date().toISOString(),
      source
    };

    // Stocker la mise à jour
    const key = orderId || trackingId;
    if (!trackingUpdates.has(key)) {
      trackingUpdates.set(key, []);
    }
    trackingUpdates.get(key)!.push(update);

    // Limiter à 100 dernières mises à jour
    const updates = trackingUpdates.get(key)!;
    if (updates.length > 100) {
      trackingUpdates.set(key, updates.slice(-100));
    }

    // Mettre à jour le status de la session si nécessaire
    if (status === 'delivered') {
      const session = await AffretSession.findOne({ orderId });
      if (session) {
        session.status = 'delivered';
        await session.save();
      }
    }

    res.json({
      success: true,
      updateId: update.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:orderId - Historique de tracking
 */
router.get('/:orderId', (req: Request, res: Response) => {
  const updates = trackingUpdates.get(req.params.orderId) || [];
  res.json({
    orderId: req.params.orderId,
    updates,
    lastUpdate: updates.length > 0 ? updates[updates.length - 1] : null
  });
});

/**
 * GET /:orderId/eta - ETA estimé
 */
router.get('/:orderId/eta', async (req: Request, res: Response) => {
  try {
    const session = await AffretSession.findOne({ orderId: req.params.orderId });
    const updates = trackingUpdates.get(req.params.orderId) || [];
    const lastUpdate = updates.length > 0 ? updates[updates.length - 1] : null;

    // Calculer ETA (simplifié)
    let eta = null;
    if (lastUpdate?.eta) {
      eta = lastUpdate.eta;
    } else if (session?.assignment) {
      // ETA par défaut basé sur la date de livraison prévue
      eta = session.assignment.confirmedAt;
    }

    res.json({
      orderId: req.params.orderId,
      currentStatus: lastUpdate?.status || session?.status || 'unknown',
      eta,
      confidence: lastUpdate ? 85 : 50,
      lastUpdate: lastUpdate?.timestamp
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

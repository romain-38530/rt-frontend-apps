/**
 * Routes: Bourse
 * Bourse AFFRET.IA - Place de marché
 */

import { Router, Request, Response } from 'express';
import AffretSession from '../models/AffretSession';

const router = Router();

// Stockage en mémoire pour la bourse (en prod: Redis/DB)
const bourseOffers: Map<string, any> = new Map();

/**
 * GET / - Liste des offres sur la bourse
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      visibility = 'public',
      pickupCity,
      deliveryCity,
      maxPrice,
      minWeight,
      maxWeight,
      limit = 50,
      offset = 0
    } = req.query;

    // Récupérer les sessions en attente de réponses
    const sessions = await AffretSession.find({
      status: 'awaiting_responses'
    }).sort({ createdAt: -1 }).limit(100);

    // Convertir en offres de bourse
    let offers = sessions.map(session => ({
      id: session._id,
      sessionId: session._id,
      orderId: session.orderId,
      pickup: {
        city: 'Lyon', // Demo - en prod: récupérer depuis la commande
        postalCode: '69000',
        country: 'FR',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        window: { start: '08:00', end: '12:00' }
      },
      delivery: {
        city: 'Paris', // Demo
        postalCode: '75001',
        country: 'FR',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        window: { start: '14:00', end: '18:00' }
      },
      goods: {
        type: 'pallet',
        weight: Math.floor(Math.random() * 15000) + 1000,
        volume: Math.floor(Math.random() * 50) + 5,
        pallets: Math.floor(Math.random() * 30) + 1,
        dangerous: Math.random() > 0.9,
        temperature: Math.random() > 0.8 ? 'refrigerated' : 'ambient'
      },
      estimatedPrice: Math.floor(Math.random() * 1500) + 500,
      currency: 'EUR',
      priceNegotiable: true,
      visibility: 'public',
      targetRadius: 50,
      publishedAt: session.broadcast?.sentAt || session.createdAt,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      viewCount: Math.floor(Math.random() * 100),
      responseCount: session.broadcast?.stats?.responded || 0,
      status: 'active'
    }));

    // Filtres
    if (pickupCity) {
      offers = offers.filter(o =>
        o.pickup.city.toLowerCase().includes((pickupCity as string).toLowerCase())
      );
    }
    if (deliveryCity) {
      offers = offers.filter(o =>
        o.delivery.city.toLowerCase().includes((deliveryCity as string).toLowerCase())
      );
    }
    if (maxPrice) {
      offers = offers.filter(o => o.estimatedPrice <= Number(maxPrice));
    }
    if (minWeight) {
      offers = offers.filter(o => o.goods.weight >= Number(minWeight));
    }
    if (maxWeight) {
      offers = offers.filter(o => o.goods.weight <= Number(maxWeight));
    }

    // Pagination
    const total = offers.length;
    offers = offers.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      offers,
      total,
      limit: Number(limit),
      offset: Number(offset),
      filters: {
        pickupCity,
        deliveryCity,
        maxPrice,
        minWeight,
        maxWeight
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id - Détails d'une offre
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await AffretSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    // Incrémenter le compteur de vues (simulé)
    const offer = {
      id: session._id,
      sessionId: session._id,
      orderId: session.orderId,
      pickup: {
        city: 'Lyon',
        postalCode: '69000',
        country: 'FR',
        address: '123 Zone Industrielle',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        window: { start: '08:00', end: '12:00' },
        contact: {
          name: 'Jean Martin',
          phone: '+33 6 12 34 56 78'
        },
        instructions: 'Quai A - Sonnez à l\'arrivée'
      },
      delivery: {
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        address: '456 Rue Commerce',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        window: { start: '14:00', end: '18:00' },
        contact: {
          name: 'Marie Dupont',
          phone: '+33 6 98 76 54 32'
        },
        instructions: 'Livraison par l\'arrière du bâtiment'
      },
      goods: {
        type: 'pallet',
        description: 'Produits industriels',
        weight: 8500,
        volume: 24,
        pallets: 12,
        dimensions: { length: 120, width: 80, height: 150 },
        dangerous: false,
        temperature: 'ambient',
        specialInstructions: 'Manipulation délicate'
      },
      estimatedPrice: 850,
      currency: 'EUR',
      priceNegotiable: true,
      requirements: {
        vehicleType: 'semi',
        hayon: true,
        certifications: ['ISO 9001']
      },
      visibility: 'public',
      targetRadius: 50,
      publishedAt: session.createdAt,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      viewCount: 47,
      responseCount: 5,
      status: 'active'
    };

    res.json(offer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:id/respond - Répondre à une offre (transporteur)
 */
router.post('/:id/respond', async (req: Request, res: Response) => {
  try {
    const {
      carrierId,
      carrierName,
      proposedPrice,
      pickupDate,
      deliveryDate,
      message,
      vehicle
    } = req.body;

    const session = await AffretSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    // La réponse sera traitée comme une proposition
    // Rediriger vers le système de propositions
    res.json({
      success: true,
      message: 'Proposition enregistrée',
      nextStep: 'Votre proposition sera analysée par le système IA',
      proposalEndpoint: `/api/v1/affretia/proposals`,
      sessionId: session._id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /nearby/:latitude/:longitude - Offres à proximité
 */
router.get('/nearby/:latitude/:longitude', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.params;
    const { radius = 50 } = req.query; // km

    // En production: géoquery MongoDB
    // Ici on simule

    const sessions = await AffretSession.find({
      status: 'awaiting_responses'
    }).limit(20);

    const nearbyOffers = sessions.map(session => ({
      id: session._id,
      distance: Math.floor(Math.random() * Number(radius)),
      pickup: {
        city: 'Ville proche',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      delivery: {
        city: 'Destination',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      estimatedPrice: Math.floor(Math.random() * 1500) + 500,
      goods: {
        type: 'pallet',
        weight: Math.floor(Math.random() * 15000) + 1000
      }
    }));

    // Trier par distance
    nearbyOffers.sort((a, b) => a.distance - b.distance);

    res.json({
      center: { latitude: Number(latitude), longitude: Number(longitude) },
      radius: Number(radius),
      offers: nearbyOffers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

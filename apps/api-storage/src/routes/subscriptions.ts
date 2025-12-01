/**
 * Routes: Logistician Subscriptions
 * Gestion des abonnements à la Bourse de Stockage
 */

import express, { Request, Response, NextFunction } from 'express';
import LogisticianSubscription from '../models/LogisticianSubscription';

const router = express.Router();

// Middleware d'authentification
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-logistician';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  next();
};

router.use(authMiddleware);

/**
 * GET /subscriptions/my
 * Mon abonnement actuel
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    let subscription = await LogisticianSubscription.findOne({ logisticianId });

    // Créer un abonnement guest par défaut si aucun
    if (!subscription) {
      subscription = new LogisticianSubscription({
        logisticianId,
        logisticianName: 'Logisticien',
        tier: 'guest',
        startDate: new Date(),
        status: 'active',
        primaryContact: {
          name: 'Contact',
          email: 'contact@example.com'
        }
      });
      await subscription.save();
    }

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /subscriptions/plans
 * Liste des plans disponibles
 */
router.get('/plans', async (_req: Request, res: Response) => {
  const plans = [
    {
      tier: 'guest',
      name: 'Invité',
      description: 'Accès gratuit avec limitations',
      pricing: {
        monthlyFee: 0,
        commissionRate: 5
      },
      limits: {
        maxSites: 1,
        maxActiveOffers: 5,
        maxMonthlyResponses: 10,
        apiAccess: false,
        prioritySupport: false,
        featuredListing: false,
        analyticsAccess: 'basic'
      },
      features: {
        realTimeNotifications: true,
        aiRecommendations: false,
        customBranding: false,
        dedicatedAccount: false,
        wmsIntegration: false,
        bulkOperations: false,
        exportReports: false
      },
      highlighted: false
    },
    {
      tier: 'subscriber',
      name: 'Abonné',
      description: 'Pour les logisticiens professionnels',
      pricing: {
        monthlyFee: 199,
        annualFee: 1990,
        commissionRate: 2
      },
      limits: {
        maxSites: 10,
        maxActiveOffers: 50,
        maxMonthlyResponses: 100,
        apiAccess: true,
        prioritySupport: false,
        featuredListing: true,
        analyticsAccess: 'advanced'
      },
      features: {
        realTimeNotifications: true,
        aiRecommendations: true,
        customBranding: false,
        dedicatedAccount: false,
        wmsIntegration: true,
        bulkOperations: true,
        exportReports: true
      },
      highlighted: true
    },
    {
      tier: 'premium',
      name: 'Premium',
      description: 'Solution complète sans limites',
      pricing: {
        monthlyFee: 499,
        annualFee: 4990,
        commissionRate: 0
      },
      limits: {
        maxSites: -1,
        maxActiveOffers: -1,
        maxMonthlyResponses: -1,
        apiAccess: true,
        prioritySupport: true,
        featuredListing: true,
        analyticsAccess: 'full'
      },
      features: {
        realTimeNotifications: true,
        aiRecommendations: true,
        customBranding: true,
        dedicatedAccount: true,
        wmsIntegration: true,
        bulkOperations: true,
        exportReports: true
      },
      highlighted: false
    }
  ];

  res.json({ success: true, data: plans });
});

/**
 * POST /subscriptions/register
 * S'inscrire comme logisticien (guest)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { logisticianName, primaryContact } = req.body;

    // Vérifier si déjà inscrit
    const existing = await LogisticianSubscription.findOne({ logisticianId });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Vous êtes déjà inscrit à la Bourse de Stockage'
      });
    }

    const subscription = new LogisticianSubscription({
      logisticianId,
      logisticianName,
      tier: 'guest',
      startDate: new Date(),
      status: 'active',
      primaryContact
    });

    await subscription.save();

    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /subscriptions/upgrade
 * Passer à un tier supérieur
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { tier, billingCycle, paymentMethod } = req.body;

    if (!['subscriber', 'premium'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Tier invalide'
      });
    }

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Abonnement non trouvé. Inscrivez-vous d\'abord.'
      });
    }

    // Enregistrer l'historique
    if (!subscription.tierHistory) subscription.tierHistory = [];
    subscription.tierHistory.push({
      fromTier: subscription.tier,
      toTier: tier,
      changedAt: new Date(),
      reason: 'Upgrade demandé par l\'utilisateur'
    });

    // Mettre à jour le tier
    subscription.tier = tier;
    subscription.pricing.billingCycle = billingCycle || 'monthly';

    if (paymentMethod) {
      subscription.payment = {
        method: paymentMethod.method,
        lastFourDigits: paymentMethod.lastFourDigits,
        expiryDate: paymentMethod.expiryDate,
        billingAddress: paymentMethod.billingAddress
      };
    }

    // Définir la date de fin (1 mois ou 1 an)
    const endDate = new Date();
    if (billingCycle === 'annually') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    subscription.endDate = endDate;

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: `Félicitations ! Vous êtes maintenant ${tier === 'subscriber' ? 'Abonné' : 'Premium'}.`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /subscriptions/downgrade
 * Rétrograder (à la fin de la période)
 */
router.post('/downgrade', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { targetTier, reason } = req.body;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    // La rétrogradation sera effective à la fin de la période
    if (!subscription.tierHistory) subscription.tierHistory = [];
    subscription.tierHistory.push({
      fromTier: subscription.tier,
      toTier: targetTier || 'guest',
      changedAt: subscription.endDate || new Date(),
      reason: reason || 'Downgrade demandé'
    });

    subscription.autoRenew = false;

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: `Votre abonnement sera rétrogradé à "${targetTier || 'guest'}" le ${subscription.endDate?.toLocaleDateString()}.`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /subscriptions/cancel
 * Annuler l'abonnement
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { reason } = req.body;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    subscription.status = 'cancelled';
    subscription.statusReason = reason;
    subscription.autoRenew = false;

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: 'Abonnement annulé. Vous conservez l\'accès jusqu\'à la fin de la période.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /subscriptions/usage
 * Usage actuel vs limites
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    const usage = {
      sites: {
        current: subscription.currentUsage.activeSites,
        limit: subscription.limits.maxSites,
        percentage: subscription.limits.maxSites === -1
          ? 0
          : Math.round((subscription.currentUsage.activeSites / subscription.limits.maxSites) * 100)
      },
      activeOffers: {
        current: subscription.currentUsage.activeOffers,
        limit: subscription.limits.maxActiveOffers,
        percentage: subscription.limits.maxActiveOffers === -1
          ? 0
          : Math.round((subscription.currentUsage.activeOffers / subscription.limits.maxActiveOffers) * 100)
      },
      monthlyResponses: {
        current: subscription.currentUsage.monthlyResponses,
        limit: subscription.limits.maxMonthlyResponses,
        percentage: subscription.limits.maxMonthlyResponses === -1
          ? 0
          : Math.round((subscription.currentUsage.monthlyResponses / subscription.limits.maxMonthlyResponses) * 100),
        resetsAt: getNextMonthReset(subscription.currentUsage.lastResetDate)
      }
    };

    res.json({ success: true, data: usage });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function getNextMonthReset(lastReset: Date): Date {
  const next = new Date(lastReset);
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * GET /subscriptions/billing-history
 * Historique de facturation
 */
router.get('/billing-history', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    res.json({
      success: true,
      data: subscription.billingHistory || [],
      nextBilling: subscription.endDate,
      currentPlan: {
        tier: subscription.tier,
        monthlyFee: subscription.pricing.monthlyFee,
        billingCycle: subscription.pricing.billingCycle
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /subscriptions/contact
 * Mettre à jour les informations de contact
 */
router.put('/contact', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { primaryContact, logisticianName } = req.body;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    if (primaryContact) subscription.primaryContact = primaryContact;
    if (logisticianName) subscription.logisticianName = logisticianName;

    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /subscriptions/payment
 * Mettre à jour le moyen de paiement
 */
router.put('/payment', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;
    const { payment } = req.body;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    subscription.payment = payment;
    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /subscriptions/metrics
 * Métriques de performance du logisticien
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    res.json({
      success: true,
      data: subscription.metrics || {
        totalContractsWon: 0,
        totalRevenue: 0,
        avgResponseTime: 0,
        successRate: 0,
        rating: 0,
        reviewCount: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /subscriptions/start-trial
 * Démarrer un essai gratuit (subscriber)
 */
router.post('/start-trial', async (req: Request, res: Response) => {
  try {
    const logisticianId = (req as any).orgId;

    const subscription = await LogisticianSubscription.findOne({ logisticianId });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Abonnement non trouvé' });
    }

    // Vérifier si déjà essayé
    if (subscription.trialEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà utilisé votre essai gratuit'
      });
    }

    // Activer l'essai de 14 jours
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    subscription.tier = 'subscriber';
    subscription.status = 'trial';
    subscription.trialEndDate = trialEnd;
    subscription.tierHistory = subscription.tierHistory || [];
    subscription.tierHistory.push({
      fromTier: 'guest',
      toTier: 'subscriber',
      changedAt: new Date(),
      reason: 'Essai gratuit 14 jours'
    });

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: `Essai gratuit activé jusqu'au ${trialEnd.toLocaleDateString()}`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// === Routes Admin ===

/**
 * GET /subscriptions/admin/all
 * Liste tous les abonnements (admin)
 */
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    // TODO: Vérifier droits admin
    const { tier, status, page = '1', limit = '50' } = req.query;

    const query: any = {};
    if (tier) query.tier = tier;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      LogisticianSubscription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LogisticianSubscription.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /subscriptions/admin/stats
 * Statistiques globales (admin)
 */
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await LogisticianSubscription.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$pricing.monthlyFee', 0] }
          }
        }
      }
    ]);

    const statusStats = await LogisticianSubscription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        byTier: stats,
        byStatus: statusStats,
        estimatedMRR: stats.reduce((sum, s) => sum + (s.totalRevenue || 0), 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

/**
 * Routes: Storage Contracts
 * Gestion des contrats de stockage
 */

import express, { Request, Response, NextFunction } from 'express';
import StorageContract from '../models/StorageContract';
import StorageOffer from '../models/StorageOffer';
import StorageNeed from '../models/StorageNeed';

const router = express.Router();

// Middleware d'authentification
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const orgId = req.headers['x-org-id'] as string || 'demo-org';
  const userType = req.headers['x-user-type'] as string || 'industrial';
  (req as any).userId = userId;
  (req as any).orgId = orgId;
  (req as any).userType = userType;
  next();
};

router.use(authMiddleware);

/**
 * GET /contracts
 * Liste des contrats
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userType = (req as any).userType;
    const { status, page = '1', limit = '20' } = req.query;

    // Filtrer selon le type d'utilisateur
    const query: any = userType === 'logistician'
      ? { logisticianId: orgId }
      : { clientOrgId: orgId };

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [contracts, total] = await Promise.all([
      StorageContract.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageContract.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contracts,
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
 * GET /contracts/active
 * Contrats actifs
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userType = (req as any).userType;

    const query: any = {
      status: 'active',
      ...(userType === 'logistician' ? { logisticianId: orgId } : { clientOrgId: orgId })
    };

    const contracts = await StorageContract.find(query)
      .sort({ startDate: 1 });

    res.json({ success: true, data: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /contracts/:id
 * Détail d'un contrat
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;

    const contract = await StorageContract.findOne({
      _id: req.params.id,
      $or: [{ clientOrgId: orgId }, { logisticianId: orgId }]
    });

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/from-offer
 * Créer un contrat à partir d'une offre acceptée
 */
router.post('/from-offer', async (req: Request, res: Response) => {
  try {
    const { offerId, terms, paymentTerms } = req.body;

    // Récupérer l'offre
    const offer = await StorageOffer.findById(offerId);
    if (!offer || offer.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Offre non trouvée ou non acceptée'
      });
    }

    // Récupérer le besoin
    const need = await StorageNeed.findById(offer.needId);
    if (!need) {
      return res.status(400).json({ success: false, error: 'Besoin non trouvé' });
    }

    // Créer le contrat
    const contractData = {
      needId: need._id.toString(),
      needReference: need.reference,
      offerId: offer._id.toString(),

      clientOrgId: need.ownerOrgId,
      clientName: need.ownerOrgName || 'Client',
      clientContact: {
        name: need.contactName,
        email: need.contactEmail,
        phone: need.contactPhone
      },

      logisticianId: offer.logisticianId,
      logisticianName: offer.logisticianName,
      logisticianContact: {},

      siteId: offer.siteId,
      siteName: offer.siteName,
      siteAddress: '',

      storageType: need.storageType,
      capacity: offer.proposedCapacity,

      startDate: offer.proposedStartDate,
      endDate: offer.proposedEndDate,
      duration: need.duration,
      renewable: true,

      pricing: {
        pricePerUnit: offer.pricing.pricePerUnit,
        unit: offer.pricing.unit,
        currency: offer.pricing.currency,
        setupFees: offer.pricing.setupFees,
        handlingFees: offer.pricing.handlingFees,
        minimumBilling: offer.pricing.minimumBilling
      },

      services: offer.includedServices.map(s => ({ name: s, included: true })),

      terms: {
        paymentTerms: paymentTerms || terms?.paymentTerms || '30 jours',
        cancellationPolicy: terms?.cancellationPolicy || '30 jours de préavis',
        insuranceRequired: true,
        ...terms
      },

      status: 'draft',
      statusHistory: [{
        status: 'draft',
        changedAt: new Date(),
        changedBy: (req as any).userId,
        reason: 'Création depuis offre acceptée'
      }]
    };

    const contract = new StorageContract(contractData);
    await contract.save();

    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts
 * Créer un contrat manuellement
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const contractData = {
      ...req.body,
      status: 'draft',
      statusHistory: [{
        status: 'draft',
        changedAt: new Date(),
        changedBy: (req as any).userId
      }]
    };

    const contract = new StorageContract(contractData);
    await contract.save();

    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /contracts/:id
 * Modifier un contrat (brouillon)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Seul un brouillon peut être modifié'
      });
    }

    Object.assign(contract, req.body);
    await contract.save();

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/send-for-signature
 * Envoyer le contrat pour signature
 */
router.post('/:id/send-for-signature', async (req: Request, res: Response) => {
  try {
    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Ce contrat ne peut pas être envoyé pour signature'
      });
    }

    contract.status = 'pending_signature';
    contract.statusHistory.push({
      status: 'pending_signature',
      changedAt: new Date(),
      changedBy: (req as any).userId,
      reason: 'Envoyé pour signature'
    });

    await contract.save();

    // TODO: Envoyer notifications par email

    res.json({ success: true, data: contract, message: 'Contrat envoyé pour signature' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/sign
 * Signer le contrat
 */
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;
    const userType = (req as any).userType;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (contract.status !== 'pending_signature') {
      return res.status(400).json({
        success: false,
        error: 'Ce contrat ne peut pas être signé'
      });
    }

    // Vérifier que l'utilisateur est partie au contrat
    const isClient = contract.clientOrgId === orgId;
    const isLogistician = contract.logisticianId === orgId;

    if (!isClient && !isLogistician) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const party = isClient ? 'client' : 'logistician';

    // Vérifier si déjà signé par cette partie
    const alreadySigned = contract.signatures.some(s => s.party === party);
    if (alreadySigned) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà signé ce contrat'
      });
    }

    // Ajouter la signature
    contract.signatures.push({
      party,
      signedBy: userId,
      signedAt: new Date(),
      ipAddress: req.ip,
      method: 'electronic'
    });

    // Si les deux parties ont signé, activer le contrat
    const clientSigned = contract.signatures.some(s => s.party === 'client');
    const logisticianSigned = contract.signatures.some(s => s.party === 'logistician');

    if (clientSigned && logisticianSigned) {
      contract.status = 'active';
      contract.statusHistory.push({
        status: 'active',
        changedAt: new Date(),
        changedBy: userId,
        reason: 'Toutes les signatures collectées'
      });

      // Initialiser le billing
      contract.billing = {
        billingCycle: 'monthly',
        nextBillingDate: new Date(contract.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalBilled: 0,
        totalPaid: 0,
        invoices: []
      };
    }

    await contract.save();

    res.json({
      success: true,
      data: contract,
      message: contract.status === 'active'
        ? 'Contrat signé et activé'
        : 'Signature enregistrée, en attente de l\'autre partie'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/suspend
 * Suspendre un contrat
 */
router.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Seul un contrat actif peut être suspendu'
      });
    }

    contract.status = 'suspended';
    contract.statusHistory.push({
      status: 'suspended',
      changedAt: new Date(),
      changedBy: (req as any).userId,
      reason
    });

    await contract.save();

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/terminate
 * Résilier un contrat
 */
router.post('/:id/terminate', async (req: Request, res: Response) => {
  try {
    const { reason, effectiveDate } = req.body;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    contract.status = 'terminated';
    contract.endDate = effectiveDate ? new Date(effectiveDate) : new Date();
    contract.statusHistory.push({
      status: 'terminated',
      changedAt: new Date(),
      changedBy: (req as any).userId,
      reason
    });

    await contract.save();

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/amendment
 * Créer un avenant
 */
router.post('/:id/amendment', async (req: Request, res: Response) => {
  try {
    const { description, changes, effectiveDate } = req.body;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (!['active', 'suspended'].includes(contract.status)) {
      return res.status(400).json({
        success: false,
        error: 'Ce contrat ne peut pas être amendé'
      });
    }

    const amendmentRef = `${contract.reference}-AV${(contract.amendments?.length || 0) + 1}`;

    if (!contract.amendments) contract.amendments = [];

    contract.amendments.push({
      reference: amendmentRef,
      description,
      changes,
      effectiveDate: new Date(effectiveDate),
      status: 'draft'
    });

    await contract.save();

    res.json({
      success: true,
      data: contract,
      message: `Avenant ${amendmentRef} créé`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /contracts/:id/execution
 * Mettre à jour les données d'exécution (WMS sync)
 */
router.patch('/:id/execution', async (req: Request, res: Response) => {
  try {
    const { currentOccupancy, movement } = req.body;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (!contract.execution) {
      contract.execution = {
        currentOccupancy: { unit: 'pallets', quantity: 0, lastUpdate: new Date() },
        totalMovements: 0,
        incidents: []
      };
    }

    if (currentOccupancy) {
      contract.execution.currentOccupancy = {
        ...currentOccupancy,
        lastUpdate: new Date()
      };
    }

    if (movement) {
      contract.execution.totalMovements++;
      contract.execution.lastMovementDate = new Date();
    }

    // Mettre à jour WMS sync
    if (contract.wmsIntegration?.enabled) {
      contract.wmsIntegration.lastSync = new Date();
      contract.wmsIntegration.syncStatus = 'active';
    }

    await contract.save();

    res.json({ success: true, data: contract.execution });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /contracts/:id/incident
 * Signaler un incident
 */
router.post('/:id/incident', async (req: Request, res: Response) => {
  try {
    const { type, description } = req.body;

    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    if (!contract.execution) {
      contract.execution = {
        currentOccupancy: { unit: 'pallets', quantity: 0, lastUpdate: new Date() },
        totalMovements: 0,
        incidents: []
      };
    }

    contract.execution.incidents.push({
      date: new Date(),
      type,
      description,
      resolved: false
    });

    await contract.save();

    res.json({ success: true, message: 'Incident signalé' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /contracts/:id/invoices
 * Factures d'un contrat
 */
router.get('/:id/invoices', async (req: Request, res: Response) => {
  try {
    const contract = await StorageContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrat non trouvé' });
    }

    res.json({
      success: true,
      data: contract.billing?.invoices || [],
      summary: {
        totalBilled: contract.billing?.totalBilled || 0,
        totalPaid: contract.billing?.totalPaid || 0,
        nextBillingDate: contract.billing?.nextBillingDate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /contracts/stats
 * Statistiques des contrats
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userType = (req as any).userType;

    const matchQuery = userType === 'logistician'
      ? { logisticianId: orgId }
      : { clientOrgId: orgId };

    const stats = await StorageContract.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.totalEstimated' }
        }
      }
    ]);

    const activeContracts = await StorageContract.find({
      ...matchQuery,
      status: 'active'
    });

    const totalOccupancy = activeContracts.reduce((sum, c) => {
      return sum + (c.execution?.currentOccupancy?.quantity || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        activeCount: activeContracts.length,
        totalOccupancy,
        totalMonthlyRevenue: activeContracts.reduce((sum, c) => {
          return sum + (c.pricing.pricePerUnit * c.capacity.quantity);
        }, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

import { Router, Response } from 'express';
import Supplier from '../models/Supplier';
import { authenticateSupplier, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /suppliers/me
 * Récupérer le profil du fournisseur connecté
 */
router.get('/me', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
      siret: supplier.siret,
      address: supplier.address,
      contacts: supplier.contacts,
      status: supplier.status,
      settings: supplier.settings,
      subscription: supplier.subscription,
      activatedAt: supplier.activatedAt,
      createdAt: supplier.createdAt
    });
  } catch (error: any) {
    console.error('Error fetching supplier profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /suppliers/me
 * Mettre à jour le profil du fournisseur
 */
router.put('/me', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { companyName, address, contacts } = req.body;

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Mettre à jour les champs autorisés
    if (companyName) supplier.companyName = companyName;
    if (address) supplier.address = address;
    if (contacts) {
      // Vérifier qu'il y a au moins un contact primaire
      const hasPrimary = contacts.some((c: any) => c.isPrimary);
      if (!hasPrimary) {
        return res.status(400).json({
          error: 'At least one contact must be marked as primary'
        });
      }
      supplier.contacts = contacts;
    }

    await supplier.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      supplier: {
        supplierId: supplier.supplierId,
        companyName: supplier.companyName,
        address: supplier.address,
        contacts: supplier.contacts
      }
    });
  } catch (error: any) {
    console.error('Error updating supplier profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /suppliers/me/industrials
 * Liste des industriels liés au fournisseur
 */
router.get('/me/industrials', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Dans un cas réel, on ferait une requête vers l'API Auth ou une collection séparée
    // Pour cet exemple, on retourne l'industriel qui a invité le fournisseur
    res.json({
      industrials: [
        {
          industrialId: supplier.industrialId,
          // Ces données seraient récupérées depuis l'API Auth
          companyName: 'Industrial Company',
          status: 'active'
        }
      ]
    });
  } catch (error: any) {
    console.error('Error fetching industrials:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /suppliers/me/settings
 * Mettre à jour les paramètres du fournisseur
 */
router.put('/me/settings', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { notifications, language } = req.body;

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Mettre à jour les paramètres
    if (typeof notifications === 'boolean') {
      supplier.settings.notifications = notifications;
    }
    if (language) {
      supplier.settings.language = language;
    }

    await supplier.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: supplier.settings
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /suppliers/:supplierId
 * Récupérer un fournisseur par son ID (pour les industriels)
 */
router.get('/:supplierId', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findOne({ supplierId });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Retourner uniquement les informations publiques
    res.json({
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
      siret: supplier.siret,
      address: supplier.address,
      status: supplier.status,
      activatedAt: supplier.activatedAt
    });
  } catch (error: any) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /suppliers
 * Liste des fournisseurs (pour les industriels)
 */
router.get('/', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const industrialId = req.query.industrialId as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const query: any = {};

    if (industrialId) {
      query.industrialId = industrialId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers: suppliers.map((s) => ({
        supplierId: s.supplierId,
        companyName: s.companyName,
        siret: s.siret,
        status: s.status,
        invitedAt: s.invitedAt,
        activatedAt: s.activatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

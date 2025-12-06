/**
 * Routes pour la gestion des docks (quais)
 */
import { Router, Request, Response } from 'express';
import Dock from '../models/Dock';
import Slot from '../models/Slot';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /docks - Liste des docks avec filtres
router.get('/', async (req: Request, res: Response) => {
  try {
    const { siteId, status, isActive } = req.query;
    
    const filter: any = {};
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const docks = await Dock.find(filter).sort({ name: 1 });
    res.json(docks);
  } catch (error) {
    console.error('Error fetching docks:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des quais' });
  }
});

// GET /docks/:dockId - Détail d'un dock
router.get('/:dockId', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOne({ dockId: req.params.dockId });
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    res.json(dock);
  } catch (error) {
    console.error('Error fetching dock:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du quai' });
  }
});

// POST /docks - Créer un nouveau dock
router.post('/', async (req: Request, res: Response) => {
  try {
    const dockData = {
      dockId: `dock_${uuidv4()}`,
      ...req.body
    };
    const dock = new Dock(dockData);
    await dock.save();
    res.status(201).json(dock);
  } catch (error) {
    console.error('Error creating dock:', error);
    res.status(500).json({ error: 'Erreur lors de la création du quai' });
  }
});

// PUT /docks/:dockId - Mettre à jour un dock
router.put('/:dockId', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOneAndUpdate(
      { dockId: req.params.dockId },
      { $set: req.body },
      { new: true }
    );
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    res.json(dock);
  } catch (error) {
    console.error('Error updating dock:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du quai' });
  }
});

// POST /docks/:dockId/open - Ouvrir un dock
router.post('/:dockId/open', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOneAndUpdate(
      { dockId: req.params.dockId },
      { $set: { status: 'available', isActive: true } },
      { new: true }
    );
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    res.json(dock);
  } catch (error) {
    console.error('Error opening dock:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ouverture du quai' });
  }
});

// POST /docks/:dockId/close - Fermer un dock
router.post('/:dockId/close', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOneAndUpdate(
      { dockId: req.params.dockId },
      { $set: { status: 'closed', isActive: false } },
      { new: true }
    );
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    
    // Bloquer tous les créneaux futurs de ce dock
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Slot.updateMany(
      { 
        dockId: req.params.dockId, 
        date: { $gte: today },
        status: 'available'
      },
      { 
        $set: { 
          status: 'blocked',
          isBlocked: true,
          blockReason: 'Quai fermé'
        } 
      }
    );
    
    res.json(dock);
  } catch (error) {
    console.error('Error closing dock:', error);
    res.status(500).json({ error: 'Erreur lors de la fermeture du quai' });
  }
});

// POST /docks/:dockId/maintenance - Mettre un dock en maintenance
router.post('/:dockId/maintenance', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const dock = await Dock.findOneAndUpdate(
      { dockId: req.params.dockId },
      { $set: { status: 'maintenance', notes: reason || 'En maintenance' } },
      { new: true }
    );
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    res.json(dock);
  } catch (error) {
    console.error('Error setting dock maintenance:', error);
    res.status(500).json({ error: 'Erreur lors de la mise en maintenance du quai' });
  }
});

// DELETE /docks/:dockId - Supprimer un dock
router.delete('/:dockId', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOneAndDelete({ dockId: req.params.dockId });
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    
    // Supprimer tous les créneaux associés
    await Slot.deleteMany({ dockId: req.params.dockId });
    
    res.json({ success: true, message: 'Quai et créneaux associés supprimés' });
  } catch (error) {
    console.error('Error deleting dock:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du quai' });
  }
});

export default router;

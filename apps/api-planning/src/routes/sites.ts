/**
 * Routes pour la gestion des sites
 */
import { Router, Request, Response } from 'express';
import Site from '../models/Site';
import Dock from '../models/Dock';
import Slot from '../models/Slot';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /sites - Liste des sites
router.get('/', async (req: Request, res: Response) => {
  try {
    const { industrialId, isActive } = req.query;
    
    const filter: any = {};
    if (industrialId) filter.industrialId = industrialId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sites = await Site.find(filter).sort({ name: 1 });
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sites' });
  }
});

// GET /sites/:siteId - Détail d'un site avec ses docks
router.get('/:siteId', async (req: Request, res: Response) => {
  try {
    const site = await Site.findOne({ siteId: req.params.siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    const docks = await Dock.find({ siteId: req.params.siteId });
    
    res.json({ ...site.toObject(), docks });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du site' });
  }
});

// POST /sites - Créer un nouveau site
router.post('/', async (req: Request, res: Response) => {
  try {
    const siteData = {
      siteId: `site_${uuidv4()}`,
      ...req.body
    };
    const site = new Site(siteData);
    await site.save();
    res.status(201).json(site);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Erreur lors de la création du site' });
  }
});

// PUT /sites/:siteId - Mettre à jour un site
router.put('/:siteId', async (req: Request, res: Response) => {
  try {
    const site = await Site.findOneAndUpdate(
      { siteId: req.params.siteId },
      { $set: req.body },
      { new: true }
    );
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    res.json(site);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du site' });
  }
});

// DELETE /sites/:siteId - Supprimer un site
router.delete('/:siteId', async (req: Request, res: Response) => {
  try {
    const site = await Site.findOneAndDelete({ siteId: req.params.siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    // Supprimer tous les docks et créneaux associés
    await Dock.deleteMany({ siteId: req.params.siteId });
    await Slot.deleteMany({ siteId: req.params.siteId });
    
    res.json({ success: true, message: 'Site et toutes les données associées supprimés' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du site' });
  }
});

// GET /sites/:siteId/docks - Liste des docks d'un site
router.get('/:siteId/docks', async (req: Request, res: Response) => {
  try {
    const docks = await Dock.find({ siteId: req.params.siteId }).sort({ name: 1 });
    res.json(docks);
  } catch (error) {
    console.error('Error fetching docks:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des quais' });
  }
});

// GET /sites/:siteId/docks/:dockId - Détail d'un dock
router.get('/:siteId/docks/:dockId', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findOne({
      siteId: req.params.siteId,
      dockId: req.params.dockId
    });
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }
    res.json(dock);
  } catch (error) {
    console.error('Error fetching dock:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du quai' });
  }
});

// POST /sites/:siteId/docks - Créer un dock
router.post('/:siteId/docks', async (req: Request, res: Response) => {
  try {
    const dockData = {
      dockId: `dock_${uuidv4()}`,
      siteId: req.params.siteId,
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

// PUT /sites/:siteId/docks/:dockId/status - Mettre à jour le statut d'un dock
router.put('/:siteId/docks/:dockId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const isActive = status === 'available' || status === 'occupied';

    const dock = await Dock.findOneAndUpdate(
      { siteId: req.params.siteId, dockId: req.params.dockId },
      { $set: { status, isActive } },
      { new: true }
    );
    if (!dock) {
      return res.status(404).json({ error: 'Quai non trouvé' });
    }

    // Si le dock est fermé, bloquer tous les créneaux futurs
    if (status === 'closed' || status === 'maintenance') {
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
            blockReason: status === 'closed' ? 'Quai fermé' : 'Quai en maintenance'
          }
        }
      );
    }

    res.json(dock);
  } catch (error) {
    console.error('Error updating dock status:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut du quai' });
  }
});

// GET /sites/:siteId/slots - Créneaux d'un site
router.get('/:siteId/slots', async (req: Request, res: Response) => {
  try {
    const { date, dockId } = req.query;
    const filter: any = { siteId: req.params.siteId };

    if (dockId) filter.dockId = dockId;
    if (date) {
      const d = new Date(date as string);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date as string).setHours(23, 59, 59, 999))
      };
    }

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });
    res.json({ data: slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des créneaux' });
  }
});

// POST /sites/:siteId/slots - Créer un créneau
router.post('/:siteId/slots', async (req: Request, res: Response) => {
  try {
    const slotData = {
      slotId: `slot_${uuidv4()}`,
      siteId: req.params.siteId,
      ...req.body
    };
    const slot = new Slot(slotData);
    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating slot:', error);
    res.status(500).json({ error: 'Erreur lors de la création du créneau' });
  }
});

// GET /sites/:siteId/planning - Planning complet d'un site pour une date
router.get('/:siteId/planning', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const siteId = req.params.siteId;
    
    const site = await Site.findOne({ siteId });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    const docks = await Dock.find({ siteId });
    
    let dateFilter = {};
    if (date) {
      const d = new Date(date as string);
      dateFilter = {
        date: {
          $gte: new Date(d.setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(d).setHours(23, 59, 59, 999))
        }
      };
    }
    
    const slots = await Slot.find({ siteId, ...dateFilter }).sort({ startTime: 1 });
    
    // Organiser les créneaux par dock
    const planning = docks.map(dock => ({
      dock: dock.toObject(),
      slots: slots.filter(slot => slot.dockId === dock.dockId)
    }));
    
    res.json({
      site: site.toObject(),
      planning,
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching site planning:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du planning' });
  }
});

export default router;

/**
 * Routes pour la gestion des créneaux (Slots)
 */
import { Router, Request, Response } from 'express';
import Slot from '../models/Slot';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /slots - Liste des créneaux avec filtres
router.get('/', async (req: Request, res: Response) => {
  try {
    const { siteId, dockId, date, startDate, endDate, status } = req.query;
    
    const filter: any = {};
    if (siteId) filter.siteId = siteId;
    if (dockId) filter.dockId = dockId;
    if (date) {
      const d = new Date(date as string);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999))
      };
    }
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    if (status) filter.status = status;

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });
    // Format attendu par le frontend: { data: [...] }
    res.json({ data: slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des créneaux' });
  }
});

// GET /slots/:slotId - Détail d'un créneau
router.get('/:slotId', async (req: Request, res: Response) => {
  try {
    const slot = await Slot.findOne({ slotId: req.params.slotId });
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    res.json(slot);
  } catch (error) {
    console.error('Error fetching slot:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du créneau' });
  }
});

// POST /slots - Créer un nouveau créneau
router.post('/', async (req: Request, res: Response) => {
  try {
    const slotData = {
      slotId: `slot_${uuidv4()}`,
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

// POST /slots/generate - Générer des créneaux pour une période
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { siteId, dockId, startDate, endDate, slotDuration = 60, startTime = '08:00', endTime = '18:00' } = req.body;
    
    const slots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStartH = Math.floor(currentMinutes / 60);
        const slotStartM = currentMinutes % 60;
        const slotEndH = Math.floor((currentMinutes + slotDuration) / 60);
        const slotEndM = (currentMinutes + slotDuration) % 60;
        
        const slotStart = `${slotStartH.toString().padStart(2, '0')}:${slotStartM.toString().padStart(2, '0')}`;
        const slotEnd = `${slotEndH.toString().padStart(2, '0')}:${slotEndM.toString().padStart(2, '0')}`;
        
        slots.push({
          slotId: `slot_${uuidv4()}`,
          siteId,
          dockId,
          date: new Date(d),
          startTime: slotStart,
          endTime: slotEnd,
          duration: slotDuration,
          status: 'available',
          isBlocked: false
        });
        
        currentMinutes += slotDuration;
      }
    }
    
    if (slots.length > 0) {
      await Slot.insertMany(slots);
    }
    
    res.status(201).json({ 
      message: `${slots.length} créneaux générés avec succès`,
      count: slots.length 
    });
  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des créneaux' });
  }
});

// PUT /slots/:slotId - Mettre à jour un créneau
router.put('/:slotId', async (req: Request, res: Response) => {
  try {
    const slot = await Slot.findOneAndUpdate(
      { slotId: req.params.slotId },
      { $set: req.body },
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    res.json(slot);
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du créneau' });
  }
});

// POST /slots/:slotId/block - Bloquer un créneau
router.post('/:slotId/block', async (req: Request, res: Response) => {
  try {
    const { reason, blockedBy } = req.body;
    const slot = await Slot.findOneAndUpdate(
      { slotId: req.params.slotId },
      { 
        $set: { 
          status: 'blocked',
          isBlocked: true,
          blockReason: reason,
          blockedBy,
          blockedAt: new Date()
        } 
      },
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    res.json(slot);
  } catch (error) {
    console.error('Error blocking slot:', error);
    res.status(500).json({ error: 'Erreur lors du blocage du créneau' });
  }
});

// POST /slots/:slotId/unblock - Débloquer un créneau
router.post('/:slotId/unblock', async (req: Request, res: Response) => {
  try {
    const slot = await Slot.findOneAndUpdate(
      { slotId: req.params.slotId },
      { 
        $set: { 
          status: 'available',
          isBlocked: false,
          blockReason: null,
          blockedBy: null,
          blockedAt: null
        } 
      },
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    res.json(slot);
  } catch (error) {
    console.error('Error unblocking slot:', error);
    res.status(500).json({ error: 'Erreur lors du déblocage du créneau' });
  }
});

// DELETE /slots/:slotId - Supprimer un créneau
router.delete('/:slotId', async (req: Request, res: Response) => {
  try {
    const slot = await Slot.findOneAndDelete({ slotId: req.params.slotId });
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    res.json({ success: true, message: 'Créneau supprimé' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du créneau' });
  }
});

export default router;

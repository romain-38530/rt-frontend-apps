/**
 * Routes: Planning Management
 * Gestion des sites, quais et créneaux
 */

import { Router, Request, Response } from 'express';
import { Site, Dock, TimeSlot } from '../models';

const router = Router();

// ============================================
// SITES
// ============================================

// GET /planning/sites - Liste des sites
router.get('/sites', async (req: Request, res: Response) => {
  try {
    const { ownerOrgId, type, city, region, active, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (ownerOrgId) query.ownerOrgId = ownerOrgId;
    if (type) query.type = type;
    if (city) query.city = new RegExp(city as string, 'i');
    if (region) query.region = new RegExp(region as string, 'i');
    if (active !== undefined) query.active = active === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [sites, total] = await Promise.all([
      Site.find(query).skip(skip).limit(Number(limit)).sort({ name: 1 }),
      Site.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: sites,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /planning/sites - Créer un site
router.post('/sites', async (req: Request, res: Response) => {
  try {
    const site = new Site(req.body);
    await site.save();

    res.status(201).json({
      success: true,
      data: site
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /planning/sites/:id - Détails d'un site
router.get('/sites/:id', async (req: Request, res: Response) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    // Récupérer les quais du site
    const docks = await Dock.find({ siteId: site._id, active: true }).sort({ number: 1 });

    res.json({
      success: true,
      data: {
        ...site.toObject(),
        docks
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /planning/sites/:id - Modifier un site
router.put('/sites/:id', async (req: Request, res: Response) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    res.json({
      success: true,
      data: site
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /planning/sites/:id - Supprimer un site
router.delete('/sites/:id', async (req: Request, res: Response) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false } },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    res.json({
      success: true,
      message: 'Site désactivé'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DOCKS (QUAIS)
// ============================================

// GET /planning/sites/:siteId/docks - Liste des quais d'un site
router.get('/sites/:siteId/docks', async (req: Request, res: Response) => {
  try {
    const { active, type, status } = req.query;
    const query: any = { siteId: req.params.siteId };

    if (active !== undefined) query.active = active === 'true';
    if (type) query.type = type;
    if (status) query.status = status;

    const docks = await Dock.find(query).sort({ displayOrder: 1, number: 1 });

    res.json({
      success: true,
      data: docks
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /planning/sites/:siteId/docks - Créer un quai
router.post('/sites/:siteId/docks', async (req: Request, res: Response) => {
  try {
    const dock = new Dock({
      ...req.body,
      siteId: req.params.siteId
    });
    await dock.save();

    res.status(201).json({
      success: true,
      data: dock
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /planning/docks/:id - Modifier un quai
router.put('/docks/:id', async (req: Request, res: Response) => {
  try {
    const dock = await Dock.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!dock) {
      return res.status(404).json({ success: false, error: 'Quai non trouvé' });
    }

    res.json({
      success: true,
      data: dock
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /planning/docks/:id/status - Changer le statut d'un quai
router.put('/docks/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;

    const dock = await Dock.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          statusReason: reason
        }
      },
      { new: true }
    );

    if (!dock) {
      return res.status(404).json({ success: false, error: 'Quai non trouvé' });
    }

    res.json({
      success: true,
      data: dock
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// TIME SLOTS (CRÉNEAUX)
// ============================================

// GET /planning/slots - Liste des créneaux
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { siteId, dockId, date, dateFrom, dateTo, status, flowType } = req.query;

    const query: any = {};
    if (siteId) query.siteId = siteId;
    if (dockId) query.dockId = dockId;
    if (date) query.date = date;
    if (dateFrom && dateTo) {
      query.date = { $gte: dateFrom, $lte: dateTo };
    }
    if (status) query.status = status;
    if (flowType) query.flowType = flowType;

    const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: slots
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /planning/slots/generate - Générer les créneaux pour une période
router.post('/slots/generate', async (req: Request, res: Response) => {
  try {
    const { siteId, dockId, dateFrom, dateTo, slotDuration, startTime, endTime } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    const dock = await Dock.findById(dockId);
    if (!dock) {
      return res.status(404).json({ success: false, error: 'Quai non trouvé' });
    }

    const slots: any[] = [];
    const duration = slotDuration || site.defaultSlotDuration;
    const start = startTime || '08:00';
    const end = endTime || '18:00';

    // Générer les créneaux pour chaque jour
    let currentDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Vérifier si c'est un jour ouvré
      const operatingHour = site.operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
      const isHoliday = site.holidays.includes(dateStr);

      if (operatingHour && !isHoliday) {
        // Générer les créneaux pour cette journée
        let currentSlotStart = start;
        const dayEnd = operatingHour.close || end;

        while (currentSlotStart < dayEnd) {
          const [hours, minutes] = currentSlotStart.split(':').map(Number);
          const endMinutes = hours * 60 + minutes + duration;
          const slotEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

          if (slotEnd <= dayEnd) {
            // Vérifier si le créneau n'existe pas déjà
            const existing = await TimeSlot.findOne({
              siteId,
              dockId,
              date: dateStr,
              startTime: currentSlotStart
            });

            if (!existing) {
              const slot = new TimeSlot({
                siteId,
                dockId,
                date: dateStr,
                startTime: currentSlotStart,
                endTime: slotEnd,
                duration,
                flowType: 'FTL',
                totalCapacity: dock.capacity,
                bookedCapacity: 0,
                availableCapacity: dock.capacity,
                status: 'available',
                isPriority: false,
                isExpress: false,
                isAdr: dock.adrOnly
              });
              await slot.save();
              slots.push(slot);
            }
          }

          // Passer au créneau suivant
          currentSlotStart = slotEnd;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(201).json({
      success: true,
      data: slots,
      message: `${slots.length} créneaux générés`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /planning/slots/:id/block - Bloquer un créneau
router.put('/slots/:id/block', async (req: Request, res: Response) => {
  try {
    const { reason, blockedBy } = req.body;

    const slot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'blocked',
          blockedReason: reason,
          blockedBy
        }
      },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, error: 'Créneau non trouvé' });
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /planning/slots/:id/unblock - Débloquer un créneau
router.put('/slots/:id/unblock', async (req: Request, res: Response) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ success: false, error: 'Créneau non trouvé' });
    }

    // Recalculer le statut
    let newStatus = 'available';
    if (slot.bookedCapacity >= slot.totalCapacity) {
      newStatus = 'full';
    } else if (slot.bookedCapacity > 0) {
      newStatus = 'partial';
    }

    slot.status = newStatus as any;
    slot.blockedReason = undefined;
    slot.blockedBy = undefined;
    await slot.save();

    res.json({
      success: true,
      data: slot
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /planning/availability - Disponibilités pour un site
router.get('/availability', async (req: Request, res: Response) => {
  try {
    const { siteId, dateFrom, dateTo, flowType, dockId } = req.query;

    if (!siteId || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'siteId, dateFrom et dateTo sont requis'
      });
    }

    const query: any = {
      siteId,
      date: { $gte: dateFrom, $lte: dateTo },
      status: { $in: ['available', 'partial'] }
    };

    if (dockId) query.dockId = dockId;
    if (flowType) query.flowType = flowType;

    const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });

    // Grouper par date
    const availability: Record<string, any[]> = {};
    slots.forEach(slot => {
      if (!availability[slot.date]) {
        availability[slot.date] = [];
      }
      availability[slot.date].push({
        slotId: slot._id,
        dockId: slot.dockId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableCapacity: slot.availableCapacity,
        isPriority: slot.isPriority,
        isExpress: slot.isExpress
      });
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

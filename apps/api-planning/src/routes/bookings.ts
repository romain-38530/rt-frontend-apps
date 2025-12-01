/**
 * Routes: Bookings/RDV Management
 * Gestion des réservations et rendez-vous
 */

import { Router, Request, Response } from 'express';
import { Booking, TimeSlot, Site, Dock } from '../models';

const router = Router();

// ============================================
// BOOKINGS (RDV)
// ============================================

// GET /bookings - Liste des réservations
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      siteId, transporterOrgId, status, flowType,
      dateFrom, dateTo, page = 1, limit = 20
    } = req.query;

    const query: any = {};
    if (siteId) query.siteId = siteId;
    if (transporterOrgId) query['transporter.orgId'] = transporterOrgId;
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    if (flowType) query.flowType = flowType;
    if (dateFrom && dateTo) {
      query.requestedDate = { $gte: dateFrom, $lte: dateTo };
    } else if (dateFrom) {
      query.requestedDate = { $gte: dateFrom };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ requestedDate: -1, 'requestedTimeSlot.start': 1 }),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: bookings,
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

// POST /bookings - Créer une demande de RDV
router.post('/', async (req: Request, res: Response) => {
  try {
    const site = await Site.findById(req.body.siteId);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    const booking = new Booking({
      ...req.body,
      siteName: site.name,
      siteOwner: {
        orgId: site.ownerOrgId,
        orgName: site.ownerOrgName,
        contactName: site.contactName,
        contactEmail: site.contactEmail,
        contactPhone: site.contactPhone
      },
      status: 'requested',
      statusHistory: [{
        status: 'requested',
        changedAt: new Date(),
        changedBy: req.body.requester?.contactName || 'System'
      }],
      timestamps: {
        requestedAt: new Date()
      }
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /bookings/:id - Détails d'une réservation
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /bookings/:id/propose - Proposer une alternative
router.post('/:id/propose', async (req: Request, res: Response) => {
  try {
    const { date, timeSlot, message, proposedBy } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (!['requested', 'proposed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut plus recevoir de proposition'
      });
    }

    booking.proposedAlternatives.push({
      date,
      timeSlot,
      proposedBy,
      proposedAt: new Date(),
      message
    });

    booking.status = 'proposed';
    booking.statusHistory.push({
      status: 'proposed',
      changedAt: new Date(),
      changedBy: proposedBy,
      reason: message
    });

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /bookings/:id/confirm - Confirmer une réservation
router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { slotId, dockId, confirmedBy, notes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (!['requested', 'proposed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut pas être confirmée'
      });
    }

    // Si un créneau est spécifié, le réserver
    if (slotId) {
      const slot = await TimeSlot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ success: false, error: 'Créneau non trouvé' });
      }

      if (slot.availableCapacity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Ce créneau n\'est plus disponible'
        });
      }

      slot.bookedCapacity += 1;
      slot.bookingIds.push(booking._id.toString());
      await slot.save();

      booking.slotId = slotId;
      booking.confirmedDate = slot.date;
      booking.confirmedTimeSlot = {
        start: slot.startTime,
        end: slot.endTime
      };
    } else {
      // Utiliser la date/heure demandée
      booking.confirmedDate = booking.requestedDate;
      booking.confirmedTimeSlot = booking.requestedTimeSlot;
    }

    // Si un quai est spécifié
    if (dockId) {
      const dock = await Dock.findById(dockId);
      if (dock) {
        booking.dockId = dockId;
        booking.dockName = dock.name;
      }
    }

    booking.status = 'confirmed';
    booking.timestamps.confirmedAt = new Date();
    booking.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: confirmedBy || 'System'
    });

    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /bookings/:id/refuse - Refuser une réservation
router.post('/:id/refuse', async (req: Request, res: Response) => {
  try {
    const { reason, refusedBy } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (!['requested', 'proposed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut pas être refusée'
      });
    }

    booking.status = 'refused';
    booking.statusHistory.push({
      status: 'refused',
      changedAt: new Date(),
      changedBy: refusedBy || 'System',
      reason
    });

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /bookings/:id/cancel - Annuler une réservation
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, cancelledBy } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut pas être annulée'
      });
    }

    // Libérer le créneau si réservé
    if (booking.slotId) {
      const slot = await TimeSlot.findById(booking.slotId);
      if (slot) {
        slot.bookedCapacity = Math.max(0, slot.bookedCapacity - 1);
        slot.bookingIds = slot.bookingIds.filter(id => id !== booking._id.toString());
        await slot.save();
      }
    }

    booking.status = 'cancelled';
    booking.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: cancelledBy || 'System',
      reason
    });

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /bookings/:id/reschedule - Reprogrammer une réservation
router.put('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { newDate, newTimeSlot, newSlotId, reason, rescheduledBy } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (!['confirmed', 'requested', 'proposed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut pas être reprogrammée'
      });
    }

    // Libérer l'ancien créneau
    if (booking.slotId) {
      const oldSlot = await TimeSlot.findById(booking.slotId);
      if (oldSlot) {
        oldSlot.bookedCapacity = Math.max(0, oldSlot.bookedCapacity - 1);
        oldSlot.bookingIds = oldSlot.bookingIds.filter(id => id !== booking._id.toString());
        await oldSlot.save();
      }
    }

    // Réserver le nouveau créneau
    if (newSlotId) {
      const newSlot = await TimeSlot.findById(newSlotId);
      if (!newSlot) {
        return res.status(404).json({ success: false, error: 'Nouveau créneau non trouvé' });
      }

      if (newSlot.availableCapacity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Le nouveau créneau n\'est pas disponible'
        });
      }

      newSlot.bookedCapacity += 1;
      newSlot.bookingIds.push(booking._id.toString());
      await newSlot.save();

      booking.slotId = newSlotId;
      booking.confirmedDate = newSlot.date;
      booking.confirmedTimeSlot = {
        start: newSlot.startTime,
        end: newSlot.endTime
      };
    } else {
      booking.slotId = undefined;
      booking.confirmedDate = newDate;
      booking.confirmedTimeSlot = newTimeSlot;
    }

    booking.statusHistory.push({
      status: 'rescheduled',
      changedAt: new Date(),
      changedBy: rescheduledBy || 'System',
      reason
    });

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /bookings/today/:siteId - RDV du jour pour un site
router.get('/today/:siteId', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const bookings = await Booking.find({
      siteId: req.params.siteId,
      $or: [
        { requestedDate: today },
        { confirmedDate: today }
      ],
      status: { $nin: ['cancelled', 'refused'] }
    }).sort({ 'confirmedTimeSlot.start': 1, 'requestedTimeSlot.start': 1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /bookings/pending/:siteId - RDV en attente pour un site
router.get('/pending/:siteId', async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({
      siteId: req.params.siteId,
      status: { $in: ['requested', 'proposed'] }
    }).sort({ requestedDate: 1, 'requestedTimeSlot.start': 1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

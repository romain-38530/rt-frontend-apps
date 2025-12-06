/**
 * Routes pour la gestion des réservations (Bookings)
 */
import { Router, Request, Response } from 'express';
import Booking from '../models/Booking';
import Slot from '../models/Slot';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /bookings - Liste des réservations avec filtres
router.get('/', async (req: Request, res: Response) => {
  try {
    const { siteId, dockId, status, carrierId, date, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (siteId) filter.siteId = siteId;
    if (dockId) filter.dockId = dockId;
    if (status) filter.status = status;
    if (carrierId) filter.carrierId = carrierId;
    if (date) {
      const d = new Date(date as string);
      filter.scheduledDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999))
      };
    }
    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const bookings = await Booking.find(filter).sort({ scheduledDate: 1, scheduledStartTime: 1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// GET /bookings/:bookingId
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la réservation' });
  }
});

// POST /bookings
router.post('/', async (req: Request, res: Response) => {
  try {
    const { slotId, ...bookingData } = req.body;
    
    const slot = await Slot.findOne({ slotId });
    if (!slot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    if (slot.status !== 'available') {
      return res.status(400).json({ error: 'Ce créneau nest pas disponible' });
    }
    
    const bookingId = "booking_" + uuidv4();
    
    const booking = new Booking({
      bookingId,
      slotId,
      dockId: slot.dockId,
      siteId: slot.siteId,
      scheduledDate: slot.date,
      scheduledStartTime: slot.startTime,
      scheduledEndTime: slot.endTime,
      ...bookingData
    });
    
    await booking.save();
    
    await Slot.findOneAndUpdate(
      { slotId },
      { $set: { status: 'reserved', bookingId } }
    );
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
});

// PUT /bookings/:bookingId
router.put('/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { $set: req.body },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réservation' });
  }
});

// POST /bookings/:bookingId/confirm
router.post('/:bookingId/confirm', async (req: Request, res: Response) => {
  try {
    const { confirmedBy } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { 
        $set: { 
          status: 'confirmed',
          confirmedBy,
          confirmedAt: new Date()
        } 
      },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    await Slot.findOneAndUpdate(
      { slotId: booking.slotId },
      { $set: { status: 'confirmed' } }
    );
    
    res.json(booking);
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de la réservation' });
  }
});

// POST /bookings/:bookingId/cancel
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const { cancelledBy, reason } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { 
        $set: { 
          status: 'cancelled',
          cancelledBy,
          cancelledAt: new Date(),
          cancelReason: reason
        } 
      },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    await Slot.findOneAndUpdate(
      { slotId: booking.slotId },
      { $set: { status: 'available', bookingId: null } }
    );
    
    res.json(booking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Erreur lors de lannulation de la réservation' });
  }
});

// POST /bookings/:bookingId/checkin
router.post('/:bookingId/checkin', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { 
        $set: { 
          status: 'in_progress',
          actualArrivalTime: new Date()
        } 
      },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({ error: 'Erreur lors du check-in' });
  }
});

// POST /bookings/:bookingId/checkout
router.post('/:bookingId/checkout', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { 
        $set: { 
          status: 'completed',
          actualDepartureTime: new Date()
        } 
      },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    await Slot.findOneAndUpdate(
      { slotId: booking.slotId },
      { $set: { status: 'completed' } }
    );
    
    res.json(booking);
  } catch (error) {
    console.error('Error checking out booking:', error);
    res.status(500).json({ error: 'Erreur lors du check-out' });
  }
});

// DELETE /bookings/:bookingId
router.delete('/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOneAndDelete({ bookingId: req.params.bookingId });
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    await Slot.findOneAndUpdate(
      { slotId: booking.slotId },
      { $set: { status: 'available', bookingId: null } }
    );
    
    res.json({ success: true, message: 'Réservation supprimée' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la réservation' });
  }
});

export default router;

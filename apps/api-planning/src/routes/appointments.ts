/**
 * Routes pour les demandes de RDV transporteur <-> industriel
 */
import { Router, Request, Response } from 'express';
import AppointmentRequest from '../models/AppointmentRequest';
import Booking from '../models/Booking';
import Slot from '../models/Slot';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /appointments - Liste des demandes de RDV
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId, requesterId, orderId, status, type } = req.query;

    const filter: any = {};
    if (organizationId) filter.targetOrganizationId = organizationId;
    if (requesterId) filter.requesterId = requesterId;
    if (orderId) filter.orderId = orderId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const appointments = await AppointmentRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des demandes' });
  }
});

// GET /appointments/pending - Demandes en attente pour un site/organisation
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const { organizationId, siteId } = req.query;

    const filter: any = { status: { $in: ['pending', 'proposed'] } };
    if (organizationId) filter.targetOrganizationId = organizationId;
    if (siteId) filter.targetSiteId = siteId;

    const appointments = await AppointmentRequest.find(filter)
      .sort({ createdAt: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des demandes en attente' });
  }
});

// GET /appointments/:requestId
router.get('/:requestId', async (req: Request, res: Response) => {
  try {
    const appointment = await AppointmentRequest.findOne({ requestId: req.params.requestId });
    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation de la demande' });
  }
});

// GET /appointments/order/:orderId - Demandes pour une commande
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const appointments = await AppointmentRequest.find({ orderId: req.params.orderId })
      .sort({ type: 1, createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching order appointments:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des demandes' });
  }
});

// POST /appointments - Creer une demande de RDV (transporteur)
router.post('/', async (req: Request, res: Response) => {
  try {
    const requestId = "apt_" + uuidv4();

    const appointment = new AppointmentRequest({
      requestId,
      ...req.body,
      messages: [{
        id: uuidv4(),
        senderId: 'system',
        senderName: 'Systeme',
        senderType: 'system',
        content: 'Demande de rendez-vous creee',
        timestamp: new Date()
      }]
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment request:', error);
    res.status(500).json({ error: 'Erreur lors de la creation de la demande' });
  }
});

// POST /appointments/:requestId/propose - Proposer un creneau (industriel)
router.post('/:requestId/propose', async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime, dockId, dockName, proposedBy, message } = req.body;

    const messages: any[] = [];
    if (message) {
      messages.push({
        id: uuidv4(),
        senderId: proposedBy,
        senderName: req.body.proposerName || 'Industriel',
        senderType: 'industrial',
        content: message,
        timestamp: new Date()
      });
    }
    messages.push({
      id: uuidv4(),
      senderId: 'system',
      senderName: 'Systeme',
      senderType: 'system',
      content: `Creneau propose: ${new Date(date).toLocaleDateString('fr-FR')} de ${startTime} a ${endTime}`,
      timestamp: new Date()
    });

    const appointment = await AppointmentRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      {
        $set: {
          status: 'proposed',
          proposedSlot: {
            date: new Date(date),
            startTime,
            endTime,
            dockId,
            dockName,
            proposedBy,
            proposedAt: new Date()
          },
          respondedAt: new Date()
        },
        $push: { messages: { $each: messages } }
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error proposing slot:', error);
    res.status(500).json({ error: 'Erreur lors de la proposition du creneau' });
  }
});

// POST /appointments/:requestId/accept - Accepter proposition ou confirmer directement (transporteur ou industriel)
router.post('/:requestId/accept', async (req: Request, res: Response) => {
  try {
    const { confirmedBy, slotId } = req.body;

    const appointment = await AppointmentRequest.findOne({ requestId: req.params.requestId });
    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }

    // Si un slot est fourni, creer une reservation
    let bookingId;
    if (slotId) {
      const slot = await Slot.findOne({ slotId });
      if (slot && slot.status === 'available') {
        bookingId = "booking_" + uuidv4();
        const booking = new Booking({
          bookingId,
          slotId,
          dockId: slot.dockId,
          siteId: slot.siteId,
          carrierId: appointment.requesterId,
          carrierName: appointment.carrierName,
          driverName: appointment.driverName,
          driverPhone: appointment.driverPhone,
          vehiclePlate: appointment.vehiclePlate,
          orderId: appointment.orderId,
          orderReference: appointment.orderReference,
          type: appointment.type,
          status: 'confirmed',
          scheduledDate: slot.date,
          scheduledStartTime: slot.startTime,
          scheduledEndTime: slot.endTime,
          createdBy: confirmedBy,
          confirmedBy,
          confirmedAt: new Date()
        });
        await booking.save();
        await Slot.findOneAndUpdate({ slotId }, { $set: { status: 'confirmed', bookingId } });
      }
    }

    const confirmedSlot = appointment.proposedSlot || {
      date: new Date(),
      startTime: '08:00',
      endTime: '09:00'
    };

    const messages = [{
      id: uuidv4(),
      senderId: 'system',
      senderName: 'Systeme',
      senderType: 'system' as const,
      content: 'Rendez-vous confirme',
      timestamp: new Date()
    }];

    const updated = await AppointmentRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      {
        $set: {
          status: 'accepted',
          confirmedSlot: {
            ...confirmedSlot,
            bookingId,
            confirmedBy,
            confirmedAt: new Date()
          }
        },
        $push: { messages: { $each: messages } }
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error accepting appointment:', error);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation' });
  }
});

// POST /appointments/:requestId/reject - Rejeter la demande
router.post('/:requestId/reject', async (req: Request, res: Response) => {
  try {
    const { rejectedBy, reason } = req.body;

    const messages = [{
      id: uuidv4(),
      senderId: 'system',
      senderName: 'Systeme',
      senderType: 'system' as const,
      content: `Demande rejetee${reason ? ': ' + reason : ''}`,
      timestamp: new Date()
    }];

    const appointment = await AppointmentRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason,
          respondedAt: new Date()
        },
        $push: { messages: { $each: messages } }
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

// POST /appointments/:requestId/message - Ajouter un message
router.post('/:requestId/message', async (req: Request, res: Response) => {
  try {
    const { senderId, senderName, senderType, content } = req.body;

    const message = {
      id: uuidv4(),
      senderId,
      senderName,
      senderType,
      content,
      timestamp: new Date()
    };

    const appointment = await AppointmentRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      { $push: { messages: message } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du message' });
  }
});

// DELETE /appointments/:requestId - Annuler une demande
router.delete('/:requestId', async (req: Request, res: Response) => {
  try {
    const appointment = await AppointmentRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      {
        $set: { status: 'cancelled' },
        $push: {
          messages: {
            id: uuidv4(),
            senderId: 'system',
            senderName: 'Systeme',
            senderType: 'system',
            content: 'Demande annulee',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Demande de RDV non trouvee' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

export default router;

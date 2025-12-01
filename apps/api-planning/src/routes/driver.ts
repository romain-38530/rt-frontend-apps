/**
 * Routes: Driver Check-in
 * Gestion de la borne chauffeur et check-in
 */

import { Router, Request, Response } from 'express';
import { DriverCheckin, Booking, Site, Dock } from '../models';

const router = Router();

// ============================================
// CHECK-IN CHAUFFEUR
// ============================================

// POST /driver/checkin - Check-in d'un chauffeur
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const {
      bookingId, checkinCode, driverName, driverPhone,
      plateNumber, trailerNumber, location, checkinMode
    } = req.body;

    // Trouver la réservation
    let booking;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    } else if (checkinCode) {
      booking = await Booking.findOne({ reference: checkinCode });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée. Vérifiez le code ou l\'ID.'
      });
    }

    if (!['confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cette réservation ne peut pas être enregistrée (statut: ${booking.status})`
      });
    }

    // Vérifier si déjà check-in
    const existingCheckin = await DriverCheckin.findOne({ bookingId: booking._id });
    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        error: 'Ce chauffeur est déjà enregistré',
        data: existingCheckin
      });
    }

    // Vérifier le géofence si localisation fournie
    let isWithinGeofence = false;
    if (location) {
      const site = await Site.findById(booking.siteId);
      if (site && site.geofence) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          site.geofence.latitude,
          site.geofence.longitude
        );
        isWithinGeofence = distance <= site.geofence.radiusMeters;
      }
    }

    // Calculer la position dans la queue
    const queueCount = await DriverCheckin.countDocuments({
      siteId: booking.siteId,
      status: { $in: ['waiting', 'called'] }
    });

    // Estimer le temps d'attente (15 min par camion en moyenne)
    const estimatedWaitMinutes = queueCount * 15;

    // Créer le check-in
    const checkin = new DriverCheckin({
      bookingId: booking._id,
      bookingReference: booking.reference,
      siteId: booking.siteId,
      driverName,
      driverPhone,
      transporterOrgId: booking.transporter.orgId,
      transporterName: booking.transporter.orgName,
      plateNumber,
      trailerNumber,
      checkinMode: checkinMode || 'manual',
      checkinCode: booking.reference,
      checkinLocation: location,
      isWithinGeofence,
      status: 'waiting',
      queuePosition: queueCount + 1,
      estimatedWaitMinutes,
      checkedInAt: new Date(),
      securityAcknowledged: false
    });

    await checkin.save();

    // Mettre à jour la réservation
    booking.status = 'checked_in';
    booking.vehicle = {
      plateNumber,
      trailerNumber,
      vehicleType: 'Semi-remorque',
      driverName,
      driverPhone
    };
    booking.timestamps.checkedInAt = new Date();
    booking.statusHistory.push({
      status: 'checked_in',
      changedAt: new Date(),
      changedBy: driverName
    });
    await booking.save();

    // Récupérer les instructions du site
    const site = await Site.findById(booking.siteId);

    res.status(201).json({
      success: true,
      data: {
        checkin,
        booking,
        instructions: {
          access: site?.accessInstructions,
          security: site?.securityInstructions,
          parking: site?.parkingInstructions
        },
        queue: {
          position: queueCount + 1,
          estimatedWaitMinutes
        }
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /driver/status/:bookingId - Statut d'un chauffeur
router.get('/status/:bookingId', async (req: Request, res: Response) => {
  try {
    const checkin = await DriverCheckin.findOne({ bookingId: req.params.bookingId });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        error: 'Check-in non trouvé'
      });
    }

    // Recalculer la position dans la queue
    if (checkin.status === 'waiting') {
      const queueAhead = await DriverCheckin.countDocuments({
        siteId: checkin.siteId,
        status: { $in: ['waiting', 'called'] },
        checkedInAt: { $lt: checkin.checkedInAt }
      });
      checkin.queuePosition = queueAhead + 1;
      checkin.estimatedWaitMinutes = queueAhead * 15;
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /driver/queue/:siteId - File d'attente d'un site
router.get('/queue/:siteId', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const query: any = { siteId: req.params.siteId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['waiting', 'called', 'at_dock', 'loading'] };
    }

    const queue = await DriverCheckin.find(query)
      .sort({ checkedInAt: 1 });

    // Ajouter la position dans la queue
    const queueWithPositions = queue.map((item, index) => ({
      ...item.toObject(),
      queuePosition: index + 1
    }));

    res.json({
      success: true,
      data: queueWithPositions,
      stats: {
        total: queue.length,
        waiting: queue.filter(q => q.status === 'waiting').length,
        called: queue.filter(q => q.status === 'called').length,
        atDock: queue.filter(q => q.status === 'at_dock').length,
        loading: queue.filter(q => q.status === 'loading').length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /driver/call/:checkinId - Appeler un chauffeur au quai
router.post('/call/:checkinId', async (req: Request, res: Response) => {
  try {
    const { dockId } = req.body;

    const checkin = await DriverCheckin.findById(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: 'Check-in non trouvé' });
    }

    const dock = await Dock.findById(dockId);
    if (!dock) {
      return res.status(404).json({ success: false, error: 'Quai non trouvé' });
    }

    checkin.status = 'called';
    checkin.assignedDockId = dockId;
    checkin.assignedDockName = dock.name;
    checkin.calledAt = new Date();
    await checkin.save();

    // Mettre à jour le statut du quai
    dock.status = 'occupied';
    dock.currentBookingId = checkin.bookingId;
    await dock.save();

    // Mettre à jour la réservation
    const booking = await Booking.findById(checkin.bookingId);
    if (booking) {
      booking.dockId = dockId;
      booking.dockName = dock.name;
      booking.timestamps.calledAt = new Date();
      await booking.save();
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /driver/arrive-dock/:checkinId - Chauffeur arrivé au quai
router.post('/arrive-dock/:checkinId', async (req: Request, res: Response) => {
  try {
    const checkin = await DriverCheckin.findById(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: 'Check-in non trouvé' });
    }

    checkin.status = 'at_dock';
    checkin.atDockAt = new Date();
    await checkin.save();

    // Mettre à jour la réservation
    const booking = await Booking.findById(checkin.bookingId);
    if (booking) {
      booking.status = 'at_dock';
      booking.timestamps.atDockAt = new Date();
      booking.statusHistory.push({
        status: 'at_dock',
        changedAt: new Date()
      });
      await booking.save();
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /driver/start-loading/:checkinId - Début du chargement
router.post('/start-loading/:checkinId', async (req: Request, res: Response) => {
  try {
    const checkin = await DriverCheckin.findById(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: 'Check-in non trouvé' });
    }

    checkin.status = 'loading';
    checkin.loadingStartedAt = new Date();
    await checkin.save();

    // Mettre à jour la réservation
    const booking = await Booking.findById(checkin.bookingId);
    if (booking) {
      booking.status = 'loading';
      booking.timestamps.loadingStartedAt = new Date();
      booking.statusHistory.push({
        status: 'loading',
        changedAt: new Date()
      });
      await booking.save();
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /driver/end-loading/:checkinId - Fin du chargement
router.post('/end-loading/:checkinId', async (req: Request, res: Response) => {
  try {
    const { palletCount, weight } = req.body;

    const checkin = await DriverCheckin.findById(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: 'Check-in non trouvé' });
    }

    checkin.status = 'signing';
    checkin.loadingEndedAt = new Date();
    await checkin.save();

    // Mettre à jour la réservation
    const booking = await Booking.findById(checkin.bookingId);
    if (booking) {
      booking.timestamps.loadingEndedAt = new Date();
      if (palletCount) booking.cargo.palletCount = palletCount;
      if (weight) booking.cargo.weight = weight;
      await booking.save();
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /driver/checkout/:checkinId - Check-out du chauffeur
router.post('/checkout/:checkinId', async (req: Request, res: Response) => {
  try {
    const checkin = await DriverCheckin.findById(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: 'Check-in non trouvé' });
    }

    checkin.status = 'departed';
    checkin.departedAt = new Date();
    await checkin.save();

    // Libérer le quai
    if (checkin.assignedDockId) {
      const dock = await Dock.findById(checkin.assignedDockId);
      if (dock) {
        dock.status = 'available';
        dock.currentBookingId = undefined;
        await dock.save();
      }
    }

    // Mettre à jour la réservation
    const booking = await Booking.findById(checkin.bookingId);
    if (booking) {
      booking.status = 'completed';
      booking.timestamps.departedAt = new Date();
      booking.timestamps.completedAt = new Date();

      // Calculer les métriques
      const waitTime = checkin.calledAt && checkin.checkedInAt
        ? Math.round((checkin.calledAt.getTime() - checkin.checkedInAt.getTime()) / 60000)
        : 0;
      const dockTime = checkin.departedAt && checkin.atDockAt
        ? Math.round((checkin.departedAt.getTime() - checkin.atDockAt.getTime()) / 60000)
        : 0;
      const totalTime = checkin.departedAt && checkin.checkedInAt
        ? Math.round((checkin.departedAt.getTime() - checkin.checkedInAt.getTime()) / 60000)
        : 0;

      booking.metrics = {
        waitTimeMinutes: waitTime,
        dockTimeMinutes: dockTime,
        totalTimeMinutes: totalTime
      };

      booking.statusHistory.push({
        status: 'completed',
        changedAt: new Date()
      });

      await booking.save();
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /driver/geofence-event - Événement géofence (entrée/sortie)
router.post('/geofence-event', async (req: Request, res: Response) => {
  try {
    const { bookingId, eventType, location } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    if (eventType === 'enter') {
      booking.timestamps.arrivedAt = new Date();
      await booking.save();

      // Créer automatiquement un check-in si mode app
      const existingCheckin = await DriverCheckin.findOne({ bookingId });
      if (!existingCheckin) {
        const queueCount = await DriverCheckin.countDocuments({
          siteId: booking.siteId,
          status: { $in: ['waiting', 'called'] }
        });

        const checkin = new DriverCheckin({
          bookingId: booking._id,
          bookingReference: booking.reference,
          siteId: booking.siteId,
          driverName: booking.vehicle?.driverName || 'Chauffeur',
          driverPhone: booking.vehicle?.driverPhone,
          transporterOrgId: booking.transporter.orgId,
          transporterName: booking.transporter.orgName,
          plateNumber: booking.vehicle?.plateNumber || 'N/A',
          trailerNumber: booking.vehicle?.trailerNumber,
          checkinMode: 'app',
          checkinLocation: location,
          isWithinGeofence: true,
          status: 'arrived',
          queuePosition: queueCount + 1,
          estimatedWaitMinutes: queueCount * 15,
          arrivedAt: new Date(),
          checkedInAt: new Date(),
          securityAcknowledged: false
        });

        await checkin.save();

        return res.json({
          success: true,
          data: {
            event: 'auto_checkin',
            checkin,
            booking
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        event: eventType,
        booking
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Fonction utilitaire: calcul de distance entre deux points GPS
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;

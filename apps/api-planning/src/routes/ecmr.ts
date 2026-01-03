/**
 * Routes: eCMR (Electronic CMR)
 * Gestion des lettres de voiture électroniques
 */

import { Router, Request, Response } from 'express';
import { ECMR, Booking, DriverCheckin } from '../models';
import { generateECMRPDFBuffer } from '../services/ecmr-pdf';

const router = Router();

// ============================================
// eCMR MANAGEMENT
// ============================================

// GET /ecmr - Liste des eCMR
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, bookingId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (bookingId) query.bookingId = bookingId;
    if (dateFrom && dateTo) {
      query.createdAt = { $gte: new Date(dateFrom as string), $lte: new Date(dateTo as string) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [ecmrs, total] = await Promise.all([
      ECMR.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      ECMR.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: ecmrs,
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

// POST /ecmr - Créer une eCMR
router.post('/', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    // Vérifier la réservation
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    // Vérifier si une eCMR existe déjà
    const existing = await ECMR.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Une eCMR existe déjà pour cette réservation',
        data: existing
      });
    }

    // Créer l'eCMR avec les données de la réservation
    const ecmr = new ECMR({
      bookingId: booking._id,
      bookingReference: booking.reference,
      orderId: booking.orderId,
      orderReference: booking.orderReference,

      sender: req.body.sender || {
        name: booking.siteOwner.orgName,
        address: 'À compléter',
        city: 'À compléter',
        postalCode: '',
        country: 'France',
        contactName: booking.siteOwner.contactName,
        contactPhone: booking.siteOwner.contactPhone,
        contactEmail: booking.siteOwner.contactEmail
      },

      carrier: req.body.carrier || {
        name: booking.transporter.orgName,
        address: 'À compléter',
        city: 'À compléter',
        postalCode: '',
        country: 'France',
        contactName: booking.transporter.contactName,
        contactPhone: booking.transporter.contactPhone,
        contactEmail: booking.transporter.contactEmail
      },

      recipient: req.body.recipient || {
        name: booking.requester.orgName,
        address: 'À compléter',
        city: 'À compléter',
        postalCode: '',
        country: 'France',
        contactName: booking.requester.contactName,
        contactPhone: booking.requester.contactPhone,
        contactEmail: booking.requester.contactEmail
      },

      loadingPlace: req.body.loadingPlace || {
        address: booking.siteName,
        city: 'À compléter',
        country: 'France',
        date: booking.confirmedDate || booking.requestedDate
      },

      deliveryPlace: req.body.deliveryPlace || {
        address: 'À compléter',
        city: 'À compléter',
        country: 'France'
      },

      goods: req.body.goods || [{
        description: booking.cargo.description,
        packaging: 'Palettes',
        quantity: booking.cargo.palletCount || 1,
        weight: booking.cargo.weight || 0,
        volume: booking.cargo.volume,
        adrClass: booking.cargo.adrClass
      }],

      totalWeight: booking.cargo.weight || 0,
      totalPackages: booking.cargo.palletCount || 1,

      vehiclePlate: booking.vehicle?.plateNumber || 'À compléter',
      trailerPlate: booking.vehicle?.trailerNumber,

      status: 'draft',
      eidasCompliant: false
    });

    await ecmr.save();

    // Mettre à jour la réservation
    booking.ecmrId = ecmr._id.toString();
    await booking.save();

    res.status(201).json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /ecmr/:id - Détails d'une eCMR
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    res.json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /ecmr/:id - Modifier une eCMR
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    if (!['draft'].includes(ecmr.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cette eCMR ne peut plus être modifiée'
      });
    }

    Object.assign(ecmr, req.body);
    await ecmr.save();

    res.json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /ecmr/:id/sign - Signer une eCMR
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const { party, signedBy, signatureData, comments, geolocation } = req.body;

    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    // Vérifier que cette partie n'a pas déjà signé
    const alreadySigned = ecmr.signatures.find(s => s.party === party);
    if (alreadySigned) {
      return res.status(400).json({
        success: false,
        error: `Le ${party} a déjà signé cette eCMR`
      });
    }

    // Vérifier l'ordre des signatures
    const signatureOrder = ['sender', 'carrier', 'recipient'];
    const currentIndex = signatureOrder.indexOf(party);
    for (let i = 0; i < currentIndex; i++) {
      const previousParty = signatureOrder[i];
      const previousSigned = ecmr.signatures.find(s => s.party === previousParty);
      if (!previousSigned) {
        return res.status(400).json({
          success: false,
          error: `Le ${previousParty} doit signer avant le ${party}`
        });
      }
    }

    // Ajouter la signature
    ecmr.signatures.push({
      party,
      signedBy,
      signedAt: new Date(),
      signatureData,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
      geolocation,
      comments
    });

    // Mettre à jour les réserves si commentaires
    if (comments) {
      if (party === 'sender') ecmr.senderReserves = comments;
      if (party === 'carrier') ecmr.carrierReserves = comments;
      if (party === 'recipient') ecmr.recipientReserves = comments;
    }

    // Mettre à jour le statut
    const signedParties = ecmr.signatures.map(s => s.party);
    if (signedParties.length === 1 && signedParties.includes('sender')) {
      ecmr.status = 'pending_carrier';
    } else if (signedParties.length === 2 && signedParties.includes('carrier')) {
      ecmr.status = 'pending_recipient';
    } else if (signedParties.length === 3) {
      ecmr.status = 'signed';
    }

    await ecmr.save();

    // Mettre à jour le check-in et la réservation
    const booking = await Booking.findById(ecmr.bookingId);
    if (booking) {
      booking.timestamps.signedAt = new Date();
      await booking.save();

      const checkin = await DriverCheckin.findOne({ bookingId: booking._id });
      if (checkin) {
        checkin.signedAt = new Date();
        await checkin.save();
      }
    }

    res.json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /ecmr/:id/validate - Valider une eCMR
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    if (ecmr.status !== 'signed') {
      return res.status(400).json({
        success: false,
        error: 'L\'eCMR doit être signée par toutes les parties avant validation'
      });
    }

    // Vérifier toutes les signatures
    if (ecmr.signatures.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Toutes les signatures sont requises'
      });
    }

    ecmr.status = 'validated';
    ecmr.validatedAt = new Date();
    ecmr.eidasCompliant = true;
    ecmr.timestampToken = `TS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await ecmr.save();

    res.json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /ecmr/:id/download - Télécharger le PDF
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    // Générer le PDF avec le vrai template CMR
    const pdfBuffer = await generateECMRPDFBuffer(ecmr.toObject() as any);

    // Mettre à jour l'eCMR
    ecmr.pdfUrl = `/api/v1/ecmr/${ecmr._id}/pdf`;
    ecmr.pdfGeneratedAt = new Date();
    await ecmr.save();

    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="eCMR-${ecmr.reference}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ecmr/:id/pdf - Télécharger le PDF (alias)
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    // Générer le PDF avec le vrai template CMR
    const pdfBuffer = await generateECMRPDFBuffer(ecmr.toObject() as any);

    // Retourner le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eCMR-${ecmr.reference}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /ecmr/generate-pdf - Générer un PDF à partir des données eCMR
router.post('/generate-pdf', async (req: Request, res: Response) => {
  try {
    const ecmrData = req.body;

    // Si on a un ID, charger depuis la base
    if (ecmrData._id || ecmrData.id) {
      const ecmr = await ECMR.findById(ecmrData._id || ecmrData.id);
      if (ecmr) {
        const pdfBuffer = await generateECMRPDFBuffer(ecmr.toObject() as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="eCMR-${ecmr.reference}.pdf"`);
        return res.send(pdfBuffer);
      }
    }

    // Sinon, générer à partir des données fournies
    // S'assurer qu'on a une référence
    if (!ecmrData.reference) {
      ecmrData.reference = `ECMR-${Date.now()}`;
    }

    // Valeurs par défaut pour les champs manquants
    const completeData = {
      reference: ecmrData.reference,
      bookingReference: ecmrData.bookingReference || '',
      orderReference: ecmrData.orderReference || '',
      sender: ecmrData.sender || { name: 'N/A', address: 'N/A', city: 'N/A', postalCode: '', country: 'France' },
      carrier: ecmrData.carrier || { name: 'N/A', address: 'N/A', city: 'N/A', postalCode: '', country: 'France' },
      recipient: ecmrData.recipient || { name: 'N/A', address: 'N/A', city: 'N/A', postalCode: '', country: 'France' },
      loadingPlace: ecmrData.loadingPlace || { address: 'N/A', city: 'N/A', country: 'France' },
      deliveryPlace: ecmrData.deliveryPlace || { address: 'N/A', city: 'N/A', country: 'France' },
      goods: ecmrData.goods || [],
      totalWeight: ecmrData.totalWeight || 0,
      totalPackages: ecmrData.totalPackages || 0,
      vehiclePlate: ecmrData.vehiclePlate || 'N/A',
      trailerPlate: ecmrData.trailerPlate,
      signatures: ecmrData.signatures || [],
      status: ecmrData.status || 'draft',
      eidasCompliant: ecmrData.eidasCompliant || false,
      senderReserves: ecmrData.senderReserves,
      carrierReserves: ecmrData.carrierReserves,
      recipientReserves: ecmrData.recipientReserves,
      createdAt: ecmrData.createdAt || new Date(),
      validatedAt: ecmrData.validatedAt,
      timestampToken: ecmrData.timestampToken
    };

    const pdfBuffer = await generateECMRPDFBuffer(completeData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="eCMR-${completeData.reference}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ecmr/:id/history - Historique des modifications
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    const history = [
      {
        action: 'created',
        date: ecmr.createdAt,
        details: 'eCMR créée'
      },
      ...ecmr.signatures.map(sig => ({
        action: 'signed',
        date: sig.signedAt,
        party: sig.party,
        signedBy: sig.signedBy,
        comments: sig.comments
      })),
      ...(ecmr.validatedAt ? [{
        action: 'validated',
        date: ecmr.validatedAt,
        details: 'eCMR validée et archivée'
      }] : [])
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /ecmr/:id/photo - Ajouter une photo
router.post('/:id/photo', async (req: Request, res: Response) => {
  try {
    const { type, url, takenBy } = req.body;

    const ecmr = await ECMR.findById(req.params.id);
    if (!ecmr) {
      return res.status(404).json({ success: false, error: 'eCMR non trouvée' });
    }

    ecmr.photos.push({
      type,
      url,
      takenAt: new Date(),
      takenBy
    });

    await ecmr.save();

    res.json({
      success: true,
      data: ecmr
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

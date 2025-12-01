import express, { Response } from 'express';
import { DeliverySignature } from '../models/DeliverySignature';
import { Delivery } from '../models/Delivery';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';
import { SignatureService } from '../services/signature-service';

const router = express.Router();
const signatureService = new SignatureService();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(requireActiveRecipient);

// POST /signatures/scan-qr - Scanner le QR code du CMR
router.post('/scan-qr', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      res.status(400).json({ error: 'QR code data is required' });
      return;
    }

    // Décoder les données du QR code
    const qrInfo = await signatureService.decodeQRCode(qrCodeData);

    if (!qrInfo.valid) {
      res.status(400).json({
        error: 'Invalid QR code',
        message: qrInfo.error
      });
      return;
    }

    // Vérifier que la livraison existe et appartient au destinataire
    const delivery = await Delivery.findOne({
      deliveryId: qrInfo.deliveryId,
      recipientId: req.user!.recipientId
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found or does not belong to this recipient'
      });
      return;
    }

    // Vérifier le statut de la livraison
    if (!['arrived', 'unloading'].includes(delivery.status)) {
      res.status(400).json({
        error: 'Invalid delivery status for signature',
        currentStatus: delivery.status,
        expectedStatus: 'arrived or unloading'
      });
      return;
    }

    res.json({
      valid: true,
      delivery: {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        status: delivery.status,
        carrier: delivery.transport.carrierName,
        driver: delivery.transport.driverName,
        cargo: delivery.cargo,
        cmrId: qrInfo.cmrId
      },
      qrCodeData,
      scannedAt: new Date()
    });
  } catch (error: any) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ error: 'Error scanning QR code', details: error.message });
  }
});

// POST /signatures/receive - Signer réception complète
router.post('/receive', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      deliveryId,
      signatureData,
      signerName,
      signerRole,
      signerEmail,
      signerPhone,
      qrCodeData,
      location,
      reservations,
      deviceInfo
    } = req.body;

    // Validation
    if (!deliveryId || !signatureData || !signerName || !signerRole) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipientId = req.user!.recipientId;

    // Vérifier la livraison
    const delivery = await Delivery.findOne({ deliveryId, recipientId });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (!['arrived', 'unloading'].includes(delivery.status)) {
      res.status(400).json({
        error: 'Invalid delivery status for signature',
        currentStatus: delivery.status
      });
      return;
    }

    // Générer un signatureId
    const signatureId = await (DeliverySignature as any).generateSignatureId();

    // Créer la signature
    const signature = new DeliverySignature({
      signatureId,
      deliveryId,
      recipientId,
      siteId: delivery.siteId,
      type: 'reception',
      method: qrCodeData ? 'qrcode' : 'web',
      signatureData,
      signerName,
      signerRole,
      signerEmail,
      signerPhone,
      location,
      timestamp: new Date(),
      reservations,
      photos: [],
      qrCodeScanned: !!qrCodeData,
      qrCodeData,
      ecmrSigned: false,
      deviceInfo,
      verification: {
        verified: false
      },
      notifications: {
        recipientNotified: false,
        transporterNotified: false,
        industrialNotified: false,
        supplierNotified: false
      },
      metadata: {
        retries: 0
      }
    });

    // Valider la signature
    const validation = (signature as any).validateSignature() as { valid: boolean; errors: string[] };
    if (!validation.valid) {
      res.status(400).json({
        error: 'Signature validation failed',
        validationErrors: validation.errors
      });
      return;
    }

    await signature.save();

    // Mettre à jour la livraison
    delivery.status = 'delivered';
    delivery.deliveryDate = new Date();
    delivery.signature = {
      signatureId,
      signedAt: new Date(),
      signedBy: signerName,
      status: 'complete'
    };

    if (delivery.unloading && !delivery.unloading.completedAt) {
      delivery.unloading.completedAt = new Date();
      delivery.unloading.duration = Math.round(
        (delivery.unloading.completedAt.getTime() - (delivery.unloading.startedAt?.getTime() || 0)) / 60000
      );
    }

    (delivery as any).addTimelineEvent(
      'delivered',
      {
        id: req.user!.id,
        type: 'recipient',
        name: signerName
      },
      reservations ? `Delivered with reservations: ${reservations}` : 'Delivered successfully'
    );

    await delivery.save();

    // Signer l'eCMR
    const ecmrResult = await signatureService.signECMR(delivery.deliveryId, signatureId);

    if (ecmrResult.success) {
      signature.ecmrSigned = true;
      signature.ecmrUrl = ecmrResult.ecmrUrl;
      signature.cmrId = ecmrResult.cmrId;
      await signature.save();
    }

    // Envoyer les notifications
    await signatureService.sendSignatureNotifications(signature, delivery);

    res.status(201).json({
      message: 'Delivery signed successfully',
      signature: {
        signatureId: signature.signatureId,
        deliveryId: signature.deliveryId,
        type: signature.type,
        timestamp: signature.timestamp,
        ecmrSigned: signature.ecmrSigned,
        ecmrUrl: signature.ecmrUrl
      },
      delivery: {
        deliveryId: delivery.deliveryId,
        status: delivery.status,
        deliveryDate: delivery.deliveryDate
      }
    });
  } catch (error: any) {
    console.error('Error signing delivery:', error);
    res.status(500).json({ error: 'Error signing delivery', details: error.message });
  }
});

// POST /signatures/receive-partial - Signer réception partielle (avec réserves)
router.post('/receive-partial', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      deliveryId,
      signatureData,
      signerName,
      signerRole,
      partialReception,
      reservations,
      location,
      deviceInfo
    } = req.body;

    // Validation
    if (!deliveryId || !signatureData || !signerName || !signerRole || !partialReception) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({ deliveryId, recipientId });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    // Générer un signatureId
    const signatureId = await (DeliverySignature as any).generateSignatureId();

    // Créer la signature
    const signature = new DeliverySignature({
      signatureId,
      deliveryId,
      recipientId,
      siteId: delivery.siteId,
      type: 'partial_reception',
      method: 'web',
      signatureData,
      signerName,
      signerRole,
      location,
      timestamp: new Date(),
      reservations,
      partialReception,
      photos: [],
      ecmrSigned: false,
      deviceInfo,
      verification: {
        verified: false
      },
      notifications: {
        recipientNotified: false,
        transporterNotified: false,
        industrialNotified: false,
        supplierNotified: false
      }
    });

    await signature.save();

    // Mettre à jour la livraison
    delivery.status = 'delivered';
    delivery.deliveryDate = new Date();
    delivery.signature = {
      signatureId,
      signedAt: new Date(),
      signedBy: signerName,
      status: 'partial'
    };

    (delivery as any).addTimelineEvent(
      'delivered',
      {
        id: req.user!.id,
        type: 'recipient',
        name: signerName
      },
      `Partial reception: ${partialReception.receivedPercentage}% received. ${reservations || ''}`
    );

    await delivery.save();

    // Signer l'eCMR avec réserves
    const ecmrResult = await signatureService.signECMR(delivery.deliveryId, signatureId, reservations);

    if (ecmrResult.success) {
      signature.ecmrSigned = true;
      signature.ecmrUrl = ecmrResult.ecmrUrl;
      signature.cmrId = ecmrResult.cmrId;
      await signature.save();
    }

    // Envoyer les notifications
    await signatureService.sendSignatureNotifications(signature, delivery);

    res.status(201).json({
      message: 'Partial reception signed successfully',
      signature: {
        signatureId: signature.signatureId,
        deliveryId: signature.deliveryId,
        type: signature.type,
        partialReception: signature.partialReception,
        timestamp: signature.timestamp
      }
    });
  } catch (error: any) {
    console.error('Error signing partial reception:', error);
    res.status(500).json({ error: 'Error signing partial reception', details: error.message });
  }
});

// POST /signatures/refuse - Refuser une livraison
router.post('/refuse', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      deliveryId,
      signatureData,
      signerName,
      signerRole,
      refusalDetails,
      location,
      deviceInfo
    } = req.body;

    // Validation
    if (!deliveryId || !signatureData || !signerName || !signerRole || !refusalDetails) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipientId = req.user!.recipientId;

    const delivery = await Delivery.findOne({ deliveryId, recipientId });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    // Générer un signatureId
    const signatureId = await (DeliverySignature as any).generateSignatureId();

    // Créer la signature de refus
    const signature = new DeliverySignature({
      signatureId,
      deliveryId,
      recipientId,
      siteId: delivery.siteId,
      type: 'refusal',
      method: 'web',
      signatureData,
      signerName,
      signerRole,
      location,
      timestamp: new Date(),
      refusalDetails,
      photos: [],
      ecmrSigned: false,
      deviceInfo,
      verification: {
        verified: false
      },
      notifications: {
        recipientNotified: false,
        transporterNotified: false,
        industrialNotified: false,
        supplierNotified: false
      }
    });

    await signature.save();

    // Mettre à jour la livraison
    delivery.status = 'incident';
    delivery.signature = {
      signatureId,
      signedAt: new Date(),
      signedBy: signerName,
      status: 'refused'
    };

    (delivery as any).addTimelineEvent(
      'incident',
      {
        id: req.user!.id,
        type: 'recipient',
        name: signerName
      },
      `Delivery refused: ${refusalDetails.reason} - ${refusalDetails.detailedReason}`
    );

    await delivery.save();

    // Créer un incident automatiquement
    const { IncidentService } = await import('../services/incident-service');
    const incidentService = new IncidentService();

    await incidentService.createIncidentFromRefusal(delivery, signature, refusalDetails);

    // Envoyer les notifications urgentes
    await signatureService.sendSignatureNotifications(signature, delivery);

    res.status(201).json({
      message: 'Delivery refused successfully',
      signature: {
        signatureId: signature.signatureId,
        deliveryId: signature.deliveryId,
        type: signature.type,
        refusalDetails: signature.refusalDetails,
        timestamp: signature.timestamp
      },
      delivery: {
        deliveryId: delivery.deliveryId,
        status: delivery.status
      }
    });
  } catch (error: any) {
    console.error('Error refusing delivery:', error);
    res.status(500).json({ error: 'Error refusing delivery', details: error.message });
  }
});

// GET /signatures/:deliveryId - Récupérer les signatures d'une livraison
router.get('/:deliveryId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliveryId } = req.params;
    const recipientId = req.user!.recipientId;

    // Vérifier que la livraison appartient au destinataire
    const delivery = await Delivery.findOne({ deliveryId, recipientId });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    const signatures = await DeliverySignature.find({ deliveryId })
      .sort({ timestamp: -1 });

    res.json({
      deliveryId,
      signatures,
      total: signatures.length
    });
  } catch (error: any) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: 'Error fetching signatures', details: error.message });
  }
});

// POST /signatures/photos - Ajouter des photos à une signature
router.post('/photos', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      signatureId,
      photos
    } = req.body;

    if (!signatureId || !photos || !Array.isArray(photos)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const recipientId = req.user!.recipientId;

    const signature = await DeliverySignature.findOne({
      signatureId,
      recipientId
    });

    if (!signature) {
      res.status(404).json({ error: 'Signature not found' });
      return;
    }

    // Ajouter les photos
    for (const photo of photos) {
      (signature as any).addPhoto(photo.url, photo.description, photo.location);
    }

    await signature.save();

    res.json({
      message: 'Photos added successfully',
      signatureId: signature.signatureId,
      photos: signature.photos,
      total: signature.photos.length
    });
  } catch (error: any) {
    console.error('Error adding photos:', error);
    res.status(500).json({ error: 'Error adding photos', details: error.message });
  }
});

// GET /signatures/:signatureId/ecmr - Télécharger l'eCMR signé
router.get('/:signatureId/ecmr', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { signatureId } = req.params;
    const recipientId = req.user!.recipientId;

    const signature = await DeliverySignature.findOne({
      signatureId,
      recipientId
    });

    if (!signature) {
      res.status(404).json({ error: 'Signature not found' });
      return;
    }

    if (!signature.ecmrSigned || !signature.ecmrUrl) {
      res.status(404).json({
        error: 'eCMR not available',
        message: 'The eCMR has not been signed yet'
      });
      return;
    }

    res.json({
      signatureId: signature.signatureId,
      deliveryId: signature.deliveryId,
      cmrId: signature.cmrId,
      ecmrUrl: signature.ecmrUrl,
      signedAt: signature.timestamp
    });
  } catch (error: any) {
    console.error('Error fetching eCMR:', error);
    res.status(500).json({ error: 'Error fetching eCMR', details: error.message });
  }
});

export default router;

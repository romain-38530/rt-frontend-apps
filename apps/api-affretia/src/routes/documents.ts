/**
 * Routes: Documents
 * Upload et gestion des documents de transport (BL, CMR, POD)
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import TransportDocument from '../models/TransportDocument';
import AffretSession from '../models/AffretSession';
import { getEventEmitter } from '../modules/events';

const router = Router();

// Configuration multer pour upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Formats acceptés: PDF, JPEG, PNG, TIFF'));
    }
  }
});

/**
 * POST /upload - Upload d'un document
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { orderId, sessionId, type, processOCR = true, uploadedBy, source = 'carrier' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId requis' });
    }

    // Générer un ID unique et un nom de fichier
    const documentId = uuidv4();
    const filename = `${type}-${orderId}-${Date.now()}.${file.mimetype.split('/')[1]}`;

    // En production, upload vers S3/GCS. Ici on simule.
    const url = `https://storage.symphonia-controltower.com/documents/${orderId}/${filename}`;

    // Simuler OCR
    let extractedData = null;
    let ocrConfidence = 0;

    if (processOCR) {
      // Simulation OCR (en prod: AWS Textract, Google Vision, etc.)
      ocrConfidence = Math.floor(Math.random() * 20) + 80; // 80-100%

      if (type === 'bl' || type === 'cmr') {
        extractedData = {
          documentNumber: `DOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          date: new Date().toISOString().split('T')[0],
          shipper: {
            name: 'Expéditeur SARL',
            address: '123 Rue Industrie, 69000 Lyon'
          },
          consignee: {
            name: 'Destinataire SA',
            address: '456 Avenue Commerce, 75001 Paris'
          },
          carrier: {
            name: 'Transporteur Express',
            license: 'LIC-123456'
          },
          goods: {
            description: 'Marchandises générales',
            weight: Math.floor(Math.random() * 10000) + 1000,
            packages: Math.floor(Math.random() * 50) + 1,
            pallets: Math.floor(Math.random() * 30) + 1
          }
        };
      } else if (type === 'pod') {
        extractedData = {
          documentNumber: `POD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          date: new Date().toISOString().split('T')[0],
          receivedBy: 'Jean Dupont',
          receivedAt: new Date().toISOString(),
          signature: true,
          remarks: 'Colis réceptionné en bon état'
        };
      } else if (type === 'invoice') {
        extractedData = {
          invoiceNumber: `FAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          date: new Date().toISOString().split('T')[0],
          totalAmount: Math.floor(Math.random() * 5000) + 500,
          currency: 'EUR'
        };
      }
    }

    // Créer le document
    const document = new TransportDocument({
      orderId,
      sessionId,
      type,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      ocrProcessed: processOCR,
      ocrConfidence,
      extractedData,
      validated: false,
      uploadedBy: uploadedBy || 'system',
      source
    });

    await document.save();

    // Émettre événement
    if (sessionId) {
      const session = await AffretSession.findById(sessionId);
      const eventEmitter = getEventEmitter();
      eventEmitter.emitDocumentsUploaded(
        sessionId,
        document._id.toString(),
        type,
        filename,
        processOCR,
        extractedData ? Object.fromEntries(
          Object.entries(extractedData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
        ) : undefined,
        session?.organizationId
      );
    }

    res.status(201).json({
      success: true,
      documentId: document._id,
      filename,
      url,
      type,
      ocrProcessed: processOCR,
      ocrConfidence,
      extractedData,
      message: 'Document uploadé avec succès'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /order/:orderId - Documents d'une commande
 */
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const documents = await TransportDocument.find({ orderId: req.params.orderId })
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id - Détails d'un document
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const document = await TransportDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    res.json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:id/validate - Valider un document
 */
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { userId, errors } = req.body;
    const document = await TransportDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    await (document as any).validate(userId, errors);

    res.json({
      success: true,
      validated: document.validated,
      validationErrors: document.validationErrors
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /missing/:orderId - Documents manquants
 */
router.get('/missing/:orderId', async (req: Request, res: Response) => {
  try {
    const requiredTypes = ['bl', 'cmr', 'pod'];
    const documents = await TransportDocument.find({
      orderId: req.params.orderId,
      type: { $in: requiredTypes }
    });

    const foundTypes = documents.map(d => d.type);
    const missingTypes = requiredTypes.filter(t => !foundTypes.includes(t as any));

    res.json({
      orderId: req.params.orderId,
      required: requiredTypes,
      received: foundTypes,
      missing: missingTypes,
      complete: missingTypes.length === 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /reminder - Configurer les relances documents
 */
router.post('/reminder', async (req: Request, res: Response) => {
  try {
    const { orderId, documentTypes, schedule } = req.body;

    // En production, créer un job de relance
    // Ici, on simule la configuration

    res.json({
      success: true,
      orderId,
      documentTypes,
      schedule,
      message: 'Relances configurées',
      nextReminder: schedule['J+1'] ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /:id - Supprimer un document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const document = await TransportDocument.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    res.json({ success: true, message: 'Document supprimé' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

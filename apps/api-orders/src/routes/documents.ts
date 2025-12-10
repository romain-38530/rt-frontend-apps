/**
 * Routes Documents - API de gestion documentaire SYMPHONI.A
 * Upload CMR/BL/POD, validation, signature électronique
 */
import { Router, Request, Response } from 'express';
import DocumentService from '../services/document-service';

const router = Router();

/**
 * POST /api/v1/documents/:orderId/upload
 * Upload un document pour une commande
 */
router.post('/:orderId/upload', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const {
      type,
      fileName,
      originalName,
      mimeType,
      fileSize,
      fileData,
      s3Key,
      s3Bucket,
      url,
      uploadedBy,
      location,
      notes
    } = req.body;

    if (!type || !fileName || !uploadedBy) {
      return res.status(400).json({
        success: false,
        error: 'type, fileName et uploadedBy sont requis'
      });
    }

    const result = await DocumentService.uploadDocument({
      orderId,
      type,
      fileName,
      originalName: originalName || fileName,
      mimeType: mimeType || 'application/octet-stream',
      fileSize: fileSize || 0,
      fileData,
      s3Key,
      s3Bucket,
      url,
      uploadedBy,
      location,
      notes
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/documents/:orderId
 * Liste les documents d'une commande
 */
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const documents = await DocumentService.getOrderDocuments(orderId);

    res.json({
      success: true,
      count: documents.length,
      documents: documents.map(doc => ({
        documentId: doc.documentId,
        type: doc.type,
        status: doc.status,
        fileName: doc.originalName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        url: doc.url,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        validatedAt: doc.validatedAt,
        signature: doc.signature ? {
          signedBy: doc.signature.signedBy,
          signedAt: doc.signature.signedAt
        } : null
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/documents/detail/:documentId
 * Récupère les détails d'un document
 */
router.get('/detail/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await DocumentService.getDocument(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document non trouvé' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/documents/:documentId/validate
 * Valide un document
 */
router.post('/:documentId/validate', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { validatedBy } = req.body;

    if (!validatedBy || !validatedBy.id || !validatedBy.name) {
      return res.status(400).json({
        success: false,
        error: 'validatedBy (id, name, role) est requis'
      });
    }

    const result = await DocumentService.validateDocument(documentId, validatedBy);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Document validé',
      document: {
        documentId: result.document?.documentId,
        status: result.document?.status,
        validatedAt: result.document?.validatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/documents/:documentId/reject
 * Rejette un document
 */
router.post('/:documentId/reject', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { rejectedBy, reason } = req.body;

    if (!rejectedBy || !reason) {
      return res.status(400).json({
        success: false,
        error: 'rejectedBy et reason sont requis'
      });
    }

    const result = await DocumentService.rejectDocument(documentId, rejectedBy, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Document rejeté',
      document: {
        documentId: result.document?.documentId,
        status: result.document?.status,
        rejectionReason: result.document?.rejectionReason
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/documents/:documentId/sign
 * Signature électronique d'un document (POD/BL)
 */
router.post('/:documentId/sign', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { signedBy, signatureData, ipAddress, deviceInfo } = req.body;

    if (!signedBy || !signatureData) {
      return res.status(400).json({
        success: false,
        error: 'signedBy et signatureData (base64) sont requis'
      });
    }

    const result = await DocumentService.signDocument(documentId, {
      signedBy,
      signatureData,
      ipAddress: ipAddress || req.ip,
      deviceInfo
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Document signé électroniquement',
      document: {
        documentId: result.document?.documentId,
        type: result.document?.type,
        status: result.document?.status,
        signature: {
          signedBy: result.document?.signature?.signedBy,
          signedAt: result.document?.signature?.signedAt
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/documents/:orderId/check
 * Vérifie si tous les documents requis sont présents
 */
router.get('/:orderId/check', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await DocumentService.checkRequiredDocuments(orderId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/documents/stats
 * Statistiques des documents
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const industrialId = req.headers['x-industrial-id'] as string;

    const stats = await DocumentService.getDocumentStats(industrialId);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

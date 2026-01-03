import { Router, Request, Response } from 'express';
import signatureService from '../services/signature-service';
import { authenticateSupplier, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /signatures/loading
 * Signer un bon de chargement
 */
router.post('/loading', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      orderId,
      method,
      signatureData,
      signerName,
      signerRole,
      location,
      deviceInfo
    } = req.body;

    if (!orderId || !method || !signatureData || !signerName || !signerRole) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'method', 'signatureData', 'signerName', 'signerRole']
      });
    }

    const validMethods = ['smartphone', 'qrcode', 'kiosk'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: 'Invalid method',
        validMethods
      });
    }

    const signature = await signatureService.createSignature({
      orderId,
      supplierId,
      type: 'loading',
      method,
      signatureData,
      signerName,
      signerRole,
      location,
      deviceInfo
    });

    res.status(201).json({
      success: true,
      message: 'Loading signature created successfully',
      signature: {
        signatureId: signature.signatureId,
        orderId: signature.orderId,
        type: signature.type,
        timestamp: signature.timestamp,
        verified: signature.verified
      }
    });
  } catch (error: any) {
    console.error('Error creating loading signature:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /signatures/qrcode/generate
 * Générer un QR code pour signature
 */
router.post('/qrcode/generate', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { orderId, type } = req.body;

    if (!orderId || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'type']
      });
    }

    const validTypes = ['loading', 'delivery_note'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        validTypes
      });
    }

    const result = await signatureService.generateQRCode({
      orderId,
      supplierId,
      type
    });

    res.json({
      success: true,
      qrCode: result.qrCodeUrl,
      token: result.token,
      expiresAt: result.expiresAt
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /signatures/qrcode/scan
 * Scanner et signer via QR code
 */
router.post('/qrcode/scan', async (req: Request, res: Response) => {
  try {
    const {
      token,
      signatureData,
      signerName,
      signerRole,
      location,
      deviceInfo
    } = req.body;

    if (!token || !signatureData || !signerName || !signerRole) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['token', 'signatureData', 'signerName', 'signerRole']
      });
    }

    const signature = await signatureService.signViaQRCode(
      token,
      signatureData,
      signerName,
      signerRole,
      location,
      deviceInfo
    );

    res.status(201).json({
      success: true,
      message: 'QR code signature created successfully',
      signature: {
        signatureId: signature.signatureId,
        orderId: signature.orderId,
        type: signature.type,
        timestamp: signature.timestamp,
        verified: signature.verified
      }
    });
  } catch (error: any) {
    console.error('Error scanning QR code:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /signatures/:orderId
 * Récupérer toutes les signatures pour une commande
 */
router.get('/:orderId', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { orderId } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const signatures = await signatureService.getOrderSignatures(orderId);

    // Vérifier que le fournisseur a accès à cette commande
    const hasAccess = signatures.some((sig) => sig.supplierId === supplierId);
    if (signatures.length > 0 && !hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      orderId,
      signatures: signatures.map((sig) => ({
        signatureId: sig.signatureId,
        type: sig.type,
        method: sig.method,
        signerName: sig.signerName,
        signerRole: sig.signerRole,
        timestamp: sig.timestamp,
        verified: sig.verified,
        location: sig.location
      })),
      total: signatures.length
    });
  } catch (error: any) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /signatures/verify
 * Vérifier l'authenticité d'une signature
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { signatureId } = req.body;

    if (!signatureId) {
      return res.status(400).json({
        error: 'signatureId is required'
      });
    }

    const isValid = await signatureService.verifySignature(signatureId);

    res.json({
      signatureId,
      verified: isValid,
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Error verifying signature:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /signatures/:orderId/status
 * Vérifier le statut des signatures requises pour une commande
 */
router.get('/:orderId/status', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { orderId } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const status = await signatureService.checkRequiredSignatures(orderId);

    res.json({
      orderId,
      complete: status.complete,
      missing: status.missing,
      signatures: status.signatures.map((sig) => ({
        signatureId: sig.signatureId,
        type: sig.type,
        timestamp: sig.timestamp,
        verified: sig.verified
      }))
    });
  } catch (error: any) {
    console.error('Error checking signature status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /signatures/:orderId/loading-note
 * Générer le bon de chargement signé
 */
router.get('/:orderId/loading-note', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { orderId } = req.params;
    const { signatureId } = req.query;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!signatureId) {
      return res.status(400).json({ error: 'signatureId is required' });
    }

    const loadingNote = await signatureService.generateSignedLoadingNote(
      orderId,
      signatureId as string
    );

    res.json({
      success: true,
      loadingNote
    });
  } catch (error: any) {
    console.error('Error generating loading note:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

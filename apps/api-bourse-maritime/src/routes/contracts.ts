import { Router, Response } from 'express';
import Contract from '../models/Contract';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// List contracts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {
      $or: [
        { 'shipper.companyId': req.user?.companyId },
        { 'carrier.companyId': req.user?.companyId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('freightRequestId')
        .populate('bidId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Contract.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contracts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('freightRequestId')
      .populate('bidId');

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Check authorization
    if (
      contract.shipper.companyId !== req.user?.companyId &&
      contract.carrier.companyId !== req.user?.companyId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this contract'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Sign contract
router.post('/:id/sign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Check authorization
    const isShipper = contract.shipper.companyId === req.user?.companyId;
    const isCarrier = contract.carrier.companyId === req.user?.companyId;

    if (!isShipper && !isCarrier) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to sign this contract'
      });
    }

    // Check contract status
    if (contract.status !== 'pendingSignatures' && contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Contract is not in a valid state for signing'
      });
    }

    const signatureData = {
      signedAt: new Date(),
      signedBy: req.user?.email,
      signature: req.body.signature,
      ipAddress: req.ip
    };

    if (isShipper) {
      if (contract.signatures.shipper.signedAt) {
        return res.status(400).json({
          success: false,
          error: 'Shipper has already signed this contract'
        });
      }
      contract.signatures.shipper = signatureData;
    }

    if (isCarrier) {
      if (contract.signatures.carrier.signedAt) {
        return res.status(400).json({
          success: false,
          error: 'Carrier has already signed this contract'
        });
      }
      contract.signatures.carrier = signatureData;
    }

    // Check if both parties have signed
    if (contract.signatures.shipper.signedAt && contract.signatures.carrier.signedAt) {
      contract.status = 'active';
    }

    await contract.save();

    res.json({
      success: true,
      data: contract,
      message: 'Contract signed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract documents
router.get('/:id/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Check authorization
    if (
      contract.shipper.companyId !== req.user?.companyId &&
      contract.carrier.companyId !== req.user?.companyId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view contract documents'
      });
    }

    res.json({
      success: true,
      data: contract.documents
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Upload contract document
router.post('/:id/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Check authorization
    if (
      contract.shipper.companyId !== req.user?.companyId &&
      contract.carrier.companyId !== req.user?.companyId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload documents to this contract'
      });
    }

    const document = {
      type: req.body.type,
      name: req.body.name,
      url: req.body.url,
      uploadedAt: new Date(),
      uploadedBy: req.user?.email
    };

    contract.documents.push(document);
    await contract.save();

    res.json({
      success: true,
      data: contract,
      message: 'Document uploaded successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { CarrierInvoice } from '../models';

const router = Router();

// Upload carrier invoice with OCR simulation
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { carrierId, carrierName, fileName, fileUrl, fileSize, mimeType, totalAmount } = req.body;

    const reference = `INV-UP-${Date.now()}-${carrierId.substring(0, 6).toUpperCase()}`;

    // Simulate OCR processing
    const ocrResult = {
      invoiceNumber: `CARR-${Math.floor(Math.random() * 10000)}`,
      invoiceDate: new Date(),
      totalAmount: totalAmount || Math.floor(Math.random() * 50000) + 5000,
      tva: (totalAmount || 10000) * 0.2,
      carrier: {
        name: carrierName,
        siret: `${Math.floor(Math.random() * 100000000000000)}`,
        address: '123 Rue du Transport, 75001 Paris'
      },
      client: {
        name: 'RT Logistics',
        siret: '12345678901234'
      },
      lines: [
        {
          description: 'Transport de marchandises',
          quantity: 1,
          unitPrice: totalAmount || 10000,
          total: totalAmount || 10000
        }
      ],
      confidence: 0.85 + Math.random() * 0.1,
      rawText: 'Simulated OCR text...'
    };

    const invoice = new CarrierInvoice({
      reference,
      carrier: {
        id: carrierId,
        name: carrierName
      },
      uploadDate: new Date(),
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      ocrResult,
      ocrStatus: 'completed',
      validation: {
        status: 'pending'
      },
      matching: {},
      totalAmount: ocrResult.totalAmount,
      uploadedBy: req.body.userId || 'system'
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get invoice validation status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const invoice = await CarrierInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: {
        reference: invoice.reference,
        ocrStatus: invoice.ocrStatus,
        validationStatus: invoice.validation.status,
        matchingScore: invoice.matching.matchScore,
        discrepancies: invoice.matching.discrepancies
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate invoice
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { action, reason, userId } = req.body;
    const invoice = await CarrierInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (action === 'approve') {
      invoice.validation.status = 'validated';
      invoice.validation.validatedBy = userId || 'system';
      invoice.validation.validatedAt = new Date();
    } else if (action === 'reject') {
      invoice.validation.status = 'rejected';
      invoice.validation.validatedBy = userId || 'system';
      invoice.validation.validatedAt = new Date();
      invoice.validation.rejectionReason = reason;
    }

    await invoice.save();

    res.json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { CarrierVigilance } from '../models';

const router = Router();

// Get carrier vigilance documents
router.get('/:transporterId', async (req: Request, res: Response) => {
  try {
    const vigilance = await CarrierVigilance.findOne({
      'carrier.id': req.params.transporterId
    });

    if (!vigilance) {
      return res.status(404).json({
        success: false,
        error: 'Carrier vigilance not found'
      });
    }

    res.json({
      success: true,
      data: vigilance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create or upload vigilance document
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      carrierId,
      carrierName,
      carrierSiret,
      document,
      userId
    } = req.body;

    let vigilance = await CarrierVigilance.findOne({ 'carrier.id': carrierId });

    const newDoc = {
      type: document.type,
      documentName: document.documentName,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: 'valid',
      verificationStatus: 'pending',
      alertDays: document.alertDays || 30,
      metadata: document.metadata || {},
      uploadedAt: new Date(),
      uploadedBy: userId || 'system'
    };

    // Check if expiring soon (within alert days)
    if (document.expiryDate) {
      const daysUntilExpiry = Math.floor(
        (new Date(document.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        newDoc.status = 'expired';
      } else if (daysUntilExpiry <= (document.alertDays || 30)) {
        newDoc.status = 'expiring_soon';
      }
    }

    if (!vigilance) {
      // Create new vigilance record
      vigilance = new CarrierVigilance({
        carrier: {
          id: carrierId,
          name: carrierName,
          siret: carrierSiret
        },
        documents: [newDoc],
        overallStatus: 'warning',
        compliance: {
          hasURSSAF: document.type === 'urssaf',
          hasAssurance: document.type === 'assurance',
          hasLicence: document.type === 'licence',
          hasKBIS: document.type === 'kbis',
          allValid: false,
          expiringCount: newDoc.status === 'expiring_soon' ? 1 : 0,
          expiredCount: newDoc.status === 'expired' ? 1 : 0,
          missingCount: 0
        },
        alerts: [],
        billingRestrictions: {
          isBlocked: false
        }
      });
    } else {
      // Add document to existing vigilance
      vigilance.documents.push(newDoc as any);

      // Update compliance
      if (document.type === 'urssaf') vigilance.compliance.hasURSSAF = true;
      if (document.type === 'assurance') vigilance.compliance.hasAssurance = true;
      if (document.type === 'licence') vigilance.compliance.hasLicence = true;
      if (document.type === 'kbis') vigilance.compliance.hasKBIS = true;

      // Recalculate counts
      vigilance.compliance.expiringCount = vigilance.documents.filter(d => d.status === 'expiring_soon').length;
      vigilance.compliance.expiredCount = vigilance.documents.filter(d => d.status === 'expired').length;
    }

    // Update overall status
    const allRequired = vigilance.compliance.hasURSSAF &&
                        vigilance.compliance.hasAssurance &&
                        vigilance.compliance.hasLicence &&
                        vigilance.compliance.hasKBIS;

    const allValid = vigilance.documents.every(d => d.status === 'valid');

    vigilance.compliance.allValid = allValid;

    if (allRequired && allValid) {
      vigilance.overallStatus = 'compliant';
    } else if (vigilance.compliance.expiredCount > 0) {
      vigilance.overallStatus = 'non_compliant';
    } else {
      vigilance.overallStatus = 'warning';
    }

    // Add alert if needed
    if (newDoc.status === 'expired' || newDoc.status === 'expiring_soon') {
      vigilance.alerts.push({
        type: newDoc.status === 'expired' ? 'document_expired' : 'document_expiring',
        severity: newDoc.status === 'expired' ? 'critical' : 'high',
        message: `Document ${document.type} is ${newDoc.status}`,
        documentType: document.type,
        expiryDate: document.expiryDate,
        createdAt: new Date()
      });
    }

    await vigilance.save();

    res.status(201).json({
      success: true,
      data: vigilance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update vigilance document
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { documentId, updates, userId } = req.body;

    const vigilance = await CarrierVigilance.findById(req.params.id);

    if (!vigilance) {
      return res.status(404).json({
        success: false,
        error: 'Vigilance record not found'
      });
    }

    const doc = vigilance.documents.find((d: any) => d._id.toString() === documentId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update document fields
    Object.assign(doc, updates);

    // Update verification if provided
    if (updates.verificationStatus) {
      doc.verifiedBy = userId;
      doc.verifiedAt = new Date();
    }

    await vigilance.save();

    res.json({
      success: true,
      data: vigilance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

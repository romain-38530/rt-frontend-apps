/**
 * Routes: Vigilance
 * Vérification conformité transporteur - Devoir de vigilance
 */

import { Router, Request, Response } from 'express';
import VigilanceCheck from '../models/VigilanceCheck';
import { getEventEmitter } from '../modules/events';

const router = Router();

/**
 * POST /check - Vérifier la conformité d'un transporteur
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const {
      carrierId,
      carrierName,
      checks = ['kbis', 'urssaf', 'insurance', 'license', 'identity', 'rib', 'incidents', 'blacklist'],
      sessionId,
      forceRefresh = false
    } = req.body;

    // Chercher une vérification existante
    let vigilance = await VigilanceCheck.findOne({ carrierId });

    // Si pas de vérification ou force refresh, créer/mettre à jour
    if (!vigilance || forceRefresh) {
      if (!vigilance) {
        vigilance = new VigilanceCheck({
          carrierId,
          carrierName,
          overallStatus: 'pending',
          complianceScore: 0,
          checks: {
            kbis: { status: 'missing', verified: false },
            urssaf: { status: 'missing', verified: false },
            insurance: { status: 'missing', coverage: 0, minRequired: 100000, verified: false },
            license: { status: 'missing', verified: false },
            identity: { status: 'missing', verified: false },
            rib: { status: 'missing', matchesCompany: false, verified: false },
            incidents: { totalIncidents: 0, unresolvedIncidents: 0, severeIncidents: 0, status: 'clean' }
          },
          rejectionReasons: [],
          alerts: []
        });
      }

      // Simuler une vérification (en prod: appel API InfoGreffe, URSSAF, etc.)
      const simulateCheck = () => {
        const random = Math.random();
        if (random > 0.9) return 'expired';
        if (random > 0.8) return 'expiring_soon';
        if (random > 0.7) return 'missing';
        return 'valid';
      };

      // KBIS
      if (checks.includes('kbis')) {
        const status = simulateCheck();
        vigilance.checks.kbis = {
          status,
          verified: status === 'valid',
          verifiedAt: status === 'valid' ? new Date() : undefined,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 jours
          daysUntilExpiry: 90
        };
      }

      // URSSAF
      if (checks.includes('urssaf')) {
        const status = simulateCheck();
        vigilance.checks.urssaf = {
          status,
          verified: status === 'valid',
          verifiedAt: status === 'valid' ? new Date() : undefined,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          daysUntilExpiry: 180
        };
      }

      // Assurance
      if (checks.includes('insurance')) {
        const status = simulateCheck();
        const coverage = Math.floor(Math.random() * 400000) + 100000;
        vigilance.checks.insurance = {
          status: coverage < 100000 ? 'insufficient' : status,
          coverage,
          minRequired: 100000,
          verified: status === 'valid' && coverage >= 100000,
          provider: 'AXA',
          policyNumber: `POL-${Math.random().toString(36).substr(2, 9)}`,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          daysUntilExpiry: 365
        };
      }

      // Licence
      if (checks.includes('license')) {
        const status = simulateCheck();
        vigilance.checks.license = {
          status,
          verified: status === 'valid',
          licenseNumber: `LIC-${Math.random().toString(36).substr(2, 9)}`,
          expiresAt: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 ans
          daysUntilExpiry: 730
        };
      }

      // Identité
      if (checks.includes('identity')) {
        const status = Math.random() > 0.1 ? 'valid' : 'missing';
        vigilance.checks.identity = {
          status,
          verified: status === 'valid',
          verifiedAt: status === 'valid' ? new Date() : undefined
        };
      }

      // RIB
      if (checks.includes('rib')) {
        const valid = Math.random() > 0.1;
        vigilance.checks.rib = {
          status: valid ? 'valid' : 'missing',
          iban: valid ? 'FR76****1234' : undefined,
          bic: valid ? 'BNPAFRPP' : undefined,
          bankName: valid ? 'BNP Paribas' : undefined,
          holderName: valid ? carrierName : undefined,
          matchesCompany: valid,
          verified: valid
        };
      }

      // Incidents
      if (checks.includes('incidents') || checks.includes('blacklist')) {
        const totalIncidents = Math.floor(Math.random() * 5);
        const unresolvedIncidents = Math.floor(Math.random() * totalIncidents);
        vigilance.checks.incidents = {
          totalIncidents,
          unresolvedIncidents,
          severeIncidents: Math.floor(Math.random() * unresolvedIncidents),
          lastIncidentAt: totalIncidents > 0 ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
          status: unresolvedIncidents > 2 ? 'blocked' : unresolvedIncidents > 0 ? 'warning' : 'clean'
        };
      }

      vigilance.lastCheckedAt = new Date();
      vigilance.nextCheckDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours

      // Calculer le score et le statut
      (vigilance as any).calculateComplianceScore();
      (vigilance as any).updateOverallStatus();

      // Générer des alertes
      vigilance.alerts = [];
      if (vigilance.checks.kbis.daysUntilExpiry && vigilance.checks.kbis.daysUntilExpiry <= 30) {
        vigilance.alerts.push({
          id: `alert-${Date.now()}-kbis`,
          type: vigilance.checks.kbis.daysUntilExpiry <= 7 ? 'expiry_j7' :
                vigilance.checks.kbis.daysUntilExpiry <= 15 ? 'expiry_j15' : 'expiry_j30',
          message: `KBIS expire dans ${vigilance.checks.kbis.daysUntilExpiry} jours`,
          severity: vigilance.checks.kbis.daysUntilExpiry <= 7 ? 'critical' : 'warning',
          documentType: 'kbis',
          createdAt: new Date()
        });
      }

      await vigilance.save();
    }

    // Si non conforme et session fournie, émettre événement
    if (sessionId && vigilance.overallStatus !== 'compliant') {
      const eventEmitter = getEventEmitter();
      eventEmitter.emitCarrierRejectedVigilance(
        sessionId,
        carrierId,
        carrierName,
        vigilance.rejectionReasons,
        vigilance.complianceScore
      );
    }

    res.json({
      carrierId,
      carrierName,
      overallStatus: vigilance.overallStatus,
      complianceScore: vigilance.complianceScore,
      checks: vigilance.checks,
      rejectionReasons: vigilance.rejectionReasons,
      alerts: vigilance.alerts,
      lastCheckedAt: vigilance.lastCheckedAt,
      nextCheckDue: vigilance.nextCheckDue,
      canBeAssigned: vigilance.overallStatus === 'compliant' || vigilance.overallStatus === 'warning'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:carrierId - Statut de vigilance d'un transporteur
 */
router.get('/:carrierId', async (req: Request, res: Response) => {
  try {
    const vigilance = await VigilanceCheck.findOne({ carrierId: req.params.carrierId });

    if (!vigilance) {
      return res.status(404).json({
        error: 'Aucune vérification de vigilance trouvée',
        recommendation: 'Effectuer une vérification avec POST /vigilance/check'
      });
    }

    res.json(vigilance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /:carrierId/document - Soumettre un document de vigilance
 */
router.post('/:carrierId/document', async (req: Request, res: Response) => {
  try {
    const { documentType, documentId, expiresAt } = req.body;

    let vigilance = await VigilanceCheck.findOne({ carrierId: req.params.carrierId });

    if (!vigilance) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    // Mettre à jour le document
    const docKey = documentType as keyof typeof vigilance.checks;
    if (vigilance.checks[docKey]) {
      (vigilance.checks[docKey] as any).status = 'valid';
      (vigilance.checks[docKey] as any).documentId = documentId;
      (vigilance.checks[docKey] as any).verified = true;
      (vigilance.checks[docKey] as any).verifiedAt = new Date();
      if (expiresAt) {
        (vigilance.checks[docKey] as any).expiresAt = new Date(expiresAt);
        const daysUntil = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        (vigilance.checks[docKey] as any).daysUntilExpiry = daysUntil;
      }
    }

    // Recalculer
    (vigilance as any).calculateComplianceScore();
    (vigilance as any).updateOverallStatus();
    await vigilance.save();

    res.json({
      success: true,
      documentType,
      newStatus: 'valid',
      complianceScore: vigilance.complianceScore,
      overallStatus: vigilance.overallStatus
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /alerts/pending - Alertes en attente
 */
router.get('/alerts/pending', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;

    const vigilances = await VigilanceCheck.find({
      'alerts.acknowledgedAt': { $exists: false }
    });

    const pendingAlerts: any[] = [];
    vigilances.forEach(v => {
      v.alerts.filter(a => !a.acknowledgedAt).forEach(alert => {
        pendingAlerts.push({
          ...alert,
          carrierId: v.carrierId,
          carrierName: v.carrierName
        });
      });
    });

    // Trier par sévérité
    pendingAlerts.sort((a, b) => {
      const severity = { critical: 0, warning: 1, info: 2 };
      return (severity[a.severity as keyof typeof severity] || 2) -
             (severity[b.severity as keyof typeof severity] || 2);
    });

    res.json(pendingAlerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

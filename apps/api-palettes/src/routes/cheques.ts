import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PalletCheque, { ChequeStatus, PalletType } from '../models/PalletCheque';
import PalletLedger from '../models/PalletLedger';
import PalletSite from '../models/PalletSite';
import { signCheque, verifyChequeSignature } from '../services/crypto';
import { generateChequeQRCode, generateSimpleQRCode } from '../services/qrcode';
import { validateGeofence } from '../services/geofencing';

const router = Router();

// GET /cheques - Liste tous les chèques (avec filtres)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      transporterId,
      companyId,
      siteId,
      status,
      limit = 50,
      offset = 0,
    } = req.query;

    const filter: any = {};
    if (transporterId) filter.fromCompanyId = transporterId;
    if (companyId) filter.$or = [{ fromCompanyId: companyId }, { toSiteId: companyId }];
    if (siteId) filter.toSiteId = siteId;
    if (status) filter.status = status;

    const cheques = await PalletCheque.find(filter)
      .sort({ 'timestamps.emittedAt': -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await PalletCheque.countDocuments(filter);

    res.json({
      data: cheques,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cheques/:chequeId - Détails d'un chèque
router.get('/:chequeId', async (req: Request, res: Response) => {
  try {
    const cheque = await PalletCheque.findOne({ chequeId: req.params.chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }
    res.json(cheque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cheques - Créer un nouveau chèque
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      fromCompanyId,
      fromCompanyName,
      toSiteId,
      toSiteName,
      quantity,
      palletType,
      vehiclePlate,
      driverName,
      matchingInfo,
    } = req.body;

    // Validation
    if (!fromCompanyId || !toSiteId || !quantity || !palletType) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    // Vérifier que le site existe et est actif
    const site = await PalletSite.findOne({ siteId: toSiteId, active: true });
    if (!site) {
      return res.status(404).json({ error: 'Site de restitution non trouvé ou inactif' });
    }

    // Générer l'ID unique
    const chequeId = `CHQ-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const timestamp = new Date();

    // Signer le chèque
    const cryptoSignature = signCheque({
      chequeId,
      fromCompanyId,
      toSiteId,
      quantity,
      palletType,
      timestamp,
    });

    // Générer le QR code
    const qrCode = await generateChequeQRCode({
      chequeId,
      fromCompanyId,
      toSiteId,
      quantity,
      palletType,
      signature: cryptoSignature,
    });

    // Créer le chèque
    const cheque = await PalletCheque.create({
      chequeId,
      qrCode,
      orderId,
      fromCompanyId,
      fromCompanyName: fromCompanyName || 'Entreprise',
      toSiteId,
      toSiteName: toSiteName || site.siteName,
      quantity,
      palletType,
      status: 'EMIS',
      vehiclePlate,
      driverName,
      timestamps: {
        emittedAt: timestamp,
      },
      cryptoSignature,
      matchingInfo,
    });

    // Mettre à jour le ledger (crédit pour l'émetteur)
    await updateLedger(fromCompanyId, fromCompanyName || 'Entreprise', palletType, -quantity, 'Émission chèque', chequeId);

    res.status(201).json(cheque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cheques/:chequeId/deposit - Enregistrer un dépôt
router.post('/:chequeId/deposit', async (req: Request, res: Response) => {
  try {
    const { chequeId } = req.params;
    const { geolocation, signature, photos } = req.body;

    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }

    if (cheque.status !== 'EMIS' && cheque.status !== 'EN_TRANSIT') {
      return res.status(400).json({ error: `Impossible de déposer un chèque en statut ${cheque.status}` });
    }

    // Valider la géolocalisation si fournie
    if (geolocation) {
      const site = await PalletSite.findOne({ siteId: cheque.toSiteId });
      if (site && site.geofencing.strictMode) {
        const geoResult = validateGeofence(
          { latitude: geolocation.lat, longitude: geolocation.lng },
          { latitude: site.address.coordinates.latitude, longitude: site.address.coordinates.longitude },
          site.geofencing.radius
        );
        if (!geoResult.isValid) {
          return res.status(400).json({ error: geoResult.message });
        }
      }
    }

    // Mettre à jour le chèque
    cheque.status = 'DEPOSE';
    cheque.timestamps.depositedAt = new Date();
    if (geolocation) {
      cheque.geolocations.deposit = geolocation;
    }
    if (signature) {
      cheque.signatures.transporter = signature;
    }
    if (photos && photos.length > 0) {
      cheque.photos.push(...photos.map((url: string) => ({
        type: 'deposit',
        url,
        at: new Date(),
      })));
    }

    await cheque.save();

    res.json(cheque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cheques/:chequeId/receive - Réceptionner un chèque
router.post('/:chequeId/receive', async (req: Request, res: Response) => {
  try {
    const { chequeId } = req.params;
    const { quantityReceived, geolocation, signature, receiverId, receiverName } = req.body;

    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }

    if (cheque.status !== 'DEPOSE') {
      return res.status(400).json({ error: `Impossible de réceptionner un chèque en statut ${cheque.status}` });
    }

    // Valider la géolocalisation si fournie
    if (geolocation) {
      const site = await PalletSite.findOne({ siteId: cheque.toSiteId });
      if (site && site.geofencing.strictMode) {
        const geoResult = validateGeofence(
          { latitude: geolocation.lat, longitude: geolocation.lng },
          { latitude: site.address.coordinates.latitude, longitude: site.address.coordinates.longitude },
          site.geofencing.radius
        );
        if (!geoResult.isValid) {
          return res.status(400).json({ error: geoResult.message });
        }
      }
    }

    const qty = quantityReceived ?? cheque.quantity;

    // Mettre à jour le chèque
    cheque.status = qty === cheque.quantity ? 'RECU' : 'LITIGE';
    cheque.quantityReceived = qty;
    cheque.timestamps.receivedAt = new Date();
    if (geolocation) {
      cheque.geolocations.receipt = geolocation;
    }
    if (signature) {
      cheque.signatures.receiver = signature;
    }

    await cheque.save();

    // Mettre à jour le quota du site
    const site = await PalletSite.findOne({ siteId: cheque.toSiteId });
    if (site) {
      site.quota.currentDaily += qty;
      site.quota.currentWeekly += qty;
      site.stats.totalReceived += qty;
      await site.save();
    }

    // Mettre à jour le ledger du site/réceptionnaire
    if (receiverId) {
      await updateLedger(receiverId, receiverName || 'Réceptionnaire', cheque.palletType, qty, 'Réception chèque', chequeId);
    }

    res.json(cheque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cheques/:chequeId/cancel - Annuler un chèque
router.post('/:chequeId/cancel', async (req: Request, res: Response) => {
  try {
    const { chequeId } = req.params;
    const { reason } = req.body;

    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }

    if (cheque.status !== 'EMIS') {
      return res.status(400).json({ error: 'Seuls les chèques émis peuvent être annulés' });
    }

    cheque.status = 'ANNULE';
    await cheque.save();

    // Reverser le ledger
    await updateLedger(cheque.fromCompanyId, cheque.fromCompanyName, cheque.palletType, cheque.quantity, `Annulation: ${reason || 'Non spécifié'}`, chequeId);

    res.json(cheque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cheques/:chequeId/verify - Vérifier la signature d'un chèque
router.get('/:chequeId/verify', async (req: Request, res: Response) => {
  try {
    const cheque = await PalletCheque.findOne({ chequeId: req.params.chequeId });
    if (!cheque) {
      return res.status(404).json({ error: 'Chèque non trouvé' });
    }

    const isValid = verifyChequeSignature(
      {
        chequeId: cheque.chequeId,
        fromCompanyId: cheque.fromCompanyId,
        toSiteId: cheque.toSiteId,
        quantity: cheque.quantity,
        palletType: cheque.palletType,
        timestamp: cheque.timestamps.emittedAt,
      },
      cheque.cryptoSignature
    );

    res.json({
      chequeId: cheque.chequeId,
      isValid,
      status: cheque.status,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fonction utilitaire pour mettre à jour le ledger
async function updateLedger(
  companyId: string,
  companyName: string,
  palletType: PalletType,
  delta: number,
  reason: string,
  chequeId: string
) {
  let ledger = await PalletLedger.findOne({ companyId });

  if (!ledger) {
    ledger = await PalletLedger.create({
      companyId,
      companyName,
      companyType: 'transporteur',
      balance: 0,
      balances: {
        EURO_EPAL: 0,
        EURO_EPAL_2: 0,
        DEMI_PALETTE: 0,
        PALETTE_PERDUE: 0,
      },
      history: [],
    });
  }

  ledger.balances[palletType] += delta;
  const newBalance = ledger.balances[palletType];

  ledger.history.push({
    date: new Date(),
    delta,
    reason,
    chequeId,
    newBalance,
    palletType,
  });

  // Garder seulement les 100 dernières entrées
  if (ledger.history.length > 100) {
    ledger.history = ledger.history.slice(-100);
  }

  await ledger.save();
}

export default router;

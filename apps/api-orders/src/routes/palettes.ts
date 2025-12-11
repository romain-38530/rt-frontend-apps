/**
 * Routes Palettes - API de gestion des palettes Europe
 */
import { Router, Request, Response } from 'express';
import PaletteService from '../services/palette-service';

const router = Router();

router.get('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const result = await PaletteService.getPalletStatus(orderId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:orderId/pickup', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { quantity, palletType, givenBySender, takenByCarrier, senderId, senderName, senderType, carrierId, carrierName, confirmedBy, vehiclePlate, driverName, photos, signature, notes } = req.body;

    if (!quantity || !palletType || givenBySender === undefined || takenByCarrier === undefined) {
      return res.status(400).json({ success: false, error: 'quantity, palletType, givenBySender et takenByCarrier sont requis' });
    }
    if (!senderId || !senderName || !carrierId || !carrierName || !confirmedBy) {
      return res.status(400).json({ success: false, error: 'senderId, senderName, carrierId, carrierName et confirmedBy sont requis' });
    }

    const result = await PaletteService.confirmPickupExchange(orderId, {
      quantity, palletType, givenBySender, takenByCarrier, senderId, senderName, senderType: senderType || 'industriel', carrierId, carrierName, confirmedBy, vehiclePlate, driverName, photos, signature, notes
    });

    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:orderId/delivery', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { quantity, palletType, givenByCarrier, receivedByRecipient, carrierId, carrierName, recipientId, recipientName, recipientType, confirmedBy, photos, signature, notes } = req.body;

    if (!quantity || !palletType || givenByCarrier === undefined || receivedByRecipient === undefined) {
      return res.status(400).json({ success: false, error: 'quantity, palletType, givenByCarrier et receivedByRecipient sont requis' });
    }
    if (!carrierId || !carrierName || !recipientId || !recipientName || !confirmedBy) {
      return res.status(400).json({ success: false, error: 'carrierId, carrierName, recipientId, recipientName et confirmedBy sont requis' });
    }

    const result = await PaletteService.confirmDeliveryExchange(orderId, {
      quantity, palletType, givenByCarrier, receivedByRecipient, carrierId, carrierName, recipientId, recipientName, recipientType: recipientType || 'industriel', confirmedBy, photos, signature, notes
    });

    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/company/:companyId/balance', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const result = await PaletteService.getCompanyBalance(companyId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

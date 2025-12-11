/**
 * Service Palette - Integration avec api-palettes
 */
import Order from '../models/Order';
import EventService from './event-service';

const PALETTES_API = process.env.PALETTES_API_URL || 'http://rt-palettes-circular-prod.eba-mqjpbjmp.eu-central-1.elasticbeanstalk.com/api/v1';

export type PalletType = 'EURO_EPAL' | 'EURO_EPAL_2' | 'DEMI_PALETTE' | 'PALETTE_PERDUE';

class PaletteService {
  static async confirmPickupExchange(orderId: string, params: any) {
    try {
      const order = await Order.findOne({ orderId });
      if (!order) return { success: false, error: 'Commande non trouvee' };

      let chequeId: string | undefined;
      try {
        const res = await fetch(PALETTES_API + '/palette/cheques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            fromCompanyId: params.senderId,
            fromCompanyName: params.senderName,
            toSiteId: params.carrierId,
            toSiteName: params.carrierName,
            quantity: params.givenBySender,
            palletType: params.palletType
          })
        });
        if (res.ok) chequeId = ((await res.json()) as { chequeId: string }).chequeId;
      } catch (e) { console.error('[PaletteService] cheque error:', e); }

      await this.updateLedger(params.senderId, params.senderName, params.senderType, params.palletType, -params.givenBySender, 'Chargement ' + order.reference);
      await this.updateLedger(params.carrierId, params.carrierName, 'transporteur', params.palletType, params.takenByCarrier, 'Chargement ' + order.reference);

      (order as any).palletTracking = {
        enabled: true,
        palletType: params.palletType,
        expectedQuantity: params.quantity,
        pickup: { quantity: params.quantity, palletType: params.palletType, givenBySender: params.givenBySender, takenByCarrier: params.takenByCarrier, chequeId, confirmedAt: new Date(), confirmedBy: params.confirmedBy },
        balance: params.takenByCarrier - params.givenBySender,
        settled: false
      };
      await order.save();

      await EventService.createEvent({ orderId, orderReference: order.reference, eventType: 'pallet.pickup.confirmed', source: 'carrier', data: { action: 'pallet_pickup_confirmed', chequeId } });

      return { success: true, chequeId, balance: params.takenByCarrier - params.givenBySender };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async confirmDeliveryExchange(orderId: string, params: any) {
    try {
      const order = await Order.findOne({ orderId });
      if (!order) return { success: false, error: 'Commande non trouvee' };

      const tracking = (order as any).palletTracking;
      if (!tracking || !tracking.enabled) return { success: false, error: 'Suivi palettes non active' };

      if (tracking.pickup && tracking.pickup.chequeId) {
        try {
          await fetch(PALETTES_API + '/palette/cheques/' + tracking.pickup.chequeId + '/receive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantityReceived: params.receivedByRecipient })
          });
        } catch (e) { console.error('[PaletteService] receive error:', e); }
      }

      await this.updateLedger(params.carrierId, params.carrierName, 'transporteur', params.palletType, -params.givenByCarrier, 'Livraison ' + order.reference);
      await this.updateLedger(params.recipientId, params.recipientName, params.recipientType, params.palletType, params.receivedByRecipient, 'Livraison ' + order.reference);

      const pickupTaken = tracking.pickup ? tracking.pickup.takenByCarrier || 0 : 0;
      const pickupGiven = tracking.pickup ? tracking.pickup.givenBySender || 0 : 0;
      const pickupBalance = pickupTaken - pickupGiven;
      const deliveryBalance = params.receivedByRecipient - params.givenByCarrier;
      const finalBalance = pickupBalance + deliveryBalance;

      tracking.delivery = { quantity: params.quantity, palletType: params.palletType, givenByCarrier: params.givenByCarrier, receivedByRecipient: params.receivedByRecipient, status: finalBalance === 0 ? 'confirmed' : 'disputed', confirmedAt: new Date(), confirmedBy: params.confirmedBy };
      tracking.balance = finalBalance;
      tracking.settled = finalBalance === 0;
      if (tracking.settled) tracking.settledAt = new Date();
      await order.save();

      await EventService.createEvent({ orderId, orderReference: order.reference, eventType: 'pallet.delivery.confirmed', source: 'recipient', data: { action: 'pallet_delivery_confirmed', balance: finalBalance } });

      return { success: true, balance: finalBalance };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static async updateLedger(companyId: string, companyName: string, companyType: string, palletType: string, delta: number, reason: string) {
    try {
      const check = await fetch(PALETTES_API + '/palette/ledger/' + companyId);
      if (check.status === 404) {
        await fetch(PALETTES_API + '/palette/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, companyName, companyType: companyType === 'transporteur' ? 'transporteur' : companyType === 'logisticien' ? 'logisticien' : 'industriel' })
        });
      }
      await fetch(PALETTES_API + '/palette/ledger/' + companyId + '/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palletType, delta, reason, adminId: 'system-orders' })
      });
    } catch (e) { console.error('[PaletteService] ledger error:', e); }
  }

  static async getPalletStatus(orderId: string) {
    try {
      const order = await Order.findOne({ orderId });
      if (!order) return { success: false, error: 'Commande non trouvee' };
      return { success: true, tracking: (order as any).palletTracking || { enabled: false } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCompanyBalance(companyId: string) {
    try {
      const res = await fetch(PALETTES_API + '/palette/ledger/' + companyId);
      if (!res.ok) return { success: false, error: 'Ledger non trouve' };
      return { success: true, ledger: await res.json() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default PaletteService;

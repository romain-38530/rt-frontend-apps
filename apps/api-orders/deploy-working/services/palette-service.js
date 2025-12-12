"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service Palette - Integration avec api-palettes
 */
const Order_1 = __importDefault(require("../models/Order"));
const event_service_1 = __importDefault(require("./event-service"));
const PALETTES_API = process.env.PALETTES_API_URL || 'http://rt-palettes-circular-prod.eba-mqjpbjmp.eu-central-1.elasticbeanstalk.com/api/v1';
class PaletteService {
    static async confirmPickupExchange(orderId, params) {
        try {
            const order = await Order_1.default.findOne({ orderId });
            if (!order)
                return { success: false, error: 'Commande non trouvee' };
            let chequeId;
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
                if (res.ok)
                    chequeId = (await res.json()).chequeId;
            }
            catch (e) {
                console.error('[PaletteService] cheque error:', e);
            }
            await this.updateLedger(params.senderId, params.senderName, params.senderType, params.palletType, -params.givenBySender, 'Chargement ' + order.reference);
            await this.updateLedger(params.carrierId, params.carrierName, 'transporteur', params.palletType, params.takenByCarrier, 'Chargement ' + order.reference);
            order.palletTracking = {
                enabled: true,
                palletType: params.palletType,
                expectedQuantity: params.quantity,
                pickup: { quantity: params.quantity, palletType: params.palletType, givenBySender: params.givenBySender, takenByCarrier: params.takenByCarrier, chequeId, confirmedAt: new Date(), confirmedBy: params.confirmedBy },
                balance: params.takenByCarrier - params.givenBySender,
                settled: false
            };
            await order.save();
            // Event creation non-blocking
            try {
                await event_service_1.default.createEvent({ orderId, orderReference: order.reference, eventType: 'pallet.pickup.confirmed', source: 'carrier', data: { action: 'pallet_pickup_confirmed', chequeId } });
            }
            catch (e) {
                console.error('[PaletteService] event error:', e);
            }
            return { success: true, chequeId, balance: params.takenByCarrier - params.givenBySender };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    static async confirmDeliveryExchange(orderId, params) {
        try {
            const order = await Order_1.default.findOne({ orderId });
            if (!order)
                return { success: false, error: 'Commande non trouvee' };
            const tracking = order.palletTracking;
            if (!tracking || !tracking.enabled)
                return { success: false, error: 'Suivi palettes non active' };
            if (tracking.pickup && tracking.pickup.chequeId) {
                try {
                    await fetch(PALETTES_API + '/palette/cheques/' + tracking.pickup.chequeId + '/receive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantityReceived: params.receivedByRecipient })
                    });
                }
                catch (e) {
                    console.error('[PaletteService] receive error:', e);
                }
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
            if (tracking.settled)
                tracking.settledAt = new Date();
            await order.save();
            // Event creation non-blocking
            try {
                await event_service_1.default.createEvent({ orderId, orderReference: order.reference, eventType: 'pallet.delivery.confirmed', source: 'recipient', data: { action: 'pallet_delivery_confirmed', balance: finalBalance } });
            }
            catch (e) {
                console.error('[PaletteService] event error:', e);
            }
            return { success: true, balance: finalBalance };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    static async updateLedger(companyId, companyName, companyType, palletType, delta, reason) {
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
        }
        catch (e) {
            console.error('[PaletteService] ledger error:', e);
        }
    }
    static async getPalletStatus(orderId) {
        try {
            const order = await Order_1.default.findOne({ orderId });
            if (!order)
                return { success: false, error: 'Commande non trouvee' };
            return { success: true, tracking: order.palletTracking || { enabled: false } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    static async getCompanyBalance(companyId) {
        try {
            const res = await fetch(PALETTES_API + '/palette/ledger/' + companyId);
            if (!res.ok)
                return { success: false, error: 'Ledger non trouve' };
            return { success: true, ledger: await res.json() };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.default = PaletteService;
//# sourceMappingURL=palette-service.js.map
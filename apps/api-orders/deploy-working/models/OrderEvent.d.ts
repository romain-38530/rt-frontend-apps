/**
 * Modèle OrderEvent - Système événementiel SYMPHONI.A
 * Trace tous les événements du cycle de vie d'une commande
 */
import mongoose, { Document } from 'mongoose';
export type OrderEventType = 'order.created' | 'order.updated' | 'order.cancelled' | 'order.lane.detected' | 'dispatch.chain.generated' | 'order.sent.to.carrier' | 'carrier.accepted' | 'carrier.refused' | 'carrier.timeout' | 'order.escalated.to.affretia' | 'affretia.carrier.assigned' | 'tracking.started' | 'tracking.eta.updated' | 'tracking.delay.detected' | 'tracking.position.updated' | 'order.in.transit' | 'order.arrived.pickup' | 'order.loaded' | 'order.arrived.delivery' | 'order.delivered' | 'rdv.requested' | 'rdv.proposed' | 'rdv.confirmed' | 'rdv.cancelled' | 'documents.uploaded' | 'documents.ocr.completed' | 'documents.verified' | 'carrier.scored' | 'order.archived' | 'order.closed';
export interface IOrderEvent extends Document {
    eventId: string;
    orderId: string;
    orderReference: string;
    eventType: OrderEventType;
    timestamp: Date;
    source: 'system' | 'user' | 'carrier' | 'api' | 'erp' | 'affretia' | 'tracking';
    actorId?: string;
    actorType?: 'industrial' | 'carrier' | 'supplier' | 'recipient' | 'system';
    actorName?: string;
    data?: Record<string, any>;
    metadata?: {
        ip?: string;
        userAgent?: string;
        channel?: 'web' | 'mobile' | 'api' | 'email' | 'sms';
    };
    previousStatus?: string;
    newStatus?: string;
    description: string;
}
declare const _default: mongoose.Model<IOrderEvent, {}, {}, {}, mongoose.Document<unknown, {}, IOrderEvent, {}, {}> & IOrderEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=OrderEvent.d.ts.map
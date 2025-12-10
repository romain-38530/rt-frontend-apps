/**
 * Modèle OrderEvent - Système événementiel SYMPHONI.A
 * Trace tous les événements du cycle de vie d'une commande
 */
import mongoose, { Document, Schema } from 'mongoose';

export type OrderEventType =
  // Initialisation
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  // Lane Matching
  | 'order.lane.detected'
  | 'dispatch.chain.generated'
  // Affectation Transporteur
  | 'order.sent.to.carrier'
  | 'carrier.accepted'
  | 'carrier.refused'
  | 'carrier.timeout'
  // Escalade
  | 'order.escalated.to.affretia'
  | 'affretia.carrier.assigned'
  // Tracking
  | 'tracking.started'
  | 'tracking.eta.updated'
  | 'tracking.delay.detected'
  | 'tracking.position.updated'
  | 'tracking.ping.requested'
  // Étapes Transport
  | 'order.in.transit'
  | 'order.arrived.pickup'
  | 'order.loaded'
  | 'order.arrived.delivery'
  | 'order.delivered'
  | 'delivered'
  // RDV
  | 'rdv.requested'
  | 'rdv.proposed'
  | 'rdv.confirmed'
  | 'rdv.cancelled'
  // Documents
  | 'documents.uploaded'
  | 'documents.ocr.completed'
  | 'documents.verified'
  | 'document_uploaded'
  | 'document_validated'
  | 'document_rejected'
  | 'document_signed'
  // Incidents
  | 'incident_reported'
  | 'incident_resolved'
  // Finalisation
  | 'carrier.scored'
  | 'score_calculated'
  | 'order.completed'
  | 'order.archived'
  | 'order.closed';

export interface IOrderEvent extends Document {
  eventId: string;
  orderId: string;
  orderReference: string;
  eventType: OrderEventType;
  timestamp: Date;
  source: 'system' | 'user' | 'carrier' | 'api' | 'erp' | 'affretia' | 'tracking' | 'recipient' | 'supplier' | 'industrial';
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

const OrderEventSchema = new Schema<IOrderEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  orderReference: { type: String, required: true, index: true },
  eventType: {
    type: String,
    required: true,
    enum: [
      'order.created', 'order.updated', 'order.cancelled',
      'order.lane.detected', 'dispatch.chain.generated',
      'order.sent.to.carrier', 'carrier.accepted', 'carrier.refused', 'carrier.timeout',
      'order.escalated.to.affretia', 'affretia.carrier.assigned',
      'tracking.started', 'tracking.eta.updated', 'tracking.delay.detected', 'tracking.position.updated', 'tracking.ping.requested',
      'order.in.transit', 'order.arrived.pickup', 'order.loaded', 'order.arrived.delivery', 'order.delivered', 'delivered',
      'rdv.requested', 'rdv.proposed', 'rdv.confirmed', 'rdv.cancelled',
      'documents.uploaded', 'documents.ocr.completed', 'documents.verified', 'document_uploaded', 'document_validated', 'document_rejected', 'document_signed',
      'incident_reported', 'incident_resolved',
      'carrier.scored', 'score_calculated', 'order.completed', 'order.archived', 'order.closed'
    ],
    index: true
  },
  timestamp: { type: Date, default: Date.now, index: true },
  source: {
    type: String,
    required: true,
    enum: ['system', 'user', 'carrier', 'api', 'erp', 'affretia', 'tracking', 'recipient', 'supplier', 'industrial']
  },
  actorId: String,
  actorType: {
    type: String,
    enum: ['industrial', 'carrier', 'supplier', 'recipient', 'system']
  },
  actorName: String,
  data: { type: Schema.Types.Mixed },
  metadata: {
    ip: String,
    userAgent: String,
    channel: { type: String, enum: ['web', 'mobile', 'api', 'email', 'sms'] }
  },
  previousStatus: String,
  newStatus: String,
  description: { type: String, required: true }
}, { timestamps: true });

// Indexes for efficient queries
OrderEventSchema.index({ orderId: 1, timestamp: -1 });
OrderEventSchema.index({ eventType: 1, timestamp: -1 });
OrderEventSchema.index({ 'data.carrierId': 1, eventType: 1 });

export default mongoose.model<IOrderEvent>('OrderEvent', OrderEventSchema);

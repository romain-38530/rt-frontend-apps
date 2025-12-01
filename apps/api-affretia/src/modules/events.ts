/**
 * Module: Events
 * Système d'événements AFFRET.IA (13 événements)
 */

import { Server as SocketServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Types d'événements
export type AffretEventType =
  | 'affretia.trigger.no-carrier-accepted'
  | 'affretia.trigger.capability-gap'
  | 'affretia.trigger.manual'
  | 'affretia.shortlist.generated'
  | 'affretia.broadcasted.to.market'
  | 'affretia.carrier.responded'
  | 'affretia.best-carrier.selected'
  | 'affretia.order.assigned'
  | 'affretia.tracking.start'
  | 'affretia.carrier.rejected.vigilance'
  | 'affretia.transport.scored'
  | 'affretia.order.closed'
  | 'documents.uploaded';

export interface AffretEvent {
  id: string;
  type: AffretEventType;
  timestamp: string;
  sessionId: string;
  orderId?: string;
  organizationId?: string;
  carrierId?: string;
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    source?: string;
  };
}

class EventEmitter {
  private io: SocketServer | null = null;
  private eventLog: AffretEvent[] = [];
  private maxLogSize = 1000;

  initialize(io: SocketServer) {
    this.io = io;
    console.log('EventEmitter initialized with Socket.io');
  }

  emit(
    type: AffretEventType,
    sessionId: string,
    payload: Record<string, any>,
    options?: {
      orderId?: string;
      organizationId?: string;
      carrierId?: string;
      userId?: string;
    }
  ): AffretEvent {
    const event: AffretEvent = {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      sessionId,
      orderId: options?.orderId,
      organizationId: options?.organizationId,
      carrierId: options?.carrierId,
      payload,
      metadata: {
        userId: options?.userId,
        source: 'api-affretia'
      }
    };

    // Log event
    this.logEvent(event);

    // Emit via Socket.io
    if (this.io) {
      // Emit to session room
      this.io.to(`session:${sessionId}`).emit(type, event);

      // Emit to organization room
      if (options?.organizationId) {
        this.io.to(`org:${options.organizationId}`).emit(type, event);
      }

      // Emit globally (for monitoring)
      this.io.emit('affretia.event', event);
    }

    console.log(`[EVENT] ${type}:`, { sessionId, payload: JSON.stringify(payload).slice(0, 100) });

    return event;
  }

  private logEvent(event: AffretEvent) {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }

  getRecentEvents(sessionId?: string, limit = 50): AffretEvent[] {
    let events = this.eventLog;
    if (sessionId) {
      events = events.filter(e => e.sessionId === sessionId);
    }
    return events.slice(-limit);
  }

  // ========== TRIGGER EVENTS ==========

  emitTriggerNoCarrierAccepted(
    sessionId: string,
    orderId: string,
    reason: 'all_refused' | 'timeout' | 'no_response',
    attemptedCarriers: number,
    elapsedTime: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.trigger.no-carrier-accepted',
      sessionId,
      { orderId, reason, attemptedCarriers, elapsedTime },
      { orderId, organizationId }
    );
  }

  emitTriggerCapabilityGap(
    sessionId: string,
    orderId: string,
    missingCapabilities: string[],
    searchedCarriers: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.trigger.capability-gap',
      sessionId,
      { orderId, missingCapabilities, searchedCarriers },
      { orderId, organizationId }
    );
  }

  emitTriggerManual(
    sessionId: string,
    orderId: string,
    triggeredBy: string,
    reason?: string,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.trigger.manual',
      sessionId,
      { orderId, triggeredBy, reason },
      { orderId, organizationId, userId: triggeredBy }
    );
  }

  // ========== SHORTLIST ==========

  emitShortlistGenerated(
    sessionId: string,
    shortlistId: string,
    totalCandidates: number,
    criteria: { geographic: number; temporal: number; capability: number; historical: number },
    organizationId?: string
  ) {
    return this.emit(
      'affretia.shortlist.generated',
      sessionId,
      { shortlistId, totalCandidates, criteria },
      { organizationId }
    );
  }

  // ========== BROADCAST ==========

  emitBroadcasted(
    sessionId: string,
    broadcastId: string,
    channels: string[],
    recipientsCount: number,
    estimatedPrice: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.broadcasted.to.market',
      sessionId,
      { broadcastId, channels, recipientsCount, estimatedPrice },
      { organizationId }
    );
  }

  // ========== CARRIER RESPONSE ==========

  emitCarrierResponded(
    sessionId: string,
    carrierId: string,
    carrierName: string,
    responseType: 'accept' | 'counter' | 'reject',
    responseTime: number,
    proposedPrice?: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.carrier.responded',
      sessionId,
      { carrierId, carrierName, responseType, proposedPrice, responseTime },
      { carrierId, organizationId }
    );
  }

  // ========== SELECTION ==========

  emitBestCarrierSelected(
    sessionId: string,
    carrierId: string,
    carrierName: string,
    score: number,
    finalPrice: number,
    selectionCriteria: { priceScore: number; qualityScore: number; distanceScore: number; historicalScore: number },
    organizationId?: string
  ) {
    return this.emit(
      'affretia.best-carrier.selected',
      sessionId,
      { carrierId, carrierName, score, finalPrice, selectionCriteria },
      { carrierId, organizationId }
    );
  }

  // ========== ASSIGNMENT ==========

  emitOrderAssigned(
    sessionId: string,
    orderId: string,
    carrierId: string,
    carrierName: string,
    assignmentId: string,
    trackingLevel: string,
    estimatedPickup: string,
    estimatedDelivery: string,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.order.assigned',
      sessionId,
      { carrierId, carrierName, assignmentId, trackingLevel, estimatedPickup, estimatedDelivery },
      { orderId, carrierId, organizationId }
    );
  }

  // ========== TRACKING ==========

  emitTrackingStart(
    sessionId: string,
    trackingId: string,
    level: string,
    provider?: string,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.tracking.start',
      sessionId,
      { trackingId, level, provider },
      { organizationId }
    );
  }

  // ========== VIGILANCE ==========

  emitCarrierRejectedVigilance(
    sessionId: string,
    carrierId: string,
    carrierName: string,
    rejectionReasons: string[],
    complianceScore: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.carrier.rejected.vigilance',
      sessionId,
      { carrierId, carrierName, rejectionReasons, complianceScore },
      { carrierId, organizationId }
    );
  }

  // ========== SCORING ==========

  emitTransportScored(
    sessionId: string,
    carrierId: string,
    finalScore: number,
    breakdown: {
      punctuality: number;
      appointmentRespect: number;
      podSpeed: number;
      incidentManagement: number;
      communicationQuality: number;
    },
    previousScore: number,
    newAverageScore: number,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.transport.scored',
      sessionId,
      { carrierId, finalScore, breakdown, previousScore, newAverageScore },
      { carrierId, organizationId }
    );
  }

  // ========== CLOSE ==========

  emitOrderClosed(
    sessionId: string,
    orderId: string,
    success: boolean,
    finalPrice: number,
    documentsReceived: string[],
    syncedToERP: boolean,
    archivedAt: string,
    organizationId?: string
  ) {
    return this.emit(
      'affretia.order.closed',
      sessionId,
      { success, finalPrice, documentsReceived, syncedToERP, archivedAt },
      { orderId, organizationId }
    );
  }

  // ========== DOCUMENTS ==========

  emitDocumentsUploaded(
    sessionId: string,
    documentId: string,
    documentType: string,
    filename: string,
    ocrProcessed: boolean,
    extractedData?: Record<string, string>,
    organizationId?: string
  ) {
    return this.emit(
      'documents.uploaded',
      sessionId,
      { documentId, documentType, filename, ocrProcessed, extractedData },
      { organizationId }
    );
  }
}

// Singleton instance
let eventEmitter: EventEmitter | null = null;

export function initializeEventEmitter(io: SocketServer): EventEmitter {
  eventEmitter = new EventEmitter();
  eventEmitter.initialize(io);
  return eventEmitter;
}

export function getEventEmitter(): EventEmitter {
  if (!eventEmitter) {
    eventEmitter = new EventEmitter();
  }
  return eventEmitter;
}

export default EventEmitter;

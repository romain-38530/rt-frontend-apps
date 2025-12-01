import axios from 'axios';

/**
 * Service d'émission d'événements vers l'API Events
 */
export class EventEmitter {
  private readonly eventsApiUrl: string;

  constructor() {
    this.eventsApiUrl = process.env.API_EVENTS_URL || 'http://localhost:3005';
  }

  /**
   * Émet un événement vers l'API Events
   */
  async emit(eventType: string, data: any, metadata?: any): Promise<void> {
    try {
      const payload = {
        type: eventType,
        source: 'api-supplier',
        data,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        }
      };

      await axios.post(`${this.eventsApiUrl}/events`, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`Event emitted: ${eventType}`);
    } catch (error: any) {
      console.error(`Failed to emit event ${eventType}:`, error.message);
      // Ne pas lancer d'erreur pour ne pas bloquer le flux principal
    }
  }

  /**
   * Événements spécifiques au domaine fournisseur
   */
  async emitSupplierOnboarded(supplierId: string, industrialId: string, data: any) {
    await this.emit('fournisseur.onboard.completed', {
      supplierId,
      industrialId,
      ...data
    });
  }

  async emitOrderStatusChanged(
    orderId: string,
    supplierId: string,
    previousStatus: string,
    newStatus: string
  ) {
    await this.emit('fournisseur.order.status_changed', {
      orderId,
      supplierId,
      previousStatus,
      newStatus
    });
  }

  async emitSlotValidated(slotId: string, orderId: string, supplierId: string, data: any) {
    await this.emit('fournisseur.rdv.validated', {
      slotId,
      orderId,
      supplierId,
      ...data
    });
  }

  async emitSlotUpdated(slotId: string, orderId: string, supplierId: string, data: any) {
    await this.emit('fournisseur.rdv.updated', {
      slotId,
      orderId,
      supplierId,
      ...data
    });
  }

  async emitSignatureCompleted(
    signatureId: string,
    orderId: string,
    supplierId: string,
    data: any
  ) {
    await this.emit('fournisseur.signature.completed', {
      signatureId,
      orderId,
      supplierId,
      ...data
    });
  }

  async emitDocumentUploaded(
    orderId: string,
    supplierId: string,
    documentType: string,
    filename: string
  ) {
    await this.emit('fournisseur.document.uploaded', {
      orderId,
      supplierId,
      documentType,
      filename
    });
  }
}

export default new EventEmitter();

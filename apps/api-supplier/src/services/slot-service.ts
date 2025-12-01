import axios from 'axios';
import LoadingSlot from '../models/LoadingSlot';
import SupplierOrder from '../models/SupplierOrder';

export class SlotService {
  /**
   * Récupère l'ETA depuis l'API Tracking
   */
  async getETAFromTracking(orderId: string): Promise<Date | null> {
    try {
      const response = await axios.get(
        `${process.env.API_TRACKING_URL}/tracking/order/${orderId}/eta`
      );
      return response.data.eta ? new Date(response.data.eta) : null;
    } catch (error) {
      console.error('Error fetching ETA from Tracking API:', error);
      return null;
    }
  }

  /**
   * Crée un créneau de chargement proposé
   */
  async proposeSlot(data: {
    supplierId: string;
    orderId: string;
    proposedBy: 'system' | 'supplier' | 'industrial';
    date: Date;
    startTime: string;
    endTime: string;
    dockId?: string;
  }) {
    // Récupérer l'ETA si disponible
    const eta = await this.getETAFromTracking(data.orderId);

    const slot = new LoadingSlot({
      supplierId: data.supplierId,
      orderId: data.orderId,
      proposedBy: data.proposedBy,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      dockId: data.dockId,
      status: 'proposed',
      etaFromTracking: eta
    });

    await slot.save();

    // Émettre événement
    await this.emitEvent('fournisseur.rdv.proposed', {
      slotId: slot.slotId,
      orderId: slot.orderId,
      supplierId: slot.supplierId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime
    });

    return slot;
  }

  /**
   * Accepte un créneau proposé
   */
  async acceptSlot(slotId: string, respondedBy: string) {
    const slot = await LoadingSlot.findOne({ slotId });

    if (!slot) {
      throw new Error('Loading slot not found');
    }

    if (slot.status !== 'proposed') {
      throw new Error('Only proposed slots can be accepted');
    }

    slot.status = 'accepted';
    slot.response = {
      action: 'accept',
      respondedAt: new Date(),
      respondedBy
    };

    await slot.save();

    // Mettre à jour la commande avec le créneau accepté
    await SupplierOrder.findOneAndUpdate(
      { orderId: slot.orderId },
      {
        loadingSlot: {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dockId: slot.dockId || ''
        }
      }
    );

    // Émettre événement
    await this.emitEvent('fournisseur.rdv.validated', {
      slotId: slot.slotId,
      orderId: slot.orderId,
      supplierId: slot.supplierId,
      acceptedBy: respondedBy
    });

    return slot;
  }

  /**
   * Propose une modification de créneau
   */
  async modifySlot(
    slotId: string,
    alternativeSlot: {
      date: Date;
      startTime: string;
      endTime: string;
      dockId?: string;
    },
    reason: string,
    respondedBy: string
  ) {
    const slot = await LoadingSlot.findOne({ slotId });

    if (!slot) {
      throw new Error('Loading slot not found');
    }

    if (slot.status !== 'proposed') {
      throw new Error('Only proposed slots can be modified');
    }

    slot.status = 'modified';
    slot.response = {
      action: 'modify',
      reason,
      alternativeSlot,
      respondedAt: new Date(),
      respondedBy
    };

    await slot.save();

    // Créer un nouveau créneau avec la proposition alternative
    const newSlot = await this.proposeSlot({
      supplierId: slot.supplierId,
      orderId: slot.orderId,
      proposedBy: 'supplier',
      date: alternativeSlot.date,
      startTime: alternativeSlot.startTime,
      endTime: alternativeSlot.endTime,
      dockId: alternativeSlot.dockId
    });

    // Émettre événement
    await this.emitEvent('fournisseur.rdv.updated', {
      originalSlotId: slot.slotId,
      newSlotId: newSlot.slotId,
      orderId: slot.orderId,
      supplierId: slot.supplierId,
      reason,
      modifiedBy: respondedBy
    });

    return { originalSlot: slot, newSlot };
  }

  /**
   * Refuse un créneau proposé
   */
  async rejectSlot(slotId: string, reason: string, respondedBy: string) {
    const slot = await LoadingSlot.findOne({ slotId });

    if (!slot) {
      throw new Error('Loading slot not found');
    }

    if (slot.status !== 'proposed') {
      throw new Error('Only proposed slots can be rejected');
    }

    slot.status = 'rejected';
    slot.response = {
      action: 'reject',
      reason,
      respondedAt: new Date(),
      respondedBy
    };

    await slot.save();

    // Émettre événement
    await this.emitEvent('fournisseur.rdv.rejected', {
      slotId: slot.slotId,
      orderId: slot.orderId,
      supplierId: slot.supplierId,
      reason,
      rejectedBy: respondedBy
    });

    return slot;
  }

  /**
   * Confirme définitivement un créneau accepté
   */
  async confirmSlot(slotId: string) {
    const slot = await LoadingSlot.findOne({ slotId });

    if (!slot) {
      throw new Error('Loading slot not found');
    }

    if (slot.status !== 'accepted') {
      throw new Error('Only accepted slots can be confirmed');
    }

    slot.status = 'confirmed';
    await slot.save();

    return slot;
  }

  /**
   * Récupère les créneaux disponibles pour un fournisseur
   */
  async getAvailableSlots(supplierId: string, date?: Date) {
    const query: any = {
      supplierId,
      status: { $in: ['proposed', 'accepted', 'confirmed'] }
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const slots = await LoadingSlot.find(query).sort({ date: 1, startTime: 1 });
    return slots;
  }

  /**
   * Synchronise l'ETA avec l'API Tracking pour tous les créneaux actifs
   */
  async syncETAForActiveSlots() {
    const activeSlots = await LoadingSlot.find({
      status: { $in: ['accepted', 'confirmed'] }
    });

    for (const slot of activeSlots) {
      const eta = await this.getETAFromTracking(slot.orderId);
      if (eta) {
        slot.etaFromTracking = eta;
        await slot.save();
      }
    }

    return { synced: activeSlots.length };
  }

  /**
   * Émet un événement vers l'API Events
   */
  private async emitEvent(eventType: string, data: any) {
    try {
      await axios.post(`${process.env.API_EVENTS_URL}/events`, {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting event:', error);
    }
  }
}

export default new SlotService();

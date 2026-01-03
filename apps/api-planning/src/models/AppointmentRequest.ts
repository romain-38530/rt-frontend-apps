/**
 * Modele AppointmentRequest - Demandes de RDV transporteur <-> industriel
 */
import mongoose, { Document, Schema } from 'mongoose';

export type AppointmentRequestStatus = 'pending' | 'proposed' | 'accepted' | 'rejected' | 'cancelled';
export type AppointmentType = 'loading' | 'unloading';
export type RDVRecipientType = 'industrial' | 'logistician' | 'supplier';

export interface IAppointmentRequest extends Document {
  requestId: string;
  orderId: string;
  orderReference: string;
  type: AppointmentType;
  status: AppointmentRequestStatus;

  // Demandeur (transporteur)
  requesterId: string;
  requesterType: 'carrier' | 'driver';
  requesterName: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;

  // Destinataire (industriel/logisticien/fournisseur)
  targetSiteId?: string;
  targetSiteName?: string;
  targetOrganizationId: string;
  targetOrganizationName?: string;
  targetOrganizationType: RDVRecipientType;

  // Routage RDV - Determination automatique du destinataire
  rdvRouting: {
    determinedBy: 'auto' | 'manual';
    determinedAt: Date;
    routingReason: string;
    originalIndustrialId?: string;
    originalIndustrialName?: string;
    delegatedLogisticsId?: string;
    delegatedLogisticsName?: string;
    supplierId?: string;
    supplierName?: string;
  };

  // Creneaux souhaites par le transporteur
  preferredDates: Array<{
    date: Date;
    startTime?: string;
    endTime?: string;
    priority: number;
  }>;

  // Creneau propose par l'industriel
  proposedSlot?: {
    date: Date;
    startTime: string;
    endTime: string;
    dockId?: string;
    dockName?: string;
    proposedBy: string;
    proposedAt: Date;
  };

  // Creneau confirme
  confirmedSlot?: {
    date: Date;
    startTime: string;
    endTime: string;
    dockId?: string;
    bookingId?: string;
    confirmedBy: string;
    confirmedAt: Date;
  };

  // Historique des messages
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderType: 'carrier' | 'industrial' | 'system';
    content: string;
    timestamp: Date;
  }>;

  // Notes et commentaires
  carrierNotes?: string;
  industrialNotes?: string;
  rejectionReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

const AppointmentRequestSchema = new Schema<IAppointmentRequest>({
  requestId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true, index: true },
  orderReference: { type: String, required: true },
  type: { type: String, enum: ['loading', 'unloading'], required: true },
  status: {
    type: String,
    enum: ['pending', 'proposed', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },

  requesterId: { type: String, required: true },
  requesterType: { type: String, enum: ['carrier', 'driver'], required: true },
  requesterName: { type: String, required: true },
  carrierName: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  vehiclePlate: { type: String },

  targetSiteId: { type: String },
  targetSiteName: { type: String },
  targetOrganizationId: { type: String, required: true, index: true },
  targetOrganizationName: { type: String },
  targetOrganizationType: {
    type: String,
    enum: ['industrial', 'logistician', 'supplier'],
    default: 'industrial'
  },

  rdvRouting: {
    determinedBy: { type: String, enum: ['auto', 'manual'], default: 'manual' },
    determinedAt: { type: Date, default: Date.now },
    routingReason: { type: String },
    originalIndustrialId: { type: String },
    originalIndustrialName: { type: String },
    delegatedLogisticsId: { type: String },
    delegatedLogisticsName: { type: String },
    supplierId: { type: String },
    supplierName: { type: String }
  },

  preferredDates: [{
    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    priority: { type: Number, default: 1 }
  }],

  proposedSlot: {
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    dockId: { type: String },
    dockName: { type: String },
    proposedBy: { type: String },
    proposedAt: { type: Date }
  },

  confirmedSlot: {
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    dockId: { type: String },
    bookingId: { type: String },
    confirmedBy: { type: String },
    confirmedAt: { type: Date }
  },

  messages: [{
    id: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderType: { type: String, enum: ['carrier', 'industrial', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],

  carrierNotes: { type: String },
  industrialNotes: { type: String },
  rejectionReason: { type: String },

  respondedAt: { type: Date }
}, {
  timestamps: true
});

// Index pour recherches frequentes
AppointmentRequestSchema.index({ targetOrganizationId: 1, status: 1 });
AppointmentRequestSchema.index({ requesterId: 1, status: 1 });
AppointmentRequestSchema.index({ orderId: 1, type: 1 });

export default mongoose.model<IAppointmentRequest>('AppointmentRequest', AppointmentRequestSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IETA {
  predicted: Date;
  source: 'tracking_ia' | 'manual' | 'gps' | 'driver';
  confidence: number;
  lastUpdate: Date;
  originalETA?: Date;
  delayMinutes?: number;
  delayReason?: string;
}

export interface ITransportInfo {
  carrierId?: string;
  carrierName: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  vehicleType?: 'truck' | 'van' | 'semi_truck' | 'trailer';
  trackingEnabled: boolean;
  gpsPosition?: {
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  };
}

export interface ICargoInfo {
  description: string;
  pallets?: number;
  packages?: number;
  weight?: number;
  volume?: number;
  specialHandling?: string[];
  temperature?: {
    required: boolean;
    min?: number;
    max?: number;
  };
  hazardous?: {
    isHazardous: boolean;
    unNumber?: string;
    class?: string;
    packingGroup?: string;
  };
}

export interface IDocument {
  documentId: string;
  type: 'cmr' | 'delivery_note' | 'photo' | 'adr' | 'invoice' | 'other';
  filename: string;
  url: string;
  signed: boolean;
  signedBy?: string;
  signedAt?: Date;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: {
    size: number;
    mimeType: string;
  };
}

export interface ITimelineEvent {
  eventId: string;
  event: 'created' | 'scheduled' | 'in_transit' | 'eta_updated' | 'arriving' | 'arrived' | 'unloading' | 'delivered' | 'incident' | 'cancelled' | 'delayed';
  timestamp: Date;
  actor: {
    id: string;
    type: 'system' | 'recipient' | 'transporter' | 'driver' | 'industrial';
    name: string;
  };
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  notes?: string;
  metadata?: any;
}

export interface IDelivery extends Document {
  deliveryId: string;
  orderId: string;
  recipientId: string;
  siteId: string;
  supplierId?: string;
  industrialId: string;
  status: 'scheduled' | 'in_transit' | 'arriving' | 'arrived' | 'unloading' | 'delivered' | 'incident' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  eta: IETA;
  scheduledDate: Date;
  arrivalDate?: Date;
  deliveryDate?: Date;
  transport: ITransportInfo;
  cargo: ICargoInfo;
  documents: IDocument[];
  timeline: ITimelineEvent[];
  appointment?: {
    required: boolean;
    slotId?: string;
    timeWindow: {
      start: Date;
      end: Date;
    };
    confirmedBy?: string;
    confirmedAt?: Date;
  };
  unloading?: {
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    unloadedBy?: string[];
    equipmentUsed?: string[];
    notes?: string;
  };
  signature?: {
    signatureId: string;
    signedAt: Date;
    signedBy: string;
    status: 'complete' | 'partial' | 'refused';
  };
  incidents?: string[];
  rating?: {
    score: number;
    comment?: string;
    ratedBy: string;
    ratedAt: Date;
  };
  notifications: {
    recipientNotified: boolean;
    recipientNotifiedAt?: Date;
    etaUpdatesSent: number;
    lastNotificationAt?: Date;
  };
  metadata: {
    cmrNumber?: string;
    invoiceNumber?: string;
    customerReference?: string;
    internalReference?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ETASchema = new Schema<IETA>({
  predicted: { type: Date, required: true },
  source: {
    type: String,
    enum: ['tracking_ia', 'manual', 'gps', 'driver'],
    required: true
  },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  lastUpdate: { type: Date, required: true },
  originalETA: Date,
  delayMinutes: Number,
  delayReason: String
});

const TransportInfoSchema = new Schema<ITransportInfo>({
  carrierId: String,
  carrierName: { type: String, required: true },
  driverName: String,
  driverPhone: String,
  vehiclePlate: String,
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'semi_truck', 'trailer']
  },
  trackingEnabled: { type: Boolean, default: false },
  gpsPosition: {
    lat: Number,
    lng: Number,
    timestamp: Date,
    speed: Number,
    heading: Number
  }
});

const CargoInfoSchema = new Schema<ICargoInfo>({
  description: { type: String, required: true },
  pallets: Number,
  packages: Number,
  weight: Number,
  volume: Number,
  specialHandling: [String],
  temperature: {
    required: { type: Boolean, default: false },
    min: Number,
    max: Number
  },
  hazardous: {
    isHazardous: { type: Boolean, default: false },
    unNumber: String,
    class: String,
    packingGroup: String
  }
});

const DocumentSchema = new Schema<IDocument>({
  documentId: { type: String, required: true },
  type: {
    type: String,
    enum: ['cmr', 'delivery_note', 'photo', 'adr', 'invoice', 'other'],
    required: true
  },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  signed: { type: Boolean, default: false },
  signedBy: String,
  signedAt: Date,
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
  metadata: {
    size: Number,
    mimeType: String
  }
});

const TimelineEventSchema = new Schema<ITimelineEvent>({
  eventId: { type: String, required: true },
  event: {
    type: String,
    enum: ['created', 'scheduled', 'in_transit', 'eta_updated', 'arriving', 'arrived', 'unloading', 'delivered', 'incident', 'cancelled', 'delayed'],
    required: true
  },
  timestamp: { type: Date, required: true },
  actor: {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['system', 'recipient', 'transporter', 'driver', 'industrial'],
      required: true
    },
    name: { type: String, required: true }
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  notes: String,
  metadata: Schema.Types.Mixed
});

const DeliverySchema = new Schema<IDelivery>(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    recipientId: {
      type: String,
      required: true,
      index: true
    },
    siteId: {
      type: String,
      required: true,
      index: true
    },
    supplierId: String,
    industrialId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_transit', 'arriving', 'arrived', 'unloading', 'delivered', 'incident', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    eta: {
      type: ETASchema,
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true
    },
    arrivalDate: Date,
    deliveryDate: Date,
    transport: {
      type: TransportInfoSchema,
      required: true
    },
    cargo: {
      type: CargoInfoSchema,
      required: true
    },
    documents: [DocumentSchema],
    timeline: [TimelineEventSchema],
    appointment: {
      required: { type: Boolean, default: false },
      slotId: String,
      timeWindow: {
        start: Date,
        end: Date
      },
      confirmedBy: String,
      confirmedAt: Date
    },
    unloading: {
      startedAt: Date,
      completedAt: Date,
      duration: Number,
      unloadedBy: [String],
      equipmentUsed: [String],
      notes: String
    },
    signature: {
      signatureId: String,
      signedAt: Date,
      signedBy: String,
      status: {
        type: String,
        enum: ['complete', 'partial', 'refused']
      }
    },
    incidents: [String],
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedBy: String,
      ratedAt: Date
    },
    notifications: {
      recipientNotified: { type: Boolean, default: false },
      recipientNotifiedAt: Date,
      etaUpdatesSent: { type: Number, default: 0 },
      lastNotificationAt: Date
    },
    metadata: {
      cmrNumber: String,
      invoiceNumber: String,
      customerReference: String,
      internalReference: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes composites pour les requêtes fréquentes
DeliverySchema.index({ recipientId: 1, status: 1, scheduledDate: -1 });
DeliverySchema.index({ siteId: 1, scheduledDate: 1 });
DeliverySchema.index({ recipientId: 1, siteId: 1, status: 1 });
DeliverySchema.index({ 'eta.predicted': 1 });

// Méthode pour générer un deliveryId unique
DeliverySchema.statics.generateDeliveryId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ deliveryId: new RegExp(`^DEL-${year}-`) });
  return `DEL-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Méthode pour ajouter un événement à la timeline
DeliverySchema.methods.addTimelineEvent = function(
  event: ITimelineEvent['event'],
  actor: ITimelineEvent['actor'],
  notes?: string,
  location?: ITimelineEvent['location']
): void {
  this.timeline.push({
    eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    event,
    timestamp: new Date(),
    actor,
    location,
    notes
  });
};

// Méthode pour mettre à jour l'ETA
DeliverySchema.methods.updateETA = function(
  newETA: Date,
  source: IETA['source'],
  confidence: number,
  reason?: string
): void {
  const oldETA = this.eta.predicted;
  const delayMinutes = Math.round((newETA.getTime() - oldETA.getTime()) / 60000);

  this.eta = {
    predicted: newETA,
    source,
    confidence,
    lastUpdate: new Date(),
    originalETA: this.eta.originalETA || oldETA,
    delayMinutes,
    delayReason: reason
  };

  this.notifications.etaUpdatesSent += 1;
};

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);

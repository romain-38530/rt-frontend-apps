/**
 * Model: Booking
 * Réservation/RDV de chargement ou livraison
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  reference: string;

  // Liens
  siteId: string;
  siteName: string;
  dockId?: string;
  dockName?: string;
  slotId?: string;
  orderId?: string;
  orderReference?: string;

  // Parties
  requester: {
    orgId: string;
    orgName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
  };
  siteOwner: {
    orgId: string;
    orgName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
  };
  transporter: {
    orgId: string;
    orgName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
  };

  // Type
  flowType: 'pickup' | 'delivery';

  // Date et heure demandées
  requestedDate: string;
  requestedTimeSlot: {
    start: string;
    end: string;
  };

  // Date et heure confirmées
  confirmedDate?: string;
  confirmedTimeSlot?: {
    start: string;
    end: string;
  };

  // Alternatives proposées
  proposedAlternatives: {
    date: string;
    timeSlot: { start: string; end: string };
    proposedBy: string;
    proposedAt: Date;
    message?: string;
  }[];

  // Cargo
  cargo: {
    description: string;
    palletCount?: number;
    weight?: number;
    volume?: number;
    isAdr: boolean;
    adrClass?: string;
    temperatureRequired?: string;
    specialInstructions?: string;
  };

  // Véhicule
  vehicle?: {
    plateNumber?: string;
    trailerNumber?: string;
    vehicleType: string;
    driverName?: string;
    driverPhone?: string;
  };

  // Statut
  status: 'requested' | 'proposed' | 'confirmed' | 'refused' | 'checked_in' | 'at_dock' | 'loading' | 'completed' | 'no_show' | 'cancelled';
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: string;
    reason?: string;
  }[];

  // Tracking temps
  timestamps: {
    requestedAt: Date;
    confirmedAt?: Date;
    arrivedAt?: Date;
    checkedInAt?: Date;
    calledAt?: Date;
    atDockAt?: Date;
    loadingStartedAt?: Date;
    loadingEndedAt?: Date;
    signedAt?: Date;
    departedAt?: Date;
    completedAt?: Date;
  };

  // Métriques
  metrics?: {
    waitTimeMinutes?: number;
    dockTimeMinutes?: number;
    totalTimeMinutes?: number;
  };

  // Documents
  documents: {
    type: 'cmr' | 'delivery_note' | 'photo' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
  }[];

  // eCMR
  ecmrId?: string;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Scoring
  impactedScore: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  reference: { type: String, required: true, unique: true },

  siteId: { type: String, required: true, index: true },
  siteName: { type: String, required: true },
  dockId: String,
  dockName: String,
  slotId: { type: String, index: true },
  orderId: { type: String, index: true },
  orderReference: String,

  requester: {
    orgId: { type: String, required: true },
    orgName: { type: String, required: true },
    contactName: String,
    contactEmail: String,
    contactPhone: String
  },
  siteOwner: {
    orgId: { type: String, required: true },
    orgName: { type: String, required: true },
    contactName: String,
    contactEmail: String,
    contactPhone: String
  },
  transporter: {
    orgId: { type: String, required: true, index: true },
    orgName: { type: String, required: true },
    contactName: String,
    contactEmail: String,
    contactPhone: String
  },

  flowType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },

  requestedDate: { type: String, required: true },
  requestedTimeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },

  confirmedDate: String,
  confirmedTimeSlot: {
    start: String,
    end: String
  },

  proposedAlternatives: [{
    date: String,
    timeSlot: {
      start: String,
      end: String
    },
    proposedBy: String,
    proposedAt: Date,
    message: String
  }],

  cargo: {
    description: { type: String, required: true },
    palletCount: Number,
    weight: Number,
    volume: Number,
    isAdr: { type: Boolean, default: false },
    adrClass: String,
    temperatureRequired: String,
    specialInstructions: String
  },

  vehicle: {
    plateNumber: String,
    trailerNumber: String,
    vehicleType: String,
    driverName: String,
    driverPhone: String
  },

  status: {
    type: String,
    enum: ['requested', 'proposed', 'confirmed', 'refused', 'checked_in', 'at_dock', 'loading', 'completed', 'no_show', 'cancelled'],
    default: 'requested',
    index: true
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    reason: String
  }],

  timestamps: {
    requestedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    arrivedAt: Date,
    checkedInAt: Date,
    calledAt: Date,
    atDockAt: Date,
    loadingStartedAt: Date,
    loadingEndedAt: Date,
    signedAt: Date,
    departedAt: Date,
    completedAt: Date
  },

  metrics: {
    waitTimeMinutes: Number,
    dockTimeMinutes: Number,
    totalTimeMinutes: Number
  },

  documents: [{
    type: { type: String, enum: ['cmr', 'delivery_note', 'photo', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  ecmrId: String,

  notes: String,
  internalNotes: String,

  impactedScore: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Auto-génération de la référence
BookingSchema.pre('save', async function(next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Booking').countDocuments();
    this.reference = `RDV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index composites
BookingSchema.index({ siteId: 1, requestedDate: 1, status: 1 });
BookingSchema.index({ 'transporter.orgId': 1, status: 1 });
BookingSchema.index({ requestedDate: 1, status: 1 });
BookingSchema.index({ confirmedDate: 1, status: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);

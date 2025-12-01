import mongoose, { Document, Schema } from 'mongoose';

export interface IAffectedItem {
  itemId: string;
  reference: string;
  description: string;
  quantityOrdered?: number;
  quantityAffected: number;
  damageType?: 'damaged' | 'missing' | 'broken' | 'wrong' | 'defective' | 'expired';
  damageDescription: string;
  estimatedValue?: number;
  photosUrls?: string[];
}

export interface IIncidentPhoto {
  photoId: string;
  url: string;
  description?: string;
  timestamp: Date;
  uploadedBy: string;
  tags?: string[];
  metadata?: {
    size: number;
    mimeType: string;
    resolution?: string;
  };
}

export interface IIncidentAcknowledgement {
  acknowledgedBy: string;
  acknowledgedByType: 'transporter' | 'industrial' | 'supplier' | 'admin';
  acknowledgedAt: Date;
  comment?: string;
  actionPlan?: string;
}

export interface IIncidentResolution {
  action: 'replaced' | 'refunded' | 'credit_note' | 'discount' | 'no_action' | 'dispute';
  resolvedAt: Date;
  resolvedBy: string;
  resolvedByType: 'transporter' | 'industrial' | 'supplier' | 'admin';
  compensation?: {
    type: 'monetary' | 'product' | 'credit' | 'discount';
    amount?: number;
    currency?: string;
    description: string;
  };
  resolution: string;
  documents?: string[];
}

export interface IIncident extends Document {
  incidentId: string;
  deliveryId: string;
  recipientId: string;
  siteId: string;
  industrialId: string;
  supplierId?: string;
  transporterId?: string;
  type: 'damage' | 'missing' | 'broken_packaging' | 'wrong_product' | 'partial_refusal' | 'total_refusal' | 'quality_issue' | 'delay' | 'other';
  severity: 'minor' | 'major' | 'critical';
  category?: 'transport' | 'product' | 'documentation' | 'service';
  title: string;
  description: string;
  affectedItems: IAffectedItem[];
  photos: IIncidentPhoto[];
  status: 'reported' | 'acknowledged' | 'investigating' | 'pending_resolution' | 'resolved' | 'closed' | 'disputed';
  reportedAt: Date;
  reportedBy: {
    userId: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  acknowledgements: IIncidentAcknowledgement[];
  notifications: {
    transporterNotified: boolean;
    transporterNotifiedAt?: Date;
    industrialNotified: boolean;
    industrialNotifiedAt?: Date;
    supplierNotified: boolean;
    supplierNotifiedAt?: Date;
  };
  billingBlocked: boolean;
  billingBlockedAt?: Date;
  billingBlockedReason?: string;
  disputeId?: string;
  disputeStatus?: 'pending' | 'in_mediation' | 'resolved' | 'arbitration';
  resolution?: IIncidentResolution;
  impact: {
    financialImpact?: number;
    operationalImpact?: 'low' | 'medium' | 'high';
    customerSatisfaction?: number;
  };
  rootCause?: {
    identified: boolean;
    cause?: string;
    responsibleParty?: 'transporter' | 'industrial' | 'supplier' | 'recipient' | 'external';
    preventiveMeasures?: string;
  };
  timeline: Array<{
    eventId: string;
    event: string;
    timestamp: Date;
    actor: {
      id: string;
      type: string;
      name: string;
    };
    details?: string;
  }>;
  attachments?: Array<{
    attachmentId: string;
    type: 'document' | 'photo' | 'video' | 'audio' | 'other';
    filename: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  relatedIncidents?: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: Date;
  assignedTo?: {
    userId: string;
    name: string;
    role: string;
  };
  tags?: string[];
  metadata: {
    source?: 'mobile' | 'web' | 'api' | 'system';
    ipAddress?: string;
    userAgent?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const AffectedItemSchema = new Schema<IAffectedItem>({
  itemId: { type: String, required: true },
  reference: { type: String, required: true },
  description: { type: String, required: true },
  quantityOrdered: Number,
  quantityAffected: { type: Number, required: true },
  damageType: {
    type: String,
    enum: ['damaged', 'missing', 'broken', 'wrong', 'defective', 'expired']
  },
  damageDescription: { type: String, required: true },
  estimatedValue: Number,
  photosUrls: [String]
});

const IncidentPhotoSchema = new Schema<IIncidentPhoto>({
  photoId: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  timestamp: { type: Date, required: true },
  uploadedBy: { type: String, required: true },
  tags: [String],
  metadata: {
    size: Number,
    mimeType: String,
    resolution: String
  }
});

const AcknowledgementSchema = new Schema<IIncidentAcknowledgement>({
  acknowledgedBy: { type: String, required: true },
  acknowledgedByType: {
    type: String,
    enum: ['transporter', 'industrial', 'supplier', 'admin'],
    required: true
  },
  acknowledgedAt: { type: Date, required: true },
  comment: String,
  actionPlan: String
});

const ResolutionSchema = new Schema<IIncidentResolution>({
  action: {
    type: String,
    enum: ['replaced', 'refunded', 'credit_note', 'discount', 'no_action', 'dispute'],
    required: true
  },
  resolvedAt: { type: Date, required: true },
  resolvedBy: { type: String, required: true },
  resolvedByType: {
    type: String,
    enum: ['transporter', 'industrial', 'supplier', 'admin'],
    required: true
  },
  compensation: {
    type: {
      type: String,
      enum: ['monetary', 'product', 'credit', 'discount']
    },
    amount: Number,
    currency: { type: String, default: 'EUR' },
    description: String
  },
  resolution: { type: String, required: true },
  documents: [String]
});

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deliveryId: {
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
    industrialId: {
      type: String,
      required: true,
      index: true
    },
    supplierId: String,
    transporterId: String,
    type: {
      type: String,
      enum: ['damage', 'missing', 'broken_packaging', 'wrong_product', 'partial_refusal', 'total_refusal', 'quality_issue', 'delay', 'other'],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['transport', 'product', 'documentation', 'service']
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    affectedItems: [AffectedItemSchema],
    photos: [IncidentPhotoSchema],
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'investigating', 'pending_resolution', 'resolved', 'closed', 'disputed'],
      default: 'reported',
      index: true
    },
    reportedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    reportedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      email: String,
      phone: String
    },
    acknowledgements: [AcknowledgementSchema],
    notifications: {
      transporterNotified: { type: Boolean, default: false },
      transporterNotifiedAt: Date,
      industrialNotified: { type: Boolean, default: false },
      industrialNotifiedAt: Date,
      supplierNotified: { type: Boolean, default: false },
      supplierNotifiedAt: Date
    },
    billingBlocked: {
      type: Boolean,
      default: false,
      index: true
    },
    billingBlockedAt: Date,
    billingBlockedReason: String,
    disputeId: String,
    disputeStatus: {
      type: String,
      enum: ['pending', 'in_mediation', 'resolved', 'arbitration']
    },
    resolution: ResolutionSchema,
    impact: {
      financialImpact: Number,
      operationalImpact: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      customerSatisfaction: { type: Number, min: 1, max: 5 }
    },
    rootCause: {
      identified: { type: Boolean, default: false },
      cause: String,
      responsibleParty: {
        type: String,
        enum: ['transporter', 'industrial', 'supplier', 'recipient', 'external']
      },
      preventiveMeasures: String
    },
    timeline: [{
      eventId: { type: String, required: true },
      event: { type: String, required: true },
      timestamp: { type: Date, required: true },
      actor: {
        id: { type: String, required: true },
        type: { type: String, required: true },
        name: { type: String, required: true }
      },
      details: String
    }],
    attachments: [{
      attachmentId: { type: String, required: true },
      type: {
        type: String,
        enum: ['document', 'photo', 'video', 'audio', 'other'],
        required: true
      },
      filename: { type: String, required: true },
      url: { type: String, required: true },
      uploadedBy: { type: String, required: true },
      uploadedAt: { type: Date, required: true }
    }],
    relatedIncidents: [String],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    dueDate: Date,
    assignedTo: {
      userId: String,
      name: String,
      role: String
    },
    tags: [String],
    metadata: {
      source: {
        type: String,
        enum: ['mobile', 'web', 'api', 'system']
      },
      ipAddress: String,
      userAgent: String,
      location: {
        lat: Number,
        lng: Number
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes composites pour les recherches fréquentes
IncidentSchema.index({ recipientId: 1, status: 1, reportedAt: -1 });
IncidentSchema.index({ deliveryId: 1, status: 1 });
IncidentSchema.index({ industrialId: 1, severity: 1, status: 1 });
IncidentSchema.index({ status: 1, priority: 1, dueDate: 1 });
IncidentSchema.index({ billingBlocked: 1, status: 1 });

// Méthode pour générer un incidentId unique
IncidentSchema.statics.generateIncidentId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ incidentId: new RegExp(`^INC-${year}-`) });
  return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Méthode pour ajouter un événement à la timeline
IncidentSchema.methods.addTimelineEvent = function(
  event: string,
  actor: { id: string; type: string; name: string },
  details?: string
): void {
  this.timeline.push({
    eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    event,
    timestamp: new Date(),
    actor,
    details
  });
};

// Méthode pour ajouter une photo
IncidentSchema.methods.addPhoto = function(
  url: string,
  uploadedBy: string,
  description?: string,
  tags?: string[]
): void {
  this.photos.push({
    photoId: `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    description,
    timestamp: new Date(),
    uploadedBy,
    tags
  });
};

// Méthode pour accuser réception (acknowledgement)
IncidentSchema.methods.acknowledge = function(
  acknowledgedBy: string,
  acknowledgedByType: IIncidentAcknowledgement['acknowledgedByType'],
  comment?: string,
  actionPlan?: string
): void {
  this.acknowledgements.push({
    acknowledgedBy,
    acknowledgedByType,
    acknowledgedAt: new Date(),
    comment,
    actionPlan
  });

  if (this.status === 'reported') {
    this.status = 'acknowledged';
  }

  this.addTimelineEvent(
    'acknowledged',
    { id: acknowledgedBy, type: acknowledgedByType, name: acknowledgedBy },
    comment
  );
};

// Méthode pour bloquer la facturation
IncidentSchema.methods.blockBilling = function(reason?: string): void {
  this.billingBlocked = true;
  this.billingBlockedAt = new Date();
  this.billingBlockedReason = reason || 'Incident en cours d\'investigation';

  this.addTimelineEvent(
    'billing_blocked',
    { id: 'system', type: 'system', name: 'System' },
    reason
  );
};

// Méthode pour débloquer la facturation
IncidentSchema.methods.unblockBilling = function(): void {
  this.billingBlocked = false;

  this.addTimelineEvent(
    'billing_unblocked',
    { id: 'system', type: 'system', name: 'System' }
  );
};

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);

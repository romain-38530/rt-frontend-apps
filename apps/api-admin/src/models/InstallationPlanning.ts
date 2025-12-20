/**
 * InstallationPlanning - Planning des installations clients
 * Systeme partage entre manager et commerciaux avec validation email
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IInstallationPlanning extends Document {
  // Reference contrat
  contractId: mongoose.Types.ObjectId;
  contractNumber: string;

  // Client
  companyId?: mongoose.Types.ObjectId;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;

  // Planning
  title: string;
  description?: string;

  // Creneaux proposes (avant validation)
  proposedSlots: {
    date: Date;
    startTime: string;
    endTime: string;
    duration: number; // minutes
  }[];

  // Creneau confirme
  confirmedSlot?: {
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
  };

  // Assignation
  assignedTo: {
    type: 'commercial' | 'technician' | 'manager';
    userId: mongoose.Types.ObjectId;
    userName: string;
  };

  // Commercial responsable
  commercialId: mongoose.Types.ObjectId;
  commercialName: string;

  // Manager qui a valide
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;

  // Statut
  status: 'draft' | 'proposed' | 'pending_client' | 'pending_manager' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

  // Validation email
  validation: {
    clientToken: string; // Token unique pour validation client
    clientValidatedAt?: Date;
    clientSelectedSlot?: number; // Index du creneau choisi
    managerValidatedAt?: Date;
    emailsSent: {
      type: 'proposal' | 'confirmation' | 'reminder' | 'cancellation';
      sentAt: Date;
      to: string;
    }[];
  };

  // Configuration installation
  installationConfig: {
    type: 'remote' | 'onsite' | 'hybrid';
    estimatedDuration: number; // minutes
    phases: {
      name: string;
      duration: number;
      description?: string;
      completed?: boolean;
      completedAt?: Date;
    }[];
    requirements?: string[]; // Pre-requis client
    meetingLink?: string; // Lien visio pour remote
    address?: string; // Adresse pour onsite
  };

  // Feedback post-installation
  feedback?: {
    rating: number; // 1-5
    comment?: string;
    submittedAt: Date;
  };

  // Notes
  internalNotes?: string;
  clientNotes?: string;

  // Rappels
  reminders: {
    type: '24h' | '1h' | 'custom';
    scheduledFor: Date;
    sent: boolean;
    sentAt?: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const InstallationPlanningSchema = new Schema<IInstallationPlanning>({
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
  contractNumber: { type: String, required: true },

  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: String,

  title: { type: String, required: true },
  description: String,

  proposedSlots: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true }
  }],

  confirmedSlot: {
    date: Date,
    startTime: String,
    endTime: String,
    duration: Number
  },

  assignedTo: {
    type: { type: String, enum: ['commercial', 'technician', 'manager'], default: 'technician' },
    userId: { type: Schema.Types.ObjectId },
    userName: String
  },

  commercialId: { type: Schema.Types.ObjectId, ref: 'CrmCommercial', required: true },
  commercialName: { type: String, required: true },

  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedByName: String,
  approvedAt: Date,

  status: {
    type: String,
    enum: ['draft', 'proposed', 'pending_client', 'pending_manager', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'draft'
  },

  validation: {
    clientToken: { type: String, required: true },
    clientValidatedAt: Date,
    clientSelectedSlot: Number,
    managerValidatedAt: Date,
    emailsSent: [{
      type: { type: String, enum: ['proposal', 'confirmation', 'reminder', 'cancellation'] },
      sentAt: Date,
      to: String
    }]
  },

  installationConfig: {
    type: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote' },
    estimatedDuration: { type: Number, default: 120 },
    phases: [{
      name: String,
      duration: Number,
      description: String,
      completed: { type: Boolean, default: false },
      completedAt: Date
    }],
    requirements: [String],
    meetingLink: String,
    address: String
  },

  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },

  internalNotes: String,
  clientNotes: String,

  reminders: [{
    type: { type: String, enum: ['24h', '1h', 'custom'] },
    scheduledFor: Date,
    sent: { type: Boolean, default: false },
    sentAt: Date
  }]
}, {
  timestamps: true
});

// Index
InstallationPlanningSchema.index({ contractId: 1 });
InstallationPlanningSchema.index({ commercialId: 1 });
InstallationPlanningSchema.index({ status: 1 });
InstallationPlanningSchema.index({ 'confirmedSlot.date': 1 });
InstallationPlanningSchema.index({ 'validation.clientToken': 1 });
InstallationPlanningSchema.index({ 'assignedTo.userId': 1 });

export default mongoose.model<IInstallationPlanning>('InstallationPlanning', InstallationPlanningSchema);

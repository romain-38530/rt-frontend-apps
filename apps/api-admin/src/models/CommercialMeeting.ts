import mongoose, { Schema, Document } from 'mongoose';

export type MeetingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type MeetingType = 'presentation' | 'demo' | 'follow_up' | 'closing';

export interface ICommercialMeeting extends Document {
  commercialId: mongoose.Types.ObjectId;
  leadCompanyId?: mongoose.Types.ObjectId;
  leadContactId?: mongoose.Types.ObjectId;
  // Informations du prospect (au cas où pas encore dans la base)
  prospectInfo: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    position?: string;
  };
  // Détails du RDV
  title: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  // Date et heure
  scheduledAt: Date;
  duration: number; // en minutes
  timezone: string;
  // Lien visio
  meetingLink?: string;
  meetingProvider?: 'google_meet' | 'zoom' | 'teams' | 'phone';
  // Suivi
  notes?: string;
  outcome?: string;
  nextSteps?: string;
  // Email tracking
  confirmationEmailSent: boolean;
  reminderEmailSent: boolean;
  // Source
  bookingToken?: string; // Token unique pour la réservation
  bookedViaEmail?: mongoose.Types.ObjectId; // Référence à l'email source
  bookedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommercialMeetingSchema = new Schema({
  commercialId: {
    type: Schema.Types.ObjectId,
    ref: 'CrmCommercial',
    required: true
  },
  leadCompanyId: {
    type: Schema.Types.ObjectId,
    ref: 'LeadCompany'
  },
  leadContactId: {
    type: Schema.Types.ObjectId,
    ref: 'LeadContact'
  },
  prospectInfo: {
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    position: String
  },
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['presentation', 'demo', 'follow_up', 'closing'],
    default: 'presentation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  timezone: { type: String, default: 'Europe/Paris' },
  meetingLink: String,
  meetingProvider: {
    type: String,
    enum: ['google_meet', 'zoom', 'teams', 'phone']
  },
  notes: String,
  outcome: String,
  nextSteps: String,
  confirmationEmailSent: { type: Boolean, default: false },
  reminderEmailSent: { type: Boolean, default: false },
  bookingToken: { type: String, unique: true, sparse: true },
  bookedViaEmail: { type: Schema.Types.ObjectId, ref: 'LeadEmail' },
  bookedAt: { type: Date, default: Date.now },
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
CommercialMeetingSchema.index({ commercialId: 1, scheduledAt: 1 });
CommercialMeetingSchema.index({ commercialId: 1, status: 1 });
CommercialMeetingSchema.index({ scheduledAt: 1 });
CommercialMeetingSchema.index({ bookingToken: 1 });
CommercialMeetingSchema.index({ leadCompanyId: 1 });
CommercialMeetingSchema.index({ 'prospectInfo.email': 1 });

export default mongoose.model<ICommercialMeeting>('CommercialMeeting', CommercialMeetingSchema);

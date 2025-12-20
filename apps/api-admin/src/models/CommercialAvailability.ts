import mongoose, { Schema, Document } from 'mongoose';

export interface ICommercialAvailability extends Document {
  commercialId: mongoose.Types.ObjectId;
  // Disponibilités récurrentes par jour de la semaine
  weeklySchedule: {
    dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ... 6 = Samedi
    slots: {
      startTime: string; // Format "HH:mm" (ex: "09:00")
      endTime: string;   // Format "HH:mm" (ex: "12:00")
    }[];
    isActive: boolean;
  }[];
  // Exceptions (jours fériés, congés, etc.)
  exceptions: {
    date: Date;
    type: 'unavailable' | 'custom';
    customSlots?: {
      startTime: string;
      endTime: string;
    }[];
    reason?: string;
  }[];
  // Configuration
  meetingDuration: number; // Durée en minutes (30 par défaut)
  bufferTime: number;      // Temps entre les RDV en minutes
  maxDaysInAdvance: number; // Combien de jours à l'avance on peut réserver
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommercialAvailabilitySchema = new Schema({
  commercialId: {
    type: Schema.Types.ObjectId,
    ref: 'CrmCommercial',
    required: true,
    unique: true
  },
  weeklySchedule: [{
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    slots: [{
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    }],
    isActive: { type: Boolean, default: true }
  }],
  exceptions: [{
    date: { type: Date, required: true },
    type: { type: String, enum: ['unavailable', 'custom'], default: 'unavailable' },
    customSlots: [{
      startTime: String,
      endTime: String
    }],
    reason: String
  }],
  meetingDuration: { type: Number, default: 30 },
  bufferTime: { type: Number, default: 15 },
  maxDaysInAdvance: { type: Number, default: 30 },
  timezone: { type: String, default: 'Europe/Paris' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

CommercialAvailabilitySchema.index({ commercialId: 1 });

export default mongoose.model<ICommercialAvailability>('CommercialAvailability', CommercialAvailabilitySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: string;
  companyId: string;
  type: 'route' | 'price' | 'carrier';
  criteria: {
    origins?: string[];
    destinations?: string[];
    cargoTypes?: string[];
    maxPrice?: number;
    minPrice?: number;
    carriers?: string[];
    departureDateFrom?: Date;
    departureDateTo?: Date;
  };
  frequency: 'instant' | 'daily' | 'weekly';
  active: boolean;
  lastTriggered?: Date;
  triggeredCount: number;
  notificationChannels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['route', 'price', 'carrier'],
    required: true
  },
  criteria: {
    origins: [String],
    destinations: [String],
    cargoTypes: [String],
    maxPrice: Number,
    minPrice: Number,
    carriers: [String],
    departureDateFrom: Date,
    departureDateTo: Date
  },
  frequency: {
    type: String,
    enum: ['instant', 'daily', 'weekly'],
    default: 'instant'
  },
  active: {
    type: Boolean,
    default: true
  },
  lastTriggered: Date,
  triggeredCount: {
    type: Number,
    default: 0
  },
  notificationChannels: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes
AlertSchema.index({ userId: 1, active: 1 });
AlertSchema.index({ companyId: 1 });
AlertSchema.index({ type: 1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);

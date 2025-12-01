import mongoose, { Document, Schema } from 'mongoose';

export interface IAlternativeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  dockId?: string;
}

export interface ISlotResponse {
  action: 'accept' | 'modify' | 'reject';
  reason?: string;
  alternativeSlot?: IAlternativeSlot;
  respondedAt: Date;
  respondedBy: string;
}

export interface ILoadingSlot extends Document {
  slotId: string;
  supplierId: string;
  orderId: string;
  proposedBy: 'system' | 'supplier' | 'industrial';
  date: Date;
  startTime: string;
  endTime: string;
  dockId?: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'modified' | 'confirmed';
  etaFromTracking?: Date;
  response?: ISlotResponse;
  createdAt: Date;
  updatedAt: Date;
}

const AlternativeSlotSchema = new Schema<IAlternativeSlot>({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  dockId: { type: String }
});

const SlotResponseSchema = new Schema<ISlotResponse>({
  action: { type: String, enum: ['accept', 'modify', 'reject'], required: true },
  reason: { type: String },
  alternativeSlot: { type: AlternativeSlotSchema },
  respondedAt: { type: Date, default: Date.now },
  respondedBy: { type: String, required: true }
});

const LoadingSlotSchema = new Schema<ILoadingSlot>(
  {
    slotId: {
      type: String,
      unique: true,
      required: true
    },
    supplierId: {
      type: String,
      required: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    proposedBy: {
      type: String,
      enum: ['system', 'supplier', 'industrial'],
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    dockId: {
      type: String
    },
    status: {
      type: String,
      enum: ['proposed', 'accepted', 'rejected', 'modified', 'confirmed'],
      default: 'proposed',
      index: true
    },
    etaFromTracking: {
      type: Date
    },
    response: {
      type: SlotResponseSchema
    }
  },
  {
    timestamps: true
  }
);

// Index composés pour les requêtes fréquentes
LoadingSlotSchema.index({ supplierId: 1, status: 1 });
LoadingSlotSchema.index({ orderId: 1, status: 1 });
LoadingSlotSchema.index({ date: 1, status: 1 });

// Génération automatique du slotId
LoadingSlotSchema.pre('save', async function (next) {
  if (this.isNew && !this.slotId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('LoadingSlot').countDocuments();
    this.slotId = `SLOT-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model<ILoadingSlot>('LoadingSlot', LoadingSlotSchema);

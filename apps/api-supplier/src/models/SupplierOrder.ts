import mongoose, { Document, Schema } from 'mongoose';

export interface ILoadingSlot {
  date: Date;
  startTime: string;
  endTime: string;
  dockId: string;
}

export interface IGoods {
  description: string;
  weight: number;
  pallets: number;
  volume: number;
  specialInstructions?: string;
}

export interface ITransportInfo {
  carrierId?: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
}

export interface IDocument {
  type: string;
  filename: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ITimelineEvent {
  status: string;
  timestamp: Date;
  actor: string;
  notes?: string;
}

export interface ISupplierOrder extends Document {
  orderId: string;
  supplierId: string;
  industrialId: string;
  status: 'to_prepare' | 'ready' | 'in_progress' | 'loaded' | 'dispute';
  loadingSlot?: ILoadingSlot;
  goods: IGoods;
  transportInfo: ITransportInfo;
  documents: IDocument[];
  timeline: ITimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const LoadingSlotSchema = new Schema<ILoadingSlot>({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  dockId: { type: String, required: true }
});

const GoodsSchema = new Schema<IGoods>({
  description: { type: String, required: true },
  weight: { type: Number, required: true },
  pallets: { type: Number, required: true },
  volume: { type: Number, required: true },
  specialInstructions: { type: String }
});

const TransportInfoSchema = new Schema<ITransportInfo>({
  carrierId: { type: String },
  vehicleType: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  licensePlate: { type: String }
});

const DocumentSchema = new Schema<IDocument>({
  type: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, required: true }
});

const TimelineEventSchema = new Schema<ITimelineEvent>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, required: true },
  notes: { type: String }
});

const SupplierOrderSchema = new Schema<ISupplierOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    supplierId: {
      type: String,
      required: true,
      index: true
    },
    industrialId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['to_prepare', 'ready', 'in_progress', 'loaded', 'dispute'],
      default: 'to_prepare',
      index: true
    },
    loadingSlot: {
      type: LoadingSlotSchema
    },
    goods: {
      type: GoodsSchema,
      required: true
    },
    transportInfo: {
      type: TransportInfoSchema,
      default: () => ({})
    },
    documents: [DocumentSchema],
    timeline: [TimelineEventSchema]
  },
  {
    timestamps: true
  }
);

// Index composés pour les requêtes fréquentes
SupplierOrderSchema.index({ supplierId: 1, status: 1 });
SupplierOrderSchema.index({ industrialId: 1, status: 1 });
SupplierOrderSchema.index({ 'loadingSlot.date': 1 });

// Ajout automatique d'un événement timeline lors de changement de statut
SupplierOrderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      actor: 'system',
      notes: `Status changed to ${this.status}`
    } as ITimelineEvent);
  }
  next();
});

export default mongoose.model<ISupplierOrder>('SupplierOrder', SupplierOrderSchema);

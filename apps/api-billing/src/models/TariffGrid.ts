import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightBracket {
  minWeight: number;
  maxWeight: number;
  pricePerKg?: number;
  flatRate?: number;
}

export interface IZoneTariff {
  zoneName: string;
  zoneCode: string;
  postalCodes: string[];
  weightBrackets: IWeightBracket[];
}

export interface ITariffOption {
  code: string;
  label: string;
  type: 'percentage' | 'flat' | 'per_unit';
  value: number;
  applicable: boolean;
}

export interface ITariffGrid extends Document {
  reference: string;
  name: string;
  carrier: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  validFrom: Date;
  validTo?: Date;
  zones: IZoneTariff[];
  fuelSurcharge: {
    type: 'percentage' | 'flat';
    value: number;
    appliedOn: 'base' | 'total';
  };
  options: ITariffOption[];
  currency: string;
  tva: number;
  status: 'draft' | 'active' | 'archived';
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const weightBracketSchema = new Schema({
  minWeight: { type: Number, required: true },
  maxWeight: { type: Number, required: true },
  pricePerKg: Number,
  flatRate: Number
});

const zoneTariffSchema = new Schema({
  zoneName: { type: String, required: true },
  zoneCode: { type: String, required: true },
  postalCodes: [String],
  weightBrackets: [weightBracketSchema]
});

const tariffOptionSchema = new Schema({
  code: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'flat', 'per_unit'], required: true },
  value: { type: Number, required: true },
  applicable: { type: Boolean, default: true }
});

const tariffGridSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  carrier: {
    id: { type: String, required: true },
    name: { type: String, required: true }
  },
  client: {
    id: String,
    name: String
  },
  validFrom: { type: Date, required: true },
  validTo: Date,
  zones: [zoneTariffSchema],
  fuelSurcharge: {
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    value: { type: Number, required: true },
    appliedOn: { type: String, enum: ['base', 'total'], default: 'base' }
  },
  options: [tariffOptionSchema],
  currency: { type: String, default: 'EUR' },
  tva: { type: Number, default: 20 },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  priority: { type: Number, default: 0 },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

tariffGridSchema.index({ reference: 1 });
tariffGridSchema.index({ 'carrier.id': 1, status: 1 });
tariffGridSchema.index({ validFrom: 1, validTo: 1 });

export const TariffGrid = mongoose.model<ITariffGrid>('TariffGrid', tariffGridSchema);

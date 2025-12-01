import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  legalName: string;
  registrationNumber: string;
  vatNumber?: string;
  type: 'shipper' | 'carrier' | 'broker' | 'warehouse' | 'supplier' | 'recipient';
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  modules: string[];
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema({
  name: { type: String, required: true },
  legalName: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  vatNumber: String,
  type: {
    type: String,
    enum: ['shipper', 'carrier', 'broker', 'warehouse', 'supplier', 'recipient'],
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  contact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'cancelled'],
    default: 'pending'
  },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  modules: [String],
  settings: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

CompanySchema.index({ name: 'text', legalName: 'text' });
CompanySchema.index({ status: 1 });
CompanySchema.index({ type: 1 });
CompanySchema.index({ verified: 1 });

export default mongoose.model<ICompany>('Company', CompanySchema);

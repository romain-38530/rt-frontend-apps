import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  companyId: mongoose.Types.ObjectId;
  plan: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  currency: string;
  modules: string[];
  limits: {
    users: number;
    orders: number;
    storage: number;
    apiCalls: number;
  };
  usage: {
    users: number;
    orders: number;
    storage: number;
    apiCalls: number;
  };
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise', 'custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'trial', 'past_due', 'cancelled', 'suspended'],
    default: 'trial'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  price: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  modules: [String],
  limits: {
    users: { type: Number, default: 5 },
    orders: { type: Number, default: 100 },
    storage: { type: Number, default: 1024 }, // MB
    apiCalls: { type: Number, default: 10000 }
  },
  usage: {
    users: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trialEndDate: Date,
  autoRenew: { type: Boolean, default: true },
  stripeCustomerId: String,
  stripeSubscriptionId: String
}, {
  timestamps: true
});

SubscriptionSchema.index({ companyId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ endDate: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

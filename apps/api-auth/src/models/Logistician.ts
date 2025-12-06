import mongoose, { Schema, Document } from 'mongoose';

export type LogisticianStatus = 'invited' | 'pending' | 'active' | 'suspended';
export type OrderAccessLevel = 'view' | 'edit' | 'sign' | 'full';
export type LogisticianRole = 'gestionnaire' | 'superviseur' | 'operateur';

export interface ILogisticianContact {
  name: string;
  email: string;
  phone: string;
  role: LogisticianRole;
  isPrimary: boolean;
}

export interface ILogisticianSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  defaultAccessLevel: OrderAccessLevel;
  canManageSuppliers: boolean;
  canManageRecipients: boolean;
  canViewBilling: boolean;
}

export interface ILogistician extends Document {
  logisticianId: string;
  userId: mongoose.Types.ObjectId;
  industrialId: string;
  industrialName: string;
  companyName: string;
  siret?: string;
  email: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contacts: ILogisticianContact[];
  status: LogisticianStatus;
  accessLevel: OrderAccessLevel;
  settings: ILogisticianSettings;
  invitedAt: Date;
  invitedBy: string;
  activatedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LogisticianContactSchema = new Schema<ILogisticianContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['gestionnaire', 'superviseur', 'operateur'], default: 'gestionnaire' },
  isPrimary: { type: Boolean, default: false },
});

const LogisticianSettingsSchema = new Schema({
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  defaultAccessLevel: { type: String, enum: ['view', 'edit', 'sign', 'full'], default: 'view' },
  canManageSuppliers: { type: Boolean, default: false },
  canManageRecipients: { type: Boolean, default: false },
  canViewBilling: { type: Boolean, default: false },
});

const LogisticianSchema = new Schema<ILogistician>({
  logisticianId: {
    type: String,
    required: true,
    unique: true,
    default: () => `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  industrialId: {
    type: String,
    required: true,
    index: true,
  },
  industrialName: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  siret: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'France' },
  },
  contacts: [LogisticianContactSchema],
  status: {
    type: String,
    enum: ['invited', 'pending', 'active', 'suspended'],
    default: 'invited',
  },
  accessLevel: {
    type: String,
    enum: ['view', 'edit', 'sign', 'full'],
    default: 'view',
  },
  settings: {
    type: LogisticianSettingsSchema,
    default: () => ({}),
  },
  invitedAt: {
    type: Date,
    default: Date.now,
  },
  invitedBy: {
    type: String,
    required: true,
  },
  activatedAt: Date,
  lastLoginAt: Date,
}, {
  timestamps: true,
});

// Index pour recherche rapide
LogisticianSchema.index({ industrialId: 1, status: 1 });
LogisticianSchema.index({ email: 1 });

export default mongoose.model<ILogistician>('Logistician', LogisticianSchema);

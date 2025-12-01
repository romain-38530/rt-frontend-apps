import mongoose, { Document, Schema } from 'mongoose';

export interface IContact {
  name: string;
  role: 'logistique' | 'production' | 'planning';
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ISettings {
  notifications: boolean;
  language: string;
}

export interface ISubscription {
  tier: 'free' | 'pro' | 'enterprise';
  validUntil: Date;
}

export interface ISupplier extends Document {
  supplierId: string;
  industrialId: string;
  companyName: string;
  siret: string;
  address: IAddress;
  contacts: IContact[];
  status: 'invited' | 'pending' | 'active' | 'incomplete' | 'suspended';
  invitationToken?: string;
  invitedAt: Date;
  activatedAt?: Date;
  settings: ISettings;
  subscription: ISubscription;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true },
  role: { type: String, enum: ['logistique', 'production', 'planning'], required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
});

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'France' }
});

const SettingsSchema = new Schema<ISettings>({
  notifications: { type: Boolean, default: true },
  language: { type: String, default: 'fr' }
});

const SubscriptionSchema = new Schema<ISubscription>({
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  validUntil: { type: Date, required: true }
});

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierId: {
      type: String,
      unique: true,
      required: true
    },
    industrialId: {
      type: String,
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true
    },
    siret: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      type: AddressSchema,
      required: true
    },
    contacts: [ContactSchema],
    status: {
      type: String,
      enum: ['invited', 'pending', 'active', 'incomplete', 'suspended'],
      default: 'invited',
      index: true
    },
    invitationToken: {
      type: String,
      unique: true,
      sparse: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    activatedAt: {
      type: Date
    },
    settings: {
      type: SettingsSchema,
      default: () => ({ notifications: true, language: 'fr' })
    },
    subscription: {
      type: SubscriptionSchema,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche
SupplierSchema.index({ companyName: 'text' });
SupplierSchema.index({ industrialId: 1, status: 1 });

// Génération automatique du supplierId
SupplierSchema.pre('save', async function (next) {
  if (this.isNew && !this.supplierId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);

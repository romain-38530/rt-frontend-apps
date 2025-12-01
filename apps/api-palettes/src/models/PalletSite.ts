import mongoose, { Schema, Document } from 'mongoose';

export type SitePriority = 'INTERNAL' | 'NETWORK' | 'EXTERNAL';

export interface IPalletSite extends Document {
  siteId: string;
  companyId: string;
  companyName: string;
  siteName: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  geofencing: {
    radius: number; // mètres
    strictMode: boolean;
  };
  quota: {
    maxDaily: number;
    currentDaily: number;
    maxWeekly: number;
    currentWeekly: number;
    lastResetDaily: Date;
    lastResetWeekly: Date;
  };
  capacities: {
    EURO_EPAL: number;
    EURO_EPAL_2: number;
    DEMI_PALETTE: number;
    PALETTE_PERDUE: number;
  };
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  priority: SitePriority;
  priorityScore: number; // 0-100
  active: boolean;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  stats: {
    totalReceived: number;
    totalDisputes: number;
    avgRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DayHoursSchema = {
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' },
  closed: { type: Boolean, default: false },
};

const PalletSiteSchema = new Schema<IPalletSite>({
  siteId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  companyId: {
    type: String,
    required: true,
    index: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  siteName: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'France' },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  geofencing: {
    radius: { type: Number, default: 100 },
    strictMode: { type: Boolean, default: false },
  },
  quota: {
    maxDaily: { type: Number, default: 100 },
    currentDaily: { type: Number, default: 0 },
    maxWeekly: { type: Number, default: 500 },
    currentWeekly: { type: Number, default: 0 },
    lastResetDaily: { type: Date, default: Date.now },
    lastResetWeekly: { type: Date, default: Date.now },
  },
  capacities: {
    EURO_EPAL: { type: Number, default: 1000 },
    EURO_EPAL_2: { type: Number, default: 500 },
    DEMI_PALETTE: { type: Number, default: 200 },
    PALETTE_PERDUE: { type: Number, default: 100 },
  },
  openingHours: {
    monday: DayHoursSchema,
    tuesday: DayHoursSchema,
    wednesday: DayHoursSchema,
    thursday: DayHoursSchema,
    friday: DayHoursSchema,
    saturday: { ...DayHoursSchema, closed: { type: Boolean, default: true } },
    sunday: { ...DayHoursSchema, closed: { type: Boolean, default: true } },
  },
  priority: {
    type: String,
    enum: ['INTERNAL', 'NETWORK', 'EXTERNAL'],
    default: 'NETWORK',
  },
  priorityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  contactEmail: String,
  contactPhone: String,
  notes: String,
  stats: {
    totalReceived: { type: Number, default: 0 },
    totalDisputes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 5 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PalletSiteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index géospatial pour recherches de proximité
PalletSiteSchema.index({ 'address.coordinates.latitude': 1, 'address.coordinates.longitude': 1 });
PalletSiteSchema.index({ active: 1, priority: 1 });

export default mongoose.model<IPalletSite>('PalletSite', PalletSiteSchema);

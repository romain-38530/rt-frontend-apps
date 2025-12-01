import mongoose, { Schema, Document } from 'mongoose';
import { PalletType } from './PalletCheque';

export interface ILedgerEntry {
  date: Date;
  delta: number;
  reason: string;
  chequeId?: string;
  newBalance: number;
  palletType: PalletType;
}

export interface IPalletLedger extends Document {
  companyId: string;
  companyName: string;
  companyType: 'transporteur' | 'industriel' | 'logisticien';
  balance: number;
  balances: {
    EURO_EPAL: number;
    EURO_EPAL_2: number;
    DEMI_PALETTE: number;
    PALETTE_PERDUE: number;
  };
  history: ILedgerEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>({
  date: { type: Date, default: Date.now },
  delta: { type: Number, required: true },
  reason: { type: String, required: true },
  chequeId: String,
  newBalance: { type: Number, required: true },
  palletType: {
    type: String,
    enum: ['EURO_EPAL', 'EURO_EPAL_2', 'DEMI_PALETTE', 'PALETTE_PERDUE'],
    required: true,
  },
});

const PalletLedgerSchema = new Schema<IPalletLedger>({
  companyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  companyType: {
    type: String,
    enum: ['transporteur', 'industriel', 'logisticien'],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  balances: {
    EURO_EPAL: { type: Number, default: 0 },
    EURO_EPAL_2: { type: Number, default: 0 },
    DEMI_PALETTE: { type: Number, default: 0 },
    PALETTE_PERDUE: { type: Number, default: 0 },
  },
  history: [LedgerEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PalletLedgerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Recalculer le solde total
  this.balance = this.balances.EURO_EPAL + this.balances.EURO_EPAL_2 +
                 this.balances.DEMI_PALETTE + this.balances.PALETTE_PERDUE;
  next();
});

// Index pour les recherches fréquentes
PalletLedgerSchema.index({ balance: 1 });
PalletLedgerSchema.index({ companyType: 1 });

export default mongoose.model<IPalletLedger>('PalletLedger', PalletLedgerSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  number: string;
  companyId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  stripeInvoiceId?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const InvoiceSchema = new Schema({
  number: { type: String, required: true, unique: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 20 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  dueDate: { type: Date, required: true },
  paidAt: Date,
  paymentMethod: String,
  stripeInvoiceId: String,
  refundedAmount: Number,
  refundedAt: Date,
  notes: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

InvoiceSchema.index({ companyId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });

// Auto-generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (!this.number) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.number = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

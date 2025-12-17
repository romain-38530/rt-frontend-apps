import mongoose, { Schema, Document } from 'mongoose';

export interface ICrmCommission extends Document {
  commercialId: mongoose.Types.ObjectId;
  type: 'conversion' | 'signature' | 'bonus' | 'recurring';
  leadCompanyId?: mongoose.Types.ObjectId;
  montant: number;
  devise: string;
  periode: string;  // Format: YYYY-MM
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  description?: string;
  dateValidation?: Date;
  datePaiement?: Date;
  validateurId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CrmCommissionSchema = new Schema({
  commercialId: { type: Schema.Types.ObjectId, ref: 'CrmCommercial', required: true },
  type: {
    type: String,
    enum: ['conversion', 'signature', 'bonus', 'recurring'],
    required: true
  },
  leadCompanyId: { type: Schema.Types.ObjectId, ref: 'LeadCompany' },
  montant: { type: Number, required: true },
  devise: { type: String, default: 'EUR' },
  periode: { type: String, required: true },  // YYYY-MM
  status: {
    type: String,
    enum: ['pending', 'validated', 'paid', 'cancelled'],
    default: 'pending'
  },
  description: String,
  dateValidation: Date,
  datePaiement: Date,
  validateurId: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

CrmCommissionSchema.index({ commercialId: 1 });
CrmCommissionSchema.index({ periode: 1 });
CrmCommissionSchema.index({ status: 1 });
CrmCommissionSchema.index({ type: 1 });

export default mongoose.model<ICrmCommission>('CrmCommission', CrmCommissionSchema);

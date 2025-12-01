import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IApiKey extends Document {
  name: string;
  key: string;
  keyHash: string;
  companyId: mongoose.Types.ObjectId;
  permissions: string[];
  rateLimit: number;
  status: 'active' | 'revoked' | 'expired';
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ApiKeySchema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  keyHash: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  permissions: [String],
  rateLimit: { type: Number, default: 1000 },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  lastUsedAt: Date,
  expiresAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revokedAt: Date,
  revokedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

ApiKeySchema.index({ companyId: 1 });
ApiKeySchema.index({ status: 1 });
ApiKeySchema.index({ key: 1 });

// Generate API key
ApiKeySchema.statics.generateKey = function(): string {
  return `rt_${uuidv4().replace(/-/g, '')}`;
};

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

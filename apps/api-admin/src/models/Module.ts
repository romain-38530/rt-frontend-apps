import mongoose, { Schema, Document } from 'mongoose';

export interface IModule extends Document {
  code: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  version: string;
  pricing: {
    type: 'included' | 'addon' | 'usage';
    price?: number;
    unit?: string;
  };
  dependencies: string[];
  permissions: string[];
  configSchema?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'beta', 'deprecated'],
    default: 'active'
  },
  version: { type: String, default: '1.0.0' },
  pricing: {
    type: { type: String, enum: ['included', 'addon', 'usage'], default: 'included' },
    price: Number,
    unit: String
  },
  dependencies: [String],
  permissions: [String],
  configSchema: Schema.Types.Mixed
}, {
  timestamps: true
});

export default mongoose.model<IModule>('Module', ModuleSchema);

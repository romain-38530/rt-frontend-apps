import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  companyId?: mongoose.Types.ObjectId;
  roles: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  activationToken?: string;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  avatar: String,
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  roles: [{ type: String, enum: ['super_admin', 'admin', 'manager', 'operator', 'viewer', 'api_user', 'commercial', 'pricing', 'support'] }],
  permissions: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended', 'deleted'],
    default: 'pending'
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  lastLoginAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  activationToken: String,
  activatedAt: Date
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });
UserSchema.index({ companyId: 1 });
UserSchema.index({ status: 1 });

export default mongoose.model<IUser>('User', UserSchema);

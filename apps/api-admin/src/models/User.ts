import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  companyId: mongoose.Types.ObjectId;
  roles: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  avatar: String,
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  roles: [{ type: String, enum: ['super_admin', 'admin', 'manager', 'operator', 'viewer', 'api_user'] }],
  permissions: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended', 'deleted'],
    default: 'pending'
  },
  lastLoginAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });
UserSchema.index({ companyId: 1 });
UserSchema.index({ status: 1 });

export default mongoose.model<IUser>('User', UserSchema);

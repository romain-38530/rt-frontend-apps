import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature' | 'promotion';
  target: 'all' | 'admins' | 'companies' | 'plan' | 'module';
  targetIds: string[];
  priority: number;
  active: boolean;
  startDate: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'warning', 'maintenance', 'feature', 'promotion'],
    default: 'info'
  },
  target: {
    type: String,
    enum: ['all', 'admins', 'companies', 'plan', 'module'],
    default: 'all'
  },
  targetIds: [String],
  priority: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

AnnouncementSchema.index({ active: 1 });
AnnouncementSchema.index({ startDate: 1 });
AnnouncementSchema.index({ endDate: 1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

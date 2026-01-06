/**
 * Modèle TrainingModule - Représente un module de formation SYMPHONI.A
 */
import mongoose, { Document, Schema } from 'mongoose';

export type Portal = 'industry' | 'transporter' | 'logistician' | 'supplier' | 'forwarder' | 'all';
export type ModuleStatus = 'draft' | 'published' | 'archived';
export type ContentType = 'video' | 'document' | 'quiz' | 'interactive';

export interface ILesson {
  lessonId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  contentUrl?: string;
  duration: number; // en minutes
  order: number;
}

export interface ITrainingModule extends Document {
  moduleId: string;
  title: string;
  description: string;
  category: string;
  portals: Portal[];           // Portails où ce module est disponible
  status: ModuleStatus;
  icon?: string;               // Emoji ou icône
  duration: number;            // Durée totale en minutes
  lessons: ILesson[];
  prerequisites?: string[];    // moduleIds requis avant
  tags?: string[];
  order: number;               // Pour le tri
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const LessonSchema = new Schema<ILesson>({
  lessonId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  contentType: { type: String, enum: ['video', 'document', 'quiz', 'interactive'], default: 'video' },
  contentUrl: String,
  duration: { type: Number, required: true, default: 10 },
  order: { type: Number, required: true, default: 0 }
}, { _id: false });

const TrainingModuleSchema = new Schema<ITrainingModule>({
  moduleId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  portals: [{ type: String, enum: ['industry', 'transporter', 'logistician', 'supplier', 'forwarder', 'all'], required: true }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  icon: String,
  duration: { type: Number, required: true, default: 30 },
  lessons: [LessonSchema],
  prerequisites: [String],
  tags: [String],
  order: { type: Number, default: 0 },
  createdBy: { type: String, required: true }
}, { timestamps: true });

TrainingModuleSchema.index({ portals: 1, status: 1 });
TrainingModuleSchema.index({ category: 1 });
TrainingModuleSchema.index({ order: 1 });

export default mongoose.model<ITrainingModule>('TrainingModule', TrainingModuleSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  botType: 'helpbot' | 'planif-ia' | 'routier' | 'quai-wms' | 'livraisons' | 'expedition' | 'freight-ia' | 'copilote' | 'all';
  tags: string[];
  order: number;
  active: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedFAQs: string[];
  relatedArticles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>({
  question: {
    type: String,
    required: true,
    index: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  botType: {
    type: String,
    required: true,
    enum: ['helpbot', 'planif-ia', 'routier', 'quai-wms', 'livraisons', 'expedition', 'freight-ia', 'copilote', 'all'],
    index: true,
  },
  tags: {
    type: [String],
    index: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  helpful: {
    type: Number,
    default: 0,
  },
  notHelpful: {
    type: Number,
    default: 0,
  },
  relatedFAQs: [{
    type: Schema.Types.ObjectId,
    ref: 'FAQ',
  }],
  relatedArticles: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeArticle',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

FAQSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Text search index
FAQSchema.index({ question: 'text', answer: 'text', tags: 'text' });

// Indexes for performance
FAQSchema.index({ botType: 1, active: 1, order: 1 });
FAQSchema.index({ category: 1, active: 1 });
FAQSchema.index({ helpful: -1 });

export default mongoose.model<IFAQ>('FAQ', FAQSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeArticle extends Document {
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  botTypes: Array<'helpbot' | 'planif-ia' | 'routier' | 'quai-wms' | 'livraisons' | 'expedition' | 'freight-ia' | 'copilote'>;
  author: string;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedArticles: string[];
  attachments: Array<{
    type: string;
    url: string;
    filename: string;
  }>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeArticleSchema = new Schema<IKnowledgeArticle>({
  title: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  tags: {
    type: [String],
    index: true,
  },
  botTypes: [{
    type: String,
    enum: ['helpbot', 'planif-ia', 'routier', 'quai-wms', 'livraisons', 'expedition', 'freight-ia', 'copilote'],
  }],
  author: {
    type: String,
    required: true,
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
  relatedArticles: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeArticle',
  }],
  attachments: [{
    type: String,
    url: String,
    filename: String,
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishedAt: Date,
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

KnowledgeArticleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Text search index
KnowledgeArticleSchema.index({ title: 'text', content: 'text', summary: 'text', tags: 'text' });

// Indexes for performance
KnowledgeArticleSchema.index({ category: 1, status: 1 });
KnowledgeArticleSchema.index({ botTypes: 1, status: 1 });
KnowledgeArticleSchema.index({ views: -1 });
KnowledgeArticleSchema.index({ helpful: -1 });

export default mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema);

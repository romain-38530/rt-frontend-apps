import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnostic extends Document {
  type: 'erp' | 'api' | 'tracking' | 'server' | 'database' | 'network';
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  responseTime: number; // milliseconds
  details: {
    endpoint?: string;
    statusCode?: number;
    errorMessage?: string;
    metadata?: any;
  };
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message?: string;
    duration?: number;
  }>;
  timestamp: Date;
  createdAt: Date;
}

const DiagnosticSchema = new Schema<IDiagnostic>({
  type: {
    type: String,
    required: true,
    enum: ['erp', 'api', 'tracking', 'server', 'database', 'network'],
    index: true,
  },
  service: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['healthy', 'degraded', 'down', 'maintenance'],
    index: true,
  },
  responseTime: {
    type: Number,
    required: true,
  },
  details: {
    endpoint: String,
    statusCode: Number,
    errorMessage: String,
    metadata: Schema.Types.Mixed,
  },
  checks: [{
    name: String,
    status: {
      type: String,
      enum: ['pass', 'fail', 'warning'],
    },
    message: String,
    duration: Number,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for performance
DiagnosticSchema.index({ service: 1, timestamp: -1 });
DiagnosticSchema.index({ type: 1, status: 1, timestamp: -1 });
DiagnosticSchema.index({ timestamp: -1 });

// TTL index - automatically delete diagnostics older than 30 days
DiagnosticSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<IDiagnostic>('Diagnostic', DiagnosticSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  challengeId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  target: number;
  prizes: Array<{
    rank: number;
    amount: number;
    description: string;
  }>;
  ranking: Array<{
    agentId: mongoose.Types.ObjectId;
    score: number;
    rank: number;
    lastUpdated: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  challengeId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  target: {
    type: Number,
    required: true
  },
  prizes: [{
    rank: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  ranking: [{
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true
    },
    score: {
      type: Number,
      required: true,
      default: 0
    },
    rank: {
      type: Number,
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Pre-save hook to generate challengeId
ChallengeSchema.pre('save', async function(next) {
  if (!this.challengeId) {
    const year = new Date().getFullYear();
    const count = await Challenge.countDocuments({ challengeId: new RegExp(`^CHL-${year}`) });
    this.challengeId = `CHL-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
ChallengeSchema.index({ challengeId: 1 });
ChallengeSchema.index({ status: 1 });
ChallengeSchema.index({ startDate: 1, endDate: 1 });

const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;

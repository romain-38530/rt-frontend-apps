/**
 * Modèle pour les tokens de réinitialisation de mot de passe
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // Hash bcrypt du token
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 heure
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index TTL pour auto-suppression après expiration
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index pour recherche rapide par userId
passwordResetTokenSchema.index({ userId: 1 });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
export default PasswordResetToken;

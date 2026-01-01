/**
 * Modèle pour les refresh tokens
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // Hash du token
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  revoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: String,
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Index TTL pour auto-suppression après expiration
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index pour recherche rapide
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ token: 1 });

// Méthode pour vérifier si le token est valide
refreshTokenSchema.methods.isValid = function(): boolean {
  return !this.revoked && this.expiresAt > new Date();
};

// Méthode statique pour révoquer tous les tokens d'un utilisateur
refreshTokenSchema.statics.revokeAllForUser = async function(userId: mongoose.Types.ObjectId, reason: string): Promise<number> {
  const result = await this.updateMany(
    { userId, revoked: false },
    { revoked: true, revokedAt: new Date(), revokedReason: reason }
  );
  return result.modifiedCount;
};

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export default RefreshToken;

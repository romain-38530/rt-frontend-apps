/**
 * Modèle PortalInvitation - Invitation pour accès portail expéditeur/destinataire
 */
import mongoose, { Document, Schema } from 'mongoose';

export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired';
export type PortalRole = 'supplier' | 'recipient';

export interface IPortalInvitation extends Document {
  invitationId: string;
  orderId: string;
  email: string;
  phone?: string;
  contactName: string;
  role: PortalRole;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  userId?: string;
  invitedBy: string;
  portalUrl?: string;
}

const PortalInvitationSchema = new Schema<IPortalInvitation>({
  invitationId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  phone: String,
  contactName: { type: String, required: true },
  role: { type: String, enum: ['supplier', 'recipient'], required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'accepted', 'expired'],
    default: 'pending'
  },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: Date,
  userId: String,
  invitedBy: { type: String, required: true },
  portalUrl: String
}, { timestamps: true });

// Index for finding invitations by email
PortalInvitationSchema.index({ email: 1, status: 1 });
// Index for token lookup (for accepting invitations)
PortalInvitationSchema.index({ token: 1 });

export default mongoose.model<IPortalInvitation>('PortalInvitation', PortalInvitationSchema);

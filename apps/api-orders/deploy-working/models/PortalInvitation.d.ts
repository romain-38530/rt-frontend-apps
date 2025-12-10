/**
 * Modèle PortalInvitation - Invitation pour accès portail expéditeur/destinataire
 */
import mongoose, { Document } from 'mongoose';
export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired';
export type PortalRole = 'supplier' | 'recipient' | 'logistician' | 'carrier';
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
declare const _default: mongoose.Model<IPortalInvitation, {}, {}, {}, mongoose.Document<unknown, {}, IPortalInvitation, {}, {}> & IPortalInvitation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PortalInvitation.d.ts.map
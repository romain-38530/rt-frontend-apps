/**
 * Modèle DispatchChain - Chaîne d'affectation SYMPHONI.A
 * Gère le processus d'envoi séquentiel aux transporteurs
 */
import mongoose, { Document } from 'mongoose';
export type DispatchAttemptStatus = 'pending' | 'sent' | 'accepted' | 'refused' | 'timeout' | 'skipped';
export interface IDispatchAttempt {
    carrierId: string;
    carrierName: string;
    position: number;
    status: DispatchAttemptStatus;
    sentAt?: Date;
    respondedAt?: Date;
    expiresAt?: Date;
    reminderSentAt?: Date;
    responseDelayMinutes: number;
    refusalReason?: string;
    skipReason?: string;
    notificationChannels: ('email' | 'sms' | 'portal')[];
    notificationsSent: {
        channel: 'email' | 'sms' | 'portal';
        sentAt: Date;
        status: 'sent' | 'delivered' | 'failed';
    }[];
    proposedPrice?: number;
    finalPrice?: number;
}
export interface IDispatchChain extends Document {
    chainId: string;
    orderId: string;
    orderReference: string;
    industrialId: string;
    laneId?: string;
    laneName?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';
    assignedCarrierId?: string;
    assignedCarrierName?: string;
    assignedAt?: Date;
    attempts: IDispatchAttempt[];
    currentAttemptIndex: number;
    maxAttempts: number;
    escalation?: {
        escalatedAt: Date;
        affretiaOrderId?: string;
        status: 'pending' | 'in_progress' | 'assigned' | 'failed';
        assignedCarrierId?: string;
        assignedCarrierName?: string;
        assignedAt?: Date;
        proposedPrice?: number;
    };
    config: {
        autoEscalate: boolean;
        notifyIndustrial: boolean;
        requirePriceConfirmation: boolean;
    };
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDispatchChain, {}, {}, {}, mongoose.Document<unknown, {}, IDispatchChain, {}, {}> & IDispatchChain & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=DispatchChain.d.ts.map
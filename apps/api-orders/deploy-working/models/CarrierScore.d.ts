/**
 * Modèle CarrierScore - Scoring transporteur SYMPHONI.A
 * Évalue la performance des transporteurs après chaque transport
 */
import mongoose, { Document } from 'mongoose';
export interface IScoreCriteria {
    name: string;
    weight: number;
    score: number;
    comment?: string;
}
export interface ICarrierOrderScore extends Document {
    scoreId: string;
    orderId: string;
    orderReference: string;
    carrierId: string;
    carrierName: string;
    industrialId: string;
    criteria: {
        pickupPunctuality: IScoreCriteria;
        deliveryPunctuality: IScoreCriteria;
        appointmentRespect: IScoreCriteria;
        trackingReactivity: IScoreCriteria;
        podDelay: IScoreCriteria;
        incidentManagement: IScoreCriteria;
        communication: IScoreCriteria;
    };
    finalScore: number;
    calculationData: {
        plannedPickupTime: Date;
        actualPickupTime?: Date;
        pickupDelayMinutes?: number;
        plannedDeliveryTime: Date;
        actualDeliveryTime?: Date;
        deliveryDelayMinutes?: number;
        trackingUpdatesCount: number;
        expectedTrackingUpdates: number;
        podUploadedAt?: Date;
        podDelayHours?: number;
        incidentsCount: number;
        incidentsResolved: number;
    };
    bonusMalus: {
        type: 'bonus' | 'malus';
        value: number;
        reason: string;
    }[];
    industrialFeedback?: {
        rating: 1 | 2 | 3 | 4 | 5;
        comment?: string;
        submittedAt: Date;
    };
    impactOnGlobalScore: number;
    createdAt: Date;
}
export interface ICarrierGlobalScore extends Document {
    carrierId: string;
    carrierName: string;
    globalScore: number;
    recentScores: {
        orderId: string;
        score: number;
        date: Date;
    }[];
    stats: {
        totalTransports: number;
        averageScore: number;
        trendLastMonth: number;
        acceptanceRate: number;
        punctualityRate: number;
        podDelayAverage: number;
        incidentRate: number;
    };
    badges: {
        type: 'gold' | 'silver' | 'bronze' | 'verified' | 'preferred';
        earnedAt: Date;
        expiresAt?: Date;
    }[];
    alerts: {
        type: 'score_drop' | 'incident_spike' | 'pod_delay';
        triggeredAt: Date;
        resolved: boolean;
        resolvedAt?: Date;
    }[];
    lastCalculatedAt: Date;
    updatedAt: Date;
}
export declare const CarrierOrderScore: mongoose.Model<ICarrierOrderScore, {}, {}, {}, mongoose.Document<unknown, {}, ICarrierOrderScore, {}, {}> & ICarrierOrderScore & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const CarrierGlobalScore: mongoose.Model<ICarrierGlobalScore, {}, {}, {}, mongoose.Document<unknown, {}, ICarrierGlobalScore, {}, {}> & ICarrierGlobalScore & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=CarrierScore.d.ts.map
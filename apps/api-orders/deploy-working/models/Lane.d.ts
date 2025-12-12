/**
 * Modèle Lane - Lignes de transport SYMPHONI.A
 * Représente une ligne de transport avec ses transporteurs préférentiels
 */
import mongoose, { Document } from 'mongoose';
export interface ILaneCarrier {
    carrierId: string;
    carrierName: string;
    position: number;
    contact?: {
        email?: string;
        phone?: string;
        contactName?: string;
    };
    priceGrid?: {
        basePrice: number;
        pricePerKm?: number;
        pricePerKg?: number;
        pricePerPalette?: number;
        currency: string;
    };
    constraints?: string[];
    minScore: number;
    responseDelayMinutes: number;
    isActive: boolean;
    lastUsed?: Date;
    successRate?: number;
}
export interface ILane extends Document {
    laneId: string;
    industrialId: string;
    name: string;
    description?: string;
    origin: {
        city?: string;
        postalCodePrefix?: string;
        region?: string;
        country: string;
        coordinates?: {
            latitude: number;
            longitude: number;
            radiusKm: number;
        };
    };
    destination: {
        city?: string;
        postalCodePrefix?: string;
        region?: string;
        country: string;
        coordinates?: {
            latitude: number;
            longitude: number;
            radiusKm: number;
        };
    };
    merchandiseTypes?: string[];
    requiredConstraints?: string[];
    carriers: ILaneCarrier[];
    dispatchConfig: {
        autoDispatch: boolean;
        escalateToAffretia: boolean;
        maxAttempts: number;
        defaultResponseDelayMinutes: number;
        notificationChannels: ('email' | 'sms' | 'portal')[];
    };
    stats: {
        totalOrders: number;
        successfulOrders: number;
        escalatedOrders: number;
        averageResponseTime: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
declare const _default: mongoose.Model<ILane, {}, {}, {}, mongoose.Document<unknown, {}, ILane, {}, {}> & ILane & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Lane.d.ts.map
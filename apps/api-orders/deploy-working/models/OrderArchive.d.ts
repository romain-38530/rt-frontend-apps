/**
 * Modèle OrderArchive - Archivage légal 10 ans SYMPHONI.A
 * Conservation des preuves de transport conformément à la réglementation
 */
import mongoose, { Document } from 'mongoose';
export interface IArchiveDocument {
    documentId: string;
    type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'ecmr' | 'other';
    filename: string;
    mimeType: string;
    size: number;
    checksum: string;
    s3Key: string;
    uploadedAt: Date;
    ocrData?: Record<string, any>;
    signatures?: {
        role: 'driver' | 'sender' | 'receiver';
        signedAt: Date;
        signatureType: 'manual' | 'digital' | 'eidas';
        signatureData?: string;
    }[];
}
export interface IOrderArchive extends Document {
    archiveId: string;
    orderId: string;
    orderReference: string;
    industrialId: string;
    orderSnapshot: {
        pickupAddress: Record<string, any>;
        deliveryAddress: Record<string, any>;
        dates: Record<string, any>;
        goods: Record<string, any>;
        constraints: any[];
        carrierId?: string;
        carrierName?: string;
        finalPrice?: number;
        currency: string;
    };
    documents: IArchiveDocument[];
    timeline: {
        eventType: string;
        timestamp: Date;
        description: string;
    }[];
    carrierScore?: {
        finalScore: number;
        criteria: Record<string, number>;
    };
    archiveMetadata: {
        archivedAt: Date;
        archivedBy: string;
        archiveVersion: string;
        legalRetentionYears: number;
        expiresAt: Date;
        storageClass: 'standard' | 'glacier' | 'deep_archive';
        s3Bucket: string;
        encryptionType: 'AES256' | 'aws:kms';
    };
    integrity: {
        checksum: string;
        calculatedAt: Date;
        verified: boolean;
        lastVerifiedAt?: Date;
    };
    accessLog: {
        accessedAt: Date;
        accessedBy: string;
        action: 'view' | 'download' | 'verify';
        ip?: string;
    }[];
    status: 'active' | 'expired' | 'destroyed';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOrderArchive, {}, {}, {}, mongoose.Document<unknown, {}, IOrderArchive, {}, {}> & IOrderArchive & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=OrderArchive.d.ts.map
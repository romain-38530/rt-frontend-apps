/**
 * Modèle Document - Gestion des documents de transport SYMPHONI.A
 * CMR, BL, POD, Factures, Certificats, etc.
 */
import mongoose, { Document as MongoDocument } from 'mongoose';
export type DocumentType = 'cmr' | 'bl' | 'pod' | 'invoice' | 'packing_list' | 'certificate' | 'customs' | 'photo' | 'damage_report' | 'other';
export type DocumentStatus = 'pending' | 'validated' | 'rejected' | 'archived';
export interface IDocument extends MongoDocument {
    documentId: string;
    orderId: string;
    orderReference: string;
    type: DocumentType;
    status: DocumentStatus;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key?: string;
    s3Bucket?: string;
    url?: string;
    uploadedBy: {
        id: string;
        name: string;
        role: 'carrier' | 'driver' | 'supplier' | 'recipient' | 'industrial' | 'system';
    };
    uploadedAt: Date;
    validatedBy?: {
        id: string;
        name: string;
        role: string;
    };
    validatedAt?: Date;
    rejectionReason?: string;
    signature?: {
        signedBy: string;
        signedAt: Date;
        signatureData: string;
        ipAddress?: string;
        deviceInfo?: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDocument, {}, {}, {}, mongoose.Document<unknown, {}, IDocument, {}, {}> & IDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Document.d.ts.map
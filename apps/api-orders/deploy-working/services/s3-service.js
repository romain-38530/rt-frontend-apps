"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service S3 - SYMPHONI.A
 * Génération de pre-signed URLs pour upload/download direct
 */
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const S3_BUCKET = process.env.S3_BUCKET || 'rt-symphonia-documents';
const S3_REGION = process.env.AWS_REGION || 'eu-central-1';
const s3Client = new client_s3_1.S3Client({
    region: S3_REGION,
    // Credentials are loaded from environment or IAM role
});
class S3Service {
    /**
     * Génère une pre-signed URL pour upload direct vers S3
     */
    static async getUploadUrl(params) {
        const fileId = (0, uuid_1.v4)();
        const extension = params.fileName.split('.').pop() || 'bin';
        const s3Key = `documents/${params.orderId}/${params.documentType}/${fileId}.${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            ContentType: params.contentType,
            Metadata: {
                'order-id': params.orderId,
                'document-type': params.documentType,
                'original-filename': encodeURIComponent(params.fileName),
                'uploaded-by-id': params.uploadedBy.id,
                'uploaded-by-name': encodeURIComponent(params.uploadedBy.name),
                'uploaded-by-role': params.uploadedBy.role
            }
        });
        const expiresIn = 3600; // 1 hour
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
        return {
            uploadUrl,
            s3Key,
            s3Bucket: S3_BUCKET,
            expiresIn
        };
    }
    /**
     * Génère une pre-signed URL pour download depuis S3
     */
    static async getDownloadUrl(s3Key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
    }
    /**
     * Supprime un fichier de S3
     */
    static async deleteFile(s3Key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key
            });
            await s3Client.send(command);
            return true;
        }
        catch (error) {
            console.error('[S3Service] Delete error:', error);
            return false;
        }
    }
    /**
     * Génère l'URL publique d'un fichier (si le bucket est public)
     * Sinon utiliser getDownloadUrl pour une URL pré-signée
     */
    static getPublicUrl(s3Key) {
        return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
    }
    /**
     * Génère des URLs pour archivage (copie vers un préfixe archive)
     */
    static getArchiveKey(originalKey) {
        return originalKey.replace('documents/', 'archives/');
    }
}
exports.default = S3Service;
//# sourceMappingURL=s3-service.js.map
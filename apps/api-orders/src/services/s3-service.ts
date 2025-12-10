/**
 * Service S3 - SYMPHONI.A
 * Génération de pre-signed URLs pour upload/download direct
 */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const S3_BUCKET = process.env.S3_BUCKET || 'rt-symphonia-documents';
const S3_REGION = process.env.AWS_REGION || 'eu-central-1';

const s3Client = new S3Client({
  region: S3_REGION,
  // Credentials are loaded from environment or IAM role
});

interface UploadUrlParams {
  orderId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
  uploadedBy: {
    id: string;
    name: string;
    role: string;
  };
}

interface UploadUrlResult {
  uploadUrl: string;
  s3Key: string;
  s3Bucket: string;
  expiresIn: number;
}

class S3Service {
  /**
   * Génère une pre-signed URL pour upload direct vers S3
   */
  static async getUploadUrl(params: UploadUrlParams): Promise<UploadUrlResult> {
    const fileId = uuidv4();
    const extension = params.fileName.split('.').pop() || 'bin';
    const s3Key = `documents/${params.orderId}/${params.documentType}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
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
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

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
  static async getDownloadUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Supprime un fichier de S3
   */
  static async deleteFile(s3Key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('[S3Service] Delete error:', error);
      return false;
    }
  }

  /**
   * Génère l'URL publique d'un fichier (si le bucket est public)
   * Sinon utiliser getDownloadUrl pour une URL pré-signée
   */
  static getPublicUrl(s3Key: string): string {
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
  }

  /**
   * Génère des URLs pour archivage (copie vers un préfixe archive)
   */
  static getArchiveKey(originalKey: string): string {
    return originalKey.replace('documents/', 'archives/');
  }
}

export default S3Service;

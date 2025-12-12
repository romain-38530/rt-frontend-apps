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
declare class S3Service {
    /**
     * Génère une pre-signed URL pour upload direct vers S3
     */
    static getUploadUrl(params: UploadUrlParams): Promise<UploadUrlResult>;
    /**
     * Génère une pre-signed URL pour download depuis S3
     */
    static getDownloadUrl(s3Key: string, expiresIn?: number): Promise<string>;
    /**
     * Supprime un fichier de S3
     */
    static deleteFile(s3Key: string): Promise<boolean>;
    /**
     * Génère l'URL publique d'un fichier (si le bucket est public)
     * Sinon utiliser getDownloadUrl pour une URL pré-signée
     */
    static getPublicUrl(s3Key: string): string;
    /**
     * Génère des URLs pour archivage (copie vers un préfixe archive)
     */
    static getArchiveKey(originalKey: string): string;
}
export default S3Service;
//# sourceMappingURL=s3-service.d.ts.map
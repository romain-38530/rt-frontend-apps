/**
 * DocumentUpload - Composant d'upload de documents avec S3 SYMPHONI.A
 * Upload direct vers S3 via pre-signed URL
 */
import React, { useState, useRef } from 'react';
import { ordersApi } from '../lib/api';

type DocumentType = 'cmr' | 'bl' | 'pod' | 'invoice' | 'photo' | 'damage_report' | 'other';

interface DocumentUploadProps {
  orderId: string;
  documentType: DocumentType;
  onSuccess: (documentId: string) => void;
  onError?: (error: string) => void;
  label?: string;
  acceptedTypes?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  orderId,
  documentType,
  onSuccess,
  onError,
  label,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png,.tiff'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentLabels: Record<DocumentType, string> = {
    cmr: 'CMR (Lettre de voiture)',
    bl: 'Bon de livraison',
    pod: 'Preuve de livraison (POD)',
    invoice: 'Facture',
    photo: 'Photo',
    damage_report: 'Rapport de dommages',
    other: 'Document'
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(10);
    setError('');

    try {
      // Step 1: Get pre-signed URL from API
      setProgress(20);
      const urlResponse = await ordersApi.getDocumentUploadUrl(orderId, {
        type: documentType,
        fileName: file.name,
        contentType: file.type
      });

      if (!urlResponse.success) {
        throw new Error(urlResponse.error || 'Impossible de generer l\'URL d\'upload');
      }

      const { uploadUrl, s3Key, s3Bucket } = urlResponse;
      setProgress(40);

      // Step 2: Upload file directly to S3
      const uploadSuccess = await ordersApi.uploadToS3(uploadUrl, file);
      if (!uploadSuccess) {
        throw new Error('Echec de l\'upload vers S3');
      }
      setProgress(70);

      // Step 3: Get location if available
      let location: { latitude: number; longitude: number; address?: string } | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch {
        // Geolocation not available, continue without it
      }

      // Step 4: Confirm upload in database
      setProgress(85);
      const confirmResponse = await ordersApi.confirmDocumentUpload(orderId, {
        type: documentType,
        fileName: s3Key.split('/').pop() || file.name,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key,
        s3Bucket,
        location
      });

      if (!confirmResponse.success) {
        throw new Error(confirmResponse.error || 'Erreur lors de l\'enregistrement du document');
      }

      setProgress(100);
      onSuccess(confirmResponse.document?.documentId || '');

      // Reset after success
      setTimeout(() => {
        setProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'upload';
      setError(errorMessage);
      onError?.(errorMessage);
      setProgress(0);
      setIsUploading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    marginBottom: '16px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  };

  const uploadAreaStyle: React.CSSProperties = {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: isUploading ? 'not-allowed' : 'pointer',
    backgroundColor: isUploading ? '#f9fafb' : '#ffffff',
    transition: 'all 0.2s ease'
  };

  const inputStyle: React.CSSProperties = {
    display: 'none'
  };

  const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '12px'
  };

  const progressBarStyle: React.CSSProperties = {
    width: `${progress}%`,
    height: '100%',
    backgroundColor: progress === 100 ? '#10b981' : '#3b82f6',
    transition: 'width 0.3s ease'
  };

  const errorStyle: React.CSSProperties = {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '8px'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '32px',
    marginBottom: '8px'
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {label || documentLabels[documentType]}
      </label>

      <div
        style={uploadAreaStyle}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={isUploading}
          style={inputStyle}
        />

        {isUploading ? (
          <>
            <div style={iconStyle}>
              {progress === 100 ? '✅' : '⏳'}
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              {progress === 100 ? 'Upload termine !' : `Upload en cours... ${progress}%`}
            </p>
            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle} />
            </div>
          </>
        ) : (
          <>
            <div style={iconStyle}>📎</div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Cliquez ou deposez un fichier
            </p>
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '12px' }}>
              PDF, JPG, PNG, TIFF (max 10 MB)
            </p>
          </>
        )}
      </div>

      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default DocumentUpload;

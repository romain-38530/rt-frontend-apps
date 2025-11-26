/**
 * Composant d'upload de fichiers avec drag & drop
 * Supporte upload simple et multiple
 */

import React, { useState, useRef, useCallback } from 'react';
import type { DocumentType } from '@rt/contracts/src/types/documents';
import DocumentsService from '@rt/utils/lib/services/documents-service';

interface FileUploadProps {
  orderId: string;
  defaultType?: DocumentType;
  multiple?: boolean;
  autoOCR?: boolean;
  onUploadComplete?: (documents: any[]) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // En octets
}

interface FileWithProgress {
  file: File;
  type: DocumentType;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  documentId?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  orderId,
  defaultType = 'other',
  multiple = true,
  autoOCR = true,
  onUploadComplete,
  onUploadError,
  acceptedTypes,
  maxFileSize = 50 * 1024 * 1024, // 50MB par défaut
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion du drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFilesSelected(droppedFiles);
    },
    [orderId, defaultType]
  );

  // Gestion de la sélection de fichiers
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      handleFilesSelected(selectedFiles);
    },
    [orderId, defaultType]
  );

  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      const newFiles: FileWithProgress[] = selectedFiles.map((file) => {
        const validation = DocumentsService.validateFile(file);
        return {
          file,
          type: defaultType,
          progress: 0,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error,
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Lancer l'upload automatiquement
      newFiles.forEach((fileWithProgress, index) => {
        if (fileWithProgress.status === 'pending') {
          uploadFile(files.length + index);
        }
      });
    },
    [orderId, defaultType, files.length]
  );

  // Upload d'un fichier
  const uploadFile = async (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].status = 'uploading';
      updated[index].progress = 0;
      return updated;
    });

    try {
      const fileWithProgress = files[index];

      // Simuler la progression (en pratique, utiliser XMLHttpRequest pour avoir la vraie progression)
      const progressInterval = setInterval(() => {
        setFiles((prev) => {
          const updated = [...prev];
          if (updated[index].progress < 90) {
            updated[index].progress += 10;
          }
          return updated;
        });
      }, 200);

      const document = await DocumentsService.uploadDocument({
        orderId,
        type: fileWithProgress.type,
        file: fileWithProgress.file,
        performOCR: autoOCR && DocumentsService.isOCRSupported(fileWithProgress.file.type),
      });

      clearInterval(progressInterval);

      setFiles((prev) => {
        const updated = [...prev];
        updated[index].status = 'completed';
        updated[index].progress = 100;
        updated[index].documentId = document.id;
        return updated;
      });

      if (onUploadComplete) {
        onUploadComplete([document]);
      }
    } catch (error: any) {
      setFiles((prev) => {
        const updated = [...prev];
        updated[index].status = 'error';
        updated[index].error = error.message || 'Erreur lors de l\'upload';
        return updated;
      });

      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  // Retirer un fichier de la liste
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Changer le type d'un fichier
  const changeFileType = (index: number, type: DocumentType) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].type = type;
      return updated;
    });
  };

  // Ouvrir le sélecteur de fichiers
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
  };

  const dropzoneStyle: React.CSSProperties = {
    border: `2px dashed ${isDragging ? '#667eea' : '#d1d5db'}`,
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: isDragging ? '#eef2ff' : '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const fileListStyle: React.CSSProperties = {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const fileItemStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  return (
    <div style={containerStyle}>
      {/* Zone de drop */}
      <div
        style={dropzoneStyle}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {isDragging ? '📥' : '📎'}
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          ou cliquez pour sélectionner {multiple ? 'des fichiers' : 'un fichier'}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          Formats acceptés: PDF, JPEG, PNG, TIFF, Word, Excel
          <br />
          Taille maximale: {DocumentsService.formatFileSize(maxFileSize)}
        </div>
      </div>

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes?.join(',') || 'image/*,application/pdf,.doc,.docx,.xls,.xlsx'}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div style={fileListStyle}>
          {files.map((fileWithProgress, index) => (
            <div key={index} style={fileItemStyle}>
              {/* Icône de statut */}
              <div style={{ fontSize: '32px', flexShrink: 0 }}>
                {fileWithProgress.status === 'pending' && '⏳'}
                {fileWithProgress.status === 'uploading' && '⏫'}
                {fileWithProgress.status === 'completed' && '✅'}
                {fileWithProgress.status === 'error' && '❌'}
              </div>

              {/* Informations du fichier */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fileWithProgress.file.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>
                    {DocumentsService.formatFileSize(fileWithProgress.file.size)}
                  </span>
                </div>

                {/* Sélecteur de type */}
                {fileWithProgress.status !== 'completed' && fileWithProgress.status !== 'error' && (
                  <select
                    value={fileWithProgress.type}
                    onChange={(e) => changeFileType(index, e.target.value as DocumentType)}
                    disabled={fileWithProgress.status === 'uploading'}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#374151',
                    }}
                  >
                    <option value="cmr">CMR</option>
                    <option value="invoice">Facture</option>
                    <option value="delivery_note">Bon de livraison</option>
                    <option value="packing_list">Liste de colisage</option>
                    <option value="pod">Preuve de livraison</option>
                    <option value="customs">Douane</option>
                    <option value="insurance">Assurance</option>
                    <option value="contract">Contrat</option>
                    <option value="other">Autre</option>
                  </select>
                )}

                {/* Barre de progression */}
                {fileWithProgress.status === 'uploading' && (
                  <div
                    style={{
                      marginTop: '8px',
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#667eea',
                        width: `${fileWithProgress.progress}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                )}

                {/* Message d'erreur */}
                {fileWithProgress.status === 'error' && fileWithProgress.error && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                    {fileWithProgress.error}
                  </div>
                )}

                {/* Message de succès */}
                {fileWithProgress.status === 'completed' && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#10b981' }}>
                    Upload terminé
                    {autoOCR && DocumentsService.isOCRSupported(fileWithProgress.file.type) && ' - OCR en cours...'}
                  </div>
                )}
              </div>

              {/* Bouton supprimer */}
              {(fileWithProgress.status === 'pending' ||
                fileWithProgress.status === 'error' ||
                fileWithProgress.status === 'completed') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#6b7280',
                    flexShrink: 0,
                  }}
                  title="Supprimer"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Résumé */}
      {files.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          <span>
            {files.filter((f) => f.status === 'completed').length} / {files.length} fichiers uploadés
          </span>
          {files.some((f) => f.status === 'error') && (
            <span style={{ color: '#ef4444' }}>
              {files.filter((f) => f.status === 'error').length} erreur(s)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

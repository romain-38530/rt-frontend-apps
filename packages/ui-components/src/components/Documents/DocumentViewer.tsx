/**
 * Visualiseur de document avec aperçu et métadonnées
 * Supporte images et PDFs
 */

import React, { useState } from 'react';
import type { Document } from '@rt/contracts';
import DocumentsService from '@rt/utils/lib/services/documents-service';

interface DocumentViewerProps {
  document: Document;
  onClose?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onVerify?: () => void;
  onTriggerOCR?: () => void;
  showOCRResults?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onDownload,
  onDelete,
  onVerify,
  onTriggerOCR,
  showOCRResults = true,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata' | 'ocr'>('preview');

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '12px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  };

  const renderPreview = () => {
    if (DocumentsService.isImage(document.mimeType)) {
      return (
        <div style={{ textAlign: 'center' }}>
          <img
            src={document.url}
            alt={document.originalName}
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      );
    }

    if (DocumentsService.isPDF(document.mimeType)) {
      return (
        <div style={{ width: '100%', height: '600px' }}>
          <iframe
            src={document.url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
            }}
            title={document.originalName}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {DocumentsService.getDocumentTypeIcon(document.type)}
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Aperçu non disponible
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          Type de fichier: {document.mimeType}
        </div>
        <button
          onClick={onDownload}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ⬇️ Télécharger le fichier
        </button>
      </div>
    );
  };

  const renderMetadata = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Informations générales */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            📋 Informations générales
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InfoRow label="Nom original" value={document.originalName} />
            <InfoRow label="Type" value={DocumentsService.getDocumentTypeLabel(document.type)} />
            <InfoRow label="Taille" value={DocumentsService.formatFileSize(document.fileSize)} />
            <InfoRow label="Format" value={document.extension.toUpperCase()} />
            <InfoRow
              label="Uploadé le"
              value={new Date(document.uploadedAt).toLocaleString('fr-FR')}
            />
            <InfoRow label="Uploadé par" value={document.uploadedBy.userName} />
          </div>
        </div>

        {/* Statut */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            🏷️ Statut
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InfoRow
              label="Statut"
              value={
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: `${DocumentsService.getStatusColor(document.status)}15`,
                    color: DocumentsService.getStatusColor(document.status),
                  }}
                >
                  {DocumentsService.getStatusLabel(document.status)}
                </span>
              }
            />
            <InfoRow
              label="Requis"
              value={document.isRequired ? '✅ Oui' : '❌ Non'}
            />
            <InfoRow
              label="Vérifié"
              value={document.isVerified ? '✅ Oui' : '⏳ Non'}
            />
            {document.verifiedBy && (
              <InfoRow
                label="Vérifié par"
                value={`${document.verifiedBy.userName} le ${new Date(document.verifiedBy.verifiedAt).toLocaleDateString('fr-FR')}`}
              />
            )}
          </div>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
              🏷️ Tags
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {document.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    fontWeight: '500',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {document.notes && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
              📝 Notes
            </h3>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              {document.notes}
            </div>
          </div>
        )}

        {/* Métadonnées techniques */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
              ⚙️ Métadonnées techniques
            </h3>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(document.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOCR = () => {
    if (!document.ocrResult) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Aucun résultat OCR
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            {DocumentsService.isOCRSupported(document.mimeType)
              ? "L'OCR n'a pas encore été exécuté sur ce document"
              : "L'OCR n'est pas supporté pour ce type de fichier"}
          </div>
          {DocumentsService.isOCRSupported(document.mimeType) && onTriggerOCR && (
            <button
              onClick={onTriggerOCR}
              style={{
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              🚀 Lancer l'OCR
            </button>
          )}
        </div>
      );
    }

    const ocr = document.ocrResult;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Statut OCR */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            📊 Informations OCR
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InfoRow
              label="Score de confiance"
              value={
                <span
                  style={{
                    color: DocumentsService.getConfidenceColor(ocr.confidence),
                    fontWeight: '700',
                  }}
                >
                  {ocr.confidence}% - {DocumentsService.getConfidenceLabel(ocr.confidence)}
                </span>
              }
            />
            <InfoRow
              label="Traité le"
              value={ocr.processedAt ? new Date(ocr.processedAt).toLocaleString('fr-FR') : '-'}
            />
            {ocr.processingTime && (
              <InfoRow label="Temps de traitement" value={`${ocr.processingTime}ms`} />
            )}
            {ocr.detectedLanguages && (
              <InfoRow label="Langues détectées" value={ocr.detectedLanguages.join(', ')} />
            )}
          </div>
        </div>

        {/* Données structurées */}
        {ocr.structuredData && Object.keys(ocr.structuredData).length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
              📦 Données extraites
            </h3>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(ocr.structuredData).map(([key, value]) => (
                  <InfoRow
                    key={key}
                    label={key}
                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Texte brut */}
        {ocr.text && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
              📄 Texte extrait
            </h3>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
              }}
            >
              {ocr.text}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ fontSize: '28px' }}>
                {DocumentsService.getDocumentTypeIcon(document.type)}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                {document.originalName}
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {DocumentsService.getDocumentTypeLabel(document.type)} •{' '}
              {DocumentsService.formatFileSize(document.fileSize)}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={tabsStyle}>
          <TabButton
            active={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            label="👁️ Aperçu"
          />
          <TabButton
            active={activeTab === 'metadata'}
            onClick={() => setActiveTab('metadata')}
            label="📋 Métadonnées"
          />
          {showOCRResults && (
            <TabButton
              active={activeTab === 'ocr'}
              onClick={() => setActiveTab('ocr')}
              label={`📝 OCR ${document.ocrResult ? `(${document.ocrResult.confidence}%)` : ''}`}
            />
          )}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'metadata' && renderMetadata()}
          {activeTab === 'ocr' && renderOCR()}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onDownload && (
              <button
                onClick={onDownload}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ⬇️ Télécharger
              </button>
            )}

            {onVerify && !document.isVerified && (
              <button
                onClick={onVerify}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✓ Vérifier
              </button>
            )}

            {onTriggerOCR &&
              !document.ocrResult &&
              DocumentsService.isOCRSupported(document.mimeType) && (
                <button
                  onClick={onTriggerOCR}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  📝 Lancer OCR
                </button>
              )}
          </div>

          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`Supprimer définitivement le document "${document.originalName}" ?`)) {
                  onDelete();
                }
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              🗑️ Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: active ? 'white' : 'transparent',
      fontWeight: active ? '600' : '500',
      fontSize: '14px',
      cursor: 'pointer',
      color: active ? '#111827' : '#6b7280',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    }}
  >
    {label}
  </button>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
      {label}
    </div>
    <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{value}</div>
  </div>
);

export default DocumentViewer;

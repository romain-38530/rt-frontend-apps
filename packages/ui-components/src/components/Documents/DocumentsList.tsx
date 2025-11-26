/**
 * Liste de documents avec filtres et actions
 * Affiche les documents d'une commande ou globalement
 */

import React, { useState } from 'react';
import type {
  Document,
  DocumentType,
  DocumentStatus,
} from '@rt/contracts';
import DocumentsService from '@rt/utils/lib/services/documents-service';

interface DocumentsListProps {
  documents: Document[];
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onDocumentClick?: (document: Document) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onVerify?: (documentId: string) => void;
  onTriggerOCR?: (documentId: string) => void;
  onFiltersChange?: (filters: any) => void;
  showFilters?: boolean;
  compact?: boolean;
  isLoading?: boolean;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  onDocumentClick,
  onDownload,
  onDelete,
  onVerify,
  onTriggerOCR,
  onFiltersChange,
  showFilters = true,
  compact = false,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState({
    type: '' as DocumentType | '',
    status: '' as DocumentStatus | '',
    search: '',
    isVerified: '' as 'true' | 'false' | '',
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFiltersChange) {
      // Nettoyer les filtres vides
      const cleanFilters: any = {};
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v !== '') cleanFilters[k] = v;
      });
      onFiltersChange(cleanFilters);
    }
  };

  const resetFilters = () => {
    const emptyFilters = {
      type: '' as DocumentType | '',
      status: '' as DocumentStatus | '',
      search: '',
      isVerified: '' as 'true' | 'false' | '',
    };
    setFilters(emptyFilters);
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
  };

  const filtersStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'grid',
    gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(4, 1fr)',
    gap: '12px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  };

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: compact ? '8px' : '12px',
  };

  const itemStyle: React.CSSProperties = {
    padding: compact ? '12px' : '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: onDocumentClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
  };

  const paginationStyle: React.CSSProperties = {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div style={{ fontSize: '16px' }}>Chargement des documents...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Filtres */}
      {showFilters && (
        <div style={filtersStyle}>
          {/* Recherche */}
          <input
            type="text"
            placeholder="🔍 Rechercher un document..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={inputStyle}
          />

          {/* Type */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            style={inputStyle}
          >
            <option value="">Tous les types</option>
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

          {/* Statut */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={inputStyle}
          >
            <option value="">Tous les statuts</option>
            <option value="uploaded">Uploadé</option>
            <option value="processing">Traitement en cours</option>
            <option value="processed">Traité</option>
            <option value="failed">Échec</option>
            <option value="archived">Archivé</option>
          </select>

          {/* Vérification */}
          <select
            value={filters.isVerified}
            onChange={(e) => handleFilterChange('isVerified', e.target.value)}
            style={inputStyle}
          >
            <option value="">Tous</option>
            <option value="true">Vérifiés</option>
            <option value="false">Non vérifiés</option>
          </select>

          {/* Bouton reset */}
          <button
            onClick={resetFilters}
            style={{
              ...inputStyle,
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontWeight: '600',
              gridColumn: compact ? 'span 2' : 'auto',
            }}
          >
            🔄 Réinitialiser
          </button>
        </div>
      )}

      {/* Liste */}
      {documents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Aucun document
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {showFilters ? 'Essayez de modifier les filtres' : 'Commencez par uploader des documents'}
          </div>
        </div>
      ) : (
        <div style={listStyle}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                ...itemStyle,
                ...(onDocumentClick && {
                  ':hover': {
                    borderColor: '#667eea',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                  },
                }),
              }}
              onClick={() => onDocumentClick?.(doc)}
            >
              {/* Icône du type */}
              <div style={{ fontSize: compact ? '24px' : '32px', flexShrink: 0 }}>
                {DocumentsService.getDocumentTypeIcon(doc.type)}
              </div>

              {/* Informations */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: compact ? '13px' : '14px',
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.originalName}
                  </span>

                  {/* Badge requis */}
                  {doc.isRequired && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        flexShrink: 0,
                      }}
                    >
                      REQUIS
                    </span>
                  )}

                  {/* Badge vérifié */}
                  {doc.isVerified && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        flexShrink: 0,
                      }}
                    >
                      ✓ VÉRIFIÉ
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{DocumentsService.getDocumentTypeLabel(doc.type)}</span>
                  <span>•</span>
                  <span>{DocumentsService.formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>
                    {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  {/* Score OCR */}
                  {doc.ocrResult && (
                    <>
                      <span>•</span>
                      <span
                        style={{
                          color: DocumentsService.getConfidenceColor(doc.ocrResult.confidence),
                          fontWeight: '600',
                        }}
                      >
                        OCR: {doc.ocrResult.confidence}%
                      </span>
                    </>
                  )}
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && !compact && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Statut */}
              <div style={{ flexShrink: 0 }}>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: `${DocumentsService.getStatusColor(doc.status)}15`,
                    color: DocumentsService.getStatusColor(doc.status),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {DocumentsService.getStatusLabel(doc.status)}
                </span>
              </div>

              {/* Actions */}
              <div
                style={{ display: 'flex', gap: '6px', flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Télécharger */}
                {onDownload && (
                  <button
                    onClick={() => onDownload(doc.id)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Télécharger"
                  >
                    ⬇️
                  </button>
                )}

                {/* Vérifier */}
                {onVerify && !doc.isVerified && (
                  <button
                    onClick={() => onVerify(doc.id)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Vérifier"
                  >
                    ✓
                  </button>
                )}

                {/* Lancer OCR */}
                {onTriggerOCR &&
                  !doc.ocrResult &&
                  DocumentsService.isOCRSupported(doc.mimeType) &&
                  doc.status !== 'processing' && (
                    <button
                      onClick={() => onTriggerOCR(doc.id)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      title="Lancer OCR"
                    >
                      📝
                    </button>
                  )}

                {/* Supprimer */}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer le document "${doc.originalName}" ?`)) {
                        onDelete(doc.id);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px',
                      backgroundColor: '#fef2f2',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#dc2626',
                    }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div style={paginationStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {documents.length} document{documents.length > 1 ? 's' : ''} sur {total}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: page === 1 ? '#f3f4f6' : 'white',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              ← Précédent
            </button>

            <div
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Page {page} / {totalPages}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: page === totalPages ? '#f3f4f6' : 'white',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;

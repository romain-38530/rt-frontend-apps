/**
 * InvoiceUpload - Upload de facture avec OCR
 * Module Préfacturation & Facturation Transport
 */

import React, { useState, useRef, useCallback } from 'react';

export interface OCRResult {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  carrierName: string;
  carrierSIRET?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  lines: OCRInvoiceLine[];
  confidence: number;
  rawText?: string;
}

export interface OCRInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  confidence: number;
}

export interface InvoiceUploadProps {
  prefacturationId?: string;
  orderRef?: string;
  onUpload?: (file: File) => Promise<void>;
  onOCRComplete?: (result: OCRResult) => void;
  onValidateOCR?: (result: OCRResult, corrections: Partial<OCRResult>) => void;
  onCancel?: () => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  showOCRPreview?: boolean;
}

export const InvoiceUpload: React.FC<InvoiceUploadProps> = ({
  prefacturationId,
  orderRef,
  onUpload,
  onOCRComplete,
  onValidateOCR,
  onCancel,
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  showOCRPreview = true,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [corrections, setCorrections] = useState<Partial<OCRResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    // Validate file type
    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      setError(`Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Fichier trop volumineux. Taille max: ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  }, [acceptedFormats, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload?.(file);

      // Simulate OCR processing
      setProcessing(true);

      // Mock OCR result (in production, this would come from the API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockOCRResult: OCRResult = {
        invoiceNumber: `FAC-${Date.now()}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        carrierName: 'Transport Express SARL',
        carrierSIRET: '12345678901234',
        totalHT: 1250.00,
        totalTVA: 250.00,
        totalTTC: 1500.00,
        lines: [
          { description: 'Transport Paris-Lyon', quantity: 1, unitPrice: 850.00, total: 850.00, confidence: 0.95 },
          { description: 'Surcharge carburant', quantity: 1, unitPrice: 200.00, total: 200.00, confidence: 0.92 },
          { description: 'Manutention', quantity: 2, unitPrice: 100.00, total: 200.00, confidence: 0.88 },
        ],
        confidence: 0.91,
      };

      setOcrResult(mockOCRResult);
      onOCRComplete?.(mockOCRResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleCorrection = (field: keyof OCRResult, value: unknown) => {
    setCorrections(prev => ({ ...prev, [field]: value }));
  };

  const handleValidate = () => {
    if (ocrResult) {
      onValidateOCR?.(ocrResult, corrections);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#10B981';
    if (confidence >= 0.7) return '#F59E0B';
    return '#EF4444';
  };

  const renderConfidenceBadge = (confidence: number) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      background: `${getConfidenceColor(confidence)}20`,
      color: getConfidenceColor(confidence),
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {Math.round(confidence * 100)}%
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Upload de facture transporteur
          </h3>
          {orderRef && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
              Commande: {orderRef}
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Drop zone */}
      {!ocrResult && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#4F46E5' : '#D1D5DB'}`,
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#EEF2FF' : '#F9FAFB',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />

          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>

          <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#374151' }}>
            {file ? file.name : 'Glissez-déposez votre facture ici'}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6B7280' }}>
            ou cliquez pour sélectionner un fichier
          </p>
          <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
            Formats acceptés: {acceptedFormats.join(', ')} • Max {maxSizeMB}MB
          </p>
        </div>
      )}

      {/* Preview */}
      {preview && !ocrResult && (
        <div style={{
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
        }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '4px',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#FEE2E2',
          color: '#DC2626',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Upload button */}
      {file && !ocrResult && (
        <button
          onClick={handleUpload}
          disabled={uploading || processing}
          style={{
            padding: '12px 24px',
            background: uploading || processing ? '#9CA3AF' : '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: uploading || processing ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '16px',
          }}
        >
          {uploading ? 'Upload en cours...' : processing ? 'Analyse OCR...' : 'Analyser la facture'}
        </button>
      )}

      {/* Processing indicator */}
      {processing && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '32px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ margin: 0, color: '#6B7280' }}>
            Extraction des données en cours...
          </p>
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && showOCRPreview && (
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* OCR Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🔍</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  Résultat de l'analyse OCR
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
                  Vérifiez et corrigez si nécessaire
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Confiance globale:</span>
              {renderConfidenceBadge(ocrResult.confidence)}
            </div>
          </div>

          {/* Invoice details form */}
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  N° Facture
                </label>
                <input
                  type="text"
                  value={corrections.invoiceNumber ?? ocrResult.invoiceNumber}
                  onChange={(e) => handleCorrection('invoiceNumber', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Date facture
                </label>
                <input
                  type="date"
                  value={corrections.invoiceDate ?? ocrResult.invoiceDate}
                  onChange={(e) => handleCorrection('invoiceDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Transporteur
                </label>
                <input
                  type="text"
                  value={corrections.carrierName ?? ocrResult.carrierName}
                  onChange={(e) => handleCorrection('carrierName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  SIRET
                </label>
                <input
                  type="text"
                  value={corrections.carrierSIRET ?? ocrResult.carrierSIRET ?? ''}
                  onChange={(e) => handleCorrection('carrierSIRET', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Lines table */}
            <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
              Lignes de facturation
            </h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 500 }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 500 }}>Qté</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 500 }}>P.U.</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 500 }}>Total</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 500 }}>Conf.</th>
                </tr>
              </thead>
              <tbody>
                {ocrResult.lines.map((line, index) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #E5E7EB' }}>{line.description}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>{line.quantity}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>{formatCurrency(line.unitPrice)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(line.total)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>{renderConfidenceBadge(line.confidence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '8px',
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <span style={{ color: '#6B7280' }}>Total HT:</span>
                <span style={{ fontWeight: 500, minWidth: '100px', textAlign: 'right' }}>
                  {formatCurrency(ocrResult.totalHT)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <span style={{ color: '#6B7280' }}>TVA:</span>
                <span style={{ fontWeight: 500, minWidth: '100px', textAlign: 'right' }}>
                  {formatCurrency(ocrResult.totalTVA)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '24px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontWeight: 600 }}>Total TTC:</span>
                <span style={{ fontWeight: 600, minWidth: '100px', textAlign: 'right', fontSize: '18px' }}>
                  {formatCurrency(ocrResult.totalTTC)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
          }}>
            <button
              onClick={() => { setOcrResult(null); setFile(null); setPreview(null); }}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Recommencer
            </button>
            <button
              onClick={handleValidate}
              style={{
                padding: '10px 20px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Valider et comparer
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InvoiceUpload;

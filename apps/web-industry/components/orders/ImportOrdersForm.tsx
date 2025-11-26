/**
 * Composant ImportOrdersForm
 * Formulaire d'importation de commandes depuis CSV/XML
 * PHASE 1.1 - Canal API ERP-sync
 */

import React, { useState, useCallback } from 'react';
import { OrdersService } from '@rt/utils/lib/services/orders-service';
import type { ImportResult } from '@rt/contracts/src/types/orders';

interface ImportOrdersFormProps {
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: string) => void;
}

export const ImportOrdersForm: React.FC<ImportOrdersFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    // Vérifier le type de fichier
    const validTypes = ['text/csv', 'application/xml', 'text/xml'];
    if (!validTypes.includes(selectedFile.type)) {
      onError?.('Type de fichier non supporté. Utilisez CSV ou XML.');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      onError?.('Le fichier est trop volumineux (max 10MB).');
      return;
    }

    setFile(selectedFile);

    // Lire le contenu pour prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').slice(0, 5).join('\n');
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      onError?.('Veuillez sélectionner un fichier.');
      return;
    }

    setLoading(true);

    try {
      const result = await OrdersService.importOrders(file);
      onSuccess?.(result);

      // Reset form
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      onError?.(err.message || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Zone de drag & drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.xml"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-700">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ou cliquez pour sélectionner
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Formats acceptés : CSV, XML (max 10MB)
          </div>
        </div>
      </div>

      {/* Fichier sélectionné */}
      {file && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Prévisualisation */}
          {preview && (
            <div className="bg-white rounded border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Aperçu (5 premières lignes) :
              </p>
              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {preview}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Bouton de soumission */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!file || loading}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
            !file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Importation en cours...</span>
            </div>
          ) : (
            'Importer les commandes'
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Format CSV attendu :
        </h4>
        <code className="text-xs text-blue-800 block">
          reference,pickup_address,delivery_address,pickup_date,delivery_date,goods_weight,goods_description
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Le système effectuera un mapping automatique des champs.
        </p>
      </div>
    </form>
  );
};

export default ImportOrdersForm;

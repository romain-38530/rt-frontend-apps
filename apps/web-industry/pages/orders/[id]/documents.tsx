/**
 * Page de gestion documentaire - Portail Industry
 * Upload, visualisation, OCR des documents d'une commande
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../../../lib/auth';
import { FileUpload, DocumentsList, DocumentViewer } from '@rt/ui-components';
import { DocumentsService, OrdersService } from '@rt/utils';
import type { Document, DocumentStats } from '@rt/contracts';
import type { Order } from '@rt/contracts';

export default function DocumentsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Charger les données
  const loadData = async () => {
    if (!id || typeof id !== 'string') return;

    setIsLoading(true);
    setError(null);

    try {
      const [orderData, documentsData, statsData] = await Promise.all([
        OrdersService.getOrderById(id),
        DocumentsService.getDocumentsByOrderId(id),
        DocumentsService.getOrderDocumentStats(id),
      ]);

      setOrder(orderData);
      setDocuments(documentsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [id, router]);

  // Actions
  const handleUploadComplete = async () => {
    setShowUpload(false);
    await loadData();
  };

  const handleDownload = async (documentId: string) => {
    try {
      await DocumentsService.downloadDocument(documentId);
    } catch (err: any) {
      alert(`Erreur lors du téléchargement : ${err.message}`);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await DocumentsService.deleteDocument(documentId);
      await loadData();
    } catch (err: any) {
      alert(`Erreur lors de la suppression : ${err.message}`);
    }
  };

  const handleVerify = async (documentId: string) => {
    try {
      await DocumentsService.verifyDocument({
        documentId,
        isVerified: true,
      });
      await loadData();
    } catch (err: any) {
      alert(`Erreur lors de la vérification : ${err.message}`);
    }
  };

  const handleTriggerOCR = async (documentId: string) => {
    try {
      await DocumentsService.triggerOCR({
        documentId,
        extractStructuredData: true,
        detectTables: true,
      });
      // Attendre un peu pour que l'OCR se lance
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      alert(`Erreur lors du lancement de l'OCR : ${err.message}`);
    }
  };

  const handleExportAll = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      const result = await DocumentsService.exportOrderDocuments(id, 'zip');
      window.open(result.downloadUrl, '_blank');
    } catch (err: any) {
      alert(`Erreur lors de l'export : ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement des documents...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Commande introuvable'}</div>
        <button
          onClick={() => router.push(`/orders/${id}`)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Retour au détail de la commande
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Documents {order.reference} - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => router.push(`/orders/${id}`)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  ← Retour
                </button>

                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
                    📁 Documents {order.reference}
                  </h1>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {order.pickupAddress.city} → {order.deliveryAddress.city}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {documents.length > 0 && (
                  <button
                    onClick={handleExportAll}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    📦 Exporter tout
                  </button>
                )}

                <button
                  onClick={() => setShowUpload(!showUpload)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {showUpload ? '❌ Annuler' : '📤 Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          {/* Statistiques */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <StatCard
                icon="📄"
                label="Total documents"
                value={stats.totalDocuments}
                color="#667eea"
              />
              <StatCard
                icon="✅"
                label="Vérifiés"
                value={stats.verifiedDocuments}
                color="#10b981"
              />
              <StatCard
                icon="📝"
                label="Avec OCR"
                value={stats.documentsWithOCR}
                color="#8b5cf6"
              />
              <StatCard
                icon="💾"
                label="Taille totale"
                value={DocumentsService.formatFileSize(stats.totalSize)}
                color="#f59e0b"
              />
            </div>
          )}

          {/* Documents requis manquants */}
          {stats && stats.requiredDocuments.missing > 0 && (
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                  {stats.requiredDocuments.missing} document(s) requis manquant(s)
                </div>
                <div style={{ fontSize: '12px', color: '#78350f' }}>
                  {stats.requiredDocuments.uploaded} / {stats.requiredDocuments.total} documents requis uploadés
                </div>
              </div>
            </div>
          )}

          {/* Zone d'upload */}
          {showUpload && (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                📤 Upload de documents
              </h2>
              <FileUpload
                orderId={id as string}
                multiple={true}
                autoOCR={true}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => alert(`Erreur : ${error}`)}
              />
            </div>
          )}

          {/* Liste des documents */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              📋 Liste des documents ({documents.length})
            </h2>
            <DocumentsList
              documents={documents}
              showFilters={documents.length > 5}
              onDocumentClick={setSelectedDocument}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onVerify={handleVerify}
              onTriggerOCR={handleTriggerOCR}
              onFiltersChange={(filters) => {
                // Filtrage côté client pour simplifier
                // En production, on ferait un appel API avec les filtres
                console.log('Filters:', filters);
              }}
            />
          </div>
        </div>
      </div>

      {/* Viewer modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={() => handleDownload(selectedDocument.id)}
          onDelete={() => {
            handleDelete(selectedDocument.id);
            setSelectedDocument(null);
          }}
          onVerify={() => {
            handleVerify(selectedDocument.id);
            setSelectedDocument(null);
          }}
          onTriggerOCR={() => {
            handleTriggerOCR(selectedDocument.id);
          }}
          showOCRResults={true}
        />
      )}
    </>
  );
}

// Composant StatCard
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div
    style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
    </div>
  </div>
);

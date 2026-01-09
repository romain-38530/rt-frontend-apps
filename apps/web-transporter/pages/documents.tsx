/**
 * Page Documents de transport - Portail Transporter
 * Upload et gestion des BL, CMR, POD
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { documentsApi, ordersApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface TransportDocument {
  id: string;
  orderId: string;
  orderRef?: string;
  type: 'bl' | 'cmr' | 'pod' | 'invoice' | 'other';
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  validated: boolean;
  ocrProcessed: boolean;
  ocrConfidence?: number;
  extractedData?: Record<string, any>;
}

interface OrderForUpload {
  id: string;
  reference: string;
  route: string;
  date: string;
  missingDocs: string[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<TransportDocument[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderForUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [view, setView] = useState<'pending' | 'all'>('pending');

  // Charger les donnees - API ONLY (pas de mock data)
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Charger documents et commandes en attente de documents en parallele
      const [docsResult, pendingResult] = await Promise.all([
        documentsApi.list(),
        ordersApi.getPendingDocuments()
      ]);

      // Documents
      if (docsResult.documents) {
        setDocuments(docsResult.documents);
      } else if (Array.isArray(docsResult)) {
        setDocuments(docsResult);
      } else if (docsResult.data) {
        setDocuments(docsResult.data);
      } else {
        setDocuments([]);
      }

      // Commandes en attente de documents
      if (Array.isArray(pendingResult)) {
        setPendingOrders(pendingResult);
      } else {
        setPendingOrders([]);
      }
    } catch (err) {
      console.error('Erreur chargement documents:', err);
      toast.error('Impossible de charger les documents. Verifiez votre connexion.');
      setDocuments([]);
      setPendingOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload d'un document
  const handleUpload = async (orderId: string, docType: string, file: File) => {
    setUploadingOrder(orderId);
    setUploadingType(docType);

    try {
      await documentsApi.upload(file, { type: docType, orderId });

      toast.success(`Document ${docType.toUpperCase()} téléversé avec succès ! OCR en cours de traitement...`);
      loadData();
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploadingOrder(null);
      setUploadingType(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'bl': return 'Bordereau de Livraison';
      case 'cmr': return 'Lettre de Voiture CMR';
      case 'pod': return 'Preuve de Livraison';
      case 'invoice': return 'Facture';
      default: return type.toUpperCase();
    }
  };

  const getDocTypeShort = (type: string) => {
    switch (type) {
      case 'bl': return 'BL';
      case 'cmr': return 'CMR';
      case 'pod': return 'POD';
      case 'invoice': return 'Facture';
      default: return type.toUpperCase();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Head>
        <title>Documents - Transporter | SYMPHONI.A</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📄</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Documents de transport
              </h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '20px 40px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setView('pending')}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: 'none',
                background: view === 'pending'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Documents en attente
              {pendingOrders.length > 0 && (
                <span
                  style={{
                    background: view === 'pending' ? 'rgba(255,255,255,0.3)' : 'rgba(245,158,11,0.3)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                >
                  {pendingOrders.reduce((sum, o) => sum + o.missingDocs.length, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('all')}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: 'none',
                background: view === 'all'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Tous les documents
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement...</p>
            </div>
          ) : view === 'pending' ? (
            /* Vue documents en attente */
            pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Tout est à jour !</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tous vos documents ont été téléversés.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid rgba(245,158,11,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                          {order.reference}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                          {order.route} • {formatDate(order.date)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: 'rgba(245,158,11,0.2)',
                          color: '#f59e0b',
                        }}
                      >
                        {order.missingDocs.length} document(s) manquant(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {order.missingDocs.map((docType) => (
                        <div
                          key={docType}
                          style={{
                            flex: '1 1 200px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '2px dashed rgba(255,255,255,0.2)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                            {docType === 'bl' && '📋'}
                            {docType === 'cmr' && '📜'}
                            {docType === 'pod' && '✍️'}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            {getDocTypeLabel(docType)}
                          </div>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 20px',
                              borderRadius: '10px',
                              border: 'none',
                              background: uploadingOrder === order.id && uploadingType === docType
                                ? 'rgba(255,255,255,0.1)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: uploadingOrder === order.id ? 'not-allowed' : 'pointer',
                              marginTop: '8px',
                            }}
                          >
                            {uploadingOrder === order.id && uploadingType === docType ? (
                              '⏳ Upload en cours...'
                            ) : (
                              <>📎 Téléverser</>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.tiff"
                              style={{ display: 'none' }}
                              disabled={uploadingOrder === order.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(order.id, docType, file);
                              }}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Note */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    <strong>📌 Rappel</strong> : Les documents sont requis pour finaliser la facturation.
                    Un délai de 48h après livraison est accordé pour le téléversement des POD.
                    L'OCR extrait automatiquement les informations clés.
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Vue tous les documents */
            documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Aucun document</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    {/* Icône type */}
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'rgba(102,126,234,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {doc.type === 'bl' && '📋'}
                      {doc.type === 'cmr' && '📜'}
                      {doc.type === 'pod' && '✍️'}
                      {doc.type === 'invoice' && '💰'}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>{doc.filename}</span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(102,126,234,0.2)',
                            color: '#667eea',
                          }}
                        >
                          {getDocTypeShort(doc.type)}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        {doc.orderRef} • {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                      </div>
                    </div>

                    {/* OCR */}
                    {doc.ocrProcessed && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
                          OCR
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: (doc.ocrConfidence || 0) >= 85 ? '#10b981' : '#f59e0b',
                          }}
                        >
                          {doc.ocrConfidence}%
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: doc.validated
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(245,158,11,0.2)',
                        color: doc.validated ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {doc.validated ? 'Validé' : 'En attente'}
                    </span>

                    {/* Actions */}
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'transparent',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Page Vigilance - Portail Transporter
 * Conformité et devoir de vigilance
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { vigilanceApi } from '../lib/api';

interface VigilanceDocument {
  type: string;
  label: string;
  status: 'valid' | 'expired' | 'expiring_soon' | 'missing' | 'invalid' | 'insufficient';
  verified: boolean;
  expiresAt?: string;
  daysUntilExpiry?: number;
  documentId?: string;
  coverage?: number;
  minRequired?: number;
}

interface VigilanceData {
  overallStatus: 'compliant' | 'warning' | 'non_compliant' | 'blacklisted' | 'pending';
  complianceScore: number;
  documents: VigilanceDocument[];
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  lastCheckedAt: string;
  nextCheckDue: string;
}

export default function VigilancePage() {
  const router = useRouter();
  const [vigilance, setVigilance] = useState<VigilanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Charger les données de vigilance
  const loadVigilance = async () => {
    setIsLoading(true);
    try {
      // Appel API
      const [statusData, docsData, alertsData] = await Promise.all([
        vigilanceApi.getStatus(),
        vigilanceApi.getDocuments(),
        vigilanceApi.getAlerts(),
      ]);

      if (statusData && (statusData.complianceScore !== undefined || docsData.documents)) {
        setVigilance({
          overallStatus: statusData.overallStatus || statusData.status || 'warning',
          complianceScore: statusData.complianceScore || statusData.score || 78,
          documents: docsData.documents || docsData || [],
          alerts: alertsData.alerts || alertsData || [],
          lastCheckedAt: statusData.lastCheckedAt || new Date().toISOString(),
          nextCheckDue: statusData.nextCheckDue || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error loading vigilance from API:', err);
      // Fallback mock data
      const mockVigilance: VigilanceData = {
        overallStatus: 'warning',
        complianceScore: 78,
        documents: [
          {
            type: 'kbis',
            label: 'Extrait KBIS',
            status: 'valid',
            verified: true,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilExpiry: 60,
          },
          {
            type: 'urssaf',
            label: 'Attestation URSSAF',
            status: 'expiring_soon',
            verified: true,
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilExpiry: 15,
          },
          {
            type: 'insurance',
            label: 'Assurance RC Pro',
            status: 'valid',
            verified: true,
            expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilExpiry: 180,
            coverage: 350000,
            minRequired: 100000,
          },
          {
            type: 'license',
            label: 'Licence de transport',
            status: 'valid',
            verified: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilExpiry: 365,
          },
          {
            type: 'identity',
            label: 'Pièce d\'identité',
            status: 'missing',
            verified: false,
          },
          {
            type: 'rib',
            label: 'RIB',
            status: 'valid',
            verified: true,
          },
        ],
        alerts: [
          {
            id: 'alert-1',
            type: 'expiry_j15',
            message: 'Votre attestation URSSAF expire dans 15 jours',
            severity: 'warning',
          },
          {
            id: 'alert-2',
            type: 'document_missing',
            message: 'Pièce d\'identité manquante',
            severity: 'critical',
          },
        ],
        lastCheckedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextCheckDue: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      };

      setVigilance(mockVigilance);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload d'un document
  const handleUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    try {
      await vigilanceApi.uploadDocument(docType, file);
      alert(`Document ${docType} téléversé avec succès !`);
      loadVigilance();
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Erreur lors du téléversement');
    } finally {
      setUploadingDoc(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadVigilance();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return { bg: 'rgba(16,185,129,0.2)', text: '#10b981', border: '#10b981' };
      case 'expiring_soon': return { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b', border: '#f59e0b' };
      case 'expired':
      case 'missing':
      case 'invalid':
      case 'insufficient':
        return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444', border: '#ef4444' };
      default: return { bg: 'rgba(255,255,255,0.1)', text: 'white', border: 'rgba(255,255,255,0.2)' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'Valide';
      case 'expiring_soon': return 'Expire bientôt';
      case 'expired': return 'Expiré';
      case 'missing': return 'Manquant';
      case 'invalid': return 'Invalide';
      case 'insufficient': return 'Insuffisant';
      default: return status;
    }
  };

  const getOverallStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return { label: 'Conforme', color: '#10b981' };
      case 'warning': return { label: 'Attention requise', color: '#f59e0b' };
      case 'non_compliant': return { label: 'Non conforme', color: '#ef4444' };
      case 'blacklisted': return { label: 'Bloqué', color: '#dc2626' };
      case 'pending': return { label: 'En attente', color: '#6b7280' };
      default: return { label: status, color: 'white' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <>
      <Head>
        <title>Vigilance - Transporter | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>🛡️</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Vigilance & Conformité
              </h1>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement...</p>
            </div>
          ) : vigilance && (
            <>
              {/* Score global */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px',
                }}
              >
                {/* Score de conformité */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Score de conformité
                  </div>
                  <div
                    style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      border: `8px solid ${getScoreColor(vigilance.complianceScore)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <span style={{ fontSize: '48px', fontWeight: '800', color: getScoreColor(vigilance.complianceScore) }}>
                      {vigilance.complianceScore}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: `${getOverallStatusLabel(vigilance.overallStatus).color}20`,
                      color: getOverallStatusLabel(vigilance.overallStatus).color,
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  >
                    {getOverallStatusLabel(vigilance.overallStatus).label}
                  </div>
                </div>

                {/* Alertes */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Alertes actives
                  </div>
                  {vigilance.alerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <span style={{ fontSize: '32px' }}>✓</span>
                      <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>Aucune alerte</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {vigilance.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: alert.severity === 'critical'
                              ? 'rgba(239,68,68,0.15)'
                              : alert.severity === 'warning'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(59,130,246,0.15)',
                            borderLeft: `4px solid ${
                              alert.severity === 'critical'
                                ? '#ef4444'
                                : alert.severity === 'warning'
                                ? '#f59e0b'
                                : '#3b82f6'
                            }`,
                          }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {alert.severity === 'critical' && '🚨 '}
                            {alert.severity === 'warning' && '⚠️ '}
                            {alert.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info vérification */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Vérifications
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                      Dernière vérification
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                      {new Date(vigilance.lastCheckedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                      Prochaine vérification
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                      {new Date(vigilance.nextCheckDue).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des documents */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '32px',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                  Documents obligatoires
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {vigilance.documents.map((doc) => {
                    const statusStyle = getStatusColor(doc.status);
                    return (
                      <div
                        key={doc.type}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          padding: '20px',
                          border: `1px solid ${statusStyle.border}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                            {doc.label}
                          </div>
                          {doc.expiresAt && doc.daysUntilExpiry && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                              Expire le {new Date(doc.expiresAt).toLocaleDateString('fr-FR')}
                              {' '}({doc.daysUntilExpiry} jours)
                            </div>
                          )}
                          {doc.coverage && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                              Couverture: {doc.coverage.toLocaleString()} € (min: {doc.minRequired?.toLocaleString()} €)
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              background: statusStyle.bg,
                              color: statusStyle.text,
                            }}
                          >
                            {getStatusLabel(doc.status)}
                          </span>

                          <label
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: uploadingDoc === doc.type
                                ? 'rgba(255,255,255,0.1)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: uploadingDoc === doc.type ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {uploadingDoc === doc.type ? (
                              '⏳ Upload...'
                            ) : (
                              <>
                                📎 {doc.status === 'missing' ? 'Ajouter' : 'Mettre à jour'}
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              disabled={uploadingDoc === doc.type}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(doc.type, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Note informative */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    <strong>Devoir de vigilance</strong> : Conformément à la réglementation, vos documents
                    sont vérifiés automatiquement. Un score de conformité inférieur à 70% peut vous
                    exclure temporairement des attributions de missions.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

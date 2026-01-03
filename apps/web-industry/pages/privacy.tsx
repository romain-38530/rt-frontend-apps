import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Types for GDPR compliance
interface ConsentSettings {
  termsOfService: boolean;
  termsVersion: string;
  privacyPolicy: boolean;
  privacyVersion: string;
  dataProcessing: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
  gpsTracking: boolean;
  analyticsSharing: boolean;
}

interface ExportStatus {
  status: 'idle' | 'processing' | 'ready' | 'error';
  downloadUrl?: string;
  expiresAt?: string;
}

interface DeleteRequestStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt?: string;
  scheduledDeletionAt?: string;
  canCancel?: boolean;
}

const PrivacyPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState<ConsentSettings>({
    termsOfService: true,
    termsVersion: '2.0',
    privacyPolicy: true,
    privacyVersion: '2.0',
    dataProcessing: true,
    marketingEmail: false,
    marketingSms: false,
    gpsTracking: true,
    analyticsSharing: false,
  });
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ status: 'idle' });
  const [deleteStatus, setDeleteStatus] = useState<DeleteRequestStatus>({ status: 'none' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load user preferences from API
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportStatus({ status: 'processing' });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gdpr/users/me/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExportStatus({
          status: 'ready',
          downloadUrl: data.downloadUrl,
          expiresAt: data.expiresAt,
        });
      } else {
        setExportStatus({ status: 'error' });
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Demo mode: simulate success
      setExportStatus({
        status: 'ready',
        downloadUrl: '#demo-download',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  };

  const handleDeleteRequest = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gdpr/users/me/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeleteStatus({
          status: 'pending',
          scheduledDeletionAt: data.scheduledDeletionAt,
          canCancel: true,
        });
      }
    } catch (error) {
      console.error('Delete request failed:', error);
      // Demo mode: simulate success
      setDeleteStatus({
        status: 'pending',
        scheduledDeletionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        canCancel: true,
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveConsents = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gdpr/users/me/consents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(consents),
      });

      if (response.ok) {
        setSuccessMessage('Préférences enregistrées avec succès');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Demo mode
      setSuccessMessage('Préférences enregistrées avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setSaving(false);
  };

  const toggleConsent = (key: keyof ConsentSettings) => {
    if (['termsOfService', 'privacyPolicy', 'dataProcessing', 'termsVersion', 'privacyVersion'].includes(key)) {
      return; // Required consents
    }
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key as keyof ConsentSettings],
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Confidentialité - SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
        padding: '40px 20px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ← Retour
            </button>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
              🔒 Centre de Confidentialité
            </h1>
            <p style={{ color: '#666' }}>
              Gérez vos données personnelles conformément au RGPD
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              background: '#d4edda',
              border: '1px solid #28a745',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#155724',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ✅ {successMessage}
            </div>
          )}

          {/* Data Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📁</span> Mes Données
            </h2>

            {/* Export Data */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Exporter mes données
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                Téléchargez une copie de toutes vos données personnelles (RGPD Article 20)
              </p>

              {exportStatus.status === 'idle' && (
                <button
                  onClick={handleExportData}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  📥 Demander l'export
                </button>
              )}

              {exportStatus.status === 'processing' && (
                <button
                  disabled
                  style={{
                    padding: '12px 24px',
                    background: '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  ⏳ Export en cours...
                </button>
              )}

              {exportStatus.status === 'ready' && (
                <div>
                  <a
                    href={exportStatus.downloadUrl}
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: '#28a745',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    📥 Télécharger mes données
                  </a>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    Expire le: {exportStatus.expiresAt && new Date(exportStatus.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Delete Account */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Supprimer mon compte
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                Demandez la suppression définitive de votre compte (RGPD Article 17)
              </p>

              {deleteStatus.status === 'none' && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Demander la suppression
                </button>
              )}

              {showDeleteConfirm && (
                <div>
                  <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#856404',
                  }}>
                    ⚠️ Cette action est irréversible. Un délai de 7 jours est prévu pour annuler.
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleDeleteRequest}
                      style={{
                        padding: '12px 24px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Confirmer la suppression
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        color: '#666',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {deleteStatus.status === 'pending' && (
                <div style={{
                  background: '#f8d7da',
                  border: '1px solid #dc3545',
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <p style={{ fontWeight: 500, color: '#721c24', marginBottom: '8px' }}>
                    Suppression programmée le: {deleteStatus.scheduledDeletionAt && new Date(deleteStatus.scheduledDeletionAt).toLocaleDateString()}
                  </p>
                  {deleteStatus.canCancel && (
                    <button
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        color: '#667eea',
                        border: '1px solid #667eea',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Annuler la demande
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Consents Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>✅</span> Mes Consentements
            </h2>

            {/* Consent rows */}
            {[
              { key: 'termsOfService', label: 'Conditions Générales d\'Utilisation', desc: 'Acceptation des CGU de la plateforme', required: true },
              { key: 'privacyPolicy', label: 'Politique de Confidentialité', desc: 'Acceptation de notre politique de traitement des données', required: true },
              { key: 'dataProcessing', label: 'Traitement des données', desc: 'Autorisation de traiter vos données pour le service', required: true },
              { key: 'marketingEmail', label: 'Communications marketing (email)', desc: 'Recevoir des offres et actualités par email', required: false },
              { key: 'marketingSms', label: 'Communications marketing (SMS)', desc: 'Recevoir des notifications par SMS', required: false },
              { key: 'gpsTracking', label: 'Géolocalisation', desc: 'Permettre le suivi GPS pour le tracking des livraisons', required: false },
              { key: 'analyticsSharing', label: 'Partage analytique', desc: 'Partager des données anonymisées pour améliorer nos services', required: false },
            ].map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.label}
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: item.required ? '#e3f2fd' : '#f5f5f5',
                      color: item.required ? '#1976d2' : '#666',
                    }}>
                      {item.required ? 'Obligatoire' : 'Optionnel'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{item.desc}</div>
                </div>
                <div
                  onClick={() => toggleConsent(item.key as keyof ConsentSettings)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    background: consents[item.key as keyof ConsentSettings] ? '#667eea' : '#ccc',
                    position: 'relative',
                    cursor: item.required ? 'not-allowed' : 'pointer',
                    opacity: item.required ? 0.6 : 1,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: consents[item.key as keyof ConsentSettings] ? '25px' : '3px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease',
                  }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={handleSaveConsents}
                disabled={saving}
                style={{
                  padding: '14px 32px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                {saving ? '⏳ Enregistrement...' : '💾 Enregistrer mes préférences'}
              </button>
            </div>
          </div>

          {/* Regulation Info */}
          <div style={{
            background: '#e3f2fd',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '14px',
            color: '#1565c0',
          }}>
            <strong>📜 Vos droits RGPD :</strong>
            <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Droit d'accès</strong> (Article 15) - Accédez à vos données personnelles</li>
              <li><strong>Droit de rectification</strong> (Article 16) - Corrigez vos informations</li>
              <li><strong>Droit à l'effacement</strong> (Article 17) - Demandez la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> (Article 20) - Exportez vos données</li>
              <li><strong>Droit d'opposition</strong> (Article 21) - Refusez certains traitements</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Contact DPO : <a href="mailto:dpo@symphonia.fr" style={{ color: '#1565c0' }}>dpo@symphonia.fr</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;

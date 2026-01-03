import React, { useState, CSSProperties } from 'react';

export interface PrivacyCenterProps {
  userId: string;
  userEmail: string;
  onExportData: () => Promise<void>;
  onDeleteRequest: () => Promise<void>;
  onUpdateConsents: (consents: ConsentSettings) => Promise<void>;
  consents: ConsentSettings;
  exportStatus?: ExportStatus;
  deleteStatus?: DeleteRequestStatus;
  language?: 'fr' | 'en';
}

export interface ConsentSettings {
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

export interface ExportStatus {
  status: 'idle' | 'processing' | 'ready' | 'error';
  downloadUrl?: string;
  expiresAt?: string;
}

export interface DeleteRequestStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt?: string;
  scheduledDeletionAt?: string;
  canCancel?: boolean;
}

const translations = {
  fr: {
    title: 'Centre de Confidentialité',
    subtitle: 'Gérez vos données personnelles et vos préférences de confidentialité',

    // Data section
    dataSection: 'Mes Données',
    exportTitle: 'Exporter mes données',
    exportDesc: 'Téléchargez une copie de toutes vos données personnelles (RGPD Article 20)',
    exportButton: 'Demander l\'export',
    exportProcessing: 'Export en cours...',
    exportReady: 'Télécharger mes données',
    exportExpires: 'Expire le',

    deleteTitle: 'Supprimer mon compte',
    deleteDesc: 'Demandez la suppression définitive de votre compte et de toutes vos données (RGPD Article 17)',
    deleteButton: 'Demander la suppression',
    deleteWarning: 'Cette action est irréversible. Un délai de 7 jours est prévu pour annuler.',
    deletePending: 'Suppression programmée le',
    deleteCancel: 'Annuler la demande',

    // Consents section
    consentsSection: 'Mes Consentements',
    required: 'Obligatoire',
    optional: 'Optionnel',

    termsOfService: 'Conditions Générales d\'Utilisation',
    termsOfServiceDesc: 'Acceptation des CGU de la plateforme SYMPHONI.A',
    privacyPolicy: 'Politique de Confidentialité',
    privacyPolicyDesc: 'Acceptation de notre politique de traitement des données',
    dataProcessing: 'Traitement des données',
    dataProcessingDesc: 'Autorisation de traiter vos données pour le service',
    marketingEmail: 'Communications marketing (email)',
    marketingEmailDesc: 'Recevoir des offres et actualités par email',
    marketingSms: 'Communications marketing (SMS)',
    marketingSmsDesc: 'Recevoir des notifications par SMS',
    gpsTracking: 'Géolocalisation',
    gpsTrackingDesc: 'Permettre le suivi GPS pour le tracking des livraisons',
    analyticsSharing: 'Partage analytique',
    analyticsSharingDesc: 'Partager des données anonymisées pour améliorer nos services',

    savePreferences: 'Enregistrer mes préférences',
    saved: 'Préférences enregistrées',

    version: 'Version',
    lastUpdated: 'Dernière mise à jour',
  },
  en: {
    title: 'Privacy Center',
    subtitle: 'Manage your personal data and privacy preferences',

    dataSection: 'My Data',
    exportTitle: 'Export my data',
    exportDesc: 'Download a copy of all your personal data (GDPR Article 20)',
    exportButton: 'Request export',
    exportProcessing: 'Export in progress...',
    exportReady: 'Download my data',
    exportExpires: 'Expires on',

    deleteTitle: 'Delete my account',
    deleteDesc: 'Request permanent deletion of your account and all data (GDPR Article 17)',
    deleteButton: 'Request deletion',
    deleteWarning: 'This action is irreversible. A 7-day grace period is provided to cancel.',
    deletePending: 'Deletion scheduled for',
    deleteCancel: 'Cancel request',

    consentsSection: 'My Consents',
    required: 'Required',
    optional: 'Optional',

    termsOfService: 'Terms of Service',
    termsOfServiceDesc: 'Acceptance of SYMPHONI.A platform terms',
    privacyPolicy: 'Privacy Policy',
    privacyPolicyDesc: 'Acceptance of our data processing policy',
    dataProcessing: 'Data Processing',
    dataProcessingDesc: 'Authorization to process your data for the service',
    marketingEmail: 'Marketing communications (email)',
    marketingEmailDesc: 'Receive offers and news by email',
    marketingSms: 'Marketing communications (SMS)',
    marketingSmsDesc: 'Receive notifications by SMS',
    gpsTracking: 'Geolocation',
    gpsTrackingDesc: 'Allow GPS tracking for delivery tracking',
    analyticsSharing: 'Analytics sharing',
    analyticsSharingDesc: 'Share anonymized data to improve our services',

    savePreferences: 'Save my preferences',
    saved: 'Preferences saved',

    version: 'Version',
    lastUpdated: 'Last updated',
  }
};

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  userId,
  userEmail,
  onExportData,
  onDeleteRequest,
  onUpdateConsents,
  consents,
  exportStatus = { status: 'idle' },
  deleteStatus = { status: 'none' },
  language = 'fr'
}) => {
  const [localConsents, setLocalConsents] = useState<ConsentSettings>(consents);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const t = translations[language];

  const containerStyles: CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  };

  const sectionStyles: CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  };

  const sectionTitleStyles: CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const cardStyles: CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  };

  const cardTitleStyles: CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  };

  const cardDescStyles: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  };

  const buttonStyles: CSSProperties = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    fontSize: '14px',
  };

  const primaryButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  };

  const dangerButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: '#dc3545',
    color: 'white',
  };

  const successButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: '#28a745',
    color: 'white',
  };

  const outlineButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: 'transparent',
    border: '1px solid #667eea',
    color: '#667eea',
  };

  const consentRowStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
  };

  const consentInfoStyles: CSSProperties = {
    flex: 1,
  };

  const consentNameStyles: CSSProperties = {
    fontWeight: 500,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const badgeStyles = (required: boolean): CSSProperties => ({
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: required ? '#e3f2fd' : '#f5f5f5',
    color: required ? '#1976d2' : '#666',
    fontWeight: 500,
  });

  const consentDescStyles: CSSProperties = {
    fontSize: '13px',
    color: '#888',
    marginTop: '4px',
  };

  const switchStyles = (active: boolean, disabled?: boolean): CSSProperties => ({
    width: '48px',
    height: '26px',
    borderRadius: '13px',
    background: active ? '#667eea' : '#ccc',
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    flexShrink: 0,
  });

  const switchKnobStyles = (active: boolean): CSSProperties => ({
    position: 'absolute',
    top: '3px',
    left: active ? '25px' : '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'left 0.2s ease',
  });

  const warningBoxStyles: CSSProperties = {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#856404',
  };

  const pendingBoxStyles: CSSProperties = {
    background: '#f8d7da',
    border: '1px solid #dc3545',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };

  const toggleConsent = (key: keyof ConsentSettings) => {
    // Required consents can't be toggled off
    if (['termsOfService', 'privacyPolicy', 'dataProcessing'].includes(key)) {
      return;
    }
    setLocalConsents(prev => ({
      ...prev,
      [key]: !prev[key as keyof ConsentSettings],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateConsents(localConsents);
    } finally {
      setSaving(false);
    }
  };

  const renderConsentRow = (
    key: keyof ConsentSettings,
    label: string,
    description: string,
    required: boolean = false
  ) => {
    if (key === 'termsVersion' || key === 'privacyVersion') return null;

    const value = localConsents[key];
    if (typeof value !== 'boolean') return null;

    return (
      <div style={consentRowStyles} key={key}>
        <div style={consentInfoStyles}>
          <div style={consentNameStyles}>
            {label}
            <span style={badgeStyles(required)}>
              {required ? t.required : t.optional}
            </span>
          </div>
          <div style={consentDescStyles}>{description}</div>
        </div>
        <div
          style={switchStyles(value, required)}
          onClick={() => toggleConsent(key)}
        >
          <div style={switchKnobStyles(value)} />
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyles}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
        {t.title}
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>{t.subtitle}</p>

      {/* Data Section */}
      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>
          <span>📁</span> {t.dataSection}
        </div>

        {/* Export Data */}
        <div style={cardStyles}>
          <div style={cardTitleStyles}>{t.exportTitle}</div>
          <div style={cardDescStyles}>{t.exportDesc}</div>

          {exportStatus.status === 'idle' && (
            <button style={primaryButtonStyles} onClick={onExportData}>
              {t.exportButton}
            </button>
          )}
          {exportStatus.status === 'processing' && (
            <button style={{ ...primaryButtonStyles, opacity: 0.7 }} disabled>
              ⏳ {t.exportProcessing}
            </button>
          )}
          {exportStatus.status === 'ready' && exportStatus.downloadUrl && (
            <div>
              <a href={exportStatus.downloadUrl} style={{ textDecoration: 'none' }}>
                <button style={successButtonStyles}>
                  📥 {t.exportReady}
                </button>
              </a>
              {exportStatus.expiresAt && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {t.exportExpires}: {new Date(exportStatus.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div style={cardStyles}>
          <div style={cardTitleStyles}>{t.deleteTitle}</div>
          <div style={cardDescStyles}>{t.deleteDesc}</div>

          {deleteStatus.status === 'none' && (
            <>
              {!showDeleteConfirm ? (
                <button style={dangerButtonStyles} onClick={() => setShowDeleteConfirm(true)}>
                  {t.deleteButton}
                </button>
              ) : (
                <>
                  <div style={warningBoxStyles}>
                    ⚠️ {t.deleteWarning}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={dangerButtonStyles} onClick={onDeleteRequest}>
                      Confirmer la suppression
                    </button>
                    <button style={outlineButtonStyles} onClick={() => setShowDeleteConfirm(false)}>
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {deleteStatus.status === 'pending' && (
            <div style={pendingBoxStyles}>
              <p style={{ fontWeight: 500, color: '#721c24', marginBottom: '8px' }}>
                {t.deletePending}: {deleteStatus.scheduledDeletionAt && new Date(deleteStatus.scheduledDeletionAt).toLocaleDateString()}
              </p>
              {deleteStatus.canCancel && (
                <button style={outlineButtonStyles}>
                  {t.deleteCancel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Consents Section */}
      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>
          <span>✅</span> {t.consentsSection}
        </div>

        {renderConsentRow('termsOfService', t.termsOfService, t.termsOfServiceDesc, true)}
        {renderConsentRow('privacyPolicy', t.privacyPolicy, t.privacyPolicyDesc, true)}
        {renderConsentRow('dataProcessing', t.dataProcessing, t.dataProcessingDesc, true)}
        {renderConsentRow('marketingEmail', t.marketingEmail, t.marketingEmailDesc)}
        {renderConsentRow('marketingSms', t.marketingSms, t.marketingSmsDesc)}
        {renderConsentRow('gpsTracking', t.gpsTracking, t.gpsTrackingDesc)}
        {renderConsentRow('analyticsSharing', t.analyticsSharing, t.analyticsSharingDesc)}

        <div style={{ marginTop: '24px' }}>
          <button
            style={{ ...primaryButtonStyles, opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⏳ ...' : t.savePreferences}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;

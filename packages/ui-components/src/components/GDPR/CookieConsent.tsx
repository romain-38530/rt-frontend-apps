import React, { useState, useEffect, CSSProperties } from 'react';

export interface CookieConsentProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: (preferences: CookiePreferences) => void;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  language?: 'fr' | 'en';
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const translations = {
  fr: {
    title: 'Nous respectons votre vie privée',
    description: 'Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme. Vous pouvez choisir les cookies que vous acceptez.',
    acceptAll: 'Tout accepter',
    rejectAll: 'Tout refuser',
    customize: 'Personnaliser',
    save: 'Enregistrer mes préférences',
    necessary: 'Cookies essentiels',
    necessaryDesc: 'Nécessaires au fonctionnement du site (toujours actifs)',
    analytics: 'Cookies analytiques',
    analyticsDesc: 'Pour comprendre comment vous utilisez notre plateforme',
    marketing: 'Cookies marketing',
    marketingDesc: 'Pour vous proposer des publicités pertinentes',
    preferences: 'Cookies de préférences',
    preferencesDesc: 'Pour mémoriser vos paramètres et préférences',
    privacyPolicy: 'Politique de confidentialité',
    cookiePolicy: 'Politique des cookies',
  },
  en: {
    title: 'We respect your privacy',
    description: 'We use cookies to improve your experience on our platform. You can choose which cookies you accept.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject all',
    customize: 'Customize',
    save: 'Save my preferences',
    necessary: 'Essential cookies',
    necessaryDesc: 'Required for the site to work (always active)',
    analytics: 'Analytics cookies',
    analyticsDesc: 'To understand how you use our platform',
    marketing: 'Marketing cookies',
    marketingDesc: 'To show you relevant advertisements',
    preferences: 'Preference cookies',
    preferencesDesc: 'To remember your settings and preferences',
    privacyPolicy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
  }
};

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onRejectAll,
  onCustomize,
  privacyPolicyUrl = '/privacy',
  cookiePolicyUrl = '/cookies',
  language = 'fr'
}) => {
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const t = translations[language];

  const overlayStyles: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    padding: '20px',
  };

  const containerStyles: CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  };

  const titleStyles: CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const descStyles: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: 1.5,
  };

  const buttonContainerStyles: CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const buttonBaseStyles: CSSProperties = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    fontSize: '14px',
  };

  const primaryButtonStyles: CSSProperties = {
    ...buttonBaseStyles,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  };

  const secondaryButtonStyles: CSSProperties = {
    ...buttonBaseStyles,
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
  };

  const outlineButtonStyles: CSSProperties = {
    ...buttonBaseStyles,
    background: 'transparent',
    color: '#667eea',
    border: '1px solid #667eea',
  };

  const toggleContainerStyles: CSSProperties = {
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  };

  const toggleRowStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  };

  const toggleLabelStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const toggleNameStyles: CSSProperties = {
    fontWeight: 500,
    color: '#333',
  };

  const toggleDescStyles: CSSProperties = {
    fontSize: '12px',
    color: '#888',
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

  const linksStyles: CSSProperties = {
    marginTop: '16px',
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
  };

  const linkStyles: CSSProperties = {
    color: '#667eea',
    textDecoration: 'none',
  };

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
    onAcceptAll();
  };

  const handleRejectAll = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
    onRejectAll();
  };

  const handleSave = () => {
    onCustomize(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={overlayStyles}>
      <div style={containerStyles}>
        <div style={titleStyles}>
          <span style={{ fontSize: '24px' }}>🍪</span>
          {t.title}
        </div>
        <p style={descStyles}>{t.description}</p>

        {!showCustomize ? (
          <>
            <div style={buttonContainerStyles}>
              <button style={primaryButtonStyles} onClick={handleAcceptAll}>
                {t.acceptAll}
              </button>
              <button style={secondaryButtonStyles} onClick={handleRejectAll}>
                {t.rejectAll}
              </button>
              <button style={outlineButtonStyles} onClick={() => setShowCustomize(true)}>
                {t.customize}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={toggleContainerStyles}>
              {/* Necessary cookies */}
              <div style={toggleRowStyles}>
                <div style={toggleLabelStyles}>
                  <span style={toggleNameStyles}>{t.necessary}</span>
                  <span style={toggleDescStyles}>{t.necessaryDesc}</span>
                </div>
                <div style={switchStyles(true, true)}>
                  <div style={switchKnobStyles(true)} />
                </div>
              </div>

              {/* Analytics cookies */}
              <div style={toggleRowStyles}>
                <div style={toggleLabelStyles}>
                  <span style={toggleNameStyles}>{t.analytics}</span>
                  <span style={toggleDescStyles}>{t.analyticsDesc}</span>
                </div>
                <div
                  style={switchStyles(preferences.analytics)}
                  onClick={() => togglePreference('analytics')}
                >
                  <div style={switchKnobStyles(preferences.analytics)} />
                </div>
              </div>

              {/* Marketing cookies */}
              <div style={toggleRowStyles}>
                <div style={toggleLabelStyles}>
                  <span style={toggleNameStyles}>{t.marketing}</span>
                  <span style={toggleDescStyles}>{t.marketingDesc}</span>
                </div>
                <div
                  style={switchStyles(preferences.marketing)}
                  onClick={() => togglePreference('marketing')}
                >
                  <div style={switchKnobStyles(preferences.marketing)} />
                </div>
              </div>

              {/* Preferences cookies */}
              <div style={toggleRowStyles}>
                <div style={toggleLabelStyles}>
                  <span style={toggleNameStyles}>{t.preferences}</span>
                  <span style={toggleDescStyles}>{t.preferencesDesc}</span>
                </div>
                <div
                  style={switchStyles(preferences.preferences)}
                  onClick={() => togglePreference('preferences')}
                >
                  <div style={switchKnobStyles(preferences.preferences)} />
                </div>
              </div>
            </div>

            <div style={{ ...buttonContainerStyles, marginTop: '20px' }}>
              <button style={primaryButtonStyles} onClick={handleSave}>
                {t.save}
              </button>
              <button style={secondaryButtonStyles} onClick={() => setShowCustomize(false)}>
                ← Retour
              </button>
            </div>
          </>
        )}

        <div style={linksStyles}>
          <a href={privacyPolicyUrl} style={linkStyles}>{t.privacyPolicy}</a>
          <a href={cookiePolicyUrl} style={linkStyles}>{t.cookiePolicy}</a>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

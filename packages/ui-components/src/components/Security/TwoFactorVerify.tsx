import React, { useState, useRef, CSSProperties } from 'react';

export interface TwoFactorVerifyProps {
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
  onUseBackupCode: () => void;
  userEmail?: string;
  language?: 'fr' | 'en';
}

const translations = {
  fr: {
    title: 'Vérification en deux étapes',
    subtitle: 'Entrez le code à 6 chiffres de votre application d\'authentification',
    verifying: 'Vérification...',
    verify: 'Vérifier',
    cancel: 'Annuler',
    invalidCode: 'Code invalide. Veuillez réessayer.',
    useBackupCode: 'Utiliser un code de récupération',
    rememberDevice: 'Se souvenir de cet appareil pendant 30 jours',
    trustedDevice: 'Appareil de confiance',
    securityTip: 'Conseil sécurité : Ne partagez jamais vos codes d\'authentification.',
  },
  en: {
    title: 'Two-Step Verification',
    subtitle: 'Enter the 6-digit code from your authenticator app',
    verifying: 'Verifying...',
    verify: 'Verify',
    cancel: 'Cancel',
    invalidCode: 'Invalid code. Please try again.',
    useBackupCode: 'Use a recovery code',
    rememberDevice: 'Remember this device for 30 days',
    trustedDevice: 'Trusted device',
    securityTip: 'Security tip: Never share your authentication codes.',
  }
};

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  onVerify,
  onCancel,
  onUseBackupCode,
  userEmail,
  language = 'fr'
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = translations[language];

  const overlayStyles: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  };

  const containerStyles: CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    margin: '20px',
    padding: '32px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  };

  const iconStyles: CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const titleStyles: CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '8px',
  };

  const subtitleStyles: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  };

  const emailStyles: CSSProperties = {
    fontSize: '14px',
    color: '#667eea',
    fontWeight: 500,
    marginBottom: '24px',
  };

  const codeInputContainerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  };

  const codeInputStyles: CSSProperties = {
    width: '50px',
    height: '60px',
    textAlign: 'center',
    fontSize: '28px',
    fontWeight: 600,
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const errorStyles: CSSProperties = {
    color: '#dc3545',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '10px',
    background: '#f8d7da',
    borderRadius: '8px',
  };

  const buttonStyles: CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    fontSize: '16px',
    marginBottom: '12px',
  };

  const primaryButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  };

  const secondaryButtonStyles: CSSProperties = {
    ...buttonStyles,
    background: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
  };

  const linkStyles: CSSProperties = {
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    marginTop: '16px',
  };

  const checkboxContainerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#666',
  };

  const tipStyles: CSSProperties = {
    marginTop: '20px',
    padding: '12px',
    background: '#e8f4fd',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#1976d2',
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    if (codeToVerify.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const isValid = await onVerify(codeToVerify);
      if (!isValid) {
        setError(t.invalidCode);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(t.invalidCode);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyles}>
      <div style={containerStyles}>
        <div style={iconStyles}>🔐</div>
        <h1 style={titleStyles}>{t.title}</h1>
        <p style={subtitleStyles}>{t.subtitle}</p>

        {userEmail && (
          <p style={emailStyles}>{userEmail}</p>
        )}

        <div style={codeInputContainerStyles}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              style={{
                ...codeInputStyles,
                borderColor: error ? '#dc3545' : digit ? '#667eea' : '#e0e0e0',
                background: digit ? '#f8f9ff' : 'white',
              }}
            />
          ))}
        </div>

        {error && <div style={errorStyles}>❌ {error}</div>}

        <div style={checkboxContainerStyles}>
          <input
            type="checkbox"
            id="rememberDevice"
            checked={rememberDevice}
            onChange={e => setRememberDevice(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="rememberDevice" style={{ cursor: 'pointer' }}>
            {t.rememberDevice}
          </label>
        </div>

        <button
          style={{
            ...primaryButtonStyles,
            opacity: loading || code.join('').length !== 6 ? 0.7 : 1,
          }}
          onClick={() => handleVerify()}
          disabled={loading || code.join('').length !== 6}
        >
          {loading ? '⏳ ' + t.verifying : t.verify}
        </button>

        <button style={secondaryButtonStyles} onClick={onCancel}>
          {t.cancel}
        </button>

        <a style={linkStyles} onClick={onUseBackupCode}>
          🔑 {t.useBackupCode}
        </a>

        <div style={tipStyles}>
          💡 {t.securityTip}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;

import React, { useState, useRef, CSSProperties } from 'react';

export interface TwoFactorSetupProps {
  qrCodeUrl: string;
  secret: string;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
  onSuccess: (backupCodes: string[]) => void;
  language?: 'fr' | 'en';
}

const translations = {
  fr: {
    title: 'Activer l\'authentification à deux facteurs',
    step1: 'Étape 1 : Scanner le QR Code',
    step1Desc: 'Scannez ce QR code avec votre application d\'authentification (Google Authenticator, Authy, etc.)',
    step2: 'Étape 2 : Entrer le code',
    step2Desc: 'Entrez le code à 6 chiffres affiché par votre application',
    secretLabel: 'Clé secrète (si vous ne pouvez pas scanner)',
    copied: 'Copié !',
    copy: 'Copier',
    verify: 'Vérifier et activer',
    cancel: 'Annuler',
    invalidCode: 'Code invalide. Veuillez réessayer.',
    successTitle: '2FA activée avec succès !',
    backupCodesTitle: 'Codes de récupération',
    backupCodesDesc: 'Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu\'une seule fois.',
    downloadCodes: 'Télécharger les codes',
    done: 'Terminé',
    warning: 'Important : Ces codes ne seront plus affichés.',
  },
  en: {
    title: 'Enable Two-Factor Authentication',
    step1: 'Step 1: Scan QR Code',
    step1Desc: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)',
    step2: 'Step 2: Enter the code',
    step2Desc: 'Enter the 6-digit code displayed by your app',
    secretLabel: 'Secret key (if you cannot scan)',
    copied: 'Copied!',
    copy: 'Copy',
    verify: 'Verify and enable',
    cancel: 'Cancel',
    invalidCode: 'Invalid code. Please try again.',
    successTitle: '2FA enabled successfully!',
    backupCodesTitle: 'Recovery Codes',
    backupCodesDesc: 'Keep these codes in a safe place. Each code can only be used once.',
    downloadCodes: 'Download codes',
    done: 'Done',
    warning: 'Important: These codes will not be displayed again.',
  }
};

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  qrCodeUrl,
  secret,
  onVerify,
  onCancel,
  onSuccess,
  language = 'fr'
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = translations[language];

  const containerStyles: CSSProperties = {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '32px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  };

  const titleStyles: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '24px',
    textAlign: 'center',
  };

  const stepStyles: CSSProperties = {
    marginBottom: '24px',
  };

  const stepTitleStyles: CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const stepDescStyles: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  };

  const qrContainerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '16px',
  };

  const secretContainerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
  };

  const codeInputContainerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  };

  const codeInputStyles: CSSProperties = {
    width: '48px',
    height: '56px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 600,
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
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

  const errorStyles: CSSProperties = {
    color: '#dc3545',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '16px',
  };

  const successContainerStyles: CSSProperties = {
    textAlign: 'center',
  };

  const successIconStyles: CSSProperties = {
    fontSize: '64px',
    marginBottom: '16px',
  };

  const backupCodesContainerStyles: CSSProperties = {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    marginBottom: '20px',
  };

  const backupCodeStyles: CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '16px',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0',
  };

  const warningBoxStyles: CSSProperties = {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#856404',
    textAlign: 'center',
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
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const isValid = await onVerify(fullCode);
      if (isValid) {
        // Generate mock backup codes for demo
        const mockBackupCodes = Array.from({ length: 8 }, () =>
          Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
          Math.random().toString(36).substring(2, 6).toUpperCase()
        );
        setBackupCodes(mockBackupCodes);
        setSuccess(true);
        onSuccess(mockBackupCodes);
      } else {
        setError(t.invalidCode);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(t.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `SYMPHONI.A - Codes de récupération 2FA\n${'='.repeat(40)}\n\n${backupCodes.join('\n')}\n\n${'='.repeat(40)}\nConservez ces codes en lieu sûr.\nChaque code ne peut être utilisé qu'une seule fois.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'symphonia-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (success) {
    return (
      <div style={containerStyles}>
        <div style={successContainerStyles}>
          <div style={successIconStyles}>🎉</div>
          <h2 style={titleStyles}>{t.successTitle}</h2>

          <div style={backupCodesContainerStyles}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              {t.backupCodesTitle}
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {t.backupCodesDesc}
            </p>
            {backupCodes.map((code, index) => (
              <div key={index} style={backupCodeStyles}>{code}</div>
            ))}
          </div>

          <div style={warningBoxStyles}>
            ⚠️ {t.warning}
          </div>

          <button style={secondaryButtonStyles} onClick={downloadBackupCodes}>
            📥 {t.downloadCodes}
          </button>

          <button style={primaryButtonStyles} onClick={() => onSuccess(backupCodes)}>
            {t.done}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>{t.title}</h1>

      {/* Step 1: QR Code */}
      <div style={stepStyles}>
        <div style={stepTitleStyles}>
          <span style={{ background: '#667eea', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
          {t.step1}
        </div>
        <p style={stepDescStyles}>{t.step1Desc}</p>

        <div style={qrContainerStyles}>
          <img src={qrCodeUrl} alt="QR Code 2FA" style={{ width: '200px', height: '200px' }} />
        </div>

        <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{t.secretLabel}</p>
        <div style={secretContainerStyles}>
          <code style={{ flex: 1, wordBreak: 'break-all' }}>{secret}</code>
          <button
            onClick={copySecret}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {copied ? '✓ ' + t.copied : t.copy}
          </button>
        </div>
      </div>

      {/* Step 2: Enter Code */}
      <div style={stepStyles}>
        <div style={stepTitleStyles}>
          <span style={{ background: '#667eea', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
          {t.step2}
        </div>
        <p style={stepDescStyles}>{t.step2Desc}</p>

        <div style={codeInputContainerStyles}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                ...codeInputStyles,
                borderColor: error ? '#dc3545' : digit ? '#667eea' : '#e0e0e0',
              }}
            />
          ))}
        </div>

        {error && <p style={errorStyles}>{error}</p>}
      </div>

      <button
        style={{ ...primaryButtonStyles, opacity: loading || code.join('').length !== 6 ? 0.7 : 1 }}
        onClick={handleVerify}
        disabled={loading || code.join('').length !== 6}
      >
        {loading ? '⏳ ...' : t.verify}
      </button>

      <button style={secondaryButtonStyles} onClick={onCancel}>
        {t.cancel}
      </button>
    </div>
  );
};

export default TwoFactorSetup;

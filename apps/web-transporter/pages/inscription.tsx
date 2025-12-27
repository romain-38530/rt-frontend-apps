import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Types
interface DocumentUpload {
  type: 'kbis' | 'assurance' | 'licence' | 'other';
  file: File | null;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
}

interface FormData {
  companyName: string;
  email: string;
  phone: string;
  siret: string;
  address: string;
  postalCode: string;
  city: string;
  contactName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptNewsletter: boolean;
}

// Plans disponibles
const plans = [
  {
    id: 'trial',
    name: 'Essai Gratuit',
    price: 0,
    duration: '30 jours',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    features: [
      '10 transports gratuits',
      'Acces a la bourse de fret AFFRET.IA',
      'Matching intelligent avec chargeurs',
      'eCMR integree',
      'Aucune commission',
      'Paiement a 30 jours'
    ],
    current: true
  },
  {
    id: 'transporteur',
    name: 'Transporteur',
    price: 200,
    duration: '/mois',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    features: [
      'Transports illimites',
      'Acces prioritaire aux offres',
      'Bourse de fret complete',
      'eCMR integree',
      'Support dedie',
      'Aucune commission'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 699,
    duration: '/mois',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    popular: true,
    features: [
      'Tout Transporteur inclus',
      'Planification avancee',
      'Tracking temps reel',
      'KPI et analytics',
      'Gestion de flotte',
      'API et integrations TMS'
    ]
  }
];

// Documents requis - Tous obligatoires pour tous les comptes
const requiredDocuments = [
  { type: 'kbis', label: 'Extrait KBIS', description: 'Moins de 3 mois', required: true },
  { type: 'assurance', label: 'Attestation assurance', description: 'RC Pro et marchandises', required: true },
  { type: 'licence', label: 'Licence de transport', description: 'Licence communautaire', required: true }
];

export default function InscriptionPage() {
  const router = useRouter();
  const { ref, email: urlEmail, trial } = router.query;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('trial');

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    email: '',
    phone: '',
    siret: '',
    address: '',
    postalCode: '',
    city: '',
    contactName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptNewsletter: true
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { type: 'kbis', file: null, status: 'pending' },
    { type: 'assurance', file: null, status: 'pending' },
    { type: 'licence', file: null, status: 'pending' }
  ]);

  // Pre-remplir l'email si fourni dans l'URL
  useEffect(() => {
    if (urlEmail && typeof urlEmail === 'string') {
      setFormData(prev => ({ ...prev, email: urlEmail }));
    }
    if (trial === '10') {
      setSelectedPlan('trial');
    }
  }, [urlEmail, trial]);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleDocumentUpload = (type: string, file: File) => {
    setDocuments(prev => prev.map(doc =>
      doc.type === type ? { ...doc, file, status: 'pending' as const } : doc
    ));
  };

  const validateStep1 = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Le nom de l\'entreprise est requis');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Le telephone est requis');
      return false;
    }
    if (!formData.siret.trim() || formData.siret.length < 14) {
      setError('SIRET invalide (14 chiffres requis)');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.address.trim()) {
      setError('L\'adresse est requise');
      return false;
    }
    if (!formData.postalCode.trim()) {
      setError('Le code postal est requis');
      return false;
    }
    if (!formData.city.trim()) {
      setError('La ville est requise');
      return false;
    }
    if (!formData.contactName.trim()) {
      setError('Le nom du contact est requis');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.password || formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions generales');
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    // Vérifier que les documents obligatoires sont fournis
    const kbisDoc = documents.find(d => d.type === 'kbis');
    const assuranceDoc = documents.find(d => d.type === 'assurance');
    const licenceDoc = documents.find(d => d.type === 'licence');

    if (!kbisDoc?.file) {
      setError('L\'extrait KBIS est obligatoire pour finaliser votre inscription');
      return false;
    }
    if (!assuranceDoc?.file) {
      setError('L\'attestation d\'assurance est obligatoire pour finaliser votre inscription');
      return false;
    }
    if (!licenceDoc?.file) {
      setError('La licence de transport est obligatoire pour finaliser votre inscription');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simuler l'inscription (a remplacer par appel API reel)
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://d2swp5s4jfg8ri.cloudfront.net';

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          phone: formData.phone,
          siret: formData.siret,
          address: {
            street: formData.address,
            postalCode: formData.postalCode,
            city: formData.city
          },
          contactName: formData.contactName,
          role: 'transporter',
          subscription: {
            plan: selectedPlan,
            trialTransports: selectedPlan === 'trial' ? 10 : 0,
            trialExpiry: selectedPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
          },
          source: ref || 'affretia',
          acceptNewsletter: formData.acceptNewsletter
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      // Stocker le token et rediriger
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess(true);

      // Rediriger vers le dashboard apres 3 secondes
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      // En mode demo, simuler le succes
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        localStorage.setItem('authToken', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          companyName: formData.companyName,
          role: 'transporter',
          subscription: { plan: selectedPlan, trialTransports: 10 }
        }));
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600' as const,
    color: '#374151',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '16px 32px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  // Page de succes
  if (success) {
    return (
      <>
        <Head>
          <title>Inscription reussie - SYMPHONI.A</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '60px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <span style={{ fontSize: '40px', color: 'white' }}>&#10003;</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
              Bienvenue sur SYMPHONI.A !
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
              Votre compte a ete cree avec succes.<br />
              <strong style={{ color: '#22c55e' }}>10 transports gratuits</strong> ont ete credites sur votre compte.
            </p>
            <div style={{
              background: '#f0fdf4',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{ margin: 0, color: '#166534', fontSize: '14px' }}>
                Redirection vers votre espace transporteur dans quelques secondes...
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: '100%'
              }}
            >
              Acceder a mon espace
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Inscription Transporteur - SYMPHONI.A</title>
        <meta name="description" content="Inscrivez-vous gratuitement et beneficiez de 10 transports offerts" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0 }}>SYMPHONI.A</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>Control Tower du Transport</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Deja inscrit ?</span>
            <button
              onClick={() => router.push('/login')}
              style={{
                ...buttonStyle,
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '10px 20px',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '40px 20px 20px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {['Entreprise', 'Coordonnees', 'Securite', 'Documents', 'Abonnement'].map((label, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: step > idx + 1 ? '#22c55e' : step === idx + 1 ? 'white' : 'rgba(255,255,255,0.2)',
                  color: step > idx + 1 ? 'white' : step === idx + 1 ? '#1a365d' : 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span style={{
                  fontSize: '12px',
                  color: step >= idx + 1 ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: step === idx + 1 ? '700' : '400'
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(step / 5) * 100}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Form Container */}
        <div style={{ padding: '0 20px 60px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>&#9888;</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Entreprise */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  Informations entreprise
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                  Renseignez les informations de votre societe de transport
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Nom de l'entreprise *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      placeholder="Ex: Transport Express SARL"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email professionnel *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="contact@entreprise.fr"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Telephone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Numero SIRET *</label>
                    <input
                      type="text"
                      value={formData.siret}
                      onChange={(e) => updateFormData('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
                      placeholder="12345678901234"
                      maxLength={14}
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      14 chiffres sans espaces
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Coordonnees */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  Coordonnees
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                  Adresse du siege social et contact principal
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Adresse *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="123 rue du Transport"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Code postal *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="69001"
                      maxLength={5}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Lyon"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Nom du contact principal *</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => updateFormData('contactName', e.target.value)}
                      placeholder="Jean Dupont"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Securite */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  Securite du compte
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                  Creez un mot de passe securise pour votre compte
                </p>

                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Mot de passe *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Minimum 8 caracteres"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmer le mot de passe *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                        style={{ marginTop: '4px', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        J'accepte les <a href="/cgu" style={{ color: '#667eea' }}>conditions generales d'utilisation</a> et la <a href="/confidentialite" style={{ color: '#667eea' }}>politique de confidentialite</a> *
                      </span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.acceptNewsletter}
                        onChange={(e) => updateFormData('acceptNewsletter', e.target.checked)}
                        style={{ marginTop: '4px', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        Je souhaite recevoir les offres de transport et actualites SYMPHONI.A
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  Documents justificatifs
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                  Les 3 documents sont <strong style={{ color: '#dc2626' }}>obligatoires</strong> pour activer votre compte
                </p>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {requiredDocuments.map((doc) => {
                    const uploadedDoc = documents.find(d => d.type === doc.type);
                    return (
                      <div
                        key={doc.type}
                        style={{
                          border: '2px dashed #e5e7eb',
                          borderRadius: '12px',
                          padding: '24px',
                          background: uploadedDoc?.file ? '#f0fdf4' : '#fafafa',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#111827' }}>
                              {doc.label} {doc.required && <span style={{ color: '#ef4444' }}>*</span>}
                            </h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{doc.description}</p>
                          </div>
                          <div>
                            {uploadedDoc?.file ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: '#22c55e', fontWeight: '600', fontSize: '14px' }}>
                                  &#10003; {uploadedDoc.file.name}
                                </span>
                                <button
                                  onClick={() => handleDocumentUpload(doc.type, null as any)}
                                  style={{
                                    background: '#fef2f2',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            ) : (
                              <label style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                Choisir un fichier
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => e.target.files?.[0] && handleDocumentUpload(doc.type, e.target.files[0])}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>&#9888;</span>
                  <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
                    <strong>Les 3 documents sont obligatoires</strong> - KBIS, attestation d'assurance et licence de transport sont requis pour valider votre inscription et acceder a la bourse de fret.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Abonnement */}
            {step === 5 && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  Choisissez votre formule
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                  Commencez avec l'essai gratuit ou passez directement a un abonnement
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      style={{
                        border: selectedPlan === plan.id ? '3px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '24px',
                        cursor: 'pointer',
                        position: 'relative',
                        background: selectedPlan === plan.id ? '#f8fafc' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      {plan.popular && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: plan.gradient,
                          color: 'white',
                          padding: '4px 16px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          RECOMMANDE
                        </div>
                      )}

                      {plan.current && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '16px',
                          background: '#22c55e',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          OFFRE DE BIENVENUE
                        </div>
                      )}

                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        {plan.name}
                      </h3>

                      <div style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        background: plan.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '16px'
                      }}>
                        {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{plan.duration}</span>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {plan.features.map((feature, idx) => (
                          <li key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: '#374151'
                          }}>
                            <span style={{ color: '#22c55e' }}>&#10003;</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {selectedPlan === plan.id && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '24px',
                          height: '24px',
                          background: '#667eea',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px'
                        }}>
                          &#10003;
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '24px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontWeight: '700' }}>
                    {selectedPlan === 'trial' ? 'Votre essai gratuit inclut :' : 'Votre abonnement inclut :'}
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d' }}>
                    <li>Aucune commission sur les transports</li>
                    <li>Paiement a 30 jours selon conditions du donneur d'ordre</li>
                    <li>Acces a la bourse de fret AFFRET.IA</li>
                    <li>eCMR integree</li>
                    {selectedPlan === 'trial' && <li><strong>10 transports offerts pendant 30 jours</strong></li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  style={{
                    ...buttonStyle,
                    background: '#f3f4f6',
                    color: '#374151'
                  }}
                >
                  &#8592; Retour
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  onClick={nextStep}
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  Continuer &#8594;
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    minWidth: '200px'
                  }}
                >
                  {loading ? 'Creation du compte...' : 'Creer mon compte gratuit'}
                </button>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '40px',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: '&#128274;', text: 'Donnees securisees' },
              { icon: '&#9989;', text: 'Sans engagement' },
              { icon: '&#128176;', text: 'Aucune commission' },
              { icon: '&#128666;', text: '10 transports offerts' }
            ].map((badge, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px'
              }}>
                <span style={{ fontSize: '20px' }} dangerouslySetInnerHTML={{ __html: badge.icon }} />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Page d'acceptation d'invitation - Portail Logisticien
 * Permet au logisticien d'accepter l'invitation et de créer son compte
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { LogisticianService } from '@rt/utils';
import type {
  ValidateInvitationResponse,
  RegisterLogisticianRequest,
  LogisticianContact,
  OrderAccessLevel,
} from '@rt/contracts';

const ACCESS_LABELS: Record<OrderAccessLevel, { label: string; description: string }> = {
  view: { label: 'Lecture', description: 'Consulter les commandes' },
  edit: { label: '\u00c9dition', description: 'Modifier les commandes' },
  sign: { label: 'Signature', description: 'Signer les documents' },
  full: { label: 'Complet', description: 'Acc\u00e8s total' },
};

export default function InvitationPage() {
  const router = useRouter();
  const { token } = router.query;

  const [step, setStep] = useState<'validating' | 'valid' | 'invalid' | 'form' | 'success'>('validating');
  const [invitation, setInvitation] = useState<ValidateInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulaire d'inscription
  const [formData, setFormData] = useState({
    companyName: '',
    password: '',
    confirmPassword: '',
    contactName: '',
    contactPhone: '',
    siret: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (token && typeof token === 'string') {
      validateToken(token);
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      const result = await LogisticianService.validateInvitation(tokenValue);
      setInvitation(result);
      if (result.valid) {
        setFormData(prev => ({
          ...prev,
          companyName: result.companyName || '',
        }));
        setStep('valid');
      } else {
        setError(result.error || 'Invitation invalide ou expir\u00e9e');
        setStep('invalid');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
      setStep('invalid');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.companyName) {
      setFormError('Le nom de l\'entreprise est requis');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caract\u00e8res');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!formData.contactName) {
      setFormError('Le nom du contact est requis');
      return;
    }

    setSubmitting(true);

    try {
      const contacts: LogisticianContact[] = [{
        name: formData.contactName,
        email: invitation?.email || '',
        phone: formData.contactPhone,
        role: 'gestionnaire',
        isPrimary: true,
      }];

      const request: RegisterLogisticianRequest = {
        token: token as string,
        password: formData.password,
        companyName: formData.companyName,
        contacts,
        siret: formData.siret || undefined,
      };

      const result = await LogisticianService.acceptInvitation(request);

      // Stocker les tokens d'authentification
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          logisticianId: result.logisticianId,
          industrialId: result.industrialId,
          industrialName: result.industrialName,
        }));
      }

      setStep('success');

      // Rediriger vers le dashboard apr\u00e8s 3 secondes
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Accepter l'invitation | SYMPHONI.A Logisticien</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
              SYMPHONI.A
            </div>
            <div style={{ color: '#64748b', marginTop: '4px' }}>Portail Logisticien</div>
          </div>

          {/* \u00c9tat: Validation en cours */}
          {step === 'validating' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ color: '#64748b' }}>V\u00e9rification de l'invitation...</p>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* \u00c9tat: Invitation invalide */}
          {step === 'invalid' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>&#10060;</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', marginBottom: '12px' }}>
                Invitation invalide
              </h2>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                {error || 'Cette invitation est invalide ou a expir\u00e9.'}
              </p>
              <button
                onClick={() => router.push('/login')}
                style={{
                  padding: '12px 24px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Retour \u00e0 la connexion
              </button>
            </div>
          )}

          {/* \u00c9tat: Invitation valide - Afficher les d\u00e9tails */}
          {step === 'valid' && invitation && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#127881;</div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                  Vous \u00eates invit\u00e9 !
                </h2>
                <p style={{ color: '#64748b' }}>
                  <strong>{invitation.industrialName}</strong> vous invite \u00e0 g\u00e9rer ses commandes
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Niveau d'acc\u00e8s accord\u00e9</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    borderRadius: '20px',
                    fontWeight: '600',
                    marginTop: '8px',
                  }}>
                    {ACCESS_LABELS[invitation.accessLevel || 'view']?.label} - {ACCESS_LABELS[invitation.accessLevel || 'view']?.description}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Invitation valide jusqu'au</div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                    {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }) : 'Non sp\u00e9cifi\u00e9'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('form')}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Accepter l'invitation
              </button>
            </div>
          )}

          {/* \u00c9tat: Formulaire d'inscription */}
          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px', textAlign: 'center' }}>
                Cr\u00e9er votre compte
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  Nom de votre entreprise *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  SIRET (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  Votre nom *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Pr\u00e9nom Nom"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  T\u00e9l\u00e9phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caract\u00e8res"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              {formError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep('valid')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '14px',
                    background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Cr\u00e9ation...' : 'Cr\u00e9er mon compte'}
                </button>
              </div>
            </form>
          )}

          {/* \u00c9tat: Succ\u00e8s */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>&#9989;</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e', marginBottom: '12px' }}>
                Compte cr\u00e9\u00e9 avec succ\u00e8s !
              </h2>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                Vous allez \u00eatre redirig\u00e9 vers votre tableau de bord...
              </p>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #22c55e',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite',
              }} />
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

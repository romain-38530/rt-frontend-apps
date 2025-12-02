/**
 * Page Finalize Payment - Enregistrement carte bancaire après onboarding
 *
 * Cette page permet aux clients ayant choisi le paiement par carte
 * d'enregistrer leurs coordonnées bancaires via Stripe SetupIntent.
 *
 * URL: /finalize-payment?requestId=xxx&email=xxx
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://dgze8l03lwl5h.cloudfront.net';

function FinalizePaymentContent() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Récupérer les paramètres de l'URL
  const requestId = searchParams?.get('requestId');
  const email = searchParams?.get('email');

  useEffect(() => {
    if (!requestId || !email) {
      setError('Lien invalide. Veuillez utiliser le lien reçu par email.');
    }
  }, [requestId, email]);

  // Créer la session Stripe SetupIntent
  const handleSetupCard = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!requestId || !email) {
        throw new Error('Paramètres manquants');
      }

      // Créer la session Stripe Setup
      const response = await fetch(`${API_URL}/api/stripe/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          email,
          successUrl: `${window.location.origin}/finalize-payment/success?requestId=${requestId}`,
          cancelUrl: `${window.location.origin}/finalize-payment?requestId=${requestId}&email=${encodeURIComponent(email)}&cancelled=true`
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la création de la session');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement manquante');
      }

    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la configuration');
      setLoading(false);
    }
  };

  const cancelled = searchParams?.get('cancelled') === 'true';

  return (
    <div className="finalize-page">
      <div className="container">
        {/* Logo */}
        <div className="logo-container">
          <Image
            src="/symphonia-logo.png"
            alt="SYMPHONI.A"
            width={250}
            height={60}
            priority
          />
        </div>

        {/* Header */}
        <header className="header">
          <h1>Finalisez votre inscription</h1>
          <p>Enregistrez votre carte bancaire pour activer votre compte</p>
        </header>

        {/* Message annulation */}
        {cancelled && !error && (
          <div className="warning-card">
            <span className="warning-icon">⚠️</span>
            <div>
              <h3>Paiement annulé</h3>
              <p>Vous avez annulé l'enregistrement de votre carte. Cliquez ci-dessous pour réessayer.</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="error-card">
            <span className="error-icon">❌</span>
            <div>
              <h3>Erreur</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {!error && (
          <div className="main-content">
            <div className="info-section">
              <div className="info-card">
                <h2>Pourquoi enregistrer ma carte ?</h2>
                <ul>
                  <li>
                    <span className="icon">⚡</span>
                    <div>
                      <strong>Activation immédiate</strong>
                      <p>Votre compte sera activé dès validation</p>
                    </div>
                  </li>
                  <li>
                    <span className="icon">🔒</span>
                    <div>
                      <strong>Paiement sécurisé</strong>
                      <p>Vos données sont protégées par Stripe</p>
                    </div>
                  </li>
                  <li>
                    <span className="icon">💳</span>
                    <div>
                      <strong>Aucun prélèvement immédiat</strong>
                      <p>La carte sera utilisée pour les prochaines factures</p>
                    </div>
                  </li>
                  <li>
                    <span className="icon">✓</span>
                    <div>
                      <strong>Modification possible</strong>
                      <p>Changez de carte à tout moment depuis votre espace</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="reference-card">
                <p className="label">Référence de votre demande</p>
                <p className="value">{requestId || '...'}</p>
                <p className="email">{email ? decodeURIComponent(email) : '...'}</p>
              </div>
            </div>

            <div className="action-section">
              <div className="action-card">
                <div className="stripe-badge">
                  <span>🔐</span>
                  <span>Powered by Stripe</span>
                </div>

                <h3>Enregistrer ma carte bancaire</h3>
                <p>
                  Vous allez être redirigé vers notre plateforme de paiement sécurisée.
                  Aucun montant ne sera prélevé aujourd'hui.
                </p>

                <div className="cards-accepted">
                  <span>💳</span>
                  <span>Visa, Mastercard, Amex acceptées</span>
                </div>

                <button
                  onClick={handleSetupCard}
                  disabled={loading || !requestId || !email}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Redirection...
                    </>
                  ) : (
                    <>
                      Enregistrer ma carte →
                    </>
                  )}
                </button>

                <p className="terms">
                  En continuant, vous acceptez nos{' '}
                  <a href="/terms" target="_blank">CGV</a> et{' '}
                  <a href="/privacy" target="_blank">politique de confidentialité</a>.
                </p>
              </div>

              <div className="help-card">
                <h4>Besoin d'aide ?</h4>
                <p>
                  Si vous rencontrez des difficultés, contactez notre support à{' '}
                  <a href="mailto:support@symphonia-controltower.com">
                    support@symphonia-controltower.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .finalize-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 40px 20px;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
        }

        .logo-container {
          text-align: center;
          margin-bottom: 32px;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .header p {
          font-size: 18px;
          color: #64748b;
          margin: 0;
        }

        .error-card, .warning-card {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .warning-card {
          background: #fffbeb;
          border-color: #fde68a;
        }

        .error-icon, .warning-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .error-card h3 {
          margin: 0 0 8px 0;
          color: #dc2626;
          font-size: 18px;
        }

        .warning-card h3 {
          margin: 0 0 8px 0;
          color: #d97706;
          font-size: 18px;
        }

        .error-card p, .warning-card p {
          margin: 0;
          color: #374151;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .info-card, .action-card, .reference-card, .help-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .info-card h2 {
          margin: 0 0 24px 0;
          font-size: 20px;
          color: #1e293b;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: flex-start;
        }

        .info-card li .icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .info-card li strong {
          display: block;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .info-card li p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        .reference-card {
          margin-top: 24px;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border: 2px solid #6366f1;
          text-align: center;
        }

        .reference-card .label {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #6366f1;
          font-weight: 600;
          text-transform: uppercase;
        }

        .reference-card .value {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-family: monospace;
          color: #312e81;
          font-weight: 700;
        }

        .reference-card .email {
          margin: 0;
          font-size: 14px;
          color: #4338ca;
        }

        .action-card {
          border: 2px solid #3b82f6;
        }

        .stripe-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 20px;
        }

        .action-card h3 {
          margin: 0 0 12px 0;
          font-size: 22px;
          color: #1e293b;
        }

        .action-card > p {
          margin: 0 0 20px 0;
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
        }

        .cards-accepted {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #64748b;
        }

        .btn-primary {
          width: 100%;
          padding: 18px 32px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .terms {
          margin: 16px 0 0 0;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }

        .terms a {
          color: #3b82f6;
          text-decoration: none;
        }

        .help-card {
          margin-top: 24px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .help-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #475569;
        }

        .help-card p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .help-card a {
          color: #3b82f6;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .main-content {
            grid-template-columns: 1fr;
          }

          .header h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}

export default function FinalizePaymentPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#666'
      }}>
        Chargement...
      </div>
    }>
      <FinalizePaymentContent />
    </Suspense>
  );
}

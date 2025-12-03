/**
 * Page de Checkout - Paiement Stripe
 *
 * Cette page gère le processus de paiement pour un type de compte sélectionné.
 *
 * Flow:
 * 1. Récupération des paramètres (userId, accountType, price)
 * 2. Affichage du récapitulatif
 * 3. Création de la session Stripe
 * 4. Redirection vers Stripe Checkout
 * 5. Retour sur /checkout/success ou /checkout/cancel
 *
 * URL: https://rt-technologie.com/checkout?userId=123&accountType=TRANSPORTEUR&price=499
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BackendAccountType } from '../../../../../src/hooks/usePricing';
import { getAccountTypeInfo, formatPrice } from '../../../../../src/utils/accountTypeMapping';

// ==========================================
// Configuration
// ==========================================

const API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

// ==========================================
// Composant avec useSearchParams
// ==========================================

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  // Récupérer les paramètres de l'URL
  const userId = searchParams?.get('userId');
  const accountType = searchParams?.get('accountType') as BackendAccountType;
  const price = searchParams?.get('price');
  const promoCode = searchParams?.get('promoCode');

  // Récupérer les infos du type de compte
  const accountInfo = accountType ? getAccountTypeInfo(accountType) : null;

  useEffect(() => {
    // Vérifier que tous les paramètres requis sont présents
    if (!userId || !accountType || !price) {
      setError('Paramètres manquants. Veuillez recommencer le processus de sélection.');
    }
  }, [userId, accountType, price]);

  // Créer la session Stripe et rediriger
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!userId || !accountType) {
        throw new Error('Paramètres manquants');
      }

      // Récupérer les conditions depuis sessionStorage
      const conditionsStr = sessionStorage.getItem('userConditions');
      const conditions = conditionsStr ? JSON.parse(conditionsStr) : {};

      // Créer la session Stripe
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          accountType,
          conditions,
          promoCode: promoCode || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la création de la session de paiement');
      }

      // Sauvegarder la session
      setSessionData(data);

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement manquante');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <header className="checkout-header">
          <h1>Finalisation de votre commande</h1>
          <p>Vérifiez les détails avant de procéder au paiement</p>
        </header>

        {/* Erreur */}
        {error && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <div>
              <h3>Erreur</h3>
              <p>{error}</p>
              <button onClick={() => router.push('/select-account-type')}>
                ← Retour à la sélection
              </button>
            </div>
          </div>
        )}

        {/* Récapitulatif */}
        {!error && accountInfo && (
          <div className="checkout-container">
            {/* Colonne gauche - Récapitulatif */}
            <div className="checkout-summary">
              <h2>Récapitulatif</h2>

              <div className="summary-card">
                <div className="summary-header">
                  <span className="account-icon" style={{ fontSize: '48px' }}>
                    {accountInfo.icon}
                  </span>
                  <div>
                    <h3>{accountInfo.displayName}</h3>
                    <p>{accountInfo.description}</p>
                  </div>
                </div>

                <div className="summary-features">
                  <h4>Fonctionnalités incluses:</h4>
                  <ul>
                    {accountInfo.features.slice(0, 5).map((feature, index) => (
                      <li key={index}>
                        <span className="checkmark">✓</span>
                        {feature}
                      </li>
                    ))}
                    {accountInfo.features.length > 5 && (
                      <li className="more-features">
                        + {accountInfo.features.length - 5} autres fonctionnalités
                      </li>
                    )}
                  </ul>
                </div>

                <div className="summary-price">
                  <div className="price-row">
                    <span>Prix:</span>
                    <span className="price-value">{price}€/mois</span>
                  </div>

                  {promoCode && (
                    <div className="price-row promo">
                      <span>Code promo appliqué:</span>
                      <span className="promo-code">{promoCode}</span>
                    </div>
                  )}

                  <div className="price-row total">
                    <span>Total:</span>
                    <span className="total-value">{price}€/mois</span>
                  </div>
                </div>
              </div>

              <div className="security-badges">
                <div className="badge">
                  <span>🔒</span>
                  <span>Paiement sécurisé par Stripe</span>
                </div>
                <div className="badge">
                  <span>✓</span>
                  <span>Sans engagement</span>
                </div>
                <div className="badge">
                  <span>💳</span>
                  <span>Cartes acceptées</span>
                </div>
              </div>
            </div>

            {/* Colonne droite - Paiement */}
            <div className="checkout-payment">
              <h2>Paiement</h2>

              <div className="payment-card">
                <div className="payment-info">
                  <h3>Paiement sécurisé avec Stripe</h3>
                  <p>
                    Vous allez être redirigé vers notre plateforme de paiement sécurisée
                    Stripe pour finaliser votre achat.
                  </p>

                  <ul className="payment-features">
                    <li>🔒 Connexion sécurisée SSL</li>
                    <li>💳 Cartes Visa, Mastercard, Amex acceptées</li>
                    <li>✓ Paiement en 1 clic</li>
                    <li>📧 Confirmation par email</li>
                  </ul>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-checkout"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Redirection vers Stripe...
                    </>
                  ) : (
                    <>
                      Procéder au paiement →
                    </>
                  )}
                </button>

                <p className="payment-terms">
                  En continuant, vous acceptez nos{' '}
                  <a href="/terms">conditions générales</a> et notre{' '}
                  <a href="/privacy">politique de confidentialité</a>.
                </p>
              </div>

              <div className="payment-faq">
                <h4>Questions fréquentes</h4>

                <details>
                  <summary>Puis-je annuler à tout moment ?</summary>
                  <p>
                    Oui, vous pouvez annuler votre abonnement à tout moment depuis
                    votre tableau de bord. Aucun frais d'annulation.
                  </p>
                </details>

                <details>
                  <summary>Quand serai-je débité ?</summary>
                  <p>
                    Le premier prélèvement sera effectué aujourd'hui. Les prélèvements
                    suivants auront lieu tous les mois à la même date.
                  </p>
                </details>

                <details>
                  <summary>Mes données sont-elles sécurisées ?</summary>
                  <p>
                    Oui, toutes les transactions sont sécurisées par Stripe,
                    conforme PCI DSS niveau 1. Vos données bancaires ne transitent
                    jamais par nos serveurs.
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 40px 20px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .checkout-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #1f2937;
        }

        .checkout-header p {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .error-card {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .error-icon {
          font-size: 32px;
        }

        .error-card h3 {
          margin: 0 0 8px 0;
          color: #dc2626;
        }

        .error-card p {
          margin: 0 0 16px 0;
          color: #991b1b;
        }

        .error-card button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .checkout-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .checkout-summary,
        .checkout-payment {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #1f2937;
        }

        .summary-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .summary-header {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-header h3 {
          margin: 0 0 4px 0;
          font-size: 20px;
          color: #1f2937;
        }

        .summary-header p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .summary-features h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .summary-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .summary-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #4b5563;
        }

        .checkmark {
          color: #10b981;
          font-weight: 700;
        }

        .more-features {
          font-style: italic;
          color: #9ca3af;
        }

        .summary-price {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .price-row.promo {
          color: #10b981;
        }

        .price-row.total {
          font-size: 18px;
          font-weight: 700;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
        }

        .total-value {
          color: #3b82f6;
        }

        .security-badges {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .badge span:first-child {
          font-size: 24px;
        }

        .payment-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .payment-info h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #1f2937;
        }

        .payment-info p {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        .payment-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .payment-features li {
          padding: 8px 0;
          font-size: 14px;
          color: #4b5563;
        }

        .btn-checkout {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-checkout:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-checkout:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .payment-terms {
          margin-top: 16px;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }

        .payment-terms a {
          color: #3b82f6;
          text-decoration: none;
        }

        .payment-faq h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        details {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
        }

        summary {
          font-weight: 500;
          color: #374151;
        }

        details p {
          margin: 12px 0 0 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .checkout-container {
            grid-template-columns: 1fr;
          }

          .security-badges {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// Page Principale avec Suspense
// ==========================================

export default function CheckoutPage() {
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
        Chargement de la page de paiement...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

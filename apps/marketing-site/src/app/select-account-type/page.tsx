/**
 * Page de Sélection de Type de Compte
 *
 * Cette page permet à un utilisateur nouvellement inscrit de choisir
 * son type de compte parmi les options disponibles.
 *
 * Flow:
 * 1. Utilisateur s'inscrit
 * 2. Utilisateur est redirigé vers /select-account-type
 * 3. Utilisateur sélectionne son type de compte
 * 4. Le prix est calculé automatiquement selon conditions
 * 5. Utilisateur confirme et est redirigé vers le paiement ou son portal
 *
 * URL: https://rt-technologie.com/select-account-type
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePricing, BackendAccountType, formatPrice } from '../../../../../src/hooks/usePricing';
import { getAllCreatableTypesInfo, AccountTypeInfo } from '../../../../../src/utils/accountTypeMapping';
import { PricingCard } from '../../../../../packages/ui-components/src/components/PricingCard';

// ==========================================
// Page Principale
// ==========================================

export default function SelectAccountTypePage() {
  const { allPricing, calculateMultiplePrices, loading, error } = usePricing();

  const [selectedType, setSelectedType] = useState<BackendAccountType | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, any>>({});

  // Obtenir la liste des types créables
  const creatableTypes = getAllCreatableTypesInfo();

  // Obtenir les conditions utilisateur depuis URL ou session
  // Ex: ?invitedBy=EXPEDITEUR&userId=123
  const [userConditions, setUserConditions] = useState<any>({});

  useEffect(() => {
    // Récupérer les params de l'URL
    const params = new URLSearchParams(window.location.search);
    const invitedBy = params.get('invitedBy');
    const userId = params.get('userId');

    const conditions: any = {};

    if (invitedBy) {
      conditions.invitedBy = invitedBy;
    }

    setUserConditions(conditions);

    // Stocker userId dans sessionStorage pour utilisation ultérieure
    if (userId) {
      sessionStorage.setItem('userId', userId);
    }
  }, []);

  // Calculer les prix pour tous les types
  useEffect(() => {
    if (allPricing.length > 0) {
      const types = creatableTypes.map(t => t.type);

      calculateMultiplePrices(types, userConditions).then(results => {
        const pricesMap: Record<string, any> = {};
        results.forEach(result => {
          pricesMap[result.accountType] = result;
        });
        setCalculatedPrices(pricesMap);
      });
    }
  }, [allPricing, userConditions]);

  // Gérer la sélection d'un type
  const handleSelectType = (accountType: BackendAccountType) => {
    setSelectedType(accountType);
  };

  // Gérer l'application du code promo
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);

    try {
      // Recalculer les prix avec le code promo
      const types = creatableTypes.map(t => t.type);

      const results = await Promise.all(
        types.map(type =>
          fetch(`${process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL}/api/pricing/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountType: type,
              conditions: userConditions,
              promoCode: promoCode
            })
          }).then(r => r.json()).then(r => r.data)
        )
      );

      const pricesMap: Record<string, any> = {};
      results.forEach(result => {
        if (result) {
          pricesMap[result.accountType] = result;
        }
      });

      setCalculatedPrices(pricesMap);
    } catch (err) {
      console.error('Error applying promo code:', err);
      alert('Erreur lors de l\'application du code promo');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Gérer la confirmation
  const handleConfirm = () => {
    if (!selectedType) {
      alert('Veuillez sélectionner un type de compte');
      return;
    }

    const userId = sessionStorage.getItem('userId');
    const selectedPrice = calculatedPrices[selectedType];

    // Stocker les infos de sélection
    sessionStorage.setItem('selectedAccountType', selectedType);
    sessionStorage.setItem('selectedPrice', JSON.stringify(selectedPrice));

    // Rediriger vers le paiement ou le portal
    if (selectedPrice?.finalPrice > 0) {
      // Paiement requis
      window.location.href = `/checkout?accountType=${selectedType}&userId=${userId}&price=${selectedPrice.finalPrice}`;
    } else {
      // Gratuit, rediriger directement vers le portal
      window.location.href = `/activate-account?accountType=${selectedType}&userId=${userId}`;
    }
  };

  // Message pour utilisateur invité
  const invitedByMessage = userConditions.invitedBy
    ? `Vous avez été invité par un ${userConditions.invitedBy}. Certains types de comptes peuvent être gratuits !`
    : null;

  return (
    <div className="select-account-page">
      {/* Header */}
      <header className="page-header">
        <div className="container">
          <h1>Choisissez votre type de compte</h1>
          <p>Sélectionnez le type de compte qui correspond le mieux à vos besoins</p>

          {invitedByMessage && (
            <div className="invited-message">
              🎉 {invitedByMessage}
            </div>
          )}
        </div>
      </header>

      {/* Code Promo */}
      <section className="promo-section">
        <div className="container">
          <div className="promo-input-group">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Code promo (optionnel)"
              className="promo-input"
            />
            <button
              onClick={handleApplyPromo}
              disabled={!promoCode.trim() || isApplyingPromo}
              className="promo-button"
            >
              {isApplyingPromo ? 'Application...' : 'Appliquer'}
            </button>
          </div>
        </div>
      </section>

      {/* Grille de cartes de prix */}
      <section className="pricing-grid-section">
        <div className="container">
          {loading && <div className="loading">Chargement des prix...</div>}

          {error && <div className="error">Erreur: {error}</div>}

          {!loading && !error && (
            <div className="pricing-grid">
              {creatableTypes.map((typeInfo) => {
                const pricing = allPricing.find(p => p.accountType === typeInfo.type);
                const calculatedPrice = calculatedPrices[typeInfo.type];

                // Marquer EXPEDITEUR comme populaire, TRANSPORTEUR comme recommandé si invité
                const isPopular = typeInfo.type === 'EXPEDITEUR';
                const isRecommended = typeInfo.type === 'TRANSPORTEUR' && userConditions.invitedBy;

                return (
                  <PricingCard
                    key={typeInfo.type}
                    accountType={typeInfo.type}
                    pricing={pricing}
                    calculatedPrice={calculatedPrice}
                    userConditions={userConditions}
                    promoCode={promoCode}
                    onSelect={handleSelectType}
                    isSelected={selectedType === typeInfo.type}
                    isPopular={isPopular}
                    isRecommended={isRecommended}
                    size="medium"
                    variant="outlined"
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      {selectedType && (
        <section className="actions-section">
          <div className="container">
            <div className="selected-summary">
              <h3>Récapitulatif de votre sélection</h3>
              <div className="summary-content">
                <div>
                  <strong>Type de compte:</strong>{' '}
                  {getAllCreatableTypesInfo().find(t => t.type === selectedType)?.displayName}
                </div>
                <div>
                  <strong>Prix:</strong>{' '}
                  {calculatedPrices[selectedType]?.finalPrice === 0
                    ? 'Gratuit'
                    : formatPrice(
                        calculatedPrices[selectedType]?.finalPrice,
                        calculatedPrices[selectedType]?.currency,
                        calculatedPrices[selectedType]?.billingPeriod
                      )
                  }
                </div>
                {calculatedPrices[selectedType]?.appliedVariant && (
                  <div>
                    <strong>Variante:</strong> {calculatedPrices[selectedType].appliedVariant.name}
                  </div>
                )}
                {calculatedPrices[selectedType]?.appliedPromo && (
                  <div className="promo-applied">
                    🎉 <strong>Code promo appliqué:</strong> {calculatedPrices[selectedType].appliedPromo.code}
                  </div>
                )}
              </div>

              <button onClick={handleConfirm} className="btn-confirm">
                {calculatedPrices[selectedType]?.finalPrice > 0
                  ? 'Continuer vers le paiement →'
                  : 'Activer mon compte →'
                }
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Styles */}
      <style jsx>{`
        .select-account-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header */
        .page-header {
          padding: 60px 0 40px;
          text-align: center;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .page-header h1 {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .page-header p {
          font-size: 18px;
          color: #6b7280;
          margin: 0;
        }

        .invited-message {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          padding: 12px 24px;
          border-radius: 8px;
          margin-top: 20px;
          display: inline-block;
          font-weight: 500;
        }

        /* Code Promo */
        .promo-section {
          padding: 24px 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .promo-input-group {
          display: flex;
          justify-content: center;
          gap: 12px;
          max-width: 400px;
          margin: 0 auto;
        }

        .promo-input {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          text-transform: uppercase;
        }

        .promo-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .promo-button {
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .promo-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .promo-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Grille de prix */
        .pricing-grid-section {
          padding: 60px 0;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 16px;
        }

        .error {
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        }

        /* Actions */
        .actions-section {
          padding: 40px 0 60px;
        }

        .selected-summary {
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
        }

        .selected-summary h3 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-content {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: left;
        }

        .summary-content > div {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-content > div:last-child {
          border-bottom: none;
        }

        .promo-applied {
          color: #059669;
        }

        .btn-confirm {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 16px 48px;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 28px;
          }

          .page-header p {
            font-size: 16px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .selected-summary {
            padding: 24px;
          }

          .btn-confirm {
            width: 100%;
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Composant PricingCard - Carte de Prix Réutilisable
 *
 * Affiche une carte de prix pour un type de compte avec:
 * - Nom et icône du type de compte
 * - Prix (base ou calculé)
 * - Liste des fonctionnalités
 * - Badge pour les variantes (invité, premium, upgrade only)
 * - Bouton d'action (sélectionner, upgrade, etc.)
 *
 * Usage:
 * ```tsx
 * <PricingCard
 *   accountType="TRANSPORTEUR"
 *   pricing={pricingData}
 *   onSelect={() => handleSelect('TRANSPORTEUR')}
 *   userConditions={{ invitedBy: 'EXPEDITEUR' }}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  BackendAccountType,
  Pricing,
  PriceCalculationResult,
  PriceConditions,
  formatPrice,
  calculateDiscountPercentage
} from '../../../../src/hooks/usePricing';
import {
  getAccountTypeInfo,
  getIcon,
  getColor,
  isDirectlyCreatable,
  isUpgradeOnly,
  isAdminOnly
} from '../../../../src/utils/accountTypeMapping';

// ==========================================
// Types
// ==========================================

export interface PricingCardProps {
  /** Type de compte backend */
  accountType: BackendAccountType;

  /** Données de pricing (optionnel si calculatedPrice est fourni) */
  pricing?: Pricing;

  /** Prix calculé (prioritaire sur pricing) */
  calculatedPrice?: PriceCalculationResult;

  /** Conditions utilisateur pour le calcul automatique */
  userConditions?: PriceConditions;

  /** Code promo appliqué */
  promoCode?: string;

  /** Fonction appelée lors de la sélection */
  onSelect?: (accountType: BackendAccountType) => void;

  /** Texte du bouton (défaut: "Sélectionner") */
  buttonText?: string;

  /** La carte est-elle sélectionnée */
  isSelected?: boolean;

  /** La carte est-elle désactivée */
  isDisabled?: boolean;

  /** Afficher le badge "Populaire" */
  isPopular?: boolean;

  /** Afficher le badge "Recommandé" */
  isRecommended?: boolean;

  /** Taille de la carte */
  size?: 'small' | 'medium' | 'large';

  /** Thème de couleur */
  variant?: 'default' | 'outlined' | 'filled';
}

// ==========================================
// Composant Principal
// ==========================================

export function PricingCard({
  accountType,
  pricing,
  calculatedPrice,
  userConditions = {},
  promoCode,
  onSelect,
  buttonText,
  isSelected = false,
  isDisabled = false,
  isPopular = false,
  isRecommended = false,
  size = 'medium',
  variant = 'default'
}: PricingCardProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(calculatedPrice || null);

  // Obtenir les informations du type de compte
  const accountInfo = getAccountTypeInfo(accountType);
  const icon = getIcon(accountType);
  const color = getColor(accountType);

  // Déterminer le prix à afficher
  useEffect(() => {
    if (calculatedPrice) {
      setPriceResult(calculatedPrice);
    } else if (pricing) {
      // Calculer le prix côté client avec les conditions
      setIsCalculating(true);

      const result = pricing.calculatePrice?.(userConditions, promoCode);
      if (result) {
        setPriceResult({
          accountType: pricing.accountType,
          displayName: pricing.displayName,
          originalPrice: pricing.basePrice,
          finalPrice: result.finalPrice,
          currency: result.currency || pricing.currency,
          billingPeriod: result.billingPeriod || pricing.billingPeriod,
          appliedVariant: result.appliedVariant || null,
          appliedPromo: result.appliedPromo || null
        });
      } else {
        // Fallback: utiliser le prix de base
        setPriceResult({
          accountType: pricing.accountType,
          displayName: pricing.displayName,
          originalPrice: pricing.basePrice,
          finalPrice: pricing.basePrice,
          currency: pricing.currency,
          billingPeriod: pricing.billingPeriod,
          appliedVariant: null,
          appliedPromo: null
        });
      }

      setIsCalculating(false);
    }
  }, [pricing, calculatedPrice, userConditions, promoCode]);

  // Gérer le clic sur le bouton
  const handleClick = () => {
    if (!isDisabled && onSelect) {
      onSelect(accountType);
    }
  };

  // Calculer la réduction si applicable
  const hasDiscount = priceResult && priceResult.originalPrice > priceResult.finalPrice;
  const discountPercentage = hasDiscount
    ? calculateDiscountPercentage(priceResult.originalPrice, priceResult.finalPrice)
    : 0;

  // Déterminer les classes CSS
  const cardClasses = [
    'pricing-card',
    `pricing-card-${size}`,
    `pricing-card-${variant}`,
    isSelected && 'pricing-card-selected',
    isDisabled && 'pricing-card-disabled',
    (isPopular || isRecommended) && 'pricing-card-highlighted'
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} style={{ borderColor: isSelected ? color : undefined }}>
      {/* Badges */}
      {(isPopular || isRecommended || accountInfo.isUpgradeOnly) && (
        <div className="pricing-card-badges">
          {isPopular && <span className="badge badge-popular">Populaire</span>}
          {isRecommended && <span className="badge badge-recommended">Recommandé</span>}
          {accountInfo.isUpgradeOnly && <span className="badge badge-upgrade">Upgrade seulement</span>}
          {accountInfo.isAdminOnly && <span className="badge badge-admin">Admin seulement</span>}
        </div>
      )}

      {/* Header */}
      <div className="pricing-card-header">
        <div className="pricing-card-icon" style={{ backgroundColor: `${color}20` }}>
          <span style={{ fontSize: size === 'small' ? '2em' : size === 'large' ? '4em' : '3em' }}>
            {icon}
          </span>
        </div>
        <h3 className="pricing-card-title">{accountInfo.displayName}</h3>
        <p className="pricing-card-description">{accountInfo.description}</p>
      </div>

      {/* Prix */}
      <div className="pricing-card-price">
        {isCalculating ? (
          <div className="price-loading">Calcul...</div>
        ) : priceResult ? (
          <>
            {hasDiscount && (
              <div className="price-original">
                <span className="price-strikethrough">
                  {formatPrice(priceResult.originalPrice, priceResult.currency)}
                </span>
                <span className="price-discount">-{discountPercentage}%</span>
              </div>
            )}

            <div className="price-final">
              <span className="price-amount">
                {priceResult.finalPrice === 0 ? (
                  <span className="price-free">Gratuit</span>
                ) : (
                  <>
                    <span className="price-value">{priceResult.finalPrice}</span>
                    <span className="price-currency">€</span>
                  </>
                )}
              </span>
              {priceResult.finalPrice > 0 && (
                <span className="price-period">/ {priceResult.billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
              )}
            </div>

            {/* Variante appliquée */}
            {priceResult.appliedVariant && (
              <div className="price-variant">
                <span className="variant-badge">{priceResult.appliedVariant.name}</span>
              </div>
            )}

            {/* Promo appliquée */}
            {priceResult.appliedPromo && (
              <div className="price-promo">
                🎉 Code promo appliqué: <strong>{priceResult.appliedPromo.code}</strong>
              </div>
            )}
          </>
        ) : (
          <div className="price-unavailable">Prix non disponible</div>
        )}
      </div>

      {/* Fonctionnalités */}
      <div className="pricing-card-features">
        <h4>Fonctionnalités incluses:</h4>
        <ul>
          {accountInfo.features.slice(0, size === 'small' ? 3 : size === 'large' ? 10 : 5).map((feature, index) => (
            <li key={index}>
              <span className="feature-checkmark" style={{ color }}>✓</span>
              <span>{feature}</span>
            </li>
          ))}
          {size !== 'large' && accountInfo.features.length > (size === 'small' ? 3 : 5) && (
            <li className="feature-more">
              + {accountInfo.features.length - (size === 'small' ? 3 : 5)} autres fonctionnalités
            </li>
          )}
        </ul>
      </div>

      {/* Actions */}
      {onSelect && (
        <div className="pricing-card-actions">
          <button
            onClick={handleClick}
            disabled={isDisabled || accountInfo.isAdminOnly}
            className={`btn-select ${isSelected ? 'btn-selected' : ''}`}
            style={{
              backgroundColor: isSelected ? color : undefined,
              borderColor: color
            }}
          >
            {accountInfo.isAdminOnly
              ? 'Admin seulement'
              : accountInfo.isUpgradeOnly
              ? 'Upgrade requis'
              : buttonText || (isSelected ? '✓ Sélectionné' : 'Sélectionner')
            }
          </button>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .pricing-card {
          position: relative;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .pricing-card:hover:not(.pricing-card-disabled) {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .pricing-card-selected {
          border-width: 3px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .pricing-card-disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pricing-card-highlighted {
          border-color: #3b82f6;
        }

        .pricing-card-outlined {
          background: transparent;
        }

        .pricing-card-filled {
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        /* Badges */
        .pricing-card-badges {
          position: absolute;
          top: -12px;
          right: 16px;
          display: flex;
          gap: 8px;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-popular {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
        }

        .badge-recommended {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .badge-upgrade {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .badge-admin {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
        }

        /* Header */
        .pricing-card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .pricing-card-icon {
          width: fit-content;
          margin: 0 auto 16px;
          padding: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pricing-card-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .pricing-card-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        /* Prix */
        .pricing-card-price {
          text-align: center;
          margin-bottom: 24px;
          min-height: 80px;
        }

        .price-loading {
          font-size: 14px;
          color: #9ca3af;
          padding: 20px;
        }

        .price-original {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .price-strikethrough {
          font-size: 16px;
          color: #9ca3af;
          text-decoration: line-through;
        }

        .price-discount {
          background: #fef3c7;
          color: #f59e0b;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .price-final {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .price-free {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
        }

        .price-amount {
          display: flex;
          align-items: baseline;
        }

        .price-value {
          font-size: 48px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .price-currency {
          font-size: 24px;
          font-weight: 600;
          color: #6b7280;
        }

        .price-period {
          font-size: 14px;
          color: #9ca3af;
        }

        .price-variant {
          margin-top: 8px;
        }

        .variant-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .price-promo {
          margin-top: 8px;
          font-size: 12px;
          color: #059669;
        }

        .price-unavailable {
          font-size: 14px;
          color: #ef4444;
          padding: 20px;
        }

        /* Fonctionnalités */
        .pricing-card-features {
          flex: 1;
          margin-bottom: 24px;
        }

        .pricing-card-features h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .pricing-card-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pricing-card-features li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #4b5563;
        }

        .feature-checkmark {
          flex-shrink: 0;
          font-weight: 700;
          font-size: 16px;
        }

        .feature-more {
          font-style: italic;
          color: #9ca3af;
        }

        /* Actions */
        .pricing-card-actions {
          margin-top: auto;
        }

        .btn-select {
          width: 100%;
          padding: 12px 24px;
          border: 2px solid;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          color: inherit;
        }

        .btn-select:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-selected {
          color: white;
        }

        .btn-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Tailles */
        .pricing-card-small {
          padding: 16px;
        }

        .pricing-card-small .pricing-card-title {
          font-size: 16px;
        }

        .pricing-card-small .price-value {
          font-size: 32px;
        }

        .pricing-card-large {
          padding: 32px;
        }

        .pricing-card-large .pricing-card-title {
          font-size: 24px;
        }

        .pricing-card-large .price-value {
          font-size: 64px;
        }
      `}</style>
    </div>
  );
}

export default PricingCard;

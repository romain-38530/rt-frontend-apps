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

      // Note: calculatePrice n'existe pas sur le type Pricing
      // Utiliser directement le prix de base
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

    </div>
  );
}

export default PricingCard;

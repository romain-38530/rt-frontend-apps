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
import { useToast } from '../../components/ui/toast';

// ==========================================
// Page Principale
// ==========================================

export default function SelectAccountTypePage() {
  const { allPricing, calculateMultiplePrices, loading, error } = usePricing();
  const { toast } = useToast();

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
      toast.error('Erreur lors de l\'application du code promo');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Gérer la confirmation
  const handleConfirm = () => {
    if (!selectedType) {
      toast.warning('Veuillez sélectionner un type de compte');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="py-16 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Choisissez votre type de compte
          </h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Sélectionnez le type de compte qui correspond le mieux à vos besoins
          </p>

          {invitedByMessage && (
            <div className="mt-6 inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold">
              🎉 {invitedByMessage}
            </div>
          )}
        </div>
      </header>

      {/* Code Promo */}
      <section className="py-6 px-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Code promo (optionnel)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-orange-500 uppercase"
            />
            <button
              onClick={handleApplyPromo}
              disabled={!promoCode.trim() || isApplyingPromo}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplyingPromo ? 'Application...' : 'Appliquer'}
            </button>
          </div>
        </div>
      </section>

      {/* Grille de cartes de prix */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xl text-gray-600">Chargement des prix...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 px-6 py-4 rounded-xl text-center">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <section className="py-12 px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border-4 border-orange-500 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
                Récapitulatif de votre sélection
              </h3>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-orange-200">
                    <strong className="text-gray-700">Type de compte:</strong>
                    <span className="text-gray-900 font-semibold">
                      {getAllCreatableTypesInfo().find(t => t.type === selectedType)?.displayName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-orange-200">
                    <strong className="text-gray-700">Prix:</strong>
                    <span className="text-gray-900 font-semibold">
                      {calculatedPrices[selectedType]?.finalPrice === 0
                        ? 'Gratuit'
                        : formatPrice(
                            calculatedPrices[selectedType]?.finalPrice,
                            calculatedPrices[selectedType]?.currency,
                            calculatedPrices[selectedType]?.billingPeriod
                          )
                      }
                    </span>
                  </div>
                  {calculatedPrices[selectedType]?.appliedVariant && (
                    <div className="flex justify-between py-2 border-b border-orange-200">
                      <strong className="text-gray-700">Variante:</strong>
                      <span className="text-gray-900 font-semibold">
                        {calculatedPrices[selectedType].appliedVariant.name}
                      </span>
                    </div>
                  )}
                  {calculatedPrices[selectedType]?.appliedPromo && (
                    <div className="flex justify-between py-2 text-green-600">
                      <strong>Code promo appliqué:</strong>
                      <span className="font-semibold">
                        🎉 {calculatedPrices[selectedType].appliedPromo.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                {calculatedPrices[selectedType]?.finalPrice > 0
                  ? 'Continuer vers le paiement →'
                  : 'Activer mon compte →'
                }
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

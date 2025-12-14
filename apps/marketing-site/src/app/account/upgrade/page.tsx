'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccountUpgrade } from '@/hooks/useAccountUpgrade';
import { getAccountTypeInfo } from '@/types/account';
import type { AccountType } from '@/types/account';
import { useToast } from '../../../components/ui/toast';

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const fromTypeParam = searchParams.get('fromType') as AccountType | null;

  const { checkEligibility, upgradeAccount, canUpgrade, loading, error } = useAccountUpgrade();
  const { toast } = useToast();

  const [fromType, setFromType] = useState<AccountType | null>(fromTypeParam);
  const [reason, setReason] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    reasons: string[];
    requiredSteps: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toType: AccountType = 'industry'; // Always upgrading to industry

  useEffect(() => {
    if (!userId || !fromType) {
      router.push('/login?redirect=/account/upgrade');
    }
  }, [userId, fromType, router]);

  useEffect(() => {
    // Auto-check eligibility when page loads
    if (userId && fromType && !eligibilityResult) {
      handleCheckEligibility();
    }
  }, [userId, fromType]);

  const handleCheckEligibility = async () => {
    if (!userId || !fromType) return;

    setIsChecking(true);
    try {
      const result = await checkEligibility(userId, toType);
      setEligibilityResult(result);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpgrade = async () => {
    if (!userId || !fromType || !reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await upgradeAccount(userId, fromType, toType, reason);

      if (response.success) {
        // Show success message and redirect to new portal
        toast.success(`Félicitations ! Votre compte a été mis à niveau vers ${response.newAccountType}.`);
        window.location.href = response.newPortalUrl;
      } else {
        toast.error(response.message || 'Erreur lors de la mise à niveau du compte');
      }
    } catch (err) {
      console.error('Error upgrading account:', err);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId || !fromType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  const fromTypeInfo = getAccountTypeInfo(fromType);
  const toTypeInfo = getAccountTypeInfo(toType);
  const canDoUpgrade = canUpgrade(fromType, toType);

  if (!canDoUpgrade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Mise à niveau non disponible
          </h2>
          <p className="text-gray-600 mb-6">
            Votre type de compte actuel ({fromTypeInfo.displayName}) ne peut pas être mis à niveau
            vers un compte {toTypeInfo.displayName}.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Évolution de votre compte
          </h1>
          <p className="text-xl text-gray-600">
            Passez d'un compte {fromTypeInfo.displayName} à un compte {toTypeInfo.displayName}
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Current Account */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Compte actuel</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                Actuel
              </span>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{fromTypeInfo.icon}</div>
              <h4 className="text-2xl font-bold text-gray-900">{fromTypeInfo.displayName}</h4>
            </div>
            <p className="text-gray-600 text-sm mb-4">{fromTypeInfo.description}</p>
            <ul className="space-y-2">
              {fromTypeInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Target Account */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white border-2 border-blue-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouveau compte</h3>
              <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-sm font-semibold">
                Recommandé
              </span>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{toTypeInfo.icon}</div>
              <h4 className="text-2xl font-bold">{toTypeInfo.displayName}</h4>
            </div>
            <p className="text-blue-100 text-sm mb-4">{toTypeInfo.description}</p>
            <ul className="space-y-2">
              {toTypeInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {toTypeInfo.canGenerateOrders && (
              <div className="mt-4 pt-4 border-t border-blue-400">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-400 text-green-900">
                  🚀 Peut générer des commandes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility Check Results */}
        {isChecking && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700">Vérification de l'éligibilité...</span>
            </div>
          </div>
        )}

        {eligibilityResult && (
          <div className={`rounded-lg shadow-md p-6 mb-8 ${
            eligibilityResult.eligible ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
            <div className="flex items-start">
              {eligibilityResult.eligible ? (
                <svg className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-yellow-600 mr-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-3 ${
                  eligibilityResult.eligible ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {eligibilityResult.eligible
                    ? 'Vous êtes éligible à cette évolution !'
                    : 'Quelques étapes restantes'}
                </h3>

                {eligibilityResult.reasons.length > 0 && (
                  <div className="mb-4">
                    <p className={`font-semibold mb-2 ${
                      eligibilityResult.eligible ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      Raisons :
                    </p>
                    <ul className={`list-disc list-inside space-y-1 ${
                      eligibilityResult.eligible ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {eligibilityResult.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {eligibilityResult.requiredSteps.length > 0 && (
                  <div>
                    <p className="font-semibold text-yellow-800 mb-2">
                      Étapes requises avant l'évolution :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      {eligibilityResult.requiredSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Upgrade Form */}
        {eligibilityResult?.eligible && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Pourquoi souhaitez-vous évoluer ?
            </h3>
            <p className="text-gray-600 mb-4">
              Aidez-nous à comprendre vos besoins pour mieux vous accompagner dans cette évolution.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez vos motivations pour passer à un compte Industriel (ex: besoin de générer mes propres commandes, volume d'activité croissant, etc.)"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleUpgrade}
                disabled={!reason.trim() || isSubmitting}
                className={`
                  px-8 py-3 rounded-lg font-semibold transition-all duration-200
                  ${reason.trim() && !isSubmitting
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Évolution en cours...
                  </span>
                ) : (
                  'Confirmer l\'évolution'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info about the upgrade process */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            📋 À propos de l'évolution de compte
          </h4>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>L'évolution de compte est instantanée une fois validée</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vous conservez toutes vos données existantes (commandes, historique)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vous aurez accès à toutes les fonctionnalités du compte Industriel</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Un ajustement tarifaire pourra être appliqué selon votre abonnement actuel</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}

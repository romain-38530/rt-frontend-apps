'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccountTypes } from '@/hooks/useAccountTypes';
import { getCreatableAccountTypes } from '@/types/account';
import type { AccountType } from '@/types/account';
import { useToast } from '@rt/ui-components';

function SelectTypeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const { selectAccountType, loading, error } = useAccountTypes(userId || undefined);
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatableTypes = getCreatableAccountTypes();

  useEffect(() => {
    if (!userId) {
      // Redirect to login if no userId
      router.push('/login?redirect=/account/select-type');
    }
  }, [userId, router]);

  const handleSelectType = async () => {
    if (!selectedType || !userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await selectAccountType(selectedType, userId);

      if (response.success) {
        // Redirect to the user's dedicated portal
        window.location.href = response.redirectUrl || response.portalUrl;
      } else {
        toast.error(response.message || 'Erreur lors de la sélection du type de compte');
      }
    } catch (err) {
      console.error('Error selecting account type:', err);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue dans l'écosystème RT Technologie
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Félicitations ! Votre abonnement est actif.
          </p>
          <p className="text-lg text-gray-500">
            Sélectionnez le type de compte qui correspond à votre activité pour accéder à votre portail dédié.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {creatableTypes.map((accountType) => (
            <button
              key={accountType.type}
              onClick={() => setSelectedType(accountType.type)}
              disabled={loading || isSubmitting}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                ${selectedType === accountType.type
                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }
                ${loading || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected Indicator */}
              {selectedType === accountType.type && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className="text-5xl mb-4 text-center">
                {accountType.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                {accountType.displayName}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 text-center min-h-[3rem]">
                {accountType.description}
              </p>

              {/* Features List */}
              <ul className="space-y-2 mb-4">
                {accountType.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Badge for order generation capability */}
              {accountType.canGenerateOrders && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Peut générer des commandes
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto text-center">
          <button
            onClick={handleSelectType}
            disabled={!selectedType || loading || isSubmitting}
            className={`
              px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200
              ${selectedType && !loading && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accès à votre portail...
              </span>
            ) : (
              'Accéder à mon portail'
            )}
          </button>

          {selectedType && (
            <p className="mt-4 text-sm text-gray-600">
              Vous serez redirigé vers votre portail{' '}
              <span className="font-semibold">
                {creatableTypes.find(t => t.type === selectedType)?.displayName}
              </span>
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="max-w-3xl mx-auto mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Besoin de suivre uniquement vos commandes ?
              </h4>
              <p className="text-blue-800 mb-2">
                Les comptes <span className="font-semibold">Fournisseur</span> et{' '}
                <span className="font-semibold">Destinataire</span> sont créés automatiquement
                par les industriels lors de la création de commandes.
              </p>
              <p className="text-blue-700 text-sm">
                Si vous disposez déjà d'un compte Fournisseur ou Destinataire et souhaitez
                également générer vos propres commandes, vous pourrez évoluer vers un compte
                Industriel depuis votre portail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectAccountTypePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    }>
      <SelectTypeContent />
    </Suspense>
  );
}

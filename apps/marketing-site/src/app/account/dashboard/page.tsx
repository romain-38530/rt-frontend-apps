'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccountTypeInfo, canUpgradeAccountType } from '@/types/account';
import type { UserAccount, AccountType } from '@/types/account';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      router.push('/login?redirect=/account/dashboard');
      return;
    }

    fetchAccountInfo();
  }, [userId, router]);

  const fetchAccountInfo = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const response = await fetch(`${apiUrl}/api/account/info?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAccount(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des informations du compte';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPortal = () => {
    if (account?.accountType) {
      const typeInfo = getAccountTypeInfo(account.accountType);
      window.location.href = typeInfo.portalUrl;
    }
  };

  const handleUpgrade = () => {
    if (account?.accountType) {
      router.push(`/account/upgrade?userId=${userId}&fromType=${account.accountType}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Impossible de charger les informations du compte'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!account.accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Type de compte non défini
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez d'abord sélectionner votre type de compte.
          </p>
          <button
            onClick={() => router.push(`/account/select-type?userId=${userId}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Sélectionner mon type de compte
          </button>
        </div>
      </div>
    );
  }

  const accountTypeInfo = getAccountTypeInfo(account.accountType);
  const canUpgrade = account.accountType === 'supplier' || account.accountType === 'recipient';
  const upgradeAvailable = canUpgrade && canUpgradeAccountType(account.accountType, 'industry');

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_selection: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      active: { text: 'Actif', color: 'bg-green-100 text-green-800' },
      suspended: { text: 'Suspendu', color: 'bg-red-100 text-red-800' },
      expired: { text: 'Expiré', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const statusBadge = getStatusBadge(account.accountStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tableau de bord
          </h1>
          <p className="text-gray-600">
            Gérez votre compte et accédez à votre portail
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Type Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Mon type de compte</p>
                    <h2 className="text-3xl font-bold">{accountTypeInfo.displayName}</h2>
                  </div>
                  <div className="text-6xl">{accountTypeInfo.icon}</div>
                </div>
                <p className="text-blue-100">{accountTypeInfo.description}</p>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalités disponibles</h3>
                <ul className="space-y-3">
                  {accountTypeInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleGoToPortal}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Accéder à mon portail {accountTypeInfo.displayName}
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vos permissions</h3>
              <div className="flex flex-wrap gap-2">
                {account.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {permission.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Subscription Info */}
            {account.subscription && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Abonnement</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="text-lg font-semibold text-gray-900">{account.subscription.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{account.subscription.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de fin</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(account.subscription.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {account.subscription.price} {account.subscription.currency}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{account.email}</p>
                </div>
                {account.firstName && account.lastName && (
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="text-gray-900 font-medium">
                      {account.firstName} {account.lastName}
                    </p>
                  </div>
                )}
                {account.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-gray-900 font-medium">{account.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Statut du compte</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            {account.company && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Entreprise</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="text-gray-900 font-medium">{account.company.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro TVA</p>
                    <p className="text-gray-900 font-medium">{account.company.vatNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="text-gray-900 font-medium">{account.company.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pays</p>
                    <p className="text-gray-900 font-medium">{account.company.countryCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {upgradeAvailable && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🚀</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Passez à la vitesse supérieure !
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Évoluez vers un compte <span className="font-semibold">Industriel</span> et
                    générez vos propres commandes de transport
                  </p>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
                >
                  Évoluer mon compte
                </button>
              </div>
            )}

            {/* Account History */}
            {account.accountHistory && account.accountHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique</h3>
                <div className="space-y-3">
                  {account.accountHistory.map((entry, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {getAccountTypeInfo(entry.previousType).displayName} → {getAccountTypeInfo(entry.newType).displayName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(entry.upgradedAt).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{entry.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Login */}
            {account.lastLoginAt && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-sm text-gray-600">Dernière connexion</p>
                <p className="text-gray-900 font-medium">
                  {new Date(account.lastLoginAt).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

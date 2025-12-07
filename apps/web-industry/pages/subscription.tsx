import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSafeRouter } from '../lib/useSafeRouter';
import {
  CreditCard,
  Package,
  Check,
  Crown,
  Zap,
  TrendingUp,
  Settings,
  FileText,
  ChevronRight,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { isAuthenticated, getUser } from '../lib/auth';
import { subscriptionsApi } from '../lib/api';

interface SubscriptionInfo {
  id: string;
  subscriptionName: string;
  packName?: string;
  status: 'active' | 'trial' | 'past_due';
  pricing: {
    totalMonthly: number;
    discountPercent: number;
  };
  engagement: {
    type: string;
    endDate?: string;
  };
  activeModules: Array<{ moduleName: string; priceMonthly: number }>;
  trackingIALevel: string;
  usage: {
    transportsThisMonth: number;
  };
  trialEndsAt?: string;
  nextBillingDate?: string;
}

const MODULES = [
  { id: 'AFFRET_IA', name: 'Affret.IA', description: 'Bourse de fret intelligente', price: 0, commission: '4%' },
  { id: 'PALETTES_EUROPE', name: 'Palettes Europe', description: 'Gestion du parc palettes', price: 199 },
  { id: 'SIGNATURE_ELECTRONIQUE', name: 'Signature eCMR', description: 'CMR electronique', price: 99 },
  { id: 'PREFACTURATION', name: 'Prefacturation', description: 'Module prefacturation', price: 199 },
];

export default function SubscriptionPage() {
  const router = useSafeRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadSubscription();
  }, [router]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await subscriptionsApi.getCurrent();
      if (data && data.subscription) {
        setSubscription(data.subscription);
      } else if (data && data.id) {
        setSubscription(data);
      } else {
        // Fallback mock data
        setSubscription({
          id: 'sub-001',
          subscriptionName: 'Industriel',
          packName: 'Pack Industriel Premium',
          status: 'active',
          pricing: {
            totalMonthly: 699,
            discountPercent: 5,
          },
          engagement: {
            type: '4_years',
            endDate: '2028-06-15',
          },
          activeModules: [
            { moduleName: 'Affret.IA', priceMonthly: 0 },
            { moduleName: 'Signature eCMR', priceMonthly: 99 },
          ],
          trackingIALevel: 'INTERMEDIAIRE',
          usage: {
            transportsThisMonth: 67,
          },
          nextBillingDate: '2024-12-15',
        });
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      // Fallback mock data
      setSubscription({
        id: 'sub-001',
        subscriptionName: 'Industriel',
        packName: 'Pack Industriel Premium',
        status: 'active',
        pricing: {
          totalMonthly: 699,
          discountPercent: 5,
        },
        engagement: {
          type: '4_years',
          endDate: '2028-06-15',
        },
        activeModules: [
          { moduleName: 'Affret.IA', priceMonthly: 0 },
          { moduleName: 'Signature eCMR', priceMonthly: 99 },
        ],
        trackingIALevel: 'INTERMEDIAIRE',
        usage: {
          transportsThisMonth: 67,
        },
        nextBillingDate: '2024-12-15',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Periode d\'essai' },
      past_due: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Paiement en attente' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Mon Abonnement - SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white text-sm mb-2">
              &larr; Retour au portail
            </button>
            <h1 className="text-2xl font-bold">Mon Abonnement</h1>
            <p className="text-blue-200">Gerez votre abonnement et vos modules SYMPHONI.A</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : subscription ? (
            <>
              {/* Current Subscription Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <Crown className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{subscription.packName || subscription.subscriptionName}</h2>
                        <p className="text-blue-100">
                          Engagement {subscription.engagement.type.replace('_', ' ')}
                          {subscription.engagement.endDate && ` - jusqu'au ${subscription.engagement.endDate}`}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price */}
                    <div>
                      <p className="text-sm text-gray-500">Prix mensuel</p>
                      <p className="text-3xl font-bold text-gray-900">{formatPrice(subscription.pricing.totalMonthly)}</p>
                      {subscription.pricing.discountPercent > 0 && (
                        <p className="text-sm text-green-600">
                          -{subscription.pricing.discountPercent}% remise engagement
                        </p>
                      )}
                    </div>

                    {/* Usage */}
                    <div>
                      <p className="text-sm text-gray-500">Transports ce mois</p>
                      <p className="text-3xl font-bold text-gray-900">{subscription.usage.transportsThisMonth}</p>
                      <p className="text-sm text-gray-500">sur 100 inclus</p>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, subscription.usage.transportsThisMonth)}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Billing */}
                    <div>
                      <p className="text-sm text-gray-500">Prochaine facture</p>
                      <p className="text-xl font-bold text-gray-900">{subscription.nextBillingDate}</p>
                      <button className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Voir mes factures
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Modules */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Modules actifs</h3>
                  <button className="text-sm text-blue-600 hover:underline">
                    + Ajouter un module
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tracking IA */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Tracking IA {subscription.trackingIALevel}</p>
                        <p className="text-sm text-gray-500">Suivi intelligent</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>

                  {/* Active modules */}
                  {subscription.activeModules.map((mod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mod.moduleName}</p>
                          <p className="text-sm text-gray-500">
                            {mod.priceMonthly === 0 ? 'Inclus' : formatPrice(mod.priceMonthly) + '/mois'}
                          </p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Modules */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Modules disponibles</h3>
                <div className="space-y-3">
                  {MODULES.filter(m => !subscription.activeModules.some(am => am.moduleName === m.name)).map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mod.name}</p>
                          <p className="text-sm text-gray-500">{mod.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {mod.price === 0 ? 'Gratuit' : formatPrice(mod.price) + '/mois'}
                          </p>
                          {mod.commission && (
                            <p className="text-xs text-gray-500">+ {mod.commission} commission</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade Banner */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Passez au Pack Ultimate</h3>
                    <p className="text-purple-200 mt-1">
                      Tous les modules inclus, support 24/7, et account manager VIP
                    </p>
                    <p className="text-2xl font-bold mt-2">999EUR/mois <span className="text-sm font-normal">(-50%)</span></p>
                  </div>
                  <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50">
                    Upgrader maintenant
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ce mois</p>
                      <p className="text-xl font-bold text-gray-900">67 transports</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Economies Affret.IA</p>
                      <p className="text-xl font-bold text-gray-900">12,450 EUR</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="text-xl font-bold text-gray-900">Juin 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border rounded-lg hover:bg-gray-50">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Gerer mon abonnement</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border rounded-lg hover:bg-gray-50">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Moyen de paiement</span>
                </button>
              </div>
            </>
          ) : (
            /* No subscription */
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Aucun abonnement actif</h2>
              <p className="text-gray-500 mt-2">
                Decouvrez nos offres et commencez votre essai gratuit
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Voir les offres
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

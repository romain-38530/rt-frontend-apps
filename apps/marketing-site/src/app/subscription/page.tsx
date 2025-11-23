'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: Sparkles,
    price: 0,
    interval: 'mois',
    description: 'Parfait pour découvrir la plateforme',
    gradient: 'from-gray-500 to-gray-700',
    features: [
      { text: 'Accès limité aux fonctionnalités de base', included: true },
      { text: "Jusqu'à 10 commandes par mois", included: true },
      { text: 'Support par email', included: true },
      { text: 'Tableaux de bord basiques', included: true },
      { text: '1 utilisateur', included: true },
      { text: 'Accès : Industry, Recipient, Transporter', included: true },
      { text: 'Notifications en temps réel', included: false },
      { text: 'Rapports personnalisés', included: false },
      { text: 'Intégrations API', included: false },
      { text: 'Support prioritaire', included: false }
    ],
    cta: 'Commencer gratuitement',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    price: 49,
    interval: 'mois',
    description: 'Idéal pour les équipes en croissance',
    gradient: 'from-indigo-500 to-purple-600',
    features: [
      { text: 'Toutes les fonctionnalités de base', included: true },
      { text: 'Commandes illimitées', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Tableaux de bord avancés', included: true },
      { text: "Jusqu'à 10 utilisateurs", included: true },
      { text: 'Accès à tous les portails', included: true },
      { text: 'Intégrations API', included: true },
      { text: 'Rapports personnalisés', included: true },
      { text: 'Notifications en temps réel', included: true },
      { text: 'Gestionnaire de compte dédié', included: false }
    ],
    cta: 'Démarrer Pro',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: 199,
    interval: 'mois',
    description: 'Pour les grandes organisations',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      { text: 'Toutes les fonctionnalités Pro', included: true },
      { text: 'Utilisateurs illimités', included: true },
      { text: 'Support dédié 24/7', included: true },
      { text: 'Gestionnaire de compte dédié', included: true },
      { text: 'SLA garanti 99.9%', included: true },
      { text: 'Personnalisation complète', included: true },
      { text: 'Formation sur site', included: true },
      { text: 'Intégration sur mesure', included: true },
      { text: 'Stockage illimité', included: true },
      { text: 'API calls illimitées', included: true }
    ],
    cta: 'Contacter les ventes',
    popular: false
  }
];

export default function SubscriptionPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Ici on pourrait rediriger vers une page de checkout ou stocker dans localStorage
    localStorage.setItem('selectedPlan', planId);
    alert(`Plan ${planId} sélectionné ! Redirection vers la configuration...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">RT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                RT Technologie
              </h1>
              <p className="text-xs text-gray-500">Plateforme logistique</p>
            </div>
          </div>
          <a
            href="/portals"
            className="px-4 py-2 bg-white border-2 border-indigo-500 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all"
          >
            Voir les portails
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            Choisissez le plan{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              parfait pour vous
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Des tarifs transparents et flexibles pour toutes les tailles d'entreprise. Commencez gratuitement, évoluez quand vous êtes prêt.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingInterval === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const yearlyPrice = plan.price > 0 ? Math.round(plan.price * 12 * 0.8) : 0;
              const displayPrice = billingInterval === 'yearly' ? yearlyPrice : plan.price;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl overflow-hidden ${
                    plan.popular
                      ? 'shadow-2xl ring-4 ring-indigo-500 transform scale-105'
                      : 'shadow-lg hover:shadow-xl'
                  } transition-all duration-300`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 text-sm font-bold rounded-bl-2xl">
                      POPULAIRE
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center`}>
                        <Icon className="text-white" size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {plan.price === 0 ? (
                        <div className="text-5xl font-extrabold text-gray-900">Gratuit</div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {displayPrice}€
                          </span>
                          <span className="text-gray-500">
                            /{billingInterval === 'yearly' ? 'an' : 'mois'}
                          </span>
                        </div>
                      )}
                      {billingInterval === 'yearly' && plan.price > 0 && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          Économisez {Math.round(plan.price * 12 * 0.2)}€ par an
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="text-gray-300 w-5 h-5 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-xl hover:-translate-y-1`
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Questions fréquentes
          </h3>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h4>
              <p className="text-gray-600">
                Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les changements sont appliqués immédiatement.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-2">
                Y a-t-il un engagement ?
              </h4>
              <p className="text-gray-600">
                Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment sans frais supplémentaires.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-2">
                Puis-je essayer avant d'acheter ?
              </h4>
              <p className="text-gray-600">
                Absolument ! Le plan Gratuit vous permet de découvrir la plateforme. Vous pouvez ensuite passer à un plan payant quand vous êtes prêt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 RT Technologie. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

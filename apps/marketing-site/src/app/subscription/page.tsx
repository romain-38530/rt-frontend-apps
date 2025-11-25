'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
      { text: "Jusqu'à 10 expéditions par mois", included: true },
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
    price: 99,
    interval: 'mois',
    description: 'Idéal pour les équipes en croissance',
    gradient: 'from-orange-500 to-red-600',
    features: [
      { text: 'Toutes les fonctionnalités de base', included: true },
      { text: 'Expéditions illimitées', included: true },
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
    price: 299,
    interval: 'mois',
    description: 'Pour les grandes organisations',
    gradient: 'from-purple-500 to-indigo-600',
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

  const handleSelectPlan = (planId: string) => {
    localStorage.setItem('selectedPlan', planId);
    window.location.href = '/onboarding';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Choisissez le plan{' '}
            <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              parfait pour vous
            </span>
          </h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Des tarifs transparents et flexibles pour toutes les tailles d'entreprise.
            Commencez gratuitement, évoluez quand vous êtes prêt.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                billingInterval === 'yearly'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6">
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
                      ? 'shadow-2xl ring-4 ring-orange-500 transform scale-105'
                      : 'shadow-lg hover:shadow-xl'
                  } transition-all duration-300`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-red-600" />
                  )}
                  {plan.popular && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                      LE PLUS POPULAIRE
                    </div>
                  )}

                  <div className="p-8 pt-12">
                    {/* Icon & Name */}
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="text-white" size={40} />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-8">
                      {plan.price === 0 ? (
                        <div className="text-5xl font-extrabold text-gray-900">Gratuit</div>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              {displayPrice}€
                            </span>
                            <span className="text-gray-500 font-semibold">
                              /{billingInterval === 'yearly' ? 'an' : 'mois'}
                            </span>
                          </div>
                          {billingInterval === 'yearly' && plan.price > 0 && (
                            <p className="text-sm text-green-600 font-semibold mt-2">
                              💰 Économisez {Math.round(plan.price * 12 * 0.2)}€ par an
                            </p>
                          )}
                        </>
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
                          <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-2xl hover:-translate-y-1'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Tous les plans incluent : e-CMR électronique • Signature conforme eIDAS • Support client
            </p>
            <Link
              href="/contact"
              className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-2"
            >
              Des questions sur nos tarifs ?
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
            Comparatif détaillé des fonctionnalités
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-900 font-bold">Fonctionnalité</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-bold">Gratuit</th>
                  <th className="text-center py-4 px-4 text-orange-600 font-bold">Pro</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Expéditions mensuelles', free: '10', pro: 'Illimité', enterprise: 'Illimité' },
                  { name: 'Utilisateurs', free: '1', pro: '10', enterprise: 'Illimité' },
                  { name: 'Portails disponibles', free: '3', pro: '6', enterprise: '6' },
                  { name: 'Support', free: 'Email', pro: 'Prioritaire', enterprise: '24/7 Dédié' },
                  { name: 'API', free: '-', pro: '✓', enterprise: '✓' },
                  { name: 'Rapports', free: 'Basiques', pro: 'Personnalisés', enterprise: 'Avancés' },
                  { name: 'SLA', free: '-', pro: '-', enterprise: '99.9%' }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-700 font-medium">{row.name}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.free}</td>
                    <td className="py-4 px-4 text-center text-orange-600 font-semibold">{row.pro}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Questions fréquentes
          </h3>
          <div className="space-y-4">
            {[
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: 'Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les changements sont appliqués immédiatement et la facturation est ajustée au prorata.'
              },
              {
                q: 'Y a-t-il un engagement ?',
                a: 'Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment sans frais supplémentaires ni pénalités.'
              },
              {
                q: 'Puis-je essayer avant d\'acheter ?',
                a: 'Absolument ! Le plan Gratuit vous permet de découvrir la plateforme sans limite de temps. Vous pouvez ensuite passer à un plan payant quand vous êtes prêt.'
              },
              {
                q: 'Quels modes de paiement acceptez-vous ?',
                a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et les virements bancaires pour les plans annuels.'
              },
              {
                q: 'Offrez-vous des réductions pour les organisations à but non lucratif ?',
                a: 'Oui, nous offrons 30% de réduction sur tous nos plans pour les organisations à but non lucratif. Contactez-nous pour en savoir plus.'
              }
            ].map((faq, idx) => (
              <details
                key={idx}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group"
              >
                <summary className="font-bold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-orange-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-extrabold mb-6">Prêt à commencer ?</h3>
          <p className="text-xl text-orange-100 mb-8">
            Inscrivez-vous gratuitement et démarrez votre transformation digitale dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center"
            >
              Commencer gratuitement
              <ArrowRight className="ml-3" size={24} />
            </Link>
            <Link
              href="/contact"
              className="px-10 py-5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all inline-flex items-center justify-center"
            >
              Parler à un expert
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

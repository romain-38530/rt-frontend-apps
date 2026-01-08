'use client';

import { MapPin, Check, ArrowRight, Bell, Clock, Package, FileText, Camera, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecipientPage() {
  const features = [
    {
      icon: Clock,
      title: 'Suivi en temps réel',
      description: 'Suivez vos livraisons en direct avec géolocalisation et estimation d\'heure d\'arrivée.'
    },
    {
      icon: Bell,
      title: 'Notifications de livraison',
      description: 'Recevez des alertes automatiques à chaque étape : expédition, en route, livré.'
    },
    {
      icon: Package,
      title: 'Historique complet',
      description: 'Consultez l\'historique de toutes vos livraisons avec détails et documents.'
    },
    {
      icon: MessageCircle,
      title: 'Gestion des retours',
      description: 'Initiez et suivez facilement vos demandes de retour marchandise.'
    },
    {
      icon: Camera,
      title: 'Preuves de livraison',
      description: 'Accédez aux POD (Proof of Delivery) avec signature et photo.'
    },
    {
      icon: FileText,
      title: 'Documents centralisés',
      description: 'Retrouvez tous vos e-CMR, bons de livraison et factures en un seul endroit.'
    }
  ];

  const benefits = [
    'Visibilité complète sur toutes vos livraisons attendues',
    'Réduction de 70% des appels "Où est ma livraison ?"',
    'Planification optimale de vos réceptions',
    'Traçabilité complète pour votre conformité',
    'Gestion simplifiée des litiges et réclamations',
    'Interface simple accessible à tous vos sites'
  ];

  const pricingTiers = [
    {
      name: 'Gratuit',
      price: '0€',
      description: 'Pour commencer',
      features: [
        'Suivi en temps réel',
        'Notifications par email',
        'Historique 3 mois',
        'Preuves de livraison',
        'Support par email'
      ]
    },
    {
      name: 'Pro',
      price: '49€',
      popular: true,
      description: 'Pour sites actifs',
      features: [
        'Tout Gratuit inclus',
        'Multi-sites',
        'Historique illimité',
        'Notifications SMS',
        'Gestion des retours',
        'Support prioritaire'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Pour grands groupes',
      features: [
        'Tout Pro inclus',
        'Intégrations WMS/ERP',
        'API complète',
        'Utilisateurs illimités',
        'SLA garanti',
        'Formation sur site'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <MapPin size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Destinataire</h1>
              <p className="text-xl text-green-100 mt-2">Suivi et réception de vos livraisons</p>
            </div>
          </div>

          <p className="text-2xl text-green-100 max-w-3xl mb-8">
            Ne cherchez plus où sont vos livraisons. Suivez toutes vos réceptions en temps réel,
            accédez aux preuves de livraison et gérez vos retours en quelques clics.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
            >
              Démarrer gratuitement
            </Link>
            <Link
              href="/subscription"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Simplifiez la gestion de vos réceptions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Toutes les informations dont vous avez besoin pour gérer efficacement vos livraisons
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">-70%</div>
              <div className="text-2xl font-semibold mb-6">d'appels "Où est ma livraison ?"</div>
              <p className="text-lg text-green-100 mb-8">
                Avec la visibilité en temps réel et les notifications automatiques, vos équipes passent
                beaucoup moins de temps à rechercher l'information.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-lg">de traçabilité pour votre conformité</div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Pourquoi les destinataires choisissent SYMPHONI.A
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Des milliers de sites de réception utilisent notre portail pour simplifier leur quotidien.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'shadow-2xl border-2 border-green-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  <div className="text-5xl font-extrabold text-gray-900 mb-2">
                    {tier.price}
                  </div>
                  {tier.price !== 'Sur mesure' && (
                    <span className="text-gray-600">/mois</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.price === 'Sur mesure' ? '/contact' : '/register'}
                  className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.price === 'Sur mesure' ? 'Nous contacter' : 'Commencer'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à simplifier vos réceptions ?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Créez votre compte gratuitement et accédez immédiatement au suivi de vos livraisons.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Inscription gratuite
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact?subject=demo&portal=recipient"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all"
            >
              Demander une demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { Package, Check, ArrowRight, BarChart3, Boxes, TrendingUp, Settings, Database, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LogisticianPage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Tableau de bord analytique',
      description: 'Visualisez tous vos KPIs logistiques en temps réel avec dashboards personnalisables.'
    },
    {
      icon: Boxes,
      title: 'Gestion des stocks',
      description: 'Suivez vos stocks en temps réel avec alertes automatiques et prévisions IA.'
    },
    {
      icon: TrendingUp,
      title: 'Optimisation des flux',
      description: 'Optimisez vos flux logistiques avec algorithmes d\'IA et recommandations intelligentes.'
    },
    {
      icon: Settings,
      title: 'Rapports personnalisés',
      description: 'Créez et automatisez vos rapports avec analyses détaillées par période et dimension.'
    },
    {
      icon: Database,
      title: 'WMS intégré',
      description: 'Warehouse Management System complet pour gérer vos entrepôts et préparations.'
    },
    {
      icon: Zap,
      title: 'Automatisation IA',
      description: 'Automatisez vos processus avec intelligence artificielle et machine learning.'
    }
  ];

  const benefits = [
    'Réduction de 40% des coûts logistiques grâce à l\'optimisation IA',
    'Visibilité temps réel sur l\'ensemble de votre supply chain',
    'Prévisions de stock avec 95% de précision',
    'Automatisation de 85% des tâches répétitives',
    'Intégration complète avec vos systèmes ERP/WMS existants',
    'Analytics avancés pour identifier les opportunités d\'optimisation'
  ];

  const pricingTiers = [
    {
      name: 'Enterprise',
      price: '999€',
      description: 'Pour logisticiens professionnels',
      features: [
        'Dashboards analytiques complets',
        'Gestion des stocks avancée',
        'Optimisation IA des flux',
        'Rapports personnalisés',
        'WMS intégré',
        'Support prioritaire 24/7'
      ]
    },
    {
      name: 'Premium',
      price: '1999€',
      popular: true,
      description: 'Pour opérations complexes',
      features: [
        'Tout Enterprise inclus',
        'Multi-sites et multi-pays',
        'Prévisions IA avancées',
        'Intégrations illimitées',
        'API complète',
        'Account manager dédié'
      ]
    },
    {
      name: 'Custom',
      price: 'Sur mesure',
      description: 'Pour grands groupes',
      features: [
        'Tout Premium inclus',
        'Développements sur mesure',
        'SLA garanti 99.99%',
        'Consulting stratégique',
        'Formation et coaching',
        'Infrastructure dédiée'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Package size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Logisticien</h1>
              <p className="text-xl text-amber-100 mt-2">Optimisation logistique et gestion des flux</p>
            </div>
          </div>

          <p className="text-2xl text-amber-100 max-w-3xl mb-8">
            Pilotez votre supply chain avec intelligence artificielle : analytics avancés,
            optimisation des flux, WMS intégré et automatisation complète.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
            >
              Démarrer maintenant
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
              La plateforme la plus avancée pour logisticiens
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des outils puissants d'analytics, d'optimisation et d'automatisation pour votre supply chain
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
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
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
            <div className="bg-gradient-to-br from-amber-500 to-red-500 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">-40%</div>
              <div className="text-2xl font-semibold mb-6">de coûts logistiques</div>
              <p className="text-lg text-amber-100 mb-8">
                L'optimisation IA de vos flux, la réduction des ruptures de stock et l'automatisation
                des processus permettent de réduire drastiquement vos coûts opérationnels.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-lg">de précision des prévisions</div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Pourquoi les logisticiens choisissent SYMPHONI.A
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Les meilleurs logisticiens utilisent notre plateforme pour optimiser leur supply chain.
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

      {/* AI Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-amber-500 to-red-500 rounded-3xl p-12 text-white">
            <div className="text-center mb-12">
              <Zap size={64} className="mx-auto mb-6" />
              <h2 className="text-4xl font-extrabold mb-6">Intelligence Artificielle Intégrée</h2>
              <p className="text-xl text-amber-100 max-w-3xl mx-auto">
                Exploitez la puissance de l'IA pour optimiser chaque aspect de votre supply chain
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="font-bold text-xl mb-4">Prévisions de demande</h3>
                <p className="text-amber-100">
                  Algorithmes de machine learning pour anticiper vos besoins avec 95% de précision
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="font-bold text-xl mb-4">Optimisation des routes</h3>
                <p className="text-amber-100">
                  Calcul en temps réel des itinéraires optimaux pour réduire coûts et délais
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="font-bold text-xl mb-4">Détection d'anomalies</h3>
                <p className="text-amber-100">
                  Identification automatique des problèmes et recommandations d'actions correctives
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tarifs pour logisticiens professionnels
            </h2>
            <p className="text-xl text-gray-600">
              Des solutions enterprise adaptées à la complexité de votre supply chain
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'shadow-2xl border-2 border-amber-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
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
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:shadow-lg'
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
      <section className="py-20 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à révolutionner votre supply chain ?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Rejoignez les logisticiens qui ont déjà réduit leurs coûts de 40% avec SYMPHONI.A
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Commencer maintenant
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

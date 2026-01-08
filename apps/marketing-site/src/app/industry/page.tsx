'use client';

import { Factory, Check, ArrowRight, Shield, Zap, TrendingUp, Globe, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function IndustryPage() {
  const features = [
    {
      icon: Zap,
      title: 'Tableau de bord intelligent',
      description: 'Visualisez tous vos flux de transport en temps réel avec des indicateurs clés de performance.'
    },
    {
      icon: Shield,
      title: 'Vigilance et alertes',
      description: 'Recevez des notifications proactives sur les retards, incidents et anomalies de transport.'
    },
    {
      icon: TrendingUp,
      title: 'Planification avancée',
      description: 'Optimisez vos expéditions avec des outils de planification intelligents et prédictifs.'
    },
    {
      icon: Globe,
      title: 'e-CMR intégré',
      description: 'Dématérialisez vos lettres de voiture avec signature électronique et archivage automatique.'
    },
    {
      icon: Clock,
      title: 'Suivi en temps réel',
      description: 'Suivez vos marchandises à chaque étape avec géolocalisation et mises à jour automatiques.'
    },
    {
      icon: Users,
      title: 'Intelligence artificielle',
      description: 'Bénéficiez d\'Affret.IA pour automatiser vos recherches de transporteurs et optimiser vos coûts.'
    }
  ];

  const benefits = [
    'Recherche automatique de transporteurs avec AFFRET.IA',
    'Plans de transport consolidés avec scoring transporteur',
    'Chaîne de dispatch automatisée du devis à la livraison',
    'e-CMR et documents légaux conformes eIDAS',
    'Gestion d'équipe avec rôles et permissions',
    'Interconnexion univers Industriel ↔ Transporteur',
    'API REST complète pour intégration ERP/WMS',
    'Support client dédié et formation incluse'
  ];

  const pricingTiers = [
    {
      name: 'Gratuit',
      price: '0€',
      description: 'Idéal pour démarrer',
      features: [
        'Jusqu\'à 10 expéditions/mois',
        'Tableau de bord basique',
        'e-CMR électronique',
        'Support par email'
      ]
    },
    {
      name: 'Pro',
      price: '99€',
      popular: true,
      description: 'Pour les industriels actifs',
      features: [
        'Expéditions illimitées',
        'AFFRET.IA recherche autonome',
        'Plan de transport consolidé',
        'Auto-dispatch intelligent',
        'Jusqu'à 5 membres d'équipe',
        'e-CMR et documents légaux',
        'Support prioritaire'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Solution complète',
      features: [
        'Tout Pro inclus',
        'Membres illimités',
        'Multi-sites',
        'API REST complète',
        'Interconnexions transporteurs',
        'SLA garanti 99.9%',
        'Account manager dédié'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Factory size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Industrie</h1>
              <p className="text-xl text-purple-100 mt-2">Vigilance, planification, suivi et Affret.IA</p>
            </div>
          </div>

          <p className="text-2xl text-purple-100 max-w-3xl mb-8">
            Optimisez votre chaîne logistique avec une plateforme TMS complète conçue pour les industriels.
            Gérez vos expéditions, réduisez vos coûts et gagnez en visibilité.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
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
              Fonctionnalités clés pour industriels
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des outils puissants pour gérer efficacement tous vos flux de transport
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
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
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
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Pourquoi choisir SYMPHONI.A pour votre industrie ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Rejoignez des centaines d'industriels qui ont déjà transformé leur gestion logistique avec notre plateforme.
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
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">15-30%</div>
              <div className="text-2xl font-semibold mb-6">de réduction des coûts de transport</div>
              <p className="text-lg text-purple-100 mb-8">
                Nos clients constatent en moyenne une réduction de 15 à 30% de leurs coûts de transport grâce à l'optimisation IA et la mise en concurrence automatisée.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">60%</div>
                <div className="text-lg">de temps gagné sur la gestion administrative</div>
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
              Tarifs adaptés à vos besoins
            </h2>
            <p className="text-xl text-gray-600">
              Commencez gratuitement, évoluez à votre rythme
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'shadow-2xl border-2 border-purple-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
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
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg'
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
      <section className="py-20 px-6 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à optimiser votre logistique ?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Créez votre compte gratuitement en 2 minutes. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Inscription gratuite
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact?subject=demo&portal=industry"
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

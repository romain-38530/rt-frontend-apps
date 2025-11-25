'use client';

import { Ship, Check, ArrowRight, Globe, FileCheck, Container, Users, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ForwarderPage() {
  const features = [
    {
      icon: Globe,
      title: 'Gestion multimodale',
      description: 'Coordonnez tous vos modes de transport : maritime, aérien, routier et ferroviaire.'
    },
    {
      icon: FileCheck,
      title: 'Documentation douanière',
      description: 'Générez et gérez automatiquement tous vos documents douaniers et certificats.'
    },
    {
      icon: Container,
      title: 'Tracking international',
      description: 'Suivez vos conteneurs et colis partout dans le monde avec mises à jour en temps réel.'
    },
    {
      icon: Users,
      title: 'Gestion prestataires',
      description: 'Gérez votre réseau de transporteurs, agents et partenaires internationaux.'
    },
    {
      icon: Shield,
      title: 'Incoterms & Conformité',
      description: 'Gestion complète des Incoterms et conformité aux réglementations internationales.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Coûts',
      description: 'Analysez vos performances et optimisez vos coûts par route et par prestataire.'
    }
  ];

  const benefits = [
    'Visibilité complète sur tous vos flux internationaux',
    'Automatisation de la documentation douanière',
    'Réduction de 30% des délais de transit grâce à l\'optimisation',
    'Coordination simplifiée avec vos agents internationaux',
    'Gestion des litiges et réclamations facilitée',
    'Conformité garantie aux réglementations internationales'
  ];

  const pricingTiers = [
    {
      name: 'Pro',
      price: '299€',
      description: 'Pour transitaires PME',
      features: [
        'Gestion multimodale',
        'Documentation automatique',
        'Tracking international',
        'Jusqu\'à 5 prestataires',
        'Support prioritaire',
        'Formation incluse'
      ]
    },
    {
      name: 'Business',
      price: '599€',
      popular: true,
      description: 'Pour transitaires établis',
      features: [
        'Tout Pro inclus',
        'Prestataires illimités',
        'Multi-utilisateurs',
        'Intégrations douanières',
        'Analytics avancés',
        'API complète'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Pour grands groupes',
      features: [
        'Tout Business inclus',
        'Multi-pays et devises',
        'Workflows personnalisés',
        'SLA garanti 99.9%',
        'Account manager dédié',
        'Support 24/7'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Ship size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Transitaire</h1>
              <p className="text-xl text-blue-100 mt-2">Coordination des expéditions internationales</p>
            </div>
          </div>

          <p className="text-2xl text-blue-100 max-w-3xl mb-8">
            Simplifiez la gestion de vos opérations internationales avec une plateforme complète :
            multimodal, douane, tracking mondial et coordination de tous vos prestataires.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
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
              La plateforme complète pour transitaires
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gérez toutes vos opérations internationales depuis une interface unique
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
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
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
                Pourquoi les transitaires choisissent SYMPHONI.A
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Des transitaires internationaux utilisent notre plateforme pour coordonner leurs opérations mondiales.
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

            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">-30%</div>
              <div className="text-2xl font-semibold mb-6">de délais de transit</div>
              <p className="text-lg text-blue-100 mb-8">
                L'optimisation des routes multimodales et la coordination automatisée avec vos prestataires
                réduisent significativement vos délais de livraison internationaux.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-lg">de conformité réglementaire</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multimodal Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-12 text-white">
            <div className="text-center mb-12">
              <Globe size={64} className="mx-auto mb-6" />
              <h2 className="text-4xl font-extrabold mb-6">Gestion multimodale complète</h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Coordonnez tous vos modes de transport depuis une seule plateforme
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <Ship size={48} className="mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Maritime</h3>
                <p className="text-sm text-blue-100">FCL & LCL</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <Container size={48} className="mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Aérien</h3>
                <p className="text-sm text-blue-100">Express & Cargo</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <Ship size={48} className="mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Routier</h3>
                <p className="text-sm text-blue-100">FTL & LTL</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <Container size={48} className="mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Ferroviaire</h3>
                <p className="text-sm text-blue-100">Intermodal</p>
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
              Tarifs pour transitaires professionnels
            </h2>
            <p className="text-xl text-gray-600">
              Des formules adaptées à votre volume d'opérations internationales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'shadow-2xl border-2 border-blue-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
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
      <section className="py-20 px-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à optimiser vos opérations internationales ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez les transitaires qui coordonnent déjà leurs flux mondiaux avec SYMPHONI.A
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
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

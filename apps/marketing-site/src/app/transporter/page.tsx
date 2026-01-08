'use client';

import { Truck, Check, ArrowRight, Route, Smartphone, Calendar, BarChart3, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';

export default function TransporterPage() {
  const features = [
    {
      icon: Calendar,
      title: 'Planning intelligent',
      description: 'Gérez vos tournées avec un planning optimisé automatiquement selon vos contraintes.'
    },
    {
      icon: Route,
      title: 'Optimisation des routes',
      description: 'Réduisez vos kilomètres et votre consommation avec l\'optimisation IA de vos itinéraires.'
    },
    {
      icon: Truck,
      title: 'Gestion de la flotte',
      description: 'Suivez vos véhicules, leur état, leur disponibilité et leur performance en temps réel.'
    },
    {
      icon: Shield,
      title: 'e-CMR électronique',
      description: 'Lettres de voiture dématérialisées avec signature électronique conforme à la réglementation.'
    },
    {
      icon: Smartphone,
      title: 'App chauffeur',
      description: 'Application mobile pour vos chauffeurs : feuille de route, POD, communication instantanée.'
    },
    {
      icon: BarChart3,
      title: 'Analytics avancés',
      description: 'Tableaux de bord détaillés sur vos performances, coûts et rentabilité par mission.'
    }
  ];

  const benefits = [
    'Accès direct aux opportunités des industriels via AFFRET.IA',
    "Scoring automatique visible par les donneurs d'ordre",
    'Vigilance documents avec alertes automatiques',
    'Grilles tarifaires connectées au plan de transport consolidé',
    'Propositions en un clic sur les demandes entrantes',
    'Dashboard B2P avec KPIs et analytics temps réel',
    'e-CMR et documents conformes eIDAS',
    'Interconnexion univers Transporteur ↔ Industriel'
  ];

  const pricingTiers = [
    {
      name: 'Gratuit',
      price: '0€',
      description: 'Pour démarrer votre activité',
      features: [
        'Jusqu\'à 5 véhicules',
        'Planning basique',
        'e-CMR électronique',
        'App chauffeur',
        'Support par email'
      ]
    },
    {
      name: 'Pro',
      price: '149€',
      popular: true,
      description: 'Pour transporteurs établis',
      features: [
        'Véhicules illimités',
        'Grilles tarifaires multi-zones',
        'Scoring et réputation',
        'Propositions AFFRET.IA',
        'Vigilance documents',
        'Dashboard B2P complet',
        'Support prioritaire'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Pour grands transporteurs',
      features: [
        'Tout Pro inclus',
        'Multi-dépôts',
        'API complète',
        'Gestion de sous-traitants',
        'SLA garanti',
        'Formation dédiée'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Truck size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Transporteur</h1>
              <p className="text-xl text-teal-100 mt-2">Dashboard B2P, scoring, grilles tarifaires et AFFRET.IA</p>
            </div>
          </div>

          <p className="text-2xl text-teal-100 max-w-3xl mb-8">
            Optimisez votre activité de transport avec une solution complète : planning intelligent,
            optimisation des routes, e-CMR et application chauffeur.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-teal-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
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
              Tout ce dont vous avez besoin pour gérer votre flotte
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme complète pour digitaliser et optimiser votre activité de transport
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
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
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
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">+25%</div>
              <div className="text-2xl font-semibold mb-6">de productivité de votre flotte</div>
              <p className="text-lg text-teal-100 mb-8">
                L'optimisation intelligente des tournées et la digitalisation des processus permettent d'augmenter
                significativement le nombre de livraisons par véhicule.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">-20%</div>
                <div className="text-lg">de consommation de carburant</div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Pourquoi les transporteurs choisissent SYMPHONI.A
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Des centaines de transporteurs font confiance à notre plateforme pour digitaliser leur activité.
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

      {/* Mobile App Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-12 items-center p-12">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Smartphone size={48} />
                  <h2 className="text-4xl font-extrabold">Application Chauffeur</h2>
                </div>
                <p className="text-xl text-teal-100 mb-8">
                  Équipez vos chauffeurs d'une application mobile intuitive pour simplifier leurs journées.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">Feuille de route digitale avec navigation GPS</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">Signature électronique et photo de livraison</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">Communication instantanée avec le dispatch</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">Gestion des incidents et des anomalies</span>
                  </li>
                </ul>
                <div className="flex gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                    <div className="text-sm">Disponible sur</div>
                    <div className="font-bold">iOS & Android</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-white/10 backdrop-blur-sm rounded-[3rem] border-8 border-white/20 flex items-center justify-center">
                    <MapPin size={120} className="text-white/50" />
                  </div>
                </div>
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
              Tarifs adaptés à la taille de votre flotte
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
                    ? 'shadow-2xl border-2 border-emerald-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
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
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:shadow-lg'
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
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à digitaliser votre activité de transport ?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Inscrivez-vous gratuitement et équipez vos chauffeurs en quelques minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-teal-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Inscription gratuite
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact?subject=demo&portal=transporter"
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

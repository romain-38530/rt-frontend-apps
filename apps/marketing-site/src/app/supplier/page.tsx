'use client';

import { Building, Check, ArrowRight, ShoppingCart, TrendingUp, FileText, Plug, BarChart, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SupplierPage() {
  const features = [
    {
      icon: ShoppingCart,
      title: 'Gestion des commandes',
      description: 'Recevez et gérez toutes vos commandes clients avec workflow de validation intégré.'
    },
    {
      icon: TrendingUp,
      title: 'Suivi des livraisons',
      description: 'Suivez vos expéditions en temps réel et informez automatiquement vos clients.'
    },
    {
      icon: FileText,
      title: 'Catalogue produits',
      description: 'Centralisez votre catalogue avec références, prix, stocks et disponibilités.'
    },
    {
      icon: Clock,
      title: 'Facturation automatique',
      description: 'Générez automatiquement vos factures à partir des bons de livraison validés.'
    },
    {
      icon: Plug,
      title: 'Intégrations ERP',
      description: 'Synchronisez vos données avec SAP, Oracle, Sage et autres systèmes ERP.'
    },
    {
      icon: BarChart,
      title: 'Analytics clients',
      description: 'Analysez vos performances par client, produit et période avec rapports détaillés.'
    }
  ];

  const benefits = [
    'Automatisation de 80% des tâches administratives',
    'Réduction des erreurs de commande et de facturation',
    'Amélioration de la satisfaction client avec visibilité totale',
    'Optimisation des délais de livraison',
    'Synchronisation temps réel avec votre ERP',
    'Portail client en marque blanche disponible'
  ];

  const pricingTiers = [
    {
      name: 'Pro',
      price: '199€',
      description: 'Pour PME fournisseurs',
      features: [
        'Gestion des commandes',
        'Suivi des livraisons',
        'Catalogue produits',
        'Facturation automatique',
        'Jusqu\'à 3 intégrations',
        'Support prioritaire'
      ]
    },
    {
      name: 'Business',
      price: '399€',
      popular: true,
      description: 'Pour fournisseurs établis',
      features: [
        'Tout Pro inclus',
        'Multi-utilisateurs',
        'Intégrations ERP illimitées',
        'Portail client marque blanche',
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
        'Multi-sites internationaux',
        'Workflows personnalisés',
        'SLA garanti 99.9%',
        'Account manager dédié',
        'Formation et consulting'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-red-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Building size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">Portail Fournisseur</h1>
              <p className="text-xl text-pink-100 mt-2">Gestion de vos approvisionnements</p>
            </div>
          </div>

          <p className="text-2xl text-pink-100 max-w-3xl mb-8">
            Digitalisez votre relation client avec une plateforme complète : gestion des commandes,
            suivi des livraisons, facturation automatique et intégrations ERP.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
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
              La plateforme complète pour fournisseurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gérez efficacement vos commandes, livraisons et facturation depuis une seule interface
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
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
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
                Pourquoi les fournisseurs choisissent SYMPHONI.A
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Des centaines de fournisseurs B2B utilisent notre plateforme pour digitaliser leur relation client.
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

            <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl p-12 text-white">
              <div className="text-6xl font-bold mb-4">80%</div>
              <div className="text-2xl font-semibold mb-6">de tâches administratives automatisées</div>
              <p className="text-lg text-pink-100 mb-8">
                De la réception de commande à la facturation, SYMPHONI.A automatise l'ensemble de votre
                workflow pour vous faire gagner un temps précieux.
              </p>
              <div className="border-t border-white/30 pt-6">
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-lg">de disponibilité garantie</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl p-12 text-white text-center">
            <Plug size={64} className="mx-auto mb-6" />
            <h2 className="text-4xl font-extrabold mb-6">Intégrations ERP natives</h2>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto mb-8">
              Connectez SYMPHONI.A à votre système ERP existant pour une synchronisation temps réel
              de vos commandes, stocks et factures.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">SAP</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">Oracle</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">Sage</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">Microsoft Dynamics</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">Odoo</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-bold text-lg">+ API Rest</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tarifs pour fournisseurs professionnels
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez la formule adaptée à votre volume d'activité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'shadow-2xl border-2 border-pink-500 transform scale-105'
                    : 'shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
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
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:shadow-lg'
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
      <section className="py-20 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Prêt à digitaliser votre relation client ?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Rejoignez les fournisseurs qui ont déjà automatisé leur gestion avec SYMPHONI.A
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-pink-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
            >
              Commencer maintenant
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact?subject=demo&portal=supplier"
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

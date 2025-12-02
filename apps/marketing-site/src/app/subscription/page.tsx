'use client';

import { useState } from 'react';
import { Check, Factory, Truck, Package, Ship, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

const profileOffers = [
  {
    id: 'industrie',
    name: 'SYMPHONI.A Industrie',
    icon: Factory,
    price: 499,
    originalPrice: 799,
    isPromo: true,
    description: 'Notre offre phare pour les industriels exigeants',
    gradient: 'from-purple-500 to-indigo-600',
    features: [
      'Gestion complète des transporteurs avec vigilance',
      'Grilles tarifaires et affectation automatique',
      'Bourse SYMPHONI.A (fret, stockage, maritime)',
      'Portail destinataire et fournisseur gratuits',
      'Dashboard KPI avec exports Excel/PDF',
      'Alertes SLA automatiques',
      'AFFRET.IA en fallback'
    ],
    popular: true
  },
  {
    id: 'transporteur-premium',
    name: 'Transporteur Premium',
    icon: Truck,
    price: 299,
    description: 'Accès complet aux opportunités',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Bourse de fret SYMPHONI.A',
      'AFFRET.IA pour missions automatiques',
      'Réseau de sous-traitants',
      'Planification avancée WebSocket',
      'Dashboard performance et scoring'
    ]
  },
  {
    id: 'transporteur-do',
    name: 'Transporteur Donneur d\'Ordre',
    icon: Truck,
    price: 499,
    description: 'Équivalent industriel pour transporteurs',
    gradient: 'from-teal-500 to-cyan-600',
    features: [
      'Module KPI + Scoring API complet',
      'Planning API et Admin Gateway',
      'Chatbot IA support 24/7',
      'Documents API avec OCR POD',
      'Formation initiale équipe incluse'
    ]
  },
  {
    id: 'logisticien',
    name: 'Logisticien Premium',
    icon: Package,
    price: 499,
    description: 'Gestion plannings multisites',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Configuration quais et contraintes',
      'Borne Chauffeur check-in auto',
      'WebSocket temps réel',
      'Synchronisation WMS via API',
      'Tableau KPI logistique complet'
    ]
  },
  {
    id: 'transitaire',
    name: 'Transitaire Premium',
    icon: Ship,
    price: 299,
    description: 'Bourse maritime et aérienne',
    gradient: 'from-blue-500 to-indigo-600',
    features: [
      'Publication besoins exceptionnels',
      'Réseau transporteurs routiers',
      'Notifications multicanal',
      'Documents API automatisés',
      'KPI transitaire spécifiques'
    ]
  }
];

const packs = [
  {
    id: 'industriel-premium',
    name: 'Pack Industriel Premium',
    price: 699,
    description: 'Solution complète pour industriels exigeants',
    gradient: 'from-purple-600 to-indigo-700',
    includes: 'Industrie + KPI + WebSocket + OCR POD + Tracking IA Basic + Signature + Bourse + Support 24/7'
  },
  {
    id: 'transporteur-do-pack',
    name: 'Pack Transporteur DO',
    price: 599,
    description: 'Pack donneur d\'ordre optimisé',
    gradient: 'from-emerald-600 to-teal-700',
    includes: 'Transporteur DO + Tracking IA Basic + Signature eCMR + Bourse fret + WebSocket'
  },
  {
    id: 'logisticien-premium',
    name: 'Pack Logisticien Premium',
    price: 599,
    description: 'Gestion multisites avancée',
    gradient: 'from-amber-600 to-orange-700',
    includes: 'Planification + Borne Chauffeur + eCMR + WMS Sync + KPI Logistique'
  },
  {
    id: 'ultimate',
    name: 'Pack Ultimate',
    price: 999,
    description: 'Tout SYMPHONI.A inclus',
    gradient: 'from-rose-600 to-pink-700',
    includes: 'Industrie Premium + Tracking IA + Préfacturation + Palettes + eCMR + Chatbot + TMS Sync',
    popular: true
  }
];

const modules = [
  { name: 'Tracking IA Basic', price: '50', unit: '/mois', desc: 'Email + OCR POD' },
  { name: 'Tracking IA Intermédiaire', price: '150', unit: '/mois', desc: 'GPS + App Chauffeur' },
  { name: 'Tracking IA Premium', price: '4', unit: '/transport', desc: 'TomTom/Vehizen + ETA' },
  { name: 'Signature eCMR', price: '99', unit: '/mois', desc: 'QR Code + eIDAS' },
  { name: 'Préfacturation', price: '199', unit: '/mois', desc: 'OCR facture + litiges' },
  { name: 'Palettes Europe', price: '199', unit: '/mois', desc: 'Gestion dettes' },
  { name: 'TMS Sync Premium', price: '149', unit: '/mois', desc: 'Connecteurs TMS' },
  { name: 'Chatbot IA', price: '49', unit: '/mois', desc: 'Support 24/7' },
  { name: 'Formation', price: '299', unit: ' (unique)', desc: 'Onboarding équipe' },
  { name: 'SMS', price: '0,04', unit: '/SMS', desc: 'Notifications' }
];

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'packs' | 'modules'>('profiles');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Tarifs{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              SYMPHONI.A
            </span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Des solutions adaptées à chaque profil. Commencez gratuitement en tant qu'invité ou choisissez l'offre qui correspond à vos ambitions.
          </p>

          {/* Tab Selector */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'profiles'
                  ? 'bg-white text-[#1e3a5f] shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Par Profil
            </button>
            <button
              onClick={() => setActiveTab('packs')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'packs'
                  ? 'bg-white text-[#1e3a5f] shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Packs Tout-en-un
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'modules'
                  ? 'bg-white text-[#1e3a5f] shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Modules
            </button>
          </div>
        </div>
      </section>

      {/* Profiles Section */}
      {activeTab === 'profiles' && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Free invite notice */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-12 text-center">
              <p className="text-green-800 font-semibold text-lg">
                Transporteurs, Logisticiens et Transitaires invités par un industriel : <span className="text-green-600">Accès GRATUIT</span>
              </p>
              <p className="text-green-600 text-sm mt-1">Portail complet sans frais pour les partenaires invités</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {profileOffers.map((offer) => {
                const Icon = offer.icon;
                return (
                  <div
                    key={offer.id}
                    className={`relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      offer.popular ? 'ring-4 ring-orange-500 transform scale-105' : ''
                    }`}
                  >
                    {offer.popular && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                    )}
                    {offer.isPromo && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-bold rounded-full">
                        PROMO LANCEMENT
                      </div>
                    )}

                    <div className="p-8">
                      <div className={`w-16 h-16 bg-gradient-to-br ${offer.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                        <Icon className="text-white" size={32} />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{offer.description}</p>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-gray-900">{offer.price}€</span>
                          <span className="text-gray-500">/mois</span>
                        </div>
                        {offer.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">au lieu de {offer.originalPrice}€</p>
                        )}
                      </div>

                      <ul className="space-y-2 mb-6">
                        {offer.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="text-green-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href="/onboarding"
                        className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                          offer.popular
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Commencer
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Packs Section */}
      {activeTab === 'packs' && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Packs tout-en-un optimisés</h2>
              <p className="text-gray-600">Solutions complètes à tarif avantageux</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                    pack.popular ? 'ring-4 ring-orange-500' : ''
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1">
                      <Star size={12} /> RECOMMANDÉ
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${pack.gradient}`} />
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                    <p className="text-gray-500 mb-4">{pack.description}</p>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-extrabold text-gray-900">{pack.price}€</span>
                      <span className="text-gray-500">/mois</span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Inclus : </span>
                        {pack.includes}
                      </p>
                    </div>

                    <Link
                      href="/contact"
                      className="block w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all"
                    >
                      Demander un devis
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modules Section */}
      {activeTab === 'modules' && (
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modules additionnels</h2>
              <p className="text-gray-600">Personnalisez votre solution avec des fonctionnalités avancées</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                  <h3 className="font-bold text-gray-900 mb-1">{module.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{module.desc}</p>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-[#1e3a5f]">{module.price}€</span>
                    <span className="text-gray-500 text-sm">{module.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Grille tarifaire récapitulative
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-900 font-bold">Offre</th>
                  <th className="text-right py-4 px-4 text-gray-900 font-bold">Tarif mensuel</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'SYMPHONI.A Industrie', price: '499€', highlight: true },
                  { name: 'Transporteur Invité', price: 'Gratuit', free: true },
                  { name: 'Transporteur Premium', price: '299€' },
                  { name: 'Transporteur Donneur d\'Ordre', price: '499€' },
                  { name: 'Logisticien Invité', price: 'Gratuit', free: true },
                  { name: 'Logisticien Premium', price: '499€' },
                  { name: 'Transitaire Invité', price: 'Gratuit', free: true },
                  { name: 'Transitaire Premium', price: '299€' }
                ].map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${row.highlight ? 'bg-orange-50' : ''}`}>
                    <td className="py-4 px-4 text-gray-700 font-medium">{row.name}</td>
                    <td className={`py-4 px-4 text-right font-semibold ${row.free ? 'text-green-600' : row.highlight ? 'text-orange-600' : 'text-gray-900'}`}>
                      {row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-extrabold mb-6">Prêt à transformer votre logistique ?</h3>
          <p className="text-xl text-orange-100 mb-8">
            Contactez-nous pour une démonstration personnalisée
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
              Demander une démo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

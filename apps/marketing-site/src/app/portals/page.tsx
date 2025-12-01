'use client';

import { useState } from 'react';
import { Factory, Truck, MapPin, Building, Ship, Package, ArrowRight, Check, Bot, Anchor, Calendar, MessageCircle, Sparkles, Shield } from 'lucide-react';

// URLs des portails - hardcodées pour export statique
const DOMAIN = 'symphonia-controltower.com';

const portals = [
  {
    id: 'industry',
    name: 'Industrie',
    icon: Factory,
    description: 'Vigilance, planification, suivi et Affret.IA',
    gradient: 'from-purple-500 via-purple-600 to-indigo-600',
    url: `https://industry.${DOMAIN}`,
    features: [
      'Tableau de bord intelligent',
      'Vigilance et alertes',
      'Planification avancée',
      'e-CMR intégré',
      'AFFRET.IA - 38 endpoints IA'
    ],
    minTier: 'free'
  },
  {
    id: 'transporter',
    name: 'Transporteur',
    icon: Truck,
    description: 'Gestion des transports et des livraisons',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    url: `https://transporter.${DOMAIN}`,
    features: [
      'Planning intelligent',
      'Optimisation des routes IA',
      'Gestion de la flotte',
      'e-CMR électronique',
      'App chauffeur mobile'
    ],
    minTier: 'free'
  },
  {
    id: 'recipient',
    name: 'Destinataire',
    icon: MapPin,
    description: 'Suivi et réception de vos livraisons',
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    url: `https://recipient.${DOMAIN}`,
    features: [
      'Suivi en temps réel',
      'Notifications SMS/Email',
      'Signature électronique',
      'Gestion des retours',
      'Portail Lite gratuit'
    ],
    minTier: 'free'
  },
  {
    id: 'supplier',
    name: 'Fournisseur',
    icon: Building,
    description: 'Gestion de vos approvisionnements',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    url: `https://supplier.${DOMAIN}`,
    features: [
      'Gestion des commandes',
      'Créneaux de livraison',
      'Catalogue produits',
      'Facturation automatique',
      'Portail Lite gratuit'
    ],
    minTier: 'free'
  },
  {
    id: 'forwarder',
    name: 'Transitaire',
    icon: Ship,
    description: 'Coordination des expéditions internationales',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    url: `https://forwarder.${DOMAIN}`,
    features: [
      'Gestion multimodale',
      'Documentation douanière',
      'Tracking international',
      'Gestion prestataires',
      'Incoterms automatisés'
    ],
    minTier: 'pro'
  },
  {
    id: 'logistician',
    name: 'Logisticien',
    icon: Package,
    description: 'Optimisation logistique et gestion des flux',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    url: `https://logistician.${DOMAIN}`,
    features: [
      'Tableau de bord analytique',
      'Gestion des stocks',
      'Optimisation des flux IA',
      'Rapports personnalisés',
      'Portail Lite gratuit'
    ],
    minTier: 'pro'
  }
];

const aiModules = [
  {
    id: 'affretia',
    name: 'AFFRET.IA',
    icon: Sparkles,
    description: 'Intelligence artificielle pour l\'affrètement',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    url: '#affretia',
    features: [
      '38 endpoints IA spécialisés',
      'Prédiction de prix transport',
      'Optimisation des routes',
      'Matching transporteurs',
      'Analyse documents automatique'
    ],
    minTier: 'pro'
  },
  {
    id: 'helpbot',
    name: 'HelpBot IA',
    icon: MessageCircle,
    description: 'Chatbot support client intelligent',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    url: '#helpbot',
    features: [
      'Support 24/7 automatisé',
      'Intégration Claude AI',
      'Historique conversations',
      'Escalade automatique',
      'Multi-langue'
    ],
    minTier: 'pro'
  },
  {
    id: 'rt-assistant',
    name: 'RT Assistant',
    icon: Bot,
    description: 'Assistant IA pour opérations transport',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    url: '#rt-assistant',
    features: [
      'Optimisation opérationnelle',
      'Suggestions intelligentes',
      'Analyse prédictive',
      'Alertes automatisées',
      'Intégration complète'
    ],
    minTier: 'pro'
  },
  {
    id: 'bourse-maritime',
    name: 'Bourse Maritime',
    icon: Anchor,
    description: 'Marketplace fret maritime avec enchères',
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    url: '#bourse-maritime',
    features: [
      'Demandes de fret',
      'Système d\'enchères',
      'Matching intelligent',
      'Contrats digitaux',
      'Scoring transporteurs'
    ],
    minTier: 'enterprise'
  },
  {
    id: 'planning',
    name: 'Planning Intelligent',
    icon: Calendar,
    description: 'Planification chargement et livraison',
    gradient: 'from-teal-500 via-emerald-500 to-green-500',
    url: '#planning',
    features: [
      'Créneaux de livraison',
      'Notifications SMS',
      'Optimisation temps',
      'Gestion conflits',
      'Multi-providers SMS'
    ],
    minTier: 'pro'
  },
  {
    id: 'admin',
    name: 'Admin Gateway',
    icon: Shield,
    description: 'Administration centralisée plateforme',
    gradient: 'from-slate-500 via-gray-600 to-zinc-700',
    url: '#admin',
    features: [
      'Gestion utilisateurs',
      'Facturation & abonnements',
      'Monitoring services',
      'Audit logs',
      'RGPD compliance'
    ],
    minTier: 'enterprise'
  }
];

export default function PortalsPage() {
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portals' | 'ai'>('portals');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-6">
            Solutions{' '}
            <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              SYMPHONI.A
            </span>
          </h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto mb-8">
            6 portails métier + 6 modules IA pour une gestion logistique complète et intelligente.
          </p>

          {/* Tab Selector */}
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setActiveTab('portals')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'portals'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Portails Métier
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              Modules IA
            </button>
          </div>
        </div>
      </section>

      {/* Portals/Modules Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {activeTab === 'portals' ? 'Portails Métier' : 'Modules Intelligence Artificielle'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {activeTab === 'portals'
                ? 'Un portail dédié pour chaque acteur de la supply chain'
                : '6 modules IA pour automatiser et optimiser vos opérations'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'portals' ? portals : aiModules).map((item) => {
              const Icon = item.icon;
              const isHovered = hoveredPortal === item.id;

              return (
                <a
                  key={item.id}
                  href={item.url}
                  onMouseEnter={() => setHoveredPortal(item.id)}
                  onMouseLeave={() => setHoveredPortal(null)}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Gradient Top Bar */}
                  <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />

                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 transform transition-transform ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className="text-white" size={40} />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {item.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tier Badge */}
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xs font-semibold text-gray-500">
                        Requis :
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.minTier === 'free' ? 'bg-green-100 text-green-700' :
                        item.minTier === 'pro' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {item.minTier === 'free' ? 'Gratuit' :
                         item.minTier === 'pro' ? 'Pro' : 'Enterprise'}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${item.gradient} rounded-xl text-white font-semibold transition-all ${isHovered ? 'gap-4' : 'gap-2'}`}>
                      <span>{activeTab === 'portals' ? 'Accéder au portail' : 'En savoir plus'}</span>
                      <ArrowRight className={`transition-transform ${isHovered ? 'translate-x-1' : ''}`} size={20} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-extrabold mb-6">Prêt à commencer ?</h3>
          <p className="text-xl text-orange-100 mb-8">
            Inscrivez-vous gratuitement et accédez à tous les portails et modules IA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/onboarding"
              className="px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center"
            >
              Commencer gratuitement
              <ArrowRight className="ml-3" size={24} />
            </a>
            <a
              href="/subscription"
              className="px-10 py-5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all inline-flex items-center justify-center"
            >
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

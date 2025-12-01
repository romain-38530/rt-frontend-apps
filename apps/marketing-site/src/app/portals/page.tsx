'use client';

import { useState } from 'react';
import { Factory, Truck, MapPin, Building, Ship, Package, ArrowRight, Check } from 'lucide-react';

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
      'Intelligence artificielle'
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
      'Optimisation des routes',
      'Gestion de la flotte',
      'e-CMR électronique',
      'App chauffeur'
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
      'Notifications de livraison',
      'Historique complet',
      'Gestion des retours',
      'Preuves de livraison'
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
      'Suivi des livraisons',
      'Catalogue produits',
      'Facturation automatique',
      'Intégrations ERP'
    ],
    minTier: 'pro'
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
      'Incoterms'
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
      'Optimisation des flux',
      'Rapports personnalisés',
      'WMS intégré'
    ],
    minTier: 'enterprise'
  }
];

export default function PortalsPage() {
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SYMPHONI.A
              </h1>
              <p className="text-xs text-gray-500 italic">L'IA qui orchestre vos flux transport.</p>
            </div>
          </div>
          <a
            href="/subscription"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Voir les abonnements
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            Accédez à vos{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Portails SYMPHONI.A
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Une solution complète pour chaque acteur de la chaîne logistique. Choisissez le portail adapté à votre rôle et commencez à optimiser vos opérations.
          </p>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portals.map((portal) => {
              const Icon = portal.icon;
              const isHovered = hoveredPortal === portal.id;

              return (
                <a
                  key={portal.id}
                  href={portal.url}
                  onMouseEnter={() => setHoveredPortal(portal.id)}
                  onMouseLeave={() => setHoveredPortal(null)}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Gradient Top Bar */}
                  <div className={`h-2 bg-gradient-to-r ${portal.gradient}`} />

                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-br ${portal.gradient} rounded-2xl flex items-center justify-center mb-6 transform transition-transform ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className="text-white" size={40} />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {portal.name}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {portal.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {portal.features.map((feature, idx) => (
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
                        portal.minTier === 'free' ? 'bg-green-100 text-green-700' :
                        portal.minTier === 'pro' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {portal.minTier === 'free' ? 'Gratuit' :
                         portal.minTier === 'pro' ? 'Pro' : 'Enterprise'}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${portal.gradient} rounded-xl text-white font-semibold transition-all ${isHovered ? 'gap-4' : 'gap-2'}`}>
                      <span>Accéder au portail</span>
                      <ArrowRight className={`transition-transform ${isHovered ? 'translate-x-1' : ''}`} size={20} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 SYMPHONI.A. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

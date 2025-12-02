'use client';

import { Factory, Truck, MapPin, Building, Ship, Package, ArrowRight, ExternalLink } from 'lucide-react';

const portals = [
  {
    id: 'industry',
    name: 'Espace Industrie',
    icon: Factory,
    description: 'Gestion des commandes, planification et suivi',
    gradient: 'from-purple-500 via-purple-600 to-indigo-600',
    url: 'https://industrie.symphonia-controltower.com',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 'transporter',
    name: 'Espace Transporteur',
    icon: Truck,
    description: 'Planning, tournées et gestion de flotte',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    url: 'https://transporteur.symphonia-controltower.com',
    bgColor: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'recipient',
    name: 'Espace Destinataire',
    icon: MapPin,
    description: 'Suivi des livraisons et signature',
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    url: 'https://destinataire.symphonia-controltower.com',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 'supplier',
    name: 'Espace Fournisseur',
    icon: Building,
    description: 'Commandes et créneaux de livraison',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    url: 'https://fournisseur.symphonia-controltower.com',
    bgColor: 'bg-pink-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    id: 'forwarder',
    name: 'Espace Transitaire',
    icon: Ship,
    description: 'Gestion des expéditions internationales',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    url: 'https://transitaire.symphonia-controltower.com',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 'logistician',
    name: 'Espace Logisticien',
    icon: Package,
    description: 'Optimisation des flux et entrepôts',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    url: 'https://logisticien.symphonia-controltower.com',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  }
];

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Accédez à votre espace
          </h1>
          <p className="text-xl text-blue-100">
            Sélectionnez votre portail pour vous connecter
          </p>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;

              return (
                <a
                  key={portal.id}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative ${portal.bgColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-200`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 ${portal.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={portal.iconColor} size={28} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    {portal.name}
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {portal.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center text-sm font-semibold text-orange-600 group-hover:text-orange-700">
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-left">
                <p className="text-gray-900 font-semibold">Pas encore de compte ?</p>
                <p className="text-sm text-gray-500">Créez votre compte gratuitement en 5 minutes</p>
              </div>
              <a
                href="/onboarding"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
              >
                Créer un compte
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Besoin d'aide ? Contactez le support à{' '}
              <a href="mailto:support@symphonia-controltower.com" className="text-orange-600 hover:underline">
                support@symphonia-controltower.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

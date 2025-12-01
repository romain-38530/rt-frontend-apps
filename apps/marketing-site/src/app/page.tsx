'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Zap, TrendingUp, Users, Globe, Factory, Truck, MapPin, Building, Ship, Package, Sparkles, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  const portals = [
    { icon: Factory, name: 'Industrie', gradient: 'from-purple-500 to-indigo-600', href: '/industry' },
    { icon: Truck, name: 'Transporteur', gradient: 'from-emerald-500 to-cyan-600', href: '/transporter' },
    { icon: MapPin, name: 'Destinataire', gradient: 'from-green-500 to-teal-600', href: '/recipient' },
    { icon: Building, name: 'Fournisseur', gradient: 'from-pink-500 to-red-500', href: '/supplier' },
    { icon: Ship, name: 'Transitaire', gradient: 'from-blue-500 to-purple-500', href: '/forwarder' },
    { icon: Package, name: 'Logisticien', gradient: 'from-amber-500 to-orange-600', href: '/logistician' }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Inscription en 5 minutes',
      description: 'Vérification TVA automatique, données pré-remplies, activation immédiate'
    },
    {
      icon: Shield,
      title: 'Sécurité maximale',
      description: 'Signature électronique eIDAS, chiffrement TLS, conformité RGPD garantie'
    },
    {
      icon: TrendingUp,
      title: 'AFFRET.IA - 38 endpoints IA',
      description: 'Prédiction prix, optimisation routes, matching transporteurs, analyse documents'
    },
    {
      icon: Users,
      title: 'Chatbots IA intégrés',
      description: 'HelpBot support client et RT Assistant pour optimisation opérationnelle'
    },
    {
      icon: Globe,
      title: 'Bourse Maritime',
      description: 'Marketplace fret maritime avec système d\'enchères et matching intelligent'
    },
    {
      icon: Sparkles,
      title: 'Planning intelligent',
      description: 'Planification chargement/livraison avec notifications SMS multi-providers'
    }
  ];

  const stats = [
    { value: '6', label: 'Portails métier' },
    { value: '38+', label: 'Endpoints IA' },
    { value: '100%', label: 'Conforme RGPD' },
    { value: '27', label: 'Pays UE couverts' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-24 px-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600 rounded-full opacity-20 blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                🚀 L'IA qui orchestre vos flux transport
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                Digitalisez votre logistique avec{' '}
                <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  SYMPHONI.A
                </span>
              </h1>
              <p className="text-xl text-orange-100 mb-8 leading-relaxed">
                Plateforme TMS complète pour industriels, transporteurs, logisticiens, fournisseurs et transitaires.
                Inscription en 5 minutes, activation immédiate.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center group"
                >
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
                </button>
                <Link
                  href="/portals"
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center"
                >
                  Découvrir les portails
                </Link>
              </div>
              <p className="text-sm text-orange-200 mt-6 flex items-center gap-4 flex-wrap">
                <span>✓ Sans engagement</span>
                <span>✓ Activation en 15 min</span>
                <span>✓ Support gratuit</span>
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="bg-navy-900 rounded-2xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-orange-400 font-bold">SYMPHONI.A</div>
                      <div className="text-xs text-gray-400">CONTROL TOWER</div>
                    </div>
                    <div className="space-y-3">
                      {['TVA vérifiée automatiquement', 'Données pré-remplies', 'Contrat généré en 1 clic', 'Signature électronique'].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-white">
                          <Check className="text-green-400 w-5 h-5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.slice(0, 4).map((stat, idx) => (
                      <div key={idx} className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-orange-200">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-navy-900 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Un portail pour chaque acteur
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le portail adapté à votre rôle dans la supply chain
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal, idx) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={idx}
                  href={portal.href}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${portal.gradient} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {portal.name}
                  </h3>
                  <div className="flex items-center text-orange-600 font-semibold">
                    Découvrir
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/portals"
              className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              Voir tous les portails
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Pourquoi choisir SYMPHONI.A ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme moderne conçue pour simplifier votre quotidien
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl p-8 hover:shadow-lg transition-all">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
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

      {/* How it works */}
      <section className="py-20 px-6 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Démarrez en 4 étapes simples
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Un processus d'inscription 100% automatisé et ultra-rapide
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', icon: Shield, title: 'Vérification TVA', desc: 'Validation instantanée via API VIES', time: '30 sec' },
              { step: '2', icon: Check, title: 'Auto-remplissage', desc: 'Données entreprise récupérées automatiquement', time: '1 min' },
              { step: '3', icon: Sparkles, title: 'Choix de l\'offre', desc: 'Sélection du portail et options', time: '2 min' },
              { step: '4', icon: ArrowRight, title: 'Activation', desc: 'Signature électronique et démarrage', time: '2 min' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                        <Icon size={24} />
                      </div>
                      <span className="text-5xl font-bold text-white/20">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-300 text-sm mb-3">{item.desc}</p>
                    <div className="flex items-center text-orange-400 text-sm font-semibold">
                      <Clock size={14} className="mr-1" />
                      {item.time}
                    </div>
                  </div>
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="text-white/30" size={24} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/onboarding')}
              className="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center"
            >
              Commencer maintenant
              <ArrowRight className="ml-3" size={24} />
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Sans engagement • 14 jours d'essai gratuit • Annulation en 1 clic
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Prêt à optimiser votre logistique ?
          </h2>
          <p className="text-xl text-orange-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Rejoignez les entreprises qui transforment leur logistique avec la puissance de l'IA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/onboarding')}
              className="px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center"
            >
              Inscription gratuite
              <ArrowRight className="ml-3" size={24} />
            </button>
            <Link
              href="/contact"
              className="px-10 py-5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all inline-flex items-center justify-center"
            >
              Demander une démo
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-10 h-10" />
              <div className="text-left">
                <div className="font-bold text-lg">Conforme eIDAS</div>
                <div className="text-sm text-orange-200">Signature légale</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Globe className="w-10 h-10" />
              <div className="text-left">
                <div className="font-bold text-lg">RGPD</div>
                <div className="text-sm text-orange-200">Données protégées</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Users className="w-10 h-10" />
              <div className="text-left">
                <div className="font-bold text-lg">Support 5j/7</div>
                <div className="text-sm text-orange-200">Équipe dédiée</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

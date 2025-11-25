import { Target, Users, Zap, Globe, Heart, Award } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Nous repoussons constamment les limites de la technologie logistique avec l\'IA.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Nous croyons en la puissance de la collaboration entre tous les acteurs de la supply chain.'
    },
    {
      icon: Heart,
      title: 'Engagement',
      description: 'Nous nous engageons à offrir le meilleur service et support à nos clients.'
    },
    {
      icon: Globe,
      title: 'Impact',
      description: 'Nous visons à transformer positivement l\'industrie du transport et de la logistique.'
    }
  ];

  const stats = [
    { value: '10 000+', label: 'Utilisateurs actifs' },
    { value: '1M+', label: 'Expéditions gérées' },
    { value: '99.9%', label: 'Disponibilité' },
    { value: '50+', label: 'Pays couverts' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-6">À propos de SYMPHONI.A</h1>
          <p className="text-2xl text-indigo-100 max-w-3xl mx-auto">
            Nous transformons la gestion logistique avec l'intelligence artificielle et l'innovation
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Target size={32} className="text-white" />
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900">Notre Mission</h2>
              </div>
              <p className="text-lg text-gray-700 mb-6">
                SYMPHONI.A a été créée avec une vision claire : simplifier et optimiser la gestion logistique
                pour tous les acteurs de la supply chain grâce à l'intelligence artificielle.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Nous croyons que la technologie doit être accessible, intuitive et puissante. C'est pourquoi
                nous avons développé une plateforme complète qui s'adapte aux besoins de chaque type d'acteur :
                industriels, transporteurs, destinataires, fournisseurs, transitaires et logisticiens.
              </p>
              <p className="text-lg text-gray-700">
                Notre objectif est de permettre à chaque entreprise, quelle que soit sa taille, de bénéficier
                des dernières innovations en matière d'optimisation logistique.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Notre Impact</h3>
              <div className="grid grid-cols-2 gap-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Nos Valeurs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Les principes qui guident notre travail et nos relations avec nos clients
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Award size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Notre Histoire</h2>
          </div>

          <div className="space-y-6 text-lg text-gray-700">
            <p>
              SYMPHONI.A est née en 2023 d'une frustration partagée par de nombreux professionnels du
              transport : les outils existants étaient soit trop complexes, soit trop limités, et rarement
              adaptés aux besoins réels du terrain.
            </p>
            <p>
              Notre équipe fondatrice, forte de plus de 20 ans d'expérience cumulée dans la logistique et
              la technologie, a décidé de créer la solution qu'elle aurait voulu avoir : simple, puissante,
              et accessible à tous.
            </p>
            <p>
              Aujourd'hui, SYMPHONI.A est utilisée par des milliers d'entreprises dans plus de 50 pays.
              Nous continuons d'innover chaque jour pour offrir la meilleure plateforme TMS du marché.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Rejoignez l'aventure</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Nous recherchons constamment des talents passionnés pour renforcer notre équipe
          </p>
          <Link
            href="/careers"
            className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            Voir nos offres d'emploi
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl font-extrabold mb-6">Prêt à transformer votre logistique ?</h3>
          <p className="text-xl text-indigo-100 mb-8">
            Rejoignez les milliers d'entreprises qui optimisent déjà leurs opérations avec SYMPHONI.A
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/onboarding"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Briefcase, MapPin, Clock, ArrowRight, Users, Zap, Heart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function CareersPage() {
  const benefits = [
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Travaillez sur des technologies de pointe en IA et logistique'
    },
    {
      icon: Users,
      title: 'Équipe passionnée',
      description: 'Rejoignez une équipe dynamique et talentueuse'
    },
    {
      icon: TrendingUp,
      title: 'Évolution',
      description: 'Des opportunités de formation et de croissance continue'
    },
    {
      icon: Heart,
      title: 'Bien-être',
      description: 'Télétravail flexible, RTT, et mutuelle premium'
    }
  ];

  const positions = [
    {
      title: 'Full Stack Developer',
      type: 'CDI',
      location: 'Paris / Remote',
      department: 'Engineering',
      description: 'Développez notre plateforme TMS avec React, Next.js et Node.js'
    },
    {
      title: 'DevOps Engineer',
      type: 'CDI',
      location: 'Paris / Remote',
      department: 'Infrastructure',
      description: 'Gérez et optimisez notre infrastructure cloud sur AWS'
    },
    {
      title: 'Product Manager',
      type: 'CDI',
      location: 'Paris',
      department: 'Product',
      description: 'Définissez la roadmap produit et pilotez les nouvelles fonctionnalités'
    },
    {
      title: 'Customer Success Manager',
      type: 'CDI',
      location: 'Paris',
      department: 'Customer Success',
      description: 'Accompagnez nos clients dans leur réussite avec SYMPHONI.A'
    },
    {
      title: 'Data Scientist',
      type: 'CDI',
      location: 'Paris / Remote',
      department: 'AI & Data',
      description: 'Développez nos algorithmes d\'optimisation et de prédiction'
    },
    {
      title: 'UX/UI Designer',
      type: 'CDI',
      location: 'Paris / Remote',
      department: 'Design',
      description: 'Concevez des expériences utilisateur exceptionnelles'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Briefcase size={48} />
            <h1 className="text-5xl font-extrabold">Rejoignez SYMPHONI.A</h1>
          </div>
          <p className="text-2xl text-indigo-100 max-w-3xl mx-auto">
            Participez à la révolution de la logistique avec l'intelligence artificielle
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Pourquoi nous rejoindre ?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Travaillez sur des projets passionnants qui ont un impact réel sur l'industrie du transport
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Positions */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Postes ouverts</h2>
            <p className="text-xl text-gray-600">
              {positions.length} opportunités pour rejoindre notre équipe
            </p>
          </div>

          <div className="space-y-6">
            {positions.map((position, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {position.title}
                      </h3>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        {position.type}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{position.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} />
                        <span>{position.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{position.location}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/contact?subject=Candidature ${position.title}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                  >
                    Postuler
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Notre Culture</h2>

          <div className="space-y-6 text-lg text-gray-700">
            <p>
              Chez SYMPHONI.A, nous cultivons un environnement de travail stimulant où l'innovation et la
              collaboration sont au cœur de tout ce que nous faisons.
            </p>

            <div className="bg-indigo-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ce que nous offrons :</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Salaire compétitif avec participation aux bénéfices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Télétravail flexible (2-3 jours/semaine)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Mutuelle premium prise en charge à 100%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Budget formation et conférences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>RTT et congés généreux</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Équipement tech de pointe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Bureaux modernes en plein centre de Paris</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>Team buildings et événements réguliers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl font-extrabold mb-6">Vous ne trouvez pas le poste idéal ?</h3>
          <p className="text-xl text-indigo-100 mb-8">
            Envoyez-nous quand même votre candidature spontanée. Nous sommes toujours à la recherche de
            talents exceptionnels !
          </p>
          <Link
            href="/contact?subject=Candidature spontanée"
            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
          >
            Candidature spontanée
          </Link>
        </div>
      </section>
    </div>
  );
}

import { BookOpen, Calendar, User, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const articles = [
    {
      slug: 'ia-transforme-logistique',
      title: "Comment l'IA transforme la logistique moderne",
      excerpt: "Decouvrez comment l'intelligence artificielle revolutionne la gestion des transports et optimise les couts logistiques.",
      date: '15 novembre 2024',
      author: 'Equipe SYMPHONI.A',
      category: 'Innovation',
      readTime: '5 min'
    },
    {
      slug: 'optimiser-flux-transport',
      title: 'Guide complet : Optimiser vos flux de transport',
      excerpt: 'Les meilleures pratiques pour reduire vos couts de transport et ameliorer votre efficacite operationnelle.',
      date: '8 novembre 2024',
      author: 'Jean Dupont',
      category: 'Guide',
      readTime: '8 min'
    },
    {
      slug: 'ecmr-dematerialisation',
      title: 'e-CMR : La dematerialisation des lettres de voiture',
      excerpt: "Tout ce que vous devez savoir sur l'e-CMR et comment cette solution simplifie votre gestion documentaire.",
      date: '1 novembre 2024',
      author: 'Marie Martin',
      category: 'Reglementation',
      readTime: '6 min'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <BookOpen size={48} />
            <h1 className="text-5xl font-extrabold">Blog SYMPHONI.A</h1>
          </div>
          <p className="text-2xl text-indigo-100 max-w-3xl mx-auto">
            Actualites, guides et insights sur la logistique et l'innovation
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-12 flex items-center justify-center">
                <TrendingUp size={120} className="text-white opacity-20" />
              </div>
              <div className="p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                    Article a la une
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                  {articles[0].title}
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {articles[0].excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{articles[0].date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{articles[0].author}</span>
                  </div>
                </div>
                <Link
                  href={`/blog/${articles[0].slug}`}
                  className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                >
                  Lire l'article
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Derniers articles</h2>
            <p className="text-xl text-gray-600">
              Restez informe des dernieres tendances en logistique et transport
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, idx) => (
              <Link
                key={idx}
                href={`/blog/${article.slug}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group block"
              >
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <BookOpen size={64} className="text-white opacity-50" />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {article.category}
                    </span>
                    <span className="text-sm text-gray-500">{article.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span>{article.author}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 text-indigo-600 font-semibold group-hover:text-indigo-700 transition-colors">
                    Lire plus
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl font-extrabold mb-6">Restez informe</h3>
          <p className="text-xl text-indigo-100 mb-8">
            Recevez nos derniers articles et actualites directement dans votre boite mail
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="votre.email@example.com"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all whitespace-nowrap">
              S'abonner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

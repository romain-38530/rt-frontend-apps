import { BookOpen, Calendar, User, ArrowLeft, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Articles data
const articles: Record<string, {
  title: string;
  excerpt: string;
  content: string[];
  date: string;
  author: string;
  category: string;
  readTime: string;
}> = {
  'ia-transforme-logistique': {
    title: "Comment l'IA transforme la logistique moderne",
    excerpt: "Decouvrez comment l'intelligence artificielle revolutionne la gestion des transports et optimise les couts logistiques.",
    content: [
      "L'intelligence artificielle (IA) est en train de transformer radicalement le secteur de la logistique. Des entrepots automatises aux algorithmes de prediction de la demande, les entreprises adoptent ces technologies pour rester competitives.",
      "## Optimisation des itineraires",
      "L'un des domaines ou l'IA excelle est l'optimisation des itineraires de livraison. En analysant des millions de donnees en temps reel (trafic, meteo, contraintes horaires), les algorithmes peuvent calculer les trajets les plus efficaces, reduisant ainsi les couts de carburant et les delais de livraison.",
      "## Prediction de la demande",
      "Grace au machine learning, les entreprises peuvent desormais anticiper les pics de demande avec une precision remarquable. Cette capacite permet d'ajuster les stocks et les ressources en consequence, evitant ainsi les ruptures ou les surstocks couteux.",
      "## Automatisation des entrepots",
      "Les robots guides par IA revolutionnent la gestion des entrepots. Ils peuvent trier, deplacer et organiser les marchandises 24h/24, avec une precision et une vitesse impossibles a atteindre par des moyens humains seuls.",
      "## L'avenir avec SYMPHONI.A",
      "Chez SYMPHONI.A, nous integrons ces technologies de pointe dans notre plateforme TMS. Notre solution Affret.IA utilise l'intelligence artificielle pour optimiser vos flux de transport et reduire vos couts operationnels jusqu'a 30%."
    ],
    date: '15 novembre 2024',
    author: 'Equipe SYMPHONI.A',
    category: 'Innovation',
    readTime: '5 min'
  },
  'optimiser-flux-transport': {
    title: 'Guide complet : Optimiser vos flux de transport',
    excerpt: 'Les meilleures pratiques pour reduire vos couts de transport et ameliorer votre efficacite operationnelle.',
    content: [
      "L'optimisation des flux de transport est un enjeu majeur pour toute entreprise souhaitant ameliorer sa competitivite. Voici un guide complet pour y parvenir.",
      "## 1. Analysez vos donnees actuelles",
      "Avant toute optimisation, il est essentiel de comprendre votre situation actuelle. Collectez des donnees sur vos expeditions : volumes, destinations, couts, delais. Cette analyse revelera les axes d'amelioration prioritaires.",
      "## 2. Consolidez vos envois",
      "La consolidation des expeditions permet de reduire significativement les couts. Regroupez les commandes vers des destinations proches et optimisez le remplissage de vos vehicules.",
      "## 3. Diversifiez vos transporteurs",
      "Ne dependez pas d'un seul prestataire. Un panel de transporteurs vous permet de negocier de meilleurs tarifs et d'avoir des solutions de repli en cas de probleme.",
      "## 4. Digitalisez vos processus",
      "Les outils numeriques comme SYMPHONI.A permettent d'automatiser la gestion des transports, de suivre les expeditions en temps reel et d'eliminer les taches manuelles chronophages.",
      "## 5. Mesurez et ameliorez en continu",
      "Definissez des KPIs clairs (cout au colis, taux de ponctualite, taux de litige) et suivez-les regulierement. L'amelioration continue est la cle du succes."
    ],
    date: '8 novembre 2024',
    author: 'Jean Dupont',
    category: 'Guide',
    readTime: '8 min'
  },
  'ecmr-dematerialisation': {
    title: 'e-CMR : La dematerialisation des lettres de voiture',
    excerpt: 'Tout ce que vous devez savoir sur l\'e-CMR et comment cette solution simplifie votre gestion documentaire.',
    content: [
      "La lettre de voiture electronique (e-CMR) represente une avancee majeure dans la digitalisation du transport routier. Decouvrez ses avantages et comment l'adopter.",
      "## Qu'est-ce que l'e-CMR ?",
      "L'e-CMR est la version electronique de la lettre de voiture CMR (Convention relative au contrat de transport international de Marchandises par Route). Elle a la meme valeur juridique que son equivalent papier, mais offre de nombreux avantages supplementaires.",
      "## Les avantages de l'e-CMR",
      "- **Gain de temps** : Plus besoin d'imprimer, signer et archiver des documents papier\n- **Tracabilite** : Suivi en temps reel de l'etat du document\n- **Securite** : Signature electronique infalsifiable\n- **Ecologie** : Reduction significative de la consommation de papier\n- **Accessibilite** : Documents disponibles partout, a tout moment",
      "## Cadre legal",
      "Le protocole additionnel a la Convention CMR relatif a la lettre de voiture electronique est entre en vigueur en 2011. De nombreux pays europeens l'ont ratifie, rendant l'e-CMR legalement valide pour les transports internationaux.",
      "## Comment passer a l'e-CMR avec SYMPHONI.A",
      "Notre plateforme integre nativement la gestion des e-CMR. Vos chauffeurs peuvent signer electroniquement depuis leur smartphone, et tous les documents sont automatiquement archives et accessibles depuis votre espace client."
    ],
    date: '1 novembre 2024',
    author: 'Marie Martin',
    category: 'Reglementation',
    readTime: '6 min'
  }
};

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({
    slug,
  }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles[params.slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-indigo-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Retour au blog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold">
              {article.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-indigo-100">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{article.readTime} de lecture</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <p className="text-xl text-gray-700 mb-8 leading-relaxed border-l-4 border-indigo-500 pl-6 italic">
              {article.excerpt}
            </p>

            <div className="prose prose-lg max-w-none">
              {article.content.map((paragraph, idx) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(item => item.startsWith('- '));
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-2 my-4">
                      {items.map((item, i) => (
                        <li key={i} className="text-gray-700" dangerouslySetInnerHTML={{
                          __html: item.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-gray-700 mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{article.author}</p>
                    <p className="text-sm text-gray-600">Publie le {article.date}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Share2 size={18} />
                  Partager
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Pret a optimiser votre logistique ?</h3>
            <p className="text-indigo-100 mb-6">
              Decouvrez comment SYMPHONI.A peut transformer vos operations de transport.
            </p>
            <Link
              href="/onboarding"
              className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Demarrer gratuitement
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

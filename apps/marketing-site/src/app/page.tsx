'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Shield, Zap, FileText, Clock, Users, Globe, Lock, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Digitalisez votre logistique en quelques minutes
              </h1>
              <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                La plateforme TMS intelligente qui simplifie la gestion de vos opérations de transport.
                Inscription automatisée, contrat électronique, et démarrage immédiat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition flex items-center justify-center group"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition">
                  Voir la démo
                </button>
              </div>
              <p className="text-sm text-indigo-200 mt-6">
                Sans engagement • Activation en 15 minutes • Support gratuit inclus
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="bg-white rounded-lg p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-500">Inscription SYMPHONI.A</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Check className="text-green-500 w-5 h-5" />
                      <span className="text-gray-700 text-sm">TVA vérifiée automatiquement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="text-green-500 w-5 h-5" />
                      <span className="text-gray-700 text-sm">Données entreprise pré-remplies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="text-green-500 w-5 h-5" />
                      <span className="text-gray-700 text-sm">Contrat généré en 1 clic</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="text-green-500 w-5 h-5" />
                      <span className="text-gray-700 text-sm">Signature électronique sécurisée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">500+</div>
              <div className="text-sm text-gray-600">Clients actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">50K+</div>
              <div className="text-sm text-gray-600">Livraisons/mois</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">99.9%</div>
              <div className="text-sm text-gray-600">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">4.8/5</div>
              <div className="text-sm text-gray-600">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Démarrez en 4 étapes simples
            </h2>
            <p className="text-xl text-gray-600">
              Un processus d'inscription moderne et 100% automatisé
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: Shield,
                title: 'Vérification TVA',
                description: 'Saisissez votre numéro de TVA intracommunautaire. Nous vérifions instantanément sa validité via les API européennes (VIES) et INSEE.',
                time: '30 secondes'
              },
              {
                step: '02',
                icon: FileText,
                title: 'Auto-remplissage',
                description: 'Vos données d\'entreprise (raison sociale, SIRET, adresse) sont automatiquement récupérées. Vous n\'avez qu\'à vérifier.',
                time: '1 minute'
              },
              {
                step: '03',
                icon: Check,
                title: 'Choix de l\'offre',
                description: 'Sélectionnez votre type d\'abonnement (Industriel, Transporteur, Logisticien) et personnalisez avec nos options premium.',
                time: '2 minutes'
              },
              {
                step: '04',
                icon: Lock,
                title: 'Signature électronique',
                description: 'Signez votre contrat directement en ligne avec notre système conforme eIDAS. Activation immédiate après signature.',
                time: '2 minutes'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 h-full border-2 border-indigo-100 hover:border-indigo-300 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <item.icon className="text-white" size={24} />
                    </div>
                    <span className="text-4xl font-bold text-indigo-200">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                  <div className="flex items-center text-sm text-indigo-600 font-medium">
                    <Clock size={16} className="mr-1" />
                    {item.time}
                  </div>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="text-indigo-300" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition inline-flex items-center"
            >
              Commencer mon inscription
              <ArrowRight className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi SYMPHONI.A ?
            </h2>
            <p className="text-xl text-gray-600">
              La solution TMS qui simplifie vraiment votre quotidien
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Démarrage ultra-rapide',
                description: 'Inscription en 5 minutes chrono. Vérification TVA automatique, données pré-remplies, contrat généré instantanément. Commencez à travailler le jour même.',
                color: 'indigo'
              },
              {
                icon: Shield,
                title: 'Sécurité maximale',
                description: 'Signature électronique conforme eIDAS, chiffrement TLS 1.3, conformité RGPD garantie. Vos données sont stockées en France avec des sauvegardes quotidiennes.',
                color: 'green'
              },
              {
                icon: FileText,
                title: 'Zéro paperasse',
                description: 'Fini les formulaires papier et les allers-retours par email. Tout est digital, automatisé et traçable. Contrats, factures, CMR : 100% dématérialisé.',
                color: 'blue'
              },
              {
                icon: Globe,
                title: 'Conformité européenne',
                description: 'Vérification TVA via API VIES officielle. Compatible avec toutes les entreprises européennes. Support multi-devises et multi-langues inclus.',
                color: 'purple'
              },
              {
                icon: Users,
                title: 'Support réactif',
                description: 'Équipe support disponible 5j/7 par chat, email et téléphone. Formation gratuite à l\'inscription. Documentation complète et tutoriels vidéo.',
                color: 'orange'
              },
              {
                icon: TrendingUp,
                title: 'Évolutif et flexible',
                description: 'De 1 à 10 000 livraisons/mois, la plateforme s\'adapte. Changez d\'offre à tout moment. Intégrations avec vos outils existants (ERP, WMS, TMS).',
                color: 'pink'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition border border-gray-100">
                <div className={`w-14 h-14 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className={`text-${item.color}-600`} size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités détaillées */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Toutes les fonctionnalités dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600">
              Une plateforme complète pour gérer l'intégralité de vos flux logistiques
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Onboarding intelligent
              </h3>
              <ul className="space-y-4">
                {[
                  'Vérification TVA en temps réel via API VIES et INSEE',
                  'Auto-remplissage des données SIRET, raison sociale, adresse',
                  'Génération automatique de contrat PDF personnalisé',
                  'Signature électronique conforme règlement eIDAS',
                  'Emails automatiques de confirmation et suivi',
                  'Interface responsive : PC, tablette, smartphone',
                  'Support multi-devises : EUR, USD, GBP, CHF',
                  'Activation du compte en moins de 15 minutes'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="text-green-500 w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
              <h4 className="text-2xl font-bold mb-6">Processus ultra-rapide</h4>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-white/20 rounded-lg p-3 mr-4">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Étape 1 : Vérification</div>
                    <div className="text-indigo-100 text-sm">Validation instantanée de votre TVA européenne</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white/20 rounded-lg p-3 mr-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Étape 2 : Formulaire</div>
                    <div className="text-indigo-100 text-sm">Données pré-remplies, vous vérifiez seulement</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white/20 rounded-lg p-3 mr-4">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Étape 3 : Offre</div>
                    <div className="text-indigo-100 text-sm">Choisissez votre formule et options</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-white/20 rounded-lg p-3 mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Étape 4 : Signature</div>
                    <div className="text-indigo-100 text-sm">Signature électronique sécurisée eIDAS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tarifs transparents et flexibles
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez la formule adaptée à votre activité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Transporteur Premium',
                price: '299',
                description: 'Pour les entreprises de transport',
                features: [
                  'Gestion des missions illimitées',
                  'Application chauffeur mobile',
                  'Géolocalisation en temps réel',
                  'Signature électronique CMR',
                  'Planning intelligent',
                  'Support 5j/7'
                ],
                popular: false
              },
              {
                name: 'Industriel',
                price: '499',
                description: 'Solution complète pour industriels',
                features: [
                  'Tout Transporteur Premium',
                  'Gestion commandes illimitées',
                  'Grilles de tarification',
                  'Multi-transporteurs',
                  'API & Intégrations',
                  'IA de prévision (option)',
                  'Support prioritaire'
                ],
                popular: true
              },
              {
                name: 'Logisticien Premium',
                price: '499',
                description: 'Plateforme multi-clients',
                features: [
                  'Gestion multi-clients',
                  'Marketplace entrepôt',
                  'Gestion des stocks',
                  'Tableaux de bord avancés',
                  'Facturation automatique',
                  'Support dédié'
                ],
                popular: false
              }
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-8 border-2 ${
                  plan.popular ? 'border-indigo-500 shadow-2xl scale-105' : 'border-gray-200 shadow-lg'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Le plus populaire
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end justify-center">
                    <span className="text-5xl font-bold text-indigo-600">{plan.price}</span>
                    <span className="text-gray-600 ml-2 mb-2">EUR/mois</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/onboarding')}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Commencer
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 text-gray-600">
            <p>Remises disponibles : 3% (3 ans), 5% (4 ans), 7% (5 ans)</p>
            <p className="text-sm mt-2">Options : Afret IA (+200EUR/mois), SMS (0.07EUR/SMS), Télématique (19EUR/camion/mois)</p>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les retours d'expérience de nos clients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                company: 'TransLog Europe',
                author: 'Marie Dupont',
                role: 'Directrice Opérations',
                content: 'L\'inscription a pris 10 minutes. Les données étaient déjà pré-remplies, j\'ai juste eu à signer. On est opérationnels depuis le lendemain !',
                rating: 5
              },
              {
                company: 'IndusPro Solutions',
                author: 'Jean Martin',
                role: 'Responsable Logistique',
                content: 'Enfin une plateforme qui facilite vraiment l\'onboarding. Plus de paperasse, tout est digital. Le support est très réactif.',
                rating: 5
              },
              {
                company: 'LogiStock Distribution',
                author: 'Sophie Bernard',
                role: 'CEO',
                content: 'Le processus est ultra-fluide. La vérification automatique de la TVA est un vrai gain de temps. Je recommande !',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-indigo-600 font-medium">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur l'inscription
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Combien de temps prend l\'inscription ?',
                answer: 'L\'inscription complète prend entre 5 et 15 minutes. La vérification de votre TVA est instantanée, vos données sont pré-remplies automatiquement, et vous recevez votre contrat par email immédiatement après validation.'
              },
              {
                question: 'La signature électronique est-elle légale ?',
                answer: 'Oui, absolument. Notre système de signature électronique est conforme au règlement eIDAS (UE) n°910/2014. Votre signature a la même valeur juridique qu\'une signature manuscrite. Chaque signature est horodatée et certifiée.'
              },
              {
                question: 'Quels pays sont supportés pour la vérification TVA ?',
                answer: 'Nous supportons tous les pays de l\'Union Européenne via l\'API VIES officielle. Pour la France, nous utilisons en plus l\'API INSEE pour récupérer des données enrichies (SIRET, forme juridique, capital social).'
              },
              {
                question: 'Puis-je changer d\'abonnement après inscription ?',
                answer: 'Oui, vous pouvez modifier votre formule à tout moment depuis votre espace client. Les changements sont effectifs immédiatement et la facturation est ajustée au prorata.'
              },
              {
                question: 'Y a-t-il des frais de mise en service ?',
                answer: 'Non, aucun frais de mise en service ou d\'installation. Vous payez uniquement votre abonnement mensuel. La formation initiale, le support et les mises à jour sont inclus.'
              },
              {
                question: 'Puis-je tester avant de m\'engager ?',
                answer: 'Oui ! Nous proposons une période d\'essai de 14 jours gratuite sans engagement. Vous pouvez annuler à tout moment pendant cette période sans frais.'
              },
              {
                question: 'Mes données sont-elles sécurisées ?',
                answer: 'Vos données sont hébergées en France sur des serveurs sécurisés. Nous utilisons le chiffrement TLS 1.3, effectuons des sauvegardes quotidiennes et sommes conformes RGPD. Audit de sécurité annuel par un organisme indépendant.'
              },
              {
                question: 'Le support est-il inclus ?',
                answer: 'Oui, le support par email et chat est inclus dans tous nos abonnements (5j/7, 9h-18h). Les plans Industriel et Logisticien bénéficient d\'un support prioritaire avec temps de réponse garanti < 2h.'
              }
            ].map((faq, idx) => (
              <details
                key={idx}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-200 group"
              >
                <summary className="font-semibold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-indigo-600 group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à digitaliser votre logistique ?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
            Rejoignez les 500+ entreprises qui font confiance à SYMPHONI.A.
            Inscription en 5 minutes, activation immédiate, support inclus.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-white text-indigo-600 px-10 py-5 rounded-lg font-semibold text-lg hover:bg-indigo-50 transition inline-flex items-center shadow-xl"
          >
            Démarrer gratuitement
            <ArrowRight className="ml-3" size={24} />
          </button>
          <p className="text-sm text-indigo-200 mt-6">
            14 jours d'essai gratuit • Sans engagement • Annulation en 1 clic
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-8 h-8" />
              <div className="text-left">
                <div className="font-semibold">Conforme eIDAS</div>
                <div className="text-sm text-indigo-200">Signature légale</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Lock className="w-8 h-8" />
              <div className="text-left">
                <div className="font-semibold">RGPD</div>
                <div className="text-sm text-indigo-200">Données protégées</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Users className="w-8 h-8" />
              <div className="text-left">
                <div className="font-semibold">Support 5j/7</div>
                <div className="text-sm text-indigo-200">Équipe dédiée</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">SYMPHONI.A</h3>
              <p className="text-sm leading-relaxed">
                La plateforme TMS intelligente pour optimiser vos opérations de transport et logistique.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">Intégrations</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">CGV</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition">Sécurité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2025 SYMPHONI.A. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

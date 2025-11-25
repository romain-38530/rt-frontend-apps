import { Cookie, Settings, BarChart, Shield, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Cookie size={48} />
            <h1 className="text-4xl font-extrabold">Politique de Cookies</h1>
          </div>
          <p className="text-xl text-indigo-100">
            Dernière mise à jour : 25 novembre 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-8">
                Cette politique de cookies explique ce que sont les cookies, comment nous les utilisons sur
                SYMPHONI.A, et comment vous pouvez les gérer.
              </p>

              <div className="space-y-8">
                {/* Section 1 */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Cookie className="text-indigo-600" size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 m-0">1. Qu'est-ce qu'un cookie ?</h2>
                  </div>
                  <p className="text-gray-700">
                    Un cookie est un petit fichier texte déposé sur votre ordinateur ou appareil mobile lors
                    de votre visite sur un site web. Les cookies permettent au site de mémoriser vos actions
                    et préférences sur une période donnée.
                  </p>
                </div>

                {/* Section 2 */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Settings className="text-purple-600" size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 m-0">2. Comment utilisons-nous les cookies ?</h2>
                  </div>
                  <p className="text-gray-700">
                    SYMPHONI.A utilise des cookies pour améliorer votre expérience utilisateur et analyser
                    l'utilisation de notre plateforme. Nous utilisons différents types de cookies :
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Types de cookies */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Cookies essentiels */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cookies essentiels</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Ces cookies sont nécessaires au fonctionnement de la plateforme. Ils ne peuvent pas être
                désactivés.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong>session_id</strong> - Maintien de votre session</li>
                <li><strong>csrf_token</strong> - Protection contre les attaques CSRF</li>
                <li><strong>auth_token</strong> - Authentification utilisateur</li>
                <li><strong>Durée :</strong> Session ou 30 jours</li>
              </ul>
            </div>

            {/* Cookies de performance */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cookies de performance</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong>_ga</strong> - Google Analytics</li>
                <li><strong>_gid</strong> - Google Analytics</li>
                <li><strong>_gat</strong> - Google Analytics</li>
                <li><strong>Durée :</strong> 13 mois maximum</li>
              </ul>
            </div>

            {/* Cookies fonctionnels */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cookies fonctionnels</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Ces cookies permettent de mémoriser vos préférences et choix.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong>lang</strong> - Langue préférée</li>
                <li><strong>theme</strong> - Thème d'affichage</li>
                <li><strong>preferences</strong> - Préférences utilisateur</li>
                <li><strong>Durée :</strong> 12 mois</li>
              </ul>
            </div>

            {/* Cookies refusés */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="text-gray-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cookies publicitaires</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Nous n'utilisons PAS de cookies publicitaires ou de tracking tiers à des fins marketing.
              </p>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-800 font-semibold">
                  ✓ Aucune publicité ciblée<br />
                  ✓ Aucun partage avec des tiers publicitaires
                </p>
              </div>
            </div>
          </div>

          {/* Gestion des cookies */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Shield className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. Gestion de vos cookies</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Via votre navigateur</h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez configurer votre navigateur pour refuser les cookies ou vous alerter lorsqu'un
                  cookie est déposé. Voici les liens pour gérer les cookies sur les principaux navigateurs :
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>Chrome :</strong>{' '}
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      support.google.com/chrome/answer/95647
                    </a>
                  </li>
                  <li>
                    <strong>Firefox :</strong>{' '}
                    <a
                      href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      support.mozilla.org
                    </a>
                  </li>
                  <li>
                    <strong>Safari :</strong>{' '}
                    <a
                      href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      support.apple.com
                    </a>
                  </li>
                  <li>
                    <strong>Edge :</strong>{' '}
                    <a
                      href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      support.microsoft.com
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Via notre plateforme</h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez également gérer vos préférences de cookies directement depuis les paramètres
                  de votre compte SYMPHONI.A.
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Gérer mes préférences de cookies
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Attention :</strong> La désactivation de certains cookies peut affecter le
                  fonctionnement de la plateforme et limiter certaines fonctionnalités.
                </p>
              </div>
            </div>
          </div>

          {/* Cookies tiers */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Cookies tiers</h2>
            <p className="text-gray-700 mb-4">
              Nous utilisons les services tiers suivants qui peuvent déposer leurs propres cookies :
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-semibold text-gray-900">Google Analytics</h3>
                <p className="text-gray-700 text-sm">
                  Service d'analyse d'audience. Politique de confidentialité :{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    policies.google.com/privacy
                  </a>
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900">Stripe</h3>
                <p className="text-gray-700 text-sm">
                  Processeur de paiement. Politique de confidentialité :{' '}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    stripe.com/privacy
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Contact</h2>
            <p className="text-gray-700 mb-4">
              Pour toute question concernant notre utilisation des cookies :
            </p>
            <div className="bg-indigo-50 rounded-xl p-6">
              <p className="text-gray-900 font-semibold mb-2">Service Protection des Données</p>
              <p className="text-gray-700">Email : <a href="mailto:privacy@symphonia.com" className="text-indigo-600 hover:text-indigo-700">privacy@symphonia.com</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Votre vie privée est importante pour nous</h3>
          <p className="text-indigo-100 mb-6">
            Consultez également notre politique de confidentialité complète.
          </p>
          <Link
            href="/privacy"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Politique de confidentialité
          </Link>
        </div>
      </section>
    </div>
  );
}

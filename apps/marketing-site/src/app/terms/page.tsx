import { FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <FileText size={48} />
            <h1 className="text-4xl font-extrabold">Conditions Générales d'Utilisation</h1>
          </div>
          <p className="text-xl text-indigo-100">
            Dernière mise à jour : 25 novembre 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme
              SYMPHONI.A. En utilisant nos services, vous acceptez sans réserve les présentes CGU.
            </p>

            <div className="space-y-8">
              {/* Section 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-indigo-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">1. Objet</h2>
                </div>
                <p className="text-gray-700">
                  SYMPHONI.A est une plateforme TMS (Transport Management System) qui permet de gérer et optimiser
                  les opérations de transport et de logistique. Les présentes CGU définissent les conditions d'accès
                  et d'utilisation de la plateforme.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">2. Inscription et compte utilisateur</h2>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.1 Création de compte</h3>
                <p className="text-gray-700">
                  Pour utiliser SYMPHONI.A, vous devez créer un compte en fournissant des informations exactes et
                  à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.2 Conditions d'éligibilité</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>Être une personne physique majeure ou une personne morale</li>
                  <li>Exercer une activité dans le domaine du transport ou de la logistique</li>
                  <li>Fournir des informations d'identification valides</li>
                  <li>Accepter les présentes CGU et la politique de confidentialité</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">2.3 Sécurité du compte</h3>
                <p className="text-gray-700">
                  Vous êtes seul responsable de toutes les activités effectuées sur votre compte. En cas de
                  compromission de vos identifiants, vous devez immédiatement nous en informer.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Services proposés</h2>
                <p className="text-gray-700">SYMPHONI.A propose les services suivants :</p>
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Gestion des transports :</strong> planification, suivi et optimisation</li>
                  <li><strong>e-CMR électronique :</strong> dématérialisation des lettres de voiture</li>
                  <li><strong>Tracking en temps réel :</strong> suivi GPS des expéditions</li>
                  <li><strong>Analytics et reporting :</strong> tableaux de bord et analyses</li>
                  <li><strong>Intégrations :</strong> connexion avec vos systèmes ERP/WMS</li>
                  <li><strong>Intelligence artificielle :</strong> optimisation automatique (selon abonnement)</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Abonnements et tarifs</h2>
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.1 Formules d'abonnement</h3>
                <p className="text-gray-700">
                  SYMPHONI.A propose plusieurs formules d'abonnement (Gratuit, Pro, Enterprise) avec des
                  fonctionnalités et limites différentes. Les tarifs sont indiqués sur notre{' '}
                  <Link href="/subscription" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    page tarifs
                  </Link>.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.2 Paiement</h3>
                <p className="text-gray-700">
                  Les abonnements payants sont facturés mensuellement ou annuellement par carte bancaire ou
                  virement bancaire. Le paiement est exigible d'avance.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">4.3 Modification des tarifs</h3>
                <p className="text-gray-700">
                  Nous nous réservons le droit de modifier nos tarifs à tout moment. Les modifications seront
                  notifiées 30 jours avant leur entrée en vigueur.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-yellow-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">5. Obligations de l'utilisateur</h2>
                </div>
                <p className="text-gray-700">En utilisant SYMPHONI.A, vous vous engagez à :</p>
                <ul className="text-gray-700 space-y-2">
                  <li>Utiliser la plateforme de manière légale et conforme aux présentes CGU</li>
                  <li>Ne pas tenter de compromettre la sécurité de la plateforme</li>
                  <li>Fournir des informations exactes et à jour</li>
                  <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Ne pas utiliser de robots ou scripts automatisés sans autorisation</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriété intellectuelle</h2>
                <p className="text-gray-700">
                  Tous les éléments de la plateforme SYMPHONI.A (code source, design, contenus, marques, logos)
                  sont protégés par les droits de propriété intellectuelle et sont la propriété exclusive de
                  SYMPHONI.A ou de ses concédants de licence.
                </p>
                <p className="text-gray-700 mt-4">
                  Vous disposez d'une licence d'utilisation limitée, non exclusive, non transférable pour utiliser
                  la plateforme conformément aux présentes CGU.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Scale className="text-red-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">7. Responsabilité</h2>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.1 Disponibilité du service</h3>
                <p className="text-gray-700">
                  Nous nous efforçons de maintenir la plateforme disponible 24/7, mais ne pouvons garantir une
                  disponibilité ininterrompue. Nous nous réservons le droit d'effectuer des maintenances.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.2 Limitation de responsabilité</h3>
                <p className="text-gray-700">
                  SYMPHONI.A ne saurait être tenue responsable des dommages indirects, y compris la perte de
                  profits, de données ou d'opportunités commerciales résultant de l'utilisation de la plateforme.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Résiliation</h2>
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">8.1 Résiliation par l'utilisateur</h3>
                <p className="text-gray-700">
                  Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre compte ou en
                  nous contactant. La résiliation prend effet immédiatement.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">8.2 Résiliation par SYMPHONI.A</h3>
                <p className="text-gray-700">
                  Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation des
                  présentes CGU, sans préavis ni remboursement.
                </p>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Protection des données</h2>
                <p className="text-gray-700">
                  Le traitement de vos données personnelles est décrit dans notre{' '}
                  <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Politique de confidentialité
                  </Link>.
                  Nous nous conformons au RGPD et aux lois applicables en matière de protection des données.
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Loi applicable et juridiction</h2>
                <p className="text-gray-700">
                  Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de solution
                  amiable, les tribunaux de Paris seront exclusivement compétents.
                </p>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
                <p className="text-gray-700">
                  Pour toute question concernant ces conditions générales :
                </p>
                <div className="bg-indigo-50 rounded-xl p-6 mt-4">
                  <p className="text-gray-900 font-semibold mb-2">SYMPHONI.A</p>
                  <p className="text-gray-700">Email : <a href="mailto:legal@symphonia.com" className="text-indigo-600 hover:text-indigo-700">legal@symphonia.com</a></p>
                  <p className="text-gray-700">Adresse : 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Prêt à commencer avec SYMPHONI.A ?</h3>
          <p className="text-indigo-100 mb-6">Créez votre compte gratuitement en 2 minutes.</p>
          <Link
            href="/onboarding"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Créer mon compte
          </Link>
        </div>
      </section>
    </div>
  );
}

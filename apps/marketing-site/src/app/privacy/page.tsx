import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Shield size={48} />
            <h1 className="text-4xl font-extrabold">Politique de Confidentialité</h1>
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
              SYMPHONI.A s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité
              décrit comment nous collectons, utilisons, stockons et protégeons vos données personnelles.
            </p>

            <div className="space-y-8">
              {/* Section 1 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Database className="text-indigo-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">1. Données collectées</h2>
                </div>
                <p className="text-gray-700">Nous collectons les types de données suivantes :</p>
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                  <li><strong>Données de l'entreprise :</strong> nom de l'entreprise, SIRET, adresse</li>
                  <li><strong>Données de connexion :</strong> adresse IP, logs de connexion, cookies</li>
                  <li><strong>Données d'utilisation :</strong> interactions avec la plateforme, préférences</li>
                  <li><strong>Données de transport :</strong> informations sur les expéditions et livraisons</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">2. Utilisation des données</h2>
                </div>
                <p className="text-gray-700">Vos données sont utilisées pour :</p>
                <ul className="text-gray-700 space-y-2">
                  <li>Fournir et améliorer nos services de gestion logistique</li>
                  <li>Créer et gérer votre compte utilisateur</li>
                  <li>Traiter vos commandes et expéditions</li>
                  <li>Communiquer avec vous sur nos services</li>
                  <li>Personnaliser votre expérience utilisateur</li>
                  <li>Respecter nos obligations légales et réglementaires</li>
                  <li>Prévenir la fraude et garantir la sécurité de la plateforme</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Lock className="text-green-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">3. Sécurité des données</h2>
                </div>
                <p className="text-gray-700">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour
                  protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou
                  destruction :
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>Authentification forte et gestion des accès</li>
                  <li>Sauvegardes régulières et redondance des données</li>
                  <li>Audits de sécurité réguliers</li>
                  <li>Formation du personnel sur la protection des données</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="text-blue-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">4. Vos droits RGPD</h2>
                </div>
                <p className="text-gray-700">Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                  <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@symphonia.com" className="text-indigo-600 hover:text-indigo-700 font-semibold">privacy@symphonia.com</a>
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partage des données</h2>
                <p className="text-gray-700">
                  Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>Nos partenaires transporteurs (uniquement les données nécessaires à la livraison)</li>
                  <li>Nos prestataires de services techniques (hébergement, paiement, etc.)</li>
                  <li>Les autorités légales si requis par la loi</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Tous nos partenaires sont contractuellement tenus de respecter la confidentialité de vos données.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
                <p className="text-gray-700">
                  Notre site utilise des cookies pour améliorer votre expérience. Pour plus d'informations,
                  consultez notre <Link href="/cookies" className="text-indigo-600 hover:text-indigo-700 font-semibold">Politique de cookies</Link>.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Conservation des données</h2>
                <p className="text-gray-700">
                  Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services
                  et respecter nos obligations légales. En général :
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>Données de compte : durée de vie du compte + 3 ans</li>
                  <li>Données de transport : 10 ans (obligation légale)</li>
                  <li>Données de facturation : 10 ans (obligation légale)</li>
                  <li>Cookies : maximum 13 mois</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-indigo-600" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 m-0">8. Contact</h2>
                </div>
                <p className="text-gray-700">
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
                  contactez notre Délégué à la Protection des Données (DPO) :
                </p>
                <div className="bg-indigo-50 rounded-xl p-6 mt-4">
                  <p className="text-gray-900 font-semibold mb-2">Délégué à la Protection des Données</p>
                  <p className="text-gray-700">Email : <a href="mailto:dpo@symphonia.com" className="text-indigo-600 hover:text-indigo-700">dpo@symphonia.com</a></p>
                  <p className="text-gray-700">Adresse : SYMPHONI.A, 123 Avenue des Champs-Élysées, 75008 Paris</p>
                </div>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications</h2>
                <p className="text-gray-700">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
                  Les modifications entreront en vigueur dès leur publication sur cette page. La date de dernière
                  mise à jour est indiquée en haut de la page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Des questions sur notre politique de confidentialité ?</h3>
          <p className="text-indigo-100 mb-6">Notre équipe est à votre disposition pour répondre à toutes vos questions.</p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Nous contacter
          </Link>
        </div>
      </section>
    </div>
  );
}

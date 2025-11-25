import { Building, User, Mail, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Building size={48} />
            <h1 className="text-4xl font-extrabold">Mentions Légales</h1>
          </div>
          <p className="text-xl text-indigo-100">
            Informations légales concernant le site SYMPHONI.A
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Éditeur */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Éditeur du site</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p><strong>Raison sociale :</strong> SYMPHONI.A SAS</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée</p>
              <p><strong>Capital social :</strong> 100 000 €</p>
              <p><strong>Siège social :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
              <p><strong>SIRET :</strong> 123 456 789 00012</p>
              <p><strong>RCS :</strong> Paris B 123 456 789</p>
              <p><strong>Numéro TVA intracommunautaire :</strong> FR 12 123456789</p>
            </div>
          </div>

          {/* Directeur de publication */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="text-purple-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Directeur de la publication</h2>
            </div>
            <p className="text-gray-700"><strong>Nom :</strong> [Nom du Directeur]</p>
            <p className="text-gray-700"><strong>Qualité :</strong> Président</p>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="text-green-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p><strong>Email :</strong> <a href="mailto:contact@symphonia.com" className="text-indigo-600 hover:text-indigo-700">contact@symphonia.com</a></p>
              <p><strong>Téléphone :</strong> <a href="tel:+33123456789" className="text-indigo-600 hover:text-indigo-700">+33 1 23 45 67 89</a></p>
              <p><strong>Adresse postale :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
            </div>
          </div>

          {/* Hébergeur */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="text-blue-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Hébergement</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p><strong>Hébergeur :</strong> Amazon Web Services (AWS)</p>
              <p><strong>Raison sociale :</strong> Amazon Web Services EMEA SARL</p>
              <p><strong>Adresse :</strong> 38 avenue John F. Kennedy, L-1855 Luxembourg</p>
              <p><strong>Site web :</strong> <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">aws.amazon.com</a></p>
            </div>
          </div>

          {/* Propriété intellectuelle */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Shield className="text-yellow-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Propriété intellectuelle</h2>
            </div>
            <p className="text-gray-700 mb-4">
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur
              et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les
              documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
            <p className="text-gray-700">
              La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est
              formellement interdite sauf autorisation expresse du directeur de la publication.
            </p>
          </div>

          {/* Protection des données */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Protection des données personnelles</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement
                Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification,
                de suppression et d'opposition aux données personnelles vous concernant.
              </p>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter :
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Par email : <a href="mailto:dpo@symphonia.com" className="text-indigo-600 hover:text-indigo-700">dpo@symphonia.com</a></li>
                <li>Par courrier : SYMPHONI.A - DPO, 123 Avenue des Champs-Élysées, 75008 Paris</li>
              </ul>
              <p className="mt-4">
                Pour plus d'informations, consultez notre{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Politique de confidentialité
                </Link>.
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies</h2>
            <p className="text-gray-700">
              Ce site utilise des cookies pour améliorer votre expérience de navigation et réaliser des
              statistiques de visites. Pour plus d'informations sur les cookies utilisés et leur gestion,
              consultez notre{' '}
              <Link href="/cookies" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Politique de cookies
              </Link>.
            </p>
          </div>

          {/* Crédits */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Crédits</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Conception et développement :</strong> SYMPHONI.A</p>
              <p><strong>Design graphique :</strong> SYMPHONI.A</p>
              <p><strong>Icônes :</strong> Lucide Icons</p>
            </div>
          </div>

          {/* Litiges */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Litiges</h2>
            <p className="text-gray-700 mb-4">
              Les présentes conditions du site sont régies par les lois françaises. En cas de litige, les
              tribunaux français seront seuls compétents.
            </p>
            <p className="text-gray-700">
              Conformément aux dispositions du Code de la consommation concernant le règlement amiable des
              litiges, SYMPHONI.A adhère au Service du Médiateur du e-commerce de la FEVAD (Fédération du
              e-commerce et de la vente à distance) dont les coordonnées sont les suivantes :
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-gray-700">Médiateur de la consommation FEVAD</p>
              <p className="text-gray-700">60 Rue La Boétie, 75008 Paris</p>
              <p className="text-gray-700">
                Site web : <a href="https://www.mediateurfevad.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">mediateurfevad.fr</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Des questions ?</h3>
          <p className="text-indigo-100 mb-6">Notre équipe juridique est à votre disposition.</p>
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

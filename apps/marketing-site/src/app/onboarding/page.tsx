'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    // Étape 1 : TVA
    vatNumber: '',
    // Étape 2 : Données entreprise (auto-remplies)
    companyName: '',
    legalForm: '',
    capital: '',
    address: '',
    city: '',
    siret: '',
    siren: '',
    // Étape 3 : Représentant légal
    representativeName: '',
    representativeTitle: '',
    representativeEmail: '',
    representativePhone: '',
    // Étape 4 : Type d'abonnement
    subscriptionType: '',
    duration: '',
    options: {
      afretIA: false,
      sms: false,
      telematics: false,
      thirdPartyConnection: false
    },
    // Étape 5 : Paiement
    paymentMethod: 'card'
  });

  // Vérification TVA
  const verifyVAT = async () => {
    setLoading(true);
    setError('');

    try {
      // Call VAT API directly (now HTTPS via CloudFront)
      const vatApiUrl = process.env.NEXT_PUBLIC_VAT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';
      const response = await fetch(`${vatApiUrl}/api/vat/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber: formData.vatNumber })
      });

      const data = await response.json();

      // Only proceed if VAT number is actually valid (not just if API call succeeded)
      if (data.valid === true) {
        // Pré-remplir les données entreprise
        const responseData = data.data || data;

        setFormData(prev => ({
          ...prev,
          companyName: responseData.companyName || responseData.name || '',
          legalForm: responseData.legalForm || '',
          capital: responseData.capital || '',
          address: responseData.companyAddress || responseData.address || '',
          city: responseData.registrationCity || '',
          siret: responseData.siret || '',
          siren: responseData.siren || ''
        }));

        setStep(2);
      } else {
        setError(data.error || data.message || 'Numéro de TVA invalide');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Soumission finale
  const submitOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';
      const response = await fetch(`${apiUrl}/api/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.representativeEmail,
          companyName: formData.companyName,
          legalForm: formData.legalForm,
          capital: formData.capital,
          companyAddress: formData.address,
          registrationCity: formData.city,
          siret: formData.siret,
          siren: formData.siren,
          vatNumber: formData.vatNumber,
          representativeName: formData.representativeName,
          representativeTitle: formData.representativeTitle,
          representativePhone: formData.representativePhone,
          subscriptionType: formData.subscriptionType,
          duration: formData.duration,
          options: formData.options,
          paymentMethod: formData.paymentMethod
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/onboarding/success?contractId=${data.contractId}`);
      } else {
        setError(data.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            Bienvenue chez{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              SYMPHONI.A
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Créez votre compte professionnel en 5 minutes chrono
          </p>
          <p className="text-sm text-gray-500">
            Vérification automatique • Données pré-remplies • Activation immédiate
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md
                    ${step >= s ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {s}
                  </div>
                  {s < 5 && (
                    <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="text-xs mt-2 text-center font-medium">
                  {['TVA', 'Entreprise', 'Contact', 'Abonnement', 'Paiement'][s - 1]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Étape 1 : Numéro de TVA */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Vérification de votre entreprise</h2>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-orange-900 font-bold mb-2">Comment ça marche ?</p>
                <p className="text-orange-800 text-sm leading-relaxed">
                  Nous vérifions instantanément votre numéro de TVA via les API officielles européennes (VIES) et INSEE.
                  Vos données d'entreprise (raison sociale, SIRET, adresse) seront automatiquement récupérées et pré-remplies.
                  Aucune saisie manuelle nécessaire !
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de TVA intracommunautaire *
                  </label>
                  <input
                    type="text"
                    placeholder="FR12345678901"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Format : Code pays + numéro (ex: FR41948816988)
                  </p>
                </div>

                <button
                  onClick={verifyVAT}
                  disabled={!formData.vatNumber || loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Vérification en cours...' : 'Vérifier et continuer'}
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Données entreprise */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Vérification des informations</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-green-900 font-medium mb-1">Données récupérées avec succès !</p>
                  <p className="text-green-700 text-sm">
                    Les informations ci-dessous ont été automatiquement récupérées depuis les bases officielles.
                    Vérifiez leur exactitude et complétez si nécessaire.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison sociale *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forme juridique *
                  </label>
                  <input
                    type="text"
                    value={formData.legalForm}
                    onChange={(e) => setFormData({ ...formData, legalForm: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capital social
                  </label>
                  <input
                    type="text"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse du siège social *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET
                  </label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville d'immatriculation
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Représentant légal */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Qui sera votre interlocuteur ?</h2>
              <p className="text-gray-600 mb-6">
                Renseignez les coordonnées du représentant légal qui signera le contrat d'abonnement.
                Ces informations seront utilisées pour la communication et la facturation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom et prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Directeur Général"
                    value={formData.representativeTitle}
                    onChange={(e) => setFormData({ ...formData, representativeTitle: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.representativeEmail}
                    onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.representativePhone}
                    onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Étape 4 : Type d'abonnement */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Choisissez votre formule</h2>
              <p className="text-gray-600 mb-6">
                Sélectionnez l'abonnement qui correspond à votre activité et profitez de remises sur les engagements longue durée.
                Vous pourrez modifier votre formule à tout moment depuis votre espace client.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'abonnement *
                  </label>
                  <select
                    value={formData.subscriptionType}
                    onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="industriel">Industriel - 499€/mois</option>
                    <option value="transporteur_premium">Transporteur Premium - 299€/mois</option>
                    <option value="transporteur_pro">Transporteur Pro - 499€/mois</option>
                    <option value="logisticien_premium">Logisticien Premium - 499€/mois</option>
                    <option value="transitaire_premium">Transitaire Premium - 299€/mois</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée d'engagement *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="12">1 an - Tarif plein</option>
                    <option value="36">3 ans - Remise 3%</option>
                    <option value="48">4 ans - Remise 5%</option>
                    <option value="60">5 ans - Remise 7%</option>
                  </select>
                </div>

                {/* Options */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Options (facultatif)</p>
                  <div className="space-y-2">
                    {formData.subscriptionType === 'industriel' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.options.afretIA}
                          onChange={(e) => setFormData({
                            ...formData,
                            options: { ...formData.options, afretIA: e.target.checked }
                          })}
                          className="mr-3"
                        />
                        <span>Afret IA Premium (+200€/mois)</span>
                      </label>
                    )}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.sms}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, sms: e.target.checked }
                        })}
                        className="mr-3"
                      />
                      <span>Envoi SMS (0.07€/SMS)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.telematics}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, telematics: e.target.checked }
                        })}
                        className="mr-3"
                      />
                      <span>Connexion télématique (19€/camion/mois)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.thirdPartyConnection}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, thirdPartyConnection: e.target.checked }
                        })}
                        className="mr-3"
                      />
                      <span>Connexion outil tiers (89€/mois)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!formData.subscriptionType || !formData.duration}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Étape 5 : Paiement & Validation */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Dernière étape !</h2>
              <p className="text-gray-600 mb-6">
                Vérifiez vos informations ci-dessous, choisissez votre mode de paiement, et nous générerons votre contrat personnalisé.
                Vous recevrez un email avec le lien pour la signature électronique.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-bold mb-4">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Entreprise :</strong> {formData.companyName}</p>
                  <p><strong>TVA :</strong> {formData.vatNumber}</p>
                  <p><strong>Représentant :</strong> {formData.representativeName}</p>
                  <p><strong>Email :</strong> {formData.representativeEmail}</p>
                  <p><strong>Abonnement :</strong> {formData.subscriptionType}</p>
                  <p><strong>Durée :</strong> {formData.duration} mois</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="card">Carte bancaire (prélèvement automatique)</option>
                  <option value="sepa">Prélèvement SEPA</option>
                  <option value="transfer">Virement bancaire</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-3" required />
                  <span className="text-sm text-gray-600">
                    J'accepte les conditions générales de vente et autorise SYMPHONI.A
                    à générer et m'envoyer le contrat d'abonnement pour signature électronique.
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={submitOnboarding}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Génération du contrat...' : 'Générer le contrat'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

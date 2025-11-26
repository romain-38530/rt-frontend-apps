'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vatValidating, setVatValidating] = useState(false);
  const [vatValidated, setVatValidated] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    // Étape 1 : TVA
    vatNumber: '',
    // Étape 2 : Données entreprise (auto-remplies)
    companyName: '',
    legalForm: '',
    capital: '',
    // Adresse entreprise (découpée)
    companyAddress: '',
    companyPostalCode: '',
    companyCity: '',
    companyDepartment: '',
    companyCountry: 'France',
    siret: '',
    siren: '',
    // Étape 3 : Représentant légal (découpé)
    representativeFirstName: '',
    representativeLastName: '',
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

  // Auto-validation TVA avec debounce
  useEffect(() => {
    const validateVAT = async () => {
      if (!formData.vatNumber || formData.vatNumber.length < 5) {
        setVatValidated(false);
        setCompanyInfo(null);
        return;
      }

      setVatValidating(true);
      setError('');

      try {
        const vatApiUrl = process.env.NEXT_PUBLIC_VAT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';
        const response = await fetch(`${vatApiUrl}/api/vat/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vatNumber: formData.vatNumber })
        });

        const data = await response.json();

        if (data.valid === true) {
          const responseData = data.data || data;
          setCompanyInfo(responseData);
          setVatValidated(true);
          setError('');

          // Pré-remplir les données entreprise
          setFormData(prev => ({
            ...prev,
            companyName: responseData.companyName || responseData.name || '',
            legalForm: responseData.legalForm || '',
            capital: responseData.capital || '',
            companyAddress: responseData.companyAddress || responseData.address || '',
            companyCity: responseData.registrationCity || responseData.city || '',
            companyPostalCode: responseData.postalCode || '',
            companyDepartment: responseData.department || '',
            siret: responseData.siret || '',
            siren: responseData.siren || ''
          }));
        } else {
          setVatValidated(false);
          setCompanyInfo(null);
          setError(data.error || data.message || 'Numéro de TVA invalide');
        }
      } catch (err) {
        setVatValidated(false);
        setCompanyInfo(null);
        setError('Erreur de connexion au serveur');
      } finally {
        setVatValidating(false);
      }
    };

    // Debounce de 800ms après la saisie
    const timer = setTimeout(() => {
      validateVAT();
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.vatNumber]);

  // Soumission finale
  const submitOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';

      // Format de l'adresse complète avec tous les champs
      const fullAddress = [
        formData.companyAddress,
        formData.companyPostalCode,
        formData.companyCity,
        formData.companyDepartment,
        formData.companyCountry
      ].filter(Boolean).join(', ');

      // Nom complet du représentant
      const representativeName = `${formData.representativeFirstName} ${formData.representativeLastName}`.trim();

      const response = await fetch(`${apiUrl}/api/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.representativeEmail,
          companyName: formData.companyName,
          siret: formData.siret || undefined,
          vatNumber: formData.vatNumber || undefined,
          phone: formData.representativePhone || undefined,
          address: fullAddress || undefined,
          subscriptionType: formData.subscriptionType || 'basic',
          source: 'WEB'
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/onboarding/success?requestId=${data.requestId}&email=${encodeURIComponent(data.email)}`);
      } else {
        const errorMessage = data.error?.message || data.error || 'Erreur lors de la soumission';
        setError(errorMessage);
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
                  Saisissez votre numéro de TVA intracommunautaire. Nous le vérifions automatiquement via les API officielles européennes (VIES) et INSEE.
                  Vos données d'entreprise seront récupérées et pré-remplies instantanément.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de TVA intracommunautaire *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="FR12345678901"
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all ${
                        vatValidated
                          ? 'border-green-500 bg-green-50'
                          : vatValidating
                          ? 'border-orange-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {vatValidating && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {vatValidated && !vatValidating && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {vatValidating ? 'Recherche en cours...' : 'Format : Code pays + numéro (ex: FR41948816988)'}
                  </p>
                </div>

                {/* Affichage des informations de la société trouvée */}
                {vatValidated && companyInfo && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-green-900 font-bold text-lg mb-1">Entreprise trouvée !</p>
                        <p className="text-green-800 text-2xl font-extrabold mb-3">
                          {companyInfo.companyName || companyInfo.name}
                        </p>
                        {companyInfo.siret && (
                          <p className="text-green-700 text-sm">
                            <span className="font-medium">SIRET :</span> {companyInfo.siret}
                          </p>
                        )}
                        {(companyInfo.companyAddress || companyInfo.address) && (
                          <p className="text-green-700 text-sm">
                            <span className="font-medium">Adresse :</span> {companyInfo.companyAddress || companyInfo.address}
                            {companyInfo.registrationCity && `, ${companyInfo.registrationCity}`}
                          </p>
                        )}
                        <p className="text-green-600 text-xs mt-2">
                          ✓ Toutes les informations seront pré-remplies à l'étape suivante
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!vatValidated}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {vatValidated ? 'Valider et continuer →' : 'Saisissez un numéro de TVA valide'}
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
                    Forme juridique
                  </label>
                  <input
                    type="text"
                    placeholder="ex: SARL, SAS, SA..."
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
                    placeholder="ex: 50000"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET
                  </label>
                  <input
                    type="text"
                    placeholder="14 chiffres"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                {/* Adresse du siège social (découpée) */}
                <div className="col-span-2 border-t pt-4 mt-2">
                  <p className="text-sm font-medium text-gray-900 mb-3">Adresse du siège social</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    placeholder="Numéro et nom de rue"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    placeholder="75001"
                    value={formData.companyPostalCode}
                    onChange={(e) => setFormData({ ...formData, companyPostalCode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    placeholder="Paris"
                    value={formData.companyCity}
                    onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Département
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Paris, Hauts-de-Seine..."
                    value={formData.companyDepartment}
                    onChange={(e) => setFormData({ ...formData, companyDepartment: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <input
                    type="text"
                    value={formData.companyCountry}
                    onChange={(e) => setFormData({ ...formData, companyCountry: e.target.value })}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    placeholder="Jean"
                    value={formData.representativeFirstName}
                    onChange={(e) => setFormData({ ...formData, representativeFirstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={formData.representativeLastName}
                    onChange={(e) => setFormData({ ...formData, representativeLastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Directeur Général, Président..."
                    value={formData.representativeTitle}
                    onChange={(e) => setFormData({ ...formData, representativeTitle: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    placeholder="jean.dupont@entreprise.com"
                    value={formData.representativeEmail}
                    onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
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
                  disabled={!formData.representativeFirstName || !formData.representativeLastName || !formData.representativeEmail || !formData.representativeTitle}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Étape 4 : Type d'abonnement */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Choisissez votre espace professionnel</h2>
              <p className="text-gray-600 mb-6">
                Sélectionnez l'abonnement qui correspond à votre activité. Chaque espace est conçu pour répondre aux besoins spécifiques de votre métier.
              </p>

              {/* Cartes d'abonnement */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Industriel */}
                <div
                  onClick={() => setFormData({ ...formData, subscriptionType: 'industriel' })}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    formData.subscriptionType === 'industriel'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {formData.subscriptionType === 'industriel' && (
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Espace Industriel</h3>
                    <p className="text-3xl font-extrabold text-orange-600">499€<span className="text-lg text-gray-500">/mois</span></p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Gestion complète des commandes transport</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Affrètement intelligent avec IA</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Tableau de bord analytics</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Intégration ERP (SAP, Sage, Odoo)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Support prioritaire</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500">Idéal pour les industriels expéditeurs</p>
                </div>

                {/* Transporteur Premium */}
                <div
                  onClick={() => setFormData({ ...formData, subscriptionType: 'transporteur_premium' })}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    formData.subscriptionType === 'transporteur_premium'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {formData.subscriptionType === 'transporteur_premium' && (
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Transporteur Premium</h3>
                    <p className="text-3xl font-extrabold text-orange-600">299€<span className="text-lg text-gray-500">/mois</span></p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Réception commandes clients</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Planning optimisé des tournées</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Suivi en temps réel des livraisons</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>POD électronique (photos, signature)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Application mobile chauffeur</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour PME de transport (5-50 camions)</p>
                </div>

                {/* Transporteur Pro */}
                <div
                  onClick={() => setFormData({ ...formData, subscriptionType: 'transporteur_pro' })}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    formData.subscriptionType === 'transporteur_pro'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold rounded-full">
                      RECOMMANDÉ
                    </span>
                  </div>
                  {formData.subscriptionType === 'transporteur_pro' && (
                    <div className="absolute top-4 right-4 mt-8">
                      <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="mb-4 mt-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Transporteur Pro</h3>
                    <p className="text-3xl font-extrabold text-orange-600">499€<span className="text-lg text-gray-500">/mois</span></p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Toutes les fonctionnalités Premium</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>TMS complet (gestion flotte avancée)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Connectivité télématique (GPS, capteurs)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Facturation et comptabilité intégrées</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>API et intégrations illimitées</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour entreprises de transport (50+ camions)</p>
                </div>

                {/* Logisticien */}
                <div
                  onClick={() => setFormData({ ...formData, subscriptionType: 'logisticien_premium' })}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    formData.subscriptionType === 'logisticien_premium'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {formData.subscriptionType === 'logisticien_premium' && (
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Logisticien Premium</h3>
                    <p className="text-3xl font-extrabold text-orange-600">499€<span className="text-lg text-gray-500">/mois</span></p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>WMS complet (gestion d'entrepôt)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Gestion multi-sites et multi-clients</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Prévisions IA de stock et flux</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Marketplace de palettes</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Reporting avancé</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour 3PL et plateformes logistiques</p>
                </div>
              </div>

              {/* Durée d'engagement */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Durée d'engagement</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: '12', label: '1 an', discount: 'Tarif plein', popular: false },
                    { value: '36', label: '3 ans', discount: 'Remise 3%', popular: true },
                    { value: '48', label: '4 ans', discount: 'Remise 5%', popular: false },
                    { value: '60', label: '5 ans', discount: 'Remise 7%', popular: false },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setFormData({ ...formData, duration: option.value })}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all text-center ${
                        formData.duration === option.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {option.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                          POPULAIRE
                        </span>
                      )}
                      <p className="font-bold text-lg">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.discount}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options complémentaires */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-2">Options complémentaires</h3>
                <p className="text-sm text-gray-600 mb-4">Ajoutez des fonctionnalités avancées à votre abonnement</p>

                <div className="space-y-4">
                  {/* Afret IA - uniquement pour industriels */}
                  {formData.subscriptionType === 'industriel' && (
                    <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.options.afretIA ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={formData.options.afretIA}
                          onChange={(e) => setFormData({
                            ...formData,
                            options: { ...formData.options, afretIA: e.target.checked }
                          })}
                          className="mt-1 w-5 h-5 text-orange-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">Afret IA Premium</h4>
                            <span className="text-orange-600 font-bold">+200€/mois</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Intelligence artificielle avancée pour l'affrètement optimal. Analyse en temps réel de 10 000+ transporteurs,
                            prédiction des tarifs, optimisation automatique des tournées multi-modales. ROI moyen : 15-20% de réduction des coûts transport.
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Envoi SMS */}
                  <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.options.sms ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.options.sms}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, sms: e.target.checked }
                        })}
                        className="mt-1 w-5 h-5 text-orange-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">Notifications SMS</h4>
                          <span className="text-orange-600 font-bold">0,07€/SMS</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Envoi automatique de SMS aux destinataires (alertes livraison, fenêtres horaires, retards).
                          Taux d'ouverture 98% (vs 20% email). Pas de forfait minimum, facturation à l'usage réel.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Télématique */}
                  <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.options.telematics ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.options.telematics}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, telematics: e.target.checked }
                        })}
                        className="mt-1 w-5 h-5 text-orange-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">Connexion télématique</h4>
                          <span className="text-orange-600 font-bold">19€/camion/mois</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Intégration directe avec vos boîtiers GPS (TomTom, Verizon, Masternaut, Rio...).
                          Géolocalisation temps réel, données de conduite (vitesse, freinage), calcul automatique des ETAs.
                          Compatible 95% des systèmes embarqués.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Connexion outil tiers */}
                  <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.options.thirdPartyConnection ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.options.thirdPartyConnection}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, thirdPartyConnection: e.target.checked }
                        })}
                        className="mt-1 w-5 h-5 text-orange-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">Connexion outil tiers</h4>
                          <span className="text-orange-600 font-bold">89€/mois</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Intégration bidirectionnelle avec vos outils existants (ERP, TMS, WMS, comptabilité).
                          API REST complète + webhooks. Synchronisation temps réel des commandes, stocks, factures.
                          Connecteurs pré-configurés : SAP, Sage, Odoo, Microsoft Dynamics, Oracle.
                        </p>
                      </div>
                    </div>
                  </label>
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="col-span-2 border-b pb-2 mb-2">
                    <p className="text-xs text-gray-500 font-medium uppercase">Entreprise</p>
                  </div>
                  <p><strong>Raison sociale :</strong> {formData.companyName}</p>
                  <p><strong>TVA :</strong> {formData.vatNumber}</p>
                  <p><strong>SIRET :</strong> {formData.siret}</p>
                  <p><strong>Forme juridique :</strong> {formData.legalForm || 'Non renseignée'}</p>
                  <p className="col-span-2"><strong>Adresse :</strong> {formData.companyAddress}, {formData.companyPostalCode} {formData.companyCity}</p>

                  <div className="col-span-2 border-b pb-2 mb-2 mt-3">
                    <p className="text-xs text-gray-500 font-medium uppercase">Représentant légal</p>
                  </div>
                  <p><strong>Nom :</strong> {formData.representativeFirstName} {formData.representativeLastName}</p>
                  <p><strong>Fonction :</strong> {formData.representativeTitle}</p>
                  <p><strong>Email :</strong> {formData.representativeEmail}</p>
                  <p><strong>Téléphone :</strong> {formData.representativePhone}</p>

                  <div className="col-span-2 border-b pb-2 mb-2 mt-3">
                    <p className="text-xs text-gray-500 font-medium uppercase">Abonnement</p>
                  </div>
                  <p><strong>Type :</strong> {formData.subscriptionType}</p>
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

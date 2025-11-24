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
          companyData: {
            companyName: formData.companyName,
            legalForm: formData.legalForm,
            capital: formData.capital,
            companyAddress: formData.address,
            registrationCity: formData.city,
            siret: formData.siret,
            siren: formData.siren,
            vatNumber: formData.vatNumber,
            email: formData.representativeEmail
          },
          subscriptionType: formData.subscriptionType,
          duration: formData.duration,
          options: formData.options,
          representative: `${formData.representativeName} - ${formData.representativeTitle}`,
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

  const stepTitles = ['TVA', 'Entreprise', 'Contact', 'Abonnement', 'Paiement'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec amélioration accessibilité */}
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Inscription SYMPHONI.A
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Créez votre compte en quelques minutes
          </p>
        </header>

        {/* Indicateur de progression - Accessible avec ARIA */}
        <nav aria-label="Progression du formulaire" className="mb-6 sm:mb-8">
          <ol className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <li key={s} className="flex-1 flex items-center" aria-current={step === s ? 'step' : undefined}>
                <div className="flex items-center w-full">
                  <div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base
                      transition-colors duration-200
                      ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}
                    `}
                    aria-label={`Étape ${s} de 5: ${stepTitles[s - 1]}`}
                  >
                    {step > s ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : s}
                  </div>
                  {s < 5 && (
                    <div
                      className={`flex-1 h-1 mx-1 sm:mx-2 transition-colors duration-200 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-xs mt-2 text-center block w-full">
                  {stepTitles[s - 1]}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Formulaire avec amélioration responsive et accessibilité */}
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8">
          {/* Message d'erreur accessible */}
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Étape 1 : Numéro de TVA */}
          {step === 1 && (
            <section aria-labelledby="step1-title">
              <h2 id="step1-title" className="text-2xl font-bold mb-4 sm:mb-6">Numéro de TVA</h2>
              <p className="text-gray-600 mb-4 sm:mb-6">
                Nous allons récupérer automatiquement les informations de votre entreprise
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de TVA intracommunautaire <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="vatNumber"
                    type="text"
                    placeholder="FR12345678901"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                    aria-describedby="vatNumber-help"
                  />
                  <p id="vatNumber-help" className="mt-2 text-sm text-gray-500">
                    Format : Code pays + numéro (ex: FR41948816988)
                  </p>
                </div>

                <button
                  onClick={verifyVAT}
                  disabled={!formData.vatNumber || loading}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Vérification en cours...
                    </span>
                  ) : 'Vérifier et continuer'}
                </button>
              </div>
            </section>
          )}

          {/* Étape 2 : Données entreprise */}
          {step === 2 && (
            <section aria-labelledby="step2-title">
              <h2 id="step2-title" className="text-2xl font-bold mb-4 sm:mb-6">Informations de l'entreprise</h2>
              <div className="mb-4 sm:mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg" role="status">
                <p className="text-green-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Données récupérées automatiquement - Vérifiez et complétez si nécessaire
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Raison sociale <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="legalForm" className="block text-sm font-medium text-gray-700 mb-2">
                    Forme juridique <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="legalForm"
                    type="text"
                    value={formData.legalForm}
                    onChange={(e) => setFormData({ ...formData, legalForm: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-2">
                    Capital social
                  </label>
                  <input
                    id="capital"
                    type="text"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse du siège social <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET
                  </label>
                  <input
                    id="siret"
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Ville d'immatriculation
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="sm:flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="sm:flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Continuer
                </button>
              </div>
            </section>
          )}

          {/* Étape 3 : Représentant légal */}
          {step === 3 && (
            <section aria-labelledby="step3-title">
              <h2 id="step3-title" className="text-2xl font-bold mb-4 sm:mb-6">Représentant légal</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom et prénom <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="representativeName"
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="representativeTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="representativeTitle"
                    type="text"
                    placeholder="ex: Directeur Général"
                    value={formData.representativeTitle}
                    onChange={(e) => setFormData({ ...formData, representativeTitle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                    autoComplete="organization-title"
                  />
                </div>

                <div>
                  <label htmlFor="representativeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <input
                    id="representativeEmail"
                    type="email"
                    value={formData.representativeEmail}
                    onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                    autoComplete="email"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="representativePhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    id="representativePhone"
                    type="tel"
                    value={formData.representativePhone}
                    onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="sm:flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="sm:flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Continuer
                </button>
              </div>
            </section>
          )}

          {/* Étape 4 : Type d'abonnement */}
          {step === 4 && (
            <section aria-labelledby="step4-title">
              <h2 id="step4-title" className="text-2xl font-bold mb-4 sm:mb-6">Choix de l'abonnement</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'abonnement <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <select
                    id="subscriptionType"
                    value={formData.subscriptionType}
                    onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
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
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Durée d'engagement <span className="text-red-500" aria-label="obligatoire">*</span>
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    aria-required="true"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="12">1 an - Tarif plein</option>
                    <option value="36">3 ans - Remise 3%</option>
                    <option value="48">4 ans - Remise 5%</option>
                    <option value="60">5 ans - Remise 7%</option>
                  </select>
                </div>

                {/* Options */}
                <fieldset className="border-t pt-4">
                  <legend className="font-medium mb-3 text-gray-900">Options (facultatif)</legend>
                  <div className="space-y-3">
                    {formData.subscriptionType === 'industriel' && (
                      <div className="flex items-start">
                        <input
                          id="option-afretIA"
                          type="checkbox"
                          checked={formData.options.afretIA}
                          onChange={(e) => setFormData({
                            ...formData,
                            options: { ...formData.options, afretIA: e.target.checked }
                          })}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="option-afretIA" className="ml-3 text-sm sm:text-base text-gray-700">
                          Afret IA Premium (+200€/mois)
                        </label>
                      </div>
                    )}
                    <div className="flex items-start">
                      <input
                        id="option-sms"
                        type="checkbox"
                        checked={formData.options.sms}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, sms: e.target.checked }
                        })}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="option-sms" className="ml-3 text-sm sm:text-base text-gray-700">
                        Envoi SMS (0.07€/SMS)
                      </label>
                    </div>
                    <div className="flex items-start">
                      <input
                        id="option-telematics"
                        type="checkbox"
                        checked={formData.options.telematics}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, telematics: e.target.checked }
                        })}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="option-telematics" className="ml-3 text-sm sm:text-base text-gray-700">
                        Connexion télématique (19€/camion/mois)
                      </label>
                    </div>
                    <div className="flex items-start">
                      <input
                        id="option-thirdParty"
                        type="checkbox"
                        checked={formData.options.thirdPartyConnection}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, thirdPartyConnection: e.target.checked }
                        })}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="option-thirdParty" className="ml-3 text-sm sm:text-base text-gray-700">
                        Connexion outil tiers (89€/mois)
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="sm:flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!formData.subscriptionType || !formData.duration}
                  className="sm:flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Continuer
                </button>
              </div>
            </section>
          )}

          {/* Étape 5 : Paiement & Validation */}
          {step === 5 && (
            <section aria-labelledby="step5-title">
              <h2 id="step5-title" className="text-2xl font-bold mb-4 sm:mb-6">Finalisation</h2>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6" role="region" aria-label="Récapitulatif de votre inscription">
                <h3 className="font-bold mb-4 text-lg">Récapitulatif</h3>
                <dl className="space-y-2 text-sm sm:text-base">
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">Entreprise :</dt>
                    <dd className="text-gray-900">{formData.companyName}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">TVA :</dt>
                    <dd className="text-gray-900">{formData.vatNumber}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">Représentant :</dt>
                    <dd className="text-gray-900">{formData.representativeName}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">Email :</dt>
                    <dd className="text-gray-900">{formData.representativeEmail}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">Abonnement :</dt>
                    <dd className="text-gray-900">{formData.subscriptionType}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-gray-700 min-w-[140px]">Durée :</dt>
                    <dd className="text-gray-900">{formData.duration} mois</dd>
                  </div>
                </dl>
              </div>

              <div className="mb-6">
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="card">Carte bancaire (prélèvement automatique)</option>
                  <option value="sepa">Prélèvement SEPA</option>
                  <option value="transfer">Virement bancaire</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-start">
                  <input
                    id="terms-accept"
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                    required
                    aria-required="true"
                  />
                  <label htmlFor="terms-accept" className="ml-3 text-sm text-gray-600">
                    J'accepte les conditions générales de vente et autorise SYMPHONI.A
                    à générer et m'envoyer le contrat d'abonnement pour signature électronique.
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="sm:flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={submitOnboarding}
                  disabled={loading}
                  className="sm:flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Génération du contrat...
                    </span>
                  ) : 'Générer le contrat'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

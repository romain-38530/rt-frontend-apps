'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataURL, setSignatureDataURL] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);

  // Charger le contrat
  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';
      const response = await fetch(
        `${apiUrl}/api/onboarding/contract/${params.contractId}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setContract({ pdfUrl: url, contractId: params.contractId });
      }
    } catch (error) {
      console.error('Erreur chargement contrat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestion signature tactile et souris
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();

    let x, y;
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSignatureDataURL(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataURL('');
  };

  const signContract = async () => {
    if (!signatureDataURL) {
      alert('Veuillez signer avant de valider');
      return;
    }

    if (!termsAccepted || !legalConfirmed) {
      alert('Veuillez accepter les conditions avant de signer');
      return;
    }

    setSigning(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';
      const response = await fetch(
        `${apiUrl}/api/onboarding/sign/${params.contractId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature: signatureDataURL,
            signedBy: 'Client',
            signedAt: new Date().toISOString()
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push('/onboarding/activated');
      } else {
        alert('Erreur lors de la signature');
      }
    } catch (error) {
      console.error('Erreur signature:', error);
      alert('Erreur de connexion');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600">Chargement du contrat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête accessible */}
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Signature électronique du contrat
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Veuillez lire et signer votre contrat d'abonnement
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Visualisation PDF */}
          <section className="bg-white rounded-lg shadow-lg p-4 sm:p-6" aria-labelledby="contract-title">
            <h2 id="contract-title" className="text-lg sm:text-xl font-bold mb-4">Contrat d'abonnement</h2>
            {contract?.pdfUrl && (
              <iframe
                src={contract.pdfUrl}
                className="w-full h-[400px] sm:h-[600px] border rounded"
                title="Contrat PDF - Lisez attentivement avant de signer"
                aria-label="Document PDF du contrat d'abonnement"
              />
            )}
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500" role="note">
              <p className="text-xs sm:text-sm text-blue-900 flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Prenez le temps de lire attentivement tout le contrat avant de signer.
              </p>
            </div>
          </section>

          {/* Zone de signature */}
          <section className="bg-white rounded-lg shadow-lg p-4 sm:p-6" aria-labelledby="signature-title">
            <h2 id="signature-title" className="text-lg sm:text-xl font-bold mb-4">Votre signature</h2>

            <div className="space-y-6">
              {/* Canvas de signature accessible */}
              <div>
                <label htmlFor="signature-canvas" className="block text-sm font-medium text-gray-700 mb-2">
                  Signez dans le cadre ci-dessous
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <canvas
                    id="signature-canvas"
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full bg-white cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    aria-label="Zone de signature tactile - Dessinez votre signature avec votre souris ou votre doigt"
                    role="img"
                    tabIndex={0}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline"
                  aria-label="Effacer la signature et recommencer"
                >
                  Effacer la signature
                </button>
              </div>

              {/* Informations légales */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Valeur juridique</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Votre signature électronique a la même valeur juridique qu'une signature
                  manuscrite conformément au règlement eIDAS (UE) n°910/2014.
                </p>
              </div>

              {/* Informations signature */}
              <dl className="space-y-2">
                <div className="flex items-center text-xs sm:text-sm">
                  <dt className="text-gray-600 w-28 sm:w-32 flex-shrink-0">Date :</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date().toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </dd>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <dt className="text-gray-600 w-28 sm:w-32 flex-shrink-0">Heure :</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date().toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </dd>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <dt className="text-gray-600 w-28 sm:w-32 flex-shrink-0">ID Contrat :</dt>
                  <dd className="font-mono text-xs text-gray-900 break-all">
                    {params.contractId}
                  </dd>
                </div>
              </dl>

              {/* Checkbox de confirmation accessibles */}
              <fieldset className="space-y-3" aria-required="true">
                <legend className="sr-only">Confirmations requises pour la signature</legend>

                <div className="flex items-start">
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                    aria-required="true"
                  />
                  <label htmlFor="terms-checkbox" className="ml-3 text-xs sm:text-sm text-gray-700">
                    J'ai lu et j'accepte les termes et conditions du contrat d'abonnement RT Technologie
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="legal-checkbox"
                    type="checkbox"
                    checked={legalConfirmed}
                    onChange={(e) => setLegalConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                    aria-required="true"
                  />
                  <label htmlFor="legal-checkbox" className="ml-3 text-xs sm:text-sm text-gray-700">
                    Je confirme que ma signature électronique engage juridiquement mon entreprise
                  </label>
                </div>
              </fieldset>

              {/* Bouton de validation */}
              <button
                onClick={signContract}
                disabled={!signatureDataURL || !termsAccepted || !legalConfirmed || signing}
                className="w-full bg-indigo-600 text-white py-3 sm:py-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                aria-busy={signing}
                aria-label={signing ? "Signature en cours, veuillez patienter" : "Valider et signer le contrat"}
              >
                {signing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signature en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Valider et signer le contrat
                  </>
                )}
              </button>

              {/* Sécurité */}
              <div className="flex items-start gap-2 text-xs text-gray-500" role="contentinfo">
                <svg className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Connexion sécurisée SSL - Horodatage certifié - Conformité RGPD
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

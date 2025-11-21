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

  // Gestion signature tactile
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
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
            signedBy: 'Client', // À récupérer du contexte
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du contrat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signature électronique du contrat
          </h1>
          <p className="text-gray-600">
            Veuillez lire et signer votre contrat d'abonnement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visualisation PDF */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Contrat d'abonnement</h2>
            {contract?.pdfUrl && (
              <iframe
                src={contract.pdfUrl}
                className="w-full h-[600px] border rounded"
                title="Contrat PDF"
              />
            )}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                ℹ️ Prenez le temps de lire attentivement tout le contrat avant de signer.
              </p>
            </div>
          </div>

          {/* Zone de signature */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Votre signature</h2>

            <div className="space-y-6">
              {/* Canvas de signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signez dans le cadre ci-dessous
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full bg-white cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Effacer la signature
                </button>
              </div>

              {/* Informations légales */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Valeur juridique</h3>
                <p className="text-sm text-gray-600">
                  Votre signature électronique a la même valeur juridique qu'une signature
                  manuscrite conformément au règlement eIDAS (UE) n°910/2014.
                </p>
              </div>

              {/* Informations signature */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Date :</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Heure :</span>
                  <span className="font-medium">
                    {new Date().toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">ID Contrat :</span>
                  <span className="font-mono text-xs">
                    {params.contractId}
                  </span>
                </div>
              </div>

              {/* Checkbox de confirmation */}
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    className="mt-1 mr-3"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    J'ai lu et j'accepte les termes et conditions du contrat d'abonnement RT Technologie
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    className="mt-1 mr-3"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Je confirme que ma signature électronique engage juridiquement mon entreprise
                  </span>
                </label>
              </div>

              {/* Bouton de validation */}
              <button
                onClick={signContract}
                disabled={!signatureDataURL || signing}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Signature en cours...
                  </>
                ) : (
                  <>
                    ✍️ Valider et signer le contrat
                  </>
                )}
              </button>

              {/* Sécurité */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Connexion sécurisée SSL • Horodatage certifié • Conformité RGPD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

function OnboardingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const email = searchParams.get('email');

  useEffect(() => {
    // Confetti effect (optionnel)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600" />

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-200 rounded-full opacity-20 blur-3xl" />

          <div className="relative">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <CheckCircle className="text-white" size={56} />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Félicitations !
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Votre compte SYMPHONI.A a été créé avec succès
            </p>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 justify-center mb-4">
                <Mail className="text-orange-600" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Vérifiez votre email</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Un email de confirmation a été envoyé à :
              </p>
              <p className="text-orange-600 font-bold text-lg">
                {email || 'votre adresse email'}
              </p>
            </div>

            {/* Steps */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prochaines étapes :</h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span className="text-gray-700">
                    Vérifiez votre boîte de réception et cliquez sur le lien d'activation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span className="text-gray-700">
                    Connectez-vous à votre compte SYMPHONI.A
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span className="text-gray-700">
                    Commencez à optimiser votre logistique !
                  </span>
                </li>
              </ol>
            </div>

            {/* Request ID */}
            {requestId && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8">
                <p className="text-sm text-gray-700">
                  <strong>ID de demande :</strong> {requestId}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Conservez cet identifiant pour toute correspondance avec notre support
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Se connecter
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/"
                className="block w-full px-8 py-4 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">Vous n'avez pas reçu l'email ?</p>
          <button className="text-orange-600 hover:text-orange-700 font-semibold">
            Renvoyer l'email de confirmation
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-semibold">
              Contactez notre support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingSuccessContent />
    </Suspense>
  );
}

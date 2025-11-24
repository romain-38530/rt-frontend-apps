import { useRouter } from 'next/navigation';
import type { AccountType } from '@/types/account';
import { getAccountTypeInfo } from '@/types/account';

interface UpgradeCallToActionProps {
  userId: string;
  currentType: AccountType;
  targetType?: AccountType; // Default to 'industry'
  variant?: 'banner' | 'card' | 'minimal';
}

export default function UpgradeCallToAction({
  userId,
  currentType,
  targetType = 'industry',
  variant = 'card'
}: UpgradeCallToActionProps) {
  const router = useRouter();
  const targetTypeInfo = getAccountTypeInfo(targetType);

  const handleUpgrade = () => {
    router.push(`/account/upgrade?userId=${userId}&fromType=${currentType}`);
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-4">🚀</span>
            <div>
              <h3 className="font-bold text-lg">Évoluez vers un compte {targetTypeInfo.displayName}</h3>
              <p className="text-sm text-orange-100">
                Débloquez toutes les fonctionnalités et générez vos propres commandes
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-6 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Évoluer maintenant
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Besoin de plus ?</span> Évoluez vers {targetTypeInfo.displayName}
          </p>
          <button
            onClick={handleUpgrade}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            En savoir plus
          </button>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🚀</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Passez à la vitesse supérieure !
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Évoluez vers un compte <span className="font-semibold">{targetTypeInfo.displayName}</span> et
          générez vos propres commandes de transport
        </p>
      </div>

      {/* Benefits */}
      <ul className="space-y-2 mb-6">
        {targetTypeInfo.features.slice(0, 3).map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleUpgrade}
        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
      >
        Évoluer mon compte
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        Conservez toutes vos données et historique
      </p>
    </div>
  );
}

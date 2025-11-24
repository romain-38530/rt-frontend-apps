import type { AccountTypeInfo } from '@/types/account';

interface AccountTypeCardProps {
  accountType: AccountTypeInfo;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showFeatures?: number; // Number of features to show
  compact?: boolean;
}

export default function AccountTypeCard({
  accountType,
  selected = false,
  onClick,
  disabled = false,
  showFeatures = 3,
  compact = false
}: AccountTypeCardProps) {
  const isClickable = onClick && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-200 text-left
        ${selected
          ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : isClickable ? 'cursor-pointer' : ''}
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}

      {/* Icon */}
      <div className={`text-center ${compact ? 'text-4xl mb-2' : 'text-5xl mb-4'}`}>
        {accountType.icon}
      </div>

      {/* Title */}
      <h3 className={`font-bold text-gray-900 text-center ${compact ? 'text-lg mb-1' : 'text-xl mb-2'}`}>
        {accountType.displayName}
      </h3>

      {/* Description */}
      {!compact && (
        <p className="text-sm text-gray-600 mb-4 text-center min-h-[3rem]">
          {accountType.description}
        </p>
      )}

      {/* Features List */}
      <ul className={`space-y-2 ${compact ? 'mb-2' : 'mb-4'}`}>
        {accountType.features.slice(0, showFeatures).map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Badge for order generation capability */}
      {accountType.canGenerateOrders && (
        <div className={`pt-4 border-t border-gray-200 ${compact ? 'mt-2' : 'mt-4'}`}>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Peut générer des commandes
          </span>
        </div>
      )}

      {/* Non-creatable badge */}
      {!accountType.isDirectlyCreatable && (
        <div className={`pt-4 border-t border-gray-200 ${compact ? 'mt-2' : 'mt-4'}`}>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Accessible par évolution
          </span>
        </div>
      )}
    </button>
  );
}

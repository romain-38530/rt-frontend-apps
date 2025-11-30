import React from 'react';
import { AlertCircle, FileX, Shield, Package, Clock, Hand, CheckCircle } from 'lucide-react';

export interface Block {
  _id?: string;
  blockId?: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late' | 'manual';
  reason: string;
  details?: any;
  blockedAt: string;
  blockedBy: string;
  unlockedAt?: string;
  unlockedBy?: string;
  active: boolean;
}

interface BlockCardProps {
  block: Block;
  onUnblock?: (block: Block) => void;
  showUnblockButton?: boolean;
  compact?: boolean;
}

const blockConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  missing_documents: {
    icon: FileX,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Documents manquants',
  },
  vigilance: {
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Vigilance non conforme',
  },
  pallets: {
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Dette palettes',
  },
  late: {
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Livraison en retard',
  },
  manual: {
    icon: Hand,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Blocage manuel',
  },
};

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onUnblock,
  showUnblockButton = true,
  compact = false,
}) => {
  const config = blockConfig[block.type] || blockConfig.manual;
  const Icon = config.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        {!block.active && (
          <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${block.active ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{config.label}</h4>
              {block.active ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  Actif
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Levé
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{block.reason}</p>

            {block.details && (
              <div className="mt-2 text-sm text-gray-500">
                {block.details.missingDocs && (
                  <p>Documents: {block.details.missingDocs.join(', ')}</p>
                )}
                {block.details.expiredDocs && (
                  <p>
                    Docs expirés:{' '}
                    {block.details.expiredDocs.map((d: any) => d.type).join(', ')}
                  </p>
                )}
                {block.details.palletDebt !== undefined && (
                  <p>Dette: {block.details.palletDebt} palettes</p>
                )}
                {block.details.delayMinutes !== undefined && (
                  <p>Retard: {block.details.delayMinutes} minutes</p>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              <p>Bloqué le {formatDate(block.blockedAt)} par {block.blockedBy}</p>
              {block.unlockedAt && (
                <p className="text-green-600">
                  Levé le {formatDate(block.unlockedAt)} par {block.unlockedBy}
                </p>
              )}
            </div>
          </div>
        </div>

        {showUnblockButton && block.active && onUnblock && (
          <button
            onClick={() => onUnblock(block)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Lever le blocage
          </button>
        )}
      </div>
    </div>
  );
};

export default BlockCard;

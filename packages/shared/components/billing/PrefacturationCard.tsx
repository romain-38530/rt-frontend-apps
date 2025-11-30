import React, { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Send,
} from 'lucide-react';
import { BillingStatusBadge, BillingStatus } from './BillingStatusBadge';
import { DiscrepancyCard, Discrepancy } from './DiscrepancyCard';
import { BlockCard, Block } from './BlockCard';

export interface PrefacturationData {
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  transporterName?: string;
  clientId: string;
  clientName?: string;
  status: BillingStatus;
  orderData: {
    pickupDate?: string;
    deliveryDate?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    distance?: number;
    vehicleType?: string;
    vehiclePlate?: string;
  };
  options: {
    adr?: boolean;
    hayon?: boolean;
    express?: boolean;
    frigo?: boolean;
    palettesEchange?: number;
    weekend?: boolean;
    nuit?: boolean;
  };
  waitingTime?: {
    total?: number;
    billable?: number;
  };
  calculation: {
    basePrice: number;
    distancePrice: number;
    optionsPrice: number;
    waitingTimePrice: number;
    penalties: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
  calculationDetails?: {
    item: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  discrepancies: Discrepancy[];
  blocks: Block[];
  carrierInvoice?: {
    invoiceNumber?: string;
    totalHT?: number;
    uploadedAt?: string;
  };
  carrierValidation?: {
    status: string;
    timeoutAt?: string;
  };
  finalInvoice?: {
    invoiceNumber?: string;
    generatedAt?: string;
  };
  createdAt: string;
}

interface PrefacturationCardProps {
  prefacturation: PrefacturationData;
  userRole?: 'industry' | 'transporter' | 'admin';
  onViewOrder?: (orderId: string) => void;
  onDownloadPdf?: (prefacturationId: string) => void;
  onFinalize?: (prefacturationId: string) => void;
  onExportERP?: (prefacturationId: string) => void;
  onDiscrepancyAction?: (prefacturationId: string, discrepancyIndex: number, action: 'accept' | 'contest' | 'resolve') => void;
  onUnblock?: (prefacturationId: string, block: Block) => void;
  defaultExpanded?: boolean;
}

export const PrefacturationCard: React.FC<PrefacturationCardProps> = ({
  prefacturation,
  userRole = 'industry',
  onViewOrder,
  onDownloadPdf,
  onFinalize,
  onExportERP,
  onDiscrepancyAction,
  onUnblock,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasOpenDiscrepancies = prefacturation.discrepancies.some(d => d.status === 'detected');
  const hasActiveBlocks = prefacturation.blocks.some(b => b.active);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysUntilTimeout = () => {
    if (!prefacturation.carrierValidation?.timeoutAt) return null;
    const timeout = new Date(prefacturation.carrierValidation.timeoutAt);
    const now = new Date();
    const diffTime = timeout.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilTimeout = getDaysUntilTimeout();

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header - Always visible */}
      <div
        className="px-6 py-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasActiveBlocks
                  ? 'bg-red-100'
                  : hasOpenDiscrepancies
                  ? 'bg-yellow-100'
                  : 'bg-green-100'
              }`}
            >
              {hasActiveBlocks ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : hasOpenDiscrepancies ? (
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              ) : (
                <FileText className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{prefacturation.orderId}</span>
                <BillingStatusBadge status={prefacturation.status} />
              </div>
              <p className="text-gray-600 text-sm">
                {userRole === 'transporter'
                  ? prefacturation.clientName || prefacturation.clientId
                  : prefacturation.transporterName || prefacturation.transporterId}
              </p>
              <p className="text-gray-500 text-xs">
                Créée le {formatDate(prefacturation.createdAt)}
                {prefacturation.orderData.distance && (
                  <span className="ml-2">• {prefacturation.orderData.distance} km</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Tags */}
            <div className="flex gap-2">
              {hasOpenDiscrepancies && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {prefacturation.discrepancies.filter(d => d.status === 'detected').length} écart(s)
                </span>
              )}
              {hasActiveBlocks && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {prefacturation.blocks.filter(b => b.active).length} blocage(s)
                </span>
              )}
              {daysUntilTimeout !== null && daysUntilTimeout <= 3 && daysUntilTimeout > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Timeout: {daysUntilTimeout}j
                </span>
              )}
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(prefacturation.calculation.totalHT)}</p>
              <p className="text-sm text-gray-500">HT • {formatCurrency(prefacturation.calculation.totalTTC)} TTC</p>
            </div>

            {/* Expand icon */}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-6 py-4 space-y-6">
          {/* Calculation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Détail du calcul</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Distance</p>
                <p className="font-medium">{prefacturation.orderData.distance || 0} km</p>
              </div>
              <div>
                <p className="text-gray-500">Type véhicule</p>
                <p className="font-medium">{prefacturation.orderData.vehicleType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Prix de base</p>
                <p className="font-medium">{formatCurrency(prefacturation.calculation.basePrice + prefacturation.calculation.distancePrice)}</p>
              </div>
              <div>
                <p className="text-gray-500">Temps d'attente</p>
                <p className="font-medium">
                  {prefacturation.waitingTime?.billable || 0} min
                  {prefacturation.calculation.waitingTimePrice > 0 && (
                    <span className="text-gray-500 ml-1">
                      ({formatCurrency(prefacturation.calculation.waitingTimePrice)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-gray-500 text-sm mb-2">Options appliquées:</p>
              <div className="flex flex-wrap gap-2">
                {prefacturation.options.adr && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">ADR</span>
                )}
                {prefacturation.options.hayon && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Hayon</span>
                )}
                {prefacturation.options.express && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Express</span>
                )}
                {prefacturation.options.frigo && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Frigo</span>
                )}
                {prefacturation.options.weekend && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Weekend</span>
                )}
                {prefacturation.options.nuit && (
                  <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded">Nuit</span>
                )}
                {(prefacturation.options.palettesEchange || 0) > 0 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                    {prefacturation.options.palettesEchange} palettes
                  </span>
                )}
                {!prefacturation.options.adr &&
                  !prefacturation.options.hayon &&
                  !prefacturation.options.express &&
                  !prefacturation.options.frigo &&
                  !prefacturation.options.weekend &&
                  !prefacturation.options.nuit &&
                  (prefacturation.options.palettesEchange || 0) === 0 && (
                    <span className="text-gray-500 text-sm">Aucune option</span>
                  )}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-3 pt-3 border-t space-y-1">
              {prefacturation.calculation.optionsPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Options</span>
                  <span>{formatCurrency(prefacturation.calculation.optionsPrice)}</span>
                </div>
              )}
              {prefacturation.calculation.penalties > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Pénalités</span>
                  <span>-{formatCurrency(prefacturation.calculation.penalties)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total HT</span>
                <span>{formatCurrency(prefacturation.calculation.totalHT)}</span>
              </div>
            </div>
          </div>

          {/* Discrepancies */}
          {prefacturation.discrepancies.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Écarts détectés ({prefacturation.discrepancies.length})
              </h3>
              <div className="space-y-3">
                {prefacturation.discrepancies.map((discrepancy, index) => (
                  <DiscrepancyCard
                    key={index}
                    discrepancy={discrepancy}
                    index={index}
                    userRole={userRole}
                    onAccept={
                      onDiscrepancyAction
                        ? (i) => onDiscrepancyAction(prefacturation.prefacturationId, i, 'accept')
                        : undefined
                    }
                    onContest={
                      onDiscrepancyAction
                        ? (i) => onDiscrepancyAction(prefacturation.prefacturationId, i, 'contest')
                        : undefined
                    }
                    onResolve={
                      onDiscrepancyAction
                        ? (i) => onDiscrepancyAction(prefacturation.prefacturationId, i, 'resolve')
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Blocks */}
          {prefacturation.blocks.filter(b => b.active).length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                Blocages actifs ({prefacturation.blocks.filter(b => b.active).length})
              </h3>
              <div className="space-y-3">
                {prefacturation.blocks
                  .filter(b => b.active)
                  .map((block, index) => (
                    <BlockCard
                      key={index}
                      block={block}
                      onUnblock={
                        onUnblock
                          ? (b) => onUnblock(prefacturation.prefacturationId, b)
                          : undefined
                      }
                      showUnblockButton={userRole === 'admin' || userRole === 'industry'}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Carrier Invoice Info */}
          {prefacturation.carrierInvoice && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Facture transporteur
              </h3>
              <div className="text-sm">
                <p>N° {prefacturation.carrierInvoice.invoiceNumber || 'N/A'}</p>
                <p>Montant: {formatCurrency(prefacturation.carrierInvoice.totalHT || 0)} HT</p>
                {prefacturation.carrierInvoice.uploadedAt && (
                  <p className="text-gray-600">
                    Uploadée le {formatDate(prefacturation.carrierInvoice.uploadedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Final Invoice Info */}
          {prefacturation.finalInvoice && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Facture finale
              </h3>
              <div className="text-sm">
                <p>N° {prefacturation.finalInvoice.invoiceNumber}</p>
                {prefacturation.finalInvoice.generatedAt && (
                  <p className="text-gray-600">
                    Générée le {formatDate(prefacturation.finalInvoice.generatedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            {onViewOrder && (
              <button
                onClick={() => onViewOrder(prefacturation.orderId)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                Voir l'ordre
              </button>
            )}
            {onDownloadPdf && prefacturation.finalInvoice && (
              <button
                onClick={() => onDownloadPdf(prefacturation.prefacturationId)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
            )}
            {onFinalize &&
              prefacturation.status === 'validated' &&
              !hasActiveBlocks &&
              (userRole === 'industry' || userRole === 'admin') && (
                <button
                  onClick={() => onFinalize(prefacturation.prefacturationId)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finaliser
                </button>
              )}
            {onExportERP &&
              prefacturation.status === 'finalized' &&
              (userRole === 'industry' || userRole === 'admin') && (
                <button
                  onClick={() => onExportERP(prefacturation.prefacturationId)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                  Export ERP
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrefacturationCard;

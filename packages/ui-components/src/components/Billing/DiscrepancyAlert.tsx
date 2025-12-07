/**
 * DiscrepancyAlert - Alerte de détection d'écarts tarifaires
 * Module Préfacturation & Facturation Transport
 */

import React from 'react';

export interface DiscrepancyDetail {
  id: string;
  type: 'price' | 'quantity' | 'surcharge' | 'discount' | 'tax';
  description: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  differencePercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DiscrepancyAlertProps {
  prefacturationId: string;
  orderRef: string;
  carrierName: string;
  carrierInvoiceRef?: string;
  totalExpected: number;
  totalInvoiced: number;
  discrepancies: DiscrepancyDetail[];
  onAccept?: (id: string) => void;
  onDispute?: (id: string, details: DiscrepancyDetail[]) => void;
  onRequestJustification?: (id: string) => void;
  tolerancePercent?: number;
  showDetails?: boolean;
}

const severityConfig: Record<DiscrepancyDetail['severity'], { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: 'Faible', color: '#059669', bgColor: '#D1FAE5', borderColor: '#10B981' },
  medium: { label: 'Moyen', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
  high: { label: 'Élevé', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#EF4444' },
  critical: { label: 'Critique', color: '#7C2D12', bgColor: '#FEE2E2', borderColor: '#DC2626' },
};

const typeLabels: Record<DiscrepancyDetail['type'], string> = {
  price: 'Prix unitaire',
  quantity: 'Quantité',
  surcharge: 'Surcharge',
  discount: 'Remise',
  tax: 'TVA',
};

export const DiscrepancyAlert: React.FC<DiscrepancyAlertProps> = ({
  prefacturationId,
  orderRef,
  carrierName,
  carrierInvoiceRef,
  totalExpected,
  totalInvoiced,
  discrepancies,
  onAccept,
  onDispute,
  onRequestJustification,
  tolerancePercent = 2,
  showDetails = true,
}) => {
  const totalDifference = totalInvoiced - totalExpected;
  const differencePercent = Math.abs((totalDifference / totalExpected) * 100);
  const isWithinTolerance = differencePercent <= tolerancePercent;

  const maxSeverity = discrepancies.reduce((max, d) => {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    return severityOrder.indexOf(d.severity) > severityOrder.indexOf(max) ? d.severity : max;
  }, 'low' as DiscrepancyDetail['severity']);

  const alertConfig = severityConfig[maxSeverity];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div style={{
      border: `2px solid ${alertConfig.borderColor}`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: alertConfig.bgColor,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: alertConfig.borderColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: alertConfig.color }}>
              Écart tarifaire détecté
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
              Commande {orderRef} - {carrierName}
            </p>
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          background: alertConfig.borderColor,
          color: 'white',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {alertConfig.label}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        padding: '20px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
            Montant calculé (TMS)
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            {formatCurrency(totalExpected)}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
            Montant facturé
            {carrierInvoiceRef && <span style={{ fontWeight: 'normal' }}> ({carrierInvoiceRef})</span>}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            {formatCurrency(totalInvoiced)}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
            Écart
          </p>
          <p style={{
            margin: '4px 0 0',
            fontSize: '20px',
            fontWeight: 600,
            color: totalDifference > 0 ? '#DC2626' : '#059669',
          }}>
            {formatCurrency(totalDifference)}
            <span style={{ fontSize: '14px', marginLeft: '8px' }}>
              ({formatPercent(totalDifference / totalExpected * 100)})
            </span>
          </p>
        </div>
      </div>

      {/* Tolerance indicator */}
      <div style={{
        padding: '12px 20px',
        background: isWithinTolerance ? '#D1FAE5' : '#FEE2E2',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '16px' }}>{isWithinTolerance ? '✅' : '❌'}</span>
        <span style={{
          fontSize: '14px',
          color: isWithinTolerance ? '#059669' : '#DC2626',
          fontWeight: 500,
        }}>
          {isWithinTolerance
            ? `Dans la tolérance (${tolerancePercent}%)`
            : `Hors tolérance (>${tolerancePercent}%)`
          }
        </span>
      </div>

      {/* Details */}
      {showDetails && discrepancies.length > 0 && (
        <div style={{ padding: '20px', background: '#F9FAFB' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Détail des écarts ({discrepancies.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {discrepancies.map((discrepancy) => {
              const config = severityConfig[discrepancy.severity];
              return (
                <div
                  key={discrepancy.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 100px 100px 80px',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    border: `1px solid ${config.borderColor}`,
                  }}
                >
                  <span style={{
                    padding: '4px 8px',
                    background: '#E5E7EB',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {typeLabels[discrepancy.type]}
                  </span>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {discrepancy.description}
                  </span>
                  <span style={{ fontSize: '14px', textAlign: 'right' }}>
                    <span style={{ color: '#6B7280' }}>Attendu:</span>{' '}
                    {formatCurrency(discrepancy.expectedValue)}
                  </span>
                  <span style={{ fontSize: '14px', textAlign: 'right' }}>
                    <span style={{ color: '#6B7280' }}>Facturé:</span>{' '}
                    {formatCurrency(discrepancy.actualValue)}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'right',
                    color: discrepancy.difference > 0 ? '#DC2626' : '#059669',
                  }}>
                    {formatCurrency(discrepancy.difference)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #E5E7EB',
      }}>
        {onRequestJustification && (
          <button
            onClick={() => onRequestJustification(prefacturationId)}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Demander justificatif
          </button>
        )}
        {onAccept && isWithinTolerance && (
          <button
            onClick={() => onAccept(prefacturationId)}
            style={{
              padding: '10px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Accepter l'écart
          </button>
        )}
        {onDispute && (
          <button
            onClick={() => onDispute(prefacturationId, discrepancies)}
            style={{
              padding: '10px 20px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            Contester
          </button>
        )}
      </div>
    </div>
  );
};

export default DiscrepancyAlert;

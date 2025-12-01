/**
 * BlockingStatus - Affichage des blocages automatiques
 * Module Préfacturation & Facturation Transport
 * Intègre avec les APIs backend existantes
 */

import React from 'react';

export type BlockingType = 'documents' | 'vigilance' | 'palettes' | 'delay' | 'dispute' | 'payment';

export interface Blocking {
  id: string;
  type: BlockingType;
  reason: string;
  severity: 'warning' | 'blocking';
  createdAt: Date;
  resolvedAt?: Date;
  autoResolvable: boolean;
  details?: Record<string, unknown>;
}

export interface BlockingStatusProps {
  carrierId: string;
  carrierName: string;
  blockings: Blocking[];
  onResolve?: (blockingId: string) => void;
  onViewDetails?: (blocking: Blocking) => void;
  compact?: boolean;
}

const blockingConfig: Record<BlockingType, { icon: string; label: string; color: string }> = {
  documents: { icon: '📄', label: 'Documents manquants', color: '#F59E0B' },
  vigilance: { icon: '⚠️', label: 'Vigilance (URSSAF/Kbis)', color: '#EF4444' },
  palettes: { icon: '📦', label: 'Solde palettes négatif', color: '#8B5CF6' },
  delay: { icon: '⏰', label: 'Retards récurrents', color: '#F97316' },
  dispute: { icon: '⚡', label: 'Litige en cours', color: '#DC2626' },
  payment: { icon: '💳', label: 'Impayés', color: '#B91C1C' },
};

export const BlockingStatus: React.FC<BlockingStatusProps> = ({
  carrierId,
  carrierName,
  blockings,
  onResolve,
  onViewDetails,
  compact = false,
}) => {
  const activeBlockings = blockings.filter(b => !b.resolvedAt);
  const criticalBlockings = activeBlockings.filter(b => b.severity === 'blocking');
  const warningBlockings = activeBlockings.filter(b => b.severity === 'warning');

  const hasBlockings = criticalBlockings.length > 0;
  const hasWarnings = warningBlockings.length > 0;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {hasBlockings && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: '#FEE2E2',
            color: '#DC2626',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            🚫 {criticalBlockings.length} blocage{criticalBlockings.length > 1 ? 's' : ''}
          </span>
        )}
        {hasWarnings && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: '#FEF3C7',
            color: '#D97706',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            ⚠️ {warningBlockings.length} alerte{warningBlockings.length > 1 ? 's' : ''}
          </span>
        )}
        {!hasBlockings && !hasWarnings && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: '#D1FAE5',
            color: '#059669',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            ✅ RAS
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '12px',
      border: hasBlockings ? '2px solid #EF4444' : hasWarnings ? '2px solid #F59E0B' : '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: hasBlockings ? '#FEE2E2' : hasWarnings ? '#FEF3C7' : '#F9FAFB',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            Statut blocage - {carrierName}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            ID: {carrierId}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: hasBlockings ? '#DC2626' : hasWarnings ? '#F59E0B' : '#10B981',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          {hasBlockings ? '🚫 BLOQUÉ' : hasWarnings ? '⚠️ ATTENTION' : '✅ OK'}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: '#E5E7EB',
      }}>
        <div style={{ padding: '16px', background: 'white', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#DC2626' }}>
            {criticalBlockings.length}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Blocage(s)</p>
        </div>
        <div style={{ padding: '16px', background: 'white', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#F59E0B' }}>
            {warningBlockings.length}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Alerte(s)</p>
        </div>
        <div style={{ padding: '16px', background: 'white', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#10B981' }}>
            {blockings.filter(b => b.resolvedAt).length}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Résolu(s)</p>
        </div>
      </div>

      {/* Blocking details */}
      {activeBlockings.length > 0 && (
        <div style={{ padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Détail des blocages actifs
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeBlockings.map((blocking) => {
              const config = blockingConfig[blocking.type];
              const isCritical = blocking.severity === 'blocking';
              return (
                <div
                  key={blocking.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isCritical ? '#FEF2F2' : '#FFFBEB',
                    borderRadius: '8px',
                    border: `1px solid ${isCritical ? '#FECACA' : '#FDE68A'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{config.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color: config.color }}>
                        {config.label}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                        {blocking.reason}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                        Depuis le {formatDate(blocking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(blocking)}
                        style={{
                          padding: '6px 12px',
                          background: 'white',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Détails
                      </button>
                    )}
                    {onResolve && blocking.autoResolvable && (
                      <button
                        onClick={() => onResolve(blocking.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Résoudre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No blockings message */}
      {activeBlockings.length === 0 && (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#059669',
        }}>
          <span style={{ fontSize: '32px' }}>✅</span>
          <p style={{ margin: '12px 0 0', fontWeight: 500 }}>
            Aucun blocage actif
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
            Ce transporteur peut être payé normalement
          </p>
        </div>
      )}

      {/* Info footer */}
      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        fontSize: '12px',
        color: '#6B7280',
      }}>
        💡 Les blocages sont vérifiés automatiquement à chaque génération de préfacture.
        Un blocage empêche la validation de la facture finale.
      </div>
    </div>
  );
};

export default BlockingStatus;

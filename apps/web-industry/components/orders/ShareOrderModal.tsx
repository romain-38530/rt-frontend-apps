/**
 * Modal de partage de commande avec un logisticien
 * Permet de donner accès à une commande spécifique
 */

import React, { useState, useEffect } from 'react';
import { LogisticianService } from '@rt/utils';
import type {
  Logistician,
  OrderAccess,
  OrderAccessLevel,
  ShareOrderRequest,
} from '@rt/contracts';

interface ShareOrderModalProps {
  orderId: string;
  orderReference?: string;
  isOpen: boolean;
  onClose: () => void;
  onShared?: () => void;
}

const ACCESS_LEVELS: { value: OrderAccessLevel; label: string; description: string }[] = [
  { value: 'view', label: 'Lecture', description: 'Peut consulter la commande' },
  { value: 'edit', label: '\u00c9dition', description: 'Peut modifier la commande' },
  { value: 'sign', label: 'Signature', description: 'Peut signer les documents' },
  { value: 'full', label: 'Complet', description: 'Acc\u00e8s total \u00e0 la commande' },
];

export const ShareOrderModal: React.FC<ShareOrderModalProps> = ({
  orderId,
  orderReference,
  isOpen,
  onClose,
  onShared,
}) => {
  const [logisticians, setLogisticians] = useState<Logistician[]>([]);
  const [currentAccess, setCurrentAccess] = useState<OrderAccess[]>([]);
  const [selectedLogisticians, setSelectedLogisticians] = useState<string[]>([]);
  const [accessLevel, setAccessLevel] = useState<OrderAccessLevel>('view');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, orderId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logisticiansRes, accessRes] = await Promise.all([
        LogisticianService.getLogisticians({ status: ['active'] }),
        LogisticianService.getOrderAccess(orderId),
      ]);
      setLogisticians(logisticiansRes.data || []);
      setCurrentAccess(accessRes || []);
    } catch (err: any) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (selectedLogisticians.length === 0) {
      setError('S\u00e9lectionnez au moins un logisticien');
      return;
    }

    setSharing(true);
    setError(null);

    try {
      const request: ShareOrderRequest = {
        orderId,
        logisticianIds: selectedLogisticians,
        accessLevel,
      };

      await LogisticianService.shareOrder(request);
      setSuccess(true);
      setSelectedLogisticians([]);

      setTimeout(() => {
        onShared?.();
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur lors du partage');
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (logisticianId: string) => {
    if (!confirm('Voulez-vous r\u00e9voquer l\'acc\u00e8s de ce logisticien ?')) return;

    try {
      await LogisticianService.revokeOrderAccess({
        orderId,
        logisticianId,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la r\u00e9vocation');
    }
  };

  const toggleLogistician = (logisticianId: string) => {
    setSelectedLogisticians(prev =>
      prev.includes(logisticianId)
        ? prev.filter(id => id !== logisticianId)
        : [...prev, logisticianId]
    );
  };

  const availableLogisticians = logisticians.filter(
    log => !currentAccess.some(acc => acc.logisticianId === log.logisticianId && !acc.revoked)
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            Partager la commande
          </h2>
          {orderReference && (
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              R\u00e9f\u00e9rence: {orderReference}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: '#64748b' }}>Chargement...</div>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9989;</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e' }}>
              Commande partag\u00e9e avec succ\u00e8s !
            </div>
          </div>
        ) : (
          <>
            {/* Acc\u00e8s actuels */}
            {currentAccess.filter(acc => !acc.revoked).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                  Acc\u00e8s actuels ({currentAccess.filter(acc => !acc.revoked).length})
                </h3>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  {currentAccess.filter(acc => !acc.revoked).map((access) => {
                    const log = logisticians.find(l => l.logisticianId === access.logisticianId);
                    return (
                      <div key={access.accessId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #e2e8f0',
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {log?.companyName || 'Logisticien'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {ACCESS_LEVELS.find(l => l.value === access.accessLevel)?.label || access.accessLevel}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(access.logisticianId)}
                          style={{
                            padding: '4px 12px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          R\u00e9voquer
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nouveau partage */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                Ajouter un acc\u00e8s
              </h3>

              {availableLogisticians.length === 0 ? (
                <div style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#64748b',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#128100;</div>
                  <div>Aucun logisticien disponible</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    Invitez des logisticiens depuis la page de gestion
                  </div>
                </div>
              ) : (
                <>
                  {/* Liste des logisticiens */}
                  <div style={{
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                    {availableLogisticians.map((log) => (
                      <label key={log.logisticianId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        background: selectedLogisticians.includes(log.logisticianId) ? '#dbeafe' : 'white',
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedLogisticians.includes(log.logisticianId)}
                          onChange={() => toggleLogistician(log.logisticianId)}
                          style={{ marginRight: '12px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{log.companyName}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{log.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Niveau d'acc\u00e8s */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                      Niveau d'acc\u00e8s
                    </label>
                    <select
                      value={accessLevel}
                      onChange={(e) => setAccessLevel(e.target.value as OrderAccessLevel)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                      }}
                    >
                      {ACCESS_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                color: '#ef4444',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
              {availableLogisticians.length > 0 && (
                <button
                  onClick={handleShare}
                  disabled={sharing || selectedLogisticians.length === 0}
                  style={{
                    padding: '12px 24px',
                    background: sharing || selectedLogisticians.length === 0
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: sharing || selectedLogisticians.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sharing ? 'Partage...' : `Partager (${selectedLogisticians.length})`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareOrderModal;

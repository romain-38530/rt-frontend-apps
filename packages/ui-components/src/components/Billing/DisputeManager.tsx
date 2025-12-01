/**
 * DisputeManager - Gestion des contestations transporteur
 * Module Préfacturation & Facturation Transport
 * Intègre avec les APIs backend existantes
 */

import React, { useState } from 'react';

export interface DisputeMessage {
  id: string;
  author: string;
  authorType: 'carrier' | 'industry' | 'system';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface Dispute {
  id: string;
  prefacturationId: string;
  orderRef: string;
  carrierName: string;
  carrierId: string;
  status: 'open' | 'pending_response' | 'under_review' | 'resolved' | 'rejected';
  reason: string;
  category: 'price' | 'quantity' | 'service' | 'damage' | 'delay' | 'other';
  amountDisputed: number;
  messages: DisputeMessage[];
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface DisputeManagerProps {
  disputes: Dispute[];
  currentUserType: 'carrier' | 'industry';
  onCreateDispute?: (prefacturationId: string, reason: string, category: Dispute['category']) => void;
  onAddMessage?: (disputeId: string, message: string, attachments?: File[]) => void;
  onResolve?: (disputeId: string, resolution: string, accepted: boolean) => void;
  onClose?: (disputeId: string) => void;
  selectedDisputeId?: string;
  onSelect?: (dispute: Dispute) => void;
}

const statusConfig: Record<Dispute['status'], { label: string; color: string; bgColor: string }> = {
  open: { label: 'Ouverte', color: '#F59E0B', bgColor: '#FEF3C7' },
  pending_response: { label: 'En attente réponse', color: '#3B82F6', bgColor: '#DBEAFE' },
  under_review: { label: 'En cours d\'analyse', color: '#8B5CF6', bgColor: '#EDE9FE' },
  resolved: { label: 'Résolue', color: '#10B981', bgColor: '#D1FAE5' },
  rejected: { label: 'Rejetée', color: '#EF4444', bgColor: '#FEE2E2' },
};

const categoryLabels: Record<Dispute['category'], string> = {
  price: 'Écart tarifaire',
  quantity: 'Quantité',
  service: 'Service non conforme',
  damage: 'Marchandise endommagée',
  delay: 'Retard',
  other: 'Autre',
};

export const DisputeManager: React.FC<DisputeManagerProps> = ({
  disputes,
  currentUserType,
  onAddMessage,
  onResolve,
  onClose,
  selectedDisputeId,
  onSelect,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [filter, setFilter] = useState<Dispute['status'] | 'all'>('all');

  const selectedDispute = disputes.find(d => d.id === selectedDisputeId);

  const filteredDisputes = disputes.filter(d => filter === 'all' || d.status === filter);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedDispute) {
      onAddMessage?.(selectedDispute.id, newMessage);
      setNewMessage('');
    }
  };

  const handleResolve = (accepted: boolean) => {
    if (selectedDispute) {
      onResolve?.(selectedDispute.id, resolution, accepted);
      setResolution('');
      setShowResolutionForm(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
      {/* Disputes list */}
      <div style={{
        width: '350px',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* List header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            Contestations ({disputes.length})
          </h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Dispute['status'] | 'all')}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
            }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredDisputes.map((dispute) => {
            const status = statusConfig[dispute.status];
            const isSelected = dispute.id === selectedDisputeId;
            return (
              <div
                key={dispute.id}
                onClick={() => onSelect?.(dispute)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  background: isSelected ? '#EEF2FF' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{dispute.orderRef}</span>
                  <span style={{
                    padding: '2px 8px',
                    background: status.bgColor,
                    color: status.color,
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}>
                    {status.label}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6B7280' }}>
                  {dispute.carrierName}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 6px',
                    background: '#E5E7EB',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}>
                    {categoryLabels[dispute.category]}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#DC2626' }}>
                    {formatCurrency(dispute.amountDisputed)}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredDisputes.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
              Aucune contestation
            </div>
          )}
        </div>
      </div>

      {/* Dispute detail */}
      <div style={{
        flex: 1,
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {selectedDispute ? (
          <>
            {/* Detail header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    Contestation #{selectedDispute.id.slice(0, 8)}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
                    {selectedDispute.orderRef} - {selectedDispute.carrierName}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  background: statusConfig[selectedDispute.status].bgColor,
                  color: statusConfig[selectedDispute.status].color,
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}>
                  {statusConfig[selectedDispute.status].label}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginTop: '16px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Catégorie</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{categoryLabels[selectedDispute.category]}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Montant contesté</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#DC2626' }}>
                    {formatCurrency(selectedDispute.amountDisputed)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Créée le</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{formatDate(selectedDispute.createdAt)}</p>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'white', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Motif</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{selectedDispute.reason}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {selectedDispute.messages.map((msg) => {
                const isOwnMessage = msg.authorType === currentUserType;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      background: msg.authorType === 'system' ? '#F3F4F6' : isOwnMessage ? '#4F46E5' : 'white',
                      color: msg.authorType === 'system' ? '#6B7280' : isOwnMessage ? 'white' : '#111827',
                      borderRadius: '12px',
                      border: msg.authorType !== 'system' && !isOwnMessage ? '1px solid #E5E7EB' : 'none',
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>{msg.message}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      {msg.author} • {formatDate(msg.createdAt)}
                    </span>
                  </div>
                );
              })}

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div style={{
                  padding: '16px',
                  background: selectedDispute.status === 'resolved' ? '#D1FAE5' : '#FEE2E2',
                  borderRadius: '12px',
                  marginTop: '16px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                    Résolution: {selectedDispute.status === 'resolved' ? 'Acceptée' : 'Rejetée'}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '14px' }}>{selectedDispute.resolution}</p>
                </div>
              )}
            </div>

            {/* Input area */}
            {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
              <div style={{
                padding: '16px',
                borderTop: '1px solid #E5E7EB',
                background: '#F9FAFB',
              }}>
                {/* Resolution form for industry */}
                {currentUserType === 'industry' && showResolutionForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Justification de la résolution..."
                      style={{
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        resize: 'vertical',
                        minHeight: '80px',
                        fontSize: '14px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowResolutionForm(false)}
                        style={{
                          padding: '8px 16px',
                          background: 'white',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleResolve(false)}
                        style={{
                          padding: '8px 16px',
                          background: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => handleResolve(true)}
                        style={{
                          padding: '8px 16px',
                          background: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Accepter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Votre message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      style={{
                        padding: '12px 20px',
                        background: newMessage.trim() ? '#4F46E5' : '#9CA3AF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Envoyer
                    </button>
                    {currentUserType === 'industry' && (
                      <button
                        onClick={() => setShowResolutionForm(true)}
                        style={{
                          padding: '12px 20px',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Résoudre
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}>
            Sélectionnez une contestation pour voir les détails
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeManager;

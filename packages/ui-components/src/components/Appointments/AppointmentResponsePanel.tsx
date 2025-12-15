import React, { useState } from 'react';

export interface AppointmentRequest {
  requestId: string;
  orderId: string;
  orderReference: string;
  type: 'loading' | 'unloading';
  status: 'pending' | 'proposed' | 'accepted' | 'rejected' | 'cancelled';
  requesterName: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  preferredDates: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
    priority: number;
  }>;
  proposedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
    dockId?: string;
    dockName?: string;
  };
  confirmedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  carrierNotes?: string;
  messages: Array<{
    id: string;
    senderName: string;
    senderType: string;
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface AppointmentResponsePanelProps {
  request: AppointmentRequest;
  availableSlots?: Array<{
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
    dockId: string;
    dockName: string;
  }>;
  responderId: string;
  responderName: string;
  onPropose: (requestId: string, slot: { date: string; startTime: string; endTime: string; dockId?: string; dockName?: string }, message?: string) => Promise<void>;
  onAccept: (requestId: string, slotId?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onMessage: (requestId: string, content: string) => Promise<void>;
}

export const AppointmentResponsePanel: React.FC<AppointmentResponsePanelProps> = ({
  request,
  availableSlots,
  responderId,
  responderName,
  onPropose,
  onAccept,
  onReject,
  onMessage,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedStartTime, setProposedStartTime] = useState('08:00');
  const [proposedEndTime, setProposedEndTime] = useState('09:00');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePropose = async () => {
    if (!proposedDate) return;
    setIsProcessing(true);
    try {
      await onPropose(request.requestId, {
        date: proposedDate,
        startTime: proposedStartTime,
        endTime: proposedEndTime,
      });
      setShowProposeForm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptPreferred = async (dateItem: typeof request.preferredDates[0]) => {
    setIsProcessing(true);
    try {
      await onPropose(request.requestId, {
        date: dateItem.date,
        startTime: dateItem.startTime || '08:00',
        endTime: dateItem.endTime || '09:00',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptSlot = async () => {
    setIsProcessing(true);
    try {
      await onAccept(request.requestId, selectedSlotId || undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setIsProcessing(true);
    try {
      await onReject(request.requestId, rejectReason);
      setShowRejectForm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsProcessing(true);
    try {
      await onMessage(request.requestId, newMessage);
      setNewMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    proposed: { bg: '#dbeafe', text: '#1e40af' },
    accepted: { bg: '#dcfce7', text: '#166534' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    proposed: 'Creneau propose',
    accepted: 'Confirme',
    rejected: 'Refuse',
    cancelled: 'Annule',
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{request.type === 'loading' ? '📦' : '🚚'}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
              RDV {request.type === 'loading' ? 'Chargement' : 'Livraison'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {request.orderReference} - {request.carrierName || request.requesterName}
            </div>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: statusColors[request.status]?.bg,
          color: statusColors[request.status]?.text,
        }}>
          {statusLabels[request.status]}
        </span>
      </div>

      {/* Dates preferees */}
      {request.status === 'pending' && request.preferredDates?.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Dates souhaitees par le transporteur:
          </div>
          {request.preferredDates.map((dateItem, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'white', borderRadius: '6px', marginBottom: '4px' }}>
              <div>
                <span style={{ fontWeight: '600' }}>{formatDate(dateItem.date)}</span>
                {dateItem.startTime && (
                  <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                    {dateItem.startTime} - {dateItem.endTime}
                  </span>
                )}
                {index === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>Priorite</span>}
              </div>
              <button
                onClick={() => handleAcceptPreferred(dateItem)}
                disabled={isProcessing}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                ✓ Accepter
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Creneau propose/confirme */}
      {request.proposedSlot && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
            Creneau propose:
          </div>
          <div style={{ fontWeight: '700', color: '#111827' }}>
            {formatDate(request.proposedSlot.date)} de {request.proposedSlot.startTime} a {request.proposedSlot.endTime}
          </div>
          {request.proposedSlot.dockName && (
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Quai: {request.proposedSlot.dockName}
            </div>
          )}
        </div>
      )}

      {request.confirmedSlot && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
            Creneau confirme:
          </div>
          <div style={{ fontWeight: '700', color: '#111827' }}>
            {formatDate(request.confirmedSlot.date)} de {request.confirmedSlot.startTime} a {request.confirmedSlot.endTime}
          </div>
        </div>
      )}

      {/* Infos transporteur */}
      <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
        {request.driverName && (
          <div><span style={{ color: '#6b7280' }}>Chauffeur:</span> {request.driverName}</div>
        )}
        {request.driverPhone && (
          <div><span style={{ color: '#6b7280' }}>Tel:</span> {request.driverPhone}</div>
        )}
        {request.vehiclePlate && (
          <div><span style={{ color: '#6b7280' }}>Plaque:</span> <span style={{ fontFamily: 'monospace' }}>{request.vehiclePlate}</span></div>
        )}
      </div>

      {/* Notes */}
      {request.carrierNotes && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fefce8', borderRadius: '8px', fontSize: '13px' }}>
          <div style={{ fontWeight: '600', color: '#854d0e', marginBottom: '4px' }}>Note transporteur:</div>
          <div style={{ color: '#713f12' }}>{request.carrierNotes}</div>
        </div>
      )}

      {/* Actions pour demande en attente */}
      {request.status === 'pending' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowProposeForm(!showProposeForm)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            📅 Proposer un creneau
          </button>
          <button
            onClick={() => setShowRejectForm(!showRejectForm)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            ✕ Refuser
          </button>
        </div>
      )}

      {/* Formulaire proposition */}
      {showProposeForm && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Proposer un creneau</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
            <input
              type="time"
              value={proposedStartTime}
              onChange={(e) => setProposedStartTime(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
            <span style={{ alignSelf: 'center' }}>a</span>
            <input
              type="time"
              value={proposedEndTime}
              onChange={(e) => setProposedEndTime(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          {availableSlots && availableSlots.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ou choisir un creneau disponible:</div>
              <select
                value={selectedSlotId}
                onChange={(e) => {
                  setSelectedSlotId(e.target.value);
                  const slot = availableSlots.find(s => s.slotId === e.target.value);
                  if (slot) {
                    setProposedDate(slot.date);
                    setProposedStartTime(slot.startTime);
                    setProposedEndTime(slot.endTime);
                  }
                }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="">-- Selectionner --</option>
                {availableSlots.map(slot => (
                  <option key={slot.slotId} value={slot.slotId}>
                    {formatDate(slot.date)} {slot.startTime}-{slot.endTime} ({slot.dockName})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePropose}
              disabled={isProcessing || !proposedDate}
              style={{
                padding: '8px 16px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Envoyer proposition
            </button>
            <button
              onClick={() => setShowProposeForm(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Formulaire rejet */}
      {showRejectForm && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#991b1b' }}>Raison du refus</div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indiquez la raison..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '6px', minHeight: '60px', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReject}
              disabled={isProcessing || !rejectReason}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Confirmer le refus
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {request.messages && request.messages.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Historique</div>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {request.messages.map((msg) => (
              <div key={msg.id} style={{ fontSize: '12px', marginBottom: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{msg.senderName}</span>
                  <span style={{ color: '#9ca3af' }}>{formatDateTime(msg.timestamp)}</span>
                </div>
                <div style={{ color: '#374151' }}>{msg.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentResponsePanel;

/**
 * PaletteExchangeRecipient - Confirmation echange palettes a la livraison (cote destinataire)
 */
import { useState } from 'react';
import { palettesOrderApi } from '../lib/palettes-api';

interface Props {
  orderId: string;
  orderStatus: string;
  palletTracking?: any;
  recipientId: string;
  recipientName: string;
  carrierInfo: { id: string; name: string };
  onUpdate: () => void;
}

export default function PaletteExchangeRecipient({
  orderId, orderStatus, palletTracking, recipientId, recipientName, carrierInfo, onUpdate
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const expectedFromCarrier = palletTracking?.pickup?.takenByCarrier || 0;
  const [formData, setFormData] = useState({
    quantity: expectedFromCarrier,
    palletType: palletTracking?.palletType || 'EURO_EPAL',
    givenByCarrier: expectedFromCarrier,
    receivedByRecipient: expectedFromCarrier,
    notes: ''
  });

  const canConfirm = ['arrived_delivery', 'delivered'].includes(orderStatus) && palletTracking?.pickup && !palletTracking?.delivery;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await palettesOrderApi.confirmDelivery(orderId, {
        quantity: formData.quantity,
        palletType: formData.palletType,
        givenByCarrier: formData.givenByCarrier,
        receivedByRecipient: formData.receivedByRecipient,
        carrierId: carrierInfo.id,
        carrierName: carrierInfo.name,
        recipientId,
        recipientName,
        recipientType: 'destinataire',
        confirmedBy: recipientName,
        notes: formData.notes
      });
      if (result.success) {
        const msg = result.balance === 0 ? 'Echange solde!' : `Confirme. Solde: ${result.balance}`;
        setSuccess(msg);
        setShowForm(false);
        onUpdate();
      } else {
        setError(result.error || 'Erreur');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '12px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '14px'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  };

  const getBalanceColor = (b: number) => b === 0 ? '#00D084' : b > 0 ? '#3498db' : '#e74c3c';

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Palettes Europe - Reception</h3>

      {error && <div style={{ padding: '10px', background: 'rgba(231,76,60,0.3)', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ padding: '10px', background: 'rgba(0,208,132,0.3)', borderRadius: '8px', marginBottom: '12px' }}>{success}</div>}

      {/* Status summary */}
      {palletTracking?.enabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Type</div>
            <div style={{ fontWeight: '700' }}>{palletTracking.palletType?.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Solde actuel</div>
            <div style={{ fontWeight: '700', fontSize: '18px', color: getBalanceColor(palletTracking.balance) }}>
              {palletTracking.balance >= 0 ? '+' : ''}{palletTracking.balance}
            </div>
          </div>
        </div>
      )}

      {/* Pickup info */}
      {palletTracking?.pickup && (
        <div style={{ padding: '12px', background: 'rgba(102,126,234,0.15)', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '4px' }}>Chargement</div>
          <div style={{ fontSize: '13px' }}>
            Palettes prises par transporteur: <strong>{palletTracking.pickup.takenByCarrier}</strong>
          </div>
        </div>
      )}

      {/* Delivery confirmed */}
      {palletTracking?.delivery && (
        <div style={{
          padding: '12px',
          background: palletTracking.delivery.status === 'confirmed' ? 'rgba(0,208,132,0.15)' : 'rgba(231,76,60,0.15)',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ fontWeight: '600', color: palletTracking.delivery.status === 'confirmed' ? '#00D084' : '#e74c3c', marginBottom: '8px' }}>
            Reception {palletTracking.delivery.status === 'confirmed' ? 'confirmee' : 'en litige'}
          </div>
          <div style={{ fontSize: '13px' }}>
            Donnees: {palletTracking.delivery.givenByCarrier} | Recues: {palletTracking.delivery.receivedByRecipient}
          </div>
        </div>
      )}

      {/* Settled */}
      {palletTracking?.settled && (
        <div style={{ padding: '10px', background: 'rgba(0,208,132,0.3)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
          Compte solde
        </div>
      )}

      {/* Action */}
      {canConfirm && !showForm && (
        <button style={{ ...buttonStyle, width: '100%' }} onClick={() => setShowForm(true)}>
          Confirmer reception palettes
        </button>
      )}

      {showForm && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Donnees par transporteur</label>
              <input type="number" style={inputStyle} value={formData.givenByCarrier} onChange={e => setFormData({ ...formData, givenByCarrier: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Recues par vous</label>
              <input type="number" style={inputStyle} value={formData.receivedByRecipient} onChange={e => setFormData({ ...formData, receivedByRecipient: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Notes (optionnel)</label>
            <input type="text" style={inputStyle} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observations..." />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ ...buttonStyle, flex: 1 }} onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Confirmation...' : 'Confirmer'}
            </button>
            <button style={{ ...buttonStyle, flex: 1, background: 'rgba(255,255,255,0.2)' }} onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {!palletTracking?.enabled && !canConfirm && (
        <div style={{ textAlign: 'center', padding: '16px', opacity: 0.6, fontSize: '13px' }}>
          Le suivi palettes sera disponible apres le chargement.
        </div>
      )}
    </div>
  );
}

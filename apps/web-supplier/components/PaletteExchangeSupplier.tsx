/**
 * PaletteExchangeSupplier - Confirmation echange palettes au chargement (cote expediteur)
 */
import { useState } from 'react';
import { palettesOrderApi } from '../lib/palettes-api';

interface Props {
  orderId: string;
  orderStatus: string;
  palletTracking?: any;
  supplierId: string;
  supplierName: string;
  carrierInfo: { id: string; name: string };
  expectedPallets?: number;
  onUpdate: () => void;
}

export default function PaletteExchangeSupplier({
  orderId, orderStatus, palletTracking, supplierId, supplierName, carrierInfo, expectedPallets = 0, onUpdate
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    quantity: expectedPallets,
    palletType: 'EURO_EPAL',
    givenBySender: expectedPallets,
    takenByCarrier: expectedPallets,
    notes: ''
  });

  const canConfirm = ['carrier_accepted', 'in_transit', 'arrived_pickup', 'loaded'].includes(orderStatus) && !palletTracking?.pickup;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await palettesOrderApi.confirmPickup(orderId, {
        quantity: formData.quantity,
        palletType: formData.palletType,
        givenBySender: formData.givenBySender,
        takenByCarrier: formData.takenByCarrier,
        senderId: supplierId,
        senderName: supplierName,
        senderType: 'expediteur',
        carrierId: carrierInfo.id,
        carrierName: carrierInfo.name,
        confirmedBy: supplierName,
        notes: formData.notes
      });
      if (result.success) {
        setSuccess('Echange palette confirme!');
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

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Palettes Europe - Chargement</h3>

      {error && <div style={{ padding: '10px', background: 'rgba(231,76,60,0.3)', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ padding: '10px', background: 'rgba(0,208,132,0.3)', borderRadius: '8px', marginBottom: '12px' }}>{success}</div>}

      {palletTracking?.pickup && (
        <div style={{ padding: '12px', background: 'rgba(0,208,132,0.15)', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', color: '#00D084', marginBottom: '8px' }}>Confirme</div>
          <div style={{ fontSize: '13px' }}>
            Donne: {palletTracking.pickup.givenBySender} | Pris: {palletTracking.pickup.takenByCarrier}
          </div>
        </div>
      )}

      {canConfirm && !showForm && (
        <button style={{ ...buttonStyle, width: '100%' }} onClick={() => setShowForm(true)}>
          Confirmer echange palettes
        </button>
      )}

      {showForm && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Type palette</label>
              <select style={inputStyle} value={formData.palletType} onChange={e => setFormData({ ...formData, palletType: e.target.value })}>
                <option value="EURO_EPAL">EURO EPAL</option>
                <option value="EURO_EPAL_2">EURO EPAL 2</option>
                <option value="DEMI_PALETTE">Demi-Palette</option>
                <option value="PALETTE_PERDUE">Palette Perdue</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Quantite</label>
              <input type="number" style={inputStyle} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Palettes donnees</label>
              <input type="number" style={inputStyle} value={formData.givenBySender} onChange={e => setFormData({ ...formData, givenBySender: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Prises par transporteur</label>
              <input type="number" style={inputStyle} value={formData.takenByCarrier} onChange={e => setFormData({ ...formData, takenByCarrier: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ ...buttonStyle, flex: 1 }} onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Confirmation...' : 'Confirmer'}
            </button>
            <button style={{ ...buttonStyle, flex: 1, background: 'rgba(255,255,255,0.2)' }} onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

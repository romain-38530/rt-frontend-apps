/**
 * PaletteExchange Component - Gestion echange palettes sur commande
 * Permet au transporteur de confirmer les echanges de palettes au chargement et a la livraison
 */
import { useState } from 'react';
import { palettesOrderApi, PalletExchangeData, PalletTracking } from '../lib/palettes-api';

interface PaletteExchangeProps {
  orderId: string;
  orderReference: string;
  orderStatus: string;
  palletTracking?: PalletTracking;
  senderInfo: { id: string; name: string; type?: string };
  recipientInfo: { id: string; name: string; type?: string };
  expectedPallets?: number;
  onUpdate: () => void;
}

export default function PaletteExchange({
  orderId,
  orderReference,
  orderStatus,
  palletTracking,
  senderInfo,
  recipientInfo,
  expectedPallets = 0,
  onUpdate
}: PaletteExchangeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  // Form state for pickup
  const [pickupData, setPickupData] = useState({
    quantity: expectedPallets,
    palletType: 'EURO_EPAL' as const,
    givenBySender: expectedPallets,
    takenByCarrier: expectedPallets,
    notes: ''
  });

  // Form state for delivery
  const [deliveryData, setDeliveryData] = useState({
    quantity: expectedPallets,
    palletType: palletTracking?.palletType || 'EURO_EPAL',
    givenByCarrier: palletTracking?.pickup?.takenByCarrier || expectedPallets,
    receivedByRecipient: palletTracking?.pickup?.takenByCarrier || expectedPallets,
    notes: ''
  });

  const canConfirmPickup = ['carrier_accepted', 'in_transit', 'arrived_pickup', 'loaded'].includes(orderStatus) && !palletTracking?.pickup;
  const canConfirmDelivery = ['loaded', 'arrived_delivery', 'delivered'].includes(orderStatus) && palletTracking?.pickup && !palletTracking?.delivery;

  const handleConfirmPickup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await palettesOrderApi.confirmPickup(orderId, {
        quantity: pickupData.quantity,
        palletType: pickupData.palletType,
        givenBySender: pickupData.givenBySender,
        takenByCarrier: pickupData.takenByCarrier,
        senderId: senderInfo.id,
        senderName: senderInfo.name,
        senderType: senderInfo.type || 'industriel',
        confirmedBy: 'Chauffeur',
        notes: pickupData.notes
      });
      if (result.success) {
        setSuccess(`Echange palette confirme au chargement. Solde: ${result.balance >= 0 ? '+' : ''}${result.balance}`);
        setShowPickupForm(false);
        onUpdate();
      } else {
        setError(result.error || 'Erreur lors de la confirmation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await palettesOrderApi.confirmDelivery(orderId, {
        quantity: deliveryData.quantity,
        palletType: deliveryData.palletType as any,
        givenByCarrier: deliveryData.givenByCarrier,
        receivedByRecipient: deliveryData.receivedByRecipient,
        recipientId: recipientInfo.id,
        recipientName: recipientInfo.name,
        recipientType: recipientInfo.type || 'industriel',
        confirmedBy: 'Chauffeur',
        notes: deliveryData.notes
      });
      if (result.success) {
        const msg = result.balance === 0
          ? 'Echange palette solde! Aucune dette.'
          : `Echange confirme. Solde final: ${result.balance >= 0 ? '+' : ''}${result.balance}`;
        setSuccess(msg);
        setShowDeliveryForm(false);
        onUpdate();
      } else {
        setError(result.error || 'Erreur lors de la confirmation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '12px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
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
    fontWeight: '600',
    fontSize: '14px'
  };

  const getBalanceColor = (balance: number) => balance === 0 ? '#00D084' : balance > 0 ? '#3498db' : '#e74c3c';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>🏗️</span>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Suivi Palettes Europe</h3>
      </div>

      {error && (
        <div style={{ padding: '10px', background: 'rgba(231,76,60,0.3)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
        </div>
      )}
      {success && (
        <div style={{ padding: '10px', background: 'rgba(0,208,132,0.3)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
          {success}
          <button onClick={() => setSuccess(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Status Summary */}
      {palletTracking?.enabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Type</div>
            <div style={{ fontWeight: '700', fontSize: '13px' }}>{palletTracking.palletType?.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Quantite</div>
            <div style={{ fontWeight: '700', fontSize: '18px' }}>{palletTracking.expectedQuantity || '-'}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Solde</div>
            <div style={{ fontWeight: '700', fontSize: '18px', color: getBalanceColor(palletTracking.balance) }}>
              {palletTracking.balance >= 0 ? '+' : ''}{palletTracking.balance}
            </div>
          </div>
        </div>
      )}

      {/* Pickup Status */}
      {palletTracking?.pickup && (
        <div style={{ padding: '12px', background: 'rgba(0,208,132,0.15)', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#00D084' }}>Chargement confirme</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div>Donne par expediteur: <strong>{palletTracking.pickup.givenBySender}</strong></div>
            <div>Pris par transporteur: <strong>{palletTracking.pickup.takenByCarrier}</strong></div>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
            {new Date(palletTracking.pickup.confirmedAt).toLocaleString('fr-FR')}
          </div>
        </div>
      )}

      {/* Delivery Status */}
      {palletTracking?.delivery && (
        <div style={{
          padding: '12px',
          background: palletTracking.delivery.status === 'confirmed' ? 'rgba(0,208,132,0.15)' : 'rgba(231,76,60,0.15)',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px',
            color: palletTracking.delivery.status === 'confirmed' ? '#00D084' : '#e74c3c'
          }}>
            Livraison {palletTracking.delivery.status === 'confirmed' ? 'confirmee' : 'en litige'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div>Donne par transporteur: <strong>{palletTracking.delivery.givenByCarrier}</strong></div>
            <div>Recu par destinataire: <strong>{palletTracking.delivery.receivedByRecipient}</strong></div>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
            {new Date(palletTracking.delivery.confirmedAt).toLocaleString('fr-FR')}
          </div>
        </div>
      )}

      {/* Settled Badge */}
      {palletTracking?.settled && (
        <div style={{ padding: '10px', background: 'rgba(0,208,132,0.3)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px' }}>Compte solde</span>
        </div>
      )}

      {/* Action Buttons */}
      {!palletTracking?.enabled && canConfirmPickup && (
        <button
          style={{ ...buttonStyle, width: '100%' }}
          onClick={() => setShowPickupForm(true)}
        >
          Confirmer echange au chargement
        </button>
      )}

      {canConfirmPickup && !showPickupForm && palletTracking?.enabled && !palletTracking?.pickup && (
        <button
          style={{ ...buttonStyle, width: '100%' }}
          onClick={() => setShowPickupForm(true)}
        >
          Confirmer echange au chargement
        </button>
      )}

      {canConfirmDelivery && !showDeliveryForm && (
        <button
          style={{ ...buttonStyle, width: '100%', marginTop: '8px' }}
          onClick={() => setShowDeliveryForm(true)}
        >
          Confirmer echange a la livraison
        </button>
      )}

      {/* Pickup Form */}
      {showPickupForm && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Echange palettes - Chargement</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Type palette</label>
                <select
                  style={inputStyle}
                  value={pickupData.palletType}
                  onChange={(e) => setPickupData({ ...pickupData, palletType: e.target.value as any })}
                >
                  <option value="EURO_EPAL">EURO EPAL</option>
                  <option value="EURO_EPAL_2">EURO EPAL 2</option>
                  <option value="DEMI_PALETTE">Demi-Palette</option>
                  <option value="PALETTE_PERDUE">Palette Perdue</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Quantite totale</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={pickupData.quantity}
                  onChange={(e) => setPickupData({ ...pickupData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Donne par {senderInfo.name}</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={pickupData.givenBySender}
                  onChange={(e) => setPickupData({ ...pickupData, givenBySender: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Pris par transporteur</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={pickupData.takenByCarrier}
                  onChange={(e) => setPickupData({ ...pickupData, takenByCarrier: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Notes (optionnel)</label>
              <input
                type="text"
                style={inputStyle}
                value={pickupData.notes}
                onChange={(e) => setPickupData({ ...pickupData, notes: e.target.value })}
                placeholder="Observations..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                style={{ ...buttonStyle, flex: 1 }}
                onClick={handleConfirmPickup}
                disabled={isLoading}
              >
                {isLoading ? 'Confirmation...' : 'Confirmer'}
              </button>
              <button
                style={{ ...buttonStyle, flex: 1, background: 'rgba(255,255,255,0.2)' }}
                onClick={() => setShowPickupForm(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Form */}
      {showDeliveryForm && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Echange palettes - Livraison</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Donne par transporteur</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={deliveryData.givenByCarrier}
                  onChange={(e) => setDeliveryData({ ...deliveryData, givenByCarrier: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Recu par {recipientInfo.name}</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={deliveryData.receivedByRecipient}
                  onChange={(e) => setDeliveryData({ ...deliveryData, receivedByRecipient: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>Notes (optionnel)</label>
              <input
                type="text"
                style={inputStyle}
                value={deliveryData.notes}
                onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                placeholder="Observations..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                style={{ ...buttonStyle, flex: 1 }}
                onClick={handleConfirmDelivery}
                disabled={isLoading}
              >
                {isLoading ? 'Confirmation...' : 'Confirmer'}
              </button>
              <button
                style={{ ...buttonStyle, flex: 1, background: 'rgba(255,255,255,0.2)' }}
                onClick={() => setShowDeliveryForm(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No tracking yet */}
      {!palletTracking?.enabled && !canConfirmPickup && (
        <div style={{ textAlign: 'center', padding: '16px', opacity: 0.6, fontSize: '13px' }}>
          Le suivi palettes sera disponible une fois la commande acceptee.
        </div>
      )}
    </div>
  );
}

/**
 * Page d'edition d'une commande - Portail Industry
 * Utilise query parameter ?id=xxx pour l'export statique
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { isAuthenticated } from '../../lib/auth';
import { useSafeRouter } from '../../lib/useSafeRouter';
import { OrdersService } from '@rt/utils';
import type { Order } from '@rt/contracts';

export default function EditOrderPage() {
  const router = useSafeRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Extract order ID from URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setOrderId(id);
      }
    }
  }, []);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Stakeholders
    senderType: 'externe' as 'industriel' | 'logisticien' | 'externe',
    senderName: '',
    senderEmail: '',
    recipientName: '',
    recipientEmail: '',
    // Pickup
    pickupStreet: '',
    pickupCity: '',
    pickupPostalCode: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupDate: '',
    // Delivery
    deliveryStreet: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    deliveryDate: '',
    // Goods
    goodsDescription: '',
    goodsWeight: 0,
    goodsVolume: 0,
    goodsQuantity: 1,
    goodsPalettes: 0,
    // Notes
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const orderData = await OrdersService.getOrderById(orderId);
      setOrder(orderData);

      // Pre-fill form with order data
      const data = orderData as any;
      setFormData({
        // Stakeholders
        senderType: data.senderType || 'externe',
        senderName: data.senderName || data.forwarderName || '',
        senderEmail: data.senderEmail || data.forwarderEmail || '',
        recipientName: data.recipientName || '',
        recipientEmail: data.recipientEmail || '',
        // Pickup
        pickupStreet: orderData.pickupAddress?.street || '',
        pickupCity: orderData.pickupAddress?.city || '',
        pickupPostalCode: orderData.pickupAddress?.postalCode || '',
        pickupContactName: orderData.pickupAddress?.contactName || '',
        pickupContactPhone: orderData.pickupAddress?.contactPhone || '',
        pickupDate: orderData.dates?.pickupDate ? new Date(orderData.dates.pickupDate).toISOString().slice(0, 16) : '',
        // Delivery
        deliveryStreet: orderData.deliveryAddress?.street || '',
        deliveryCity: orderData.deliveryAddress?.city || '',
        deliveryPostalCode: orderData.deliveryAddress?.postalCode || '',
        deliveryContactName: orderData.deliveryAddress?.contactName || '',
        deliveryContactPhone: orderData.deliveryAddress?.contactPhone || '',
        deliveryDate: orderData.dates?.deliveryDate ? new Date(orderData.dates.deliveryDate).toISOString().slice(0, 16) : '',
        // Goods
        goodsDescription: orderData.goods?.description || '',
        goodsWeight: orderData.goods?.weight || 0,
        goodsVolume: orderData.goods?.volume || 0,
        goodsQuantity: orderData.goods?.quantity || 1,
        goodsPalettes: orderData.goods?.palettes || 0,
        // Notes
        notes: orderData.notes || '',
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !orderId) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updates: Partial<Order> & Record<string, any> = {
        // Stakeholders
        senderType: formData.senderType,
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        // Addresses
        pickupAddress: {
          ...order.pickupAddress,
          street: formData.pickupStreet,
          city: formData.pickupCity,
          postalCode: formData.pickupPostalCode,
          contactName: formData.pickupContactName,
          contactPhone: formData.pickupContactPhone,
        },
        deliveryAddress: {
          ...order.deliveryAddress,
          street: formData.deliveryStreet,
          city: formData.deliveryCity,
          postalCode: formData.deliveryPostalCode,
          contactName: formData.deliveryContactName,
          contactPhone: formData.deliveryContactPhone,
        },
        dates: {
          ...order.dates,
          pickupDate: formData.pickupDate,
          deliveryDate: formData.deliveryDate,
        },
        goods: {
          ...order.goods,
          description: formData.goodsDescription,
          weight: formData.goodsWeight,
          volume: formData.goodsVolume,
          quantity: formData.goodsQuantity,
          palettes: formData.goodsPalettes,
        },
        notes: formData.notes,
      };

      await OrdersService.updateOrder(orderId, updates);
      setSuccessMessage('Commande mise a jour avec succes');

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise a jour');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  };

  if (!orderId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement de la commande...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>Commande introuvable</div>
        <button onClick={() => router.push('/orders')} style={{ padding: '12px 24px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Retour aux commandes
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Modifier {order.reference} - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '20px 40px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => router.push(`/orders/${orderId}`)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                ← Annuler
              </button>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                  Modifier la commande
                </h1>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {order.reference}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                padding: '12px 24px',
                background: isSaving ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 40px' }}>
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontWeight: '600' }}>
              {error}
            </div>
          </div>
        )}
        {successMessage && (
          <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 40px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontWeight: '600' }}>
              {successMessage}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
          {/* Parties prenantes - Full width */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Parties prenantes
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Expediteur */}
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', margin: 0 }}>Expéditeur</h3>
                  </div>
                  {/* Action button based on sender type */}
                  {formData.senderType === 'industriel' && (
                    <a
                      href="/planning"
                      style={{ fontSize: '12px', color: '#92400e', textDecoration: 'none', fontWeight: '600', padding: '4px 8px', backgroundColor: '#fcd34d', borderRadius: '4px' }}
                    >
                      📅 Planning
                    </a>
                  )}
                  {formData.senderType === 'logisticien' && (
                    <a
                      href="/planning"
                      style={{ fontSize: '12px', color: '#92400e', textDecoration: 'none', fontWeight: '600', padding: '4px 8px', backgroundColor: '#fcd34d', borderRadius: '4px' }}
                    >
                      📅 Planning
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Type d'expéditeur <span style={{ color: '#dc2626' }}>*</span></label>
                    <select
                      value={formData.senderType}
                      onChange={(e) => setFormData({ ...formData, senderType: e.target.value as any })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      required
                    >
                      <option value="industriel">Industriel (interne)</option>
                      <option value="logisticien">Logisticien de l'industriel</option>
                      <option value="externe">Externe (Fournisseur/Transitaire)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" value={formData.senderName} onChange={(e) => setFormData({ ...formData, senderName: e.target.value })} style={inputStyle} placeholder="Nom de l'expediteur" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="email" value={formData.senderEmail} onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })} style={inputStyle} placeholder="email@expediteur.com" required />
                  </div>
                  {formData.senderType === 'externe' && formData.senderEmail && (
                    <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#fcd34d', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px' }}>
                        Un email d'invitation sera envoyé à l'expéditeur avec un code d'accès au portail fournisseur.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Destinataire */}
              <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', margin: 0 }}>Destinataire</h3>
                  {formData.recipientEmail && (
                    <a
                      href={`https://d3b6p09ihn5w7r.amplifyapp.com/orders/?email=${encodeURIComponent(formData.recipientEmail)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                    >
                      Ouvrir portail
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} style={inputStyle} placeholder="Nom du destinataire" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="email" value={formData.recipientEmail} onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })} style={inputStyle} placeholder="email@destinataire.com" required />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Collecte */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Point de collecte
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input type="text" value={formData.pickupStreet} onChange={(e) => setFormData({ ...formData, pickupStreet: e.target.value })} style={inputStyle} placeholder="Rue, numero..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input type="text" value={formData.pickupPostalCode} onChange={(e) => setFormData({ ...formData, pickupPostalCode: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input type="text" value={formData.pickupCity} onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input type="text" value={formData.pickupContactName} onChange={(e) => setFormData({ ...formData, pickupContactName: e.target.value })} style={inputStyle} placeholder="Nom du contact" />
                </div>
                <div>
                  <label style={labelStyle}>Telephone</label>
                  <input type="tel" value={formData.pickupContactPhone} onChange={(e) => setFormData({ ...formData, pickupContactPhone: e.target.value })} style={inputStyle} placeholder="+33..." />
                </div>
                <div>
                  <label style={labelStyle}>Date et heure de collecte</label>
                  <input type="datetime-local" value={formData.pickupDate} onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Livraison */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Point de livraison
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input type="text" value={formData.deliveryStreet} onChange={(e) => setFormData({ ...formData, deliveryStreet: e.target.value })} style={inputStyle} placeholder="Rue, numero..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input type="text" value={formData.deliveryPostalCode} onChange={(e) => setFormData({ ...formData, deliveryPostalCode: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input type="text" value={formData.deliveryCity} onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input type="text" value={formData.deliveryContactName} onChange={(e) => setFormData({ ...formData, deliveryContactName: e.target.value })} style={inputStyle} placeholder="Nom du contact" />
                </div>
                <div>
                  <label style={labelStyle}>Telephone</label>
                  <input type="tel" value={formData.deliveryContactPhone} onChange={(e) => setFormData({ ...formData, deliveryContactPhone: e.target.value })} style={inputStyle} placeholder="+33..." />
                </div>
                <div>
                  <label style={labelStyle}>Date et heure de livraison</label>
                  <input type="datetime-local" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Marchandise */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Marchandise
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={formData.goodsDescription} onChange={(e) => setFormData({ ...formData, goodsDescription: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Nature de la marchandise..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Poids (kg)</label>
                    <input type="number" value={formData.goodsWeight} onChange={(e) => setFormData({ ...formData, goodsWeight: parseFloat(e.target.value) || 0 })} style={inputStyle} min="0" step="0.1" />
                  </div>
                  <div>
                    <label style={labelStyle}>Volume (m3)</label>
                    <input type="number" value={formData.goodsVolume} onChange={(e) => setFormData({ ...formData, goodsVolume: parseFloat(e.target.value) || 0 })} style={inputStyle} min="0" step="0.1" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Quantite</label>
                    <input type="number" value={formData.goodsQuantity} onChange={(e) => setFormData({ ...formData, goodsQuantity: parseInt(e.target.value) || 1 })} style={inputStyle} min="1" />
                  </div>
                  <div>
                    <label style={labelStyle}>Palettes</label>
                    <input type="number" value={formData.goodsPalettes} onChange={(e) => setFormData({ ...formData, goodsPalettes: parseInt(e.target.value) || 0 })} style={inputStyle} min="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Notes & Instructions
              </h2>

              <div>
                <label style={labelStyle}>Notes additionnelles</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} placeholder="Instructions speciales, contraintes d'acces, horaires..." />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

/**
 * DeliveryConfirmation - Composant de confirmation de livraison SYMPHONI.A
 * Signature, photos, et rapport d'incident
 */
import React, { useState } from 'react';
import SignatureCapture from './SignatureCapture';
import { ordersApi } from '../lib/api';

interface DeliveryConfirmationProps {
  orderId: string;
  orderReference: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type IssueType = 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other';

interface DeliveryIssue {
  type: IssueType;
  description: string;
  photos: string[];
}

const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  orderId,
  orderReference,
  onSuccess,
  onCancel
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [issues, setIssues] = useState<DeliveryIssue[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState<DeliveryIssue>({ type: 'damage', description: '', photos: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get current location
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => console.log('Geolocation error:', err)
      );
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleIssuePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewIssue(prev => ({
            ...prev,
            photos: [...prev.photos, event.target!.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addIssue = () => {
    if (!newIssue.description.trim()) return;
    setIssues(prev => [...prev, newIssue]);
    setNewIssue({ type: 'damage', description: '', photos: [] });
    setShowIssueForm(false);
  };

  const removeIssue = (index: number) => {
    setIssues(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      setError('Le nom du destinataire est requis');
      return;
    }
    if (!signatureData) {
      setError('La signature est requise');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await ordersApi.confirmDelivery(orderId, {
        recipientName,
        signatureData,
        notes: notes || undefined,
        photos: photos.length > 0 ? photos : undefined,
        location: location || undefined,
        issues: issues.length > 0 ? issues : undefined
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Erreur lors de la confirmation');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueLabels: Record<IssueType, string> = {
    damage: 'Dommage',
    shortage: 'Manquant',
    wrong_product: 'Produit errone',
    delay: 'Retard',
    other: 'Autre'
  };

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '20px',
    borderRadius: '12px 12px 0 0'
  };

  const contentStyle: React.CSSProperties = {
    padding: '20px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '4px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px'
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    opacity: isSubmitting ? 0.7 : 1,
    width: '100%'
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#6b7280',
    padding: '12px 24px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '8px'
  };

  const photoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginTop: '8px'
  };

  const photoThumbStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '4px'
  };

  const issueCardStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    position: 'relative'
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px'
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Confirmation de livraison</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
            Commande: {orderReference}
          </p>
        </div>

        <div style={contentStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          {/* Recipient Name */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Nom du destinataire *</label>
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Nom et prenom du receptionnaire"
              style={inputStyle}
            />
          </div>

          {/* Signature */}
          <div style={sectionStyle}>
            <SignatureCapture
              onSignature={setSignatureData}
              label="Signature du destinataire *"
            />
          </div>

          {/* Photos */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Photos de livraison (optionnel)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ marginTop: '4px' }}
            />
            {photos.length > 0 && (
              <div style={photoGridStyle}>
                {photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Photo ${index + 1}`} style={photoThumbStyle} />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Remarques sur la livraison..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Issues */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Incidents / Reserves</label>

            {issues.map((issue, index) => (
              <div key={index} style={issueCardStyle}>
                <button
                  onClick={() => removeIssue(index)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc2626'
                  }}
                >
                  X
                </button>
                <strong>{issueLabels[issue.type]}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{issue.description}</p>
              </div>
            ))}

            {showIssueForm ? (
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                <select
                  value={newIssue.type}
                  onChange={e => setNewIssue(prev => ({ ...prev, type: e.target.value as IssueType }))}
                  style={{ ...inputStyle, marginBottom: '8px' }}
                >
                  <option value="damage">Dommage</option>
                  <option value="shortage">Manquant</option>
                  <option value="wrong_product">Produit errone</option>
                  <option value="delay">Retard</option>
                  <option value="other">Autre</option>
                </select>
                <textarea
                  value={newIssue.description}
                  onChange={e => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'incident..."
                  rows={2}
                  style={{ ...inputStyle, marginBottom: '8px' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleIssuePhotoUpload}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={addIssue}
                    style={{ ...buttonPrimaryStyle, width: 'auto', padding: '8px 16px', fontSize: '12px' }}
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowIssueForm(false)}
                    style={{ ...buttonSecondaryStyle, width: 'auto', padding: '8px 16px', fontSize: '12px', marginTop: 0 }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowIssueForm(true)}
                style={{
                  ...buttonSecondaryStyle,
                  marginTop: '8px',
                  color: '#f59e0b',
                  borderColor: '#f59e0b'
                }}
              >
                + Signaler un incident
              </button>
            )}
          </div>

          {/* Location info */}
          {location && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Position GPS enregistree
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={buttonPrimaryStyle}
          >
            {isSubmitting ? 'Confirmation en cours...' : 'Confirmer la livraison'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            style={buttonSecondaryStyle}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmation;

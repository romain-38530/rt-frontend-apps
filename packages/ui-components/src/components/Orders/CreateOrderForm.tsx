/**
 * Formulaire de création de commande
 * Composant réutilisable pour tous les portails
 */

import React, { useState } from 'react';
import type {
  CreateOrderInput,
  Address,
  Goods,
  Constraint,
  OrderDates,
  ConstraintType,
} from '@rt/contracts';

export interface CreateOrderFormProps {
  onSubmit: (input: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateOrderInput>;
  isLoading?: boolean;
}

const CONSTRAINT_TYPES: { value: ConstraintType; label: string }[] = [
  { value: 'ADR', label: 'ADR (Matières dangereuses)' },
  { value: 'HAYON', label: 'Hayon élévateur' },
  { value: 'RDV', label: 'Rendez-vous obligatoire' },
  { value: 'PALETTES', label: 'Palettes Europe' },
  { value: 'TEMPERATURE', label: 'Température contrôlée' },
  { value: 'FRAGILE', label: 'Marchandise fragile' },
  { value: 'ASSURANCE', label: 'Assurance renforcée' },
];

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  // État du formulaire
  const [formData, setFormData] = useState<CreateOrderInput>({
    pickupAddress: initialData?.pickupAddress || {
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
    deliveryAddress: initialData?.deliveryAddress || {
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
    dates: initialData?.dates || {
      pickupDate: '',
      pickupTimeSlotStart: '',
      pickupTimeSlotEnd: '',
      deliveryDate: '',
      deliveryTimeSlotStart: '',
      deliveryTimeSlotEnd: '',
    },
    goods: initialData?.goods || {
      description: '',
      weight: 0,
      volume: 0,
      quantity: 1,
      palettes: 0,
      packaging: '',
      value: 0,
    },
    constraints: initialData?.constraints || [],
    notes: initialData?.notes || '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedConstraints, setSelectedConstraints] = useState<ConstraintType[]>(
    initialData?.constraints?.map((c: Constraint) => c.type) || []
  );

  // Mise à jour des champs d'adresse
  const updatePickupAddress = (field: keyof Address, value: string) => {
    setFormData({
      ...formData,
      pickupAddress: { ...formData.pickupAddress, [field]: value },
    });
  };

  const updateDeliveryAddress = (field: keyof Address, value: string) => {
    setFormData({
      ...formData,
      deliveryAddress: { ...formData.deliveryAddress, [field]: value },
    });
  };

  // Mise à jour des dates
  const updateDates = (field: keyof OrderDates, value: string) => {
    setFormData({
      ...formData,
      dates: { ...formData.dates, [field]: value },
    });
  };

  // Mise à jour de la marchandise
  const updateGoods = (field: keyof Goods, value: string | number) => {
    setFormData({
      ...formData,
      goods: { ...formData.goods, [field]: value },
    });
  };

  // Gestion des contraintes
  const toggleConstraint = (type: ConstraintType) => {
    const isSelected = selectedConstraints.includes(type);

    if (isSelected) {
      setSelectedConstraints(selectedConstraints.filter((c) => c !== type));
      setFormData({
        ...formData,
        constraints: formData.constraints?.filter((c: Constraint) => c.type !== type) || [],
      });
    } else {
      setSelectedConstraints([...selectedConstraints, type]);
      setFormData({
        ...formData,
        constraints: [...(formData.constraints || []), { type, description: '' }],
      });
    }
  };

  // Validation du formulaire
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Adresse de collecte
        return (
          formData.pickupAddress.street !== '' &&
          formData.pickupAddress.city !== '' &&
          formData.pickupAddress.postalCode !== '' &&
          formData.pickupAddress.contactName !== ''
        );
      case 2: // Adresse de livraison
        return (
          formData.deliveryAddress.street !== '' &&
          formData.deliveryAddress.city !== '' &&
          formData.deliveryAddress.postalCode !== '' &&
          formData.deliveryAddress.contactName !== ''
        );
      case 3: // Dates
        return (
          formData.dates.pickupDate !== '' &&
          formData.dates.deliveryDate !== ''
        );
      case 4: // Marchandise
        return (
          formData.goods.description !== '' &&
          formData.goods.weight > 0 &&
          formData.goods.quantity > 0
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Style des inputs
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: step <= currentStep ? '#667eea' : '#e5e7eb',
                marginRight: step < 5 ? '8px' : '0',
                borderRadius: '2px',
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          Étape {currentStep} sur 5
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Étape 1 : Adresse de collecte */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              📍 Adresse de collecte
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Rue *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.street}
                  onChange={(e) => updatePickupAddress('street', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Ville *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.city}
                  onChange={(e) => updatePickupAddress('city', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Code postal *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.postalCode}
                  onChange={(e) => updatePickupAddress('postalCode', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Nom du contact *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.contactName}
                  onChange={(e) => updatePickupAddress('contactName', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Téléphone du contact</label>
                <input
                  type="tel"
                  value={formData.pickupAddress.contactPhone}
                  onChange={(e) => updatePickupAddress('contactPhone', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Instructions de collecte</label>
                <textarea
                  value={formData.pickupAddress.instructions}
                  onChange={(e) => updatePickupAddress('instructions', e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 : Adresse de livraison */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              🎯 Adresse de livraison
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Rue *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) => updateDeliveryAddress('street', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Ville *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => updateDeliveryAddress('city', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Code postal *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.postalCode}
                  onChange={(e) => updateDeliveryAddress('postalCode', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Nom du contact *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.contactName}
                  onChange={(e) => updateDeliveryAddress('contactName', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Téléphone du contact</label>
                <input
                  type="tel"
                  value={formData.deliveryAddress.contactPhone}
                  onChange={(e) => updateDeliveryAddress('contactPhone', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Instructions de livraison</label>
                <textarea
                  value={formData.deliveryAddress.instructions}
                  onChange={(e) => updateDeliveryAddress('instructions', e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 : Dates et créneaux horaires */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              📅 Dates et créneaux horaires
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Collecte */}
              <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Collecte
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Date de collecte *</label>
                  <input
                    type="date"
                    value={formData.dates.pickupDate}
                    onChange={(e) => updateDates('pickupDate', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={labelStyle}>Début</label>
                    <input
                      type="time"
                      value={formData.dates.pickupTimeSlotStart}
                      onChange={(e) => updateDates('pickupTimeSlotStart', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fin</label>
                    <input
                      type="time"
                      value={formData.dates.pickupTimeSlotEnd}
                      onChange={(e) => updateDates('pickupTimeSlotEnd', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Livraison */}
              <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Livraison
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Date de livraison *</label>
                  <input
                    type="date"
                    value={formData.dates.deliveryDate}
                    onChange={(e) => updateDates('deliveryDate', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={labelStyle}>Début</label>
                    <input
                      type="time"
                      value={formData.dates.deliveryTimeSlotStart}
                      onChange={(e) => updateDates('deliveryTimeSlotStart', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fin</label>
                    <input
                      type="time"
                      value={formData.dates.deliveryTimeSlotEnd}
                      onChange={(e) => updateDates('deliveryTimeSlotEnd', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 4 : Marchandise */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              📦 Marchandise
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={formData.goods.description}
                  onChange={(e) => updateGoods('description', e.target.value)}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Poids (kg) *</label>
                <input
                  type="number"
                  value={formData.goods.weight || ''}
                  onChange={(e) => updateGoods('weight', parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Volume (m³)</label>
                <input
                  type="number"
                  value={formData.goods.volume || ''}
                  onChange={(e) => updateGoods('volume', parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label style={labelStyle}>Quantité *</label>
                <input
                  type="number"
                  value={formData.goods.quantity}
                  onChange={(e) => updateGoods('quantity', parseInt(e.target.value) || 1)}
                  style={inputStyle}
                  min="1"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Palettes Europe</label>
                <input
                  type="number"
                  value={formData.goods.palettes || ''}
                  onChange={(e) => updateGoods('palettes', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                  min="0"
                />
              </div>

              <div>
                <label style={labelStyle}>Type d'emballage</label>
                <input
                  type="text"
                  value={formData.goods.packaging}
                  onChange={(e) => updateGoods('packaging', e.target.value)}
                  style={inputStyle}
                  placeholder="Carton, Palette, Vrac..."
                />
              </div>

              <div>
                <label style={labelStyle}>Valeur déclarée (€)</label>
                <input
                  type="number"
                  value={formData.goods.value || ''}
                  onChange={(e) => updateGoods('value', parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 5 : Contraintes et notes */}
        {currentStep === 5 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              ⚙️ Contraintes et notes
            </h2>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ ...labelStyle, marginBottom: '16px' }}>
                Contraintes de transport
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {CONSTRAINT_TYPES.map((constraint) => (
                  <div
                    key={constraint.value}
                    onClick={() => toggleConstraint(constraint.value)}
                    style={{
                      padding: '16px',
                      border: selectedConstraints.includes(constraint.value)
                        ? '2px solid #667eea'
                        : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedConstraints.includes(constraint.value)
                        ? '#f0f4ff'
                        : 'white',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedConstraints.includes(constraint.value)}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {constraint.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notes complémentaires</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="Informations supplémentaires pour le transporteur..."
              />
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            style={{
              padding: '12px 24px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'white',
            }}
          >
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isStepValid(currentStep) ? 'pointer' : 'not-allowed',
                backgroundColor: isStepValid(currentStep) ? '#667eea' : '#9ca3af',
                color: 'white',
              }}
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                backgroundColor: isLoading ? '#9ca3af' : '#10b981',
                color: 'white',
              }}
            >
              {isLoading ? 'Création en cours...' : 'Créer la commande'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateOrderForm;

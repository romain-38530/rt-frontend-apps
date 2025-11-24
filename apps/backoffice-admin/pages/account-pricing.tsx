/**
 * Interface Admin de Gestion des Prix des Comptes
 *
 * Cette page permet aux admins de:
 * - Voir tous les prix des types de comptes
 * - Modifier les prix de base
 * - Gérer les variantes (invité vs premium)
 * - Créer et gérer les promotions
 * - Consulter l'historique des changements de prix
 *
 * URL: https://backoffice-admin.amplifyapp.com/account-pricing
 */

import { useEffect, useState } from 'react';
import { usePricing, formatPrice, BackendAccountType, Pricing, Promotion } from '../../../src/hooks/usePricing';

// Configuration API
const SUBSCRIPTIONS_API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://dgze8l03lwl5h.cloudfront.net';

// Composant pour afficher/éditer un pricing
function PricingEditor({ pricing, onUpdate }: { pricing: Pricing; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(pricing.basePrice);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUBSCRIPTIONS_API_URL}/api/pricing/${pricing.accountType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Ajouter le token admin
          // 'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          newPrice,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      setIsEditing(false);
      setReason('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-card">
      <div className="card-header">
        <h3>{pricing.displayName}</h3>
        <span className="account-type-badge">{pricing.accountType}</span>
      </div>

      <div className="card-body">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label>Nouveau prix (€)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Raison du changement</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Ajustement inflation 2025"
              />
            </div>

            {error && <p className="error">{error}</p>}

            <div className="button-group">
              <button onClick={handleUpdate} disabled={loading || !reason}>
                {loading ? 'Mise à jour...' : 'Enregistrer'}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={loading}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="price-display">
            <div className="price-main">
              {formatPrice(pricing.basePrice, pricing.currency, pricing.billingPeriod)}
            </div>

            <div className="price-info">
              <p>Prix de base: {pricing.basePrice}€</p>
              <p>Période: {pricing.billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}</p>
              <p>Variantes: {pricing.variants.length}</p>
              <p>Promotions actives: {pricing.promotions.filter(p => p.isActive).length}</p>
            </div>

            <button onClick={() => setIsEditing(true)} className="btn-edit">
              Modifier le prix
            </button>
          </div>
        )}

        {/* Variantes */}
        {pricing.variants.length > 0 && (
          <div className="variants-section">
            <h4>Variantes</h4>
            <table className="variants-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prix</th>
                  <th>Conditions</th>
                  <th>Actif</th>
                </tr>
              </thead>
              <tbody>
                {pricing.variants.map((variant, idx) => (
                  <tr key={idx}>
                    <td>{variant.name}</td>
                    <td>{variant.price}€</td>
                    <td>
                      {Object.entries(variant.conditions).map(([k, v]) => (
                        <div key={k}><code>{k}: {String(v)}</code></div>
                      ))}
                    </td>
                    <td>{variant.isActive ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Promotions */}
        {pricing.promotions.length > 0 && (
          <div className="promotions-section">
            <h4>Promotions</h4>
            <table className="promotions-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Réduction</th>
                  <th>Valide jusqu'au</th>
                  <th>Utilisations</th>
                  <th>Actif</th>
                </tr>
              </thead>
              <tbody>
                {pricing.promotions.map((promo, idx) => (
                  <tr key={idx} className={promo.isActive ? '' : 'inactive'}>
                    <td><strong>{promo.code}</strong></td>
                    <td>
                      {promo.discountType === 'percentage'
                        ? `-${promo.discountValue}%`
                        : `-${promo.discountValue}€`
                      }
                    </td>
                    <td>{new Date(promo.validUntil).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {promo.usedCount} / {promo.maxUses || '∞'}
                    </td>
                    <td>{promo.isActive ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .pricing-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .card-header {
          background: #f5f5f5;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .account-type-badge {
          background: #3b82f6;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .card-body {
          padding: 20px;
        }

        .price-display {
          text-align: center;
        }

        .price-main {
          font-size: 36px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 16px;
        }

        .price-info {
          text-align: left;
          background: #f9fafb;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .price-info p {
          margin: 4px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .edit-form {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:first-child {
          background: #3b82f6;
          color: white;
        }

        button:first-child:hover:not(:disabled) {
          background: #2563eb;
        }

        button:last-child {
          background: #e5e7eb;
          color: #374151;
        }

        button:last-child:hover:not(:disabled) {
          background: #d1d5db;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-edit {
          background: #10b981;
          color: white;
          width: 100%;
        }

        .btn-edit:hover {
          background: #059669;
        }

        .variants-section, .promotions-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .variants-section h4, .promotions-section h4 {
          margin-bottom: 12px;
          font-size: 16px;
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        th {
          background: #f9fafb;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        tr.inactive {
          opacity: 0.5;
        }

        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
        }

        .error {
          color: #ef4444;
          font-size: 14px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}

// Composant pour créer une nouvelle promotion
function CreatePromoForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [accountType, setAccountType] = useState<BackendAccountType>('TRANSPORTEUR');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountTypes: BackendAccountType[] = [
    'TRANSPORTEUR',
    'EXPEDITEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE',
    'COMMISSIONNAIRE_AGRÉÉ',
    'DOUANE'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUBSCRIPTIONS_API_URL}/api/pricing/${accountType}/promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Ajouter le token admin
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          discountType,
          discountValue,
          validFrom: new Date(validFrom).toISOString(),
          validUntil: new Date(validUntil).toISOString(),
          maxUses: maxUses || null
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Créer une Promotion</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type de compte</label>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value as BackendAccountType)}>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Code promo</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER2025"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type de réduction</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>

            <div className="form-group">
              <label>Valeur</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valide du</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Valide jusqu'au</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nombre max d'utilisations (optionnel)</label>
            <input
              type="number"
              value={maxUses || ''}
              onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
              min="1"
              placeholder="Illimité"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la promotion'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        h2 {
          margin-top: 0;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
          flex: 1;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          flex: 1;
        }

        button[type="submit"] {
          background: #3b82f6;
          color: white;
        }

        button[type="submit"]:hover:not(:disabled) {
          background: #2563eb;
        }

        button[type="button"] {
          background: #e5e7eb;
          color: #374151;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error {
          color: #ef4444;
          font-size: 14px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}

// Page principale
export default function AccountPricingPage() {
  const { allPricing, loading, error, refresh } = usePricing({
    apiUrl: SUBSCRIPTIONS_API_URL,
    autoLoad: true
  });

  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active'>('active');

  const filteredPricing = filter === 'active'
    ? allPricing.filter(p => p.isActive)
    : allPricing;

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>Gestion des Prix des Comptes</h1>
          <p>Gérer les prix, variantes et promotions pour tous les types de comptes</p>
        </div>

        <div className="header-actions">
          <button onClick={() => setShowCreatePromo(true)} className="btn-primary">
            + Créer une promotion
          </button>
          <button onClick={refresh} className="btn-secondary">
            ↻ Rafraîchir
          </button>
        </div>
      </header>

      <div className="filters">
        <label>
          <input
            type="radio"
            name="filter"
            value="active"
            checked={filter === 'active'}
            onChange={() => setFilter('active')}
          />
          Actifs seulement
        </label>
        <label>
          <input
            type="radio"
            name="filter"
            value="all"
            checked={filter === 'all'}
            onChange={() => setFilter('all')}
          />
          Tous
        </label>
      </div>

      {loading && <p>Chargement des prix...</p>}

      {error && <p className="error">Erreur: {error}</p>}

      {!loading && !error && (
        <div className="pricing-grid">
          {filteredPricing.length === 0 ? (
            <p>Aucun pricing trouvé.</p>
          ) : (
            filteredPricing.map(pricing => (
              <PricingEditor
                key={pricing.accountType}
                pricing={pricing}
                onUpdate={refresh}
              />
            ))
          )}
        </div>
      )}

      {showCreatePromo && (
        <CreatePromoForm
          onClose={() => setShowCreatePromo(false)}
          onSuccess={refresh}
        />
      )}

      <style jsx>{`
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .page-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .filters {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .filters label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
          gap: 20px;
        }

        .error {
          color: #ef4444;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

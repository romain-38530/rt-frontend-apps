/**
 * Composant de recherche de transporteurs Affret.IA
 * Interface de recherche dans le réseau de 40,000 carriers
 */

import React, { useState } from 'react';
import type {
  CarrierSearchRequest,
  CarrierSearchResult,
  AffretCarrier,
} from '@rt/contracts';
import AffretIAService from '@rt/utils/lib/services/affret-ia-service';

interface CarrierSearchProps {
  initialRequest?: Partial<CarrierSearchRequest>;
  onCarrierSelect?: (carrier: AffretCarrier) => void;
  onSendOfferRequest?: (carrier: AffretCarrier) => void;
  autoSearch?: boolean;
}

export const CarrierSearch: React.FC<CarrierSearchProps> = ({
  initialRequest,
  onCarrierSelect,
  onSendOfferRequest,
  autoSearch = false,
}) => {
  const [searchRequest, setSearchRequest] = useState<Partial<CarrierSearchRequest>>(
    initialRequest || {}
  );
  const [results, setResults] = useState<CarrierSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchRequest.pickupAddress || !searchRequest.deliveryAddress || !searchRequest.goods) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await AffretIAService.searchCarriers(searchRequest as CarrierSearchRequest);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search si demandé et données disponibles
  React.useEffect(() => {
    if (autoSearch && initialRequest) {
      handleSearch();
    }
  }, [autoSearch]);

  return (
    <div style={{ width: '100%' }}>
      {/* Formulaire de recherche */}
      <div
        style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          🔍 Rechercher des transporteurs
        </h2>

        {/* Simplified search form (in production, use full form) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Pays de collecte *
            </label>
            <input
              type="text"
              placeholder="France"
              value={searchRequest.pickupAddress?.country || ''}
              onChange={(e) =>
                setSearchRequest({
                  ...searchRequest,
                  pickupAddress: { ...searchRequest.pickupAddress, country: e.target.value } as any,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Pays de livraison *
            </label>
            <input
              type="text"
              placeholder="Allemagne"
              value={searchRequest.deliveryAddress?.country || ''}
              onChange={(e) =>
                setSearchRequest({
                  ...searchRequest,
                  deliveryAddress: { ...searchRequest.deliveryAddress, country: e.target.value } as any,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Type de marchandise *
            </label>
            <select
              value={searchRequest.goods?.type || 'pallet'}
              onChange={(e) =>
                setSearchRequest({
                  ...searchRequest,
                  goods: { ...searchRequest.goods, type: e.target.value } as any,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="pallet">Palettes</option>
              <option value="package">Colis</option>
              <option value="bulk">Vrac</option>
              <option value="container">Container</option>
              <option value="vehicle">Véhicule</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
              Poids (kg) *
            </label>
            <input
              type="number"
              placeholder="1000"
              value={searchRequest.goods?.weight || ''}
              onChange={(e) =>
                setSearchRequest({
                  ...searchRequest,
                  goods: { ...searchRequest.goods, weight: Number(e.target.value) } as any,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={isSearching}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: isSearching ? '#9ca3af' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: isSearching ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          {isSearching ? '🔄 Recherche en cours...' : '🔍 Rechercher'}
        </button>
      </div>

      {/* Résultats */}
      {results && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              {results.totalResults} transporteur{results.totalResults > 1 ? 's' : ''} trouvé{results.totalResults > 1 ? 's' : ''}
            </h3>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Expire le {new Date(results.expiresAt).toLocaleString('fr-FR')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.carriers.map((carrier) => (
              <CarrierCard
                key={carrier.id}
                carrier={carrier}
                onSelect={() => onCarrierSelect?.(carrier)}
                onSendRequest={() => onSendOfferRequest?.(carrier)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant carte de transporteur
const CarrierCard: React.FC<{
  carrier: AffretCarrier;
  onSelect?: () => void;
  onSendRequest?: () => void;
}> = ({ carrier, onSelect, onSendRequest }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Logo */}
        {carrier.logo ? (
          <img
            src={carrier.logo}
            alt={carrier.name}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              backgroundColor: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              flexShrink: 0,
            }}
          >
            🚛
          </div>
        )}

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{carrier.name}</h4>
                {carrier.verified && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                    }}
                  >
                    ✓ VÉRIFIÉ
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {carrier.city}, {carrier.country}
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>
                {carrier.score}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>/100</div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              padding: '12px 0',
              borderTop: '1px solid #f3f4f6',
              borderBottom: '1px solid #f3f4f6',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Flotte</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {carrier.fleet.total} véhicules
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                Livraisons
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {carrier.totalDeliveries.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                Ponctualité
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                {carrier.onTimeRate.toFixed(0)}%
              </div>
            </div>
            {carrier.estimatedPrice && (
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                  Prix estimé
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>
                  {AffretIAService.formatPrice(carrier.estimatedPrice.amount, carrier.estimatedPrice.currency)}
                </div>
              </div>
            )}
          </div>

          {/* Spécialisations */}
          {carrier.specializations.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {carrier.specializations.slice(0, 5).map((spec, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                  }}
                >
                  {spec}
                </span>
              ))}
              {carrier.specializations.length > 5 && (
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  +{carrier.specializations.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {onSendRequest && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendRequest();
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                📧 Demander une offre
              </button>
            )}
            {onSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                👁️ Voir détails
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierSearch;
